# POST /processjson HTTP/1.1
# Host: 127.0.0.1:5000
# Content-Type: application/json
# Cache-Control: no-cache
# Postman-Token: 3b3394b3-9e37-39b2-d5dd-b9a70a0b7065
#

from flask import Flask, request, jsonify, Response
from MarketServer import MarketServer
from MarketClient import MarketClient
import json
import pandas as pd

app = Flask(__name__)


@app.route('/createUser', methods=['POST'])
def createUser():
    ms = MarketServer()
    mc = MarketClient()
    mc.generateSignatureKeys()
    newUsr = mc.createUser_client(marketServer=ms)
    return jsonify({'traderId': str(newUsr['traderId']), 'verifyKey_hex': newUsr['verifyKey'], 'signingKey_hex': mc.signingKey_hex})


@app.route('/createMarket', methods=['POST'])
def createMarket():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    ms = MarketServer()
    mc = MarketClient()
    # Retrieve keys from session and assign in client
    mc.signingKey_hex = data['signingKey_hex']
    mc.verifyKey_hex = data['verifyKey_hex']
    marketRow = pd.DataFrame(data, index=[0])[['marketRootId','marketBranchId','marketMin','marketMax','traderId']]
    # Call createMarket_client
    checks = mc.createMarket_client(marketRow=marketRow, marketServer=ms)
    return jsonify({'checks': checks,
                    'marketRootId': data['marketRootId'],
                    'marketBranchId': data['marketBranchId'],
                    'marketMin': data['marketMin'],
                    'marketMax': data['marketMax'],
                    'traderId': data['traderId']})


@app.route('/createTrade', methods=['POST'])
def createTrade():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    ms = MarketServer()
    mc = MarketClient()
    # Retrieve keys from session and assign in client
    mc.signingKey_hex = data['signingKey_hex']
    mc.verifyKey_hex = data['verifyKey_hex']
    tradeRow = pd.DataFrame(data, index=[0])[['marketRootId','marketBranchId','price','quantity','traderId']]
    # Call createMarket_client
    checks = mc.createTrade_client(tradeRow=tradeRow, marketServer=ms)
    return jsonify({'checks': str(checks),
                    'marketRootId': data['marketRootId'],
                    'marketBranchId': data['marketBranchId'],
                    'price': data['price'],
                    'quantity': data['quantity'],
                    'traderId': data['traderId']})

# View market bounds
@app.route('/viewMarketBounds', methods=['POST'])
def viewMarkets():
    # Return market bounds
    ms = MarketServer()
    mB = pd.read_sql_table('marketBounds', ms.conn)
    return jsonify(mB.loc[:,['marketRootId', 'marketBranchId',
                             'marketMin', 'marketMax']].to_json())

# View order book
@app.route('/viewOrderBook', methods=['POST'])
def viewOrderBook():
    # Return order book
    ms = MarketServer()
    oB = pd.read_sql_table('orderBook', ms.conn)
    return jsonify(oB.loc[:,['marketRootId', 'marketBranchId',
                             'price', 'quantity', 'tradeRootId', 'traderId']].to_json())


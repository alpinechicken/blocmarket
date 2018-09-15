# POST /processjson HTTP/1.1
# Host: 127.0.0.1:5000
# Content-Type: application/json
# Cache-Control: no-cache
# Postman-Token: 3b3394b3-9e37-39b2-d5dd-b9a70a0b7065
#

from flask import Flask, request, jsonify
from MarketServer import MarketServer
from MarketClient import MarketClient
import pandas as pd

app = Flask(__name__)

@app.route('/hello', methods = ['POST'])
def hello():
    return 'Hello, World!'

# process some json from request and spit back some json
@app.route('/createUser', methods=['POST'])
def createUser():
    ms = MarketServer()
    mc = MarketClient()
    mc.generateSignatureKeys()

    newUsr = mc.createUser_client(marketServer=ms)
    # Store signing key in session
    # session['signingKey_hex'] = mc.signingKey_hex
    # session['verifyKey_hex'] = mc.verifyKey_hex
    # # Store  traderId in session
    # session['traderId'] = newUsr['traderId']

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
    # Create market row
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
    # Create market row
    tradeRow = pd.DataFrame(data, index=[0])[['marketRootId','marketBranchId','price','quantity','traderId']]
    # return tradeRow.loc[0].to_json()
    # Call createTrade_client
    allTradeChk, colChk = mc.createTrade_client(tradeRow=tradeRow, marketServer=ms)
    return jsonify({'allTradeChk': allTradeChk,
                    'colChk': colChk,
                    'marketRootId': data['marketRootId'],
                    'marketBranchId': data['marketBranchId'],
                    'marketMin': data['marketMin'],
                    'marketMax': data['marketMax'],
                    'traderId': data['traderId']})
# API for bloc.

# createUser()
# createMarket(marketRootId, marketBranchId, marketMin, marketMax, traderId, signingKey_hex, verifyKey_hex)
# createTrade(marketRootId, marketBranchId, price, quantity, traderId, signingKey_hex, verifyKey_hex)
# viewMarketBounds()
# viewOrderBook()


# Example POST request using Postman:

# POST /processjson HTTP/1.1
# Host: 127.0.0.1:5000
# Content-Type: application/json
# Cache-Control: no-cache
# Postman-Token: 41b1439a-0f14-4e27-aadd-8962c43aca54
#
#
# {
#     "marketRootId": 1,
#     "marketBranchId": 1,
#     "price": 0.12345,
#     "quantity": 1,
#     "traderId": 1,
#     "signingKey_hex": "2e22f9ce7c984a93a27f126a23d62fbc50a2cb5b28ea578c8a0f4e8fba8de2e9",
#     "traderId": 4,
#     "verifyKey_hex": "d9caa2ad98e883c283e589401c67d6c091e8970f84b18fa72c82d4b4d5d6e330"
#
# }

# Example POST request from python using requests

# content = {"signingKey_hex": "42b45efe8e50d5161ad1cfaba2e3de37387109f0f6b4451b1c94a7a4f7ae5ec8",
#  "traderId": 4, "verifyKey_hex": "05e0ed41fdda6f705a1926a2803ac77189400f987feb5e7bb33cca38ae8be2da",
#  "marketRootId": 5, "marketBranchId": 1, "marketMin": 1, "marketMax":1.444}
# url = 'http://127.0.0.1:5000/createMarket'
# headers = {'content-type': 'application/json'}
# response = requests.post(url, data=json.dumps(content), headers=headers)
# pd.DataFrame(response.json(), index=[0])

from flask import Flask, request, jsonify
from bloc.BlocServer import BlocServer
from bloc.BlocClient import BlocClient
import json
import numpy as np
import pandas as pd
import traceback

application = Flask(__name__)

if __name__ == "__main__":
    application.run()


@application.route('/')
def hello_world():
    return 'Hello wurld'

@application.route('/createUser', methods=['POST', 'GET'])
def createUser():
    bs = BlocServer()
    bc = BlocClient()
    bc.generateSignatureKeys()
    newUsr = bc.createUser_client(blocServer=bs)
    bs.conn.close()
    return jsonify({'traderId': str(newUsr['traderId']),
                    'verifyKey_hex': newUsr['verifyKey'],
                    'signingKey_hex': bc.signingKey_hex})


@application.route('/createMarket', methods=['POST'])
def createMarket():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    bs = BlocServer()
    bc = BlocClient()
    # Retrieve keys from session and assign in client
    bc.signingKey_hex = data['signingKey_hex']
    bc.verifyKey_hex = data['verifyKey_hex']
    marketRow = pd.DataFrame(data, index=[0])[['marketRootId', 'marketBranchId','marketMin', 'marketMax','traderId']]
    # Call createMarket_client
    try:
        checks = bc.createMarket_client(marketRow=marketRow, blocServer=bs)
    except:
        checks = 'ProbablyASignatureError'

    bs.conn.close()
    return jsonify({'checks': str(checks),
                    'marketRootId': data['marketRootId'],
                    'marketBranchId': data['marketBranchId'],
                    'marketMin': data['marketMin'],
                    'marketMax': data['marketMax'],
                    'traderId': data['traderId']})


@application.route('/createTrade', methods=['POST'])
def createTrade():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    bs = BlocServer()
    bc = BlocClient()
    # Retrieve keys from session and assign in client
    bc.signingKey_hex = data['signingKey_hex']
    bc.verifyKey_hex = data['verifyKey_hex']
    tradeRow = pd.DataFrame(data, index=[0])[['marketId', 'price', 'quantity', 'traderId']]
    # Call createMarket_client
    try:
        checks = bc.createTrade_client(tradeRow=tradeRow, blocServer=bs)
    except Exception as err:
        checks = traceback.format_exc()


        
    bs.conn.close()
    return jsonify({'checks': str(checks),
                    'marketId': data['marketId'],
                    'price': data['price'],
                    'quantity': data['quantity'],
                    'traderId': data['traderId']})

# View market bounds
@application.route('/viewMarketBounds', methods=['POST'])
def viewMarkets():
    # Return market bounds
    bs = BlocServer()
    mB = pd.read_sql_table('marketBounds', bs.conn)
    bs.conn.close()
    return jsonify(mB.loc[:,['marketRootId', 'marketBranchId', 'marketMin', 'marketMax']].to_json())

# View order book
@application.route('/viewOrderBook', methods=['POST'])
def viewOrderBook():
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)
    bs.conn.close()
    return jsonify(oB.loc[:,['marketRootId', 'marketBranchId', 'price', 'quantity', 'traderId']].to_json())


# View order book
@application.route('/viewOpenTrades', methods=['POST'])
def viewOpenTrades():
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)

    # Open trades
    openTrades = oB[np.logical_not(oB['iMatched'])]

    # Sum orders s
    openTrades_sum = openTrades.groupby(['marketId', 'price', 'traderId'], as_index=False).agg({"quantity": "sum"})
    bs.conn.close()
    return jsonify(openTrades_sum.loc[:,['marketId', 'price', 'quantity', 'traderId']].to_json())

# View order book
@application.route('/viewMatchedTrades', methods=['POST'])
def viewMatchedTrades():
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)

    # Open trades
    openTrades = oB[np.logical_not(oB['iMatched'])]
    # Sum orders s
    openTrades_sum = openTrades.groupby(['marketId', 'price', 'traderId'], as_index=False).agg({"quantity": "sum"})
    bs.conn.close()
    return jsonify(openTrades_sum.loc[:, ['marketRootId', 'marketBranchId', 'price', 'quantity', 'traderId']].to_json())



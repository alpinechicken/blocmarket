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
from bloc.MarketServer import MarketServer
from bloc.MarketClient import MarketClient
import json
import pandas as pd

application = Flask(__name__)

if __name__ == "__main__":
    application.run()


@application.route('/')
def hello_world():
    return 'Hello wurld'

@application.route('/createUser', methods=['POST', 'GET'])
def createUser():
    ms = MarketServer()
    mc = MarketClient()
    mc.generateSignatureKeys()
    newUsr = mc.createUser_client(marketServer=ms)
    ms.conn.close()
    return jsonify({'traderId': str(newUsr['traderId']),
                    'verifyKey_hex': newUsr['verifyKey'],
                    'signingKey_hex': mc.signingKey_hex})


@application.route('/createMarket', methods=['POST'])
def createMarket():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    ms = MarketServer()
    mc = MarketClient()
    # Retrieve keys from session and assign in client
    mc.signingKey_hex = data['signingKey_hex']
    mc.verifyKey_hex = data['verifyKey_hex']
    marketRow = pd.DataFrame(data, index=[0])[['marketRootId',
                                               'marketBranchId','marketMin',
                                               'marketMax','traderId']]
    # Call createMarket_client
    try:
        checks = mc.createMarket_client(marketRow=marketRow, marketServer=ms)
    except:
        checks = 'ProbablyASignatureError'

    ms.conn.close()
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
    ms = MarketServer()
    mc = MarketClient()
    # Retrieve keys from session and assign in client
    mc.signingKey_hex = data['signingKey_hex']
    mc.verifyKey_hex = data['verifyKey_hex']
    tradeRow = pd.DataFrame(data, index=[0])[['marketRootId',
                                              'marketBranchId','price',
                                              'quantity','traderId']]
    # Call createMarket_client
    try:
        checks = mc.createTrade_client(tradeRow=tradeRow, marketServer=ms)
    except:
        checks = 'ProbablyASignatureError'
        
    ms.conn.close()
    return jsonify({'checks': str(checks),
                    'marketRootId': data['marketRootId'],
                    'marketBranchId': data['marketBranchId'],
                    'price': data['price'],
                    'quantity': data['quantity'],
                    'traderId': data['traderId']})

# View market bounds
@application.route('/viewMarketBounds', methods=['POST'])
def viewMarkets():
    # Return market bounds
    ms = MarketServer()
    mB = pd.read_sql_table('marketBounds', ms.conn)
    ms.conn.close()
    return jsonify(mB.loc[:,['marketRootId', 'marketBranchId',
                             'marketMin', 'marketMax']].to_json())

# View order book
@application.route('/viewOrderBook', methods=['POST'])
def viewOrderBook():
    # Return order book
    ms = MarketServer()
    oB = pd.read_sql_table('orderBook', ms.conn)
    ms.conn.close()
    return jsonify(oB.loc[:,['marketRootId', 'marketBranchId',
                             'price', 'quantity', 'traderId']].to_json())


# View order book
@application.route('/viewOpenTrades', methods=['POST'])
def viewOpenTrades():
    # Return order book
    ms = MarketServer()
    tS = pd.read_sql_table('tradeState', ms.conn)
    oB = pd.read_sql_table('orderBook', ms.conn)

    # Open trades
    openTrades = pd.merge(tS.loc[tS.isOpen,:], oB, how='inner')

    # Sum orders s
    openTrades_sum = openTrades.groupby(['marketRootId', 'marketBranchId', 'price', 'traderId'],
                        as_index=False).agg({"quantity": "sum"})
    ms.conn.close()
    return jsonify(openTrades_sum.loc[:,['marketRootId', 'marketBranchId',
                             'price', 'quantity', 'traderId']].to_json())

# View order book
@application.route('/viewMatchedTrades', methods=['POST'])
def viewMatchedTrades():
    # Return order book
    ms = MarketServer()
    tS = pd.read_sql_table('tradeState', ms.conn)
    oB = pd.read_sql_table('orderBook', ms.conn)

    # Open trades
    matchedTrades = oB.loc[oB['tradeBranchId'] == 3, :]
    # Sum orders s
    matchedTrades_sum = matchedTrades.groupby(['marketRootId', 'marketBranchId', 'price', 'traderId'],
                        as_index=False).agg({"quantity": "sum"})
    ms.conn.close()
    return jsonify(matchedTrades_sum.loc[:, ['marketRootId', 'marketBranchId',
                                  'price', 'quantity', 'traderId']].to_json())



# API for bloc.

# createUser()
# createMarket(marketRootId, marketBranchId, marketMin, marketMax, traderId, signingKey, verifyKey)
# createTrade(marketRootId, marketBranchId, price, quantity, traderId, signingKey, verifyKey)
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
#     "signingKey": "2e22f9ce7c984a93a27f126a23d62fbc50a2cb5b28ea578c8a0f4e8fba8de2e9",
#     "traderId": 4,
#     "verifyKey": "d9caa2ad98e883c283e589401c67d6c091e8970f84b18fa72c82d4b4d5d6e330"
#
# }

# Example POST request from python using requests

# content = {"signingKey": "42b45efe8e50d5161ad1cfaba2e3de37387109f0f6b4451b1c94a7a4f7ae5ec8",
#  "traderId": 4, "verifyKey": "05e0ed41fdda6f705a1926a2803ac77189400f987feb5e7bb33cca38ae8be2da",
#  "marketRootId": 5, "marketBranchId": 1, "marketMin": 1, "marketMax":1.444}
# url = 'http://127.0.0.1:5000/createMarket'
# headers = {'content-type': 'application/json'}
# response = requests.post(url, data=json.dumps(content), headers=headers)
# pd.DataFrame(response.json(), index=[0])

from flask import Flask, request, jsonify
from bloc.BlocServer import BlocServer
from bloc.BlocClient import BlocClient
from bloc.BlocTime import BlocTime
import json
import numpy as np
import pandas as pd
import traceback

application = Flask(__name__)

if __name__ == "__main__":
    application.run()


@application.route('/')
def hello_world():
    return 'This is an exchange API. Documentation and examples <a href="https://github.com/alpinechicken/blocmarket">here</a> and <a href="https://alpinechicken.github.io/slate">here</a> <br><br> If anything breaks, or if you need to talk, leave an <a href="https://github.com/alpinechicken/blocmarket/issues">issue</a>.'

@application.route('/createUser', methods=['POST', 'GET'])
def createUser():
    bs = BlocServer()
    bc = BlocClient()
    bc.generateSignatureKeys()
    newUsr = bc.createUser_client(blocServer=bs)
    bs.conn.close()
     
    return jsonify({'traderId': str(newUsr['traderId']),
                    'verifyKey': newUsr['verifyKey'],
                    'signingKey': bc.signingKey})


@application.route('/createMarket', methods=['POST'])
def createMarket():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    bs = BlocServer()
    bc = BlocClient()
    # Retrieve keys from session and assign in client
    bc.signingKey = data['signingKey']
    bc.verifyKey = data['verifyKey']

    if 'marketDesc' in data:
        marketRow = pd.DataFrame(data, index=[0])[['marketRootId', 'marketBranchId','marketMin', 'marketMax','traderId', 'marketDesc']]
    else:
        marketRow = pd.DataFrame(data, index=[0])[['marketRootId', 'marketBranchId','marketMin', 'marketMax','traderId']]

    # Call createMarket_client
    try:
        checks, allChecks = bc.createMarket_client(marketRow=marketRow, blocServer=bs)
    except:
        checks = traceback.format_exc()
        allChecks = {'Boned':True, 'marketId':0}

    bs.conn.close()
     
    return jsonify({'checks': str(checks),
                    'marketId': int(allChecks['marketId']),
                    'marketRootId': data['marketRootId'],
                    'marketBranchId': data['marketBranchId'],
                    'marketMin': data['marketMin'],
                    'marketMax': data['marketMax'],
                    'traderId': data['traderId'],
                    'allChecks': str(allChecks)})


@application.route('/createTrade', methods=['POST'])
def createTrade():
    #  Get request data
    data = request.get_json()
    # Instantiate market objects
    bs = BlocServer()
    bc = BlocClient()
    # Retrieve keys from session and assign in client
    bc.signingKey = data['signingKey']
    bc.verifyKey = data['verifyKey']
    tradeRow = pd.DataFrame(data, index=[0])[['marketId', 'price', 'quantity', 'traderId']]
    # Call createMarket_client
    try:
        checks, allChecks = bc.createTrade_client(tradeRow=tradeRow, blocServer=bs)
    except Exception as err:
        checks = traceback.format_exc()
        allChecks = {'Boned':True}


        
    bs.conn.close()
    if np.isnan(allChecks['tradeId']):
        allChecks['tradeId'] = 0
     
    return jsonify({'checks': str(checks),
                    'tradeId': int(allChecks['tradeId']),
                    'marketId': data['marketId'],
                    'price': data['price'],
                    'quantity': data['quantity'],
                    'traderId': data['traderId'],
                    'allChecks': str(allChecks)})

# View market bounds
@application.route('/viewMarketBounds', methods=['POST'])
def viewMarkets():
    # Return market bounds
    bs = BlocServer()
    mB = pd.read_sql_table('marketBounds', bs.conn)
    mT = pd.read_sql_table('marketTable', bs.conn)

    # Add original market descriptions
    minTimeInd  = mT.groupby('marketId').agg({'timeStampUTC': 'idxmin'})['timeStampUTC']
    originalMarketDescriptions = mT.loc[minTimeInd, ['marketId', 'marketDesc']]
    mB = mB.merge(originalMarketDescriptions, on='marketId',how='left')

    bs.conn.close()
     
    return jsonify(mB.loc[:,['marketId', 'marketRootId', 'marketBranchId', 'marketMin', 'marketMax', 'marketDesc']].to_json())

# View order book
@application.route('/viewOrderBook', methods=['POST'])
def viewOrderBook():
    #  Get request data
    data = request.get_json()
    marketId = data['marketId']
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)
    oB = oB[np.logical_not( oB['iRemoved']) & (oB['marketId']==marketId)]
    bs.conn.close()
     
    return jsonify(oB.loc[:,['tradeId','marketId', 'price', 'quantity', 'traderId', 'iMatched', 'timeStampUTC']].to_json())


# View order book
@application.route('/viewOpenTrades', methods=['POST'])
def viewOpenTrades():
    #  Get request data
    data = request.get_json()
    marketId = data['marketId']
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)

    # Open trades
    openTrades = oB[np.logical_not(oB['iMatched']) & np.logical_not(oB['iRemoved']) & (oB['marketId']==marketId)]

    bs.conn.close()
     
    return jsonify(openTrades.loc[:,['tradeId','marketId', 'price', 'quantity', 'traderId', 'timeStampUTC']].to_json())

# View order book
@application.route('/viewMatchedTrades', methods=['POST'])
def viewMatchedTrades():
    #  Get request data
    data = request.get_json()
    marketId = data['marketId']
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)

    # Open trades
    matchedTrades = oB[oB['iMatched'] & oB['marketId']==marketId]
    # Sum orders with same price by quantity
    matchedTrades_sum = matchedTrades.groupby(['marketId', 'price', 'traderId'], as_index=False).agg({"quantity": "sum"})
    bs.conn.close()
     
    return jsonify(matchedTrades_sum.loc[:, ['marketId', 'price', 'quantity', 'traderId']].to_json())


# Trade summary
@application.route('/viewTradeSummary', methods=['POST'])
def viewTradeSummary():

    data = request.get_json()
    traderId = data['traderId']
    bs = BlocServer()
    #ps = pd.read_sql_query('SELECT "price", "quantity", "traderId", "isMatched", "timeStampUTC", "marketId", "marketRootId", "marketBranchId", "marketMin", "marketMax" FROM "orderBook" INNER JOIN "marketTable" ON "orderBook.marketId" WHERE "traderId" = %s' % (str(traderId)), bs.conn)
    oB = pd.read_sql_table('orderBook', bs.conn)
    mT = pd.read_sql_table('marketBounds', bs.conn)

    tradeSummary = oB[np.logical_and(np.logical_not(oB['iRemoved']),oB['traderId'] == traderId)]

    posSummary = pd.merge(tradeSummary.loc[:,['tradeId','marketId', 'price', 'quantity', 'traderId', 'iMatched', 'timeStampUTC']], mT.loc[:, ['marketId', 'marketRootId', 'marketBranchId', 'marketMin', 'marketMax']], on='marketId', how='left')

    posSummary['marketMinOutcome'] = (posSummary['marketMin'] - posSummary['price'])*posSummary['quantity']
    posSummary['marketMaxOutcome'] = (posSummary['marketMax'] - posSummary['price'])*posSummary['quantity']

    return jsonify(posSummary.to_json())

@application.route('/viewTickHistory', methods=['POST'])
def viewTickHistory():
    #  Processed tick data with self
    data = request.get_json()
    marketId = data['marketId']
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)
    # Sort by timeStampId
    oB = oB.sort_values(by=['timeStampUTC'], ascending=True)
    # numpy this or it's super slow
    p = oB['price'].values
    q = oB['quantity'].values
    tradeId = oB['tradeId'].values
    traderId = oB['traderId'].values
    iMatched = oB['iMatched'].values
    ts = oB['timeStampUTC'].values
    xTradeId = tradeId*np.nan
    ownCross = tradeId*False
    ownTrade = tradeId*False

    for iRow in range(len(p)):
        if iMatched[iRow]:
            # Find matching trade
            mask = (p == p[iRow]) & (q == -1*q[iRow]) & (ts > ts[iRow])
            if mask.any():
                # Get first crossing trade and check if own trad
                xTdId = tradeId[mask][0]
                iOwnTrade = traderId[iRow] == traderId[mask][0]
                # Record info
                xTradeId[iRow] = xTdId
                xTradeId[mask] = tradeId[iRow]
                ownCross[mask] = iOwnTrade
                ownTrade[mask] = iOwnTrade
                ownTrade[iRow] = iOwnTrade

    oB['xTradeId'] = xTradeId
    oB['ownCross'] = ownCross
    oB['ownTrade'] = ownTrade

    # History of bids and asks excluding own crosses
    bids = oB.loc[~oB['ownCross'] & (oB['quantity'] > 0), :].sort_values(by='price', ascending=False)
    asks = oB.loc[~oB['ownCross'] & (oB['quantity'] < 0), :].sort_values(by='price', ascending=False)
    trades = oB.loc[~oB['ownTrade'] & oB['iMatched'], :].sort_values(by='price', ascending=False)

    bids['tickType'] = 'BID'
    asks['tickType'] = 'ASK'
    trades['tickType'] = 'TRADE'

    tickHistory = pd.concat([bids, asks, trades])
    tickHistory.reset_index(inplace=True)

    bs.conn.close()

    #return jsonify(tickHistory.loc[:,['tradeId','marketId', 'price', 'quantity', 'traderId', 'timeStampUTC', 'tickType']].to_json())
    return jsonify(tickHistory[['tickType','tradeId', 'xTradeId' ,'marketId', 'price', 'quantity', 'traderId', 'iMatched', 'timeStampUTC']].to_json())



# Local time server
@application.route('/getSignedUTCTimestamp')
def getSignedUTCTimestamp():
    # Get a signed timestamp
    bt = BlocTime()
    signedUTCNow = bt.signedUTCNow()

    tsOutput = {'timeStampUTC': str(signedUTCNow['timeStampUTC']),
                             'timeStampUTCSignature': str(signedUTCNow['timeStampUTCSignature']),
                             'verifyKey': signedUTCNow['verifyKey']}
    return json.dumps(tsOutput)


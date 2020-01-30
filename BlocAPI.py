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

from flask import Flask, request, jsonify, render_template, redirect, url_for, make_response
from flask_wtf import FlaskForm
from wtforms import validators, StringField, PasswordField, IntegerField, DecimalField
from wtforms.fields.html5 import EmailField
import requests
from functools import wraps
import hashlib

from bloc.BlocServer import BlocServer
from bloc.BlocClient import BlocClient
from bloc.BlocTime import BlocTime
import json
import numpy as np
import pandas as pd
import traceback
from datetime import datetime

app = Flask(__name__)

# set later as Herokou env variable
app.config['SECRET_KEY'] = "ASNDFC283RYCOIWSJFCASR73CRASFCW3HRCNIWHRCIASHC73HRC";

# Running this in the end to avoid issues
def runapp():
    if __name__ == "__main__":
        app.jinja_env.auto_reload = True
        app.config['TEMPLATES_AUTO_RELOAD'] = True
        app.run(debug=True)



"""
/////////////////////////////
//  Forms
/////////////////////////////
"""

class SignupForm(FlaskForm):
    email = EmailField('Email', [validators.DataRequired(), validators.Email()])
    password = PasswordField('Password', [validators.DataRequired()])

class CreateMarket(FlaskForm):
    #signingKey = StringField('Signing Key', [validators.DataRequired()])
    #traderId = IntegerField('Trader Id', [validators.DataRequired()])
    #verifyKey = StringField('Verify Key', [validators.DataRequired()])
    marketRootId = IntegerField("Market Root Id", [validators.DataRequired()])
    marketBranchId = IntegerField("Market Branch Id", [validators.DataRequired()])
    marketMin = StringField("Market Min", [validators.DataRequired()])
    marketMax = StringField("Market Max", [validators.DataRequired()])
    marketDesc = StringField('marketDesc', [validators.DataRequired()])


class CreateTrade(FlaskForm):
    #signingKey = StringField('Signing Key', [validators.DataRequired()])
    #traderId = IntegerField('Trader Id', [validators.DataRequired()])
    #verifyKey = StringField('Verify Key', [validators.DataRequired()])
    price = IntegerField("Price", [validators.DataRequired()])
    quantity = IntegerField("Quantity", [validators.DataRequired()])

class LoginForm(FlaskForm):
    email = EmailField('Email', [validators.DataRequired()])
    password = PasswordField('Password', [validators.DataRequired()])


"""
/////////////////////////////
//  Template ROUTES
/////////////////////////////
"""

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        # Ask for hashed password
        if auth:
            bs = BlocServer()
            aT = pd.read_sql_query('select "hashedPassword" from "authTable" where email = \'%s\' ' % (auth.username), bs.conn)
            hashedPassword = hashlib.md5(auth.password.encode('utf-8')).hexdigest()

        if auth and not aT.empty and aT.loc[0, 'hashedPassword'] == hashedPassword:
            return f(*args, **kwargs)

        return make_response('Could not verify login!', 401, {'WWW-Authenticate': 'Basic realm="Login Required"'} )

    return decorated

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/markets', methods = ['POST','GET'])
@auth_required
def markets():
    # Get user keys
    bs = BlocServer()
    aT = pd.read_sql_query('select * from "authTable" where email = \'%s\' ' % (request.authorization.username),
                           bs.conn)

    form = CreateMarket()
    createMarketResponse = 'no trade submitted.'
    if form.validate_on_submit():
        url = request.url_root + 'createMarket'
        content = {'signingKey':str(aT.loc[0,'signingKey']), 'traderId': int(aT.loc[0,'traderId']),
                   'verifyKey': str(aT.loc[0,'verifyKey']),
                   'marketRootId': int(form.marketRootId.data), 'marketBranchId': int(form.marketBranchId.data),
                   'marketMin': form.marketMin.data, 'marketMax': form.marketMax.data, 'marketDesc': json.dumps({})}
        response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
        try:
            createMarketResponse = response.json()
        except:
            createMarketResponse = 'Failed to create/modify market. One of the keys is probably invalid.'

    url = request.url_root + 'viewMarketBounds'
    response = requests.post(url, data=json.dumps({}), headers={'content-type': 'application/json'})
    marketBoundsData = json.loads(response.json())
    return render_template('markets.html', markets=marketBoundsData, form=form, createMarketResponse=createMarketResponse)

@app.route('/markets/<num>', methods = ['POST','GET'])
@auth_required
def market(num):
    # Get user keys
    bs = BlocServer()
    aT = pd.read_sql_query('select * from "authTable" where email = \'%s\' ' % (request.authorization.username),
                           bs.conn)

    tradeForm = CreateTrade()
    ctResponse = {}
    createTradeResponse = 'no market created/changed.'
    if tradeForm.validate_on_submit():

        url = request.url_root + 'createTrade'
        content = {'signingKey':str(aT.loc[0,'signingKey']), 'traderId': int(aT.loc[0,'traderId']),
                   'verifyKey': str(aT.loc[0,'verifyKey']),
                   'marketId': int(num), 'price': int(tradeForm.price.data),
                   'quantity': int(tradeForm.quantity.data)}
        response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
        try:
            createTradeResponse = response.json()
        except:
            # TODO:
            createTradeResponse = 'Failed to create trade. One of the keys is probably invalid.'

    url = request.url_root  + 'viewOrderBook'
    content = {'marketId': int(num), 'traderId': int(aT.loc[0,'traderId']), 'startTime': 0, 'endTime': 2e9*1000} # TODO: proper inputs for these
    response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
    orderbookData = json.loads(response.json())
    url = request.url_root  + 'viewOpenTrades'
    response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
    openTradesData = json.loads(response.json())
    url = request.url_root  + 'viewTradeSummary'
    response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
    tradeSummaryData = json.loads(response.json())
    url = request.url_root  + 'viewTickHistory'
    response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
    tickHistoryData = json.loads(response.json())

    return render_template('market.html', num=num, orderBookData=orderbookData, openTradesData=openTradesData,
                           tradeSummaryData=tradeSummaryData, tickHistoryData=tickHistoryData, tradeForm=tradeForm, createTradeResponse=createTradeResponse)

@app.route('/signup', methods = ['POST','GET'])
def signup():
    form = SignupForm()
    registerSuccess = False
    if form.validate_on_submit():
        # Get form data
        email = form.email.data
        password = form.password.data

        # Check if user exists
        bs = BlocServer()
        aT = pd.read_sql_query('select email from "authTable" where email = \'%s\' ' % (email), bs.conn)

        if aT.empty:
            # If user doesn't exist, make a new user
            url = request.url_root + 'createUser'
            content = {}
            response = requests.post(url, data=json.dumps(content), headers={'content-type': 'application/json'})
            newUsr = response.json()
            traderId = newUsr['traderId']
            verifyKey = newUsr['verifyKey']
            signingKey = newUsr['signingKey']

            # Insert new user into authTable
            newUsr = dict(traderId=newUsr['traderId'], verifyKey=newUsr['verifyKey'],
                          signingKey=newUsr['signingKey'], email=email,
                          hashedPassword= hashlib.md5(password.encode('utf-8')).hexdigest())
            bs.conn.execute(bs.authTable.insert(), [newUsr, ])
            bs.conn.close()
            registerSuccess = True

        else:
            registerSuccess = False


    return render_template('/accounts/signup.html', form=form, registerSuccess=registerSuccess)

@app.route('/login', methods = ['POST'])
def login():
    form = SignupForm()
    if form.validate_on_submit():
        print('is successful')

    return render_template('/accounts/login.html', form=form)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


"""
/////////////////////////////
//  API ROUTES
/////////////////////////////
"""

@app.route('/createUser', methods=['POST', 'GET'])
def createUser():
    bs = BlocServer()
    bc = BlocClient()
    bc.generateSignatureKeys()
    newUsr = bc.createUser_client(blocServer=bs)
    bs.conn.close()

    return jsonify({'traderId': str(newUsr['traderId']),
                    'verifyKey': newUsr['verifyKey'],
                    'signingKey': bc.signingKey})



@app.route('/createMarket', methods=['POST'])
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


@app.route('/createTrade', methods=['POST'])
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
      
    # Get price of proposed trade
    tPrice = pd.DataFrame(data, index=[0])['price']

    # Check market bounds 
    mI = data['marketId']
    mB = pd.read_sql_table('marketBounds', bs.conn)

    # Assign min and max market bounds
    mBmin = mB.loc[mB.marketId==mI, 'marketMin']
    mBMax = mB.loc[mB.marketId==mI, 'marketMax']
    
    # Check if tPrice is within the bounds (Didnt know how to handle the error:(...)
    while True:
        if tPrice >= mBmin and tPrice <= mBmax:
            break
        else:
            return render_template('404.html'), 404

    try:
        checks, allChecks = bc.createTrade_client(tradeRow=tradeRow, blocServer=bs)
    except Exception as err:
        # TODO: This doesnt need the full error. If it fails its probably because the sig key is invalid
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
@app.route('/viewMarketBounds', methods=['POST'])
def viewMarketBounds():
    # Return market bounds
    bs = BlocServer()
    mB = pd.read_sql_table('marketBounds', bs.conn)
    mT = pd.read_sql_table('marketTable', bs.conn)

    # Add original market descriptions
    minTimeInd  = mT.groupby('marketId').agg({'timeStampUTC': 'idxmin'})['timeStampUTC']
    originalMarketDescriptions = mT.loc[minTimeInd, ['marketId', 'marketDesc']]
    mB = mB.merge(originalMarketDescriptions, on='marketId',how='left')

    bs.conn.close()

    return jsonify(mB.loc[:,['marketId', 'marketRootId', 'marketBranchId', 'marketMin', 'marketMax', 'marketDesc']].reset_index().to_json())

# View order book
@app.route('/viewOrderBook', methods=['POST'])
def viewOrderBook():
    #  Get request data
    data = request.get_json()
    marketId = data['marketId']
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)
    oB = oB[np.logical_not( oB['iRemoved']) & (oB['marketId']==marketId)]
    bs.conn.close()

    return jsonify(oB.loc[:,['tradeId','marketId', 'price', 'quantity', 'traderId', 'iMatched', 'timeStampUTC']].reset_index().to_json())


# View order book
@app.route('/viewOpenTrades', methods=['POST'])
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

    return jsonify(openTrades.loc[:,['tradeId','marketId', 'price', 'quantity', 'traderId', 'iMatched', 'timeStampUTC']].reset_index().to_json())

# View order book
@app.route('/viewMatchedTrades', methods=['POST'])
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

    return jsonify(matchedTrades_sum.loc[:, ['marketId', 'price', 'quantity', 'traderId']].reset_index().to_json())


# Trade summary
@app.route('/viewTradeSummary', methods=['POST'])
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

    return jsonify(posSummary.reset_index().to_json())

@app.route('/viewTickHistory', methods=['POST'])
def viewTickHistory():
    #  Processed tick data with self
    data = request.get_json()
    marketId = data['marketId']
    # Start and end time expected as unix timestamps in UTC
    startTime = data['startTime']
    endTime = data['endTime']
    # Convert dates to datetime (Use UTC stamp * 1000 format so it's consistent with what comes back from datetimes)
    startTime = datetime.fromtimestamp(startTime/1000)
    endTime = datetime.fromtimestamp(endTime/1000)
    # Return order book
    bs = BlocServer()
    oB = pd.read_sql_table('orderBook', bs.conn)
    oB = oB.loc[(oB['marketId']==marketId) & (oB['timeStampUTC'] > startTime) & (oB['timeStampUTC']< endTime)]
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
                # Get first crossing trade and check if own trade
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

    tickHistory = pd.concat([bids, asks, trades]).sort_values(by='timeStampUTC')
    tickHistory.reset_index(inplace=True)

    bs.conn.close()

    return jsonify(tickHistory[['tickType','tradeId', 'xTradeId' ,'marketId', 'price', 'quantity', 'traderId', 'iMatched', 'timeStampUTC']].reset_index().to_json())

@app.route('/checkCollateral', methods=['POST'])
def checkCollateral():
    # Will work with or without price/quantity/market
    data = request.get_json()

    if 'price' in data:
        price = data['price']
        quantity = data['quantity']
        marketId = data['marketId']
        traderId = data['traderId']
    elif 'traderId' in data:
        price = []
        quantity = []
        marketId = []
        traderId = data['traderId']
    else:
        return jsonify({'colChk': 'No input'})


    bs = BlocServer()
    bs.updateOutcomeCombinations()
    colChk, collateralDetails = bs.checkCollateral(p_=price, q_=quantity, mInd_=marketId, tInd_= traderId )
    worstCollateral = np.min(collateralDetails['worstCollateral'])

    return jsonify({'colChk': str(colChk),
                    'traderId': traderId,
                    'price': price,
                    'quantity': quantity,
                    'marketId': marketId,
                    'outcomes': str(collateralDetails['outcomes']),
                    'worstCollateral': worstCollateral})

# Local time server
@app.route('/getSignedUTCTimestamp')
def getSignedUTCTimestamp():
    # Get a signed timestamp
    bt = BlocTime()
    signedUTCNow = bt.signedUTCNow()

    tsOutput = {'timeStampUTC': str(signedUTCNow['timeStampUTC']),
                             'timeStampUTCSignature': str(signedUTCNow['timeStampUTCSignature']),
                             'verifyKey': signedUTCNow['verifyKey']}
    return json.dumps(tsOutput)

# SP functions

@app.route('/createSPEvent', methods=['POST', 'GET'])
def createSPEvent():
    # Get event data and append to database
    data = request.get_json()
    bs = BlocServer()
    newEvent = pd.DataFrame({'sport': [data['sport']],
                                  'competition': [data['competition']],
                                  'event': [data['event']],
                                  'starttimestamputc': [data['starttimestamputc']]})
    newEvent.to_sql(name='spevent', con=bs.conn, if_exists='append', index=False)

    eventid = pd.read_sql_query('select max("eventid") from "spevent"', bs.conn)['max'][0]


    return jsonify({'eventid': str(eventid)})


'''
@app.route('/createSPOutcome', methods=['POST', 'GET'])
def createSPOutcome():
    # Get event data and append to database
    data = request.get_json()
    bs = BlocServer()
    #TODO: this query doesn't work. Check on JSON updates
    bs.conn.execute(
        'update "spevent" set "outcome" = \' %s \' where "eventid" = %s' % (data['outcome'], data['eventid']))

    #queryout = pd.read_sql_query('update "spevent" set "outcome" = json_build_object("0",10,"1",15) where "eventid"=%s' % (data['eventid']), bs.conn)
    return jsonify({'updated': True})
'''

@app.route('/createSPMarket', methods=['POST', 'GET'])
def createSPMarket():
    # Get market data and append to database
    data = request.get_json()
    bs = BlocServer()
    newMarket = pd.DataFrame({'eventid': [data['eventid']],
                            'markettype': [data['markettype']],
                            'runners': [data['runners']],
                            'marketparameters': [data['marketparameters']],
                            'notes': [data['notes']]})
    newMarket.to_sql(name='spmarket', con=bs.conn, if_exists='append', index=False)
    marketid = pd.read_sql_query('select max("marketid") from "spmarket"', bs.conn)['max'][0]
    return jsonify({'marketid': str(marketid)})

@app.route('/createSPRecord', methods=['POST', 'GET'])
def createSPRecord():
    # Get record data and append to database
    data = request.get_json()
    bs = BlocServer()
    newRecord = pd.DataFrame({'source': [data['source']],
                            'marketid': [data['marketid']],
                            'runnerid': [data['runnerid']],
                            'timestamputc': [data['timestamputc']],
                            'handicap': [data['handicap']],
                            'odds': [data['odds']],
                            'stake': [data['stake']],
                            'islay': [data['islay']],
                            'isplaced': [data['isplaced']],
                            'notes': [data['notes']]})
    newRecord.to_sql(name='sprecord', con=bs.conn, if_exists='append', index=False)
    recordid = pd.read_sql_query('select max("recordid") from "sprecord"', bs.conn)['max'][0]
    return jsonify({'recordid': str(recordid)})


@app.route('/createSPScore', methods=['POST', 'GET'])
def createSPScore():
    # Get record data and append to database
    data = request.get_json()
    bs = BlocServer()
    newScore = pd.DataFrame({'eventid': [data['eventid']],
                            'runnerid': [data['runnerid']],
                            'timestamputc': [data['timestamputc']],
                            'measure': [data['measure']],
                            'value': [data['value']],
                            'isfinal': [data['isfinal']]})
    newScore.to_sql(name='spscore', con=bs.conn, if_exists='append', index=False)
    scoreid = pd.read_sql_query('select max("scoreid") from "spscore"', bs.conn)['max'][0]
    return jsonify({'scoreid': str(scoreid)})

# Views
# Trade summary
@app.route('/viewSPEvents', methods=['POST', 'GET'])
def viewSPEvents():

    data = request.get_json()
    bs = BlocServer()
    spevents = pd.read_sql_table('spevent', bs.conn)
    return jsonify(spevents.to_json())

@app.route('/viewSPMarkets', methods=['POST', 'GET'])
def viewSPMarkets():

    data = request.get_json()
    bs = BlocServer()
    spmarkets = pd.read_sql_table('spmarket', bs.conn)
    return jsonify(spmarkets.to_json())

@app.route('/viewSPRecords', methods=['POST', 'GET'])
def viewSPRecords():

    data = request.get_json()
    bs = BlocServer()
    sprecords = pd.read_sql_table('sprecord', bs.conn)
    return jsonify(sprecords.to_json())

@app.route('/viewSPScores', methods=['POST', 'GET'])
def viewSPScores():

    data = request.get_json()
    bs = BlocServer()
    spscores = pd.read_sql_table('spscore', bs.conn)
    return jsonify(spscores.to_json())



runapp()

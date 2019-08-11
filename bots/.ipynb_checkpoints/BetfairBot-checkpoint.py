import requests
import json
import time
import datetime
import pytz
import numpy as np
import pandas as pd
import logging
try:
    import betfair as bf
except:
    import bots.betfair as bf
    

from IPython.core.debugger import set_trace

class BetfairBot(object):
    
    '''
    
    Basic betfair robot:
    getBetfairSessionToken(): Gets betfair session token
    getMarketDetails(): Gets market details
    getOrderBook(): Gets current order book
    getCurrentOrders(): Gets current placed orders
    setupLocalData(): Set up local blocmarket data (event, market)
    
    run():
    Each updateFrequency seconds:
    - Pulls order book for market
    - Pulls current orders 
    - Pulls market state (score, related markets, metrics etc. from sprecords and spscore)
    - Trading rule: (orderBook x marketState x currentOrders ) -> Order cancels + new orders
    - If TEST_MODE is true trades are saved to sprecords, otherwise sent to betfair.
    
    Notes:
    Current trading logic makes bid/offer relative to current bbo. Can switch out run() for something fancier.
    
    Dependencies: 
    betfair library
    
    TODO: 
    Remove API keys from defaults for production (use local keys)
    
    
    '''
    
    def __init__(self, betfairMarketId):

        # Test mode (only sends orders to local table)
        self.TEST_MODE = True
        # Mirror mode creates local bloc market with same trades

        # Bot name
        self.botName = 'marketmaker'

        # Bloc setup
        self.blocurl = 'http://127.0.0.1:5000/'
        self.blocheaders = {'content-type': 'application/json'}

        # Setup
        self.updateFrequency = 10
        self.betfairMarketId = betfairMarketId
        self.betfairAppKey = ''
        self.betfairSessionKey = ''
        self.quoteSource = 'betfair'

        # Local
        self.localEventId = ''
        self.localMarketId = ''

        # State
        self.orderBook = []
        self.marketDetails = []
        self.currentOrders =  []


    def getBetfairSessionToken(self, betfairPassword,  betfairAppKey = 'iw8UsiHCP1GSs213',  betfairUserName = 'alpinechicken', betfairAppName = 'alpinechickenbetfair'):
        # Byzantine betfair authentiation process        
        sessionKey = bf.betfairLogin(username=betfairUserName, password=betfairPassword, appName=betfairAppName)
        self.betfairSessionKey = sessionKey
        self.betfairAppKey = betfairAppKey
        bf.betfairKeepAlive(sessionKey=self.betfairSessionKey, appKey=self.betfairAppKey)


    def getMarketDetails(self):
        # Details from market catalogue
        marketCatalogue = bf.listMarketCatalogue(sessionKey=self.betfairSessionKey, appKey=self.betfairAppKey, marketIds=self.betfairMarketId)

        if marketCatalogue == []:
            print('Nothing returned')
        else:
            self.marketDetails = marketCatalogue[0]

        return self.marketDetails


    def getOrderBook(self):
        # Get current order book

        orderBook = bf.listMarketBook(sessionKey=self.betfairSessionKey, appKey=self.betfairAppKey, marketIds=self.betfairMarketId, priceProjection={"priceData":["EX_BEST_OFFERS"]})

        if orderBook == []:
            print('Nothing returned.')
        else:
            self.orderBook = orderBook[0]

        return self.orderBook

    def getCurrentOrders(self):
        # List current orders
        
        currentOrders = bf.listOrder(sessionKey=self.betfairSessionKey, appKey = self.betfairAppKey, marketIds=self.betfairMarketId)

        if currentOrders == []:
            print('Nothing returned.')
        else:
            self.currentOrders = currentOrders['currentOrders']

        return self.currentOrders

    def setupLocalData(self):
        # Sets up all local event/market. 

        if self.marketDetails == []:
            print('Market details not loaded or market is closed.')
        else:
            # Get all events and markets
            url = self.blocurl + 'viewSPEvents'
            headers = {'content-type': 'application/json'}
            content = {}
            response = requests.post(url, data=json.dumps(content), headers=headers)
            allEvents = pd.read_json(response.json())

            url = self.blocurl + 'viewSPMarkets'
            headers = {'content-type': 'application/json'}
            content = {}
            response = requests.post(url, data=json.dumps(content), headers=headers)
            allMarkets = pd.read_json(response.json())
            
            # Get loca

            # Use betfair runners
            if self.marketDetails['marketName'] == 'Handicap':
                runners = {runner['selectionId']: runner['runnerName'] for runner in self.marketDetails['runners']}
            else:
                runners = {runner['metadata']['runnerId']: runner['runnerName'] for runner in
                           self.marketDetails['runners']}

            # Market start time converted to UTC
            marketStartTime = datetime.datetime.strptime(self.marketDetails['marketStartTime'],
                                                             "%Y-%m-%dT%H:%M:%S.%fZ").astimezone(
                pytz.timezone("UTC"))
            marketStartTimeStamp = marketStartTime.timestamp()


            # Check if betfair market id exists
            allBetfairIds = [mkt['source']['betfair']['marketid'] for mkt in allMarkets['marketparameters']]
            marketExists = self.marketDetails['marketId'] in allBetfairIds
            if marketExists:
                marketid = allMarkets.loc[allMarkets['marketparameters'].apply(lambda x: x['source']['betfair']['marketid'] == self.marketDetails['marketId']), ['marketid']].marketid.item()

            # Check if event exists
            eventCheck = (allEvents['sport'] == self.marketDetails['eventType']['name']) &\
                     (allEvents['competition'] == self.marketDetails['competition']['name'])&\
                     (allEvents['starttimestamputc'] == marketStartTimeStamp*1000)
            eventExists = any(eventCheck)
            if eventExists:
                eventid = allEvents.loc[eventCheck, ['eventid']].eventid.item()


            if not self.marketDetails == []:

                if not eventExists:


                    url = self.blocurl + 'createSPEvent'
                    headers = {'content-type': 'application/json'}
                    content_makeevent = {"sport": self.marketDetails['eventType']['name'],
                                         "competition": self.marketDetails['competition']['name'],
                                         "event": json.dumps(self.marketDetails['event']),
                                         "starttimestamputc":  str(marketStartTime)}
                    # Post market
                    response = requests.post(url, data=json.dumps(content_makeevent), headers=headers)
                    eventid = response.json()['eventid']
                else:
                    print('Event already exists.')

                if not marketExists:
                    # Set up market in spmarket (for money line -> set betfairid in marketparameters json )
                    url = self.blocurl + 'createSPMarket'

                    content_makemarket = {"eventid": eventid,
                                          "markettype": self.marketDetails['description']['marketType'],
                                          "runners": json.dumps(runners),
                                          "marketparameters": json.dumps(
                                              {'source': {'betfair': {'marketid': self.marketDetails['marketId']}}}),
                                          "notes": ""}
                    # Post market
                    response = requests.post(url, data=json.dumps(content_makemarket), headers=headers)
                    marketid = response.json()['marketid']
                else:
                    print('Market already exists')

            self.localMarketId = marketid
            self.localEventId = eventid

    def run(self):

        # Market is open and in play
        # Cash out p/l loss is less than $x
        # Spread is less than 5%
        # Cancel all open order in market
        # Place bets at fixed bestBid  + x(spread), bestAsk - x(spread), 0<spread<0.5
        # Ref trade with bot name + params

        isMarketOpen = True
        isInplay = True

        # Bot parameters and signature
        spreadTightner = 0.1
        betSize = 5
        betfairWallet = 'AUS'
        botSignature = {'botName': self.botName, 'botParams': {'spreadTightner': spreadTightner, 'betSize': betSize, 'updateFrequency': self.updateFrequency}}

        # Check if the market is open
        stillQuoting=True
        self.getOrderBook()
        if not self.orderBook['status'] == 'OPEN':
            stillQuoting = False
            print('Market probably closed.')

        # Run the bot
        while stillQuoting == True:
            targetOrders = []
            time.sleep(self.updateFrequency)
            self.getOrderBook()
            self.scrapeCurrentQuote()
            for runner in self.orderBook['runners']:
                if 'lastPriceTraded' in runner:
                    lastTrade = runner['lastPriceTraded']

                bids = runner['ex']['availableToBack']
                asks = runner['ex']['availableToLay']
                allBids = [order['price'] for order in bids]
                allAsks = [order['price'] for order in asks]
                if len(allBids)>0 and len(allAsks)>0:
                    bestBid = max(allBids)
                    bestAsk = min(allAsks)
                    midPrice = (bestBid + bestAsk)/2
                    spread = bestAsk - bestBid
                    spreadPrct = spread/bestBid
                    # Create target (bet size standardized by mid odds)
                    targetBid = {'selectionId': runner['selectionId'], 'side': 'BACK', 'handicap': runner['handicap'],\
                                 'price': bestBid + spreadTightner*spread, 'size': betSize/midPrice}
                    targetAsk = {'selectionId': runner['selectionId'], 'side': 'LAY', 'handicap': runner['handicap'],\
                                 'price': bestAsk - spreadTightner*spread, 'size':betSize/midPrice}

                    targetOrders.append(targetBid)
                    targetOrders.append(targetAsk)

                if not self.TEST_MODE:
                    # Cancel all orders in market
                    resp = bf.cancelOrder(self.betfairSessionKey, self.betfairAppKey, marketId=self.orderBook['marketId'])
                    # Create all the new orders
                    for order in targetOrders:
                        resp = bf.placeOrder(self.betfairSessionKey, self.betfairAppKey, marketId=self.orderBook['marketId'],\
                                             selectionId=order['selectionId'], orderType='LIMIT',\
                                             side=order['side'], wallet=betfairWallet, price=order['price'],\
                                             size= order['size'], persistenceType='PERSIST')
                else:
                    # Record order in local 
                    tUTC = datetime.datetime.utcnow()
                    url = self.blocurl + 'createSPRecord'
                    headers = {'content-type': 'application/json'}
                    for order in targetOrders:
                        content_makerecord = {"source": self.quoteSource,
                                              "marketid": self.localMarketId,
                                              "runnerid": order['selectionId'],
                                              "timestamputc": str(tUTC),
                                              "handicap": order['handicap'],
                                              "odds": order['price'],
                                              "stake": order['size'],
                                              "islay": order['side']=='LAY',
                                              "isplaced": True,
                                              "notes": json.dumps(botSignature)}
                        # Post market
                        response = requests.post(url, data=json.dumps(content_makerecord), headers=headers)


            if not self.orderBook['status'] == 'OPEN':
                stillQuoting = False

        return 'I\'m finished!!!'


    def scrapeCurrentQuote(self):
        # Scrape current quote


        tUTC = datetime.datetime.utcnow()
        url = self.blocurl + 'createSPRecord'
        headers = {'content-type': 'application/json'}

        for runner in self.orderBook['runners']:
            if 'handicap' in runner:
                handicap = runner['handicap']
            else:
                handicap = []

            for lay in runner['ex']['availableToLay']:
                content_makerecord = {"source": self.quoteSource,
                                      "marketid": self.localMarketId,
                                      "runnerid": runner['selectionId'],
                                      "timestamputc": str(tUTC),
                                      "handicap": handicap,
                                      "odds": lay['price'],
                                      "stake": lay['size'],
                                      "islay": True,
                                      "isplaced": False,
                                      "notes": ""}
                # Post market
                response = requests.post(url, data=json.dumps(content_makerecord), headers=headers)

            for bid in runner['ex']['availableToBack']:
                content_makerecord = {"source": self.quoteSource,
                                      "marketid": self.localMarketId,
                                      "runnerid": runner['selectionId'],
                                      "timestamputc": str(tUTC),
                                      "handicap": handicap,
                                      "odds": bid['price'],
                                      "stake": bid['size'],
                                      "islay": False,
                                      "isplaced": False,
                                      "notes": ""}
                # Post market
                response = requests.post(url, data=json.dumps(content_makerecord), headers=headers)



'''
appKey = 'iw8UsiHCP1GSs213'
#marketId = '1.159518463' # handicap
marketId = '1.160853913' # match

# Set up bot
bot = BetfairBot(betfairMarketId=marketId)
# Get SOID token
bot.getBetfairSessionToken(betfairPassword='e', betfairAppKey = appKey)
# Get betfair market details
bot.getMarketDetails()
# Get current order book
bot.getOrderBook()
# Get current orders
bot.getCurrentOrders()
# Add event and market to local tables if not there already
bot.setupLocalData()
# Scrape current quotes in order book
bot.scrapeCurrentQuote()
# Run the bot
bot.run()

'''

# TODO
# Function to setup spevent/spmarket from marketDetails (do nothing if already set up) DONE
# Function to scrape quotes (pass orderBook to sprecord) DONE
# Function to place/cancel orders (live/test)
# getCurrentOrders from sprecord NOT NECESSARY
# function to calculate p/l and cashout NOT NECESSARY
# Something to calculate p/l from orders (and determine which were hit)
# Do something about rounding on the orders. Make sure no unexpected up/down rounding in placeOrders
# Some analysis on output of '1.160350460' live odds
# Weekend 27/28 July 2019 goals:
# 1. Calculate p/l from saved live strategy. Basic analytics.
# 2. Run bot from remote Jupyter session
# 3. Document setup and running
# 4. Tag trades in betfair
# 5. Write bot that skews bid offer and hits anyone who comes in over (using arb bounds from related market)
# 6. Spec some other basic bot types
# 7. Package up betfair functions and import
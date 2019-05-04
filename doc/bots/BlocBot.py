import requests
import json
import time
import datetime
import pytz
import numpy as np
import pandas as pd
import logging

class BlocBot(object):
    
    # Basic price making bot using external quote source
    
    def __init__(self):
        # Price making parameters
        self.multiplier = 1000 # Multiply quote units
        self.spread = 0.01
        self.updateFrequencySeconds = 180
        # Bloc user
        self.verifyKey = []
        self.signingKey = []    
        self.traderId = []
        # Target market
        self.marketId = []
        # Bloc setup
        self.blocurl = 'http://127.0.0.1:7000/'
        self.blocheaders = {'content-type': 'application/json'}
        # Source setup
        self.quoteSource = 'alphavantage'

        # Just betfair things. Betfair needs new token for each session.
        # The appKey can be for demo (delayed) or live.
        # Be careful with the live key.
        self.betfairMarketId = '1.157292080'
        self.betfairAppKey = ''
        self.betfairSessionToken = ''

    def getBetfairSessionToken(self, betfairAppKey, betfairPassword):
        # Byzantine betfair authentiation process
        url = 'https://identitysso.betfair.com/api/login/'
        headers = {'X-Application': 'alpinechickenbetfair', 'Accept': 'application/json'}
        content = 'username=alpinechicken&password=' + betfairPassword
        response = requests.post(url, params=content, headers=headers)
        self.betfairSessionToken = response.json()['token']
        self.betfairAppKey = betfairAppKey


    def getQuote(self):
        # Get quote from source and scale with mulitplier
        # In:
        # Out: {'Bid': 9,
        #     'Ask': 11,
        #     'Trade': 10,
        #     'TimeStampUTC': datetime.datetime(2019, 3, 23, 1, 17, 13, tzinfo=<UTC>)}

        if self.quoteSource == 'alphavantage':
            # setup for alphavantage
            sourceurl = 'https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=VVOJSV9CUU9JRCSE'
            sourceheaders = {}
            response = requests.get(sourceurl, headers=sourceheaders)
            qt = float(response.json()['Realtime Currency Exchange Rate']['5. Exchange Rate'])*self.multiplier
            t = response.json()['Realtime Currency Exchange Rate']['6. Last Refreshed']
            tdt = datetime.datetime.strptime(t, '%Y-%m-%d %H:%M:%S')
            tUTC = pytz.utc.localize(tdt)
            quote = {'Bid': [], 'Ask': [], 'Trade': qt*self.multiplier, 'TimeStampUTC': tUTC}

        if self.quoteSource == 'betfair':
            betfairurl = "https://api.betfair.com/exchange/betting/json-rpc/v1"
            betfairheaders = {'X-Application': self.betfairAppKey, 'X-Authentication': self.betfairSessionToken,
                              'content-type': 'application/json'}

            market_book_req = '{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketBook", "params": {"marketIds":["' + self.betfairMarketId + '"],"priceProjection":{"priceData":["EX_BEST_OFFERS"]}}, "id": 1}'
            response = requests.get(betfairurl, data=market_book_req, headers=betfairheaders)

            bids = pd.DataFrame(response.json()['result'][0]['runners'][0]['ex']['availableToBack'])
            asks = pd.DataFrame(response.json()['result'][0]['runners'][0]['ex']['availableToLay'])
            tUTC = datetime.datetime.utcnow()
            if 'price' in bids.columns:
                maxBid = np.max(bids['price'])
                myAsk = 1/maxBid
            else:
                myAsk = []

            if 'price' in asks.columns:
                minAsk = np.min(asks['price'])
                myBid = 1/minAsk
            else:
                myBid = []

            if not myBid and not myAsk:
                myTrade = []
            else:
                myTrade = (myBid + myAsk)/2
            # Use mid as traded
            quote = {'Bid': myBid * self.multiplier, 'Ask': myAsk * self.multiplier, 'Trade': myTrade *self.multiplier, 'TimeStampUTC': tUTC}
        return quote
    
    def postQuote(self, p, q):
        # Create a trade
        # In: postQuote(0.43, -4)
        # Out: <Standard response from createTrade()>
        tradeurl = self.blocurl+'createTrade'

        content_maketrade = {"signingKey": self.signingKey,
                             "traderId": self.traderId,
                             "verifyKey": self.verifyKey,
                             "marketId": int(self.marketId),
                             "price":p,
                             "quantity": q}
        response = requests.post(tradeurl, data=json.dumps(content_maketrade), headers=self.blocheaders)
        return response.json()

    def getTradeSummary(self):
        # In: postQuote(0.43, -4)
        # Out: <Standard response from viewTradeSummary()>
        # Get trade summary from bloc market
        url = self.blocurl+'viewTradeSummary'
        content = {"traderId": self.traderId}
        response = requests.post(url, data=json.dumps(content), headers=self.blocheaders)
        return response.json()
        
    def streamQuote(self):
        # Stream a quote bid/ask from source
        logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO, filename='botlog.log')
        logging.info('[Bot starting quote stream]: ' + json.dumps(vars(self)))
        qt = self.getQuote()
        prevQuote = qt['Trade']
        stillQuoting = True
        while stillQuoting:
            # Get a quote
            try:
                qt = self.getQuote()
                quotePrice = qt['Trade']
                logging.info('[Quote]: ' + str(quotePrice))
            except Exception as e:
                logging.error('Exception trying getQuote()', exc_info=True)

            # Update market if quote has changed
            if prevQuote == quotePrice:
                time.sleep(self.updateFrequencySeconds)
            else:          
                bidPrice = quotePrice*(1-self.spread)
                askPrice = quotePrice*(1+self.spread)
                # Make quote
                cbid = self.postQuote(bidPrice, 1)
                cask = self.postQuote(askPrice, -1)
                # Record trade numbers
                bidTdId = cbid['tradeId']
                askTdId = cask['tradeId']
                time.sleep(self.updateFrequencySeconds)

                ts = pd.read_json(self.getTradeSummary())
                
                # Remove bids and asks if not already matched
                if bidTdId not in ts[ts['iMatched']]:
                    self.postQuote(bidPrice, -1)
                    logging.info('[Bid]: ' + str(bidPrice))
                if askTdId not in ts[ts['iMatched']]:
                    self.postQuote(askPrice, 1)
                    logging.info('[Ask]: ' + str(askPrice))
                
                # Check if trades still being accepted 
                if (cbid['checks'] == 'False') or (cask['checks'] == 'False'):
                    stillQuoting = False
                else:
                    prevQuote = quotePrice
                    prevBidPrice = bidPrice
                    prevAskPrice = askPrice
                    msg= '[Within cells interlinked]: ' + str(quotePrice)
                    print(msg)

        # Return output if quote fails
        if not stillQuoting:
            logging.info('[Bot stopping quote stream]: ' + ', Bot def:' + json.dumps(vars(self)))
            logging.info('[You\'re pretty far off baseline]: Bid checks:' + cbid['allChecks'] +
                         ',  Ask checks: ' +  cask['allChecks'] )
            return cask['allChecks']
                

                
    
import requests
import json
import time
import datetime
import pytz
import numpy as np
import pandas as pd
import logging
from IPython.core.debugger import set_trace

class BlocBot(object):
    
    # Basic price making bot using external source
    
    def __init__(self):
        # Price making parameters
        self.multiplier = 10000
        self.spread = 0.01
        self.updateFrequencySeconds = 180
        # Bloc user
        self.verifyKey = []
        self.signingKey = []    
        self.traderId = []
        # Target market
        self.marketId = []
        # Bloc setup
        self.blocurl = 'http://127.0.0.1:5000/'
        self.blocheaders = {'content-type': 'application/json'}
        # Source setup
        self.quoteSource = 'alphavantage'

        # Just betfair things. Betfair needs new token for each session.
        # The appKey can be for demo (delayed) or live.
        # Be careful with the live key.
        self.betfairMarketId = ''
        self.betfairAppKey = ''
        self.betfairSessionToken = ''
        
        # spmarket
        self.spmarketid = ''

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
            qt = float(response.json()['Realtime Currency Exchange Rate']['5. Exchange Rate'])
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
        return quote, bids, asks
    
    def scrapeQuote(self, bid, ask):
        # Post best bid and ask as sprecord from something with an attached spmarket
        
        # TODO: Give expicit datestr format
        
        tUTC = datetime.datetime.utcnow()
        url = self.blocurl + 'createSPRecord'
        headers = {'content-type': 'application/json'}

        content_makerecord = {"source": self.quoteSource,
                                "marketid": self.spmarketid,
                                "timestamputc": str(tUTC),
                                "odds": ask.loc[0, 'price'],
                                "stake": ask.loc[0, 'size'], 
                                "islay": False,
                                "isplaced": False,
                                "notes": ""}
        # Post market
        response = requests.post(url, data=json.dumps(content_makerecord), headers=headers)        

        content_makerecord = {"source": self.quoteSource,
                                "marketid": self.spmarketid,
                                "timestamputc": str(tUTC),
                                "odds": bid.loc[0, 'price'],
                                "stake": bid.loc[0, 'size'], 
                                "islay": True,
                                "isplaced": False,
                                "notes": ""}
        # Post market
        response = requests.post(url, data=json.dumps(content_makerecord), headers=headers)     
    
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
        
    def streamQuote(self, scrapeOdds=True, postQuotes=True):
        # Stream a quote bid/ask from source. Set scrapeOdds=True to write streaming odds to spmarket and
        # postQuotes=True to post quotes to orderBook.
        # to

        '''
        :param scrapeOdds:
        :param postQuotes:
        :return:
        '''

        logging.basicConfig(format='%(asctime)s - %(message)s', level=logging.INFO, filename='botlog.log')
        logging.info('[Bot starting quote stream]: ' + json.dumps(vars(self)))
        #qt = self.getQuote()
        prevQuote = 0
        quotePrice = 0
        ts = 0
        stillQuoting = True
        while stillQuoting:
            # Get a quote
            try:
                qt, bids, asks = self.getQuote()
                quotePrice = qt['Trade']
                logging.info('[Quote]: ' + str(quotePrice))
            except Exception as e:
                logging.error('Exception trying getQuote().', exc_info=True)
            
            try:
                bestAsk = asks[asks.price==min(asks.price)].reset_index()
                bestBid = bids[bids.price==max(bids.price)].reset_index()
            except Exception as e:
                logging.error('No price field for bids/asks.')
                
            #set_trace()

            # Update market if quote has changed
            if prevQuote == quotePrice:
                msg= '[Within cells interlinked]: No price change.' 
                print(msg)   
                time.sleep(self.updateFrequencySeconds)             
            else:
                if prevQuote!=0 and postQuotes:
                    # Remove bids and asks if not already matched
                    if bidTdId not in ts[ts['iMatched']]:
                        self.postQuote(bidPrice, -1)
                        logging.info('[Bid]: ' + str(bidPrice))
                    if askTdId not in ts[ts['iMatched']]:
                        self.postQuote(askPrice, 1)
                        logging.info('[Ask]: ' + str(askPrice))

                bidPrice = quotePrice*(1-self.spread)
                askPrice = quotePrice*(1+self.spread)
                # Make quote
                if postQuotes:
                    cbid = self.postQuote(bidPrice, 1)
                    cask = self.postQuote(askPrice, -1)
                # Record trade numbers
                bidTdId = cbid['tradeId']
                askTdId = cask['tradeId']
                
                # Scrape sp record
                if scrapeOdds:
                    #set_trace()
                    self.scrapeQuote(bestBid, bestAsk)
                
                time.sleep(self.updateFrequencySeconds)

                ts = pd.read_json(self.getTradeSummary())

                
                # Check if trades still being accepted 
                if (cbid['checks'] == 'False') or (cask['checks'] == 'False'):
                    stillQuoting = False
                    msg = '[Within cells interlinked]: Quote stream stopped.'
                    print(msg)
                else:
                    prevQuote = quotePrice
                    prevBidPrice = bidPrice
                    prevAskPrice = askPrice
                    msg= '[Within cells interlinked]: quote ' + str(quotePrice)
                    print(msg)

        # Return output if quote fails
        if not stillQuoting:
            logging.info('[Bot stopping quote stream]: ' + ', Bot def:' + json.dumps(vars(self)))
            logging.info('[You\'re pretty far off baseline]: Bid checks:' + cbid['allChecks'] +
                         ',  Ask checks: ' +  cask['allChecks'] )
            return cask['allChecks']
                

                

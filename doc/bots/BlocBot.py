import requests
import json
import numpy as np
import pandas as pd
import time
import datetime
import pytz
import pandas as pd

class BlocBot(object):
    
    # Price making bot using external source
    
    def __init__(self):
        # Price making parameters
        self.spread = 0.01
        self.updateFrequencySeconds = 180
        # Bloc user
        self.verifyKey = []
        self.signingKey = []    
        self.traderId = []
        # Bloc market info
        self.marketRootId = []
        self.marketBranchId = []
        self.marketId = []
        self.marketMin = 2500
        self.marketMax = 4500
        self.marketDesc = 'BTC'       
        # Bloc setup
        self.blocurl = 'http://127.0.0.1:7000/'
        self.blocheaders = {'content-type': 'application/json'}
        # Source setup
        self.quoteSource = 'alphavantage'
    
    # Setup functions:
    # setupUser - make a bloc user
    # setupMarket - make a bloc market
        
    def setupUser(self):
        # Create a new bloc user 
        url = self.blocurl +'createUser'
        headers = self.blocheaders
        content = {}
        response = requests.post(url, data=json.dumps(content), headers=headers)
        self.signingKey = response.json()['signingKey']
        self.verifyKey = response.json()['verifyKey']
        self.traderId = int(response.json()['traderId'])
        return response
    
    def setupMarket(self):
        # Set up a bloc market
        
        # Find next spare market
        url = self.blocurl+'viewMarketBounds'
        content = {}
        response = requests.post(url, data=json.dumps(content), headers=self.blocheaders)
        mBounds = pd.read_json(response.json())
        self.marketRootId = max(mBounds['marketRootId']) + 1
        self.marketBranchId = 1
        
        # Create/update market
        url = self.blocurl + 'createMarket'
        content_makemarket = {"signingKey": self.signingKey,
                        "traderId": self.traderId, 
                        "verifyKey": self.verifyKey,
                        "marketRootId": self.marketRootId, 
                        "marketBranchId": self.marketBranchId, 
                        "marketMin": self.marketMin,
                        "marketMax": self.marketMax,
                        "marketDesc": self.marketDesc}
        
        # Post market
        response = requests.post(url, data=json.dumps(content_makemarket), headers=self.blocheaders)
        # Get marketId from response
        self.marketId = response.json()['marketId']
        return response
        
                
    def getQuote(self):
        # Get quote from source 
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
            q = float(response.json()['Realtime Currency Exchange Rate']['5. Exchange Rate'])
            t = response.json()['Realtime Currency Exchange Rate']['6. Last Refreshed']
            tdt = datetime.datetime.strptime(t, '%Y-%m-%d %H:%M:%S')
            tUTC = pytz.utc.localize(tdt)
            quote = {'Bid': [], 'Ask': [], 'Trade': q, 'TimeStampUTC': tUTC}
        
        return quote
    
    def postQuote(self, p, q):
        # Create a trade
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
        # Get trade summary from bloc market
        url = self.blocurl+'viewTradeSummary'
        content = {"traderId": self.traderId}
        response = requests.post(url, data=json.dumps(content), headers=self.blocheaders)
        return response.json()
        
    def streamQuote(self):
        # Stream a quote bid/ask from source
        
        qt = self.getQuote()
        prevQuote = qt['Trade']
        stillQuoting = True
        while stillQuoting:
            try:
                qt = self.getQuote()
            except:
                #logging
                pass
                    
            quotePrice = qt['Trade']
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
                
                # Remove bids if not already matched
                if bidTdId not in ts[ts['iMatched']]:
                    self.postQuote(bidPrice, -1)
                
                if askTdId not in ts[ts['iMatched']]:
                    self.postQuote(askPrice, 1)
                
                # Check if trades still being accepted 
                if (cbid['checks'] == 'False') or (cask['checks'] == 'False'):
                    stillQuoting = False
                else:
                    prevQuote = quotePrice
                    print('Within cells interlinked: ' + str(quotePrice))
                    
                
        if not stillQuoting:
            print('You\'re pretty far off baseline: ' +  rask['allChecks'])
            return True
                

                
    
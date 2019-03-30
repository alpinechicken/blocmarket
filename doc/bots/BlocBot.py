import requests
import json
import time
import datetime
import pytz
import pandas as pd
import logging

class BlocBot(object):
    
    # Basic price making bot using external quote source
    
    def __init__(self):
        # Price making parameters
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
                    msg= '[Within cells interlinked]: ' + str(quotePrice)
                    print(msg)

        # Return output if quote fails
        if not stillQuoting:
            logging.info('[Bot stopping quote stream]: ' + ', Bot def:' + json.dumps(vars(self)))
            logging.info('[You\'re pretty far off baseline]: Bid checks:' + cbid['allChecks'] +
                         ',  Ask checks: ' +  cask['allChecks'] )
            return cask['allChecks']
                

                
    
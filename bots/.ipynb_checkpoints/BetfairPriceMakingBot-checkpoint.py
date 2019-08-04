from BlocBot import BlocBot
import requests
import json
import pandas as pd

'''
Extends BlocBot. 

BetfairPriceMakingBot(marketId=10) 
>looks for bloc market 10 in marketTable
>recover betfair id (using the linked spmarketid (via marketdesc)
'''

class BetfairPriceMakingBot(BlocBot):

    def __init__(self, marketId, runnerId=0, blocUrl='https://blocmarket.herokuapp.com/'):
        # Initialise BlocBot
        super().__init__()
        self.marketId = marketId
        self.betfairRunnerId = runnerId
        self.blocUrl = blocUrl
        # Get market description (expects)

        url = self.blocUrl +'viewMarketBounds'
        content = {}
        headers = {'content-type': 'application/json'}
        response = requests.post(url, data=json.dumps(content), headers=headers)
        marketList = pd.read_json(response.json())
        mktDesc = marketList.loc[marketList['marketId']==marketId,'marketDesc'].reset_index(drop=True)[0]

        # Extract sp market id
        try:
            self.spmarketid = int(json.loads(mktDesc)['spmarket']['marketid'])
        except:
            print('sp market not found')
        # Get sp markets
        url = self.blocUrl + 'viewSPMarkets'
        headers = {'content-type': 'application/json'}
        content = {}
        response = requests.post(url, data=json.dumps(content), headers=headers)
        spmarkets = pd.read_json(response.json())

        try:
            self.betfairMarketId = spmarkets[spmarkets.marketid== self.spmarketid]['marketparameters'].reset_index(drop=True)[0]['source']['betfair']['marketid']
            self.quoteSource = 'betfair'
        except:
            print('Betfair market source not found for spmarket ' + str(self.spmarketid))


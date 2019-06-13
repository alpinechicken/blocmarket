from BlocBot import BlocBot
import requests
import json
import pandas as pd

class BetfairPriceMakingBot(BlocBot):

    def __init__(self, marketId):
        # Initialise BlocBot
        super().__init__()
        self.marketId = marketId
        self.blocUrl = 'https://blocmarket.herokuapp.com/'        
        # Get market description (expects)
        url = self.blocUrl +'viewMarketBounds'
        content = {}
        headers = {'content-type': 'application/json'}
        response = requests.post(url, data=json.dumps(content), headers=headers)
        marketList = pd.read_json(response.json())
        mktDesc = marketList.loc[marketList['marketId']==marketId,'marketDesc'].reset_index(drop=True)[0]
        
        mktDesc = mktDesc.split()
        if len(mktDesc) != 7:
            display('Cannot parse market decription')
            return
        else:
            self.quoteSource = mktDesc[5]
            self.betfairMarketId = mktDesc[6]

    '''   
    def createUser(self):
        # Create a new user
        url = self.blocUrl +'createUser'
        content = {}
        headers = {'content-type': 'application/json'}
        response = requests.post(url, data=json.dumps(content))
        self.verifyKey = response.json()['verifyKey']
        self.signingKey = response.json()['signingKey']
        self.traderId = response.json()['traderId']
    '''
    

        
        

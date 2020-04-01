import numpy as np
import pandas as pd
from game.DataStore import DStore
import datetime
import json
import functools
import requests

# New market objects for simulation/game

class ConstantProductMarket:
    # Constant product market

    def __init__(self, id=[],uid=[]):

        # Static
        self.TX_FEE = 0.0

        # Data store
        self.dstore = DStore()
        self.store = pd.DataFrame()

        # Id
        self.id = id
        # read state
        self.read()

        # Current timestamp
        self.utc = datetime.datetime.utcnow().timestamp()
        
        # Output
        self.dRa = []
        self.dRb = []
        self.shareId = []

        # Write state data
        self.write(msg='init(id=%s, uid=%s)'%(id, uid))

    
    def swap(self, dRa, dRb, uid):
        self = self.read()
        assert((dRa==0 or dRb==0) and not (dRa==0 and dRb==0))
        if (dRa == 0):
            dRa = self.Rb*self.Ra/(self.Rb + dRb*(1-self.TX_FEE)) - self.Ra
        elif dRb == 0:
            dRb = (self.Rb*self.Ra/(self.Ra + dRa) - self.Rb)/(1-self.TX_FEE)
        # Add changes to pool
        self.Ra = self.Ra + dRa
        self.Rb = self.Rb + dRb
        # References (changes for swap user)
        self.dRa = dRa
        self.dRb = dRb*(1-self.TX_FEE) # Swap receives gamma*dRb
        # Write state
        self.write(msg= 'swap(dRa=%s,dRb=%s, uid=%s)'%(dRa, dRb*(1-self.TX_FEE), uid))
        return self

    def swap_quote(self, dRa, dRb):
        self = self.read()
        assert((dRa==0 or dRb==0) and not (dRa==0 and dRb==0))
        if (dRa == 0):
            dRa = self.Rb*self.Ra/(self.Rb + dRb*(1-self.TX_FEE)) - self.Ra
        elif dRb == 0:
            dRb = (self.Rb*self.Ra/(self.Ra + dRa) - self.Rb)/(1-self.TX_FEE)
        # References (changes for swap user)
        self.dRa = dRa
        self.dRb = dRb*(1-self.TX_FEE) # Swap receives gamma*dRb
        return self
        
    def subscribe(self, dRa, dRb, uid):
        self = self.read()
        if self.Ra !=0:
            assert(dRa/dRb == self.Ra/self.Rb)
        # Share is proportional to current pool
        dS = dRb/(self.Rb + dRb)
        # Dilute existing shares
        self.Rs = self.Rs*self.Rb/(self.Rb + dRb)
        # Append new share       
        self.Rs = np.append(self.Rs, dS)
        shareId = len(self.Rs)-1
        # New pool
        self.Ra = self.Ra + dRa
        self.Rb = self.Rb + dRb
        # References
        self.dRa = dRa
        self.dRb = dRb
        self.shareId = shareId
        # Write state
        self.write(msg = 'subscribe(dRa=%s,dRb=%s,uid=%s)'%(dRa, dRb, uid))
        return self
               
    def redeem(self,dS, shareId, uid):
        self = self.read()
        assert(self.Rs[shareId] >= dS)
        dRa = dS*self.Ra
        dRb = dS*self.Rb
        self.Rs[shareId] = self.Rs[shareId] - dS
        # Undilute remaining shares
        diluteProp = self.Rb /(self.Rb - dRb)
        self.Rs = self.Rs*  diluteProp
        # Redilute share
        self.Rs[shareId] = self.Rs[shareId]/diluteProp
        # Subtract changes from pool
        self.Ra = self.Ra - dRa
        self.Rb = self.Rb - dRb
        # References
        self.dRa = dRa
        self.dRb = dRb
        self.shareId = shareId
        # Write state
        self.write(msg='redeem(dS=%s, shareId=%sm uid=%s)'%(dS, shareId, uid))
        return self

    def write(self, msg=[]):
        # Write state to database
        state = {'Ra': self.Ra, 'Rb': self.Rb, 'Rs': self.Rs.tolist()}
        newStore = pd.DataFrame({'object': ['ConstantProductMarket'],
                                  'id': [self.id],
                                  'utc': [datetime.datetime.utcnow().timestamp()],
                                  'msg': [msg],
                                  'state': [json.dumps(state)]})
        newStore.to_sql(name='store', con=self.dstore.conn, if_exists='append', index=False)
        return True

    def read(self):
        # Read existing state
        self.store = pd.read_sql_table('store', con=self.dstore.conn)
        myState = self.store.loc[(self.store['object'] == 'ConstantProductMarket') &
                                 (self.store['id'] == self.id), :]
        if myState.empty:
            # Initialize state
            self.Ra = 0
            self.Rb = 0
            self.Rs = np.array([])
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            self.Ra = recentState['Ra']
            self.Rb = recentState['Rb']
            self.Rs = np.array(recentState['Rs'])
        return self

class MarginPosition:
    # Margin position.
    
    def __init__(self, cpmid, Ra_limit, id=[],uid=[]):
        # Initialize a specific MP with dRa
        # Static
        self.MI = 1.5
        self.MV = 1.2
        self.r = 0.0
        self.T = datetime.datetime(2021, 1, 1).timestamp()
        # State
        self.DT = 1
        self.Rb = 0
        self.Ra = 0
        self.Ra_limit = Ra_limit
        self.utc = datetime.datetime.utcnow().timestamp()
        self.T0 = 0
        self.locked = False
        self.cpm = ConstantProductMarket(id=cpmid)
        self.cpmid = cpmid


        # Data store
        self.dstore = DStore()
        self.store = pd.DataFrame()

        # Id
        self.id = id
        # read state
        self.read()

        # References
        self.dRa = 0
        self.dRb = 0

        # Write state data
        self.write(msg='init(cpmid= %s, Ra_limit = %s, id=%s, uid=%s)'%(cpmid, Ra_limit, id, uid))
               
    def subscribe(self, dRb, uid):
        assert dRb > 0 , 'Need positive collateral'
        assert not self.locked, 'Box is locked'
        # Update state
        self.read()
        # Get reference rate from cpm
        mr = self.cpm.Rb/self.cpm.Ra
        dRa_subscribe = dRb*self.DT/(mr*self.MI)

        assert dRa_subscribe <= self.Ra_limit, 'Not enough Ra locked'
        # Deltas
        self.Ra = self.Ra + dRa_subscribe
        self.Rb = self.Rb + dRb
        # Lock after subscription
        self.T0 = datetime.datetime.utcnow().timestamp()
        self.locked = True
        # Write state
        self.write(msg = 'subscribe(dRb=%s,uid=%s)'%(dRb, uid))
        return self

        
    def redeem(self, dRa, uid):
        assert dRa>0, 'Need positive redemption amount'
        # Update state
        self = self.process()
        Ca = self.Ra / self.DT
        dRb_redeem = self.Rb*dRa/Ca
        assert dRb_redeem > self.dRb, 'Can\'t redeem more than collateral'
        self.Ra = self.Ra - dRa*self.DT
        self.Rb = self.Rb - dRb_redeem
        # Write state
        self.write(msg = 'redeem(dRa=%s,uid=%s)'%(dRa, uid))
        return self
        
    
    def process(self):
        assert self.Rb>0, 'No collateral locked.'
        # Change time
        self.utc = datetime.datetime.utcnow().timestamp()
        # Update discount factor (using seconds from utc timestamps)
        self.DT = np.exp(-self.r * (self.utc-self.T0) / (365.25 * 24 * 60 * 60))
        # Liquidation quote for full collateral
        if self.Rb>0:
            self.cpm = self.cpm.swap_quote(0, self.Rb)
            mrt = -self.cpm.dRb/self.cpm.dRa
        else:
            mrt =self.cpm.Rb / self.cpm.Ra

        # Liquidation value
        L = self.Rb/mrt
        # Collateral requirement
        Cb = self.Ra*mrt/self.DT
        Ca = self.Ra/self.DT
        # Variation margin
        V = Ca*self.MV        
        # Indices
        ID = L < Ca
        IM = (L < V) and not ID
        IT = (self.utc >= self.T) and not (IM or ID)
        IL = ID or IM or IT        
        # Deltas
        dRb_liquidate = IL*(ID*self.Rb + IM*Cb + IT*Cb)
        dRb_rebate = (1-ID)*IL*(self.Rb-Cb)
        dRa_default = ID*(Ca-L)
        dRa_burn = IL*min(L, Ca)
        
        # Send transaction to cpm
        if dRb_liquidate>0:
            self.cpm = self.cpm.swap(0, dRb_liquidate, uid=-1)
        
        # Update state
        self.Rb = self.Rb - dRb_rebate - dRb_liquidate 
        self.Ra = self.Ra - dRa_burn 
        self.dRa_default = dRa_default
        
        return self

    def write(self, msg=[]):
        # Write state to database
        state = {'Ra': self.Ra, 'Rb': self.Rb, 'Ra_limit': self.Ra_limit, 'locked': self.locked, 'cpmid': self.cpmid}
        newStore = pd.DataFrame({'object': ['MarginPosition'],
                                  'id': [self.id],
                                  'utc': [datetime.datetime.utcnow().timestamp()],
                                  'msg': [msg],
                                  'state': [json.dumps(state)]})
        newStore.to_sql(name='store', con=self.dstore.conn, if_exists='append', index=False)
        return True

    def read(self):
        # Read existing state
        self.store = pd.read_sql_table('store', con=self.dstore.conn)
        myState = self.store.loc[(self.store['object'] == 'MarginPosition') &
                                 (self.store['id'] == self.id), :]
        self.utc = datetime.datetime.utcnow()
        if myState.empty:
            # Initialize state
            self.Ra = self.Ra
            self.Rb = 0
            self.locked = False
            self.cpm = ConstantProductMarket(id=self.cpmid)
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            self.Ra = recentState['Ra']
            self.Rb = recentState['Rb']
            self.Ra_limit = recentState['Ra_limit']
            self.locked = recentState['locked']
            self.cpmid = recentState['cpmid']
            self.cpm = ConstantProductMarket(id=self.cpmid)
        return self


class SpotMarket:
    ''' Get '''
    def __init__(self):
        self.quoteSource = 'alphavantage'
        self.multiplier = 1
        self.curreny = 'BTC'

    def getQuote(self):
        # Get quote from source and scale with mulitplier
        # In:
        # Out: {'Bid': 9,
        #     'Ask': 11,
        #     'Trade': 10,
        #     'TimeStampUTC': datetime.datetime(2019, 3, 23, 1, 17, 13, tzinfo=<UTC>)}

        if self.quoteSource == 'alphavantage':
            # setup for alphavantage
            sourceurl = 'https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency='+ self.curreny+ '&to_currency=USD&apikey=VVOJSV9CUU9JRCSE'
            sourceheaders = {}
            response = requests.get(sourceurl, headers=sourceheaders)
            qt = float(response.json()['Realtime Currency Exchange Rate']['5. Exchange Rate'])
            t = response.json()['Realtime Currency Exchange Rate']['6. Last Refreshed']
            tUTC = datetime.datetime.utcnow().timestamp()
            quote = {'Bid': [], 'Ask': [], 'Trade': qt*self.multiplier, 'TimeStampUTC': tUTC}

        return quote

'''class SpotMarket:
    # Spot market

    def __init__(self, mp0=100, sigma=0.01, T=100):
        # Initial price
        self.mp = mp0
        # Volatilty
        self.sigma = sigma
        # Average
        self.mu = -0.5*self.sigma**2
        self.t = 0
        self.T = T
        self.dW = np.random.standard_normal(self.T)

    def process(self):
        assert(self.t<=self.T)

        self.mp = self.mp*np.exp(self.mu + self.sigma*self.dW[self.t])
        self.t = self.t+1
        return self
        '''

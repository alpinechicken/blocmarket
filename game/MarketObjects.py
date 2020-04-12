import numpy as np
import pandas as pd
from game.DataStore import DStore
import datetime
import json
import requests

# New market objects for stablecoin simulation/game.
'''
Prototype for stablecoin machine. 

User: Contains purses for currency, shares and ownership tokens
- mint: create new currency/tokens
- send: send to another user

ConstantProductMarket:  x*y=k swap market with volume restrictions to harden against manipulation 
- swap: swap one currency for another
- subscribe: subscribe to autoswap pool
- redeem: redeem from pool

MarginPosition:  Generic collateralized loan using a ConstantProductMarket as an oracle and liquidation pool
- touch: run margin processes
- seed: create offer for loan
- subscribe: borrow
- redeem: repay

StableCoinMachine - Logic for issuing stablecoin with volume restrictions to harden against manipulation
- touch: run issuance/margin/default processes
- seed: add collateral and create initial swap pool
- subscribe: recapitalize stablecoin machine
- redeem: liquidate 

SpotMarket - Mock spot market for collateral/stablecoin

'''

class User:
    # User has balances (this is a collection of purses)

    '''
    Things that go in purses:
    - Currency: Ra, Rb, Rusd
    - Shares of autoswaps are pairs with id of of autoswap and id of share: Rs = {{'cpmid':0, 'shareid':2} , {'cpmid':3, 'shareid':0}}
    - Ownership of margin positions are the id  (i.e. owner is the lender): Rm = {{mpid:2}, {mpid:6}}
    - Ownership of stablecoin machine is the id: Rc = {{scmid:0}}
    '''

    def __init__(self, id=[]):
        # Constructor.
        '''
        :param id: user id
        '''
        # Usage:
        #  u = User() -> Make new user (user id = u.id)
        #  u = User(id=1) -> Open up User 1

        # Data store
        self.dstore = DStore()
        self.store = pd.DataFrame()
        # User id
        self.id= id
        # Read state
        self.read()
        if id==[]:
            # Get next available id
            self.nextid()

        # Write state data
        self.write(msg='init(id=%s)'%(self.id))

    def nextid(self):
        # Get next user id
        users = self.store.loc[(self.store['object'] == 'User'), :]
        if users.empty:
            self.id = 0
        else:
            self.id = int(users['id'].max() + 1)

    def mint(self, type, amount=[], objectid = [], assetid =[] ):
        # Mint new assets and deposit in own purse.
        '''
        :param type: Asset type
        :param amount: Asset amount
        :param objectid: Object id (to identify autoswap/cpm or margin position)
        :param assetid: id of asset (e.g index of share in registry)
        :return:
        '''
        # Usage:
        #  self.mint(type='Rb', amount=4) -> Mint 4 4Rb
        #  self.mint(type='Rs', objectid=0, shareid=0) -> Mint a share on CPM0 with id=1
        #  self.mint(type='Rm', objectid=1) -> Mint ownership on Margin Position with id=1
        #  self.mint(type='Rc', objectid=0) -> Mint ownership on stablecoin machine with id=0
        self.read()
        if (type == 'Ra') or (type == 'Rb') or (type == 'Rusd'):
            setattr(self, type, getattr(self, type)  + amount)
        if (type == 'Rs'): # Rs shares are something like {'cpmid':2, 'shareid':0} which means the purse owns the first share of the third ConstantProductMarket
            # Mint a new share
            newShare = {'cpmid': objectid, 'shareid': assetid}
            setattr(self, type, np.append(getattr(self, type),newShare))
        if (type == 'Rm'): # Rm shares are something like {'mpid': 1} which means the purse owns the second MarginPosition
            # Mint new mp ownership token
            newShare = {'mpid': objectid}
            setattr(self, type, np.append(getattr(self, type),newShare))
        if (type == 'Rc'): # Rc shares are something like {'scmid': 0} which means the purse owns the first stablecoin machine
            # Mint new mp ownership token
            newShare = {'scmid': objectid}
            setattr(self, type, np.append(getattr(self, type),newShare))
        # write changes
        self.write(msg='mint(amount = %s, type = %s, objectid = %s, assetid = %s )' % (amount, type, objectid, assetid))

    def send(self, type, recipientid, amount=[], objectid = [], assetid =[] ):
        # Send asset.
        '''
        :param type:
        :param recipientid:
        :param amount:
        :param objectid:
        :param assetid:
        :return:
        '''
        # Usage:
        # self.send(type='Ra', recipientid=2, amount=4) -> Send 4 ra to user 2
        # self.send(type='Rs', recipientid=5, objectid=0, assetid=3) Send the 3rd share from CPM 0 to user 5
        # self.send(type='Rm', recipientid=5, objectid=12) Send ownership of 12th MarginPosition to user 5

        self.read()
        recipient = User(id = recipientid)
        # TODO: test all these sends
        if (type == 'Ra') or (type == 'Rb') or (type == 'Rusd'):
            assert (getattr(self, type)  >= amount), 'Insufficient in purse'
            setattr(self, type, getattr(self, type)  - amount)
            setattr(recipient, type, getattr(recipient, type) + amount)
        if (type == 'Rs'): # Rs shares are something like {'cpmid':2, 'shareid':0} which means the purse owns the first share of the third ConstantProductMarket
            # Whole transfers only
            p = np.array(getattr(self, type))
            shareind = np.array([(x['cpmid']==objectid) and (x['shareid'] == assetid) for x in p])
            # Remove share from origin
            assert (not p[shareind].size == 0), 'Origin doesn\'t own this share.'
            setattr(self, type, p[~shareind])
            # Add share to recipient
            setattr(recipient, type, np.append(getattr(self, type), p[shareind]))
        if (type == 'Rm'): # Rm shares are something like {'mpid': 1} which means the purse owns the second MarginPosition
            # Whole transfers only
            p = np.array(getattr(self, type))
            shareind = np.array([(x['mpid']==objectid) for x in p])
            # Remove share from origin
            assert (not p[shareind].size == 0), 'Origin doesn\'t own this share.'
            setattr(self, type, p[~shareind])
            # Add share to recipient
            setattr(recipient, type, np.append(getattr(self, type),(p[shareind])))
        if (type == 'Rc'): # Rc shares are something like {'scmid': 0} which means the purse owns the first stablecoin machine
            # Mint new mp ownership token
            #  Whole transfers only
            p = np.array(getattr(self, type))
            shareind = np.array([(x['scmid']==objectid) for x in p])
            # Remove share from origin
            assert (not p[shareind].size == 0), 'Origin doesn\'t own this share.'
            setattr(self, type, p[~shareind])
            # Add share to recipient
            setattr(recipient, type, np.append(getattr(self, type),(p[shareind])))
        # write changes
        self.write(msg='send(amount = %s, type = %s, recipientid = %s, objectid = %s, assetid = %s )' % (amount, type, recipientid, objectid, assetid))
        recipient.write(msg='User.send(amount = %s, type = %s, recipientid = %s, objectid = %s, assetid = %s )' % (amount, type, recipientid, objectid, assetid))

    def write(self, msg=[]):
        # Write state to database
        '''
        :param msg: msg for write
        :return:
        '''
        # Usage:
        # e.g. self.write(msg=<message from calling function>)
        state = {'Ra': float(self.Ra), 'Rb': float(self.Rb), 'Rusd': float(self.Rusd), 'Rs': self.Rs.tolist(),
                 'Rm': self.Rm.tolist(), 'Rc': self.Rc.tolist()}
        newStore = pd.DataFrame({'object': ['User'],
                                  'id': [self.id],
                                  'utc': [datetime.datetime.utcnow().timestamp()],
                                  'msg': [msg],
                                  'state': [json.dumps(state)]})
        newStore.to_sql(name='store', con=self.dstore.conn, if_exists='append', index=False)
        return True

    def read(self):
        # Read all stored states
        self.store = pd.read_sql_table('store', con=self.dstore.conn)
        # Most recent
        self.currentStore = pd.merge(self.store.groupby(['object', 'id']).agg({'utc':'max'}), self.store)
        if self.id == []:
            myState = pd.DataFrame({})
        else:
            myState = self.store.loc[(self.store['object'] == 'User') &
                                     (self.store['id'] == self.id), :]

        if myState.empty:
            # Initialize state
            self.Ra = 0
            self.Rb = 0
            self.Rusd = 0
            # Autoswap shares
            self.Rs = np.array([])
            # Loan ownership
            self.Rm = np.array([])
            #
            self.Rc = np.array([])
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            self.Ra = recentState['Ra']
            self.Rb = recentState['Rb']
            self.Rusd = recentState['Rusd']
            self.Rs = np.array(recentState['Rs'])
            self.Rm = np.array(recentState['Rm'])
            self.Rc = np.array(recentState['Rc'])

        return self

class ConstantProductMarket:

    # Constant product market (autoswap). Swaps Ra for Rb.
    '''
    The CPM has time limits on swaps to protect against manipulation. These can be set in conjunction with similar
    limits on the StableCoinMachine (see https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3538932). These limits
    prevent manipulation by limiting total trades within a time window. The idea is to give traders on the CPM
    sufficient time to detect any mis-pricing and trade back to target. This makes manipulation unprofitable.
    '''

    def __init__(self, id=[]):

        # Static
        self.TX_FEE = 0.0
        # Manipulation bound
        self.EPSILON_BAR = 0.6
        # Time window for max loan quantity
        self.ACCUM_WINDOW = 3

        # Data store
        self.dstore = DStore()
        self.store = pd.DataFrame()

        # Id
        self.id = id
        # read state
        self.read()
        if id == []:
            # Get next available id
            self.nextid()

        # Current timestamp
        self.utc = datetime.datetime.utcnow().timestamp()

        # Write state data
        self.write(msg='init(id=%s)'%(id))

    def nextid(self):
        # Get next user id
        cpms = self.store.loc[(self.store['object'] == 'ConstantProductMarket'), :]
        if cpms.empty:
            self.id = 0
        else:
            self.id = int(cpms['id'].max() + 1)
    
    def swap(self, dRa, dRb, userid, forceTrade=False):
        # Request swap.
        '''
        :param dRa: Ra swap amount
        :param dRb: Rb swap amount
        :param userid: use initiating swap
        :param forceTrade: optional to ignore liquidity limits (for internal use)
        :return: self
        '''
        # Usage:
        #  self.swap(dRa=4,dRb=0, userid=1) -> User 1 wants to swap 4Ra for Rb
        #  self.swap(dRa=0,dRb=2, userid=1) -> User 1 wants to swap 2Rb for Ra


        # Read state
        self = self.read()
        # Reject trade if recent volume plus current trade exceeds limit (from oracle safety paper)
        myUserHistory = self.store.loc[(self.store['object'] == 'User') & (self.store['id'] == self.user.id), :]
        myTradeHistory = pd.DataFrame({'utc': myUserHistory['utc'], 'Ra': [x['Ra'] for x in myUserHistory['state']],
                                       'Rb': [x['Rb'] for x in myUserHistory['state']]})
        myRecentTradeHistory = myTradeHistory.loc[myTradeHistory['utc']> datetime.datetime.utcnow().timestamp() - self.ACCUM_WINDOW,:]
        # Recent directional volume of trades
        recentRbVolume = np.abs(np.sum(np.diff(myRecentTradeHistory['Rb'])))
        RbVolumeLimit = self.user.Rb*(np.sqrt(1+self.EPSILON_BAR)-1)
        if not forceTrade:
            assert (dRb + recentRbVolume) <= RbVolumeLimit, 'Trade volume limit exceeded. Wait a bit and try again.'
        # Initialize the trader
        u = User(id=userid)
        assert ((dRa == 0 or dRb == 0) and not (dRa == 0 and dRb == 0)), 'One of dRa or dRb must be zero'
        # Swap between cpm user and recipient
        if dRa>0:
            dRb = (self.user.Rb * self.user.Ra / (self.user.Ra + dRa) - self.user.Rb) / (1 - self.TX_FEE)
            u.send(amount= dRa ,type = 'Ra' ,recipientid= self.user.id)
            self.user.send(amount=-dRb, type='Rb', recipientid=userid)
        elif dRb>0:
            dRa = self.user.Rb * self.user.Ra / (self.user.Rb + dRb * (1 - self.TX_FEE)) - self.user.Ra
            u.send(type='Rb', recipientid = self.user.id, amount=dRb)
            self.user.send(type='Ra', recipientid=userid, amount=-dRa)
        return self

    def swap_quote(self, dRa, dRb):
        # Get quote for swap.
        '''
        :param dRa: Ra swap amount
        :param dRb: Rb swap amount
        :return: self
        '''
        # Usage:
        #  self.swap_quote(dRa=4,dRb=0) -> Quote amount of Rb for 4 Ra
        #  self.swap_quote(dRa=0,dRb=2) -> Quote amount of Ra for 2 Rb
        self = self.read()
        assert((dRa==0 or dRb==0) and not (dRa==0 and dRb==0))
        if dRa > 0:
            dRb = (self.user.Rb*self.user.Ra/(self.user.Ra + dRa) - self.user.Rb)/(1-self.TX_FEE)
        elif dRb>0:
            dRa = self.user.Rb*self.user.Ra/(self.user.Rb + dRb*(1-self.TX_FEE)) - self.user.Ra

        # References (changes for swap user)
        self.dRa = dRa
        self.dRb = dRb*(1-self.TX_FEE) # Swap receives gamma*dRb
        return self
        
    def subscribe(self, dRa, dRb, userid):
        # Subscribe to CPM shares with dRa, dRb
        '''
        :param dRa: Amount of Ra to the pool
        :param dRb: Amount of Rb to the pool
        :param userid: User initiating
        :return: self
        '''
        # Usage:
        # self.subscribe(dRa=100, dRb=10) -> Subscribe to pool with 100Ra and 10Rb (existing pool shares must be in this proportion)
        #
        # Shares proportions are stored on the cpm (e.g. = self.Rs_prop= [0.5, 0.5])
        # Actual shares are stored as dicts in self.user.Rs (e.g. [{'cpmid':1, 'shareid':0}, {'cpmid':2, 'shareid':1} ]

        # Initialize trader
        u = User(id=userid)
        self.read()
        if self.user.Ra !=0:
            assert(dRa/dRb == self.user.Ra/self.user.Rb), 'Share is not proportional to current pool.'
        # Share is proportional to current pool
        dS_prop = dRb/(self.user.Rb + dRb)
        # Dilute existing share proportions
        self.Rs_prop = self.Rs_prop*self.user.Rb/(self.user.Rb + dRb)
        # Append new share proportion
        self.Rs_prop = np.append(self.Rs_prop, dS_prop)
        # shareid is the index of the Rs_prop record
        shareid = len(self.Rs_prop)-1
        # Send subscription amounts to pool
        u.send(amount=dRa, type='Ra',recipientid=self.user.id)
        u.send(amount=dRb, type='Rb', recipientid=self.user.id)
        # Mint new shares and deposit in user purse
        self.user.mint(type='Rs', objectid=self.id, assetid=shareid)
        self.user.send(type='Rs', recipientid=u.id, objectid=self.id, assetid=shareid)
        # Write state
        self.write(msg='subscribe(dRa=%s,dRb=%s,userid=%s)' % (dRa, dRb, userid))
        return self
               
    def redeem(self,dS, shareid, userid):
        # Redeem shares
        '''
        :param dS: Fraction of share to be redeemed
        :param shareid: Id of share
        :param userid:  Id of share owner
        :return:
        '''
        # Usage:
        # self.redeem(dS=0.5,shareid=2,userid=1) -> redeems 0.5 share stored in register 2 for user 1

        u = User(id=userid)
        # Check that user owns the shares and also has enough
        assert np.any([x['cpmid']== self.id and x['shareid'] == shareid  for x in u.Rs]), 'User doesn\'t have that share'
        assert self.Rs_prop[shareid] >= dS, 'Not enough of that share in register'
        self = self.read()
        dRa = dS*self.user.Ra
        dRb = dS*self.user.Rb
        self.Rs_prop[shareid] = self.Rs_prop[shareid] - dS
        # Undilute remaining shares
        diluteProp = self.user.Rb /(self.user.Rb - dRb)
        self.Rs_prop = self.Rs_prop*  diluteProp
        # Redilute share
        #self.Rs_prop[shareid] = self.Rs_prop[shareid]/diluteProp
        # Send redemption
        self.user.send(amount=dRa, type='Ra',recipientid=userid)
        self.user.send(amount=dRb, type='Rb', recipientid=userid)

        # Write state
        self.write(msg='redeem(dS=%s, shareid=%sm userid=%s)'%(dS, shareid, userid))
        return self

    def write(self, msg=[]):
        # Write state to database
        '''
        :param msg: msg for write
        :return:
        '''
        # Usage:
        # e.g. self.write(msg=<message from calling function>)
        state = {'userid': int(self.user.id),'Rs_prop': self.Rs_prop.tolist()}
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
        # Most recent
        self.currentStore = pd.merge(self.store.groupby(['object', 'id']).agg({'utc':'max'}), self.store)
        if self.id == []:
            myState = pd.DataFrame({})
        else:
            myState = self.store.loc[(self.store['object'] == 'ConstantProductMarket') &
                                     (self.store['id'] == self.id), :]

        if myState.empty:
            # Add a user (purses)
            self.user = User()
            # Share registry
            self.Rs_prop = np.array([])
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            # Load user id (for purses)
            userid = recentState['userid']
            # Add existing user (purses)
            self.user = User(id=userid)
            # Share registry
            self.Rs_prop = np.array(recentState['Rs_prop'])

        return self

class MarginPosition:

    # Margin position.
    '''
    A margin position is a collateralized loan that is automatically margined against a ConstantProductMarket
    reference price. The loan is perpetual and accumulates a stability fee as long as it is open. If the loan is
    repaid or automatically liquidated the free collateral is refunded to the borrower. If the loan defaults the
    default amount is recorded.
    '''
    
    def __init__(self, cpmid=[], id=[], userid=[]):
        # Initialize a margin loan

        # Static
        self.MI = 1.5 # Initial margin
        self.MV = 1.2 # Variation margin
        self.r = 0.0 # Fee (annual)
        self.T = datetime.datetime(2021, 1, 1).timestamp() # Expiry

        # State
        self.DT = 1 # Discount rate
        self.Ra_subscribe = 0 # Amount borrowed
        self.Ra_offer = 0 # Amount offered
        self.Ra_default = 0 # Amount defaulted
        self.utc = datetime.datetime.utcnow().timestamp() # UTC timestamp
        self.T0 = 0 # Loan start time
        self.locked = False # Locks after first loan is made
        self.closed = False # Closed after liqudation or full redemption
        self.cpm = ConstantProductMarket(id=cpmid) # ConstantProuduct market for oracle and liquidation
        self.cpmid = cpmid # Id of attached cpm

        # Data store
        self.dstore = DStore() # Connection
        self.store = pd.DataFrame() # Generic data store table

        # Id
        self.id = id # Own id
        self.lenderid = userid # Lender id
        self.borrowerid = [] # Borrower id

        # read state
        self.read()
        if id == []:
            # Get next available id
            self.nextid()

        # Write state data
        self.write(msg='init(cpmid= %s, id=%s, userid=%s)'%(cpmid, id, userid))

    def touch(self):
        self.process()



    def nextid(self):
        # Get next user id
        marginpositions = self.store.loc[(self.store['object'] == 'MarginPosition'), :]
        if marginpositions.empty:
            self.id = 0
        else:
            self.id = int(marginpositions['id'].max() + 1)
        return self

    def seed(self, dRa, userid):
        # Seed loan with Ra.
        '''
        :param dRa: Maximum amount for loan
        :param userid: User id
        :return:
        '''
        # Usage:
        # self.seed(dRa=5, userid=2) -> user 2 offers to loan 5

        assert dRa>0, 'Need to seed with positive amount'
        assert not self.locked, 'Loan is locked'
        assert not self.closed, 'Loan is closed'
        assert(self.lenderid == userid), 'Only creator can seed the loan'
        # Lock up Ra_limit
        u = User(id=self.lenderid)
        u.send(amount=dRa, type='Ra', recipientid=self.user.id)
        # Record offer
        self.Ra_offer = dRa
        # Mint loan ownership and send to user
        self.user.mint(type='Rm', objectid=self.id)
        self.user.send(type='Rm', recipientid=u.id, objectid=self.id)
        # Add Rm share to user wallet
        self.write(msg='seed(dRa = %s,userid=%s)'%(dRa, userid))
               
    def subscribe(self, dRb, userid):
        # Subscribe to loan.

        '''
        :param dRb: Collateral for loan
        :param userid: User id of borrower
        :return:
        '''
        # Usage:
        #  self.subscribe(dRb = 2, userid = 4) -> User 4 puts up 2 Rb collateral for loan
        uborrow = User(id=userid)
        assert (uborrow.Rb >= dRb), 'User doesn\'t have enough Rb'
        assert dRb > 0 , 'Need positive collateral'
        assert not self.locked, 'Loan is locked'
        assert not self.closed, 'Loan is closed'
        # Update state
        self.read()
        # Get reference rate from cpm
        mr = self.cpm.user.Rb/self.cpm.user.Ra
        dRa_subscribe = dRb*self.DT/(mr*self.MI)

        assert dRa_subscribe <= self.user.Ra, 'Not enough Ra locked'
        # Send collateral
        uborrow.send(amount=dRb, type='Rb', recipientid=self.user.id)
        # Send loan
        self.user.send(amount=dRa_subscribe, type='Ra', recipientid=userid)
        # Refund excess to lender
        self.user.send(amount=self.user.Ra, type='Ra', recipientid=self.lenderid )
        # Lock after subscription
        self.T0 = datetime.datetime.utcnow().timestamp()
        self.locked = True
        # Borrower id
        self.borrowerid = int(userid)
        self.Ra_subscribe = self.Ra_subscribe + dRa_subscribe
        # Write state
        self.write(msg = 'subscribe(dRb=%s,userid=%s)'%(dRb, userid))
        return self

    def redeem(self, userid):
        # Redeem loan (Note: only allows full redemptions)
        '''

        :param dRa:
        :param userid:
        :return:
        '''
        #  Usage:
        #  self.redeem(userid=4) -> User 4 is redeeming loan
        uborrow = User(id=userid)
        assert(uborrow.id== self.borrowerid), 'Only registered borrower can repay loan'
        #assert(uborrow.Ra >= dRa), 'Borrower doesn\'t have enough Ra to repay loan'
        #assert dRa>0, 'Need positive redemption amount' (for partial redemptions)
        assert self.locked, 'Loan is not locked'
        assert not self.closed, 'Loan is closed'
        # Update state and check for liquidation events
        self = self.process()
        # Process redemption
        if not self.closed:
            # Calculate redemption
            Ca = self.Ra_subscribe / self.DT
            #dRb_redeem = self.user.Rb*dRa/Ca (for partial redemptions)
            dRb_redeem = self.user.Rb
            dRa = Ca # (full redemption)
            # Transfers
            #assert (dRa<=Ca), 'Sending too much collateral'
            assert uborrow.Ra >= dRa, 'Not enough Ra to redeem loan.'
            # Send repayment
            uborrow.send(amount=dRa, type='Ra', recipientid=self.user.id)
            # Send back collateral
            self.user.send(amount=dRb_redeem, type='Rb', recipientid=self.borrowerid)
            # If collateral is empty return Ra to lender and close loan
            self.user.send(type='Ra', amount=self.user.Ra, recipientid=self.lenderid)
            self.user.send(type='Rb', amount=self.user.Rb, recipientid=self.lenderid)
            self.Ra_default = 0
            self.closed=True
            # Write state
            self.write(msg = 'redeem(dRa=%s,userid=%s)'%(dRa, userid))
        return self
    
    def process(self):
        # Run new price an check on cpm and liquidate as necessary.
        assert self.user.Rb>0, 'No collateral locked.'
        # Change time
        self.utc = datetime.datetime.utcnow().timestamp()
        # Update discount factor (using seconds from utc timestamps)
        self.DT = np.exp(-self.r * (self.utc-self.T0) / (365.25 * 24 * 60 * 60))
        # Liquidation quote for full collateral
        self.cpm = self.cpm.swap_quote(0, self.user.Rb)
        mrt = -self.cpm.dRb/self.cpm.dRa
        # Liquidation value
        L = self.user.Rb/mrt
        # Collateral requirement
        Cb = self.Ra_subscribe*mrt/self.DT
        Ca = self.Ra_subscribe/self.DT
        # Variation margin
        V = Ca*self.MV        
        # Indices
        ID = L < Ca
        IM = (L < V) and not ID
        IT = (self.utc >= self.T) and not (IM or ID)
        IL = ID or IM or IT        
        # Deltas
        dRb_liquidate = IL*(ID*self.user.Rb + IM*Cb + IT*Cb)
        dRb_rebate = (1-ID)*IL*(self.user.Rb-Cb)
        dRa_default = ID*(Ca-L)
        dRa_burn = IL*min(L, Ca)
        
        # Send transaction to cpm
        if dRb_liquidate>0:
            # Note that this swap is forced so it is allowed to breach volume/time limits.
            self.cpm = self.cpm.swap(dRa=0, dRb=dRb_liquidate, userid= self.user.id, forceTrade=True) #
        # If there's a liquidation event, adjust purses
        if IL:
            # Update state
            self.user.send(type='Rb', amount=dRb_rebate, recipientid=self.borrowerid)
            self.user.send(type='Ra', amount=dRa_burn, recipientid=self.lenderid)
            # Record default
            self.Ra_default = dRa_default
            # Borrower gets back surplus Ra
            self.user.send(type='Ra', amount=self.user.Ra, recipientid=self.borrowerid)
            # Lender gets back surplus Rb
            self.user.send(type='Rb', amount=self.user.Rb, recipientid=self.lenderid)
            self.closed = True
            self.write(msg='process()->liquidated' )

        return self

    def write(self, msg=[]):
        # Write state to database
        '''
        :param msg: msg for write
        :return:
        '''
        # Usage:
        # self.write(msg=<message from calling function>)
        state = {'userid':int(self.user.id), 'lenderid': self.lenderid,
                 'borrowerid': self.borrowerid, 'Ra_subscribe':self.Ra_subscribe, 'Ra_offer': self.Ra_offer,
                 'Ra_default':self.Ra_default, 'locked': self.locked, 'closed':self.closed, 'cpmid': self.cpmid}
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
        # Most recent
        self.currentStore = pd.merge(self.store.groupby(['object', 'id']).agg({'utc':'max'}), self.store)
        if self.id == []:
            myState = pd.DataFrame({})
        else:
            myState = self.store.loc[(self.store['object'] == 'MarginPosition') &
                                     (self.store['id'] == self.id), :]
        self.utc = datetime.datetime.utcnow()
        if myState.empty:
            # Initialize state
            self.user = User()
            self.locked = False
            self.cpm = ConstantProductMarket(id=self.cpmid)
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            self.user = User(recentState['userid'])
            self.lenderid = recentState['lenderid']
            self.borrowerid = recentState['borrowerid']
            self.Ra_subscribe = recentState['Ra_subscribe']
            self.Ra_offer = recentState['Ra_offer']
            self.Ra_default = recentState['Ra_default']
            self.locked = recentState['locked']
            self.cpmid = recentState['cpmid']
            self.cpm = ConstantProductMarket(id=self.cpmid)
        return self

class StableCoinMachine:
    # Stablecion machine.
    '''
    A stablecoin machine mints Ra and offers loans through MarginPosition.
    '''

    def __init__(self, userid=[], id=[]):

        # Manipulation bound
        self.EPSILON_BAR = 0.6
        # Delay between loans
        self.ACCUM_WINDOW = 3

        self.locked = False # Locks after first loan is made

        # Data store
        self.dstore = DStore()
        self.store = pd.DataFrame()

        # Id
        self.id = id
        self.ownerid = userid

        # read state
        self.read()
        if id == []:
            # Get next available id
            self.nextid()

        # Write state data
        self.write(msg='init(userid=%s, id=%s)' % (id, userid))

    def nextid(self):
        # Get next user id
        scms = self.store.loc[(self.store['object'] == 'StableCoinMachine'), :]
        if scms.empty:
            self.id = 0
        else:
            self.id = int(scms['id'].max() + 1)
        return self

    def touch(self):
        # Run process and write
        self.process()
        self.write('touch()')

    def seed(self, dRb, m_ref, userid):
        # Seed with equity contribution of Rb in exchange for Rc ownership
        '''
        :param dRb: equity contribution
        :param m_ref: reference exchagne rate
        :param userid: User id for equity subscriber
        :return:
        '''
        # Usage:
        # self.seed(dRb=5, userid=2) -> user 2 put in 5 Rb as equity

        assert dRb > 0, 'Need to seed with positive amount'
        assert not self.locked, 'Stablecoin machine is locked'
        assert (userid == self.ownerid), 'Only owner can seed'
        # Lock up equity
        u = User(id=userid)
        u.send(amount=dRb, type='Rb', recipientid=self.user.id)
        # Read new balances
        self.user.read()
        # Mint loan ownership and send to user
        self.user.mint(type='Rc', objectid=self.id)
        self.user.send(type='Rc', recipientid=u.id, objectid=self.id)
        # Mint equal amount of Ra
        self.user.mint(type='Ra', amount=dRb/m_ref)
        # Subscribe to new CPM
        self.cpm.subscribe(dRa=dRb/m_ref, dRb= dRb, userid=self.user.id)
        # Run process
        self.process()
        self.locked = True
        # Add Rc share to user wallet
        self.write(msg='seed(dRb = %s,userid=%s)' % (dRb, userid))

    def subscribe(self, dRb, userid):

        # Recapitalize StableCoinMachine (anyone can do this but it only benefits owners)
        '''
        :param dRb: New collateral
        :param userid: User id of subscriber
        :return:
        '''
        assert dRb > 0, 'Need to seed with positive amount'
        # Lock up equity
        u = User(id=userid)
        u.send(amount=dRb, type='Rb', recipientid=self.user.id)
        # Get current price from cpm
        m_ref = self.cpm.user.Rb/self.cpm.user.Ra
        # Mint equal amount of Ra
        self.user.mint(type='Ra', amount=dRb/m_ref)
        # Subscribe to new CPM
        self.cpm.subscribe(dRa=dRb/m_ref, dRb= dRb, userid=self.user.id)
        # Run processs
        self.process()
        self.locked = True
        # Add Rc share to user wallet
        self.write(msg='seed(dRb = %s,userid=%s)' % (dRb, userid))

    def redeem(self, dRa, userid):
        # TODO: implement redemption (distribute surplus via buyback of governance token shares)
        return self

    def process(self):
        # Burn process
        # - Get closed loans (repaid or defaulted)
        # - Burn subscription amount (if there is enough Ra left)
        # - Redeem shares in cpm to cover burn
        #
        # This implements four collateral layers to cover liquidations
        # 1. The variation margin for the loan
        # 2. The stability pool of Ra
        # 3. The equity in the ConstantProductMarket
        # 4. Future surplus Ra

        # The pool can be recapitalized at any time by a subscription.

        # Get all loans
        allLoans = self.currentStore.loc[self.currentStore['object']=='MarginPosition']
        # Get closed loans
        myClosedLoans = allLoans.loc[np.array([(x['lenderid'] == self.user.id) and (x['locked'] == True) and (x['closed'] == True) for x in allLoans['state']]),:]
        # Try to burn from available Ra
        for i, row in myClosedLoans.iterrows():
            if self.Ra_burned[row['id']]<row['state']['Ra_subscribe']:
                # Burn Ra_subscribe - Ra_default
                burnAmount = np.max(row['state']['Ra_subscribe'] - self.Ra_burned[row['id']], self.user.Ra)
                if burnAmount>0:
                    self.user.mint(type='Ra', amount= burnAmount)
                    self.Ra_burned[row['id']] = self.Ra_burned[row['id']] + burnAmount
        # Redeem cpm shares TODO: make sure this is all sensible. The idea should be to liquidate each cpm share proportionally
        for l_ind, row in myClosedLoans.iterrows():
            if self.Ra_burned[row['id']]<row['state']['Ra_subscribe']:
                # Burn Ra_subscribe - Ra_default
                availableRa = np.sum(self.cpm.user.Ra * self.cpm.Rs_prop[self.Rs]) # TODO: check this
                burnAmount = np.max(row['state']['Ra_subscribe'] - self.Ra_burned[row['id']], availableRa) # TODO: check this
                redeemFraction = burnAmount/availableRa
                if burnAmount>0:
                    for s_ind in len(self.user.Rs):
                        # Redemption amounts
                        dRa = self.user.Rs[s_ind]*redeemFraction* self.cpm.user.Ra
                        dRb = self.user.Rs[s_ind]*redeemFraction* self.cpm.user.Ra
                        burnAmount = dRa
                        self.cpm.redeem(dS= self.user.Rs[s_ind]*redeemFraction , shareid=s_ind, userid=self.user.id)
                        self.user.mint(type='Ra', amount= burnAmount)
                        self.Ra_burned[row['id']] = self.Ra_burned[row['id']] + burnAmount
                        # Recapitalise stability pool with Ra
                        self.cpm.swap(dRb=dRb, dRa=0, userid=self.user.id)

        # Determine maximum loan (using notation from 'Are constant product markets safe' paper)
        self.read()
        # Open new margin position
        m = MarginPosition(cpmid=self.cpm.id, userid=self.user.id)
        # Get exchange rate from cpm
        m_ref = self.cpm.user.Rb/self.cpm.user.Ra
        pi_mp = (1+self.EPSILON_BAR)/m.MI-1
        Pi_cp = -self.cpm.user.Rb*(np.sqrt(1+self.EPSILON_BAR) +(1+self.EPSILON_BAR)**(-0.5)-2 )
        maxRb = -Pi_cp/pi_mp
        maxRa = maxRb/m_ref

        myOpenLoans = allLoans.loc[np.array([(x['lenderid'] == self.user.id) and (x['locked'] == True) and (x['closed'] == False) for x in allLoans['state']]),:]
        # Current loans outstanding to scm
        openLoans = np.sum([x['Ra_subscribe'] for x in myOpenLoans['state']] )# Placeholder - find actual offered loans
        myOfferedLoans = allLoans.loc[np.array([(x['lenderid'] == self.user.id) and (x['locked'] == False) and (x['closed'] == False) for x in allLoans['state']]),:]
        # Loans offered but not locked
        offeredLoans = np.sum([x['Ra_offer'] for x in myOfferedLoans['state']] )
        recentLoanWindow = datetime.datetime.utcnow().timestamp() - self.ACCUM_WINDOW
        myRecentClosedLoans = allLoans.loc[np.array(
            [(x['lenderid'] == self.user.id) and (x['locked'] == True) and (x['closed'] == True) for x in
             allLoans['state']]) & (allLoans['utc']>= recentLoanWindow), :]
        # Recently closed loans
        recentClosedLoans = np.sum([x['Ra_subscribe'] for x in myRecentClosedLoans['state']])
        if (maxRa-offeredLoans-openLoans-recentClosedLoans)>0:
            # Seed up to maximum target
            targetLoan = float(max(maxRa-offeredLoans-openLoans-recentClosedLoans, 0))
            self.user.mint(type='Ra', amount=targetLoan)
            m.seed(dRa=targetLoan, userid=self.user.id)
            self.loanids = np.append(self.loanids, m.id)

        return self

    def write(self, msg=[]):
        # Write state to database
        '''
        :param msg: msg for write
        :return:
        '''
        # Usage:
        # e.g. self.write(msg=<message from calling function>)

        state = {'userid': int(self.user.id),'ownerid': int(self.ownerid), 'cpmid': self.cpmid,
                 'loanids':self.loanids.tolist(),'Ra_burned':self.Ra_burned.tolist(), 'locked': self.locked}
        newStore = pd.DataFrame({'object': ['StableCoinMachine'],
                                 'id': [self.id],
                                 'utc': [datetime.datetime.utcnow().timestamp()],
                                 'msg': [msg],
                                 'state': [json.dumps(state)]})
        newStore.to_sql(name='store', con=self.dstore.conn, if_exists='append', index=False)
        return True

    def read(self):
        # Read existing state
        self.store = pd.read_sql_table('store', con=self.dstore.conn)
        # Most recent
        self.currentStore = pd.merge(self.store.groupby(['object', 'id']).agg({'utc':'max'}), self.store)
        if self.id == []:
            myState = pd.DataFrame({})
        else:
            myState = self.store.loc[(self.store['object'] == 'StableCoinMachine') &
                                     (self.store['id'] == self.id), :]
        self.utc = datetime.datetime.utcnow()
        if myState.empty:
            # Initialize state
            self.user = User()
            self.locked = False
            self.cpm = ConstantProductMarket()
            self.cpmid = self.cpm.id
            self.loanids = np.array([])
            # Amount burned for each loan
            self.Ra_burned = np.array([])
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            self.user = User(recentState['userid'])
            self.ownerid = recentState['ownerid']
            self.cpmid = recentState['cpmid']
            self.loanids = np.array(recentState['loanids'])
            # Amount burned for each loan (locked loan amounts can be seen in loan state)
            self.Ra_burned = np.array(recentState['Ra_burned'])
            self.locked = recentState['locked']
            self.cpm = ConstantProductMarket(id=self.cpmid)
        return self

class SpotMarket:
    ''' Swaps collateral currency Rb and USD using  live-ish pricing
    UsageL s = SpotMarket() -> Swap 10 unit of Rb for USD
    s = s.swap(0,10)
    -> s.dRb = 10
    -> s.dUSD = 63146.4
    # Swap 1000 USD for Rb
    s = swap(1000,0)
    -> s.dRb = 0.158
    -> s.dRusd = 1000
    '''
    def __init__(self, id=[]):
        self.quoteSource = 'alphavantage' # Source for price quotes
        self.multiplier = 1 # Quote multiplier
        self.currency1 = 'BTC' # Currency (can do ETH/BTC)
        self.dRusd = 0 # Amount of dRusd from the swap
        self.dRb = 0 # Amount of dRb from the swap
        self.currentQuote = []

        # Data store
        self.dstore = DStore() # Data connection
        self.store = pd.DataFrame() # Data table

        self.id=id
        # Read state
        self.read()
        if id==[]:
            self.nextid()

    def nextid(self):
        # Get next user id
        spotmarkets = self.store.loc[(self.store['object'] == 'SpotMarket'), :]
        if spotmarkets.empty:
            self.id = 0
        else:
            self.id = int(spotmarkets['id'].max() + 1)

        return self

    def getQuote(self):
        # Get quote from source and scale with mulitplier.

        # In:
        # Out: {'Bid': 9,
        #     'Ask': 11,
        #     'Trade': 10,
        #     'TimeStampUTC':  1585682137.70544 )}

        if self.quoteSource == 'alphavantage':
            # setup for alphavantage
            sourceurl = 'https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency='+ self.currency1+ '&to_currency=USD&apikey=VVOJSV9CUU9JRCSE'
            sourceheaders = {}
            response = requests.get(sourceurl, headers=sourceheaders)
            qt = float(response.json()['Realtime Currency Exchange Rate']['5. Exchange Rate'])
            t = response.json()['Realtime Currency Exchange Rate']['6. Last Refreshed']
            tUTC = datetime.datetime.utcnow().timestamp()
            quote = {'Bid': [], 'Ask': [], 'Trade': qt*self.multiplier, 'TimeStampUTC': tUTC}

        return quote

    def swap(self, dRusd, dRb, userid):
        # Swap between Rusd and Rb. Usage: self.swap(dRusd=1000, dRb=0, userid=4) - > User 4 spends USD1000 on Rb
        '''

        :param dRusd: Swap amount of USD
        :param dRb: Swap amount of Rb
        :param userid: User id for swap counterparty
        :return:
        '''
        u = User(id=userid)
        assert (dRb >= u.Rb) or (dRusd >= u.Rusd), 'Not enough collateral'
        currentQuote = self.getQuote()
        assert((dRusd==0 or dRb==0) and not (dRusd==0 and dRb==0)), 'One or both of dRusd and dRb must be zero.'
        if (dRusd == 0):
            # Adjust user purses
            dRusd = dRb*currentQuote['Trade']
            # Spot market mints and sends
            self.user.mint(type='Rusd', amount=dRusd)
            self.user.send(type='Rusd', recipientid= userid, amount=dRusd)
            # User pays
            u.send(type='Rb', recipientid=self.user.id, amount= dRb)
        elif dRb == 0:
            dRb = dRusd/currentQuote['Trade']
            # Spot market mints and sends
            self.user.mint(type='Rb', amount=dRb)
            self.user.send(type='Rb', recipientid= userid, amount=dRb)
            # User pays
            u.send(type='Rusd', recipientid=self.user.id, amount= dRusd)
        self.write(msg='swap(dRusd=%s, dRb=%s, userid = %s)' % (dRusd, dRb, userid))
        u.write(msg='SpotMarket.swap(dRusd=%s, dRb=%s, userid = %s)' % (dRusd, dRb, userid))
        # References (changes for swap user)
        self.dRusd = dRusd
        self.dRb = dRb
        return self

    def write(self, msg=[]):
        # Write state to database
        '''
        :param msg: msg for write
        :return:
        '''
        # Usage:
        # e.g. self.write(msg=<message from calling function>)

        state = {'userid': int(self.user.id)}
        newStore = pd.DataFrame({'object': ['SpotMarket'],
                                  'id': [self.id],
                                  'utc': [datetime.datetime.utcnow().timestamp()],
                                  'msg': [msg],
                                  'state': [json.dumps(state)]})
        newStore.to_sql(name='store', con=self.dstore.conn, if_exists='append', index=False)
        return True

    def read(self):
        # Read state
        self.store = pd.read_sql_table('store', con=self.dstore.conn)
        # Most recent
        self.currentStore = pd.merge(self.store.groupby(['object', 'id']).agg({'utc':'max'}), self.store)
        if self.id == []:
            myState = pd.DataFrame({})
        else:
            myState = self.store.loc[(self.store['object'] == 'SpotMarket') &
                                     (self.store['id'] == self.id), :]
        self.utc = datetime.datetime.utcnow()
        if myState.empty:
            # Initialize state
            self.user = User()
        else:
            # Load state
            recentState = myState.loc[myState['utc'] == max(myState['utc']), 'state'].reset_index(drop=True).loc[0]
            self.user = User(recentState['userid'])
        return self


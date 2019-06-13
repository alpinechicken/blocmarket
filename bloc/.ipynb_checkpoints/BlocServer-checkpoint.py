# Data imports
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, Boolean, String, Float, \
    LargeBinary, BLOB, TIMESTAMP, MetaData, update, ForeignKey
from sqlalchemy.pool import NullPool
import os, platform
import datetime

# Time server
from bloc.BlocTime import BlocTime

# Crypto imports
import nacl.encoding
import nacl.signing

# Other imports
import itertools

import typing


class BlocServer(object):

    def __init__(self):

        # self.engine = create_engine('sqlite:///:memory:', echo=True)
        # self.engine = create_engine("postgresql://alpine:3141592@localhost/blocparty",
        #                              isolation_level="AUTOCOMMIT")
        # Note postgress needs AUTOCOMMIT or else postgress hangs when it gets to a matching trade
        # DATABASE_URL = 'sqlite:///pmarket.db'
        # DATABASE_URL = 'postgresql://vzpupvzqyhznrh:14eeeb882d30a816ad01f3fe64610f3a9e465d2158821cf003b08f1169f3a786@ec2-54-83-8-246.compute-1.amazonaws.com:5432/dbee8j5ki95jfn'

        if platform.system() == 'Darwin':
            # Use local postgres if on mac
            DATABASE_URL = "postgresql://alpine:3141592@localhost/blocparty"
        else:
            # Use DATABASE_URL from env otherwise
            DATABASE_URL = os.environ['HEROKU_POSTGRESQL_JADE_URL']

        self.engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT", poolclass=NullPool)
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        # Users
        self.userTable = Table('userTable', self.metadata,
                               Column('traderId', Integer, primary_key=True),
                               Column('verifyKey', String),
                               )
        # Timestamp servers for signing UTC timestamps
        self.timeStampServerTable = Table('timeStampServerTable', self.metadata,
                               Column('tssId', Integer, primary_key=True, autoincrement=True),
                               Column('verifyKey', String),
                               )
        # Order book for all trades, including including order book,
        # matched, and linked trades
        self.orderBook = Table('orderBook', self.metadata,
                               Column('tradeId', Integer, primary_key=True, autoincrement=True),
                               Column('price', Integer),
                               Column('quantity', Integer),
                               Column('marketId', Integer),
                               Column('traderId', Integer,),
                               Column('previousSig', LargeBinary),
                               Column('signature', LargeBinary),
                               Column('iMatched', Boolean),
                               Column('iRemoved', Boolean),
                               Column('timeStampUTC', TIMESTAMP),
                               Column('timeStampUTCSignature', LargeBinary),
                               )

        # Market table with minimum and maximum of each market.
        self.marketTable = Table('marketTable', self.metadata,
                                 Column('marketRootId', Integer),
                                 Column('marketBranchId', Integer),
                                 Column('marketId', Integer),
                                 Column('marketMin', Integer),
                                 Column('marketMax', Integer),
                                 Column('traderId', Integer),
                                 Column('previousSig', LargeBinary),
                                 Column('signature', LargeBinary),
                                 Column('timeStampUTC', TIMESTAMP),
                                 Column('timeStampUTCSignature', LargeBinary),
                                 Column('marketDesc', String)
                                 )

        # Possible combinations of root market outcomes
        self.marketBounds = Table('marketBounds', self.metadata,
                                  Column('marketBounds', Integer),
                                  Column('marketRootId', Integer),
                                  Column('marketBranchId', Integer),
                                  Column('marketMin', Integer),
                                  Column('marketMax', Integer),
                                  )

        # Market state (possible combinations)
        self.outcomeCombinations = Table('outcomeCombinations', self.metadata,
                                         Column('outcomeId', Integer, primary_key=True),
                                         Column('marketRootId', Integer),
                                         Column('marketBranchId', Integer),
                                         Column('marketMin', Integer),
                                         Column('marketMax', Integer),
                                         )


        # Create all tables
        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()

        # Collateral limit
        self.COLLATERAL_LIMIT = 1e9
        # Number of markets limit (too many will make too many outcome combinations)
        self.ROOT_MARKET_LIMIT = 5
        self.BRANCH_MARKET_LIMIT = 10

        # Temporary local variables
        self.marketOutcomes = np.array([])  # Market corners
        self.p = np.array([0])
        self.q = np.array([0])
        self.mInd = np.array([0])
        self.tInd = np.array([0])
        self.iMatched = np.array([False])
        self.sig = np.array([0])

        # Time server
        self.TimeServer = BlocTime()
        # Register time series server
        ts = self.TimeServer.signedUTCNow()
        tssTable = pd.read_sql_query('SELECT * FROM "timeStampServerTable" WHERE "verifyKey" = \'%s\'' % (ts['verifyKey']), self.conn)
        if tssTable.empty:
            newTSS = dict(verifyKey=ts['verifyKey'])
            # Insert to timeStampServerTable (autoincrements tssID)
            self.conn.execute(self.timeStampServerTable.insert(), [newTSS, ])

        self.tssTable = pd.read_sql_query('SELECT * FROM "timeStampServerTable" WHERE "verifyKey" = \'%s\'' % (ts['verifyKey']), self.conn)



    def purgeTables(self):
        """ Purge all tables before starting a test. """
        self.userTable.delete().execute()
        self.orderBook.delete().execute()
        self.marketTable.delete().execute()
        self.marketBounds.delete().execute()
        self.outcomeCombinations.delete().execute()
        print("All tables deleted.")

    def purgeNonUserTables(self):
        """ Purge all tables before starting a test"""
        self.orderBook.delete().execute()
        self.marketTable.delete().execute()
        self.marketBounds.delete().execute()
        self.outcomeCombinations.delete().execute()
        print("All tables except userTable deleted.")


    # Basic API:
    # createUser
    # createMarket
    # createTrade

    def createUser(self, verifyKey: str) -> object:

            """ Create a new user and adds to userTable.

            :param verifyKey: (str) verify key
            :return newUsrRow: (DataFrame) new user row
            :return self.userTable: (sql table) new row of userTable

            :Example:

            bs = BlocServer()
            bs.createUser('8d708ff647f671b29709a39c5f1529b06d6841fa268f03a834ebf6aad5e6d8e4')

            :Example:

            bc = BlocClient()
            bc.generateSignatureKeys
            bs = BlocServer()
            bs.createUser(bc.verifyKey)

            .. note::
            - Verify key constructed with BlocClient.generateSignatureKeys()
            - Successful call adds new column to userTable.

            .. todo:: check that this is a valid key.
            """

            # Check if this key is already in userTable
            userTable = pd.read_sql_query('SELECT * FROM "userTable" WHERE "verifyKey" = \'%s\'' % (verifyKey), self.conn)
            if not userTable.empty:
                print('Username already exists, sorry buddy.')
                return False
            else:
                traderId = len(pd.read_sql_table("userTable", self.conn)) + 1
                # Create the new user
                newUsr = dict(verifyKey=verifyKey, traderId=int(traderId))
                # Insert to usertable (autoincrements traderId)
                self.conn.execute(self.userTable.insert(), [newUsr, ])
                # Pull back row to get traderID
                newUsrRow = pd.read_sql_query('SELECT * FROM "userTable" WHERE "verifyKey" = \'%s\'' % (verifyKey),
                                              self.conn)

            # Return new user
            return newUsrRow.loc[0].to_dict()

    def createMarket(self, marketRootId: int, marketBranchId: int, marketMin: int,\
                     marketMax: int, traderId: int, previousSig: bytes,\
                     signature: bytes, verifyKey: str, marketDesc: str) -> bool:
            """
            Create a new row in marketTable. Update existing market
            with new bounds if market already exists.

            :param marketRootId
            :param marketBranchId
            :param marketMin
            :param marketMax
            :param traderId
            :param previousSig
            :param signature
            :param verifyKey
            marketMax, marketRootId, marketBranchId, previousSignature,
            signatureMsg, signature]
            :return checks: (boolean) - True if checks pass
            :return self.marketTable: - new row in market table
            :return self.outputCombinations: - updated output combinations  table
            :return: self.marketBounds: - updated market bounds

            :Example:

            .. todo:: Example
            """
            # Force/check inputs

            try:
                marketRootId = np.int64(marketRootId)
                marketBranchId = np.int64(marketBranchId)
                marketMin = np.int64(marketMin)
                marketMax = np.int64(marketMax)
                traderId = np.int64(traderId)
                assert isinstance(marketRootId, np.int64) and marketRootId>0
                assert isinstance(marketBranchId, np.int64) and marketBranchId >0
                assert isinstance(marketMin, np.int64)
                assert isinstance(marketMax, np.int64)
                assert isinstance(traderId, np.int64) and traderId >0
                inputChk = True
            except:
                inputChk = False


            # Check if trader has correct verify key
            traderIdChk = self.getVerifyKey(traderId) == verifyKey

            mT = pd.read_sql_table('marketTable', self.conn)
            numRootMarkets = len(set(mT['marketRootId']))

            # If the market exists, use previous Id
            marketId = (mT[(mT['marketRootId'] == marketRootId) & (mT['marketBranchId'] == marketBranchId)]['marketId']).unique()

            # Create market id
            if mT.empty:
                marketId = 1
            elif marketId.size ==0:
                # Market doesn't exist
                marketId = mT['marketId'].max()+1
            else:
                # Market does exist
                marketId = marketId[0]

            # Limit number of root markets
            if marketBranchId >1:
                marketLimitChk = (marketBranchId <= self.BRANCH_MARKET_LIMIT) and np.any(mT['marketRootId']==marketRootId)
            else:
                marketLimitChk = numRootMarkets <= self.ROOT_MARKET_LIMIT

            # Sign current UTC timestamp
            ts = self.TimeServer.signedUTCNow()
            maxTS = pd.read_sql_query('select max("timeStampUTC") from "marketTable"', self.conn)['max'][0]
            if maxTS is None:
                maxTS = datetime.datetime.strptime(ts['timeStampUTC'], '%Y-%m-%d %H:%M:%S.%f')
            # Check time signature is valid and time server public key is registered and signature is newer than the recent maximum
            timeChk = self.verifyMessage(signatureMsg=bytes(ts['timeStampUTC'], 'utf-8'),
                                         signature=ts['timeStampUTCSignature'], verifyKey=ts['verifyKey']) and\
                                         np.any(ts['verifyKey']==self.tssTable['verifyKey']) and\
                                         datetime.datetime.strptime(ts['timeStampUTC'], '%Y-%m-%d %H:%M:%S.%f')>= maxTS
            newMarket = pd.DataFrame({'marketId': [marketId],
                                       'marketRootId': [marketRootId],
                                       'marketBranchId': [marketBranchId],
                                       'marketMin': [marketMin],
                                       'marketMax': [marketMax],
                                       'traderId': [traderId],
                                       'previousSig': previousSig,
                                       'signature': signature,
                                       'timeStampUTC': ts['timeStampUTC'],
                                       'timeStampUTCSignature': ts['timeStampUTCSignature'],
                                       'marketDesc': marketDesc})

            # Check signature chain for market
            chainChk = False
            if mT.empty:
                # If there are no existing markets chain is ok
                chainChk = True
            else:
                # Check that the previous sig of new market is the sig of the
                # previous market
                prevMarket = self.getPreviousMarket()
                chainChk = bytes(prevMarket['signature'][0]) == previousSig

            # If market exists...
            matchCurrentMarket = pd.merge(left=mT, right=newMarket, on=['marketRootId', 'marketBranchId'])
            ownerChk = True
            if not matchCurrentMarket.empty:
                # Check that trader owns it
                ownerChk = matchCurrentMarket.loc[0, 'traderId_x'] == matchCurrentMarket.loc[0, 'traderId_y']

            # Verify market signature is valid
            sigMsg = \
                str(marketRootId).encode("utf-8") + \
                str(marketBranchId).encode("utf-8") + \
                str(marketMin).encode("utf-8") + \
                str(marketMax).encode("utf-8") + \
                str(traderId).encode("utf-8") + \
                previousSig + b'end'

            sigChk = self.checkSignature(signature, sigMsg, verifyKey)

            # Convert sigChk to logical
            if isinstance(sigChk, bytes):
                sigChk = True
            # Convert time signature check to logical
            if isinstance(timeChk, bytes):
                timeChk = True
            # Check market range
            marketRangeChk = newMarket.loc[0, 'marketMin'] <= newMarket.loc[0, 'marketMax']
            marketIndChk =  newMarket.loc[0, 'marketBranchId'] > 0 and newMarket.loc[0, 'marketRootId'] > 0
            # Checks (correct market number, signature relative to parent, range)
            checks = inputChk and marketLimitChk and marketIndChk and traderIdChk and marketRangeChk and sigChk and chainChk and ownerChk and timeChk

            #  Add market to table if checks pass
            if checks:
                # Append new market
                newMarket.to_sql(name='marketTable', con=self.conn, if_exists='append', index=False)
                # Update all possible combinations of root markets
                self.updateOutcomeCombinations()
            else:
                print('Signature does not match, bad signature chain, or else marketMin > marketMax. Market not added.')

            # Return True if checks pass and market added
            return checks, {'inputChk': inputChk,'marketLimitChk': marketLimitChk, 'traderIdChk': traderIdChk, 'marketId': str(marketId), 'marketRangeChk':marketRangeChk, 'marketIndChk': marketIndChk, 'sigChk': sigChk, 'chainChk':chainChk,\
                            'ownerChk':ownerChk,  'timeChk': timeChk}


    def createTrade(self, p_: int, q_: int, mInd_: int, tInd_: int, previousSig: bytes, signature: bytes, verifyKey: str)->bool:

        """
        Create a new row in marketTable. Update existing market with new bounds if market already exists.

        :param p_: price
        :param q_: quantity
        :param mInd_: market index
        :param tInd_: trader index
        :param previousSig: Previous signature
        :param signature: Signature
        :param verifyKey: Verify key
        :return: colChk: Collateral check

        :Example:

        .. todo: Example
        """
        # Force/check inputs

        try:
            p_ = np.int64(p_)
            q_ = np.int64(q_)
            mInd_ = np.int64(mInd_)
            tInd = np.int64(tInd_)
            assert isinstance(p_, np.int64)
            assert isinstance(q_, np.int64)
            assert isinstance(mInd_, np.int64) and mInd_ > 0
            assert isinstance(tInd, np.int64) and mInd_ > 0
            inputChk = True
        except:
            inputChk = False

        # This creates the self.marketOutcomes array
        self.updateOutcomeCombinations(fromTrade=True)

        # Check if trader has correct verify key
        traderIdChk = self.getVerifyKey(tInd_) == verifyKey

        # Check if market exists
        marketIds = pd.read_sql('select distinct "marketId" from "marketBounds"', self.conn)["marketId"]
        marketChk = np.any(mInd_ == marketIds)

        # Check signature is right
        chainChk = previousSig == bytes(self.getPreviousOrder()['signature'][0])
        # Check signature for trade (Created in client)
        sigMsg =\
            str(p_).encode("utf-8")+\
            str(q_).encode("utf-8")+\
            str(mInd_).encode('utf-8')+\
            str(tInd_).encode("utf-8")+\
            previousSig + b'end'

        sigChk = self.checkSignature(signature, sigMsg,  verifyKey)
        # Convert sigChk to logical
        if isinstance(sigChk, bytes):
            sigChk = True

        # Sign current UTC timestamp
        ts = self.TimeServer.signedUTCNow()
        maxTS = pd.read_sql_query('select max("timeStampUTC") from "orderBook"', self.conn)['max'][0]
        if maxTS is None:
            maxTS = datetime.datetime.strptime(ts['timeStampUTC'], '%Y-%m-%d %H:%M:%S.%f')
        # Check time signature is valid and time server public key is registered and signature is newer than the recent maximum
        timeChk = self.verifyMessage(signatureMsg=bytes(ts['timeStampUTC'], 'utf-8'),
                                     signature=ts['timeStampUTCSignature'], verifyKey=ts['verifyKey']) and \
                  np.any(ts['verifyKey'] == self.tssTable['verifyKey']) and \
                  datetime.datetime.strptime(ts['timeStampUTC'], '%Y-%m-%d %H:%M:%S.%f') >= \
                  maxTS

        # Convert time signature check to logical
        if isinstance(timeChk, bytes):
            timeChk=True

        newTradeId = np.nan
        colChk = False
        if inputChk and traderIdChk and marketChk and sigChk and chainChk and timeChk:
            colChk, deets = self.checkCollateral(p_, q_, mInd_, tInd_)
            if colChk:
                # Append new trade


                newTrade = pd.DataFrame({ 'price': [p_],
                                          'quantity': [q_],
                                          'marketId': [mInd_],
                                          'traderId': [tInd_],
                                          'previousSig': previousSig,
                                          'signature': signature,
                                          'iMatched': [False],
                                          'iRemoved': [False],
                                          'timeStampUTC': ts['timeStampUTC'],
                                          'timeStampUTCSignature': ts['timeStampUTCSignature']})
                newTrade.to_sql(name='orderBook', con=self.conn, if_exists='append', index=False)

                # Check newTrade is there and get its id.
                # TODO: match signature directly in query if possible
                checkTrade = pd.read_sql_query('SELECT "tradeId", "signature" FROM "orderBook" WHERE "tradeId" = (SELECT max("tradeId") from "orderBook")', self.conn)
                if bytes(checkTrade.loc[0, 'signature']) == signature:
                    newTradeId = checkTrade.loc[0, 'tradeId']
                else:
                    newTradeId = np.nan

                # Check for matches
                matchTrade = pd.read_sql_query(
                    'SELECT "tradeId" FROM "orderBook" WHERE "price" = %s AND "quantity" = %s AND "iMatched" = FALSE AND "iRemoved" = FALSE' % (p_, -q_), self.conn)               # Find a match
                # Update
                if not matchTrade.empty:
                    # Update iMatched for matching trades
                    self.conn.execute(
                        'UPDATE "orderBook" SET "iMatched"= TRUE where "tradeId" IN (%s, (SELECT MAX("tradeId") FROM "orderBook"))' % (matchTrade['tradeId'][0]))

            # Clean up trades causing collateral to fail
            allClear = False
            while not allClear:
                colChk, deets = self.checkCollateral(tInd_ = tInd_)
                if colChk:
                    allClear = True
                else:
                    self.killMarginalOpenTrade(tInd_)

        return colChk, {'tradeId': newTradeId ,'inputChk': inputChk, 'traderIdChk': traderIdChk, 'marketChk':marketChk, 'sigChk': sigChk, 'chainChk':chainChk,
                            'timeChk': timeChk, 'colChk':colChk}

    # Collateral check


    def checkCollateral(self, p_=[], q_=[], mInd_ = [], tInd_=None) -> object:
        """Check collateral for new trade.

        :param p_: price
        :param q_: quantity
        :param mInd_: market index
        :param tInd_: trader index


        :Example:


               Example::
               ms = MarketServer()
               ... set up trade users/markets
               ms = ms.updateOutcomeCombinations

               """


        # Check collateral for new trade.
        #
        # p_, q_, mInd_, tInd_ - New trade
        # p, q, mInd, tInd - Existing trades
        # M - Market state payoffs
        # iMatched - Indicator for matched trades

        # Get p, q, mInd, tInd for trader
        data = pd.read_sql_query('SELECT "price", "quantity", "marketId", "traderId", "iMatched" FROM "orderBook" WHERE "traderId" = \'%s\' AND "iRemoved" = FALSE' % (tInd_),
                                               self.conn)
        self.p = np.int64(data['price'])
        self.q = np.int64(data['quantity'])
        self.mInd = np.int64(data['marketId'])  # (sort out unique marketId)
        self.tInd = np.int64(data['traderId'])
        self.iMatched = data['iMatched']
        # Test by appending test trade
        p = np.array(np.append(self.p, p_))
        q = np.array(np.append(self.q, q_))
        # If price is given, append.
        if p_:
            mInd = np.append(self.mInd, mInd_)
            tInd = np.append(self.tInd, tInd_)
            iMatched = np.append(self.iMatched, False)
        else:
            mInd = self.mInd
            tInd = self.tInd
            iMatched = self.iMatched

        M = self.marketOutcomes
        C, N = M.shape
        D = tInd.max()
        # Derived
        iUnmatched = np.logical_not(iMatched)
        T = len(p)  # Number of trades
        QD = np.tile(q, (D,1)).T   # Tiled quantity (traders)
        QC = np.tile(q, (C, 1)) # Tiled quantity (states)
        IM = self.ind2vec(mInd - 1,N).T# Indicator for market
        IQ = self.ind2vec(tInd-1,D) # Indicator for trader
        QDstar = QD*IQ # Tiled quantity distribured across traders
        Pstar = np.tile(p, (C, 1)) # Tiled price distributed across states
        Mstar = np.dot(M, IM) # Market outcomes across states and trades

        # Collateral calculation
        NC = np.dot((Mstar - Pstar), QDstar)
        NCstar = (Mstar-Pstar)*QC

        # Split out matched and unmatched
        matchedInd = np.where(iMatched)[0]
        unmatchedInd = np.where(iUnmatched)[0]
        NCstar_matched = NCstar[:,matchedInd]
        NCstar_unmatched = NCstar[:, unmatchedInd]

        #TC = np.sum(NCstar_matched, axis=1) + np.min(NCstar_unmatched, axis=1)


        # Total collateral calculation
        if NCstar_matched.shape[1] == 0 and NCstar_unmatched.shape[1] ==0:
            TC = NCstar_matched + NCstar_unmatched
        elif NCstar_matched.shape[1] == 0 and NCstar_unmatched.shape[1] > 0:
            TC = np.min(NCstar_unmatched, axis=1)
        elif NCstar_matched.shape[1] > 0 and NCstar_unmatched.shape[1]  == 0:
            TC = np.sum(NCstar_matched, axis=1)
        else:
            TC = np.sum(NCstar_matched, axis=1) + np.min(NCstar_unmatched, axis=1)


        worstCollateral =  TC + self.COLLATERAL_LIMIT

        colChk = np.all(worstCollateral>= 0)

        collateralDetails = dict(price = self.p, quantity = self.q, traderId = self.tInd, marketId = self.mInd, iMatched = self.iMatched, outcomes=NCstar, worstCollateral = worstCollateral)
        '''
        The collateral condition can be calculated simultaneously across all traders in one step by
        taking each column D columns of the second term as the minimum unmatched collateral for all 
        trades for each trader. 
        
        TODO: Do this as a table operation.
        '''

        return colChk, collateralDetails


    # Function group:
    # updateOutcomeCombinations
    # updateBounds

    def updateOutcomeCombinations(self, fromTrade: bool = False) -> None:
        """Update outcome combinations taking into account mins/maxes on
        branches.

        :param: None
        :return: self.outputCombinations:  (sql table) possible market states
        :return: self.marketOutcomes: (numpy nd array) Matrix of market outcome in each state
        :return: self.marketBounds: (sql table) Upper and lower bounds for all markets

        Example::
        ms = MarketServer()
        ... set up trade users/markets
        ms = ms.updateOutcomeCombinations

        """
        if not fromTrade:
            mT = pd.read_sql_table('marketTable', self.conn)
            # Root markets have marketBranchId ==1
            rootMarkets = mT.loc[mT['marketBranchId'] == 1, :].reset_index(drop=True)
            # Construct outcome combinations in root markets
            oC = self.constructOutcomeCombinations(rootMarkets)
            oC = oC.reset_index(drop=True)
            oC.to_sql('outcomeCombinations', self.conn, if_exists='replace', index=False)
            # Construct market bounds in all markets
            mB = self.constructMarketBounds(mT)
            marketFields = ['marketId','marketRootId', 'marketBranchId', 'marketMin', 'marketMax']
            mB = mB.loc[:, marketFields].reset_index(drop=True)
            # Full replace of market bounds
            mB.to_sql('marketBounds', self.conn, if_exists='replace', index=False)
        else:
            mB = pd.read_sql_table('marketBounds', self.conn)
            oC = pd.read_sql_table('outcomeCombinations', self.conn)


        numMarkets = len(mB)
        numStates = oC.loc[:, 'outcomeId'].max() + 1

        # Preallocate market outcomes
        M = np.zeros((numStates, numMarkets))
        if not fromTrade:
            for iOutcome in range(numStates):
                # Get outcome for root market
                outcomeRow = oC.loc[oC['outcomeId'] == iOutcome, :]
                # Add outcome to market table
                # todo: more elegant way to do this
                allOutcome = mT.loc[:, marketFields].append(outcomeRow[marketFields], ignore_index=True)
                # Construct new bounds given outcome
                settleOutcome = self.constructMarketBounds(allOutcome)
                # Markets settle at marketMin=marketMax so choose either
                M[iOutcome,] = settleOutcome.loc[:, 'marketMin'].values
                mTable = pd.DataFrame()
        # marketOutcomes is a (numStates * numMarkets) matrix of extreme market
        # states.
        self.marketOutcomes = M

    def updateBounds(self, L: int, U: int, l: int, u: int) -> object:
        """Update bounds from lower branches

        :param: L: (ndarray) lower bound for current market
        :param: U: (ndarray) upper bound for current market
        :param: l: (int64) lower bound for lower branches
        :param: u: (int64) upper bound for lower branches

        :return: L_new: (int64) new lower bound
        :return: U_new: (int64) new upper bound


        .. note::

        """

        L_new = np.min([np.max([L, l]), U])
        U_new = np.max([np.min([U, u]), L])

        return L_new, U_new

    # Function group:
    # constructOutcomeCombinations
    # constructMarketBounds
    # constructCartesianProduct
    # constructUnitVector

    def constructOutcomeCombinations(self, marketTable: object) -> pd.DataFrame:
        """Construct all possible outcome combinations for some table of markets.

        :param: marketTable: (DataFrame) marketTable with same columns as the SQL table
        :return: marketOutcomes: (DataFrame) [marketRootId, marketBranchId,
                                              marketMin, marketMax, outcomeId]


        .. note:: Market outcome ids created new when a new market is added.

        """
        marketExtrema = self.constructMarketBounds(marketTable)
        marketExtrema = \
            marketExtrema.loc[:, ['marketRootId', 'marketMin', 'marketMax']].drop_duplicates().reset_index(drop=True)

        # TODO: This should pull out the rows into an array (something less ugly)
        exOutcome = np.zeros((len(marketExtrema), 2))
        for iRow, mRow in marketExtrema.iterrows():
            exOutcome[iRow] = [mRow['marketMin'], mRow['marketMax']]

        # Construct all combinations of output
        marketCombinations = self.constructCartesianProduct(exOutcome)
        numCombinations = len(marketCombinations)
        numMarkets = len(marketCombinations[0])

        # Get unique markets
        mT = marketTable.loc[:, ['marketId','marketRootId', 'marketBranchId']].drop_duplicates().reset_index(drop=True)

        marketIds = mT.loc[:, 'marketRootId']
        mT.loc[:, 'marketMin'] = np.nan
        mT.loc[:, 'marketMax'] = np.nan

        marketOutcomes = pd.DataFrame()
        for iOutcome in range(numCombinations):
            for iMarket in range(numMarkets):
                mT.loc[mT['marketRootId'] == marketIds.loc[iMarket], ['marketMin']] = marketCombinations[iOutcome][iMarket]
                mT.loc[mT['marketRootId'] == marketIds.loc[iMarket], ['marketMax']] = marketCombinations[iOutcome][iMarket]
                mT['outcomeId'] = iOutcome

            marketOutcomes = pd.concat([marketOutcomes, mT], ignore_index=True)

        return marketOutcomes.reset_index(drop=True).drop_duplicates()

    def constructMarketBounds(self, marketTable: pd.DataFrame) -> pd.DataFrame:
        """Construct upper and lower bounds for all markets, taking into
        account the bounds of lower branchess.

        :param: marketTable: (DataFrame) marketTable with same columns as the SQL table
        :return: marketBounds: (DataFrame) with [marketRootId, marketBranchId, marketMin, marketMax]


        .. note::

        """

        # Pull market table
        mT = pd.read_sql_table('marketTable', self.conn)

        mT = mT.loc[:, ['marketId','marketRootId', 'marketBranchId']].drop_duplicates().reset_index(drop=True)
        mT['marketMin'] = np.nan
        mT['marketMax'] = np.nan

        for iMarket, marketRow in mT.iterrows():
            mRId = marketRow['marketRootId']
            mBId = marketRow['marketBranchId']
            # Get markets with the same root on equal or lower branch
            mTmp = marketTable.loc[(marketTable['marketRootId'] == mRId) & \
                                   (marketTable['marketBranchId'] <= mBId), :].reset_index(drop=True)

            L_ = np.zeros((len(mTmp), 1))
            U_ = np.zeros((len(mTmp), 1))
            for jMarket, mRow in mTmp.iterrows():
                L_tmp = mRow['marketMin']
                U_tmp = mRow['marketMax']
                if jMarket == 0:
                    L_[jMarket] = L_tmp
                    U_[jMarket] = U_tmp
                else:
                    # Update upper and lower bounds using lower branches
                    L_new, U_new = self.updateBounds(L_[jMarket - 1], U_[jMarket - 1], L_tmp, U_tmp)
                    L_[jMarket] = L_new
                    U_[jMarket] = U_new

            # Take last element of each
            mT.loc[iMarket, 'marketMin'] = L_[-1][0]
            mT.loc[iMarket, 'marketMax'] = U_[-1][0]

        # Take what we need back
        marketBounds = mT.loc[:, ['marketId', 'marketRootId', 'marketBranchId',
                                  'marketMin', 'marketMax']]

        return marketBounds.reset_index(drop=True)

    def constructCartesianProduct(self, input: np.ndarray) -> list:
        """Construct all possible combinations of a set

        :param: input: (ndarray) input set

        :return: cp: (list) combinations
        """
        cp = list(itertools.product(*input))
        return cp

    def constructUnitVector(self, L: int, x: int):
        """Make a vector of length L with a one in the x'th position

        :param: L: (int64) Length of unit vector
        :param: x: (int64) position of 1

        :return: u: (ndarray) unit vector

        """
        u = np.eye(int(L))[int(x)]
        return u

    # Function group:
    # getPreviousOrder


    def checkSignature(self, signature: bytes, sigMsg: bytes, verifyKey: str):
        # Check signature message
        return  self.verifyMessage(signature=signature, signatureMsg=sigMsg, verifyKey= verifyKey)


    def getPreviousOrder(self):
        # Get previous order. If there are no orders return a dummy order
        data = pd.read_sql_query(
            'SELECT "tradeId", "signature" FROM "orderBook" WHERE "tradeId" = (SELECT max("tradeId") FROM "orderBook")',self.conn)  # Find a match
        if not data.empty:
            return data
        else:
            return pd.DataFrame({'tradeId': [0], 'signature': ['sig'.encode('utf-8')]})


    def killMarginalOpenTrade(self, tInd_: int) -> None:
        # Find earliest unmatched trade
        data = pd.read_sql_query(
            'SELECT min("tradeId") FROM "orderBook" WHERE "traderId" = %s and "iMatched" = FALSE AND "iRemoved" = FALSE' % (tInd_), self.conn)  # Find a match
        # Kill earliest unmatched trade
        self.conn.execute('UPDATE "orderBook" SET "iRemoved"= TRUE where "tradeId" = %s' % (data['min'][0]))

    def getPreviousMarket(self) -> pd.DataFrame:
        """Get most recent market signature.

        Example::
             bs = BlocServer()
             bc = BlocClient()
             prevTrade = bs.getPreviousMarket()


        .. note:: Returns last trade the table or dummy market with
             signature = 's'
        .. :todo:: Better query to get most recent market


        :param None

        :return: previousMarket: (DataFrame) row of previous valid market
        """

        data = pd.read_sql_query(
            'SELECT * FROM "marketTable" order by "marketId" DESC limit 1',self.conn)  # Find a match
        if not data.empty:
            return data
        else:
            return pd.DataFrame({'tradeId': [0], 'signature': ['sig'.encode('utf-8')]})

    # Function group:
    # getVerifyKey
    # signMessage
    # verifyMessage
    # verifyTradeSignature
    # verifyMarketSignature
    # verifySignature

    def getVerifyKey(self, traderId: int) -> str:

        """Get verify key for trader

        :param: traderId: (int64) traderId

        :return: verifyKey: (str) verify key for traderId

        """
        queryStr = 'SELECT "verifyKey" FROM "userTable" WHERE "traderId" = \'%s\'' % (traderId)
        res = pd.read_sql(queryStr, self.conn)
        if not res.empty:
            verifyKey = res.verifyKey[0]
        else:
            verifyKey = 'null'
        return verifyKey

    def signMessage(self, msg: object, signingKey: object) -> object:
        """Sign a message

        :param: msg: message to sign
        :param: signingKey: signing key as hex

        :return: signed: signed message

        """

        # Convert hex key to bytes
        signingKey_bytes = b'%s' % str.encode(signingKey)
        # Generate signing key
        signingKey = nacl.signing.SigningKey(signingKey_bytes,
                                             encoder=nacl.encoding.HexEncoder)
        # Sign message
        signed = signingKey.sign(msg)
        return signed

    def verifyMessage(self, signature: bytes, signatureMsg: bytes, verifyKey: str) -> object:
        """Verify a signature

        :param: signature: (bytes) signature to check
        :param: signatureMsg: (bytes) message that signature is from
        :param: verifyKey: (str) verification key as string

        :return: verified: (bytes) returns signatureMsg if verified

        """

        verifyKey = nacl.signing.VerifyKey(verifyKey, encoder=nacl.encoding.HexEncoder)
        verified = verifyKey.verify(signatureMsg, signature=signature)
        return verified


    def verifySignature(self, traderId: int, signature: bytes, signatureMsg: bytes):
        """Vefify a signature message by looking up the verify key and checking

        :param: traderId: (int64) trader id
        :param: signature: (bytes) signature
        :param: signatureMsg: (bytes) signature message

        :return: sigChk: returns if verified

        """

        verifyKey = self.getVerifyKey(traderId=traderId)
        # Verify the message against the signature and verify key
        sigChk = self.verifyMessage(signature=signature, signatureMsg=signatureMsg, verifyKey=verifyKey)
        return sigChk

    def ind2vec(self, ind, N=None):
        ind = np.asarray(ind)
        if N is None:
            N = ind.max() + 1
        return (np.arange(N) == ind[:, None]).astype(int)

    def __repr__(self):
        return 'bloc is a limit order chain'


"""

TODO:
more tests
replace checkCollateral with query

"""
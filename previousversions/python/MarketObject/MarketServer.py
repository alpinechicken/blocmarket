# Data imports
import numpy as np
import numpy.matlib as npm
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, String, Float, \
    LargeBinary, BLOB, MetaData, update, ForeignKey
import os, platform

# Crypto imports
import nacl.encoding
import nacl.signing

# Other imports
import itertools



class MarketServer(object):
    """

    Market object that only allows q=1 or q=-1

    - Holds an order book (orderBook), user table (userTable), and list of
     markets (marketTable) for an contract settling between some
     minimum and maximum.
    - Interface for adding users (createUser), markets
    (createMarket), and orders (createTrade)
    - Market object handles collateral calculations and trade matching
    - Orders are signed from a previous valid orders. Orders can
    only be added to the order book. Public keys in the user table can
    verify trade and market chains.
    - Any root market can have any number of sub-markets that can only
    settle within the bounds of the previous markets.
    - Each order has three components specified by tradeBranchId:

              1 = Primary (trade initially placed in order book)
              2 = Offset (offset to a primary trade => signature from primary)
              3 = Match (matched version of primary trade => signature from offset)
    - Each time a new market is added or new bounds are set for an
    existing market, the possible extreme market values are (re)calculated.

    """

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
            DATABASE_URL = os.environ['DATABASE_URL']

        self.engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        self.userTable = Table('userTable', self.metadata,
                               Column('traderId', Integer, primary_key=True),
                               Column('verifyKey', String),
                               )
        # Order book for all trades, including including order book,
        # matched, and linked trades (offsets, partials, etc)
        self.orderBook = Table('orderBook', self.metadata,
                               Column('tradeRootId', Integer),
                               Column('tradeBranchId', Integer),
                               Column('price', Float),
                               Column('quantity', Float),
                               Column('marketRootId', Integer),
                               Column('marketBranchId', Integer),
                               Column('traderId', Integer),
                               Column('previousSig', LargeBinary),
                               Column('signatureMsg', LargeBinary),
                               Column('signature', LargeBinary),
                               )

        # Cache order book (trades can be promoted to the order book)
        self.cacheBook = Table('cacheBook', self.metadata,
                               Column('tradeRootId', Integer),
                               Column('tradeBranchId', Integer),
                               Column('price', Float),
                               Column('quantity', Float),
                               Column('marketRootId', Integer),
                               Column('marketBranchId', Integer),
                               Column('traderId', Integer),
                               Column('previousSig', LargeBinary),
                               Column('signatureMsg', LargeBinary),
                               Column('signature', LargeBinary),
                               )

        # Market table with minimum and maximum of each market.
        self.marketTable = Table('marketTable', self.metadata,
                                 Column('marketRootId', Integer),
                                 Column('marketBranchId', Integer),
                                 Column('marketMin', Float),
                                 Column('marketMax', Float),
                                 Column('traderId', Integer),
                                 Column('previousSig', LargeBinary),
                                 Column('signatureMsg', LargeBinary),
                                 Column('signature', LargeBinary),
                                 )

        # Market state (possible combinationss)
        self.outcomeCombinations = Table('outcomeCombinations', self.metadata,
                                         Column('outcomeId', Integer, primary_key=True),
                                         Column('marketRootId', Integer),
                                         Column('marketBranchId', Integer),
                                         Column('marketMin', Float),
                                         Column('marketMax', Float),
                                         )

        # Possible combinations of root market outcomes
        self.marketBounds = Table('marketBounds', self.metadata,
                                  Column('marketRootId', Integer),
                                  Column('marketBranchId', Integer),
                                  Column('marketMin', Float),
                                  Column('marketMax', Float),
                                  )

        # Trade state
        self.tradeState = Table('tradeState', self.metadata,
                                Column('tradeRootId', Integer),
                                Column('tradeBranchId', Integer),
                                Column('isOpen', Integer),
                                Column('isOffset', Integer),
                                Column('isMatched', Integer)
                                )

        # Numpy array with market outcomes in each state (used for collateral calculations)
        self.marketOutcomes = np.array
        # Collateral limit for each trader
        self.COLLATERAL_LIMIT = -2

        # Create all tables
        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()

    def purgeTables(self):
        """ Purge all tables before starting a test. """
        self.userTable.delete().execute()
        self.orderBook.delete().execute()
        self.cacheBook.delete().execute()
        self.marketTable.delete().execute()
        self.marketBounds.delete().execute()
        self.tradeState.delete().execute()
        self.outcomeCombinations.delete().execute()
        print("All tables deleted.")

    def purgeNonUserTables(self):
        """ Purge all tables before starting a test"""
        self.orderBook.delete().execute()
        self.cacheBook.delete().execute()
        self.marketTable.delete().execute()
        self.marketBounds.delete().execute()
        self.tradeState.delete().execute()
        self.outcomeCombinations.delete().execute()
        print("All tables except userTable deleted.")

    # Function group (API):
    # createUser
    # createMarket
    # createTrade

    def createUser(self, verifyKey_hex: str) -> object:

        """ Create a new user and adds to userTable.

        :param verifyKey_hex: (str) verify key
        :return newUsrRow: (DataFrame) new user row
        :return self.userTable: (sql table) new row of userTable

        :Example:

        ms = MarketServer()
        ms.createUser('8d708ff647f671b29709a39c5f1529b06d6841fa268f03a834ebf6aad5e6d8e4')

        :Example:

        mc = MarketClient()
        mc.generateSignatureKeys
        ms = MarketServer()
        ms.createUser(mc.verifyKey_hex)

        .. note::
        - Verify key constructed with MarketClient.generateSignaureKeys()
        - Successful call adds new column to userTable.

        .. todo:: check that this is a valid key.
]        """

        # Check if this key is already in userTable
        userTable = pd.read_sql_query('SELECT * FROM "userTable" WHERE "verifyKey" = \'%s\'' % (verifyKey_hex),
                                      self.conn)
        if not userTable.empty:
            print('Username already exists, sorry buddy.')
        else:
            traderId = len(pd.read_sql_table("userTable", self.conn)) + 1
            # Create the new user
            newUsr = dict(verifyKey=verifyKey_hex, traderId=int(traderId))
            # Insert to usertable (autoincrements traderId)
            self.conn.execute(self.userTable.insert(), [newUsr, ])
            # Pull back row to get traderID
            newUsrRow = pd.read_sql_query('SELECT * FROM "userTable" WHERE "verifyKey" = \'%s\'' % (verifyKey_hex),
                                          self.conn)

        # Return new user
        return newUsrRow.loc[0].to_dict()

    def createMarket(self, newMarket: pd.DataFrame) -> bool:
        """
        Create a new row in marketTable. Update existing market
        with new bounds if market already exists.

        :param newMarket: (DataFrame) columns [traderId, marketMin,
        marketMax, marketRootId, marketBranchId, previousSignature,
        signatureMsg, signature]
        :return checks: (boolean) - True if checks pass
        :return self.marketTable: - new row in market table
        :return self.outputCombinations: - updated output combinations  table
        :return: self.marketBounds: - updated market bounds

        :Example:
        ms = MarketServer()
        mc = MarketClient()
        ...
        prevMarket = ms.getPreviousMarket()
        marketRow = pd.DataFrame({'marketRootId': [1],
                                   'marketBranchId': [1],
                                   'marketMin': [0],
                                   'marketMax': [1],
                                   'traderId': [1]})
        testMarket = mc.marketMaker(previousMarketRow=prevMarket,
                                    marketRow=marketRow)
        ms.createMarket(newMarket=testMarket)

        .. note::
        Input DataFrame constructed with MarketClient.marketMaker()
        Successful call:
             * Adds new row to marketTable
             * Updates outcomeCombinations table
             * Updates marketBounds (table) with upper and lower bounds for
              all markets

        .. todo:: Input check for valid key
        .. todo:: Some kind of informative output
        """

        mT = pd.read_sql_table('marketTable', self.conn)

        # Check signature chain for market
        if mT.empty:
            # If there are no existing markets chain is ok
            chainChk = True
        else:
            # Check that the previous sig of new market is the sig of the
            # previous market
            prevMarket = self.getPreviousMarket()
            chainChk = newMarket.loc[0, 'previousSig'] == prevMarket.loc[0, 'signature']

        # If market exists...
        matchCurrentMarket = pd.merge(left=mT, right=newMarket, on=['marketRootId', 'marketBranchId'])
        ownerChk = True
        if not matchCurrentMarket.empty:
            # Check that trader owns it
            ownerChk = matchCurrentMarket.loc[0, 'traderId_x'] == matchCurrentMarket.loc[0, 'traderId_y']

        # Verify market signature is valid
        sigChk = self.verifyMarketSignature(newMarket)
        # Convert sigChk to logical
        if isinstance(sigChk, bytes):
            sigChk = True
        # Check market range
        marketRangeChk = newMarket.loc[0, 'marketMin'] <= newMarket.loc[0, 'marketMax']
        # Checks (correct market number, signature relative to parent, range)
        checks = marketRangeChk and sigChk and chainChk and ownerChk

        #  Add market to table if checks pass
        if checks:
            newMarket.to_sql(name='marketTable', con=self.conn, if_exists='append', index=False)
            # Update all possible combinations of root markets
            self.updateOutcomeCombinations()
        else:
            print('Signature does not match, bad signature chain, or else marketMin > marketMax. Market not added.')

        # Return True if checks pass and market added
        return checks

    def createTrade(self, tradePackage: pd.DataFrame) -> bool:
        """
            Add components of a trade to tradeTable and cacheTable.

           - Check package of primary+offset+match trades exist and
            are valid
            - Check trade signatures
            - Check that sufficient collateral exists for primary trade
            (checkCollateral)
            - Add primary trade to this.orderBook
            - Add all other (offset/match/better price) trades to this.cacheBook
            - Match trades


             Example::
             ms = MarketServer()
             mc = MarketClient()
             ...
             prevTrade = ms.getPreviousTrade()
             tradeRow = pd.DataFrame({'marketRootId': [1],
                              'marketBranchId': [1],
                              'price': [0.5],
                              'quantity': [1],
                              'traderId': [1]})
             tradePackage = mc.tradeMaker(prevTrade=prevTrade,tradeRow=tradeRow)
             ms.createTrade(tradePackage=tradePackage)

             .. note:: tradeMaker constructs the package with primary/offset/match
             and adds the correct signatures.


        :param tradePackage: (DataFrame) trade package with primary/offset/match
            and backup trades (from tradeMaker in MarketClient)

        :return allTradeChecks: (boolean) True if all trade checks pass
        :return colChk: (boolean) True if collateral checks pass
        :return: self.orderBook: (sql table)
        :return: self.cacheBook: (sql table)
        """

        mT = pd.read_sql_table('marketTable', self.conn)
        oB = pd.read_sql_table('orderBook', self.conn)

        pTrades = tradePackage[tradePackage['tradeBranchId'] == 1].reset_index(drop=True)
        oTrades = tradePackage[tradePackage['tradeBranchId'] == 2].reset_index(drop=True)
        mTrades = tradePackage[tradePackage['tradeBranchId'] == 3].reset_index(drop=True)

        # Check that trade package structure makes sense

        # Same trader id and root id
        chk1 = pTrades.loc[0, 'traderId'] == oTrades.loc[0, 'traderId'] and \
               oTrades.loc[0, 'traderId'] == mTrades.loc[0, 'traderId']
        chk2 = pTrades.loc[0, 'tradeRootId'] == oTrades.loc[0, 'tradeRootId'] and \
               oTrades.loc[0, 'tradeRootId'] == mTrades.loc[0, 'tradeRootId']
        # Trade branch id1 for primary, 2 for offset, 3 for match
        chk3 = pTrades.loc[0, 'tradeBranchId'] == 1
        chk4 = oTrades.loc[0, 'tradeBranchId'] == 2
        chk5 = mTrades.loc[0, 'tradeBranchId'] == 3
        # Same price for all
        chk6 = pTrades.loc[0, 'price'] == oTrades.loc[0, 'price'] and oTrades.loc[0, 'price'] == \
               mTrades.loc[0, 'price']
        # Same absolute quantity
        chk7 = abs(pTrades.loc[0, 'quantity']) == abs(oTrades.loc[0, 'quantity']) and \
               abs(oTrades.loc[0, 'quantity']) == abs(mTrades.loc[0, 'quantity'])
        # Opposite signs for primary and offset
        chk8 = np.sign(pTrades.loc[0, 'quantity']) == -1 * np.sign(oTrades.loc[0, 'quantity']) and \
               -1 * np.sign(oTrades.loc[0, 'quantity']) == np.sign(mTrades.loc[0, 'quantity'])
        # Same market root
        chk9 = pTrades.loc[0, 'marketRootId'] == oTrades.loc[0, 'marketRootId'] and \
               oTrades.loc[0, 'marketRootId'] == mTrades.loc[0, 'marketRootId']
        # Same market branch
        chk10 = pTrades.loc[0, 'marketBranchId'] == oTrades.loc[0, 'marketBranchId'] and \
                oTrades.loc[0, 'marketBranchId'] == mTrades.loc[0, 'marketBranchId']
        # All primary/offset/match checks
        primaryOffsetMatchChk = all([chk1, chk2, chk3, chk4, chk5, \
                                     chk6, chk7, chk8, chk9, chk10])

        #  Check quantity is -1 or 1
        validTradeQuantityChk = all(np.in1d(pTrades.loc[0, 'quantity'], [-1, 1]))

        # Check that market root/branch combination exists in marketTable
        if ((pTrades.loc[0, 'marketRootId'] == mT['marketRootId']) & \
            (pTrades.loc[0, 'marketBranchId'] == mT['marketBranchId'])).any():
            validMarketChk = True
        else:
            validMarketChk = False
            print('Market root and or branch does not exist.')

        # Pre-allocate checks
        sigChkPrimary = np.zeros((len(pTrades), 1), dtype=bool)
        chainChkPrimary = np.zeros((len(pTrades), 1), dtype=bool)
        sigChkOffset = np.zeros((len(pTrades), 1), dtype=bool)
        chainChkOffset = np.zeros((len(pTrades), 1), dtype=bool)
        sigChkMatch = np.zeros((len(pTrades), 1), dtype=bool)
        chainChkMatch = np.zeros((len(pTrades), 1), dtype=bool)

        # Verify signatures
        for iTrade in range(len(pTrades)):
            pTradeRow = pTrades.loc[[iTrade]].reset_index(drop=True)
            sigChkPrimary[iTrade] = self.verifyTradeSignature(pTradeRow)
            if not oB.empty:
                # Find previous trade
                prevTrade = oB[oB['signature'] == pTradeRow.loc[0, 'previousSig']]
                #  Find previous valid trade.
                prevValidTrade = self.getPreviousTrade()
                # Check that signature matches
                chainChkPrimary[iTrade] = prevTrade['signature'] == prevValidTrade.loc[0, 'signature']
            else:
                # Chain valid if this is the first trade
                chainChkPrimary[iTrade] = True

            # Check signature of the offset trade
            sigChkOffset[iTrade] = self.verifyTradeSignature(oTrades.loc[[iTrade], :].reset_index(drop=True))
            # Check previous signature of offset is signature of primary
            chainChkOffset[iTrade] = oTrades.loc[iTrade, 'previousSig'] == pTradeRow.loc[0, 'signature']
            # Check signature of match trade
            sigChkMatch[iTrade] = self.verifyTradeSignature(mTrades.loc[[iTrade], :].reset_index(drop=True))
            # Check previous  signature of matched trade is signature of offset
            chainChkMatch[iTrade] = mTrades.loc[iTrade, 'previousSig'] == oTrades.loc[iTrade, 'signature']

        # All signatures check out
        sigChk = all(np.concatenate([sigChkPrimary, sigChkOffset, sigChkMatch]))
        # All chains check out
        chainChk = all(np.concatenate([chainChkPrimary, chainChkOffset, chainChkMatch]))
        allTradeChecks = all([primaryOffsetMatchChk, validTradeQuantityChk,
                              validMarketChk, sigChk, chainChk])

        # If all checks pass, add new trade in orderBook and post the rest to
        # cacheBook
        colChk = False
        if allTradeChecks:
            primaryTrades = pTrades
            offsetTrade = oTrades
            matchTrade = mTrades
            # New trade is first primary trade
            newTrade = primaryTrades.loc[[0], :]
            # Alternative primary trades are other primary trades in the package
            altPrimaryTrades = primaryTrades.loc[1:, :]
            # Update outcome combinations  (needed for checkCollateral)
            self.updateOutcomeCombinations()
            # Check collateral on first primary trade

            colChk, colChkAll = self.checkCollateral(newTrade)
            if colChk:
                # Add primary trade to order book
                self.writeNewTrade(newTrade)
                # Add offset and match trades to cache order book
                self.writeCacheTrades(altPrimaryTrades)
                self.writeCacheTrades(offsetTrade)
                self.writeCacheTrades(matchTrade)
                self.matchTrades()
            else:
                print("Failed collateral check. Bleh.")

        return colChk, allTradeChecks

    # Function group:
    # getPreviousTrade - previous  valid trade (for chain)
    # getPreviousMarket - previous valid market (for chain)

    def getPreviousTrade(self):
        """Previous trade is the highest trade branch on the highest trade
        root in the orderBook table

        Example::
             ms = MarketServer()
             mc = MarketClient()
             ... add users/markets/trades
             prevTrade = ms.getPreviousTrade()


        .. note:: If there are no trades, returns root trade with
             signature = 's'.

        .. :todo:: do with sql query


        :param None

        :return: previousTrade: (DataFrame) row of previous valid trade

        """
        oB = pd.read_sql_table("orderBook", self.conn)

        if not oB.empty:
            maxTrade = oB[oB['tradeRootId'] == np.max(oB['tradeRootId'])]
            previousTrade = maxTrade[maxTrade['tradeBranchId'] == np.max(maxTrade['tradeBranchId'])]
        else:
            # Return root trade
            previousTrade = pd.DataFrame({'tradeRootId': [0], 'signature': ['s'.encode('utf-8')]})

        return previousTrade.reset_index(drop=True)

    def getPreviousMarket(self):
        """Get most recent market signature.

        Example::
             ms = MarketServer()
             mc = MarketClient()
             prevTrade = ms.getPreviousMarket()


        .. note:: Returns last trade the table or dummy market with
             signature = 's'
        .. :todo:: do with sql query


        :param None

        :return: previousMarket: (DataFrame) row of previous valid market
        """

        mT = pd.read_sql_table('marketTable', self.conn)

        if mT.empty:
            # Dummy market if marketTable is empty
            previousMarket = pd.DataFrame({'marketRootId': [0], 'signature': ['s'.encode('utf-8')]})
        else:
            # previousMarket is max branch on max root
            maxMarketRoot = mT.loc[mT.marketRootId == np.max(mT.marketRootId)]
            maxMarketBranch = maxMarketRoot.loc[maxMarketRoot.marketBranchId == np.max(maxMarketRoot.marketBranchId)]
            previousMarket = maxMarketBranch.iloc[0].to_frame().transpose()
            #     todo: more elegant way to get the last market

        return previousMarket.reset_index(drop=True)

    # Function group:
    # updateTradeState (update state of open/offset/matched trades)
    # updateOutcomeCombinations (update possible combinations from base markets)

    def updateTradeState(self):
        """Update trade state indicators (open/offset/matched).

        Example::
        ms = MarketServer()
        ... add users/markets/trades
        ms = updateTradeState()

        :param None
        :return self.tradeState: (sql table) columns [tradeRootId, tradeBranchId
                                                      isOpen, isOffset, isMatched]

        Example::
        ms = MarketServer()
        ... set up trade users/markets/trades
        ms = ms.updateTradeState

        """

        oB = pd.read_sql_table('orderBook', self.conn)
        # Calculate number of of branches on trade
        numelOrderBook = oB.groupby(['traderId', 'tradeRootId', 'price']).size().reset_index(name='counts')
        # Check number of components of the trade
        openOrders = numelOrderBook.loc[numelOrderBook.loc[:, 'counts'] == 1, 'tradeRootId']
        offsetOrders = numelOrderBook.loc[numelOrderBook.loc[:, 'counts'] == 2, 'tradeRootId']
        matchedOrders = numelOrderBook.loc[numelOrderBook.loc[:, 'counts'] == 3, 'tradeRootId']

        # Indicators for open/offset/matched
        oB.loc[:, 'isOpen'] = np.in1d(oB.loc[:, 'tradeRootId'], openOrders)
        oB.loc[:, 'isOffset'] = np.in1d(oB.loc[:, 'tradeRootId'], offsetOrders)
        oB.loc[:, 'isMatched'] = np.in1d(oB.loc[:, 'tradeRootId'], matchedOrders)

        # Save indicators to tradeStateTable
        tradeState = oB.loc[:, ['tradeRootId', 'tradeBranchId', 'isOpen', 'isOffset', 'isMatched']]
        # Keep track of trade state in sql table
        tradeState.to_sql('tradeState', self.conn, if_exists='replace', index=False)

    def updateOutcomeCombinations(self):
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

        mT = pd.read_sql_table('marketTable', self.conn)
        # Root markets have marketBranchId ==1
        rootMarkets = mT.loc[mT['marketBranchId'] == 1, :].reset_index(drop=True)
        # Construct outcome combinations in root markets
        oC = self.constructOutcomeCombinations(rootMarkets)
        oC = oC.reset_index(drop=True)
        oC.to_sql('outcomeCombinations', self.conn, if_exists='replace', index=False)
        # Construct market bounds in all markets
        mB = self.constructMarketBounds(mT)
        marketFields = ['marketRootId', 'marketBranchId', 'marketMin', 'marketMax']
        mB = mB.loc[:, marketFields].reset_index(drop=True)
        # Full replace of market bounds
        mB.to_sql('marketBounds', self.conn, if_exists='replace', index=False)

        numMarkets = len(mB)
        numStates = oC.loc[:, 'outcomeId'].max() + 1
        # Preallocate market outcomes
        M = np.zeros((numStates, numMarkets))

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
        # marketOutcomes is a (numStates * numMarkets) matrix of extreme market
        # states.
        self.marketOutcomes = M

    def checkCollateral(self, newTrade=pd.DataFrame()):
        """ Check if sufficient collateral exists for a newTrade by
        constructing all output combinations for the trader.

        :param: newTrade: (DataFrame) row with same fields as orderBook
        :return: colChk:  (ndarray) logical for collateral check for each trader
        :return: netCollateral: (ndarray) Matrix of net collateral to each trader in eacn
        state

        Example::
        ms = MarketServer()
        ... set up trade users/markets
        colChk, netCollateral = ms.checkCollateral

        """

        oB = pd.read_sql_table('orderBook', self.conn)
        mB = pd.read_sql_table('marketBounds', self.conn)
        uT = pd.read_sql_table('userTable', self.conn)
        oC = pd.read_sql_table('outcomeCombinations', self.conn)
        tS = pd.read_sql_table('tradeState', self.conn)

        if not newTrade.empty:
            # Add indicators to new trade
            newTrade = newTrade.assign(isOpen=newTrade.tradeBranchId == 1)
            newTrade = newTrade.assign(isOffset=newTrade.tradeBranchId == 2)
            newTrade = newTrade.assign(isMatched=newTrade.tradeBranchId == 3)

        # Add states to order book
        if not tS.empty:
            oB = pd.merge(oB, tS)
        # Add new trade with state
        allTrades = pd.concat([oB, newTrade], ignore_index=True, sort=False)
        # Force indicators to be boolean
        allTrades[['isOpen', 'isOffset', 'isMatched']] = allTrades[['isOpen', 'isOffset', 'isMatched']].astype(bool)
        # Get numbers of things
        numTrades = len(allTrades.index)
        numOpenTrades = allTrades['isOpen'].sum()
        numMarkets = len(mB.index)
        numTraders = uT['traderId'].max()
        numStates = oC['outcomeId'].max() + 1

        # Create (numMarkets x numTrades) IM matrix indicating which market
        # trades belong to

        # Preallocate market indicator matrix
        IM = np.ndarray((numMarkets, numTrades))

        for iTrade in range(numTrades):
            marketInd = np.where((allTrades.loc[iTrade, 'marketRootId'] == mB['marketRootId']) & \
                                 (allTrades.loc[iTrade, 'marketBranchId'] == mB['marketBranchId']))
            IM[:, iTrade] = self.constructUnitVector(numMarkets, marketInd[0][0])

        # Create (numTrades x numTraders) IQ matrix indicating which trader
        # each trade belongs to
        IQ = np.ndarray((numTrades, numTraders))
        for iTrade in range(numTrades):
            IQ[iTrade, :] = self.constructUnitVector(numTraders, allTrades.loc[iTrade, 'traderId'] - 1)
        # Get price and quantity
        p = allTrades['price'].values  # (1 x numTrades)
        q = allTrades['quantity'].values  # (1 x numTraders

        # Get precalculated market outcome matrix
        M = self.marketOutcomes  # (numStates x numMarkets)

        # Market outcomes (numStates x numMarkets)
        # Debug lines
        # np.savetxt('mstar.txt', M, fmt='%1.4e')
        # np.savetxt('m_nostar.txt', IM, fmt='%1.4e')
        Mstar = np.matmul(M, IM)
        # Quantities (numTrades x numTraders)
        Qstar = np.multiply(npm.repmat(q, numTraders, 1).transpose(), IQ)
        # Prices (numStates x numTrades)
        Pstar = npm.repmat(p, numStates, 1)

        # Net collateral for matched trades (numStates x numTraders)
        NC_matched = np.matmul(Mstar[:, np.where(allTrades['isMatched'])[0]] - \
                               Pstar[:, np.where(allTrades['isMatched'])[0]], \
                               Qstar[np.where(allTrades['isMatched'])[0], :])

        # Minimum collateral for open trades (including new trade)
        Mstar_ = Mstar[:, np.where(allTrades['isOpen'])[0]]
        Pstar_ = Pstar[:, np.where(allTrades['isOpen'])[0]]
        NC_open = np.ndarray(NC_matched.shape)
        if numOpenTrades > 0:
            for iTrader in range(numTraders):
                Qstar_ = Qstar[np.where(allTrades['isOpen'])[0], iTrader]
                if Qstar_.size == 0:
                    Qstar_ = np.ndarray((numOpenTrades, 1))
                # Mimiumum payoff for open trade
                NC_open[:, iTrader] = np.min(np.multiply(Mstar_ - Pstar_, npm.repmat(Qstar_, numStates, 1)), axis=1)

        # Collateral available under all worst outcomes
        netCollateral = NC_matched + NC_open
        # Indicator for which traders fail collateral check
        colChkAll = (netCollateral >= self.COLLATERAL_LIMIT).all(axis=0)
        # Collateral check for trader
        if not newTrade.empty:
            # Return if trader is ok cofr collateral
            colChk = colChkAll[int(newTrade.loc[0, 'traderId'] - 1)]
        else:
            colChk = colChkAll

        return colChk, netCollateral

    def matchTrades(self):
        """"
        Matches trades in orderBook.

        - Checks if matchable trade exists
        - Checks collateral for both sides
        - Writes trades (adds offsetting unmatched trade and
         corresponding matched trade)

        :param: None
        :return: self.orderBook: (sql table)  adds relevant trades to order book


        Example::
        ms = MarketServer()
        ... set up trade users/markets
        ms.matchTrades()

        .. note::
        """

        mT = pd.read_sql_table('marketTable', self.conn)
        cB = pd.read_sql_table('cacheBook', self.conn)
        # Iterate through markets
        for iMarket in range(len(mT)):
            allMatched = False
            marketRow = mT.loc[[iMarket], :]
            while not allMatched:
                # Get current unmatched trades for target market
                oB = pd.read_sql_table('orderBook', self.conn)
                tS = pd.read_sql_table('tradeState', self.conn)
                # Only consider open trades from target market
                oB = pd.merge(oB, marketRow.loc[:, ['marketRootId', 'marketBranchId']], how='inner')
                oB = pd.merge(oB, tS.loc[tS.loc[:, 'isOpen'], :], how='inner')
                # Combine with matching primary trades from cacheBook
                combinedBook = pd.concat(
                    [oB, cB.loc[cB['tradeBranchId'] == 1 &
                                (np.in1d(cB['tradeRootId'], oB['tradeRootId'].unique())), :]], sort=False)

                # Separate bids from asks
                bids = combinedBook.loc[combinedBook.loc[:, 'quantity'] == 1, :]
                asks = combinedBook.loc[combinedBook.loc[:, 'quantity'] == -1, :]
                # Get matching trades
                matchingTrades = pd.merge(bids[['tradeRootId', 'price']], asks[['tradeRootId', 'price']], how='inner',
                                          on=['price'], suffixes=('_bid', '_ask'))

                if not matchingTrades.empty:
                    # Pick first trade  for match (todo: use trade precedence and match trades down through the order book)
                    matchTrade = matchingTrades[:1]
                    # Get max bid
                    maxBid = bids.loc[(bids.loc[:, 'price'] == matchTrade.loc[0, 'price'])
                                      & (bids.loc[:, 'tradeRootId'] == matchTrade.loc[0, 'tradeRootId_bid'])]
                    # Get min ask
                    minAsk = asks.loc[(asks.loc[:, 'price'] == matchTrade.loc[0, 'price'])
                                      & (asks.loc[:, 'tradeRootId'] == matchTrade.loc[0, 'tradeRootId_ask'])]

                    # Only take the first row (if duplicates exist)
                    maxBid = maxBid[:1]
                    minAsk = minAsk[:1]

                    # Write trades to orderBook

                    # TODO: use cache primary orders and tradeRootId for precedence
                    # Note: Just keeping it simple but this can ignores
                    # precedence. At some point this can probably be
                    # abstracted to a matching mechanism andin a separate
                    # function.
                    self.writeMatchedTrade(maxBid)
                    self.writeMatchedTrade(minAsk)
                else:
                    allMatched = True

        # Clean up any trades that cause the collateral check to fail
        allClear = False
        while not allClear:
            colChk, colChkAll = self.checkCollateral()
            if np.all(colChk):
                allClear = True
            else:
                # Find traders failing collateral check
                tIds = np.where(~ colChk)[0]
                for iTrader in range(len(tIds)):
                    # Remove marginal open trade for failing traders. Trades
                    # are removed by moving their offset trades from the
                    # cache order book.
                    self.writeRemoveTrade(tIds[iTrader] + 1)

                # Check collateral again
                colChk, colChkAll = self.checkCollateral()
                if np.all(colChk):
                    #  Collateral checks pass
                    allClear = True

    # Function group:
    # writeNewTrade
    # writeMatchedTrade
    # writeRemoveTrade
    # writeCacheTrades

    def writeNewTrade(self, newTrade):
        """Write new trade to order book.
        :param: newTrade: (DataFrame) trade with same columns as orderBook
        :return: self.orderBook: (sql table) adds relevant trades to order book


        .. note:: Called from self.createTrade()

        """
        # Add trade to order book
        newTrade.to_sql(name='orderBook', con=self.conn, if_exists='append', index=False)
        # Update tradeState given new trade
        self.updateTradeState()

    def writeMatchedTrade(self, targetTrade):
        """Write matched trade to order book.
        :param: targetTrade: (DataFrame) trade with same columns as orderBook
        :return: self.orderBook: (sql table) adds relevant trades to order book


        .. note:: Called from self.matchTrades()

        """
        # Find offset and append to table
        offsetTrade = self.findOffsetTrade(targetTrade)
        offsetTrade.to_sql(name='orderBook', con=self.conn, if_exists='append', index=False)
        # Find matched trades and append to table
        matchedTrade = self.findMatchedTrade(offsetTrade)
        matchedTrade.to_sql(name='orderBook', con=self.conn, if_exists='append', index=False)
        # Update trade state given this new trade
        self.updateTradeState()

    def writeRemoveTrade(self, traderId):
        """Remove trade  by writing offsetting trade to orderBook.

        :param: traderId: (int) traderId to remove trade from
        :return: self.orderBook: (sql table) adds relevant trades to order book


        .. note:: Called from self.matchTrades()

        """
        # Write offset to original unmatched trade (previous sig
        # from root trade).

        # Get the candidate trade to remove for this trader
        removeTrade = self.findRemoveTrade(traderId)
        # Get the candidate offset trade
        offsetTrade = self.findOffsetTrade(removeTrade)
        # Add offset trade to order book
        offsetTrade.to_sql(name='orderBook', con=self.conn, if_exists='append', index=False)

        self.updateTradeState()

    def writeCacheTrades(self, cacheTrades):
        """Add cache trades to cacheBook.

        Cache trades are trades that might be needed in the future but
        don't belong in the orderBook yet. Includes offset and match trades
        when the primary is in orderBook, and trades at better prices that
        might be crossed against an existing open order.

        :param: cacheTrades: (DataFrame) cache trades with same columns as cacheBook
        :return: self.cacheBook: (sql table) adds relevant trades to order book


        .. note:: Called from self.createTrade()

        """

        # Reset index
        cacheTrades.reset_index(inplace=True, drop=True)
        # Append  to cacheBook
        cacheTrades.to_sql(name='cacheBook', con=self.conn, if_exists='append', index=False)

    # Function group:
    # findOffsetTrade
    # findMatchedTrade
    # findRemoveTrade

    def findOffsetTrade(self, targetTrade):
        """Find offsetting trade.

        :param: targetTrade: (DataFrame) trade to find offset from
        :return: offsetTrade: (DataFrame) offsetting trade to targetTrade


        .. note:: Called from self.writeRemoveTrade()

        """

        # Reset index
        targetTrade.reset_index(inplace=True, drop=True)

        # Find offset in cacheBook
        cB = pd.read_sql_table('cacheBook', self.conn)
        isOffset = (cB.loc[:, 'previousSig'] == targetTrade.loc[0, 'signature']) & \
                   (cB.loc[:, 'price'] == targetTrade.loc[0, 'price']) & \
                   (cB.loc[:, 'tradeRootId'] == targetTrade.loc[0, 'tradeRootId']) & \
                   (cB.loc[:, 'tradeRootId'] == targetTrade.loc[
                       0, 'tradeRootId']) & \
                   (cB.loc[:, 'traderId'] == targetTrade.loc[0, 'traderId'])
        offsetTrade = cB.loc[isOffset, :]

        return offsetTrade

    def findMatchedTrade(self, offsetTrade):
        """Find matched trade.

        :param: offsetTrade: (DataFrame) trade to find match from
        :return: matchedTrade: (DataFrame) match trade


        .. note:: Called from self.writeMatchedTrade()

        """
        # Reset  index
        offsetTrade.reset_index(inplace=True, drop=True)
        # Load up the cache book
        # todo: better as a sql query to return matchedTrade
        cB = pd.read_sql_table('cacheBook', self.conn)
        isMatch = (cB.loc[:, 'previousSig'] == offsetTrade.loc[0, 'signature']) & \
                  (cB.loc[:, 'price'] == offsetTrade.loc[0, 'price']) & \
                  (cB.loc[:, 'tradeRootId'] == offsetTrade.loc[0, 'tradeRootId']) & \
                  (cB.loc[:, 'tradeBranchId'] == 3) & \
                  (cB.loc[:, 'traderId'] == offsetTrade.loc[0, 'traderId'])

        matchedTrade = cB.loc[isMatch, :]

        return matchedTrade

    def findRemoveTrade(self, traderId: int) -> object:
        """Find trade to remove.

        :param: traderId: (int32) trader Id to reduce orders from
        :return: removeTrade: (DataFrame) trade to remove


        .. note:: Called from self.writeRemoveTrade()

        """
        # todo: better as a sql query to return removeTrade
        oB = pd.read_sql_table('orderBook', self.conn)
        oB = oB.loc[oB.traderId == traderId, :]
        numelOrderBook = oB.groupby(['traderId', 'tradeRootId', 'price'])['quantity'].size().reset_index()
        oB = pd.merge(oB, numelOrderBook[numelOrderBook.loc[:, 'quantity'] == 1])

        removeTrade = oB.loc[[0], :]

        return removeTrade

    # Function group:
    # constructOutcomeCombinations
    # constructMarketBounds

    def constructOutcomeCombinations(self, marketTable: object) -> object:
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
        mT = marketTable.loc[:, ['marketRootId', 'marketBranchId']].drop_duplicates().reset_index(drop=True)

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

    def constructMarketBounds(self, marketTable):
        """Construct upper and lower bounds for all markets, taking into
        account the bounds of lower branchess.

        :param: marketTable: (DataFrame) marketTable with same columns as the SQL table
        :return: marketBounds: (DataFrame) with [marketRootId, marketBranchId, marketMin, marketMax]


        .. note::

        """

        # Pull market table
        mT = pd.read_sql_table('marketTable', self.conn)

        mT = mT.loc[:, ['marketRootId', 'marketBranchId']].drop_duplicates().reset_index(drop=True)
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
        marketBounds = mT.loc[:, ['marketRootId', 'marketBranchId',
                                  'marketMin', 'marketMax']]

        return marketBounds.reset_index(drop=True)

    def updateBounds(self, L: float, U: float, l: float, u: float) -> object:
        """Update bounds from lower branches

        :param: L: (ndarray) lower bound for current market
        :param: U: (ndarray) upper bound for current market
        :param: l: (float64) lower bound for lower branches
        :param: u: (float64) upper bound for lower branches

        :return: L_new: (float64) new lower bound
        :return: U_new: (float64) new upper bound


        .. note::

        """

        L_new = np.min([np.max([L, l]), U])
        U_new = np.max([np.min([U, u]), L])

        return L_new, U_new

    def constructCartesianProduct(self, input):
        """Construct all possible combinations of a set

        :param: input: (ndarray) input set

        :return: cp: (list) combinations
        """
        cp = list(itertools.product(*input))
        return cp

    def constructUnitVector(self, L, x):
        """Make a vector of length L with a one in the x'th position

        :param: L: (int64) Length of unit vector
        :param: x: (int64) position of 1

        :return: u: (ndarray) unit vector

        """
        u = np.eye(int(L))[int(x)]
        return u

    # Function group:
    # getVerifyKey
    # signMessage
    # verifyMessage
    # verifyTradeSignature
    # verifyMarketSignature
    # verifySignature

    def getVerifyKey(self, traderId):

        """Get verify key for trader

        :param: traderId: (int64) traderId

        :return: verifyKey: (str) verify key for traderId

        """
        queryStr = 'SELECT "verifyKey" FROM "userTable" WHERE "traderId" = \'%s\'' % (traderId)
        verifyKey = pd.read_sql(queryStr, self.conn).verifyKey[0]
        return verifyKey

    def signMessage(self, msg: object, signingKey_hex: object) -> object:
        """Sign a message

        :param: msg: message to sign
        :param: signingKey_hex: signing key as hex

        :return: signed: signed message

        """

        # Convert hex key to bytes
        signingKey_bytes = b'%s' % str.encode(signingKey_hex)
        # Generate signing key
        signingKey = nacl.signing.SigningKey(signingKey_bytes,
                                             encoder=nacl.encoding.HexEncoder)
        # Sign message
        signed = signingKey.sign(msg)
        return signed

    def verifyMessage(self, signature: bytes, signatureMsg: bytes, verifyKey_hex: str) -> object:
        """Verify a signature

        :param: signature: (bytes) signature to check
        :param: signatureMsg: (bytes) message that signature is from
        :param: verifyKey_hex: (str) verification key as string

        :return: verified: (bytes) returns signatureMsg if verified

        """

        verifyKey = nacl.signing.VerifyKey(verifyKey_hex, encoder=nacl.encoding.HexEncoder)
        verified = verifyKey.verify(signatureMsg, signature=signature)
        return verified

    def verifyTradeSignature(self, trade):
        """Verify a trade

        :param: trade (DataFrame row): trade to check

        :return: sigChk: (bytes) returns signatureMsg if verified

        """

        sigChk = self.verifySignature(traderId=trade.loc[0, 'traderId'], signature=trade.loc[0, 'signature'],
                                      signatureMsg=trade.loc[0, 'signatureMsg'])

        return sigChk

    def verifyMarketSignature(self, market):
        """Verify a market

        :param: market (DataFrame): market to check

        :return: sigChk: returns if verified

        """

        sigChk = self.verifySignature(traderId=market.loc[0, 'traderId'], signature=market.loc[0, 'signature'],
                                      signatureMsg=market.loc[0, 'signatureMsg'])
        return sigChk

    def verifySignature(self, traderId, signature, signatureMsg):
        """Vefify a signature message by looking up the verify key and checking

        :param: traderId: (int64) trader id
        :param: signature: (bytes) signature
        :param: signatureMsg: (bytes) signature message

        :return: sigChk: returns if verified

        """

        verifyKey_hex = self.getVerifyKey(traderId=traderId)
        # Verify the message against the signature and verify key
        sigChk = self.verifyMessage(signature=signature, signatureMsg=signatureMsg, verifyKey_hex=verifyKey_hex)
        return sigChk

    def __repr(self):
        return "MarketServer()"

    def __str(self):
        return "bloc: binary limit order chain/bloc is a limit order chain"

# M = MarketServer()

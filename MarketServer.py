# Useful nonsense imports
import itertools
from datetime import date

# Data imports
import numpy as np
import numpy.matlib as npm
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, String, Float, \
    LargeBinary, BLOB, MetaData, update

# Crypto imports
import nacl.encoding
import nacl.signing


class MarketServer(object):
    #'Market server class'

    def __init__(self):
        # self.engine = create_engine('sqlite:///:memory:', echo=True)
        self.engine = create_engine('sqlite:///pmarket.db')
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        self.userTable = Table('userTable', self.metadata,
                      Column('traderId', Integer, primary_key=True, autoincrement=True),
                      Column('verifyKey', String),
                      )

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

        self.marketTable = Table('marketTable', self.metadata,
                      Column('marketRootId', Integer),
                      Column('marketBranchId', Integer),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                      Column('traderId', Integer),
                      Column('previousSig', BLOB),
                      Column('signatureMsg', BLOB),
                      Column('signature', BLOB),
                        )

        self.outcomeCombinations = Table('outcomeCombinations', self.metadata,
                      Column('outcomeId', Integer),
                      Column('marketRootId', Integer),
                      Column('marketBranchId', Integer),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                        )

        self.marketBounds = Table('marketBounds', self.metadata,
                      Column('marketRootId', Integer),
                      Column('marketBranchId', Integer),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                        )

        self.marketOutcomes = np.array

        self.tradeState = Table('tradeState', self.metadata,
                      Column('tradeRootId', Integer),
                      Column('tradeBranchId', Integer),
                      Column('isOpen', Integer ),
                      Column('isOffset', Integer),
                      Column('isMatched', Integer)
                        )

        self.COLLATERAL_LIMIT = -2

        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()

    # Utility function

    def purgeTables(self):
        # Development function to purge all tables before starting a test
        self.userTable.delete().execute()
        self.orderBook.delete().execute()
        self.cacheBook.delete().execute()
        self.marketTable.delete().execute()
        self.marketBounds.delete().execute()
        self.tradeState.delete().execute()
        self.outcomeCombinations.delete().execute()

    def purgeNonUserTables(self):
        # Development function to purge all tables before starting a test
        self.orderBook.delete().execute()
        self.cacheBook.delete().execute()
        self.marketTable.delete().execute()
        self.marketBounds.delete().execute()
        self.tradeState.delete().execute()
        self.outcomeCombinations.delete().execute()

    # createUser
    # createMarket
    # createTrade

    def createUser(self, verifyKey_hex: str):

        userTable = pd.read_sql_query(
            "SELECT * FROM userTable WHERE\
                                  verifyKey = '%s'" %(verifyKey_hex) ,
            self.conn)
        if not userTable.empty:
            print('Username already exists, sorry buddy.')
        else:
            newUsr = dict(verifyKey = verifyKey_hex)
            self.conn.execute(self.userTable.insert(), [newUsr,])

    def createMarket(self, newMarket: object):

        mT = pd.read_sql_table('marketTable', self.conn)

        if mT.empty:
            chainChk = True
        else:
            prevMarket = self.getPreviousMarket()
            chainChk =  newMarket['previousSig'][0] == prevMarket['signature'][0]

        sigChk = self.verifyMarketSignature(newMarket)
        if isinstance(sigChk, bytes):
            sigChk=True

        marketRangeChk = newMarket['marketMin'][0] <= newMarket['marketMax'][0]

        checks = marketRangeChk and sigChk and chainChk

        if checks:
            newMarket.to_sql(name='marketTable', con=self.conn, if_exists='append', index=False)
            # self.conn.execute(self.marketTable.insert().values(newMarket.loc[0].to_dict()))
            # self.conn.execute(self.marketTable.insert(), [newMarket.loc[0].to_dict(), ])
            self.updateOutcomeCombinations()
        else:
            print('Signature does not match, bad signature chain, or else marketMin > marketMax. Market not added.')

    def createTrade(self, tradePackage):

        mT = pd.read_sql_table('marketTable', self.conn)
        oB = pd.read_sql_table('orderBook', self.conn)

        pTrades = tradePackage[tradePackage['tradeBranchId']==1].reset_index(drop=True)
        oTrades = tradePackage[tradePackage['tradeBranchId']==2].reset_index(drop=True)
        mTrades = tradePackage[tradePackage['tradeBranchId']==3].reset_index(drop=True)

        chk1 = pTrades['traderId'][0] == oTrades['traderId'][0] and \
               oTrades['traderId'][0] == mTrades['traderId'][0]
        chk2 = pTrades['tradeRootId'][0] == oTrades['tradeRootId'][0] and\
               oTrades['tradeRootId'][0] == mTrades['tradeRootId'][0]
        chk3 = pTrades['tradeBranchId'][0] == 1
        chk4 = oTrades['tradeBranchId'][0] == 2
        chk5 = mTrades['tradeBranchId'][0] == 3
        chk6 = pTrades['price'][0] == oTrades['price'][0] and oTrades['price'][0] ==\
               mTrades['price'][0]
        chk7 = abs(pTrades['quantity'][0]) == abs(oTrades['quantity'][0]) and\
               abs(oTrades['quantity'][0]) == abs(mTrades['quantity'][0])
        chk8 = np.sign(pTrades['quantity'][0]) == -1 * np.sign(oTrades['quantity'][0]) and\
               -1 * np.sign(oTrades['quantity'][0]) == np.sign(mTrades['quantity'][0])
        chk9 = pTrades['marketRootId'][0] == oTrades['marketRootId'][0] and \
               oTrades['marketRootId'][0] == mTrades['marketRootId'][0]
        chk10 = pTrades['marketBranchId'][0] == oTrades['marketBranchId'][0] and\
                oTrades['marketBranchId'][0] == mTrades['marketBranchId'][0]
        primaryOffsetMatchChk = all([chk1, chk2 , chk3 , chk4 , chk5, \
                                     chk6 , chk7 , chk8 , chk9 , chk10])

        validTradeQuantityChk = all(np.in1d(pTrades['quantity'][0], [-1, 1]))

        if ((pTrades['marketRootId'][0] == mT['marketRootId']) &\
               (pTrades['marketBranchId'][0] == mT['marketBranchId'])).any():
            validMarketChk = True
        else:
            validMarketChk = False
            print('Market root and or branch does not exist.')

        # Pre-allocate checks
        sigChkPrimary = np.zeros((pTrades.count()[0], 1), dtype=bool)
        chainChkPrimary = np.zeros((pTrades.count()[0], 1), dtype=bool)
        sigChkOffset = np.zeros((pTrades.count()[0], 1), dtype=bool)
        chainChkOffset = np.zeros((pTrades.count()[0], 1), dtype=bool)
        sigChkMatch = np.zeros((pTrades.count()[0], 1), dtype=bool)
        chainChkMatch = np.zeros((pTrades.count()[0], 1), dtype=bool)
        for iTrade in range(len(pTrades)):
            pTradeRow = pTrades.loc[[iTrade]].reset_index(drop=True)
            sigChkPrimary[iTrade] = self.verifyTradeSignature(pTradeRow)
            if not oB.empty:
                prevTrade = oB[oB['signature'] == pTradeRow['previousSig'][0]]
                prevValidTrade = self.getPreviousTrade()
                chainChkPrimary[iTrade] = prevTrade['signature'] ==\
                                          prevValidTrade['signature'][0]
            else:
                chainChkPrimary[iTrade] = True

            sigChkOffset[iTrade] = self.verifyTradeSignature(oTrades.loc[[iTrade]].reset_index(drop=True))
            chainChkOffset[iTrade] = oTrades['previousSig'].loc[iTrade] ==\
                                     pTradeRow['signature']
            sigChkMatch[iTrade] = self.verifyTradeSignature(mTrades.loc[[iTrade]].reset_index(drop=True))
            chainChkMatch[iTrade] = mTrades['previousSig'].loc[iTrade] ==\
                                    oTrades['signature'].loc[iTrade]

        sigChk = all(np.concatenate([sigChkPrimary, sigChkOffset, sigChkMatch]))
        chainChk = all(np.concatenate([chainChkPrimary, chainChkOffset, chainChkMatch]))

        allTradeChecks = all([primaryOffsetMatchChk, validTradeQuantityChk,
                        validMarketChk, sigChk, chainChk])

        if allTradeChecks:
            primaryTrades = pTrades
            offsetTrade = oTrades
            matchTrade = mTrades
            newTrade = primaryTrades.loc[[0]]
            altPrimaryTrades = primaryTrades.loc[1:]
            colChk, colChkAll = self.checkCollateral(newTrade)
            if colChk:
                self.writeNewTrade(newTrade.drop(['isOpen', 'isOffset', 'isMatched'], axis=1))
                self.writeCacheTrades(altPrimaryTrades)
                self.writeCacheTrades(offsetTrade)
                self.writeCacheTrades(matchTrade)
                self.matchTrades()
            else:
                print("Failed. Bleh.")

    def getPreviousTrade(self):
        oB = pd.read_sql_table('orderBook', self.conn)

        if not oB.empty:
            maxTrade = oB[oB['tradeRootId'] == np.max(oB['tradeRootId'])]
            previousTrade = maxTrade[maxTrade['tradeBranchId'] ==\
                                     np.max(maxTrade['tradeBranchId'])]
        else:
            # Return root trade
            previousTrade = pd.DataFrame({'tradeRootId': [0],
                                          'signature': ['s'.encode('utf-8')]})

        return previousTrade.reset_index(drop=True)

    def getPreviousMarket(self):

        mT = pd.read_sql_table('marketTable', self.conn)
        oB = pd.read_sql_table('orderBook', self.conn)

        if mT.empty:
            previousMarket = pd.DataFrame({'marketRootId': [0],
                                           'signature': ['s'.encode('utf-8')]})
        else:
            previousMarket = mT.iloc[-1].to_frame().transpose()

        return previousMarket.reset_index(drop=True)

    def updateTradeState(self):

        oB = pd.read_sql_table('orderBook', self.conn)
        # TODO: make sure this does what we think it does
        numelOrderBook = oB.groupby(['traderId', 'tradeRootId', 'price']).size().reset_index(name='counts')
        openOrders = numelOrderBook.loc[numelOrderBook['counts'] == 1,'tradeRootId']
        offsetOrders = numelOrderBook.loc[numelOrderBook['counts'] == 2, 'tradeRootId']
        matchedOrders = numelOrderBook.loc[numelOrderBook['counts'] == 3,'tradeRootId']

        oB['isOpen'] = np.in1d(oB['tradeRootId'], openOrders)
        oB['isOffset'] = np.in1d(oB['tradeRootId'], offsetOrders)
        oB['isMatched'] = np.in1d(oB['tradeRootId'], matchedOrders)

        # Keep track of open/offset/matched
        tradeState = oB[['tradeRootId', 'tradeBranchId', 'isOpen',\
                             'isOffset', 'isMatched']]
        tradeState.to_sql('tradeState', self.conn, if_exists='replace')

    def updateOutcomeCombinations(self):

        mT = pd.read_sql_table('marketTable', self.conn)
        rootMarkets = mT[mT.marketBranchId == 1].reset_index(drop=True)
        oC= self.constructOutcomeCombinations(rootMarkets)
        oC.to_sql('outcomeCombinations', self.conn, if_exists='replace')

        mB = self.constructMarketBounds(mT)
        marketFields = ['marketRootId', 'marketBranchId', 'marketMin',
                        'marketMax']
        mB = mB[marketFields].reset_index(drop=True)
        mB.to_sql('marketBounds',  self.conn, if_exists='replace')

        numMarkets = mB.count()[0]
        numStates = oC['outcomeId'].max()+1
        M = np.zeros((numStates, numMarkets))

        for iOutcome in range(numStates):
            outcomeRow = oC[oC.outcomeId==iOutcome]
            allOutcome = mT[marketFields].append(outcomeRow[marketFields],
                                    ignore_index=True)
            settleOutcome  = self.constructMarketBounds(allOutcome)
            M[iOutcome,] = settleOutcome['marketMin'].values

        self.marketOutcomes = M


    def checkCollateral(self, newTrade=pd.DataFrame()):

        oB = pd.read_sql_table('orderBook', self.conn)
        mT = pd.read_sql_table('marketTable', self.conn)
        mB = pd.read_sql_table('marketBounds', self.conn)
        uT = pd.read_sql_table('userTable', self.conn)
        oC = pd.read_sql_table('outcomeCombinations', self.conn)
        tS = pd.read_sql_table('tradeState', self.conn)
        mO = self.marketOutcomes

        if not newTrade.empty:
            newTrade['isOpen'] = newTrade.tradeBranchId == 1
            newTrade['isOffset'] = newTrade.tradeBranchId == 2
            newTrade['isMatched'] = newTrade.tradeBranchId == 3

        oB = pd.merge(oB, tS)

        allTrades = pd.concat([oB, newTrade], ignore_index=True)
        # Force indicators to be bool
        allTrades[['isOpen', 'isOffset', 'isMatched']] = allTrades[['isOpen', 'isOffset', 'isMatched']].astype(bool)
        numTrades = len(allTrades.index)
        numOpenTrades = allTrades['isOpen'].sum()
        numMarkets = len(mB.index)
        numTraders = uT['traderId'].max()
        numStates = oC['outcomeId'].max()+1

        IM = np.ndarray((numMarkets, numTrades))

        for iTrade in range(numTrades):
            marketInd = np.where((allTrades.loc[iTrade,'marketRootId'] == mB['marketRootId']) &\
                     (allTrades.loc[iTrade, 'marketBranchId'] == mB['marketBranchId']))
            IM[:,iTrade] = self.constructUnitVector(numMarkets, marketInd)

        IQ = np.ndarray((numTrades, numTraders))
        for iTrade in range(numTrades):
            IQ[iTrade,:] = self.constructUnitVector(numTraders, allTrades.loc[iTrade,'traderId']-1)
        p = allTrades['price'].values
        q = allTrades['quantity'].values

        M = self.marketOutcomes

        Mstar = np.matmul(M,IM)
        Qstar = np.multiply(npm.repmat(q, numTraders, 1).transpose(), IQ)
        Pstar = npm.repmat(p, numStates, 1)

        NC_matched = np.matmul(Mstar[:,np.where(allTrades['isMatched'])[0]] -\
                               Pstar[:, np.where(allTrades['isMatched'])[0]],\
                               Qstar[np.where(allTrades['isMatched'])[0],:])

        Mstar_ = Mstar[:, np.where(allTrades['isOpen'])[0]]
        Pstar_ = Pstar[:, np.where(allTrades['isOpen'])[0]]

        NC_open = np.ndarray(NC_matched.shape)
        if numOpenTrades >0:
            for iTrader in range(numTraders):
                Qstar_ = Qstar[np.where(allTrades['isOpen'])[0], iTrader]
                if Qstar_.size==0:
                    Qstar_ = np.ndarray((numOpenTrades,1))
                # TODO: this is a bit convoluted, check against matlab
                NC_open[:, iTrader] = np.min(np.multiply(Mstar_-Pstar_,\
                                        npm.repmat(Qstar_, numStates, 1)),axis=1)


        netCollateral = NC_matched + NC_open
        colChkAll = (netCollateral > self.COLLATERAL_LIMIT).all(axis=0)
        if not newTrade.empty:
            colChk = colChkAll[newTrade['traderId'][0]-1]
        else:
            colChk = colChkAll

        return colChk, netCollateral


    def matchTrades(self):
        mT = pd.read_sql_table('marketTable', self.conn)
        # oB = pd.read_sql_table('orderBook', self.conn)
        # tS = pd.read_sql_table('tradeState', self.conn)

        for iMarket in range(len(mT)):
            allMatched = False
            marketRow = mT.loc[[iMarket],:]
            while not allMatched:
                oB = pd.read_sql_table('orderBook', self.conn)
                tS = pd.read_sql_table('tradeState', self.conn)
                oB = pd.merge(oB, marketRow[['marketRootId', 'marketBranchId']], how='inner')
                oB = pd.merge(oB, tS[tS['isOpen']], how='inner')
                bids = oB[oB['quantity']==1]
                asks = oB[oB['quantity']==-1]
                maxBid = bids[bids['price'] == bids['price'].max()]
                minAsk = asks[asks['price'] == asks['price'].min()]

                # Only take the first row
                maxBid = np.delete(maxBid, np.s_[1:], 0)
                minAsk = np.delete(minAsk, np.s_[1:], 0)


                if minAsk.loc[:,'price'].values <= maxBid.loc[:,'price'].values:
                    self.writeMatchedTrade(maxBid)
                    self.writeMatchedTrade(minAsk)
                else:
                    allMatched = True

        allClear = False
        while not allClear:
            colChk, colChkAll = self.checkCollateral()
            if np.all(colChk):
                allClear = True
            else:
                tIds = np.where(not colChk)[0]
                for iTrader in tIds.size:
                    self.writeRemoveTrade(tIds[iTrader])

                colChk, colChkAll = self.checkCollateral()
                if np.all(colChk):
                    allClear = True

    def writeNewTrade(self, newTrade):
        newTrade.to_sql(name='orderBook', con=self.conn, if_exists='append',
                         index=False)
        # self.conn.execute(self.orderBook.insert(),
        #                   [newTrade, ])
        self.updateTradeState()

    def writeMatchedTrade(self, targetTrade):

        offsetTrade = self.findOffsetTrade(targetTrade)

        offsetTrade.to_sql(name='orderBook', con=self.conn, if_exists='append',
                        index=False)
        # self.conn.execute(self.orderBook.insert(),
        #                   [offsetTrade, ])

        matchedTrade = self.findMatchedTrade(offsetTrade)
        matchedTrade.to_sql(name='orderBook', con=self.conn, if_exists='append',
                        index=False)
        # self.conn.execute(self.orderBook.insert(),
        #                   [matchedTrade, ])

        self.updateTradeState()

    def writeRemoveTrade(self, traderId):

        removeTrade = self.findRemoveTrade(traderId)
        offsetTrade = self.findOffsetTrade(removeTrade)

        offsetTrade.to_sql(name='orderBook', con=self.conn, if_exists='append',
                        index=False)
        # self.conn.execute(self.orderBook.insert(),
        #                   [offsetTrade, ])

        self.updateTradeState()

    def writeCacheTrades(self, cacheTrades):
        # Reset index
        cacheTrades.reset_index(inplace=True, drop=True)

        cacheTrades.to_sql(name='cacheBook', con=self.conn, if_exists='append',
                           index=False)
        # # TODO: Will this work for more than one row?
        # self.conn.execute(self.orderBook.insert(),
        #                   [cacheTrades, ])


    def findOffsetTrade(self, targetTrade):
        # Reset index
        targetTrade.reset_index(inplace=True, drop=True)

        cB = pd.read_sql_table('cacheBook', self.conn)
        isOffset = (cB.loc[:,'previousSig'] == targetTrade.loc[0,'signature']) &\
                   (cB.loc[:,'price'] == targetTrade.loc[0,'price']) &\
                    (cB.loc[:,'tradeRootId'] == targetTrade.loc[0,'tradeRootId']) &\
                     (cB.loc[:,'tradeBranchId'] == 2) &\
                      (cB.loc[:,'traderId'] == targetTrade.loc[0,'traderId'])
        offsetTrade = cB[isOffset]
        # cB = self.cacheBook
        #
        # isOffset = cB.previousSig == targetTrade.signature and\
        #     cB.price == targetTrade.price and\
        #     cB.tradeRootId == targetTrade.tradeRootId and\
        #     cB.tradeBranchId == 2 and\
        #     cB.traderId == targetTrade.traderId
        # offsetTrade = cB.loc[isOffset]

        return offsetTrade

    def findMatchedTrade(self, offsetTrade):
        # Reset  index
        offsetTrade.reset_index(inplace=True, drop=True)

        cB = pd.read_sql_table('cacheBook', self.conn)
        isMatch = (cB.loc[:,'previousSig'] == offsetTrade.loc[0,'signature']) &\
                   (cB.loc[:,'price'] == offsetTrade.loc[0,'price']) &\
                    (cB.loc[:,'tradeRootId'] == offsetTrade.loc[0,'tradeRootId']) &\
                     (cB.loc[:,'tradeBranchId'] == 3) &\
                      (cB.loc[:,'traderId'] == offsetTrade.loc[0,'traderId'])

        matchedTrade = cB.loc[isMatch]

        # cB = self.cacheBook
        # isMatch = cB.previousSig == offsetTrade.signature and\
        #     cB.price == offsetTrade.price and\
        #     cB.tradeRootId == offsetTrade.tradeRootId and\
        #     cB.tradeBranchId == 3 and\
        #     cB.traderId == offsetTrade.traderId
        # matchedTrade = cB.loc[isMatch]

        return matchedTrade


    def findRemoveTrade(self, traderId):

        oB = pd.read_sql_table('orderBook', self.conn)
        oB = oB[oB.traderId == traderId]
        # TODO: Make sure this works
        numelOrderBook = oB.groupby(['traderId', 'tradeRootId', 'price'])['quantity'].size().reset_index(drop=True)
        oB = pd.merge(oB, numelOrderBook[numelOrderBook['quantity'] == 1])

        removeTrade = oB.loc[0]

        return removeTrade


    def constructOutcomeCombinations(self, marketTable):

        marketExtrema = self.constructMarketBounds(marketTable)
        marketExtrema = marketExtrema[['marketRootId', 'marketMin', 'marketMax']].drop_duplicates().reset_index(drop=True)

        # TODO: This should pull out the rows into an array
        exOutcome = np.zeros((marketExtrema.count()[0],2))
        for iRow, mRow in marketExtrema.iterrows():
            exOutcome[iRow] = [mRow['marketMin'], mRow['marketMax']]

        marketCombinations = self.constructCartesianProduct(exOutcome)
        # TODO: Check these are  right size and match in Matlab
        numCombinations = len(marketCombinations)
        numMarkets = len(marketCombinations[0])


        # Get unique markets
        mT = marketTable[['marketRootId', 'marketBranchId']].drop_duplicates()

        marketIds = mT['marketRootId']
        mT['marketMin'] = np.nan
        mT['marketMax'] = np.nan

        marketOutcomes = pd.DataFrame()
        for iOutcome in range(numCombinations):
            for iMarket in range(numMarkets):
                mT.loc[mT['marketRootId'] == marketIds.loc[iMarket], ['marketMin'] ] =\
                    marketCombinations[iOutcome][iMarket]
                mT.loc[mT['marketRootId'] == marketIds.loc[iMarket], ['marketMax'] ] =\
                    marketCombinations[iOutcome][iMarket]
                mT['outcomeId'] = iOutcome

            marketOutcomes = pd.concat([marketOutcomes, mT], ignore_index=True)

        return marketOutcomes.reset_index(drop=True).drop_duplicates()


    def constructMarketBounds(self, marketTable):

        mT = pd.read_sql_table('marketTable', self.conn)

        mT = mT[['marketRootId', 'marketBranchId']].drop_duplicates().reset_index(drop=True)
        mT['marketMin'] = np.nan
        mT['marketMax'] = np.nan

        for iMarket, marketRow in mT.iterrows():
            mRId = marketRow['marketRootId']
            mBId = marketRow['marketBranchId']
            mTmp = marketTable[ (marketTable['marketRootId'] == mRId) &\
                                (marketTable['marketBranchId'] <= mBId)]\
                                .reset_index(drop=True)

            L_ = np.zeros((mTmp.count()[0], 1))
            U_ = np.zeros((mTmp.count()[0], 1))
            for jMarket, mRow in mTmp.iterrows():
                L_tmp = mRow['marketMin']
                U_tmp = mRow['marketMax']
                if jMarket == 0:
                    L_[jMarket] = L_tmp
                    U_[jMarket] = U_tmp
                else:
                    L_new, U_new = self.updateBounds(L_[jMarket-1],
                                                     U_[jMarket-1],
                                                     L_tmp, U_tmp)
                    L_[jMarket] = L_new
                    U_[jMarket] = U_new

            # Take last element of each
            mT.loc[iMarket,'marketMin'] = L_[-1][0]
            mT.loc[iMarket,'marketMax'] = U_[-1][0]

        marketBounds = mT[['marketRootId', 'marketBranchId',
                           'marketMin', 'marketMax']]

        return marketBounds.reset_index(drop=True)

    def updateBounds(self, L, U, l, u):
        L_new = np.min([np.max([L,l]), U])
        U_new = np.max([np.min([U,u]), L])

        return L_new, U_new

    def constructCartesianProduct(self, input):
        cp = list(itertools.product(*input))
        return cp

    def constructUnitVector(self, L, x):
        u = np.eye(L)[x]
        return u

    def getVerifyKey(self, traderId):
        # Get verify key for trader
        verifyKey =  pd.read_sql('SELECT verifyKey FROM userTable WHERE'
                                 ' traderId = "%s"' %(traderId), self.conn
                                 ).verifyKey[0]
        return verifyKey

    def signMessage(self, msg: object, signingKey_hex: object) -> object:
        # Dev function to sign a message
        # Convert hex key to bytes
        signingKey_bytes = b'%s' % str.encode(signingKey_hex)
        # Generate signing key
        signingKey = nacl.signing.SigningKey(signingKey_bytes,
                                             encoder=nacl.encoding.HexEncoder)
        # Sign message
        signed = signingKey.sign(msg)
        return signed

    def verifyMessage(self, signature: bytes, signatureMsg: bytes, verifyKey_hex: str) -> object:
        # (Dev?) function to verify a signed message
        verifyKey = nacl.signing.VerifyKey(verifyKey_hex,
                                             encoder=nacl.encoding.HexEncoder)
        verified = verifyKey.verify(signatureMsg, signature=signature)
        return verified

    def verifyTradeSignature(self, trade):

        sigChk = self.verifySignature(traderId=trade['traderId'][0],
                                      signature=trade['signature'][0],
                                      signatureMsg=trade['signatureMsg'][0])

        return sigChk

    def verifyMarketSignature(self, market):

        sigChk = self.verifySignature(traderId=market['traderId'][0],
                                      signature=market['signature'][0],
                                      signatureMsg=market['signatureMsg'][0])
        return sigChk

    def verifySignature(self, traderId, signature, signatureMsg):
        # Vefify a signature message by looking up the verify key and checking
        verifyKey_hex = self.getVerifyKey(traderId=traderId)
        # Verify the message against the signature and verify key
        return self.verifyMessage(signature=signature,
                                  signatureMsg=signatureMsg,
                                  verifyKey_hex=verifyKey_hex)


    def __repr(self):
        return "MarketServer()"

    def __str(self):
        return "Limit order book server. With great power comes great responsibility."


# M = MarketServer()
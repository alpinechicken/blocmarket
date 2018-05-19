# Useful nonsense imports
import itertools
from datetime import date

# Data imports
import numpy as np
import numpy.matlib as npm
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, String, Float, \
    MetaData, update

# Crypto imports
import nacl.encoding
import nacl.signing


class MarketServer(object):
    #'Market server class'

    def __init__(self):
        self.engine = create_engine('sqlite:///:memory:', echo=True)
        # self.engine = create_engine('sqlite:///pmarket.db')
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        self.userTable = Table('userTable', self.metadata,
                      Column('traderId', Integer, primary_key=True, autoincrement=True),
                      Column('verifyKey', String),
                      )

        self.orderBook = Table('orderBook', self.metadata,
                      Column('tradeRootId', Integer, primary_key=True),
                      Column('tradeBranchId', Integer),
                      Column('price', Float),
                      Column('quantity', Float),
                      Column('marketRootId', Integer),
                      Column('marketBranchId', Integer),
                      Column('traderId', Integer),
                      Column('previousSig', String),
                      Column('signatureMsg', String),
                      Column('signature', String),
                        )

        self.cacheBook = Table('cacheBook', self.metadata,
                      Column('tradeRootId', Integer, primary_key=True),
                      Column('tradeBranchId', Integer),
                      Column('price', Float),
                      Column('quantity', Float),
                      Column('marketRootId', Integer),
                      Column('marketBranchId', Integer),
                      Column('traderId', Integer),
                      Column('previousSig', String),
                      Column('signatureMsg', String),
                      Column('signature', String),
                        )

        self.marketTable = Table('marketTable', self.metadata,
                      Column('marketRootId', Integer, primary_key=True),
                      Column('marketBranchId', Integer),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                      Column('traderId', String),
                      Column('previousSig', String),
                      Column('signatureMsg', String),
                      Column('signature', String),
                        )

        self.outcomeCombinations = Table('outcomeCombinations', self.metadata,
                      Column('outcomeId', Integer, primary_key=True),
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

    # createUser
    # createMarket
    # createTrade

    def createUser(self, verifyKey_hex ='None'):
        """Create user with traderId and password"""

        userTable = pd.read_sql_query(
            "SELECT * FROM userTable WHERE\
                                  verifyKey = '%s'" %(verifyKey_hex) , self.conn)
        if not userTable.empty:
            print('Username already exists, sorry buddy.')
        else:
            # Note: Signature key will NOT be present in production.
            newUsr = dict(verifyKey = verifyKey_hex)
            self.conn.execute(self.userTable.insert(), [newUsr,])

    def createMarket(self, newMarket):

        mT = pd.read_sql_table('marketTable', self.conn)

        if mT.empty:
            chainChk = True
        else:
            prevMarket = self.getPreviousMarket()
            chainChk =  newMarket['previousSig'] == prevMarket['signature']

        sigChk = self.verifyMarketSignature(newMarket)

        marketRangeChk = newMarket.marketMin <= newMarket.marketMax

        checks = marketRangeChk and sigChk and chainChk

        if checks:
            self.conn.execute(self.marketTable.insert(), [newMarket, ])
            self.updateOutcomeCombinations()
        else:
            print('Signature does not match, bad signature chain, or else marketMin > marketMax. Market not added.')

    def createTrade(self, tradePackage):

        mT = pd.read_sql_table('marketTable', self.conn)
        oB = pd.read_sql_table('orderBook', self.conn)

        pTrades = tradePackage[tradePackage['tradeBranchId']==1]
        oTrades = tradePackage[tradePackage['tradeBranchId']==2]
        mTrades = tradePackage[tradePackage['tradeBranchId']==3]

        chk1 = pTrades['traderId'] == oTrades['traderId'] and \
               oTrades['traderId'] == mTrades['traderId']
        chk2 = pTrades['tradeRootId'] == oTrades['tradeRootId'] and\
               oTrades['tradeRootId'] == mTrades['tradeRootId']
        chk3 = pTrades['tradeBranchId'] == 1
        chk4 = oTrades['tradeBranchId'] == 2
        chk5 = mTrades['tradeBranchId'] == 3
        chk6 = pTrades['price'] == oTrades['price'] and oTrades['price'] ==\
               mTrades['price']
        chk7 = abs(pTrades['quantity']) == abs(oTrades['quantity']) and\
               abs(oTrades['quantity']) == abs(mTrades['quantity'])
        chk8 = np.sign(pTrades['quantity']) == -1 * np.sign(oTrades['quantity']) and\
               -1 * np.sign(oTrades['quantity']) == np.sign(mTrades['quantity'])
        chk9 = pTrades['marketRootId'] == oTrades['marketRootId'] and \
               oTrades['marketRootId'] == mTrades['marketRootId']
        chk10 = pTrades['marketBranchId'] == oTrades['marketBranchId'] and\
                oTrades['marketBranchId'] == mTrades['marketBranchId']
        primaryOffsetMatchChk = all(chk1 and chk2 and chk3 and chk4 and chk5 \
                                    and chk6 and chk7 and chk8 and chk9 and chk10)

        validTradeQuantityChk = all(np.in1d(pTrades['quantity'], [-1, 1]))

        if any(pTrades['marketRootId'] == mT['marketRootId'] and\
               pTrades['marketBranchId'] == mT['marketBranchId']):
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
        for iTrade, pTradeRow in pTrades.iterows():
            sigChkPrimary[iTrade] = self.verifyTradeSignature(pTradeRow)
            if not oB.empty:
                prevTrade = oB[oB['signature'] == pTradeRow['previousSig']]
                prevValidTrade = self.getPreviousTrade()
                chainChkPrimary[iTrade] = prevTrade['signature'] ==\
                                          prevValidTrade['signature']
            else:
                chainChkPrimary[iTrade] = True

            sigChkOffset[iTrade] = self.verifyTradeSignature(oTrades.loc[iTrade])
            chainChkOffset[iTrade] = oTrades['previousSig'].loc[iTrade] ==\
                                     pTradeRow['previousSig']
            sigChkMatch[iTrade] = self.verifyTradeSignature(mTrades.loc[iTrade])
            chainChkMatch[iTrade] = mTrades['previousSig'].loc[iTrade] ==\
                                    oTrades['signature'].loc[iTrade]

            sigChk = all(sigChkPrimary and sigChkOffset and  sigChkMatch)
            chainChk = all(chainChkPrimary and chainChkOffset and chainChkMatch)

            allTradeChecks = primaryOffsetMatchChk and validTradeQuantityChk and\
                             validMarketChk and sigChk and chainChk

            if allTradeChecks:
                primaryTrades = pTrades
                offsetTrade = oTrades
                matchTrade = mTrades
                newTrade = primaryTrades.loc[0]
                altPrimaryTrades = primaryTrades.loc[1:]
                colChk = self.checkCollateral(newTrade)
                if colChk:
                    self.writeNewTrade(newTrade)
                    self.writeCacheTrade(altPrimaryTrades)
                    self.writeCacheTrade(offsetTrade)
                    self.writeCacheTrade(matchTrade)
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
            previousTrade = pd.DataFrame({'tradeRootId': [0], 'signature': ['s']})

        return previousTrade

    def getPreviousMarket(self):

        mT = pd.read_sql_table('marketTable', self.conn)
        oB = pd.read_sql_table('orderBook', self.conn)

        if mT.empty():
            previousMarket = pd.DataFrame({'marketRootId': [0], 'signature': ['s']})
        else:
            previousMarket = mT.loc[-1]

        return previousMarket

    def updateTradeState(self):

        oB = pd.read_sql_table('orderBook', self.conn)
        # TODO: make sure this does what we think it does
        numelOrderBook = oB.groupby(['traderId', 'tradeRootId', 'price'])\
            ['quantity'].size().reset_index()
        openOrders = numelOrderBook[numelOrderBook['quantity'] == 1]['tradeRootId']
        offsetOrders = numelOrderBook[numelOrderBook['quantity'] == 2]['tradeRootId']
        matchedOrders = numelOrderBook[numelOrderBook['quantity'] == 3]['tradeRootId']

        oB.isOpen = np.in1d(oB['tradeRootId'], openOrders)
        oB.isOffset= np.in1d(oB['tradeRootId'], offsetOrders)
        oB.isMatched = np.in1d(oB['tradeRootId'], matchedOrders)

        # Keep track of open/offset/matched
        self.tradeState = oB[['tradeRootId', 'tradeBranchId', 'isOpen',\
                             'isOffset', 'isMatched']]

    def updateOutcomeCombinations(self):

        mT = pd.read_sql_table('marketTable', self.conn)
        rootMarkets = mT[mT.marketBranchId == 1]
        oC= self.constructOutcomeCombinations(rootMarkets)
        oC.to_sql('outcomeCombinations', self.conn)

        mB = self.constructMarketBounds(mT)
        marketFields = ['marketRootId', 'marketBranchId', 'marketMin',
                        'marketMax']
        mB = mB[marketFields]
        mB.to_sql('marketBounds', self.conn)

        numMarkets = mB.count()[0]
        numStates = oC['outcomeId'].max()
        M = np.zeros((numStates, numMarkets))

        for iOutcome, outcomeRow in oC.iterrows():
            allOutcome = pd.concat([mT[marketFields], outcomeRow[marketFields]])
            settleOutcome  = self.constructMarketBounds(allOutcome)
            M[iOutcome, :] = settleOutcome['marketMin']

        self.marketOutcomes = M


    def checkCollateral(self, newTrade=None):

        oB = pd.read_sql_table('orderBook', self.conn)
        mT = pd.read_sql_table('marketTable', self.conn)
        mB = pd.read_sql_table('marketBounds', self.conn)
        uT = pd.read_sql_table('userTable', self.conn)
        oC = pd.read_sql_table('outcomeCombinations', self.conn)
        tS = pd.read_sql_table('tradeState', self.conn)
        mO = self.marketOutcomes

        if newTrade == None:
            newTrade = pd.DataFrame()

        if not newTrade.empty:
            newTrade['isOpen'] = newTrade.tradeBranchId == 1
            newTrade['isOffset'] = newTrade.tradeBranchId == 2
            newTrade['isMatched'] = newTrade.tradeBranchId == 3

        oB = pd.merge(oB, tS)

        allTrades = pd.concat([oB, newTrade])
        numTrades = len(allTrades.index)
        numOpenTrades = allTrades['isOpen'].sum()
        numMarkets = len(mB.index)
        numTraders = uT['traderId'].max()
        numStates = oC['outcomeId'].max()

        IM = np.zeros((numMarkets, numTraders))

        for iTrade in range(numTrades):
            marketInd = np.where(allTrades['marketRootId'][iTrade] == mB['marketRootId'] and\
                        allTrades['marketBranchId'][iTrade] == mB['marketBranchID'])
            IM[iTrade,] = self.constructUnitVector(numMarkets, marketInd)

        IQ = np.zeros(numTrades, numTraders)
        for iTrade in range(numTrades):
            IQ[iTrade,] = self.constructUnitVector(numTraders, allTrades['traderId'][iTrade])

        p = allTrades['price']
        q = allTrades['quantity']

        M = self.MarketOutcomes

        Mstar = np.matmul(M,IM)
        Qstar = np.multiply(npm.repmat(q, numTraders, 1).transpose, IQ)
        Pstar = npm.repmat(p, numStates, 1)

        NC_matched = np.matmul(Mstar[:,allTrades['isMatched']] -\
                               Pstar[:, allTrades['isMatched']],\
                               Qstar[allTrades['isMatched'],:])

        Mstar_ = Mstar[:, allTrades['isOpen']]
        Pstar_ = Pstar[:, allTrades['isOpen']]

        NC_open = np.zeros(NC_matched.size)
        if numOpenTrades >0:
            for iTrader in range(numTraders):
                Qstar_ = Qstar[allTrades['isOpen'], iTrader]
                if Qstar_.empty:
                    Qstar_ = np.zeros((numOpenTrades,1))
                # TODO: this is a bit convoluted, check against matlab
                NC_open[:, iTrader] = np.min(np.multiply(Mstar_-Pstar_,\
                                        npm.repmat(Qstar_, numStates, 1)),axis=1)


            netCollateral = NC_matched + NC_open
            colChkAll = all(netCollateral > self.COLLATERAL_LIMIT)
            if not newTrade.empty:
                colChk = colChkAll[newTrade['traderId']]
            else:
                colChk = colChkAll


    def matchTrades(self):
        mT = pd.read_sql_table('marketTable', self.conn)
        oB = pd.read_sql_table('orderBook', self.conn)
        tS = pd.read_sql_table('tradeState', self.conn)

        for iMarket, marketRow in mT.iterrows():
            allMatched = False
            while not allMatched:
                oB = pd.merge(oB, tS[tS['isOpen']])
                bids = oB[oB['quantity']==1]
                asks = oB[oB['quantity']==-1]
                maxBid = bids[bids['price'] == bids['price'].max()]
                minAsk = asks[asks['price'] == asks['price'].min()]

                # Only take the first row
                maxBid = np.delete(maxBid, np.s_[1:], 0)
                minAsk = np.delete(minAsk, np.s_[1:], 0)


                if minAsk['price'] < maxBid['price']:
                    self.writeMatchedTrade(maxBid)
                    self.writeMatchedTrade(minAsk)
                else:
                    allMatched = True

            allClear = False
            while not allClear:
                colChk = self.checkCollateral()
                if np.all(colChk):
                    allClear = True
                else:
                    tIds = np.where(not colChk)[0]
                    for iTrader in tIds.size:
                        self.writeRemoveTrade(tIds[iTrader])

                    colChk = self.checkCollateral()
                    if np.all(colChk):
                        allClear = True

    def writeNewTrade(self, newTrade):

        self.conn.execute(self.orderBook.insert(),
                          [newTrade, ])
        self.updateTradeState()

    def writeMatchedTrade(self, targetTrade):

        offsetTrade = self.findOffsetTrade(targetTrade)

        self.conn.execute(self.orderBook.insert(),
                          [offsetTrade, ])

        matchedTrade = self.findMatchedTrade(offsetTrade)

        self.conn.execute(self.orderBook.insert(),
                          [matchedTrade, ])
        self.updateTradeState()

    def writeRemoveTrade(self, traderId):

        removeTrade = self.findRemoveTrade(traderId)
        offsetTrade = self.findOffsetTrade(removeTrade)

        self.conn.execute(self.orderBook.insert(),
                          [offsetTrade, ])

        self.updateTradeState()

    def writeCacheTrades(self, cacheTrades):

        # TODO: Will this work for more than one row?
        self.conn.execute(self.orderBook.insert(),
                          [cacheTrades, ])


    def findOffsetTrade(self, targetTrade):

        cB = self.cacheBook

        isOffset = cB.previousSig == targetTrade.signature and\
            cB.price == targetTrade.price and\
            cB.tradeRootId == targetTrade.tradeRootId and\
            cB.tradeBranchId == 2 and\
            cB.traderId == targetTrade.traderId
        offsetTrade = cB.loc[isOffset]

        return offsetTrade

    def findMatchedTrade(self, offsetTrade):

        cB = self.cacheBook
        isMatch = cB.previousSig == offsetTrade.signature and\
            cB.price == offsetTrade.price and\
            cB.tradeRootId == offsetTrade.tradeRootId and\
            cB.tradeBranchId == 3 and\
            cB.traderId == offsetTrade.traderId
        matchedTrade = cB.loc[isMatch]

        return matchedTrade


    def findRemoveTrade(self, traderId):

        oB = pd.read_sql_table('orderBook', self.conn)
        oB = oB[oB.traderId == traderId]
        # TODO: Make sure this works
        numelOrderBook = oB.groupby(['traderId', 'tradeRootId', 'price'])['quantity'].size().reset_index()
        oB = pd.merge(oB, numelOrderBook[numelOrderBook['quantity'] == 1])

        removeTrade = oB.loc[0]

        return removeTrade


    def constructOutcomeCombinations(self, marketTable):

        marketExtrema = self.constructMarketBounds(marketTable)
        marketExtrema = marketExtrema[['marketRootId', 'marketMin', 'marketMax']]

        # TODO: This should pull out the rows into an array
        exOutcome = np.zeros((marketExtrema.count()[0],2))
        for iRow, mRow in marketExtrema.iterrows():
            exOutcome[iRow] = [mRow['marketMin'], mRow['marketMax']]

        marketCombinations = self.constructCartesianProduct(exOutcome)
        # TODO: Check these are  right size
        numCombinations = marketCombinations.count()[0]
        numMarkets = marketCombinations.count()[1]

        # Get unique markets
        mT = marketTable[['marketRootId', 'marketBranchId']].drop_duplicates()

        marketIds = mT['marketRootId']
        mT['marketMin'] = np.nan
        mT['marketMax'] = np.nan

        marketOutcomes = pd.DataFrame()
        for iOutcome in range(numCombinations):
            for iMarket in range(numMarkets):
                mT[mT['marketRootId'] == marketIds[iMarket], ['marketMin', 'marketMax'] ]
                mT['outcomeId'] = iOutcome

            marketOutcomes = pd.concat([marketOutcomes, mT])

        return marketOutcomes


    def constructMarketBounds(self, marketTable):

        mT = pd.read_sql_table('marketTable', self.conn)

        mT = mT[['marketRootId', 'marketBranchId']].drop_duplicates()
        mT['marketMin'] = np.nan
        mT['marketMax'] = np.nan

        for iMarket, marketRow in mT.iterows():
            mRId = marketRow['marketRootId']
            mBId = marketRow['marketBranchId']
            mTmp = marketTable[ marketTable['marketRootId'] == mRId and\
                                marketTable['marketBranchId'] <= mBId]

            L_ = np.zeros((mTmp.count()[0], 1))
            U_ = np.zeros((mTmp.count()[0], 1))
            for jMarket, mRow in mTmp.iterrows():
                L_tmp = mRow['marketMin']
                U_tmp = mRow['marketMax']
                if jMarket == 1:
                    L_[jMarket] = L_tmp
                    U_[jMarket] = U_tmp
                else:
                    L_new, U_new = self.updateBounds(L_[jMarket-1],
                                                     U_[jMarket-1],
                                                     L_tmp, U_tmp)
                    L_[jMarket] = L_new
                    U_[jMarket] = U_new

            # Take last element of each
            mT['marketMin'][iMarket] = L_[-1]
            mT['marketMax'][iMarket] = U_[-1]

        marketBounds = mT[['marketRootId', 'marketBranchId',
                           'marketMin', 'marketMax']]

        return marketBounds

    def updateBounds(self, L, U, l, u):
        L_new = np.min(np.max(L,l), U)
        U_new = np.max(np.min(U,u), L)

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

        sigChk = self.verifySignature(traderId=trade['traderId'],
                                      signature=trade['signature'],
                                      signatureMsg=trade['signatureMsg'])

        return sigChk

    def verifyMarketSignature(self, market):

        sigChk = self.verifySignature(traderId=market['traderId'],
                                      signature=market['signature'],
                                      signatureMsg=market['signatureMsg'])
        return sigChk

    def verifySignature(self, traderId, signature, signatureMsg):
        # Vefify a signature messsage by looking up the verify key and checking
        verifyKey_hex = self.getVerifyKey(traderId=traderId)
        # Verify the message against the signature and verify key
        return self.verifyMessage(signature=signature,
                                  signatureMsg=signatureMsg,
                                  verifyKey_hex=verifyKey_hex)


    def __repr(self):
        return "MarketServer()"

    def __str(self):
        return "Limit order book server. With great power comes great responsibility."



    M = MarketServer()
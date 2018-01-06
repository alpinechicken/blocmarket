import hashlib as hl
import itertools
from datetime import date

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, Table, Column, Integer, String, Float, \
    MetaData, update

# Crypto imports
import nacl.encoding
import nacl.signing


# TODO could combine some select/apply combos with grouping functions (OR in SQL)
# TODO: Sign each trade with user hashing all trade info (store public key in user table)
# TODO: Combine transactions/trades
# TODO: Settlement transactions are currently redundant because they can be determined as an outcome of all signed trades(?)
# Could really ignore these values and instead look at settled settled trades in the order book
# TODO: Convert dict literals to dict constructors DONE
# TODO: Type assignments on functions (annotate types in the lightbulb help)
# TODO: Check signatures for underlyingTable, marketData, orderBook
# TODO: Temporarily expose signing methods from NACL (DONE)
# TODO: sigChk/apiChk as a decorator

# TODO: Replace all updates in chain tables with inserts

class MarketObject(object):
    #'Market object class'

    def __init__(self):
        # self.engine = create_engine('sqlite:///:memory:', echo=True)
        self.engine = create_engine('sqlite:///pmarket.db')
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        self.userTable = Table('userTable', self.metadata,
                      Column('traderInd', Integer, primary_key=True, autoincrement=True),
                      Column('traderId', String(40)),
                      Column('hashedPassword', String(40)),
                      Column('apiKey', String(40)),
                      Column('signatureKey', String), # JUST FOR DEV. In production signature key not stored
                      Column('verifyKey', String),
                      )

        self.orderBook = Table('orderBook', self.metadata,
                      Column('tradeNum', Integer, primary_key=True, autoincrement=True),
                      Column('price', Float),
                      Column('quantity', Float),
                      Column('marketId', Integer),
                      Column('traderId', String(40)),
                      Column('timeStamp', String),
                      Column('isMatched', Integer),
                      Column('signatureMsg', String),
                      Column('signature', String),
                        )


        self.underlyingData = Table('underlyingData', self.metadata,
                      Column('outcomeNum', Integer, primary_key=True, autoincrement=True),
                      Column('outcome', Float),
                      Column('underlying', String(40)),
                      Column('traderId', String(40)),
                      Column('signatureMsg', String),
                      Column('signature', String),

                                    )

        self.marketData = Table('marketData', self.metadata,
                      Column('marketId', Integer, primary_key=True, autoincrement=True),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                      Column('expiry', String),
                      Column('outcome', Float),
                      Column('underlying', String),
                      Column('traderId', String),
                      Column('isSettled', Integer),
                      Column('signatureMsg', String),
                      Column('signature', String),
                        )

        self.transactionTable = Table('transactionTable', self.metadata,
                      Column('transactionNum', Integer, primary_key=True, autoincrement=True),
                      Column('value', Float),
                      Column('traderId', String),
                      Column('underlying', String),
                      Column('timeStamp', String),
                      Column('signatureMsg', String),
                      Column('signature', String),
                        )

        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()

    def purgeTables(self):
        # Development function to purge all tables before starting a test
        self.userTable.delete().execute()
        self.orderBook.delete().execute()
        self.underlyingData.delete().execute()
        self.marketData.delete().execute()
        self.transactionTable.delete().execute()

    def generateSignatureKeys(self):
        # Dev function to generate signature key pairs.
        # In production this MUST be client side (javascript).

        # Create signing key
        signingKey = nacl.signing.SigningKey.generate()
        # Obtain the verify key for a given signing key
        verifyKey = signingKey.verify_key

        # Serialize the verify key to send it to a third party
        signingKey_hex = signingKey.encode(encoder=nacl.encoding.HexEncoder)
        verifyKey_hex = verifyKey.encode(encoder=nacl.encoding.HexEncoder)
        return signingKey_hex, verifyKey_hex

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

    def createUser(self, traderId, password, signatureKey_hex ='None', verifyKey_hex ='None'):
        """Create user with traderId and password"""
        hashedPassword = hl.md5(password.encode('utf-8')).hexdigest()
        apiKey = hl.md5(hashedPassword.encode('utf-8')).hexdigest()
        # TODO: No need to get whole userTable.
        userTable = pd.read_sql_query(
            "SELECT * FROM userTable WHERE\
                                  traderId = '%s'" %(traderId) , self.conn)
        if not userTable.empty:
            print('Username already exists, sorry buddy.')
        else:
            # Note: Signature key will NOT be present in production.
            # TODO: remove signature key in production
            newUsr = dict(traderId = traderId,
                          hashedPassword = hashedPassword,
                          apiKey=apiKey, signatureKey = signatureKey_hex,
                          verifyKey = verifyKey_hex)
            # self.userTable.insert().execute(newUsr)
            self.conn.execute(self.userTable.insert(), [newUsr,])

    def createUnderlying(self, underlying, traderId, apiKey,
                         signatureMsg='None', signature = 'None'):
        """Create underlying market providing a traderId and apiKey"""
        apiChk = self.checkApiKey(traderId, apiKey);
        utTmp = pd.read_sql_query(
            "SELECT * FROM underlyingData WHERE\
                                  underlying = '%s'" %(underlying) , self.conn)
        # TODO: Signature check for underlying
        if not utTmp.empty:
            print('Underlying already exists. Try another.')
        else:
            if apiChk:
                sigChk = self.verifySignature(traderId=traderId,
                                              signature=signature,
                                              signatureMsg=signatureMsg)
                if sigChk:
                    newUnderlying = dict(outcome=np.nan,
                                         underlying=underlying,
                                         traderId=traderId,
                                         signatureMsg=signatureMsg,
                                         signature=signature)
                    self.conn.execute(self.underlyingData.insert(),
                                      [newUnderlying,])
                else:
                    print("Bad signature, matey.")

            else:
                print('Bad API key, bucko.')

    def createMarket(self, marketMin, marketMax, expiry,
                     underlying, traderId, apiKey,
                     signatureMsg='None', signature='None'):
        """ Creat market based on underlying """
        apiChk = self.checkApiKey(traderId, apiKey)
        mdTmp = pd.read_sql_table('marketData', self.conn)
        # TODO: signature check for market
        if apiChk:
            sigChk = self.verifySignature(traderId=traderId,
                                          signature=signature,
                                          signatureMsg=signatureMsg)
            if sigChk:
                newMarket = dict(marketMin=marketMin,
                                 marketMax=marketMax,
                                 expiry=expiry,
                                 outcome=np.nan,
                                 underlying=underlying,
                                 traderId=traderId,
                                 signatureMsg=signatureMsg,
                                 signature=signature)
                self.conn.execute(self.marketData.insert(), [newMarket, ])
            else:
                print('Bad signature.')
        else:
            print('Bad key. You lose.')

    def proposeTransaction(self, value, underlying, traderId, apiKey,
                           signatureMsg = 'None', signature='None'):
        # TODO: Transaction needs to be valid
        apiChk = self.checkApiKey(traderId, apiKey)
        if apiChk:
            self.addTransaction(value, traderId, underlying, signatureMsg, signature)
        else:
            print('API key is bad.')

    def proposeRemoveTrade(self, tdNum,  traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        obTmp = pd.read_sql_query("SELECT * FROM orderBook WHERE tradeNum ="\
                                  " %d AND isMatched = 0"% (tdNum), self.conn)
        tradeOwnerChk = obTmp.traderId == traderId
        if apiChk & tradeOwnerChk[0]:
            self.killTrade(tdNum=tdNum)
        else:
            print('Incorrect API key or you do not own this trade.')

    def proposeSettlement(self, outcome, underlying, traderId,
                          apiKey, signatureMsg = 'None', signature = 'None'):
        apiChk = self.checkApiKey(traderId, apiKey)
        undTmp = pd.read_sql_query("SELECT * FROM underlyingData WHERE\
                                   underlying = '%s'" % (underlying),
                                   self.conn)
        mdTmp = pd.read_sql_query("SELECT * FROM marketData WHERE\
                                   underlying = '%s'" % (underlying),
                                   self.conn)
        underlyingOwnerChk = undTmp.traderId[0] == traderId
        if apiChk & underlyingOwnerChk:
            if pd.isnull(undTmp.outcome[0]):
                update(self.underlyingData).where(
                    self.underlyingData.c.underlying == underlying).values\
                    (outcome = outcome).execute()
                for i, row in mdTmp.iterrows():
                    marketId = mdTmp.marketId.loc[i]
                    self.settleMarket(outcome, marketId)

            else:
                print('Underlying not expired yet or outcome already set')
        else:
            print('Incorrect API key or you do now own this market.')

    def checkPassword(self, traderId, password):
        hashedPassword = hl.md5(password).hexdigest()
        utTmp = pd.read_sql_query("SELECT * FROM userTable WHERE\
                                  traderId = '%s'" % (traderId), self.conn)
        chkPass = utTmp.hashedPassword[0] == hashedPassword
        if chkPass:
            apiKey = utTmp.apiKey[0]
        else:
            apiKey = []

        return (chkPass, apiKey)

    def checkApiKey(self, traderId: object, apiKey: object) -> object:
        utTmp = pd.read_sql_query("SELECT * FROM userTable WHERE\
                                  traderId = '%s'" % (traderId), self.conn)
        chkKey = utTmp.apiKey[0] == apiKey
        return chkKey

    # Following were private functions in Matlab

    def addTransaction(self, value, traderId, underlying, signatureMsg='None', signature='None'):
        # TODO: oauth for authentication (?)
        # TODO: tNum = max(self.transactionTable.transactionNum)+1
        ttTmp = pd.read_sql_table('transactionTable', self.conn)
        # Create new transaction entry
        # TODO: time  stamp here
        transactionEntry = dict(value=value, traderId=traderId,
                                underlying=underlying, timeStamp=date.today(),
                                signatureMsg=signatureMsg,
                                signature=signature)
        self.conn.execute(self.transactionTable.insert(),
                          [transactionEntry, ])

    def writeMatchedTrade(self, price, quantity, traderId, marketId, isMatched=1,  signatureMsg='None', signature='None'):
        # Internal function to write trades from matchtrades
        trade = dict(price=price, quantity=quantity,
                     marketId=int(marketId), traderId=traderId,
                     timeStamp=date.today(), isMatched=isMatched,
                     signatureMsg=signatureMsg,
                     signature=signature)
        self.conn.execute(self.orderBook.insert(), [trade, ])


    def addTrade(self, price, quantity, traderId, marketId, isMatched=0, matchTrades = True,  signatureMsg='None', signature='None'):
        # TODO Needs authentication or to be private (or pass apiKey)
        trade = dict(price=price, quantity=quantity,
                     marketId=int(marketId), traderId=traderId,
                     timeStamp=date.today(), isMatched=isMatched,
                     signatureMsg=signatureMsg,
                     signature=signature)
        self.conn.execute(self.orderBook.insert(), [trade, ])
        # Match trades if match flag set
        if matchTrades:
            self.matchTrades()

    def killTrade(self, tdNum):
        self.orderBook.delete(self.orderBook.c.tradeNum == int(tdNum))\
            .execute()

    def matchTrades(self):
        # Match trades where p(ask) < p(bid)
        # Asks are negative quantity
        # Traverse through all markets and match trades
        # TODO: Is it necessary to match all markets  at once?
        mdTmp = pd.read_sql_table('marketData', self.conn)
        for mInd, mRow in mdTmp.iterrows():
            mId = mdTmp.marketId.loc[mInd]
            allMatched = False
            while allMatched == False:
                # Make a copy of current order book
                ob = pd.read_sql_query("SELECT * FROM orderBook WHERE\
                                       marketId = %d AND isMatched = 0"
                                       % (mId), self.conn)
                # Order bids  and offers by price  then by tradNum
                orderedBids = ob[(ob.quantity > 0)].sort_values(by =[
                    'price', 'tradeNum'], ascending=[False, True])
                orderedAsks = ob[(ob.quantity < 0)].sort_values(by = [
                    'price', 'tradeNum'], ascending=[True, True])
                # Bids  have positive quantities, asks have negative
                # quantities
               # Is there a bid and offer?
                if orderedBids.empty or orderedAsks.empty:
                    allMatched = True
                else:
                    # Is there a trade to match?
                    # Get best and most
                    minAsk = orderedAsks.iloc[0]
                    maxBid = orderedBids.iloc[0]
                    if minAsk.price <= maxBid.price:
                        if maxBid.tradeNum < minAsk.tradeNum:
                            # Bid was first
                            price = maxBid.price
                        else:
                            # Ask was  first
                            price = minAsk.price

                        # Trade quantity is the minimum of bid and ask
                        # quantity
                        tradeQuantity = min(abs(maxBid.quantity),
                                            abs(minAsk.quantity))
                        # Trade number increment
                        # TODO: get tradeNum from autoincrement
                        # Find long and short trader
                        longTrader, shortTrader = maxBid.traderId,\
                                                  minAsk.traderId
                        # Check collateral for both traders and record min and
                        # max market outcomes
                        cCheckLong, cCheckShort = \
                            self.checkCollateralCrossMarket(
                                price=price,
                                quantity=tradeQuantity,
                                traderId=longTrader, marketId=mRow.marketId),\
                            self.checkCollateralCrossMarket(
                                price=price,
                                quantity=-tradeQuantity,
                                traderId=shortTrader, marketId=mRow.marketId)
                        if cCheckLong & cCheckShort:
                            #TODO: Put proper timestamps  in here
                            self.writeMatchedTrade(price=price,
                                                   quantity=tradeQuantity,
                                                   traderId=longTrader,
                                                   marketId=int(mRow.marketId),
                                                   isMatched=int(1),
                                                   signatureMsg='Internal',
                                                   signature='Internal')
                            self.writeMatchedTrade(price=price,
                                                   quantity=-tradeQuantity,
                                                   traderId=shortTrader,
                                                   marketId=int(mRow.marketId),
                                                   isMatched=int(1),
                                                   signatureMsg='Internal',
                                                   signature='Internal')
                            # # Create trades
                            # #  Create offsetting unmatched trades
                            # self.addTrade(price=price, quantity=-tradeQuantity, traderId=longTrader, marketId=int(mRow.marketId),
                            #          isMatched=int(0), matchTrades=False, signatureMsg='Internal', signature='Internal')
                            # self.addTrade(price=price, quantity=tradeQuantity, traderId=shortTrader, marketId=int(mRow.marketId),
                            #          isMatched=int(0), matchTrades=False, signatureMsg='Internal', signature='Internal')
                            startQuantityMaxBid = maxBid.quantity
                            update(self.orderBook).where(
                                self.orderBook.c.tradeNum ==\
                                int(maxBid.tradeNum)).values(
                                quantity=startQuantityMaxBid - tradeQuantity
                                ).execute()
                            startQuantityMinAsk = minAsk.quantity
                            update(self.orderBook).where(
                                self.orderBook.c.tradeNum ==\
                                int(minAsk.tradeNum)).values(
                                quantity=startQuantityMinAsk + tradeQuantity
                                ).execute()

                            # Kill any zeros
                            zeroQorders = pd.read_sql_query(
                                "SELECT * FROM orderBook WHERE\
                                quantity = 0 AND isMatched = 0", self.conn)
                            for i, row in zeroQorders.iterrows():
                                self.killTrade(tdNum=row.tradeNum)

                        elif (not cCheckLong) and cCheckShort:
                            # Long trader doesn't have enough collateral
                            # Kill marginal open order of long trader\
                            #  (kills earlier trades first)
                            self.removeMarginalTrade(longTrader)
                        elif cCheckLong and (not cCheckShort):
                            # Short trader doesn't have enough collateral
                            self.removeMarginalTrade(shortTrader)
                        elif ( not cCheckLong ) and ( not cCheckShort):
                            self.removeMarginalTrade(traderId=longTrader)
                            self.removeMarginalTrade(traderId=shortTrader)
                    else:
                        allMatched = True

    def settleMarket(self, outcome, marketId):
        # Choose market outcome
        mdTmp = pd.read_sql_query(
            "SELECT * FROM marketData WHERE\
                                  marketId = '%s'" %(marketId) , self.conn)

        # Set  market  outcome
        update(self.marketData).where(
            self.marketData.c.marketId == int(marketId)).values(
            outcome=outcome).execute()
        # Set final price (within market max/min)
        finalPrice = min(max(outcome, mdTmp.marketMin[0]),
                         mdTmp.marketMax[0])
        # Get all market participants
        mt = pd.read_sql_query("SELECT * FROM orderBook WHERE\
                              marketId = '%s' AND isMatched == 1 "
                             % (marketId), self.conn)
        # Get  unique values in an indexable list
        traders = list(set(mt.traderId))
        # Distribute profit to traders
        for i, trader in enumerate(traders):
            # Calculate  profit and loss
            # Trader  index
            traderInd = mt.traderId == trader
            # Profit/loss is
            # sum((finalPrice - matched price(i,j) *quantity(i,j))
            value = sum(finalPrice-mt.loc[traderInd, ('price')]) \
                    * mt.loc[traderInd , 'quantity']
            # Add profit/loss ot transaction ledger (convert to trade)
            self.addTransaction(
                value=value, traderId=trader, underlying= \
                    'Settlement for market ' + str(marketId),
                signatureMsg='None', signature='None' )

        # Remove orders  in open market
        # TODO don't need obTmp here
        obTmp = pd.read_sql_query("SELECT * FROM orderBook WHERE\
                                  marketId = '%s' AND isMatched = 0"
                                  %(marketId) , self.conn)
        for i, row in obTmp.iterrows():
            self.killTrade(tdNum=row.tradeNum)

        update(self.marketData).where(
            self.marketData.c.marketId == marketId).values \
            (isSettled=1).execute()

    def checkCollateralCrossMarket(self, price, quantity, traderId, marketId):
        # Checks if trader has sufficient collateral to covr a new  trade \
        # (incorporating trades from markets
        # with the same underlying) given existing open and matched trades.
        #
        # Condition is:
        # Is the maximum loss on *any one* unmatched  trade plus the\
        #  associated outcome of the matched trades greater than the amount\
        #  of available  collateral?
        #
        # To calculate this consider the worst case for the following given
        # that the market settles at the maximum or minimum
        #
        # - Matched trades [matchedTrades] (all)
        # - Trades in the order book [orderBook] (minimum for single order)
        # - The proposed new trade
        #
        # In all cases the outcome  should be greater than the current
        #  collateral (sum of transaction table)
        #
        # Construct all possible underlying outcomes and associated market
        #  outcomes
        #
        #TODO: only need to test markets where trader has an open or matched
        #  order. Cross market checking is going to become combinatorically
        #  troublesome...
        marketOutcomes, underlyingOutcomes =\
            self.constructOutcomeCombinations()
        # number of combinations
        numCombinations = len(marketOutcomes)
        ob = pd.read_sql_query("SELECT * FROM orderBook WHERE\
                                  traderId = '%s' AND\
                                   isMatched = 0" %(traderId) , self.conn)
        mt = pd.read_sql_query("SELECT * FROM orderBook WHERE\
                                  traderId = '%s' AND\
                                   isMatched = 1" %(traderId) , self.conn)
        md = pd.read_sql_table('marketData', self.conn)
        # Current transactions index for current  trader and  market
        ownTransactions = pd.read_sql_query("SELECT * FROM transactionTable\
                                            WHERE traderId = '%s'"\
                                            %(traderId) , self.conn)
        # Create price and quantity across all markets (will be zero for all\
        #  other markets)
        priceAllMarkets, quantityAllMarkets = [0]*len(md), [0]*len(md)
        #Find  index for marketId in md table
        marketInd = md.loc[md.marketId == marketId].index[0]
        priceAllMarkets[marketInd] = price
        quantityAllMarkets[marketInd] = quantity
        for mInd, market in md.iterrows():
            # Check collateral across all markets that existing matched trades
            #  and worst case hit  on
            # open trade/new trade  outcome has sufficient collateral
            # Market id
            mId = market.marketId
            # Open orders  index for current trader and market
            indOpenOrders = (ob.marketId == marketId)
            # Matched trades index for current trader  and market
            indMatchedTrades = (mt.marketId == mId)
            # Current transactions for current trader and market
            # Open orders for current trader and market
            ownOpenOrders = ob.loc[indOpenOrders]
            # Matched  trades for current  trader and  market
            ownMatchedTrades = mt.loc[indMatchedTrades]
            # Market  index
            marketIndex = md.marketId[md.marketId == mId].index[0]
            # Pre-allocate order outcomes
            newOrderOutcome = [0]* len(md)
            # Pre-allocate test market outcomes
            testMarket = \
                [[0 for x in md.iterrows()] for y in range(numCombinations)]
            # Collateral test: current  transaction cash + matched orders +\
            #  worst  single open order hit (in
            # all possible combinations of cases)
            for comboInd in range(numCombinations):
                outcomeTmp = marketOutcomes[comboInd][marketIndex]
                if not ownMatchedTrades.empty:
                    matchedOutcome = sum((outcomeTmp - ownMatchedTrades.price) *
                                         ownMatchedTrades.quantity)
                else:
                    matchedOutcome = 0

                # Worst  open trade outcome
                if not ownOpenOrders.empty:
                    openOutcome = min((outcomeTmp-ownOpenOrders.price) *\
                                      ownOpenOrders.quantity)
                else:
                    openOutcome = 0

                # New order outcome (only count new order for target market)
                newOrderOutcome[mInd] =\
                    (outcomeTmp - priceAllMarkets[marketIndex]) *\
                    quantityAllMarkets[marketIndex]\
                                        * (mId == marketId)
                #  Worst case outcome  for market min case (matched orders\
                #  settled at market min and worst of any open trade\
                #  or new order)
                # TODO: first condition redundant since openOutcome set to zero in this case
                if not openOutcome:
                    testMarket[comboInd][mInd] = np.sum(matchedOutcome) +\
                                                 np.sum(newOrderOutcome[mInd])
                else:
                    testMarket[comboInd][mInd] = np.sum(matchedOutcome) +\
                                                 np.min([np.sum(openOutcome),
                                                 np.sum(
                                                     newOrderOutcome[mInd])])

            testMarketValue = np.sum(testMarket,1) +\
                              np.sum(ownTransactions.value)
            if all(testMarketValue >=0):
                colChk = True
            else:
                #No dice
                colChk = False

        return colChk

    def removeMarginalTrade(self, traderId):
        # Kill marginal trade of trader (earliest trade, any market) to free
        # up worst case collateral
        # TODO: Could find better marginal trade to kill
        openOrdersTradeNum = pd.read_sql_query(
            "SELECT tradeNum FROM orderBook WHERE traderId = '%s' AND isMatched = 0"
                                              %(traderId) , self.conn)
        self.killTrade(tdNum=openOrdersTradeNum.loc[0].tradeNum)

    def constructOutcomeCombinations(self):
        # Returns market outcomes and combination outcomes\
        # (all possible combinations of outcomes)
        md = pd.read_sql_table('marketData', self.conn)


        numMarkets = len(md)
        # Unique underlyings
        underlyings = list(set(md.underlying))
        numUnderlyings = len(underlyings)
        #Market min and maxes
        marketMins, marketMaxes = md.marketMin, md.marketMax
        tmp = list()
        for i, row in enumerate(underlyings):
            ind = underlyings.index(row)
            underlyingMin, underlyingMax = np.min(marketMins[ind]),\
                                           np.max(marketMaxes[ind])
            tmp.append(list({underlyingMin, underlyingMax}))

        # Construct all possible combinations of min/max, e.g. for two\
        # binary markets [0,1], [0,1] -> [(0,0), (0,1), (1,0), (1,1)]
        underlyingOutcomes = list(itertools.product(*tmp))
        numCombinations = len(underlyingOutcomes)
        # Pre-allocate test market outcomes
        marketOutcomes = \
            [[0 for x in range(numMarkets)] for y in range(numCombinations)]
        #TODO: Check this logic
        # Consruct market outcomes in all corner underlying outcomes
        for i in range(numCombinations):
            for j in range(numMarkets):
                # Find index of underlying
                underlyingInd = underlyings.index(md.underlying[j])
                # Market outcome in market based on underlying outcome
                marketOutcomes[i][j] =\
                    min(max(
                        marketMins[j], underlyingOutcomes[i][underlyingInd] ),
                        marketMaxes[j])


        return (marketOutcomes, underlyingOutcomes)

    def getVerifyKey(self, traderId):
        # Get verify key for trader
        verifyKey =  pd.read_sql('SELECT verifyKey FROM userTable WHERE'
                                 ' traderId = "%s"' %(traderId), self.conn
                                 ).verifyKey[0]
        return verifyKey

    def getSignatureKey(self, traderId):
        # Get signature key for trader (Not in production)
        # TODO: Remove for production
        signatureKey =  pd.read_sql('SELECT signatureKey FROM userTable WHERE'
                                    ' traderId = "%s"' %(traderId), self.conn
                                    ).signatureKey[0]
        return signatureKey

    # Method to get previous signatures for any table/index
    def getPreviousSig(self, tableName, indexName):
        # Get previous signature by choosing signature with maximum index value
        prevSig = pd.read_sql(
            'SELECT signature FROM %s  WHERE %s  = (SELECT max(%s) FROM %s)'
            %(tableName, indexName, indexName, tableName),
            self.conn).signature

        # Select signature or set to rootsig if empty
        if not prevSig.empty:
            prevSig = prevSig[0]
        else:
            prevSig = 'rootsig'.encode("utf-8")

        return prevSig

    # Methods to get previous signatures for particular tables
    def getPreviousUnderlyingDataSig(self):
        # Get previous signature from underlyingData
        prevSig = self.getPreviousSig('underlyingData', 'outcomeNum')
        return prevSig

    def getPreviousOpenMarketDataSig(self):
        # Get previous signature from marketData table
        prevSig = self.getPreviousSig('marketData', 'marketId')
        return prevSig

    def getPreviousOrderBookSig(self):
        # Get previous signature from previousOrderBook table
        prevSig = self.getPreviousSig('orderBook', 'tradeNum')
        return prevSig

    def getPreviousTransactionTableSig(self):
        # Get previous signature from transactionTable table
        prevSig = self.getPreviousSig('transactionTable', 'transactionNum')
        return prevSig

    # Chain signatures (all need to be on client side eventually)
    def signUnderlyingData(self, underlying, traderId, signatureKey_hex):
        # Sign previous signature
        prevSig = self.getPreviousUnderlyingDataSig()

        # Encode signature message in bytes
        msg = b'%s%s%s' % (prevSig, traderId.encode("utf-8"), underlying.encode("utf-8"))

        signedUnderlyingData = self.signMessage(msg=msg,
                                                   signingKey_hex=signatureKey_hex)
        return signedUnderlyingData

    def signOpenMarketData(self, traderId, underlying, marketMin, marketMax, expiry,  signatureKey_hex):
        # Sign previous signature
        prevSig = self.getPreviousOpenMarketDataSig()

        # Encode signature message in bytes
        msg = b'%s%s%s%s%s%s' % (prevSig, traderId.encode("utf-8"), underlying.encode("utf-8"),
                           str(marketMin).encode("utf-8"), str(marketMax).encode("utf-8"), str(expiry).encode("utf-8"))

        signedOpenMarketData = self.signMessage(msg=msg,
                                                   signingKey_hex=signatureKey_hex)
        return signedOpenMarketData

    def signOrderBook(self, price, quantity, traderId, marketId, signatureKey_hex):
        # Sign previous signature
        prevSig = self.getPreviousOrderBookSig()

        # Encode signature message in bytes
        msg = b'%s%s%s%s%s' % (prevSig, traderId.encode("utf-8"), str(marketId).encode("utf-8"),
                           str(price).encode("utf-8"), str(quantity).encode("utf-8"))

        signedOrderBook = self.signMessage(msg=msg,
                                                   signingKey_hex=signatureKey_hex)
        return signedOrderBook

    def signTransactionTable(self, value, traderId, underlying, signatureKey_hex):
        # Sign previous signature
        prevSig = self.getPreviousTransactionTableSig()

        # Encode signature message in bytes
        msg = b'%s%s%s%s' % (prevSig, traderId.encode("utf-8"), str(value).encode("utf-8"),
                           underlying.encode("utf-8"))

        signedTransactionTable = self.signMessage(msg=msg,
                                                   signingKey_hex=signatureKey_hex)
        return signedTransactionTable

    # Other signatures
    def signSettlement(self, traderId, underlying, outcome, signatureKey_hex):
        # Sign settlement from traderId, underlying, outcome

        # Encode signature message in bytes
        msg = b'%s%s%s' % (traderId.encode("utf-8"),underlying.encode("utf-8"),
                             str(outcome).encode("utf-8"))

        signedSettlement = self.signMessage(msg=msg,
                                                   signingKey_hex=signatureKey_hex)
        return signedSettlement

    def verifySignature(self, traderId, signature, signatureMsg):
        # Vefify a signature messsage by looking up the verify key and checking
        verifyKey_hex = self.getVerifyKey(traderId=traderId)
        # Verify the message against the signature and verify key
        return self.verifyMessage(signature=signature,
                                  signatureMsg=signatureMsg,
                                  verifyKey_hex=verifyKey_hex)

    def __repr(self):
        return "MarketObject()"

    def __str(self):
        return "Limit order book. With great power comes great responsibility."



# TODO sign each transaction on the ledger with key?
# TODO: get tables talking to SQL
# TODO: input checks
# TODO: authentication


# Notes:
# Using newUsr = {'traderId': traderId, 'hashedPassword': hashedPassword,
# 'apiKey': apiKey} and then appending to df (could use dict
# dict( traderId = traderId, hashedPassword = hashedPassword, apiKey = apiKey))
# Append with self.userTable = self.userTable.append(newUsr, ignore_index=True)
#  - need assignment here because append just returns a copy

# Trying to use dataframe.loc[dataframe.colname == condition, ('colname')]
# (rather than, say, dataframe[dataframe.colname == condition].colname ) for
#  picking out df rows with boolean series because python
# Maybe use .ix instead of .loc/.iloc?
#
# Check empty df row on boolean index with e.g. ob.price.loc[bidInd].empty

# Use 'set' for unique values, e.g. traders = list(set(mt.traderId)) gives a
# list with the set of unique traderIds

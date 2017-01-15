import hashlib as hl
import pandas as pd
import DateTime as dt
import numpy as np
import itertools
from datetime import datetime, date

#Sql imports
from sqlalchemy import create_engine, Table, Column, Integer, String, Float, Date, MetaData, ForeignKey, update
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import select


#TODO could combine some select/apply combos with grouping functions

class MarketObject(object):
    #'Market object class'

    def __init__(self):
        # self.useSqlTables = 1;
        # self.sqlConnection = 0;
        # self.sqlTableRoot = 'Exchange.dbo';
        self.engine = create_engine('sqlite:///:memory:', echo=True)
        # self.engine = create_engine('sqlite:///pmarket.db')
        self.engine.echo = False
        self.metadata = MetaData(self.engine)
        #Create session bound to engine
        # Session = sessionmaker(bind=self.engine)
        # self.session = Session()

        self.userTable = Table('userTable', self.metadata,
                      Column('traderInd', Integer, primary_key=True),
                      Column('traderId', String(40)),
                      Column('hashedPassword', String(40)),
                      Column('apiKey', String(40)),
                      )

        self.orderBook = Table('orderBook', self.metadata,
                      Column('tradeNum', Integer),
                      Column('price', Float),
                      Column('quantity', Float),
                      Column('marketId', Integer),
                      Column('traderId', String(40)),
                      Column('timeStamp', String),
                        )

        self.matchedTrades = Table('matchedTrades', self.metadata,
                      Column('tradeNum', Integer),
                      Column('price', Float),
                      Column('quantity', Float),
                      Column('marketId', Integer),
                      Column('traderId', String(40)),
                      Column('timeStamp', String),
                        )

        self.underlyingData = Table('underlyingData', self.metadata,
                      Column('outcomeNum', Integer, primary_key=True),
                      Column('outcome', Float),
                      Column('underlying', String(40)),
                      Column('traderId', String(40)),
                        )


        self.openMarketData = Table('openMarketData', self.metadata,
                      Column('marketId', Integer, primary_key=True),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                      Column('expiry', Date),
                      Column('outcome', Float),
                      Column('underlying', String),
                      Column('traderId', String),
                        )

        self.settledMarketData = Table('settledMarketData', self.metadata,
                      Column('marketId', Integer, primary_key=True),
                      Column('marketMin', Float),
                      Column('marketMax', Float),
                      Column('expiry', Date),
                      Column('outcome', Float),
                      Column('underlying', String),
                      Column('traderId', String),
                        )

        self.transactionTable = Table('transactionTable', self.metadata,
                      Column('transactionNum', Integer),
                      Column('value', Float),
                      Column('traderId', String),
                      Column('underlying', String),
                      Column('timeStamp', Date),
                        )




        self.metadata.create_all(self.engine)
        self.conn = self.engine.connect()


    def createUser(self, traderId, password):
        """Create user with traderId and password"""
        hashedPassword = hl.md5(password.encode('utf-8')).hexdigest()
        apiKey = hl.md5(hashedPassword.encode('utf-8')).hexdigest()
        userTable = pd.read_sql_table('userTable', self.conn)
        if any(userTable.traderId.astype('object') == traderId):
            print('Username already exists, sorry buddy

        else
            traderInd = len(userTable.traderId)+1
            newUsr = {'traderInd': traderInd, 'traderId': traderId, 'hashedPassword': hashedPassword, 'apiKey': apiKey}
            #self.userTable.insert().execute(newUsr)
            self.conn.execute(self.userTable.insert(), [newUsr,])

    def createUnderlying(self, underlying, traderId, apiKey):
        """Create underlying market providing a traderId and apiKey"""
        apiChk = self.checkApiKey(traderId, apiKey)
        if apiChk:
            newUnderlying = {'outcome': np.nan, 'underlying': underlying, 'traderId': traderId}
            self.conn.execute(self.underlyingData.insert(), [newUnderlying,])
        else:
            print('Bad API key, bucko.')

    def createMarket(self, marketMin, marketMax, expiry, underlying, traderId, apiKey):
        """ Creat market based on underlying """
        apiChk = self.checkApiKey(traderId, apiKey)
        omdTmp = pd.read_sql_table('openMarketData', self.conn)
        if apiChk:
            #TODO: marketNum = max(omdTmp.marketId)+1 -> get rid of extra line
            numMarkets = len(omdTmp)
            newMarket = {'marketId': numMarkets+1, 'marketMin': marketMin, 'marketMax':marketMax, 'expiry': expiry, 'outcome': np.nan, 'underlying': underlying, 'traderId':traderId}
            self.conn.execute(self.openMarketData.insert(), [newMarket, ])
        else:
            print('Bad key. You lose.')

    def proposeTransaction(self, value, underlying, traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        if apiChk:
            self.addTransaction(value, traderId, underlying)
        else:
            print('API key is bad.')

    def proposeRemoveTrade(self, tdNum,  traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        #TODO: read to df with where condition
        orderBook = pd.read_sql_table('orderBook', self.conn)
        obTmp = pd.read_sql_query("SELECT * FROM orderBook WHERE tradeNum = %d" % (tdNum), self.conn)
        tradeOwnerChk = obTmp.traderId == traderId
        if apiChk & tradeOwnerChk[0]:
            self.killTrade(tdNum=tdNum)
        else:
            print('Incorrect API key oryou do not own this trade.')

    def proposeSettlement(self, outcome, underlying, traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        undTmp = pd.read_sql_query("SELECT * FROM underlyingData WHERE underlying = '%s'" % (underlying), self.conn)
        omdTmp = pd.read_sql_query("SELECT * FROM openMarketData WHERE underlying = '%s'" % (underlying), self.conn)
        underlyingOwnerChk = undTmp.traderId[0] == traderId
        if apiChk & underlyingOwnerChk:
            if pd.isnull(undTmp.outcome[0]):

                update(self.underlyingData).where(self.underlyingData.c.underlying == underlying).values(outcome = outcome).execute()
                for i, row in omdTmp.iterrows():
                    marketId = omdTmp.marketId.loc[i]
                    self.settleMarket(outcome, marketId)
            else:
                print('Underlying not expired yet or outcome already set')
        else:
            print('Incorrect API key oryou do now own this market.')



    def checkPassword(self, traderId, password):
        hashedPassword = hl.md5(password).hexdigest()
        utTmp = pd.read_sql_query("SELECT * FROM userTable WHERE traderId = '%s'" % (traderId), self.conn)
        chkPass = utTmp.hashedPassword[0] == hashedPassword
        if chkPass:
            apiKey = utTmp.apiKey[0]
        else:
            apiKey = []

        return (chkPass, apiKey)

    def checkApiKey(self, traderId, apiKey):
        utTmp = pd.read_sql_query("SELECT * FROM userTable WHERE traderId = '%s'" % (traderId), self.conn)
        chkKey = utTmp.apiKey[0] == apiKey
        return chkKey

    #Following were private functions in Matlab

    def addTransaction(self, value, traderId, underlying):
        #TODO: tNum = max(self.transactionTable.transactionNum)+1
        ttTmp = pd.read_sql_table('transactionTable', self.conn)
        if ttTmp.empty:
            tNum = 1
        else:
            tNum = max(ttTmp.transactionNum)+1

        #Create new transaction entry
        #TODO: chuck in time  stamp here
        transactionEntry = {'transactionNum': int(tNum), 'value': value, 'traderId': traderId, 'underlying': underlying, 'timeStamp': date.today() }
        self.conn.execute(self.transactionTable.insert(), [transactionEntry, ])

    def addTrade(self, price, quantity, traderId, marketId):
        #TODO Needs authentication or to be private
        #TODO Get rid of  unnecessary line
        obTmp = pd.read_sql_table('orderBook', self.conn)
        if obTmp.empty:
            tNum = 1
        else:
            tNum = max(obTmp.tradeNum)+1

        trade = {'tradeNum': int(tNum), 'price': price, 'quantity': quantity, 'marketId': int(marketId), 'traderId': traderId, 'timeStamp': date.today() }
        self.conn.execute(self.orderBook.insert(), [trade, ])
        self.matchTrades()

    def removeTrade(self, tdNum):
        ob = pd.read_sql_query("SELECT * FROM orderBook WHERE tradeNum = %d" % (tdNum), self.conn)
        self.addTrade(ob.price[0], ob.quantity[0]*-1, ob.traderId[0], ob.marketId[0])

    def killTrade(self, tdNum):
        self.orderBook.delete(self.orderBook.c.tradeNum == int(tdNum)).execute()

    def matchTrades(self):
        # Match trades where p(ask) < p(bid)
        # Asks are negative quantity
        # Traverse through all markets and match trades
        # TODO: Is it necessary to match all markets  at once?
        omdTmp = pd.read_sql_table('openMarketData', self.conn)
        for mInd, mRow in omdTmp.iterrows():
            mId = omdTmp.marketId.loc[mInd]
            allMatched = False
            while allMatched == False:
                #Make a copy of current order book
                ob = pd.read_sql_table('orderBook', self.conn)
                #Bids  have positive quantities, asks have negative quantities
                bidInd, askInd = (ob.quantity > 0) &  (ob.marketId == mId), (ob.quantity < 0) & (ob.marketId == mId)
                #Is there a bid and offer?
                if (ob.price.loc[bidInd].empty) or (ob.price.loc[askInd].empty):
                    allMatched = True
                else:
                    # Is there a trade to match?
                    if min(ob.price.loc[askInd]) <= max(ob.price.loc[bidInd]):
                        #Candidate bids
                        maxBidInd = (ob.price == max(ob.price.loc[bidInd])) & (ob.quantity>0)
                        maxBid = ob.loc[maxBidInd]
                        #First come first served
                        maxBid = maxBid.iloc[0]
                        #Candidatee asks
                        minAskInd = (ob.price == min(ob.price.loc[askInd])) & (ob.quantity < 0)
                        minAsk = ob.loc[minAskInd]
                        # First come first served
                        minAsk = minAsk.iloc[0]
                        if maxBid.tradeNum < minAsk.tradeNum:
                            #Bid was first
                            price = maxBid.price
                        else:
                            #Ask was  first
                            price = minAsk.price

                        # Trade quantity is the minimum of bid and ask quantity
                        tradeQuantity = min(abs(maxBid.quantity), abs(minAsk.quantity))
                        #Trade number increment
                        mtTmp = pd.read_sql_table('matchedTrades', self.conn)
                        #Below is slightly out of order with ml version that checks tNum 3 lines down
                        if mtTmp.empty:
                            tNum = 1
                        else:
                            tNum = max(mtTmp.tradeNum)+1

                        #Market id
                        omdTmp = pd.read_sql_table('openMarketData', self.conn)
                        mId = omdTmp.marketId.loc[mInd]
                        #Find long and short trader
                        longTrader, shortTrader = maxBid.traderId, minAsk.traderId
                        #Check collateral for both traders and record min and max market outcomes
                        cCheckLong, cCheckShort = self.checkCollateralCrossMarket(price=price, quantity=tradeQuantity, traderId=longTrader, marketId=mId),\
                                                  self.checkCollateralCrossMarket(price=price, quantity=-tradeQuantity, traderId=shortTrader, marketId=mId)
                        if cCheckLong & cCheckShort:
                            #TODO: Put proper timestamps  in here
                            #Create trades
                            newLongTrade =  {'tradeNum': int(tNum), 'price': price, 'quantity': tradeQuantity, 'marketId': int(mId), 'traderId': longTrader, 'timeStamp': date.today() }
                            newShortTrade = {'tradeNum': int(tNum), 'price': price, 'quantity': -tradeQuantity, 'marketId': int(mId), 'traderId': shortTrader, 'timeStamp': date.today()}
                            self.conn.execute(self.matchedTrades.insert(), [newLongTrade, newShortTrade] )
                            #Adjust quantities  in order book
                            #TODO could convert these into one  line each but probably not worth  it
                            startQuantityMaxBid = ob.loc[ob.tradeNum == maxBid.tradeNum, ('quantity')]
                            update(self.orderBook).where(self.orderBook.c.tradeNum == int(maxBid.tradeNum)).values(
                                quantity=startQuantityMaxBid - tradeQuantity).execute()
                            startQuantityMinAsk = ob.loc[ob.tradeNum == minAsk.tradeNum, ('quantity')]
                            update(self.orderBook).where(self.orderBook.c.tradeNum == int(minAsk.tradeNum)).values(
                                quantity=startQuantityMinAsk + tradeQuantity).execute()

                            #Kill any zeros
                            zeroQorders = pd.read_sql_query("SELECT * FROM orderBook WHERE quantity = 0", self.conn)
                            #TODO convert loop to list comprehension
                            for i, row in zeroQorders.iterrows():
                                self.killTrade(tdNum=row.tradeNum)
                        #TODO: Change  these != True  to nots without angering the Python gods
                        elif (cCheckLong!=True) & cCheckShort: #Long trader doesn't have enough collateral
                            #Kill marginal open order of long trader (kills earlier trades first)
                            self.removeMarginalTrade(longTrader)
                        elif cCheckLong & (cCheckShort !=True): #Short trader doesn't have enough collateral
                            self.removeMarginalTrade(shortTrader)
                        elif (cCheckLong!=True) & (cCheckShort!=True):
                            self.removeMarginalTrade(traderId=longTrader)
                            self.removeMarginalTrade(traderId=shortTrader)
                    else:
                        allMatched = True




    def settleMarket(self, outcome, marketId):
        #TODO don't need omdTmp here, can just reference directly and save  a few lines
        #TODO: to wit - finalPrice = min(max(outcome, self.openMarketData.loc[self.openMarketData.marketId == marketId].marketMin[0]), self.openMarketData.loc[self.openMarketData.marketId == marketId].marketMax[0])
        #Choose market outcome
        omdTmp = pd.read_sql_query("SELECT * FROM openMarketData WHERE marketId = '%s'" %(marketId) , self.conn)
        #Set  market  outcome
        update(self.openMarketData).where(self.openMarketData.c.marketId == marketId).values(
            outcome=outcome).execute()
        #Set final price (within market max/min)
        finalPrice = min(max(outcome, omdTmp.marketMin[0]), omdTmp.marketMax[0])
        #Get all market participants
        mt = pd.read_sql_table('matchedTrades', self.conn)
        #Get  unique values in an indexable list
        traders = list(set(mt.traderId))
        #Market index
        marketInd = mt.marketId == marketId
        #Distribute profit to traders
        for i, trader in enumerate(traders):
            #Calculate  profit and loss
            #Trader  index
            traderInd = mt.traderId == trader
            #Profit/loss is sum((finalPrice - matched price(i,j) * quantity(i,j))
            value = sum((finalPrice-mt.loc[traderInd & marketInd, ('price')])) * mt.loc[traderInd & marketInd, 'quantity']
            #Add profit/loss ot transaction ledger
            self.addTransaction(value=value, traderId=trader, underlying= 'Settlement for market ' + str(marketId) )

        #Remove orders  in open market
        #TODO don't need obTmp here
        obTmp = pd.read_sql_query("SELECT * FROM orderBook WHERE marketId = '%s'" %(marketId) , self.conn)
        for i, row in obTmp.iterrows():
            self.killTrade(tdNum=row.tradeNum)
        #TODO: don't really need a separate table for settled markets, can just set a flag in market data... too much hassle to change
        #Move market to settled market
        settledMarket = pd.read_sql_query("SELECT * FROM openMarketData WHERE marketId = '%s'" %(marketId) , self.conn)
        #Insert into settled market table by converting row to dictionary
        self.conn.execute(self.settledMarketData.insert(), [settledMarket.loc[0].to_dict(), ])
        #Remove market from open markets
        self.openMarketData.delete(self.openMarketData.c.marketId == marketId).execute()

    def checkCollateralCrossMarket(self, price, quantity, traderId, marketId):
        #Checks if trader has sufficient collateral to covr a new  trade (incorporating trades from markets
        #with the same underlying) given existing open and matched trades.
        #
        # Condition is:
        # Is the maximum loss on *any one* unmatched  trade plus the associated outcome of the matched trades
        # greater than the amount of available  collateral?
        #
        # To calculate this consider the worst case for the following given that the market settles
        # at  the maxiumum or minimum
        #
        # - Matched trades [matchedTrades] (all)
        # - Trades in the order book [orderBook] (minimum for single order)
        # - The proposed new trade
        #
        # In all cases the outcome  should be greater than the current collateral (sum of transaction table)
        #
        # Construct all possible underlying outcomes and associated market outcomes
        #
        #TODO: only need to test markets where trader has an open or matched order. Cross market checking is going to become combinatorically troublesome...
        marketOutcomes, underlyingOutcomes = self.constructOutcomeCombinations()
        # number of combinations
        numCombinations = len(marketOutcomes)
        ob, mt, omd = pd.read_sql_table('orderBook', self.conn), pd.read_sql_table('matchedTrades', self.conn), pd.read_sql_table('openMarketData', self.conn)
        #Current transactions index for current  traderand  market
        ownTransactions = pd.read_sql_query("SELECT * FROM transactionTable WHERE traderId = '%s'" %(traderId) , self.conn)
        #Create price and quantity across all markets (will be zero for all other markets)
        priceAllMarkets, quantityAllMarkets = [0]*len(omd), [0]*len(omd)
        #Find  index for marketId in omd table
        marketInd = omd.loc[omd.marketId == marketId].index[0]
        priceAllMarkets[marketInd] = price
        quantityAllMarkets[marketInd] = quantity
        for mInd, market in omd.iterrows():
            #Check collateral across all markets that existing matched trades and worst case hit  on
            # open trade/new trade  outcome has sufficient collateral
            #Market id
            mId = market.marketId
            #Open orders  index for current trader and market
            indOpenOrders = (ob.traderId == traderId) & (ob.marketId == marketId)
            #Matched trades index for current trader  and market
            indMatchedTrades = (mt.traderId == traderId) & (mt.marketId == mId)
            #Current transactions for current trader and market
            #Open orders for current trader and market
            ownOpenOrders = ob.loc[indOpenOrders]
            #Matched  trades for current  traderand  market
            ownMatchedTrades = mt.loc[indMatchedTrades]
            #Market  index
            marketIndex = omd.marketId[omd.marketId == mId].index[0]
            #Pre-allocate order outcomes
            newOrderOutcome = [0]* len(omd)
            #Pre-allocate test market outcomes
            testMarket = [[0 for x in omd.iterrows()] for y in range(numCombinations)]
            #Collateral test: current  transaction cash + matched orders + worst  single open order hit (in
            #all possible combinations of cases)
            for comboInd in range(numCombinations):
                outcomeTmp = marketOutcomes[comboInd][marketIndex]
                matchedOutcome = sum((outcomeTmp - ownMatchedTrades.price) * ownMatchedTrades.quantity)
                #Worst  open trade outcome
                openOutcome = min((outcomeTmp-ownOpenOrders.price) * ownOpenOrders.quantity)
                #New order outcome (only count new order for target market)
                newOrderOutcome[mInd] = (outcomeTmp - priceAllMarkets[marketIndex]) * quantityAllMarkets[marketIndex] * (mId == marketId)
                #Worst case outcome  for market min case (matched orders settled at market min and worst of any open trade  or new order)
                if not openOutcome:
                    testMarket[comboInd][mInd] = np.sum(matchedOutcome) + np.sum(newOrderOutcome[mInd])
                else:
                    testMarket[comboInd][mInd] = np.sum(matchedOutcome) + np.min([np.sum(openOutcome), np.sum(newOrderOutcome[mInd])])

            testMarketValue = np.sum(testMarket,1) + np.sum(ownTransactions.value)
            if all(testMarketValue >=0):
                colChk = True
            else:
                #No dice
                colChk = False

        return colChk


    def removeMarginalTrade(self, traderId):
        #Kill marginal trade of trader (earliesst trade, any market) to free up
        #worst case collateral
        openOrdersTradeNum = pd.read_sql_query("SELECT tradeNum FROM orderBook WHERE traderId = '%s'" %(traderId) , self.conn)
        self.killTrade(tdNum=openOrdersTradeNum.loc[0].tradeNum)

    def constructOutcomeCombinations(self):
        # Returns market outcomes and combination outcomes (all possible combinations of outcomes)
        md = pd.read_sql_table('openMarketData', self.conn)
        numMarkets = len(md)
        #Unique underlyings
        underlyings = list(set(md.underlying))
        numUnderlyings = len(underlyings)
        #Market min and maxes
        marketMins, marketMaxes = md.marketMin, md.marketMax
        tmp = list()
        for i, row in enumerate(underlyings):
            ind = underlyings.index(row)
            underlyingMin, underlyingMax = np.min(marketMins[ind]),  np.max(marketMaxes[ind])
            #TODO: not sure this is correctly translateed from ml
            tmp.append(list({underlyingMin, underlyingMax}))

        #Construct all possible combinations of min/max, e.g. for two binary markets [0,1], [0,1] -> [(0,0), (0,1), (1,0), (1,1)]
        underlyingOutcomes = list(itertools.product(*tmp))
        numCombinations = len(underlyingOutcomes)
        # Pre-allocate test market outcomes
        marketOutcomes = [[0 for x in range(numMarkets)] for y in range(numCombinations)]
        #TODO: Check this logic
        #Consruct market outcomes in all corner underlying outcomes
        for i in range(numCombinations):
            for j in range(numMarkets):
                #Find index of underlying
                underlyingInd = underlyings.index(md.underlying[j])
                #Market outcome in market based on underlying outcome
                marketOutcomes[i][j] = min(max(marketMins[j], underlyingOutcomes[i][underlyingInd]), marketMaxes[j])


        return (marketOutcomes, underlyingOutcomes)


#Set up sql
# engine = create_engine('sqlite:///:memory:', echo=True)
# conn = engine.connect()
# metadata = MetaData()
# metadata.create_all(engine)

# TODO implement as unit tests

# m = MarketObject()
# m.sqlConnection = conn
# m.useSqlTables = 1


# m.createUser(traderId='haresh', password='hareshpass')
# m.createUser(traderId='zwif', password ='zwifpass')
# m.createUser(traderId='ando', password='andopasss')
 print(pd.read_sql_table('userTable', m.conn))

# m.createUnderlying(underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
# m.createUnderlying(underlying='raiders', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
print(pd.read_sql_table('underlyingData', m.conn))


# m.createMarket(marketMin=0, marketMax=1, expiry=date.today() , underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
print(pd.read_sql_table('openMarketData', m.conn))

# m.addTransaction(value=1000, traderId='haresh', underlying='loadup')
# m.addTransaction(value=1000, traderId='zwif', underlying='loadup')
print(pd.read_sql_table('transactionTable', m.conn))



#Market ids are 1/2 for broncos/raiders
m.addTrade(price=0.5, quantity=10, traderId='haresh', marketId=1)
#m.addTrade(4, 10, 'haresh', 1)
#m.addTrade(2, 3, 'haresh', 1)
#Ask 10 at 101
m.addTrade(price=0.4, quantity=-25, traderId='zwif', marketId=1)
#Try another trade
#m.addTrade(10, 10, 'haresh', 1)
m.proposeSettlement(outcome=1, underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
#m.killTrade(2)




print('Open market data')
print(pd.read_sql_table('openMarketData', m.conn))
print('Underlying data')
print(pd.read_sql_table('underlyingData', m.conn))
print('Transaction table')
print(pd.read_sql_table('transactionTable', m.conn))
print('User table')
print(pd.read_sql_table('userTable', m.conn))
print('Order book')
print(pd.read_sql_table('orderBook', m.conn))
print('Matched trades')
print(pd.read_sql_table('matchedTrades', m.conn))

#TODO sign each transaction on the ledger with key?
#TODO: get tables talking to SQL
#TODO: input checks
#TODO: authentication


#Notes:
# Using newUsr = {'traderId': traderId, 'hashedPassword': hashedPassword, 'apiKey': apiKey} and then appending to df (could use dict
# dict( traderId = traderId, hashedPassword = hashedPassword, apiKey = apiKey) )
# Append with self.userTable = self.userTable.append(newUsr, ignore_index=True) - need assignment here because append just returns a copy

# Trying to use dataframe.loc[dataframe.colname == condition, ('colname')] (rather than, say,
# dataframe[dataframe.colname == condition].colname ) for picking out df rows with boolean series because python
# Maybe use .ix instead of .loc/.iloc?
#
# Check empty df row on boolean index with e.g. ob.price.loc[bidInd].empty

#Use 'set' for unique values, e.g. traders = list(set(mt.traderId)) gives a list with the set of unique traderIds
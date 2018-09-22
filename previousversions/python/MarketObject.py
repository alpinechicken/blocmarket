import hashlib as hl
import pandas as pd
import DateTime as dt
import numpy as np
import itertools

#Sql imports
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, ForeignKey
from sqlalchemy.sql import select


#TODO could combine some select/apply combos with grouping funcitons

class MarketObject(object):
    #'Market object class'

    def __init__(self):
        self.useSqlTables = 1;
        self.sqlConnection = 0;
        self.sqlTableRoot = 'Exchange.dbo';
        self._userTable = pd.DataFrame(
                                       columns={'traderId', 'hashedPassword', 'apiKey'})
        self._orderBook = pd.DataFrame(
                                       columns =  {'tradeNum', 'price', 'quantity', 'marketId', 'traderId', 'timeStamp'})
        self._matchedTrades = pd.DataFrame(
                                       columns =  {'tradeNum', 'price', 'quantity', 'marketId', 'traderId', 'timeStamp'})
        self._underlyingData = pd.DataFrame(
                                       columns = {'outcome', 'underlying', 'traderId'})
        self._openMarketData = pd.DataFrame(
                                       columns = {'marketId', 'marketMin', 'marketMax', 'expiry', 'outcome', 'underlying', 'traderId'})
        self._settledMarketData = pd.DataFrame(
                                       columns = {'marketId', 'marketMin', 'marketMax', 'expiry', 'outcome', 'underlying', 'traderId'})
        self._transactionTable = pd.DataFrame(
                                       columns = {'transactionNum', 'value', 'traderId', 'underlying', 'timeStamp'})
        #marketFile = 'marketData.mat'

    #Set and  get methods for tables (pattern: declare _myAttribute,
    #  then def myAttribute decorated with @property (get) and @myAttribute.setter (set))

    ## Test sql implementation for tables
    #  @property
    # def userTable(self):
    #     if self.useSqlTables & (self.sqlConnection != 0):
    #         pd.read_sql_table('userTable', self.sqlConnection)
    #     else:
    #         return self._userTable
    #
    # @userTable.setter
    # def userTable(self, value):
    #     if self.useSqlTables & (self.sqlConnection != 0):
    #         value.to_sql('userTable', self.sqlConnection)
    #     else:
    #         self._userTable = value
    #

    @property
    def userTable(self):
            return self._userTable

    @userTable.setter
    def userTable(self, value):
            self._userTable = value

    @property
    def orderBook(self):
        return self._orderBook

    @orderBook.setter
    def orderBook(self, value):
        self._orderBook = value

    @property
    def matchedTrades(self):
        return self._matchedTrades

    @matchedTrades.setter
    def matchedTrades(self, value):
        self._matchedTrades = value

    @property
    def underlyingData(self):
        return self._underlyingData

    @underlyingData.setter
    def underlyingData(self, value):
        self._underlyingData = value

    @property
    def openMarketData(self):
        return self._openMarketData

    @openMarketData.setter
    def openMarketData(self, value):
        self._openMarketData = value

    @property
    def settledMarketData(self):
        return self._settledMarketData

    @settledMarketData.setter
    def settledMarketData(self, value):
        self._settledMarketData = value

    @property
    def transactionTable(self):
        return self._transactionTable

    @transactionTable.setter
    def transactionTable(self, value):
        self._transactionTable = value

    def createUser(self, traderId, password):
        hashedPassword = hl.md5(password.encode('utf-8')).hexdigest()
        apiKey = hl.md5(hashedPassword.encode('utf-8')).hexdigest()
        if any(self.userTable.traderId == traderId):
            print('Username already exists, sorry buddy.')
        else:
            newUsr = {'traderId': traderId, 'hashedPassword': hashedPassword, 'apiKey': apiKey}
            self.userTable = self.userTable.append(newUsr, ignore_index=True)
            print(newUsr)

    def createUnderlying(self, underlying, traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        if apiChk:
            newUnderlying = {'outcome': np.nan, 'underlying': underlying, 'traderId': traderId}
            self.underlyingData = self.underlyingData.append(newUnderlying, ignore_index=True)
        else:
            print('Bad API key, bucko.')

    def createMarket(self, marketMin, marketMax, expiry, underlying, traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        omdTmp = self.openMarketData
        if apiChk:
            #TODO: marketNum = max(omdTmp.marketId)+1 -> get rid of extra line
            numMarkets = len(omdTmp)
            newMarket = {'marketId': numMarkets+1, 'marketMin': marketMin, 'marketMax':marketMax, 'expiry': expiry, 'outcome': np.nan, 'underlying': underlying, 'traderId':traderId}
            self.openMarketData = self.openMarketData.append(newMarket, ignore_index=True)
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
        obTmp = self.orderBook.loc[self.orderBook.tradeNum == tdNum]
        tradeOwnerChk = obTmp.traderId == traderId
        if apiChk & tradeOwnerChk[0]:
            self.killTrade(tdNum)
        else:
            print('Incorrect API key oryou do not own this trade.')

    def proposeSettlement(self, outcome, underlying, traderId, apiKey):
        apiChk = self.checkApiKey(traderId, apiKey)
        undTmp = self.underlyingData.loc[self.underlyingData.underlying == underlying]
        omdTmp = self.openMarketData.loc[self.openMarketData.underlying == underlying]
        underlyingOwnerChk = undTmp.traderId[0] == traderId
        if apiChk & underlyingOwnerChk:
            if pd.isnull(undTmp.outcome[0]):
                self.underlyingData.outcome.loc[self.underlyingData.underlying == underlying] = outcome
                for i, row in omdTmp.iterrows():
                    marketId = omdTmp.marketId.loc[i]
                    self.settleMarket(outcome, marketId)
            else:
                print('Underlying not expired yet or outcome already set')
        else:
            print('Incorrect API key oryou do now own this market.')



    def checkPassword(self, traderId, password):
        hashedPassword = hl.md5(password).hexdigest()
        #TODO: get rid of unnecessary utTmp line: chkPass = self.userTable.loc[self.userTable.traderId==traderId].hashedPassword[0]==hashedPassword
        utTmp = self.userTable.loc[self.userTable.traderId==traderId]
        chkPass = utTmp.hashedPassword[0] == hashedPassword
        if chkPass:
            apiKey = utTmp.apiKey[0]
        else:
            apiKey = []

        return (chkPass, apiKey)

    def checkApiKey(self, traderId, apiKey):
        #TODO: get rid  of unneecessary utTmp line: chkKey = self.userTable.loc[self.userTable.traderId == traderId].apiKey[0] == apiKey
        utTmp = self.userTable.loc[self.userTable.traderId == traderId]
        chkKey = utTmp.apiKey[0] == apiKey
        return chkKey

    #Following were private functions in Matlab

    def addTransaction(self, value, traderId, underlying):
        #TODO: tNum = max(self.transactionTable.transactionNum)+1
        ttTmp = self.transactionTable
        if ttTmp.empty:
            tNum = 1
        else:
            tNum = max(ttTmp.transactionNum)+1

        #Create new transaction entry
        #TODO: chuck in time  stamp here
        transactionEntry = {'transactionNum': tNum, 'value': value, 'traderId': traderId, 'underlying': underlying, 'timeStamp': 'placeHolderTimeStamp' }
        self.transactionTable = self.transactionTable.append(transactionEntry, ignore_index=True)

    def addTrade(self, price, quantity, traderId, marketId):
        #TODO Needs authentication or to be private
        #TODO Get rid of  unnecessary line
        obTmp = self.orderBook
        if obTmp.empty:
            tNum = 1
        else:
            tNum = max(obTmp.tradeNum)+1

        trade = {'tradeNum': tNum, 'price': price, 'quantity': quantity, 'marketId': marketId, 'traderId': traderId, 'timeStamp': 'placeHolderTimeStamp' }
        self.orderBook = self.orderBook.append(trade, ignore_index=True)
        self.matchTrades()

    def removeTrade(self, tdNum):
        ob = self.orderBook.loc[self.orderBook.tradeNum == tdNum]
        self.addTrade(ob.price[0], ob.quantity[0]*-1, ob.traderId[0], ob.marketId[0])

    def killTrade(self, tdNum):
        self.orderBook = self.orderBook.loc[self.orderBook.tradeNum != tdNum]

    def matchTrades(self):
        # Match trades where p(ask) < p(bid)
        # Asks are negative quantity
        # Traverse through all markets and match trades
        # TODO: Is it necessary to match all markets  at once?
        omdTmp = self.openMarketData
        for mInd, mRow in omdTmp.iterrows():
            mId = omdTmp.marketId.loc[mInd]
            allMatched = False
            while allMatched == False:
                #Make a copy of current order book
                ob = self.orderBook
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
                        mtTmp = self.matchedTrades
                        #Below is slightly out of order with ml version that checks tNum 3 lines down
                        if mtTmp.empty:
                            tNum = 1
                        else:
                            tNum = max(mtTmp.tradeNum)+1

                        #Market id
                        omdTmp = self.openMarketData
                        mId = omdTmp.marketId.loc[mInd]
                        #Find long and short trader
                        longTrader, shortTrader = maxBid.traderId, minAsk.traderId
                        #Check collateral for both traders and record min and max market outcomes
                        cCheckLong = self.checkCollateralCrossMarket(price=price, quantity=tradeQuantity, traderId=longTrader, marketId=mId)
                        cCheckShort = self.checkCollateralCrossMarket(price=price, quantity=-tradeQuantity, traderId=shortTrader, marketId=mId)
                        if cCheckLong & cCheckShort:
                            #TODO: Put proper timestamps  in here
                            #Create trades
                            newLongTrade =  {'tradeNum': tNum, 'price': price, 'quantity': tradeQuantity, 'marketId': mId, 'traderId': longTrader, 'timeStamp': 'placeHolderTimeStamp' }
                            newShortTrade = {'tradeNum': tNum, 'price': price, 'quantity': -tradeQuantity, 'marketId': mId, 'traderId': shortTrader, 'timeStamp': 'placeHolderTimeStamp'}
                            self.matchedTrades = self.matchedTrades.append(newLongTrade, ignore_index=True)
                            self.matchedTrades = self.matchedTrades.append(newShortTrade, ignore_index=True)
                            #Adjust quantities  in order book
                            #TODO could convert these into one  line each but probably not worth  it
                            startQuantityMaxBid = self.orderBook.loc[self.orderBook.tradeNum == maxBid.tradeNum, ('quantity')]
                            self.orderBook.loc[self.orderBook.tradeNum == maxBid.tradeNum, ('quantity')] = startQuantityMaxBid - tradeQuantity
                            startQuantityMinAsk = self.orderBook.loc[self.orderBook.tradeNum == minAsk.tradeNum, ('quantity')]
                            self.orderBook.loc[self.orderBook.tradeNum == minAsk.tradeNum, ('quantity')] = startQuantityMinAsk + tradeQuantity

                            #Kill any zeros
                            zeroQorders = self.orderBook.loc[self.orderBook.quantity==0]
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
        omdTmp = self.openMarketData.loc[self.openMarketData.marketId == marketId]
        #Set  market  outcome
        self.openMarketData.loc[self.openMarketData.marketId == marketId, 'outcome'] = outcome
        #Set final price (within market max/min)
        finalPrice = min(max(outcome, omdTmp.marketMin[0]), omdTmp.marketMax[0])
        #Get all market participants
        mt = self.matchedTrades
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
            #TODO add a useful identifier as a message
            self.addTransaction(value=value, traderId=trader, underlying='tmpMessage' )

        #Remove orders  in open market
        #TODO don't need obTmp here
        obTmp = self.orderBook.loc[self.orderBook.marketId == marketId]
        for i, row in obTmp.iterrows():
            self.killTrade(row.tradeNum)
        #TODO: don't really need a separate table for settled markets, can just set a flag in market data... too much hassle to change
        #Move market to settled market
        settledMarket = self.openMarketData.loc[self.openMarketData.marketId == marketId]
        self.settledMarketData = self.settledMarketData.append(settledMarket, ignore_index=True)
        #Remove market from open markets
        self.openMarketData = self.openMarketData.loc[self.openMarketData.marketId != marketId]

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
        # In all cases the outcome  should be greater than the current collateral (sum of transaction  table)
        #
        # Construct all possible underlying outcomes and associated market outcomes
        #
        #TODO: only need to test markets where trader has an open or matched order. Cross market checking is going to become combinatorically troublesome...
        marketOutcomes, underlyingOutcomes = self.constructOutcomeCombinations()
        # number of combinations
        numCombinations = len(marketOutcomes)
        ob, mt, omd = self.orderBook, self.matchedTrades, self.openMarketData
        #Current transactions index for current  traderand  market
        ownTransactions = self.transactionTable.loc[self.transactionTable.traderId == traderId]
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
        openOrdersTradeNum = self.orderBook.loc[self.orderBook.traderId==traderId, ('tradeNum')]
        self.killTrade(openOrdersTradeNum[0])

    def constructOutcomeCombinations(self):
        md = self.openMarketData
        numMarkets = len(md)
        #Unique underlyings
        underlyings = list(set(md.underlying))
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
engine = create_engine('sqlite:///:memory:', echo=True)
conn = engine.connect()
metadata = MetaData()
metadata.create_all(engine)

m = MarketObject()
m.sqlConnection = conn
m.useSqlTables = 1


m.createUser(traderId='haresh', password='hareshpass')
m.createUser(traderId='zwif', password ='zwifpass')
m.createUser(traderId='ando', password='andopasss')
m.createUnderlying(underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
m.createUnderlying(underlying='raiders', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')


m.createMarket(marketMin=0, marketMax=1, expiry='thursday', underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
m.addTransaction(value=1000, traderId='haresh', underlying='loadup')
m.addTransaction(value=1000, traderId='zwif', underlying='loadup')

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





print(m.openMarketData)
print('Open market data')
print(m.underlyingData)
print('Transaction table')
print(m.transactionTable)
print('User table')
print(m.userTable)
print('Order book')
print(m.orderBook)
print('Matched trades')
print(m.matchedTrades)

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
from bloc.BlocServer import BlocServer
from bloc.BlocClient import BlocClient
import unittest
import pandas as pd


class TestBlocServer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Setup market server and two clients
        cls.bc1 = BlocClient()
        cls.bc2 = BlocClient()
        cls.bs = BlocServer()
        cls.bs.purgeTables()
        cls.bs.COLLATERAL_LIMIT = 2
        # Pull user table to ensure is empty
        tmpUserTable = pd.read_sql_table('userTable', cls.bs.conn)
        # Generate signature keys for two traders
        cls.bc1.generateSignatureKeys()
        cls.bc2.generateSignatureKeys()
        # Register keys with market server
        cls.bs.createUser(cls.bc1.verifyKey_hex)
        usr = cls.bs.createUser(cls.bc2.verifyKey_hex)

        tmp = pd.read_sql_query('SELECT DISTINCT "traderId" from "userTable" ORDER BY "traderId"', cls.bs.conn)
        cls.trader0 = tmp.traderId[0]
        cls.trader1 = tmp.traderId[1]
        print(usr)

    def setUp(self):
        # Register verify keys
        self.bs.purgeNonUserTables()

        marketRow = pd.DataFrame({'marketRootId': [1],
                                  'marketBranchId': [1],
                                  'marketMin': [0],
                                  'marketMax': [1],
                                  'traderId': [int(self.trader0)]})
        self.bc1.createMarket_client(marketRow=marketRow, blocServer=self.bs)

        marketRow = pd.DataFrame({'marketRootId': [1],
                                  'marketBranchId': [2],
                                  'marketMin': [0.1],
                                  'marketMax': [0.9],
                                  'traderId': [int(self.trader0)]})
        self.bc1.createMarket_client(marketRow=marketRow, blocServer=self.bs)

        marketRow = pd.DataFrame({'marketRootId': [2],
                                  'marketBranchId': [1],
                                  'marketMin': [0],
                                  'marketMax': [1],
                                  'traderId': [int(self.trader0)]})
        self.bc1.createMarket_client(marketRow=marketRow, blocServer=self.bs)
        assert len(pd.read_sql_table('marketTable', self.bs.conn))==3

    def testOverwriteMarket(self):

        # Try to create a market for trader2 already made by trader1
        marketRow = pd.DataFrame({'marketRootId': [1],
                                  'marketBranchId': [1],
                                  'marketMin': [0],
                                  'marketMax': [1],
                                  'traderId': [int(self.trader1)]})
        self.bc2.createMarket_client(marketRow=marketRow, blocServer=self.bs)
        assert len(pd.read_sql_table('marketTable', self.bs.conn)) == 3

    # BlocClient tests
    # @unittest.skipIf(False)
    def test_tradeMaker(self):
        #  Make a trade
        prevTrade = self.bs.getPreviousOrder()
        tradeRow = pd.DataFrame({'marketId': [1],
                                 'price': [0.5],
                                 'quantity': [1],
                                 'traderId': [int(self.trader0)]})
        a = self.bc1.tradeMaker(prevTrade=prevTrade, tradeRow=tradeRow)
        # Check trade signatures
        assert self.bc1.verifyMessage(a['signature'][0], a['signatureMsg'][0], self.bc1.verifyKey_hex)
        # Will error if verfication fails

    def testSettleMarketUp(self):
        marketRow = pd.DataFrame({'marketRootId': [1],
                                  'marketBranchId': [1],
                                  'marketMin': [1],
                                  'marketMax': [1],
                                  'traderId': [int(self.trader0)]})
        self.bc1.createMarket_client(marketRow=marketRow, blocServer=self.bs)
        marketBounds = pd.read_sql_table('marketBounds', self.bs.conn)
        assert (marketBounds[['marketRootId', 'marketBranchId', 'marketMin', 'marketMax']].values == [[1, 1, 1, 1],
                                                                                                      [1, 2, 0.9, 0.9],
                                                                                                      [2, 1, 0,
                                                                                                       1]]).all()

    def testSettleMarketDown(self):
        marketRow = pd.DataFrame({'marketRootId': [1],
                                  'marketBranchId': [1],
                                  'marketMin': [0],
                                  'marketMax': [0],
                                  'traderId': [int(self.trader0)]})
        check, allChecks = self.bc1.createMarket_client(marketRow=marketRow, blocServer=self.bs)
        marketBounds = pd.read_sql_table('marketBounds', self.bs.conn)
        assert (marketBounds[['marketRootId', 'marketBranchId', 'marketMin', 'marketMax']].values == [[1, 1, 0, 0],
                                                                                                      [1, 2, 0.1, 0.1],
                                                                                                      [2, 1, 0,
                                                                                                       1]]).all()

    def testMatchTrade(self):
        tradeRow = pd.DataFrame({'marketId': [1],
                                 'price': [0.5],
                                 'quantity': [1],
                                 'traderId': [int(self.trader0)]})
        self.bc1.createTrade_client(tradeRow=tradeRow, blocServer=self.bs)

        tradeRow = pd.DataFrame({'marketId': [1],
                                 'price': [0.5],
                                 'quantity': [-1],
                                 'traderId': [int(self.trader1)]})
        self.bc2.createTrade_client(tradeRow=tradeRow, blocServer=self.bs)

        tradeRow = pd.DataFrame({'marketId': [1],
                                 'price': [0.8],
                                 'quantity': [-1],
                                 'traderId': [int(self.trader1)]})

        check, allChecks  =self.bc2.createTrade_client(tradeRow=tradeRow, blocServer=self.bs)
        oB = pd.read_sql_table('orderBook', self.bs.conn)
        assert oB.shape[0] == 3

        prevTrade = self.bs.getPreviousOrder()
        tradeRow = pd.DataFrame({'marketId': [1],
                                 'price': [0.9],
                                 'quantity': [-1],
                                 'traderId': [int(self.trader1)]})
        tradePackage = self.bc2.tradeMaker(prevTrade=prevTrade,
                                           tradeRow=tradeRow)


        colChk, details = self.bs.checkCollateral(tradePackage['price'][0], tradePackage['quantity'][0], tradePackage['marketId'][0], tradePackage['traderId'][0])
        assert colChk == True

    def testRemoveTrade(self):
        # Test trade removal:
        # - Load up a bunch of open orders in market 1
        # - Load up matched orders in market 2
        # = Eventually the collateral limit is hit the market should try to
        #   offset ALL trades in market one to free up collateral.

        # Trader 1 puts in five orders in market 1
        for iTrade in range(4):
            tradeRow = pd.DataFrame({'marketId': [1],
                                     'price': [0.4],
                                     'quantity': [1],
                                     'traderId': [int(self.trader0)]})
            self.bc1.createTrade_client(tradeRow=tradeRow, blocServer=self.bs)

        # Five matched orders in market 2
        for iTrade in range(5):
            # Trader 1 bid at 0.5
            tradeRow = pd.DataFrame({'marketId': [3],
                                     'price': [0.5],
                                     'quantity': [1],
                                     'traderId': [int(self.trader0)]})
            self.bc1.createTrade_client(tradeRow=tradeRow, blocServer=self.bs)
            # Trader 2 offer at 0.5
            tradeRow = pd.DataFrame({'marketId': [3],
                                     'price': [0.5],
                                     'quantity': [-1],
                                     'traderId': [int(self.trader1)]})
            self.bc2.createTrade_client(tradeRow=tradeRow, blocServer=self.bs)

        colChk, details = self.bs.checkCollateral(tInd_=1)
        oB = pd.read_sql_table("orderBook", self.bs.conn)
        #assert len(oB) == 12
        assert len(oB.loc[oB['iRemoved'],:])==4
        assert len(oB.loc[oB['iMatched'], :]) == 8
        assert colChk == True

    def testManyTrades(self):
        # Add bunch of matched trades in market 2
        for iTrade in range(3):
            # Trader 1 bid at 0.5
            tradeRow = pd.DataFrame({'marketId': [3],
                                     'price': [0.5],
                                     'quantity': [1],
                                     'traderId': [int(self.trader0)]})
            self.bc1.createTrade_client(tradeRow=tradeRow,
                                        blocServer=self.bs)
            # Trader 2 offer at 0.5
            tradeRow = pd.DataFrame({'marketId': [3],
                                     'price': [0.5],
                                     'quantity': [-1],
                                     'traderId': [int(self.trader1)]})
            self.bc2.createTrade_client(tradeRow=tradeRow,
                                        blocServer=self.bs)
            # Trader 2 bid at 0.5
            tradeRow = pd.DataFrame({'marketId': [3],
                                     'price': [0.5],
                                     'quantity': [1],
                                     'traderId': [int(self.trader1)]})

            self.bc2.createTrade_client(tradeRow=tradeRow,
                                        blocServer=self.bs)
            # Trader 2 offer at 0.5
            tradeRow = pd.DataFrame({'marketId': [3],
                                     'price': [0.5],
                                     'quantity': [-1],
                                     'traderId': [int(self.trader0)]})
            self.bc1.createTrade_client(tradeRow=tradeRow,
                                        blocServer=self.bs)
        colChk =self.bs.checkCollateral(tInd_=1)
        assert len(pd.read_sql_table("orderBook", self.bs.conn))==12
        assert colChk

    def testsMakeManyMarkets(self):

        for iMarket in [2, 3, 4, 5]:
            marketRow = pd.DataFrame({'marketRootId': [iMarket],
                                      'marketBranchId': [1],
                                      'marketMin': [0],
                                      'marketMax': [1],
                                      'traderId': [int(self.trader0)]})
            self.bc1.createMarket_client(marketRow=marketRow,
                                         blocServer=self.bs)
        assert len(pd.read_sql_table("marketBounds", self.bs.conn)) == 6


if __name__ == '__main__':
    unittest.main(exit=False)

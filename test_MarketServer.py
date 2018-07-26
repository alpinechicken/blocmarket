from MarketServer import MarketServer
from MarketClient import MarketClient
import unittest
import pandas as pd


class TestMarketServer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Setup market server and two clients
        cls.mc1 = MarketClient()
        cls.mc2 = MarketClient()
        cls.ms = MarketServer()
        cls.ms.purgeTables()
        # Pull user table to ensure is empty
        tmpUserTable = pd.read_sql_table('userTable', cls.ms.conn)
        # Generate signature keys for two traders
        cls.mc1.generateSignatureKeys()
        cls.mc2.generateSignatureKeys()
        cls.ms.createUser(cls.mc1.verifyKey_hex)
        cls.ms.createUser(cls.mc2.verifyKey_hex)

    def setUp(self):
        # Register verify keys
        self.ms.purgeNonUserTables()

        # Setup previous market row
        prevMarket = self.ms.getPreviousMarket()
        marketRow = pd.DataFrame({'marketRootId': [1],
                                   'marketBranchId': [1],
                                   'marketMin': [0],
                                   'marketMax': [1],
                                   'traderId': [1]})
        testMarket = self.mc1.marketMaker(previousMarketRow=prevMarket, marketRow=marketRow)
        self.ms.createMarket(newMarket=testMarket)


        prevMarket = self.ms.getPreviousMarket()
        marketRow = pd.DataFrame({'marketRootId': [1],
                                   'marketBranchId': [2],
                                   'marketMin': [0.1],
                                   'marketMax': [0.9],
                                   'traderId': [1]})
        testMarket = self.mc1.marketMaker(previousMarketRow=prevMarket, marketRow=marketRow)
        self.ms.createMarket(newMarket=testMarket)


        prevMarket = self.ms.getPreviousMarket()
        marketRow = pd.DataFrame({'marketRootId': [2],
                                   'marketBranchId': [1],
                                   'marketMin': [0],
                                   'marketMax': [1],
                                   'traderId': [1]})
        testMarket = self.mc1.marketMaker(previousMarketRow=prevMarket, marketRow=marketRow)
        self.ms.createMarket(newMarket=testMarket)
        mT = pd.read_sql_table('marketTable', self.ms.conn)
        assert mT.shape[0] == 3

    # MarketClient tests
    # @unittest.skipIf(False)
    def test_tradeMaker(self):
        #  Make a trade
        prevTrade = self.ms.getPreviousTrade()
        # prevTrade = pd.DataFrame({'tradeRootId': 1, 'signature': ['abc'.encode('utf-8')]})
        tradeRow = pd.DataFrame({'marketRootId': [1],
                              'marketBranchId': [1],
                              'price': [0.5],
                              'quantity': [1],
                              'traderId': [1]})
        a = self.mc1.tradeMaker(prevTrade=prevTrade,tradeRow=tradeRow).reset_index(drop=True)
        # Check trade signatures
        assert self.mc1.verifyMessage(a['signature'][0], a['signatureMsg'][0], self.mc1.verifyKey_hex)
        assert self.mc1.verifyMessage(a['signature'][1], a['signatureMsg'][1], self.mc1.verifyKey_hex)
        assert self.mc1.verifyMessage(a['signature'][2], a['signatureMsg'][2], self.mc1.verifyKey_hex)
        # Will error if verfication fails

    def testSettleMarketUp(self):
        prevMarket = self.ms.getPreviousMarket()
        marketRow = pd.DataFrame({'marketRootId': [1],
                                   'marketBranchId': [1],
                                   'marketMin': [1],
                                   'marketMax': [1],
                                   'traderId': [1]})
        testMarket = self.mc1.marketMaker(prevMarket, marketRow)
        self.ms.createMarket(newMarket=testMarket)
        marketBounds = pd.read_sql_table('marketBounds', self.ms.conn)
        assert (marketBounds[['marketRootId', 'marketBranchId', 'marketMin', 'marketMax']].values == [[1, 1, 1, 1],
                                                             [1, 2, 0.9, 0.9],
                                                             [2,1, 0, 1]]).all()

    def testSettleMarketDown(self):
        prevMarket = self.ms.getPreviousMarket()
        marketRow = pd.DataFrame({'marketRootId': [1],
                                   'marketBranchId': [1],
                                   'marketMin': [0],
                                   'marketMax': [0],
                                   'traderId': [1]})
        testMarket = self.mc1.marketMaker(prevMarket, marketRow)
        self.ms.createMarket(newMarket=testMarket)
        marketBounds = pd.read_sql_table('marketBounds', self.ms.conn)
        assert (marketBounds[['marketRootId', 'marketBranchId', 'marketMin', 'marketMax']].values == [[1, 1, 0, 0],
                                                             [1, 2, 0.1, 0.1],
                                                             [2,1, 0, 1]]).all()

    def testMatchTrade(self):
        prevTrade = self.ms.getPreviousTrade()
        tradeRow = pd.DataFrame({'marketRootId': [1],
                                 'marketBranchId': [1],
                                 'price': [[0.5, 0.4]],
                                 'quantity': [1],
                                 'traderId': [1]})
        tradePackage = self.mc1.tradeMaker(prevTrade=prevTrade,
                                tradeRow=tradeRow).reset_index(drop=True)
        self.ms.createTrade(tradePackage=tradePackage)

        prevTrade = self.ms.getPreviousTrade()
        tradeRow = pd.DataFrame({'marketRootId': [1],
                                 'marketBranchId': [1],
                                 'price': [[0.5, 0.6]],
                                 'quantity': [-1],
                                 'traderId': [2]})
        tradePackage = self.mc2.tradeMaker(prevTrade=prevTrade,
                                tradeRow=tradeRow).reset_index(drop=True)
        self.ms.createTrade(tradePackage=tradePackage)

        prevTrade = self.ms.getPreviousTrade()
        tradeRow = pd.DataFrame({'marketRootId': [1],
                                 'marketBranchId': [1],
                                 'price': [[0.8, 0.9]],
                                 'quantity': [-1],
                                 'traderId': [2]})
        tradePackage = self.mc2.tradeMaker(prevTrade=prevTrade,
                                tradeRow=tradeRow).reset_index(drop=True)
        self.ms.createTrade(tradePackage=tradePackage)
        oB = pd.read_sql_table('orderBook', self.ms.conn)
        assert oB.shape[0] == 7

        prevTrade = self.ms.getPreviousTrade()
        tradeRow = pd.DataFrame({'marketRootId': [1],
                                 'marketBranchId': [1],
                                 'price': [0.9],
                                 'quantity': [-1],
                                 'traderId': [2]})
        tradePackage = self.mc2.tradeMaker(prevTrade=prevTrade,
                                tradeRow=tradeRow).reset_index(drop=True)

        colChk, colChkAll = self.ms.checkCollateral(tradePackage.loc[tradePackage.tradeBranchId==1, :])
        assert (colChkAll == [[-0.5, 1.3], [-0.5, 1.3], [0.5, -0.7], [0.5, -0.7]]).all()


    def testRemoveTrade(self):
        # Test trade removal:
        # - Load up a bunch of open orders in market 1
        # - Load up matched orders in market 2
        # = Eventually the collateral limit is hit the market should try to
        #   offset ALL trades in market one to free up collateral.

        # Trader 1 puts in five orders in market 1
        for iTrade in range(4):
            prevTrade = self.ms.getPreviousTrade()
            tradeRow = pd.DataFrame({'marketRootId': [1],
                                     'marketBranchId': [1],
                                     'price': [0.4],
                                      'quantity': [1],
                                     'traderId': [1]})
            tradePackage = self.mc1.tradeMaker(prevTrade=prevTrade,
                                               tradeRow=tradeRow).reset_index(drop=True)
            self.ms.createTrade(tradePackage=tradePackage)

        # Five matched orders in market 2
        for iTrade in range(5):
            # Trader 1 bid at 0.5
            prevTrade = self.ms.getPreviousTrade()
            tradeRow = pd.DataFrame({'marketRootId': [2],
                                     'marketBranchId': [1],
                                     'price': [0.5],
                                     'quantity': [1],
                                     'traderId': [1]})
            tradePackage = self.mc1.tradeMaker(prevTrade=prevTrade,
                                               tradeRow=tradeRow).reset_index(drop=True)
            self.ms.createTrade(tradePackage=tradePackage)
            # Trader 2 offer at 0.5
            prevTrade = self.ms.getPreviousTrade()
            tradeRow = pd.DataFrame({'marketRootId': [2],
                                     'marketBranchId': [1],
                                     'price': [0.5],
                                     'quantity': [-1],
                                     'traderId': [2]})
            tradePackage = self.mc2.tradeMaker(prevTrade=prevTrade,
                                               tradeRow=tradeRow).reset_index(drop=True)
            self.ms.createTrade(tradePackage=tradePackage)

        colChk, colChkAll = self.ms.checkCollateral()
        assert (colChk == [True, True]).all()
        assert (colChkAll  == [[-2,2], [2,-2], [-2,2], [2,-2]]).all()


    # def testManyTrades(self):
    #     # Test trade removal:
    #     # - Load up a bunch of open orders in market 1
    #     # - Load up matched orders in market 2
    #     # = Eventually the collateral limit is hit the market should try to
    #     #   offset ALL trades in market one to free up collateral.
    #
    #     # Five matched orders in market 2
    #     for iTrade in range(10):
    #         # Trader 1 bid at 0.5
    #         prevTrade = self.ms.getPreviousTrade()
    #         tradeRow = pd.DataFrame({'marketRootId': [2],
    #                                  'marketBranchId': [1],
    #                                  'price': [0.5],
    #                                  'quantity': [1],
    #                                  'traderId': [1]})
    #         tradePackage = self.mc1.tradeMaker(prevTrade=prevTrade,
    #                                            tradeRow=tradeRow).reset_index(
    #             drop=True)
    #         self.ms.createTrade(tradePackage=tradePackage)
    #         # Trader 2 offer at 0.5
    #         prevTrade = self.ms.getPreviousTrade()
    #         tradeRow = pd.DataFrame({'marketRootId': [2],
    #                                  'marketBranchId': [1],
    #                                  'price': [0.5],
    #                                  'quantity': [-1],
    #                                  'traderId': [2]})
    #         tradePackage = self.mc2.tradeMaker(prevTrade=prevTrade,
    #                                            tradeRow=tradeRow).reset_index(
    #             drop=True)
    #         self.ms.createTrade(tradePackage=tradePackage)
    #         # Trader 2 bid at 0.5
    #         prevTrade = self.ms.getPreviousTrade()
    #         tradeRow = pd.DataFrame({'marketRootId': [2],
    #                                  'marketBranchId': [1],
    #                                  'price': [0.5],
    #                                  'quantity': [1],
    #                                  'traderId': [2]})
    #         tradePackage = self.mc2.tradeMaker(prevTrade=prevTrade,
    #                                            tradeRow=tradeRow).reset_index(
    #             drop=True)
    #         self.ms.createTrade(tradePackage=tradePackage)
    #         # Trader 2 offer at 0.5
    #         prevTrade = self.ms.getPreviousTrade()
    #         tradeRow = pd.DataFrame({'marketRootId': [2],
    #                                  'marketBranchId': [1],
    #                                  'price': [0.5],
    #                                  'quantity': [-1],
    #                                  'traderId': [1]})
    #         tradePackage = self.mc1.tradeMaker(prevTrade=prevTrade,
    #                                            tradeRow=tradeRow).reset_index(
    #             drop=True)
    #         self.ms.createTrade(tradePackage=tradePackage)
    #     assert 1==1

    # def test_marketMaker(self):
    #     pass
    #
    # def test_createUser(self):
    #     pass
    #
    # def test_createMarket(self):
    #     pass

if __name__ =='__main__':
    unittest.main(exit=False)
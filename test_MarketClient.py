from MarketClient import MarketClient
import unittest
import pandas as pd


class TestMarketClient(unittest.TestCase):

    def setUp(self):
        # Setup market client
        self.mc = MarketClient()
        self.mc.generateSignatureKeys()


    def tearDown(self):
        pass
        # self.market.purgeTables()

    # Basic asserts

    # @unittest.skipIf(False)
    def test_tradeMaker(self):
        #  Make a trade
        prevTrade = pd.DataFrame({'tradeRootId': 1, 'signature': ['abc'.encode('utf-8')]})
        tradeRow = pd.DataFrame({'marketRootId': [1],
                              'marketBranchId': [1],
                              'price': [0.5],
                              'quantity': [1],
                              'traderId': [1]})
        a = self.mc.tradeMaker(prevTrade=prevTrade,tradeRow=tradeRow )
        a = a.reset_index()
        # Check trade signatures
        self.mc.verifyMessage(a['signature'][0], a['signatureMsg'][0], self.mc.verifyKey_hex)
        self.mc.verifyMessage(a['signature'][1], a['signatureMsg'][1], self.mc.verifyKey_hex)
        self.mc.verifyMessage(a['signature'][2], a['signatureMsg'][2], self.mc.verifyKey_hex)
        # Will error if verfication fails


    def test_marketMaker(self):
        # Make a market
        prevMarket = pd.DataFrame({'signature': ['abc'.encode('utf-8')]})
        marketRow = pd.DataFrame({'marketRootId': [1],
                                   'marketBranchId': [1],
                                   'marketMin': [0],
                                   'marketMax': [1],
                                   'traderId': [1]})
        testMarket = self.mc.marketMaker(prevMarket, marketRow)
        testMarket = testMarket.reset_index()
        # Verify market signatures
        self.mc.verifyMessage(testMarket['signature'][0], testMarket['signatureMsg'][0], self.mc.verifyKey_hex)

if __name__ == '__main__':
    unittest.main(exit=False)
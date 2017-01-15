from MarketObjectSQL import MarketObject
import unittest


class TestMarketObjectSQL(unittest.TestCase):

    def setUp(self):
        # Instantiate market object
        self.market = MarketObject()
        self.market.createUser(traderId='haresh', password='hareshpass')
        self.market.createUser(traderId='zwif', password='zwifpass')
        self.market.createUser(traderId='ando', password='andopasss')

        self.market.createUnderlying(underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
        self.market.createUnderlying(underlying='raiders', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')
        self.market.createMarket(marketMin=0, marketMax=1, expiry=date.today(), underlying='broncos', traderId='haresh',
                       apiKey='f7b1b5f3d240e42c0805714d4799520b')

        self.market.addTransaction(value=1000, traderId='haresh', underlying='loadup')
        self.market.addTransaction(value=1000, traderId='zwif', underlying='loadup')

        # Market ids are 1/2 for broncos/raiders
        self.market.addTrade(price=0.5, quantity=10, traderId='haresh', marketId=1)
        # m.addTrade(4, 10, 'haresh', 1)
        # m.addTrade(2, 3, 'haresh', 1)
        # Ask 10 at 101
        self.market.addTrade(price=0.4, quantity=-25, traderId='zwif', marketId=1)
        # Try another trade
        # m.addTrade(10, 10, 'haresh', 1)
        self.market.proposeSettlement(outcome=1, underlying='broncos', traderId='haresh', apiKey='f7b1b5f3d240e42c0805714d4799520b')

    @unittest.skipIf(False)
    def test_createUser(self):
        # Added thing

        # m = marketObjectSQL()
        # m.createUser(traderId='haresh', password='hareshpass')
        # m.createUser(traderId='zwif', password='zwifpass')
        # m.createUser(traderId='ando', password='andopasss')

    def test_createMarket(self):
        self.assertEqual(1,1)

if __name__ == '__main__':
    unittest.main(exit=False)
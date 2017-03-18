from MarketObjectSQL import MarketObject
import unittest
from datetime import datetime, date
import pandas  as pd


class TestMarketObjectSQL(unittest.TestCase):

    def setUp(self):
        # Instantiate market object
        self.market = MarketObject()
        #self.market.createUser(traderId='ando', password='andopasss')
        self.market.createUser(traderId='haresh', password='hareshpass')
        self.market.createUser(traderId='zwif', password='zwifpass')
        self.market.createUnderlying(underlying='broncos', traderId='haresh',
                                     apiKey='f7b1b5f3d240e42c0805714d4799520b')
        self.market.createUnderlying(underlying='raiders', traderId='haresh',
                                     apiKey='f7b1b5f3d240e42c0805714d4799520b')
        self.market.addTransaction(value=101,
                                   traderId='haresh',
                                   underlying='loadup')
        self.market.addTransaction(value=101,
                                   traderId='zwif', underlying='loadup')
        # Market ids are 1/2 for broncos/raiders

        # Try another trade
        # m.addTrade(10, 10, 'haresh', 1)
        # self.market.proposeSettlement(outcome=1, underlying='broncos',
        #                               traderId='haresh',
        #                               apiKey='f7b1b5f3d240e42c0805714d4799520b')

    def tearDown(self):
        self.market.addTransaction(value=-101,
                                   traderId='haresh',
                                   underlying='loaddown')
        self.market.addTransaction(value=-101,
                                   traderId='zwif', underlying='loaddown')

    # Basic asserts

    # @unittest.skipIf(False)
    def test_createUser(self):
        ut = pd.read_sql_table('userTable', self.market.conn)
        self.assertEqual(any(ut.traderId == 'haresh'), True)

    def test_createUnderlying(self):
        ut = pd.read_sql_table('underlyingData', self.market.conn)
        self.assertEqual(len(ut.index), 2)

    def test_createMarket(self):
        self.market.createMarket(marketMin=0, marketMax=1, expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 apiKey='f7b1b5f3d240e42c0805714d4799520b')
        mt = pd.read_sql_table('openMarketData', self.market.conn)
        self.assertEqual(len(mt.index), 1)

    def test_addTransaction(self):
        tt = pd.read_sql_table('transactionTable', self.market.conn)
        self.assertEqual(len(tt.index), 2)

    def test_addTrade(self):
        self.market.addTrade(price=0.5, quantity=10,
                             traderId='haresh', marketId=1)
        ob = pd.read_sql_table('orderBook', self.market.conn)
        self.assertEqual(any((ob.marketId == 1) &
                             (ob.traderId == 'haresh') &
                             (ob.quantity == 10) &
                             (ob.price == 0.5)), True)

    # Scenario 1:
    # Single underlying, single market, two users, crossing bid / offer and
    # settlement
    #
    # [SETUP]
    # - Create users
    # - Create underlying
    # - Create market
    # - Add loadup transaction to both users value = 100
    # - First user bids price = 0.5, quantity = 10
    # - Second user asks 0.4, quantity = 20
    #
    #
    # [ASSERTS]
    # orderBook = > second user asking 10 @ 0.4
    # matchedTrades = > first user buy 10 @ 0.5, second user sell 10 @ 0.5
    #
    # [SETUP]
    # - Settle market with outcome = 1
    #
    # [ASSERTS]
    # transactionTable -> first user gets 10 * (1 - 0.5) = + 5, second user
    # gets - 10 * (1 - 0.5) = -5

    def test_scenario1(self):
        self.market.createMarket(marketMin=0, marketMax=1, expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 apiKey='f7b1b5f3d240e42c0805714d4799520b')
        self.market.addTrade(price=0.5, quantity=10,
                             traderId='haresh', marketId=1)
        self.market.addTrade(price=0.4, quantity=-20,
                             traderId='zwif', marketId=1)
        ob = pd.read_sql_table('orderBook', self.market.conn)
        mt = pd.read_sql_table('matchedTrades', self.market.conn)
        # Zwif has -10 @ 0.4 left in order book
        self.assertEqual(any((ob.traderId == 'zwif') & (ob.marketId == 1) &
                             (ob.price == 0.4) & (ob.quantity == -10) ), True)
        # Zwif has -10 matched at 0.5
        print(mt)
        self.assertEqual(any((mt.traderId == 'zwif') & (mt.marketId == 1) &
                             (mt.price == 0.5) & (mt.quantity == -10) ), True)
        # Haresh has 10 matched at 0.5
        self.assertEqual(any((mt.traderId == 'haresh') & (mt.marketId == 1) &
                             (mt.price == 0.5) & (mt.quantity == 10) ), True)
        # Propose settlement of market with outcome  = 1
        self.market.proposeSettlement(
                              outcome=1,
                              underlying='broncos',
                              traderId='haresh',
                              apiKey='f7b1b5f3d240e42c0805714d4799520b')
        ob = pd.read_sql_table('orderBook', self.market.conn)
        mt = pd.read_sql_table('matchedTrades', self.market.conn)
        tt = pd.read_sql_table('transactionTable', self.market.conn)
        smd = pd.read_sql_table('settledMarketData', self.market.conn)
        omd = pd.read_sql_table('openMarketData', self.market.conn)
        # print(ob)
        # print(mt)
        # print(tt)
        # print(smd)
        # print(omd)
        # Haresh wins 5
        self.assertEqual(any((tt.traderId == 'haresh') &
                             (tt.value == 5)), True)
        # Zwif loses 5
        self.assertEqual(any((tt.traderId == 'zwif') &
                             (tt.value == -5)), True)


if __name__ == '__main__':
    unittest.main(exit=False)
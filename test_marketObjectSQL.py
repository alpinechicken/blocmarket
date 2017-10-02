from MarketObjectSQL import MarketObject
import unittest
from datetime import datetime, date
import pandas  as pd

# TODO: Combine transactions and trades tables


class TestMarketObjectSQL(unittest.TestCase):

    def setUp(self):
        # Instantiate market object
        self.market = MarketObject()
        # Purge all current tabless
        self.market.purgeTables()
        #self.market.createUser(traderId='ando', password='andopass')
        signatureKey_haresh, verifyKey_haresh=self.market.generateSignatureKeys()
        signatureKey_haresh_hex = signatureKey_haresh.decode("utf-8")
        veriftyKey_haresh_hex = verifyKey_haresh.decode("utf-8")

        self.market.createUser(traderId='haresh', password='hareshpass',
                               signatureKey_hex=signatureKey_haresh,
                               verifyKey_hex=verifyKey_haresh)
        # Generate sig keys for haresh (will be done on client side in production)
        signatureKey_zwif, verifyKey_zwif = self.market.generateSignatureKeys()
        signatureKey_zwif_hex = signatureKey_zwif.decode("utf-8")
        verifyKey_zwif_hex = verifyKey_zwif.decode("utf-8")
        self.market.createUser(traderId='zwif', password='zwifpass',
                               signatureKey_hex=signatureKey_zwif_hex,
                               verifyKey_hex=verifyKey_zwif_hex)
        # Prepare underlying (broncos)
        prevSig = 'dummyPreviousSig'
        traderId = 'haresh'
        underlying = 'broncos'
        apiKey = 'f7b1b5f3d240e42c0805714d4799520b'

        # Encode underlying as a message in bytes
        underlyingMsg = b'%s%s%s' % (str.encode(prevSig),
                                     str.encode(traderId),
                                     str.encode(underlying))

        signedUnderlying = self.market.signMessage(msg = underlyingMsg,
                                                   signingKey_hex = signatureKey_haresh_hex)
        signedUnderlying_bytes = signedUnderlying.signature
        self.market.createUnderlying(underlying=underlying, traderId=traderId,
                                     apiKey=apiKey, signatureMsg=underlyingMsg,
                                     signature=signedUnderlying_bytes)

        # Prepare underlying (raiders)
        underlying = 'raiderz'
        # Encode underlying as a message in bytes
        underlyingMsg = b'%s%s%s' % (str.encode(prevSig),
                                     str.encode(traderId),
                                     str.encode(underlying))
        signedUnderlying = self.market.signMessage(msg=underlyingMsg,
                                                   signingKey_hex=signatureKey_haresh_hex)
        signedUnderlying_bytes = signedUnderlying.signature
        self.market.createUnderlying(underlying=underlying, traderId=traderId,
                                     apiKey=apiKey, signatureMsg=underlyingMsg,
                                     signature=signedUnderlying_bytes)

        # transactionMsg = b'%s%s%f' % (str.encode(prevSig),
        #                               str.encode(traderId),
        #                               101)
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
        pass
        # self.market.purgeTables()

    # Basic asserts

    # @unittest.skipIf(False)
    def test_createUser(self):
        ut = pd.read_sql_table('userTable', self.market.conn)
        self.assertEqual(any(ut.traderId == 'haresh'), True)

    def test_createUnderlying(self):
        undt = pd.read_sql_table('underlyingData', self.market.conn)
        # Get signature message
        signatureMessage = undt[undt.underlying == 'broncos'].signatureMsg[0]
        # Get signature
        signature = undt[undt.underlying == 'broncos'].signature[0]
        # Get trader id for this market
        traderId = undt[undt.underlying == 'broncos'].traderId[0]
        # Get verify key from user table
        ut = pd.read_sql_table('userTable', self.market.conn)
        verifyKey = ut[ut.traderId == traderId].verifyKey[0]
        verifyKey_hex = verifyKey.decode("utf-8")

        self.assertEqual(len(undt.index), 2)
        checkBroncosSig = self.market.verifyMessage(signed=signature,
                                                    verifyKey_hex=verifyKey_hex)

    def test_createMarket(self):
        # Import haresh signing key
        hareshSignatureKey_hex =  pd.read_sql('SELECT signatureKey FROM userTable WHERE traderId = "haresh"', self.market.conn).signatureKey

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

    def test_generateSignatureKeys(self):
        #  Test:
        # self.generateSignatureKeys()
        # self.signMessage()
        # self.verifyMessage()
        # self.signTrade() : previous sig, marketId, traderId, price, quantity

        signatureKey, verifyKey = self.market.generateSignatureKeys()
        print('signature key: ' + signatureKey.decode("utf-8"))
        print('verify key: ' + verifyKey.decode("utf-8"))

        # Basic signing
        signed = self.market.signMessage(b'attack at dawn', signatureKey.decode("utf-8"))
        verified = self.market.verifyMessage(signed, verifyKey)
        self.assertEqual(b'attack at dawn', verified)

        # Sign a trade
        prevSig = 'dummyPreviousSig'
        marketId = 1
        traderId = 'haresh'
        price = 0.5
        quantity = 10
        # Encode trade as a message in bytes
        tradeMsg = b'%s%f%s%f%f' % (str.encode(prevSig), marketId,
                                   str.encode(traderId), price, quantity)
        # Sign trade message
        signedTrade = self.market.signMessage(tradeMsg, signatureKey.decode("utf-8"))
        print(signedTrade)
        # Verify trade with signature key
        verified = self.market.verifyMessage(signedTrade, verifyKey)
        # Check that trade is verified with verify key
        self.assertEqual(tradeMsg, verified)

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
        orderBook = pd.read_sql_table('orderBook', self.market.conn)
        ob = orderBook[orderBook.isMatched == 0]
        mt = orderBook[orderBook.isMatched==1]
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
        orderBook = pd.read_sql_table('orderBook', self.market.conn)
        ob = orderBook[orderBook.isMatched == 0]
        mt = orderBook[orderBook.isMatched==1]
        tt = pd.read_sql_table('transactionTable', self.market.conn)
        # smd = pd.read_sql_table('settledMarketData', self.market.conn)
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
from MarketObjectSQL import MarketObject
import unittest
from datetime import datetime, date
import pandas  as pd
# import nacl.encoding
# import nacl.signing

# TODO: Combine transactions and trades tables?
# TODO: Add signature chain logic to marketData (DONE), orderBook, transactionTable (DONE) (sigs made on client side)
# TODO: Think about verificataion on server side (maybe SQL script?)
# TODO: Change transaction table with from/to and add balance verification


# TODO: Check signatures for marketData
# TODO: Figure out a solution for internal order book trades

class TestMarketObjectSQL(unittest.TestCase):

    def setUp(self):
        # Instantiate market object
        self.market = MarketObject()
        # Purge all current tabless
        self.market.purgeTables()
        #self.market.createUser(traderId='ando', password='andopass')
        signatureKey_haresh, verifyKey_haresh = self.market.generateSignatureKeys()
        signatureKey_haresh_hex = signatureKey_haresh.decode("utf-8")
        verifyKey_haresh_hex = verifyKey_haresh.decode("utf-8")

        self.market.createUser(traderId='haresh', password='hareshpass',
                               signatureKey_hex=signatureKey_haresh_hex,
                               verifyKey_hex=verifyKey_haresh_hex)
        # Generate sig keys for haresh (will be done on client side in production)
        signatureKey_zwif, verifyKey_zwif = self.market.generateSignatureKeys()
        signatureKey_zwif_hex = signatureKey_zwif.decode("utf-8")
        verifyKey_zwif_hex = verifyKey_zwif.decode("utf-8")
        # Note signature key will not
        self.market.createUser(traderId='zwif', password='zwifpass',
                               signatureKey_hex=signatureKey_zwif_hex,
                               verifyKey_hex=verifyKey_zwif_hex)


        # TODO: pull out all api/password calls and replace with signature verification

        # Prepare underlying (broncos)
        signatureKey_hex = self.market.getSignatureKey("haresh")
        signedUnderlying = self.market.signUnderlyingData(underlying='broncos',
                                                          traderId='haresh',
                                                          signatureKey_hex=signatureKey_hex)
        # Create new underlying
        self.market.createUnderlying(underlying="broncos", traderId="haresh",
                                     apiKey='f7b1b5f3d240e42c0805714d4799520b',
                                     signatureMsg=signedUnderlying.message,
                                     signature=signedUnderlying.signature)

        # Prepare underlying (raiders)

        signatureKey_hex = self.market.getSignatureKey("haresh")
        # Get signature  for  new underlying
        signedUnderlying = self.market.signUnderlyingData(underlying="raiders",
                                                          traderId="haresh",
                                                          signatureKey_hex=signatureKey_hex)
        # Create new underlying
        self.market.createUnderlying(underlying="raiders",
                                     traderId="haresh",
                                     apiKey='f7b1b5f3d240e42c0805714d4799520b',
                                     signatureMsg=signedUnderlying.message,
                                     signature=signedUnderlying.signature)

        # Add transaction for 101 zwif
        signatureKey_hex = self.market.getSignatureKey("haresh")
        signedTransaction = self.market.signTransactionTable(value=101,
                                                             traderId='haresh',
                                                             underlying='loadup',
                                                             signatureKey_hex=signatureKey_hex)
        self.market.addTransaction(value=101,
                                   traderId='haresh',
                                   underlying='loadup',
                                   signatureMsg=signedTransaction.message,
                                   signature=signedTransaction.signature)

        # Add transaction for 101 for zwif
        signatureKey_hex = self.market.getSignatureKey("zwif")
        signedTransaction = self.market.signTransactionTable(value=101,
                                                             traderId='zwif',
                                                             underlying='loadup',
                                                             signatureKey_hex=signatureKey_hex)
        self.market.addTransaction(value=101,
                                   traderId='zwif',
                                   underlying='loadup',
                                   signatureMsg=signedTransaction.message,
                                   signature=signedTransaction.signature)


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
        signatureMsg = undt[undt.underlying == 'broncos'].signatureMsg[0]
        # Get signature
        signature = undt[undt.underlying == 'broncos'].signature[0]
        traderId = undt[undt.underlying == 'broncos'].traderId[0]
        verifyKey_hex = self.market.getVerifyKey(traderId)
        # Get verify key from user table
        self.assertEqual(len(undt.index), 2)
        checkBroncosSig = self.market.verifyMessage(signature=signature,
                                                    signatureMsg=signatureMsg,
                                                    verifyKey_hex=verifyKey_hex)
        self.assertTrue(checkBroncosSig)

    def test_createMarket(self):
        # Create a market
        signatureKey_haresh_hex = self.market.getSignatureKey("haresh")
        signedMarket = self.market.signOpenMarketData(marketMin=0, marketMax=1,
                                 expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 signatureKey_hex=signatureKey_haresh_hex)
        self.market.createMarket(marketMin=0, marketMax=1, expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 apiKey='f7b1b5f3d240e42c0805714d4799520b',
                                 signatureMsg=signedMarket.message,
                                 signature=signedMarket.signature)

        # Create a second market on the same underlying
        signatureKey_haresh_hex = self.market.getSignatureKey("haresh")

        signedMarket = self.market.signOpenMarketData(marketMin=1, marketMax=2,
                                 expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 signatureKey_hex=signatureKey_haresh_hex)
        self.market.createMarket(marketMin=1, marketMax=2, expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 apiKey='f7b1b5f3d240e42c0805714d4799520b',
                                 signatureMsg=signedMarket.message,
                                 signature=signedMarket.signature)
        mt = pd.read_sql_table('marketData', self.market.conn)
        self.assertEqual(len(mt.index), 2)

    def test_addTransaction(self):
        tt = pd.read_sql_table('transactionTable', self.market.conn)
        self.assertEqual(len(tt.index), 2)

    def test_addTrade(self):
        # Get signature  key
        signatureKey_haresh_hex = self.market.getSignatureKey("haresh")
        signedTrade = self.market.signOrderBook(price=1, quantity=2,
                                                traderId='haresh',
                                                marketId=1,
                                                signatureKey_hex=signatureKey_haresh_hex)

        self.market.addTrade(price=0.5, quantity=10,
                             traderId='haresh', marketId=1,
                             isMatched=0, matchTrades=True,
                             signatureMsg=signedTrade.message,
                             signature=signedTrade.signature)
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
        verified = self.market.verifyMessage(signature=signed.signature,
                                             signatureMsg = signed.message,
                                             verifyKey_hex=verifyKey.decode("utf8"))
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
        verified = self.market.verifyMessage(signature=signedTrade.signature,
                                             signatureMsg = signedTrade.message,
                                             verifyKey_hex=verifyKey.decode("utf8"))
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
        signatureKey_haresh_hex = self.market.getSignatureKey("haresh")
        signedMarket = self.market.signOpenMarketData(marketMin=0, marketMax=1, expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 signatureKey_hex=signatureKey_haresh_hex)
        self.market.createMarket(marketMin=0, marketMax=1, expiry=date.today(),
                                 underlying='broncos', traderId='haresh',
                                 apiKey='f7b1b5f3d240e42c0805714d4799520b',
                                 signatureMsg=signedMarket.message,
                                 signature=signedMarket.signature)
        # Add first trade
        signatureKey_haresh_hex = self.market.getSignatureKey("haresh")
        signedTrade = self.market.signOrderBook(price=0.5, quantity=10, traderId='haresh',
                                 marketId=1, signatureKey_hex=signatureKey_haresh_hex)
        self.market.addTrade(price=0.5, quantity=10,
                             traderId='haresh', marketId=1, isMatched=0,
                             matchTrades=True, signatureMsg=signedTrade.message,
                             signature=signedTrade.signature)

        # Add second trade
        signatureKey_zwif_hex = self.market.getSignatureKey("zwif")
        signedTrade = self.market.signOrderBook(price=0.4, quantity=-20, traderId='zwif',
                                 marketId=1, signatureKey_hex=signatureKey_zwif_hex)
        self.market.addTrade(price=0.4, quantity=-20,
                             traderId='zwif', marketId=1, isMatched=0,
                             matchTrades=True, signatureMsg=signedTrade.message,
                             signature=signedTrade.signature)
        # Check trades
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

        # Check transaction table following settlement
        orderBook = pd.read_sql_table('orderBook', self.market.conn)
        ob = orderBook[orderBook.isMatched == 0]
        mt = orderBook[orderBook.isMatched==1]
        tt = pd.read_sql_table('transactionTable', self.market.conn)
        md = pd.read_sql_table('marketData', self.market.conn)
        self.assertEqual(any((tt.traderId == 'haresh') &
                             (tt.value == 5)), True)
        # Zwif loses 5
        self.assertEqual(any((tt.traderId == 'zwif') &
                             (tt.value == -5)), True)


if __name__ == '__main__':
    unittest.main(exit=False)

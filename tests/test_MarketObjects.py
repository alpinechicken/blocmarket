import unittest
import numpy as np
import time

from game.MarketObjects import User, SpotMarket, MarginPosition, ConstantProductMarket, StableCoinMachine

# Integration tests for market objects

class TestMarketObjects(unittest.TestCase):
    def test_ConstantProductMarket(self):
        """
        Test that it can sum a list of integers
        """
        u0 = User()
        u0.mint(amount=10, type='Rb')
        u0.mint(amount=2000, type='Ra')
        u1 = User()
        u1.mint(amount=10, type='Rb')
        u1.mint(amount=2000, type='Ra')
        c = ConstantProductMarket()
        c.subscribe(dRa=2000, dRb=10, userid=u0.id)
        c.subscribe(dRa=2000, dRb=10, userid=u1.id)
        u0.read()
        u1.read()
        self.assertEqual(c.user.Ra, 4000)
        self.assertEqual(c.user.Rb, 20)
        self.assertEqual(u0.Rs[0], {'cpmid':c.id, 'shareid': 0})
        self.assertEqual(u1.Rs[0], {'cpmid':c.id, 'shareid': 1})
        # Users own 50% each of the cpm
        self.assertEqual(c.Rs_prop.tolist(), [0.5, 0.5])
        c.redeem(dS=0.5, shareid=u1.Rs[0]['shareid'], userid=u1.id)
        # First share should be undiluted to 100%
        self.assertEqual(c.Rs_prop.tolist(), [1, 0])
        u0.mint(amount=1, type='Rb')
        # Need to sleep through accumulation window or it will count the subscribe amount
        time.sleep(c.ACCUM_WINDOW)
        c.swap(dRa=0, dRb=1, userid=u0.id)
        expectedRa = 2000*10 / (10 + 1* (1 - c.TX_FEE)) - 2000
        # User0 swaps 1 Rb into Ra (around 181.18)
        u0.read()
        self.assertAlmostEqual(u0.Ra, -expectedRa)


    def test_SpotMarket(self):
        # live swap
        s = SpotMarket()
        u = User()
        u.mint(type='Rusd', amount=10000)
        s.swap(dRusd=10000, dRb=0, userid=u.id)
        u.read()
        s.swap(dRusd=0, dRb=u.Rb, userid=u.id)
        self.assertEqual(s.dRb, u.Rb)

    def test_MarginPosition(self):
        u0 = User()
        u0.mint(amount=10, type='Rb')
        u0.mint(amount=3000, type='Ra')
        # Make a CPM
        c = ConstantProductMarket(id=u0.id)
        c.subscribe(dRa=2000, dRb=10, userid=u0.id)
        # Construct a loan
        m = MarginPosition(cpmid=c.id, userid=u0.id)
        # Fund margin position
        m.seed(1000, userid=u0.id)
        # New user
        u1 = User()
        # Give him some money for collateral
        u1.mint(amount=7, type='Rb')

        # Subscribe for a loan
        m.subscribe(dRb=7, userid=u1.id)
        time.sleep(m.cpm.ACCUM_WINDOW) # Need to wait for cpm volume limits to reset
        m.touch()
        # The loan defaults immediately as it needs to liquidate 7 Rb from a cpm with only 10 Rb and it pushes the price too far
        self.assertEqual(m.Ra_offer, 1000)
        self.assertEqual(m.Ra_subscribe, 933+1/3)
        self.assertAlmostEqual(m.Ra_default, 110, places=0)
        u0.read()
        #u0 eats the default
        self.assertAlmostEqual(u0.Ra, 890, places=0)

    def test_StableCoinMachine_Inception(self):
        # Following fig 1 and then fig 2
        s = SpotMarket()
        u0 = User()
        # start user with 10000 usd
        u0.mint(type='Rusd', amount=10000)
        # F1 (1), (2) Exchange in spot market for Ra
        s.swap(dRusd=10000, dRb=0, userid=u0.id)
        #
        u0.read()
        #  Spin up a stablecoin machine
        scm = StableCoinMachine(userid=u0.id)
        # Seed with Rb from user 0 (will also put out a loan)
        qt = 1 / s.getQuote()['Trade']
        # F1 (3), (4), (5), (6), (7), (8) Seed stablecoin machine $10000 worth of BTC, get Rc certificate
        # Stablecoin machine seeds a ConstantProductMarket (for Rs shares) and a MarginPosition (for Rm certificate)
        scm.seed(dRb=u0.Rb, m_ref=qt, userid=u0.id)
        # Make a new user
        u1 = User()
        # Give user some USD
        u1.mint(type='Rusd', amount=1000)
        # F1 (9), (10) User buys Rb on spot market
        s.swap(dRusd=1000, dRb=0, userid=u1.id)
        # User subscribes to loan from scm
        m1 = MarginPosition(id=scm.loanids[0])
        u1.read()
        # F1 (9), (10) Subscribe to margin loan from scm
        m1.subscribe(dRb=u1.Rb, userid=u1.id)
        # Run scm process (will create new loan)
        scm.touch()
        # Now following fig 2
        u2 = User()
        u2.mint(type='Rusd', amount=1000)
        # F4 (1), (2)
        s.swap(dRusd=1000, dRb=0, userid=u2.id)
        # Open up the second margin loan
        m2= MarginPosition(id=scm.loanids[1])
        u2.read()
        # F4 (3), (4) Subscribe to margin loan from scm
        m2.subscribe(dRb=u2.Rb, userid=u2.id)
        c = ConstantProductMarket(id=scm.cpmid)
        u2.read()
        # F4 (5), (6) Swap back for Rb
        c.swap(dRb=0, dRa=u2.Ra, userid=u2.id)
        u2.read()
        # F4 (7), (8) Swap back for Rb
        s.swap(dRusd=0, dRb=u2.Rb, userid=u2.id)
        a=1

    def test_StableCoinMachine_Default(self):
        # Following fig 1 and then fig 2
        s = SpotMarket()
        u0 = User()
        # start user with 10000 usd
        u0.mint(type='Rusd', amount=10000)
        # F1 (1), (2) Exchange in spot market for Ra
        s.swap(dRusd=10000, dRb=0, userid=u0.id)
        #
        u0.read()
        #  Spin up a stablecoin machine
        scm = StableCoinMachine(userid=u0.id)
        # Seed with Rb from user 0 (will also put out a loan)
        qt = 1 / s.getQuote()['Trade']
        # F1 (3), (4), (5), (6), (7), (8) Seed stablecoin machine $10000 worth of BTC, get Rc certificate
        # Stablecoin machine seeds a ConstantProductMarket (for Rs shares) and a MarginPosition (for Rm certificate)
        scm.seed(dRb=u0.Rb, m_ref=qt, userid=u0.id)
        # Make a new user
        u1 = User()
        # Give user some USD
        u1.mint(type='Rusd', amount=1000)
        # F1 (9), (10) User buys Rb on spot market
        s.swap(dRusd=1000, dRb=0, userid=u1.id)
        # User subscribes to loan from scm
        m1 = MarginPosition(id=scm.loanids[0])
        u1.read()
        # F1 (9), (10) Subscribe to margin loan from scm
        m1.subscribe(dRb=u1.Rb, userid=u1.id)
        # Run scm process (will create new loan)
        scm.touch()
        # Now repay
        #m1.redeem()


        # Now following fig 2
        u2 = User()
        u2.mint(type='Rusd', amount=1000)
        # F4 (1), (2)
        s.swap(dRusd=1000, dRb=0, userid=u2.id)
        # Open up the second margin loan
        m2= MarginPosition(id=scm.loanids[1])
        u2.read()
        # F4 (3), (4) Subscribe to margin loan from scm
        m2.subscribe(dRb=u2.Rb, userid=u2.id)
        c = ConstantProductMarket(id=scm.cpmid)
        u2.read()
        # F4 (5), (6) Swap back for Rb
        c.swap(dRb=0, dRa=u2.Ra, userid=u2.id)
        u2.read()
        # F4 (7), (8) Swap back for Rb
        s.swap(dRusd=0, dRb=u2.Rb, userid=u2.id)
        a=1


if __name__ == '__main__':
    unittest.main()
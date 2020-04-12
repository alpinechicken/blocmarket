from game.MarketObjects import User, ConstantProductMarket, SpotMarket, MarginPosition, StableCoinMachine
'''
# Basic tests for ConstantProductMarket
u0 = User(id=0)
u0.mint(amount=10, type='Rb')
u0.mint(amount=2000, type='Ra')
u1 = User(id=1)
u1.mint(amount=10, type='Rb')
u1.mint(amount=2000, type='Ra')
c = ConstantProductMarket(id=0)
c.subscribe(dRa=2000, dRb=10, userid=0)
c.subscribe(dRa=2000, dRb=10, userid=1)
u0.mint(amount=1, type='Rb')
c.swap(dRa=0, dRb=1, userid=0)
c.redeem(dS = 0.5, shareid=0, userid=0)

a=1

# Spot market
s = SpotMarket()
u = User()
u.mint(type='Rusd', amount=10000)
s.swap(dRusd=10000, dRb=0, userid=u.id)
u.read()
s.swap(dRusd=0, dRb=u.Rb, userid=u.id)
a=1


u0 = User(id=0)
u0.mint(amount=10, type='Rb')
u0.mint(amount=3000, type='Ra')
# Make a CPM
c = ConstantProductMarket(id=0)
c.subscribe(dRa=2000, dRb=10, userid=0)
# Construct a loan
m = MarginPosition(cpmid=0, userid=0)
# Fund margin position
m.seed(1000, userid=0)
# New user
u1 = User()
# Give him some money for collateral
u1.mint(amount=7, type='Rb')

#m = MarginPosition(id=0)
m.subscribe(dRb=7,userid=u1.id)

m.redeem(dRa=666+2/3, userid=u1.id)
'''

s = SpotMarket()
u0 = User()
# start user with 10000 usd
u0.mint(type='Rusd', amount=10000)
# exchange in spot market for Ra
s.swap(dRusd=10000, dRb=0, userid=u0.id)
#
u0.read()
# Spin up a stablecoin machine
scm = StableCoinMachine(userid=u0.id)
# Seed with Rb from user 0 (will also put out a loan)
qt = 1/s.getQuote()['Trade']
scm.seed(dRb=u0.Rb, m_ref=qt, userid=u0.id)
# Make a new user
u1 = User()
# Give user some USD
u1.mint(type='Rusd', amount=1000)
# User buys Rb on spot market
s.swap(dRusd=1000,dRb=0, userid=u1.id)
# User subscribes to loan from scm
m = MarginPosition(id=scm.loanids[0])
u1.read()
# Subscribe to margin loan from scm
m.subscribe(dRb=u1.Rb, userid=u1.id)
scm = StableCoinMachine(id=0)
# Run scm process (will create new loan)
scm.touch()
a=1

# Revert everything
# Repay scm loan for u1
u1.read()
m.redeem(dRa=u1.Ra, userid=u1.id)
u1.read()
# Convert back into usd
s.swap(dRusd=0,dRb=u1.Rb, userid=u1.id)
u1.read()
a=1
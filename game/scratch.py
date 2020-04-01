from game.MarketObjects import ConstantProductMarket, MarginPosition
c = ConstantProductMarket(id=0, uid=1)
c.subscribe(dRa=2000, dRb= 10, uid=1)
c.subscribe(dRa = 2000, dRb=10, uid=2)

# Create a margin position with 1000a
m = MarginPosition(cpmid=0, Ra_limit=1000, id=0, uid=3)
# Subscribe
m.subscribe(dRb=1, uid=4)

# Double price of a:
c.swap(dRa = 4000, dRb=0, uid=1)

# Test redemption in three bits
m.redeem(dRa=(100), uid=4)
m.redeem(dRa=(33), uid=4)
m.redeem(dRa = 1/3, uid=4)
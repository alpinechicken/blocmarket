mo = MarketObject()
mo = mo.createMarket(marketMaker(mo, 1, 1, 0, 1, 1))
% mo = mo.createMarket(marketMaker(mo, 2, 1, 0, 1, 1))
mo = mo.createMarket(marketMaker(mo, 1, 2, 0.1, 0.9, 1))
% mo = mo.createMarket(marketMaker(mo, 2, 2, 0.2, 0.8, 1))
mo = mo.createMarket(marketMaker(mo, 1, 1, 1, 1, 1))
mo.marketBounds
%% Sub-market settlement check bounds
mo = MarketObject()

% Create traders
mo = MarketObject()
mo = mo.createUser(struct('verifyKey','a'));

% Craete trades
mo = mo.createMarket(marketMaker(mo, 1, 1, 0, 1, 1))
mo = mo.createMarket(marketMaker(mo, 1, 2, 0.1, 0.9, 1))
mo = mo.createMarket(marketMaker(mo, 1, 1, 1, 1, 1))
mo.marketBounds

%% Three traders two markets

% Create three traders

mo = MarketObject()
mo = mo.createUser(struct('verifyKey','a'));
mo = mo.createUser(struct('verifyKey','b'));
mo = mo.createUser(struct('verifyKey','c'));

% Create  markets
mo = mo.createMarket(marketMaker(mo, 1, 1, 0, 1, 1))
mo = mo.createMarket(marketMaker(mo, 2, 1, 0, 1, 1))
mo.marketBounds

% Trader 1 buys 1 at 0.5 in market 1
mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 3, 1, 1, [0.5], -1))

% Trader 1 buys 2 at 0.4 in market 2
mo = mo.createTrade(tradeMaker(mo, 1, 2, 1, [0.4], 1))
mo = mo.createTrade(tradeMaker(mo, 3, 2, 1, [0.4], -1))
mo = mo.createTrade(tradeMaker(mo, 1, 2, 1, [0.4], 1))
mo = mo.createTrade(tradeMaker(mo, 3, 2, 1, [0.4], -1))

% Trader 2 sells 1 at 0.9 in market 2
mo = mo.createTrade(tradeMaker(mo, 2, 2, 1, [0.9], -1))
mo = mo.createTrade(tradeMaker(mo, 3, 2, 1, [0.9], 1))

%% Two traders, two markets, keep adding in market 2 until trade 1 gets removed

% Create two traders

mo = MarketObject()
mo = mo.createUser(struct('verifyKey','a'));
mo = mo.createUser(struct('verifyKey','b'));

% Create two markets
mo = mo.createMarket(marketMaker(mo, 1, 1, 0, 1, 1))
mo = mo.createMarket(marketMaker(mo, 2, 1, 0, 1, 1))
mo.marketBounds

% Trader one puts in five orders in market 1
mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))

% Add matched trades at 0.5 in market  2 and see what happens
mo = mo.createTrade(tradeMaker(mo, 1, 2, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 2, 2, 1, [0.5], -1))

mo = mo.createTrade(tradeMaker(mo, 1, 2, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 2, 2, 1, [0.5], -1))

mo = mo.createTrade(tradeMaker(mo, 1, 2, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 2, 2, 1, [0.5], -1))

mo = mo.createTrade(tradeMaker(mo, 1, 2, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 2, 2, 1, [0.5], -1))

mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 2, 1, 1, [0.5], -1))

mo = mo.createTrade(tradeMaker(mo, 1, 1, 1, [0.5], 1))
mo = mo.createTrade(tradeMaker(mo, 2, 1, 1, [0.5], -1))


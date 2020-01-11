# blocmarket

This is a limit order book for futures contracts with minimum and maximum payoffs. 

The interface has three main components:

- createUser() - Returns public and private keys for a new user and registers public key.
- createMarket() - Adds a new market or updates an old market (market root/branch, minimum payoff, maximum payoff)
- createTrade() - Adds a new trade (price/quanity)

Orders and markets are can be created and signed by any user and accompanied by a signed timestamp. Collateral is calculated simulataneously across all markets. 
A market can have any number of branches which all settle within the bounds of previous markets on the branch.

The two main applications are event prediction markets (minimum = 0, maximum = 1), and bounded futures contracts (futures contracts with a minimum and maximum payoff). 

Data is maintained in six tables with postgress, though it will run with sqlite and others. The API uses flask and is generally running on Heroku with these endpoints:


https://blocmarket.herokuapp.com/createUser

https://blocmarket.herokuapp.com/createMarket

https://blocmarket.herokuapp.com/createTrade

https://blocmarket.herokuapp.com/viewMarketBounds

https://blocmarket.herokuapp.com/viewOrderBook

https://blocmarket.herokuapp.com/viewOpenTrades

https://blocmarket.herokuapp.com/viewMatchedTrades

https://blocmarket.herokuapp.com/viewTradeSummary

If anything breaks or behaves unexpectedly, please leave an issue.

The documentation is mainly in ipython notebooks in /doc. A full walkthrough of the API is /doc/BlocAPI.ipynb. A Slate server https://alpinechicken.github.io/slate has the same information with pretty colours.

The three main classes are BlocServer, BlocClient, and BlocTime in /bloc

bloc stands for '(b)loc is a (l)imit (o)rder (c)hain'.

## Interface

Basic web interface at https://blocmarket.herokuapp.com/. This wraps all the api endpoints and allows market creating/adjusting and trade creating through forms. At some point this will have account management so users don't have to put in keys for each new api call.

## License

bloc is licensed under the GNU LGPL v2.1.  A copy of which is included in [LICENSE](LICENSE)

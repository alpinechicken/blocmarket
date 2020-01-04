from bots.BetfairBot import BetfairBot
appKey = 'iw8UsiHCP1GSs213'
marketId = '1.165721356'
bot = BetfairBot(betfairMarketId=marketId)
# Get SOID token
bot.getBetfairSessionToken(betfairPassword='e', betfairAppKey = appKey)
bot.getMarketDetails()
bot.setupLocalData()
bot.TEST_MODE = False

bot.run()
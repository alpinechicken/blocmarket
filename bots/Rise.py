import time
import json
from BlocBot import BlocBot
import threading

# Demo setup
'''
Run from file blocbotpack.txt

# Create a settings file

import json

bot1 = {'spread': 0.01,
 'updateFrequencySeconds': 180*2,
 'verifyKey': 'df2c6304f70d49f1b26d3ddab2712fac348043a6a189459c7af21d0e2366b788',
 'signingKey': 'd329766b031f861f3427c34f0b4ac700a89945abd867230abbb52cdaf665d2a0',
 'traderId': 1,
 'marketRootId': 1,
 'blocurl': 'http://127.0.0.1:7000/',
 'blocheaders': {'content-type': 'application/json'},
 'quoteSource': 'alphavantage'}
 
bot2 = {'spread': 0.01,
 'updateFrequencySeconds': 180*2,
 'verifyKey': '2453f5598939476963c88bdb5171223887d561fe2a5bdf1df333426d90330de7',
 'signingKey': 'a69d4c4b9a3fa05d947cc669c78c12913177891e0e1f16951223902da235d08f',
 'traderId': 2,
 'marketId': 1,
 'blocurl': 'http://127.0.0.1:7000/',
 'blocheaders': {'content-type': 'application/json'},
 'quoteSource': 'alphavantage'}

data = {}
data['botseed'] = []
data['botseed'].append(bot1)
data['botseed'].append(bot2)

with open('botdefs.txt','w') as f:
    json.dump(data, f)

'''

# Arise!
def rise(botdef):
    # Rise a bot and start streaming quotes
    bot = BlocBot()
    for key,val in botdef.items():
        # Set bot inputs from definiton
        setattr(bot, key, val)
    bot.streamQuote()
    
# Call
def Main():
    with open('botdefs.txt') as jf:
        data = json.load(jf)
        for bot in data['botseed']:
            print('Starting bot...')
            backgroundBot = threading.Thread(target=rise, args=(bot,)).start()
            # Start up new bot half way to refresh
            print('Waiting for next bot')
            time.sleep(bot['updateFrequencySeconds']/2)
        print('All bots started.')

if __name__== '__main__':
    Main()

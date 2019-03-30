import threading
import time
import json
from bots.BlocBot import BlocBot

'''
Run from file blocbotpack.txt

# Create a settings file

import json

bot1 = {'spread': 0.01,
 'updateFrequencySeconds': 180,
 'verifyKey': '19c4677e1806ee68dc5228ccd754a7b141c8fe90e1c67158d0a2317bd5c9b140',
 'signingKey': '51b118e948e6acc3d0d0829bcb1b0f0c0c511feca72f44a1e7f70e294da16532',
 'traderId': 5,
 'marketRootId': 7,
 'marketBranchId': 1,
 'marketId': 8,
 'marketMin': 2500,
 'marketMax': 4500,
 'marketDesc': 'BTC',
 'blocurl': 'http://127.0.0.1:7000/',
 'blocheaders': {'content-type': 'application/json'},
 'quoteSource': 'alphavantage'}
 
bot2 = {'spread': 0.01,
 'updateFrequencySeconds': 180,
 'verifyKey': 'd7ab267fde2c9cb52c920e028c96ea9ebd778e4abefe88113071f15731592390',
 'signingKey': '4dd257ee07ac7741d1f6475b0d4dbdba606aa0df6d45d1f0e7024652ac31219b',
 'traderId': 7,
 'marketRootId': 7,
 'marketBranchId': 1,
 'marketId': 8,
 'marketMin': 2500,
 'marketMax': 4500,
 'marketDesc': 'BTC',
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


# Arise
def rise(botdef):
    bot = BlocBot()
    for key,val in botdef.items():
        # Set values
        setattr(bot, key, val)
    bot.streamQuote()
    
# Call 
with open('bots/botdefs.txt') as jf:
    data = json.load(jf)
    for bot in data['botseed']:
        threading.Thread(target=rise, args=(bot,)).start()
            
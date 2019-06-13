# Basic bot
import requests
import pandas as pd
import json
import threading
from BlocBot import BlocBot
from BetfairPriceMakingBot import BetfairPriceMakingBot

# Create a new user
baseurl = 'https://blocmarket.herokuapp.com/'
url = baseurl +'createUser'
content = {}
headers = {'content-type': 'application/json'}
response = requests.post(url, data=json.dumps(content))

# Save user details
sk = response.json()['signingKey']
vk = response.json()['verifyKey']
tId = int(response.json()['traderId'])

# Basic Bot definition
botdef = {'spread': 0.01,
 'updateFrequencySeconds': 30,
 'verifyKey': vk,
 'signingKey':  sk,
 'traderId': tId,
 'multiplier': 10000,
 'blocurl': baseurl,
 'blocheaders': {'content-type': 'application/json'}}

botdef


# Manual setup

#vk = 'a4f97e2a0253a583f1e114b7cd155aa871d122c929543fcf8c6502a9dd9a5fd4'
#sk = '3ed2212eaa418db63ff1d17e5a12c57e2255a05d8e8afbb912b466cbbcd14b7c'
#tId = 2
baseurl = 'https://blocmarket.herokuapp.com/'


# Create a test market
url = baseurl + 'createMarket'
content_makemarket = {"signingKey": sk,
                        "traderId": tId,
                        "verifyKey": vk,
                        "marketRootId": 3,
                        "marketBranchId": 1,
                        "marketMin": 0,
                        "marketMax": 10000}
# Post market
response = requests.post(url, data=json.dumps(content_makemarket), headers=headers)



# Create a bot for market (Make sure VPN location is OK)
iMarket = 1
bot = BetfairPriceMakingBot(iMarket)
bot.getBetfairSessionToken(betfairAppKey='iw8UsiHCP1GSs213', betfairPassword='eeis2718')

# Add some defs
for key, val in botdef.items():
    # Set bot inputs from definiton
    setattr(bot, key, val)

# Stream qutoe
bot.streamQuote()

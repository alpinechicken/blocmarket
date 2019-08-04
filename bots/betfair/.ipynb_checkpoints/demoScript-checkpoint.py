import betfair as bf
from datetime import datetime, timedelta
## This demonstration script shows an example of loging in to the betfair API, and using some functionality within it.

## 1. Starting-up

# Login to betfair and get a session key:

username = 'alpinechicken'
password = 'ee'
sessionKey = bf.betfairLogin(username,password)
# Display returned sessionKey:
print( 'sessionKey = ' + sessionKey)

# The session key will need to be used to authenticate all subsequent
# API-calls during the active session. 

# create an app-key for your application (this only needs to be done once 
# on your betfair account, then you can retrieve the created app-key
# forever). Subsequent calls to createAppKeys will not make new keys, but
# will not return an error. I like to keep it at the start of a script so
# any new users will automatically have keys created the first time they
# run the script.
appName = 'alpinechickenbetfair'
bf.createAppKeys(sessionKey,appName)

# retrieve app keys specific to your account, which will be used to 
# authenticate subsequent API calls:
liveKey,demoKey = bf.retrieveAppKeys(sessionKey)
# Display returned app-keys:
print('liveKey = ' + liveKey)
print('demoKey = ' + demoKey)

# The live-key is used for accessing the live, real-time API and placing 
# bets wil real money.
# The demo-key is used for accessing the delayed, demo API which does not
# use real money and is safe to start practising automated betting with. 
# I strongly reccomend using the demoKey while you develop and test your 
# owns codes, then satrt using the liveKey once you are convinced yous software
# is running correctly.


appKey = 'iw8UsiHCP1GSs213'


# Keep session alive
bf.betfairKeepAlive(sessionKey,appKey)


## 2. Using the API to view markets and place bets



# dateVector describes the current time- add one hour to it to see all
# markets where the event kicks off in one hour from now


dateStringUtc = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S:%fZ')

futureDateStringUtc = (datetime.utcnow()+timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S:%fZ')

# write the time filter in JSON format as required by the API:
timeFilter = '{"from":"' + dateStringUtc  +'", "to":"' + futureDateStringUtc +'"}'
#marketList = listMarketCatalogue(sessionKey,appKey,')

##
# Read up to 20 horse races in the time filter"
marketList = bf.listMarketCatalogue(sessionKey,appKey,eventTypeIds="1",marketBettingTypes="ODDS",marketTypeCodes=["MATCH_ODDS", "HALF_TIME_SCORE"],maxResults=3)
# explain in comments what the options are in the listmarkets fucntion, and
# explain the structure of the output too

# marketList is returned as a cell-array of structures ( each element of
# the cell-array contains a structure full of maret details)

# to see datails of the first market, we can access it with > marketList{1}:
market1 = marketList[0]

# in the horse race example, we can see the first horse in the market by
# accessing the "runners" field of the structure:
horse1 = market1['runners'][0]
# and the second horse:
horse2 = market1['runners'][1]
# in the Matlab command window, you should see the name, selectionId,
# handicap, sortPriority and metadata fields for the two sample horses
# above

# the marketId field of market1 and the selectionId of the horse you want
# to bet on are very important in the API, and are needed for the placing
# bets.
##
# for example the marketId of the first listed horse race is:
marketId = marketList[0]['marketId']
horseId1 = marketList[0]['runners'][0]['selectionId']
horseId2 = marketList[0]['runners'][1]['selectionId']
horseName1 = marketList[0]['runners'][0]['runnerName']
horseName2 = marketList[0]['runners'][1]['runnerName']


## read market odds and money backed/unbacked:



## logout from betfair:
#betfairLogout(sessionKey,appKey)






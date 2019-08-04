import requests
import urllib
import json
import datetime
from betfair.betfairLogin import betfairLogin

def listMarketCatalogue(sessionKey, appKey, maxResults=10,  **kwargs):

    # function [marketList] = listMarketCatalogue(sessionKey,appKey, maxResults, param1='value1',param2='value2'...)
    #
    # Returns a cell-array containing available markets and details of those
    # markets. Each element of the returned cell-array contains a structure
    # with fields describing market details.
    #
    #
    # INPUTS:
    # sessionKey = API session key, required for all API interactions, obtained
    #              from the "betfairLogin" function [string]
    #
    # appKey =  Either the demo or live API application key, required for all
    #           API interactions, obtained from the "retrievAppKeys" function
    #           [string]
    #
    # **kwargs = list of input parameters & values, listed in format
    #            param1 ='value1',param2,'value2' detailed below.
    #
    # parameters and values allowed are:
    #
    #      maxResults = maximum number of markets to return in list. Defaults
    #      to 10 if undefined.
    #
    #      textQuery = Restrict markets by any text associated with the market
    #                  such as the Name, Event, Competition, etc. You can
    #                  include a wildcard (*) character as long as it is not
    #                  the first character.
    #
    #      eventTypeIds = Restrict markets by event type associated with the
    #                     market. (i.e., Football, Hockey, etc)
    #
    #      eventIds = Restrict markets by the event id associated with the
    #                 market. [number]
    #                 (1=Soccer, 2=Tennis, 3=Golf, 4=Cricket, 5=Rugby Union,
    #                  6=Boxing, 7=Horse Racing, 8=Motor Sport, 9=Special Bets,
    #                  468328=Handball, 451485=Winter Sports, 7522=Basketball,
    #                  1477=Rugby League, 4339=Greyhound Racing, 19=Politics,
    #                  6231=Financial Bets, 99817=Volleyball, 998918=Bowls,
    #                  998919=Bandy, 3503=Darts, 72382=Pool, 6422=Snooker,
    #                  6423=American Football, 7511=Baseball.
    #
    #      competitionIds = Restrict markets by the competitions associated
    #                       with the market.
    #
    #      marketIds = Restrict markets by the market id associated with the
    #                  market.
    #
    #      venues = Restrict markets by the venue associated with the market.
    #               Currently only Horse Racing markets have venues.
    #
    #      bspOnly = Restrict to bsp markets only, if True or non-bsp markets
    #                if False. If not specified then returns both BSP and
    #                non-BSP markets.
    #
    #      turnInPlayEnabled = Restrict to markets that will turn in play if
    #                          True or will not turn in play if false. If not
    #                          specified, returns both.
    #
    #      inPlayOnly = Restrict to markets that are currently in play if True
    #                   or are not currently in play if false. If not specified,
    #                   returns both.
    #
    #      marketBettingTypes = Restrict to markets that match the betting type
    #                           of the market (i.e. Odds, Asian Handicap
    #                           Singles, or Asian Handicap Doubles
    #
    #      marketCountries = Restrict to markets that are in the specified
    #                        country or countries, e.g. 'UK,AUS' for just
    #                        British and Australian events. Full List of
    #                        country codes is at:
    #                        https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
    #
    #      marketTypeCodes = Restrict to markets that match the type of the
    #                        market (i.e., MATCH_ODDS, HALF_TIME_SCORE). You
    #                        should use this instead of relying on the market
    #                        name as the market type codes are the same in all
    #                        locales [e.g. 'MATCH','WIN','PLACE']. See list of
    #                        market types in marketTypeCodes.txt. Most popular
    #                        options are 'WIN','WINNER','MATCH'.
    #
    #       marketStartTime = Restrict to markets with a market start time
    #                         before or after the specified date
    #
    #       withOrders = Restrict to markets that I have one or more orders in
    #                    these status.
    #
    #
    # OUTPUTS:
    # marketList = A cell-array, where each element is a seperate market. Each
    #              cell contains a structure containing many market details.
    #
    # Example:
    # # to get up to 20 Rugby League final score (match-odds) markets:
    # >>[marketList] = listMarketCatalogue(sessionKey,appKey,eventTypeIds=[1477],marketBettingTypes=['ODDS'],marketTypeCodes=['MATCH_ODDS'],maxResults=20)


    ## Set up request to sen to Betfair API via HTTP:

    url = 'https://api.betfair.com/exchange/betting/json-rpc/v1'

    # define http - request headers:
    headers =  {'X-Authentication': sessionKey, 'X-Application':appKey, 'content-type': 'application/json'}

    # # Create and check formattingf the http request body:


    maxResults = '10'

    bodyFields = {'textquery': '',
    'eventTypeIds': '',
    'eventIds': '',
    'competitionIds': '',
    'marketIds': '',
    'venues': '',
    'bspOnly': '',
    'turnInPlayEnabled': '',
    'inPlayOnly': '',
    'marketBettingTypes': '',
    'marketTypeCodes': '',
    'marketCountries': '',
    'marketStartTime': '',
    'withOrders': ''}

    # Assign
    inputParams = {}
    for key, value in kwargs.items():
        if key in bodyFields.keys() and type(value)==dict or type(value)==list :
            inputParams[key] = value
        elif key in bodyFields.keys():
            inputParams[key] = [value]
        elif key == 'maxResults':
            maxResults = str(value)
        else:
            raise ValueError( key + ' is not a valid input.')


    # define the body of the http-request:
    #content = '{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketCatalogue", "params":{ "filter":{"eventTypeIds": ["1"], "marketBettingTypes":["ODDS"], "marketTypeCodes": ["MATCH_ODDS"]} , "maxResults": "' + str(maxResults) + '", "marketProjection":["COMPETITION","EVENT","EVENT_TYPE","MARKET_DESCRIPTION","RUNNER_DESCRIPTION","RUNNER_METADATA","MARKET_START_TIME"]}, "id": 1}'
    content = {"jsonrpc": "2.0", \
               "method": "SportsAPING/v1.0/listMarketCatalogue",
               "params":{ "filter":  inputParams  ,
                           "maxResults":  str(maxResults),
                           "marketProjection":["COMPETITION","EVENT","EVENT_TYPE","MARKET_DESCRIPTION","RUNNER_DESCRIPTION","RUNNER_METADATA","MARKET_START_TIME"]},
               "id": 1}
    # Make request

    #TODO: format above nicely as json first then convert to string

    response = requests.post(url, data=json.dumps(content), headers=headers)

    if 'result' in response.json():
        marketCatalogue = response.json()['result']
    else:
        print('No result returned.')
        marketCatalogue = []
    # output
    return marketCatalogue

'''
sessionKey = betfairLogin('alpinechicken', 'ee', appName='alpinechickenbetfair')
appKey = 'iw8UsiHCP1GSs213'

marketCatalogue = listMarketCatalogue(sessionKey,appKey,eventTypeIds="1",marketBettingTypes="ODDS",marketTypeCodes=["MATCH_ODDS", "HALF_TIME_SCORE"],maxResults=3)

'''

# ''' Example element
# {'marketId': '1.160297765', 'marketName': 'Match Odds', 'marketStartTime': '2019-07-10T08:00:00.000Z', 'description': {'persistenceEnabled': True, 'bspMarket': False, 'marketTime': '2019-07-10T08:00:00.000Z', 'suspendTime': '2019-07-10T08:00:00.000Z', 'bettingType': 'ODDS', 'turnInPlayEnabled': True, 'marketType': 'MATCH_ODDS', 'regulator': 'MALTA LOTTERIES AND GAMBLING AUTHORITY', 'marketBaseRate': 5.0, 'discountAllowed': True, 'wallet': 'UK wallet', 'rules': '<br><a href="http://www.stats.betradar.com/statistics/betfaircom/?language=en" target="_blank"><img src="http://content-cache.betfair.com/images/en_GB/mr_fg.gif" title="Form Guide" border="0"></a><a href="http://www.livescore.betradar.com/?alias=betfair&language=en" target="_blank"><img src="http://content-cache.betfair.com/images/en_GB/mr_ls.gif" title="Live Scores" border="0"></a><br><br><b>Market Information</b><br><br>For further information please see <a href=http://content.betfair.com/aboutus/content.asp?sWhichKey=Rules%20and%20Regulations#undefined.do style=color:0163ad; text-decoration: underline; target=_blank>Rules & Regs</a>.<br><br>Predict the result of this match. <b><font color=red> All bets apply to Full Time according to the match officials, plus any stoppage time.  Extra-time/penalty shoot-outs are not included.</b></font><br><br> <b><font color=blue>If this market is re-opened for In-Play betting, </b></font> unmatched bets will be cancelled at kick off and the market turned in play. The market will be suspended if it appears that a goal has been scored, a penalty will be given, or a red card will be shown. With the exception of bets for which the "keep" option has been selected, unmatched bets will be cancelled if it appears that a goal has been scored or a red card has been shown (notwithstanding that such goal or red card may ultimately not be awarded). Please note that should our data feeds fail we may be unable to manage this game in-play. <br><br>Customers should be aware that:<b><br><br><li>Transmissions described as “live” by some broadcasters may actually be delayed</li><br><li>The extent of any such delay may vary, depending on the set-up through which they are receiving pictures or data.</b><br><br> If this market is scheduled to go in-play, but due to unforeseen circumstances we are unable to offer the market in-play, then this market will be re-opened for the half-time interval and suspended again an hour after the scheduled kick-off time.  Whilst it is our intention to re-open this market for the half-time interval, in certain circumstances this may not always be possible.<br>', 'rulesHasDate': True, 'priceLadderDescription': {'type': 'CLASSIC'}}, 'totalMatched': 56.916000000000004, 'runners': [{'selectionId': 24207876, 'runnerName': 'Gia Dinh', 'handicap': 0.0, 'sortPriority': 1, 'metadata': {'runnerId': '24207876'}}, {'selectionId': 18395424, 'runnerName': 'Ba Ria Vung Tau FC', 'handicap': 0.0, 'sortPriority': 2, 'metadata': {'runnerId': '18395424'}}, {'selectionId': 58805, 'runnerName': 'The Draw', 'handicap': 0.0, 'sortPriority': 3, 'metadata': {'runnerId': '58805'}}], 'eventType': {'id': '1', 'name': 'Soccer'}, 'competition': {'id': '12233279', 'name': 'Vietnamese Second Division'}, 'event': {'id': '29358269', 'name': 'Gia Dinh v Ba Ria Vung Tau FC', 'countryCode': 'VN', 'timezone': 'GMT', 'openDate': '2019-07-10T08:00:00.000Z'}}
# '''
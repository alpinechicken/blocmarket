import json
import requests
#from betfair.betfairLogin import betfairLogin

def listMarketBook(sessionKey, appKey, **kwargs):

    # function marketBook = listMarketBook(sessionKey,appKey,kwargs)
    #
    # Returns a structure with fields describing market details, including
    # available odds and backed/unbacked monetary volumes.
    #
    # INPUTS:
    # sessionKey = API session key, required for all API interactions, obtained
    #              from the "betfairLogin" function [string]
    #
    # appKey =  Either the demo or live API application key, required for all
    #           API interactions, obtained from the "retrieveAppKeys" function
    #           [string]
    #
    # **kwargs = list of input parameters & values, listed in format
    #            param1 ='value1',param2='value2' detailed below.
    #
    # parameters and values allowed are:
    #
    #      marketId = One or more market ids. The number of markets returned
    #                 depends on the amount of data you request via the price projection.
    #
    #      wallet = 'UK' or 'AUS' - this is e critical parameter that tells
    #               betfair if the market associates with your betfair  main
    #               wallet or australian wallet
    #
    #      priceProjection = The projection of price data you want to receive
    #                        in the response. Allowable values are 'SP_AVAILABLE',
    #                        'SP_TRADED', 'EX_BEST_OFFERS', 'EX_ALL_OFFERS',
    #                        or 'EX_TRADED'.
    #
    #      orderProjection = The orders you want to receive in the response.
    #                        Allowable values are 'ALL', 'EXECUTABLE',
    #                        'EXECUTION_COMPLETE'.
    #
    #      matchProjection = If you ask for orders, specifies the representation
    #                        of matches. Allowable values are 'NO_ROLLUP',
    #                        'ROLLED_UP_BY_PRICE', 'ROLLED_UP_BY_AVGE_PRICE'.
    #
    #      currencyCode = A Betfair standard currency code. If not specified,
    #                     the default currency code is used. Allowable values
    #                     are 'GBP', 'EUR', 'US$', 'HK$', 'AUD', 'CAD', 'DKK',
    #                     'NOK', 'SEK', 'SGD'')
    #
    #      locale = The language used for the response. If not specified, the default is returned.
    #
    #
    # OUTPUTS:
    # marketBook = Structure containing market details
    #
    # Example:
    # To list the best offer exchange odds on a market found with the
    # "listMarketCatalogue" function:
    # marketBook = listMarketBook(sessionKey,appKey,marketId=market1Id,priceProjection='EX_BEST_OFFERS',wallet=wallet)
    #
    # # I recommend browsing through the "marketBook" structure variable
    # # so you can find specific components that you are
    # # looking for, although some examples are given below.
    # #
    #
    # # get the exchange price available to back on the first game outcome:
    # bestPrice1 = orderBook['result'][0]['runners'][0]['ex']['availableToBack'][0]['price']
    # # also get the amount of money available to back at the above price:
    # bestSize1 = orderBook['result'][0]['runners'][0]['ex']['availableToBack'][0]['size']
    #
    # # get the exchange price available to back on the 2nd game outcome:
    # bestPrice2 = orderBook['result'][0]['runners'][1]['ex']['availableToBack'][0]['price']
    # # also get the amount of money available to back at the above price:
    # bestSize2 = orderBook['result'][0]['runners'][1]['ex']['availableToBack'][0]['size']
    #
    # # you can also see the 2nd-best price available for the above option by
    # # changing the index of the "availableToBack" structure field:
    # secondBestPrice2 = orderBook['result'][0]['runners'][1]['ex']['availableToBack'][1]['price']
    # secondBestSize2 = orderBook['result'][0]['runners'][1]['ex']['availableToBack'][1]['size']
    #
    #
    # # there are also availableToLay and tradedVolume fields, which will list themselves in the matlab command window from the command:
    # marketBook.runners{1}.ex


    ## Set up request to sen to Betfair API via HTTP:

    # define url to send data to:
    urlAUS= 'https://api-au.betfair.com/exchange/betting/json-rpc/v1/'
    urlUK = 'https://api.betfair.com/exchange/betting/json-rpc/v1/'

    # define http - request headers:
    headers =  {'X-Authentication': sessionKey, 'X-Application':appKey, 'content-type': 'application/json'}

    # # Create and check formatting the http request body:


    maxResults = '10'

    bodyFields = {'marketIds':'',
        'priceProjection':'',
        'orderProjection':'',
        'matchProjection':'',
        'currencyCode':'',
        'locale':''}

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


    content = {"jsonrpc": "2.0",
               "method": "SportsAPING/v1.0/listMarketBook",
               "params" :  inputParams,
               "id": 1}

    response = requests.get(urlUK, data=json.dumps(content), headers=headers)

    orderBook = response.json()['result']
    # output
    return orderBook

'''
sessionKey = betfairLogin('alpinechicken', 'e', appKey='alpinechickenbetfair')
appKey = 'iw8UsiHCP1GSs213'
marketIds = 1.159418817
orderBook = listMarketBook(sessionKey=sessionKey, appKey=appKey, marketIds=marketIds, priceProjection={"priceData":["EX_BEST_OFFERS"]})
'''
# Choose first runner
#selectionId = orderBook[0]['runners'][0]['selectionId']
# Choose best bid
#oddsToPlace = orderBook[0]['runners'][0]['ex']['availableToBack'][0]['price']
#size = orderBook[0]['runners'][0]['ex']['availableToBack'][0]['size']




''' Example closed market
<class 'list'>: [{'marketId': '1.159049810', 'isMarketDataDelayed': False, 'status': 'CLOSED', 'betDelay': 5, 'bspReconciled': True, 'complete': True, 'inplay': False, 'numberOfWinners': 1, 'numberOfRunners': 2, 'numberOfActiveRunners': 0, 'totalMatched': 0.0, 'totalAvailable': 0.0, 'crossMatching': False, 'runnersVoidable': False, 'version': 2848687954, 'runners': [{'selectionId': 3459613, 'handicap': 0.0, 'status': 'WINNER', 'ex': {'availableToBack': [], 'availableToLay': [], 'tradedVolume': []}}, {'selectionId': 39990, 'handicap': 0.0, 'status': 'LOSER', 'ex': {'availableToBack': [], 'availableToLay': [], 'tradedVolume': []}}]}]
'''


''' Example live market
<class 'list'>: [{'marketId': '1.159907317', 'isMarketDataDelayed': True, 'status': 'OPEN', 'betDelay': 0, 'bspReconciled': False, 'complete': True, 'inplay': False, 'numberOfWinners': 1, 'numberOfRunners': 2, 'numberOfActiveRunners': 2, 'lastMatchTime': '2019-07-10T05:48:46.544Z', 'totalMatched': 199874.0, 'totalAvailable': 61764.26, 'crossMatching': True, 'runnersVoidable': False, 'version': 2830809378, 'runners': [{'selectionId': 42296, 'handicap': 0.0, 'status': 'ACTIVE', 'lastPriceTraded': 1.38, 'totalMatched': 0.0, 'ex': {'availableToBack': [{'price': 1.37, 'size': 358.35}, {'price': 1.36, 'size': 5591.64}, {'price': 1.35, 'size': 3676.86}], 'availableToLay': [{'price': 1.38, 'size': 2712.02}, {'price': 1.39, 'size': 6723.26}, {'price': 1.4, 'size': 4408.33}], 'tradedVolume': []}}, {'selectionId': 40034, 'handicap': 0.0, 'status': 'ACTIVE', 'lastPriceTraded': 3.75, 'totalMatched': 0.0, 'ex': {'availableToBack': [{'price': 3.7, 'size': 153.09}, {'price': 3.65, 'size': 567.34}, {'price': 3.6, 'size': 1112.07}], 'availableToLay': [{'price': 3.75, 'size': 263.22}, {'price': 3.8, 'size': 2025.71}, {'price': 3.85, 'size': 1007.77}], 'tradedVolume': []}}]}]
'''
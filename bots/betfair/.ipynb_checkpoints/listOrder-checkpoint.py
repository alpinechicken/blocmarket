import requests
import json
#from betfair.betfairLogin import betfairLogin

def listOrder(sessionKey,appKey,**kwargs):


    # function listOrder(sessionKey,appKey,**kwargs)
    #
    # Lists status of bet orders on the betfair exchange. All of the inputs listed below
    # are critical, i.e. if any of the parameters below are missing, the order
    # will fail to execute.
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
    #            param1 ='value1',param2='value2' detailed below.
    #
    # parameters and values allowed are:
    #
    #      betId = bet Id that you want to check. If set to "ALL", all current
    #      bets will be returned
    #
    #      marketId = market Id to retrieve bets from (optional)
    #
    #      wallet = betfair wallet to use money from (there is an distinct
    #               difference between Australian wallet bets and betfair
    #               main-wallet events). The wallet definition for an event is
    #               returned by the "listMarketCatalogue" function.
    #
    #
    # OUTPUTS:
    # orderStatus = cell array of structures whos fields contain order details
    #
    # Example:
    # # get the previous bet status with the "listOrder" function
    # >> orderStatus = listOrder(sessionKey,appKey,betIds=betId,wallet=wallet)
    # #
    # # It is important to look at the "sizeMatched" field of the structure returned
    # # from "listOrder". If zero, the bet is unmatched, and if lss than the
    # # original stake size, the bet is only partially matched.
    # #
    # # another option is to list all open bets by setting the 'betId parameter to 'ALL':
    # >>allOrderStatuses = listOrder(sessionKey,appKey,betIds='ALL',wallet=wallet)


    ## Set up request to sen to Betfair API via HTTP:


    # define url to send data to:
    urlAUS= 'https://api-au.betfair.com/exchange/betting/json-rpc/v1/'
    urlUK = 'https://api.betfair.com/exchange/betting/json-rpc/v1/'


    # define http - request headers:
    headers =  {'X-Authentication': sessionKey, 'X-Application':appKey, 'content-type': 'application/json'}

    # # Create and check formattingf the http request content:


    maxResults = '10'

    bodyFields = {'betIds': '',
    'marketIds': '',
    'wallet': ''}

    # Assign
    inputParams = {}
    for key, value in kwargs.items():
        if key in bodyFields.keys() and type(value)==dict:
            inputParams[key] = value
        elif key in bodyFields.keys():
            inputParams[key] = [value]
        elif key == 'maxResults':
            maxResults = str(value)
        else:
            raise ValueError( key + ' is not a valid input.')


    if 'wallet' in inputParams:
        if  inputParams['wallet'] == 'AUS':
            url = urlAUS
    else:
        url = urlUK

    if  'betIds' in inputParams and not 'marketIds' in inputParams:
        if inputParams['betIds'] == ["ALL"]:
            content = {"jsonrpc": "2.0",
                       "method": "SportsAPING/v1.0/listCurrentOrders",
                       "params": {"placedDateRange":{}, "orderProjection": "ALL", "recordCount":1000 },
                       "id":1}
        else:
            content = {"jsonrpc": "2.0",
                       "method": "SportsAPING/v1.0/listCurrentOrders",
                       "params": {"betIds": inputParams['betIds'] , "placedDateRange":{} },
                       "id":1}

    elif not 'betIds' in inputParams and 'marketIds' in inputParams:
        content = {"jsonrpc": "2.0",
                   "method": "SportsAPING/v1.0/listCurrentOrders",
                   "params": {"marketIds": inputParams['marketIds'], "placedDateRange":{} },
                   "id":1}
    elif 'betIds' in inputParams and 'marketIds' in inputParams:
        content = {"jsonrpc": "2.0",
                   "method": "SportsAPING/v1.0/listCurrentOrders",
                   "params": {"betIds": inputParams['betIds'], "marketIds":inputParams['marketIds'], "placedDateRange":{} },
                   "id":1}


    response = requests.post(url, data=json.dumps(content), headers=headers)
    
    orderStatus = response.json()['result']

    # output
    return orderStatus

# sessionKey = betfairLogin('alpinechicken', 'e')
# appKey = 'iw8UsiHCP1GSs213'
# orders1 = listOrder(sessionKey,appKey,betIds="ALL")
# orders2 = listOrder(sessionKey,appKey,betIds=169751223110)
# orders3 = listOrder(sessionKey,appKey,marketIds=1.159907317)



''' Example order status
{'betId': '169740622606',
 'marketId': '1.159907317',
 'selectionId': 42296,
 'handicap': 0.0,
 'priceSize': {'price': 1.5, 'size': 5.0},
 'bspLiability': 0.0,
 'side': 'BACK',
 'status': 'EXECUTABLE',
 'persistenceType': 'LAPSE',
 'orderType': 'LIMIT',
 'placedDate': '2019-06-30T06:41:31.000Z',
 'averagePriceMatched': 0.0,
 'sizeMatched': 0.0,
 'sizeRemaining': 5.0,
 'sizeLapsed': 0.0,
 'sizeCancelled': 0.0,
 'sizeVoided': 0.0,
 'regulatorCode': 'MALTA LOTTERIES AND GAMBLING AUTHORITY'}
'''


''' Example of matched an unmatched order

[{'betId': '171025669027',
  'marketId': '1.160350460',
  'selectionId': 10301,
  'handicap': 0.0,
  'priceSize': {'price': 1.6, 'size': 5.0},
  'bspLiability': 0.0,
  'side': 'BACK',
  'status': 'EXECUTABLE',
  'persistenceType': 'LAPSE',
  'orderType': 'LIMIT',
  'placedDate': '2019-07-14T06:45:18.000Z',
  'averagePriceMatched': 0.0,
  'sizeMatched': 0.0,
  'sizeRemaining': 5.0,
  'sizeLapsed': 0.0,
  'sizeCancelled': 0.0,
  'sizeVoided': 0.0,
  'regulatorCode': 'MALTA LOTTERIES AND GAMBLING AUTHORITY'},
 {'betId': '171025720559',
  'marketId': '1.160350460',
  'selectionId': 10301,
  'handicap': 0.0,
  'priceSize': {'price': 1.33, 'size': 5.0},
  'bspLiability': 0.0,
  'side': 'BACK',
  'status': 'EXECUTION_COMPLETE',
  'persistenceType': 'LAPSE',
  'orderType': 'LIMIT',
  'placedDate': '2019-07-14T06:47:14.000Z',
  'matchedDate': '2019-07-14T06:47:14.000Z',
  'averagePriceMatched': 1.33,
  'sizeMatched': 5.0,
  'sizeRemaining': 0.0,
  'sizeLapsed': 0.0,
  'sizeCancelled': 0.0,
  'sizeVoided': 0.0,
  'regulatorCode': 'MALTA LOTTERIES AND GAMBLING AUTHORITY'}]



'''
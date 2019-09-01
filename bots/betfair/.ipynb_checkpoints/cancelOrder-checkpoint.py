import requests
import json

def cancelOrder(sessionKey,appKey,**kwargs):


    # function cancelStatus = cancelOrder(sessionKey,appKey,**kwargs)
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
    #      betId = ID of bet that you want to cancel
    #
    #      marketId = market Id to cancel bets from

    ##      wallet = betfair wallet to use money from (there is an distinct
    #               difference between Australian wallet bets and batfair
    #               main-wallet events). The wallet definition for an event is
    #               returned by the "listMarketCatalogue" function.
    #
    #  *** If 'betId' and 'marketId' parameters are not input, ALL open bets
    #       will be cancelled ***
    #
    # OUTPUTS:
    # orderStatus = cell array of structures whos fields contain order details
    #
    # Example:
    #
    # # there are a few options for cancelling a single bet, all bets on a market,
    # # or all bets on your whole account, all of which are listed below:
    #
    # # use API cancelOrders function (https://api.developer.betfair.com/services/webapps/docs/display/1smk3cen4v3lu3yomq5qye0ni/cancelOrders)
    # >> cancelStatus = cancelOrder(sessionKey,appKey,betId=betId,marketId=market1Id,wallet=wallet)
    # # read the cancelStatus['status'] field to check cancellation was successful:
    #
    # # alternatively, to cancel all bets in a certain market, just enter the
    # # 'marketId' parameter:
    # >> cancelStatus_OneBetOnly = cancelOrder(sessionKey,appKey,marketId=market1Id,wallet=wallet)
    #
    # # omit the 'marketId' and betId' parameters to cancel ALL bets:
    # >> cancelStatus_ALL = cancelOrder(sessionKey,appKey,wallet=wallet)
    #
    #

    ## Set up request to send to Betfair API via HTTP:

    # define url to send data to:
    urlAUS = 'https://api-au.betfair.com/exchange/betting/json-rpc/v1/'
    urlUK = 'https://api.betfair.com/exchange/betting/json-rpc/v1/'

    # define http - request headers:
    headers = {'X-Authentication': sessionKey, 'X-Application': appKey, 'content-type': 'application/json'}

    # # Create and check formatting of the http request content:

    bodyFields = {'betId': '',
                     'marketId': '',
                     'wallet': ''}

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

    if inputParams['wallet'] == 'AUS':
        url = urlAUS;
    else:
        url = urlUK;

    if 'betId' in inputParams and not 'marketId' in inputParams:
        if inputParams['betId'] == 'ALL':
            content = [{"jsonrpc": "2.0",
                        "method": "SportsAPING/v1.0/cancelOrders",
                        "params": {},
                        "id": 1}]
        else:
            content = [{"jsonrpc": "2.0",
                        "method": "SportsAPING/v1.0/cancelOrders",
                        "params": {"instructions":[{"betId":  inputParams['betId'],
                                                    "sizeReduction":'null'}]}, "id": 1}]

    elif not 'betId' in inputParams and 'marketId' in inputParams:
        content = [{"jsonrpc": "2.0",
                    "method": "SportsAPING/v1.0/cancelOrders",
                    "params": {"marketId": inputParams['marketId']},
                    "id": 1}]
    elif 'betId' in inputParams and 'marketId' in inputParams:
        content = [{"jsonrpc": "2.0",
                    "method": "SportsAPING/v1.0/cancelOrders",
                    "params": {"betId": inputParams['betId'] }, "id": 1}]

    response = requests.post(url, data=json.dumps(content), headers=headers)

    cancelStatus = response.json()

    # output
    return cancelStatus
    #TODO: create json directly and convert to string for the request rather than from the start





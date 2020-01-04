import requests
import json
#from bots.betfair.betfairLogin import betfairLogin
#from bots.betfair.listMarketCatalogue import listMarketCatalogue
#from bots.betfair.listMarketBook import listMarketBook

def placeOrder(sessionKey,appKey,**kwargs):

    
    # function placeOrder(sessionKey,appKey,**kwargs)
    #
    # Places bet orders on the betfair exchange. All of the inputs listed below
    # are critical, i.e. if any of the parameters below are missing, the order
    # will fail to execute.
    #
    # INPUTS:
    # sessionKey = API session key, required for all API interactions, obtained
    #              from the "betfairLogin" function [string]
    #
    # appKey =  Either the demo or live API application key, required for all
    #           API interactions, obtained from the "retrieveAppKeys" function
    #           [string]
    #
    # varargin = list of input parameters & values, listed in format
    #            param1='value1',param2='value2' detailed below.
    #
    # parameters and values allowed are:
    #
    #      marketId = The ID number for the betfair market that you want to
    #                 place an order on, e.g. "1.119725155" (obtained from the
    #                 "listMarketCatalogue" function. Without a marketId, a bet
    #                 cannot be placed.
    #
    #       orderType = type of order to place. Allowable values are 'LIMIT',
    #       'LIMIT_ON_CLOSE', 'MARKET_ON_CLOSE'
    #
    #       selectionId = The specfic Id of a the outcome you want to bet on,
    #                     e.g. "7414709", obtained from the "listMarketBook"
    #                     function.
    #
    #       side = Direction to bet. Must be either 'BACK' or 'LAY'
    #
    #       wallet = betfair wallet to use money from (there is an distinct
    #                difference between Australian wallet bets and batfair
    #                main-wallet events). The wallet definition for an event is
    #                returned by the "listMarketCatalogue" function.
    #
    #       price = Decimal odds at which bet should be placed. If the
    #               odds-price does not agree with the betfair price increments
    #               rounding below, it will be rounded to the nearest
    #               alowable value.
    #               Price       Increment
    #               1.01 ? 2	0.01
    #               2 ? 3       0.02
    #               3 ? 4       0.05
    #               4 ? 6       0.1
    #               6 ? 10      0.2
    #               10 ? 20     0.5
    #               20 ? 30     1
    #               30 ? 50     2
    #               50 ? 100	5
    #               100 ? 1000	10
    #
    #       size = Size of bet-take in local currency.
    #
    #       persistenceType = Determines what happens to your bet if unmatched
    #                         at the time when the event turns "in-play" (starts).
    #                         Allowable values are:
    #                         'LAPSE' ? Lapse the order when the market is
    #                                    turned in-play
    #                         'PERSIST' ? Persist the order to in-play. The
    #                                      bet will be place automatically into
    #                                      the in-play market at the start of
    #                                      the event.
    #                         'MARKET_ON_CLOSE' ? Put the order into the
    #                                             auction (SP) at turn-in-play.
    #
    #
    #
    # OUTPUTS:
    # orderStatus = structure whos fields contain order details
    #
    # Example:
    #
    # # To place a back bet with market details obtained in the demo script that lapses (cancels) if unmatched at the start of a game:
    # >> orderStatus = placeOrder(sessionKey,appKey,marketId=market1Id,selectionId=outcome[0]['selectionId'],orderType='LIMIT',side='BACK',wallet=wallet,price=oddsToPlace,size=10,persistenceType='LAPSE')
    #
    # # The 'LAPSE' persistenceType parameter causes the bet to be cancelled when
    # # the game turns in-play (when the game starts) if it has not been matched
    # # by somebody else in the market placing a lay-bet by that time. 
    #
    # # Check the response from the betting operation:
    # >> orderStatus['result']
    #
    # # If succesfully placed, get the betId: 
    # >> if orderStatus['result']['status']=='SUCCESS':
    # >>    orderStatus['result']['instructionReports'][0] # lists all fields of the bet order status
    # >>    betId = orderStatus['result']['instructionReports'][0]['betId']
    #
    # # check the response from the betting operation:
    # >> orderStatus['result']
    # TODO: Check these outputs


    ## Set up request to sen to Betfair API via HTTP:
    
    urlAUS= 'https://api-au.betfair.com/exchange/betting/json-rpc/v1/'
    urlUK = 'https://api.betfair.com/exchange/betting/json-rpc/v1/'
    
    # define http - request headers:
    headers = {'X-Authentication': sessionKey, 'X-Application': appKey, 'content-type': 'application/json'}
    
    # # Create and check formattingf the http request body:

    # Default customerStrategyRef
    customerStrategyRef = ''

    bodyFields = {'marketId': '',
                  'orderType': '',
                  'selectionId': '',
                  'side': '',
                  'wallet': '',
                  'price': '',
                  'size': '',
                  'persistenceType': ''
                  'customerStrategyRef'}
    
    # Assign
    inputParams = {}
    for key, value in kwargs.items():
        if key in bodyFields.keys() and type(value)==dict or type(value)==list :
            inputParams[key] = value
        elif key in bodyFields.keys():
            inputParams[key] = [value]
        elif key == 'maxResults':
            maxResults = str(value)
        elif key == 'customerStrategyRef':
            customerStrategyRef = value
        else:
            raise ValueError( key + ' is not a valid input.')


    ## Set up request to send to Betfair API via HTTP:
    

    
    # boolean for critical fields existing:


    # Handle price

    price = float(inputParams['price'][0])
    # rounding:
    if price <= 2:
        price = round(price * 100) / 100
    elif price <= 3:
        price = round(price * 50) / 50
    elif price <= 4:
        price = round(price * 20) / 20
    elif price <= 6:
        price = round(price * 10) / 10
    elif price <= 10:
        price = round(price * 5) / 5
    elif price <= 20:
        price = round(price * 2) / 2
    elif price <= 30:
        price = round(price);
    elif price <= 50:
        price = round(price * 0.5) / 0.5
    elif price <= 100:
        price = round(price * 0.2) / 0.2
    elif price <= 1000:
        price = round(price * 0.1) / 0.1

    betPrice = price

    # Handle bet size
    betSize = float(inputParams['size'][0])
    # round it to allowable decimation!
    betSize = round(betSize * 100) / 100
    #betSize = str(betSize)

    
    # define the body of the http-request:
    if  inputParams['wallet'][0] =='AUS':
        url = urlAUS
    else:
        url = urlUK

    marketId = json.dumps(inputParams['marketId'][0])


    '''
    
    [
        {
            "jsonrpc": "2.0",
            "method": "SportsAPING/v1.0/placeOrders",
            "params": {
                "marketId": "1.109850906",
                "instructions": [
                    {
                        "selectionId": "237486",
                        "handicap": "0",
                        "side": "LAY",
                        "orderType": "LIMIT",
                        "limitOrder": {
                            "size": "2",
                            "price": "3",
                            "persistenceType": "LAPSE"
                        }
                    }
                ]
            },
            "id": 1
        }
    ]
    
    
    
    '''

    content= {"jsonrpc": "2.0",
              "method": "SportsAPING/v1.0/placeOrders",
              "id": 1,
              "params": {"marketId": inputParams['marketId'][0],
                        "instructions": [{"orderType": inputParams['orderType'][0],
                                         "selectionId": inputParams['selectionId'][0],
                                         "handicap": "0",
                                         "side": inputParams['side'][0],
                                         "limitOrder": {"size": betSize,
                                                        "price": betPrice,
                                                        "persistenceType": inputParams['persistenceType'][0]}}],
                         "customerStrategyRef": customerStrategyRef
                         }
              }


    #TODO: format above nicely as json first then convert to string
    response = requests.post(url, data=json.dumps(content), headers=headers)

    # output
    return response.json(), content


'''
sessionKey = betfairLogin('alpinechicken', 'e', appName='alpinechickenbetfair')
demoAppKey = ''
liveAppKey = ''
#sessionKey = '1UJRe6TXKpb0qMXFbN7hVULz7HODbBdbRBU6dfzGBFY'
appKey = 'iw8UsiHCP1GSs213'
marketId = '1.162374928'
selectionId = 62523
oddsToPlace = 3
size = 5



wallet = 'AUS'
#catalogue = listMarketCatalogue(sessionKey,appKey,eventTypeIds="1477",marketBettingTypes="ODDS",marketTypeCodes="MATCH_ODDS",maxResults=20)

# Pick the first market
#marketId = catalogue['result'][0]['marketId']


#orderBook = listMarketBook(sessionKey=sessionKey, appKey=appKey, marketIds=marketId, priceProjection={"priceData":["EX_BEST_OFFERS"]})

# Choose first runner
#selectionId = orderBook['result'][0]['runners'][0]['selectionId']
# Choose best bid
#oddsToPlace = orderBook['result'][0]['runners'][0]['ex']['availableToBack'][0]['price']
#size = orderBook['result'][0]['runners'][0]['ex']['availableToBack'][0]['size']

resp = placeOrder(sessionKey,appKey,marketId=marketId,selectionId=selectionId,orderType='LIMIT',side='BACK',wallet=wallet,price=oddsToPlace,size=5,persistenceType='LAPSE')
'''

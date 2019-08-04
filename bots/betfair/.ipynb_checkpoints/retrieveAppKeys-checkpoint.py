import requests
from betfair.betfairLogin import betfairLogin

def retrieveAppKeys(sessionKey):

    # function retrieveAppKeys(sessionKey)
    #
    # retrieves previously created app-keys from your betfair API account.
    #
    # INPUTS:
    # sessionKey = API session key, required for all API interactions, obtained
    #              from the "betfairLogin" function [string]
    #
    # OUTPUTS:
    # liveKey  = Effectively a password to invoke betting operations through
    #            the API with your betfair account [string]
    # demoKey =  Effectively a password to invoke betting operations through
    #            the API with your betfair account, in demo-mode [string]
    #
    # Example:
    # >> liveKey,delayKey = retrieveAppKeys('JFoI8GCmtv16qt/3EMgpKHy9+Kz1wDg8cHICezCskg=')
    # >>    liveKey = MlUFLfnJSUTBgUxE
    # >>    demoKey = oIxzLH5fyc0YPnYf


    ## Send data to betfair API via http:

    # define url to send data to:
    url = 'https://api.betfair.com/exchange/account/json-rpc/v1/'

    headers = {'X-Authentication': sessionKey, 'content-type': 'application/json'}
    content = '{"jsonrpc": "2.0", "method": "AccountAPING/v1.0/getDeveloperAppKeys"}'
    response = requests.post(url, params=content, headers=headers)

    demoKey = response.result[0].appVersions[0].applicationKey
    liveKey = response.result[0].appVersions[1].applicationKey

    return liveKey, demoKey


# TODO: This isn't working (anymore?). Can just use local saved api keys.
#sessionKey = betfairLogin('alpinechicken', 'ee')
#liveKey, demoKey = retrieveAppKeys(sessionKey)




import requests
import json
#import betfair as bf

def createAppKeys(sessionKey,appName):

    # function  createAppKeys(sessionKey,appName)
    #
    # creates app-keys in the betfair API for your account. Each account can
    # only create one app name, which has two associated keys (a live-key for
    # real bettign and a delay-key for demo mode). Subsequent calls to
    # "createAppKeys" will fail to produce anything new, but not return an
    # error.
    #
    # There is no need to save the created app-keys because they are stored on
    # betfair's servers and can be retreived any time once you have logged into
    # the betfair API with the "betfairLogin" function and obtained a
    # sessionKey to authenticate your identity.
    #
    # INPUTS:
    # sessionKey = API session key, required for all API interactions, obtained
    #              from the "betfairLogin" function [string]
    # appName = Name of your application, for example 'PythonAPIProgram' [string]
    #
    # OUTPUTS:
    # This function has no outputs - each betfair account can only create app
    # keys once, after which you can retrieve the app keys with the "retrieveAppKeys"
    # function.
    #
    # Example:
    # >> createAppKeys('JFoI8GCmtv16qt/3EMgpKHy9+Kz1wDg8cHICezCskg=','pythonApp')


    ## Send data to betfair API via http:

    # define url to send data to:
    url = 'https://api.betfair.com/exchange/account/json-rpc/v1/'

    # define http-request headers:
    headers =  {'X-Authentication': sessionKey, 'content-type': 'application/json'}


    # define the body of the http-request:
    content= {"jsonrpc": "2.0",
              "method": "AccountAPING/v1.0/createDeveloperAppKeys/",
              "params": {"appName":  appName}}

    # send data to url:
    response = requests.post(url, params=json.dumps(content), headers=headers)


    ## Read API response:

    return response


# TODO: This is not working. I think betfair has shut this down so you just have to get the app keys manually.

# sessionKey = bf.betfairLogin('alpinechicken', 'e')
# appKey = 'iw8UsiHCP1GSs213'
# marketIds = ["1.159907317"]
# appKey = createAppKeys(sessionKey=sessionKey, appName='alpinechickenbetfair')



import requests

def betfairLogout(sessionKey,appKey):

    # logs out of betfair API

    ## Send data to betfair API via http:

    # define url to send data to:
    url = 'https://identitysso.betfair.com/api/logout'
    headers = {'X-Authentication': sessionKey, 'X-Application': appKey, 'Accept': 'application/json'}
    content = '{"jsonrpc": "2.0", "method": "AccountAPING/v1.0/getDeveloperAppKeys"}'
    response = requests.post(url, params=content, headers=headers)
    return response.json()

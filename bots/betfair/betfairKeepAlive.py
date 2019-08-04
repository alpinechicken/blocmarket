import requests
#from betfair.betfairLogin import betfairLogin

def betfairKeepAlive(sessionKey,appKey):

    # keeps API session alive

    ## Send data to betfair API via http:

    # define url to send data to:
    url = 'https://identitysso.betfair.com/api/keepAlive'

    headers = {'X-Authentication': sessionKey, 'X-Application': appKey, 'Accept': 'application/json'}
    content = ''
    response = requests.post(url, params=content, headers=headers)

    return response.json()



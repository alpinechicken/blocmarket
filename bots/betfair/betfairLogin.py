import requests

def betfairLogin(username,password, appName):

    """
    % function sessionKey = betfairLogin(username,password)
    %
    % logs in to betfair and returns "SSOID" session key.
    % contains error-handling to detect incorrect user/pass details and network
    % communications errors.
    %
    % INPUTS:
    % username = betfair account username [string]
    % password = betfair account password [string]
    %
    % OUTPUTS:
    % sessionKey = API session key, required for all subsequent API
    %              interactions [string]
    %
    % Example:
    % >> sessionKey = betfairLogin(myUserName,myPassword, appName)
    % >>    sessionKey = JFoI8GCmtv16qt/3EMgpKHy9+Kz1wDg8cHICezCskg=
    %
    """

    url = 'https://identitysso.betfair.com/api/login/'
    headers = {'X-Application': appName, 'Accept': 'application/json'}
    content = 'username=' + username + '&password=' + password
    response = requests.post(url, params=content, headers=headers)
    sessionToken =  response.json()['token']
    return sessionToken




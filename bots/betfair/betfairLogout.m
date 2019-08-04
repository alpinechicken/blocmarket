function betfairLogout(sessionKey,appKey)

% logs out of betfair API

%% Send data to betfair API via http:

% define url to send data to:
url = ['https://identitysso.betfair.com/api/logout'];

% define http-request headers:
headersIn(1).name = 'X-Authentication';
headersIn(1).value = sessionKey;
headersIn(2).name = 'X-Application';
headersIn(2).value = appKey;
headersIn(3).name = 'Accept';
headersIn(3).value = 'application/json';

% define the body of the http-request:
body='';

% send data to url:
[output,extras] = urlread2(url,'POST',body ,headersIn);


function [liveKey,demoKey] = retrieveAppKeys(sessionKey)

% function retrieveAppKeys(sessionKey)
%
% retrieves previously creaed app-keys from your betfair API account. 
% 
% INPUTS:
% sessionKey = API session key, required for all API interactions, obtained 
%              from the "betfairLogin" function [string]
%
% OUTPUTS:
% liveKey  = Effectively a password to invoke betting operations through
%            the API with your betfair account [string]
% demoKey =  Effectively a password to invoke betting operations through
%            the API with your betfair account, in demo-mode [string]
%
% Example: 
% >> [liveKey,delayKey] = retrieveAppKeys('JFoI8GCmtv16qt/3EMgpKHy9+Kz1wDg8cHICezCskg=')
% >>    liveKey = MlUFLfnJSUTBgUxE
% >>    demoKey = oIxzLH5fyc0YPnYf


%% Send data to betfair API via http:

% define url to send data to:
url = ['https://api.betfair.com/exchange/account/json-rpc/v1/'];

% define http-request headers:
headersIn(1).name = 'X-Authentication';
headersIn(1).value = sessionKey;
headersIn(2).name = 'content-type';
headersIn(2).value = 'application/json';

% define the body of the http-request:
body=['{"jsonrpc": "2.0", "method": "AccountAPING/v1.0/getDeveloperAppKeys"}'];

% send data to url:
[output,extras] = urlread2(url,'POST',body ,headersIn);
assignin('base','output',output)
assignin('base','extras',extras)


%% Read API response:

% check if http communication had any errors (network communication issues):
if strcmp(extras.status.msg,'OK')==0
    error('Network communication failed. Try again later.')
end

% convert JSON data format into a Matlab-structure:
data = loadjson(output);
assignin('base','data',data);

% check for API errors:
if isfield(data,'error')
    error('API-exception. Check the sessionKey is correct and has not expired. Use betfairLogin() to create a new session-key.')
end

% if code reaches this line, there should be no errors and the key
% retrieval should have been successful

demoKey = data.result{1}.appVersions{1}.applicationKey;
liveKey = data.result{1}.appVersions{2}.applicationKey;







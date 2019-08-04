function createAppKeys(sessionKey,appName)

% function  createAppKeys(sessionKey,appName)
%
% creates app-keys in the betfair API for your account. Each account can
% only create one app name, which has two associated keys (a live-key for
% real bettign and a delay-key for demo mode). Subsequent calls to
% "createAppKeys" will fail to produce anything new, but not return an
% error.
%
% There is no need to save the created app-keys because they are stored on
% betfair's servers and can be retreived any time once you have logged into
% the betfair API with the "betfairLogin" function and obtained a
% sessionKey to authenticate your identity.
% 
% INPUTS:
% sessionKey = API session key, required for all API interactions, obtained 
%              from the "betfairLogin" function [string]
% appName = Name of your application, for example 'MatlabAPIProgram' [string] 
%
% OUTPUTS:
% This function has no outputs - each betfair account can only create app
% keys once, after which you can retrieve the app keys with the "retrieveAppKeys" 
% function.
%
% Example: 
% >> createAppKeys('JFoI8GCmtv16qt/3EMgpKHy9+Kz1wDg8cHICezCskg=','matlabApp')


%% Send data to betfair API via http:

% define url to send data to:
url = ['https://api.betfair.com/exchange/account/json-rpc/v1/'];

% define http-request headers:
headersIn(1).name = 'X-Authentication';
headersIn(1).value = sessionKey;
headersIn(2).name = 'content-type';
headersIn(2).value = 'application/json';

% define the body of the http-request:
body=['{"jsonrpc": "2.0", "method": "AccountAPING/v1.0/createDeveloperAppKeys/", "params": {"appName":"', appName, '"}, "id": 1}'];

% send data to url:
[output,extras] = urlread2(url,'POST',body ,headersIn);


%% Read API response:

% check if http communication had any errors (network communication issues):
if strcmp(extras.status.msg,'OK')==0
    error('Network communication failed. Try again later.')
end








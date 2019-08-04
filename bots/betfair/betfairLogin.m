function sessionKey = betfairLogin(username,password)

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
% >> sessionKey = betfairLogin('myUserName','myPassword')
% >>    sessionKey = JFoI8GCmtv16qt/3EMgpKHy9+Kz1wDg8cHICezCskg=
%

%% Send data to betfair API via http:

% define url to send data to:
url = ['https://identitysso.betfair.com/api/login'];

% define http-request headers:
headersIn(1).name = 'Content-Type';
headersIn(1).value = 'application/x-www-form-urlencoded';

% define the body of the http-request:
body = ['username=' , username , '&password=' , password , '&login=true&redirectMethod=POST&product=home.betfair.int&url=https://www.betfair.com/'];

% send data to url:
[output,extras] = urlread2(url,'POST',body ,headersIn);

%% Read API response:

% response data is hidden in an html form but returned as ascii-text. 

% first check if login details were correct:
if isempty(strfind(output,'<!DOCTYPE'))==0
    error('Invalid login details. Check username and password and try again.')
end

% check if http communication had any errors (network communication issues):
if strcmp(extras.status.msg,'OK')==0
    error('Network communication failed. Try again later.')
end

% if code gets to this point, login should have been successful. 

% read session tokens:
tokenLoc = strfind(output,'"productToken" value="');
bracketLoc = strfind(output,'="/>');
sessionKey = output(tokenLoc+22:bracketLoc);



function cancelStatus = cancelOrder(sessionKey,appKey,varargin)


% function cancelStatus = cancelOrder(sessionKey,appKey,varargin)
%
% Lists status of bet orders on the betfair exchange. All of the inputs listed below
% are cticical, i.e. if any of the parameters below are missing, the order
% will fail to execute.
%
% INPUTS:
% sessionKey = API session key, required for all API interactions, obtained
%              from the "betfairLogin" function [string]
%
% appKey =  Either the demo or live API application key, required for all
%           API interactions, obtained from the "retrievAppKeys" function
%           [string]
%
% varargin = list of input parameters & values, listed in format
%            'param1','value1','param2','value2' detailed below.
%
% parameters and values allowed are:
%
%      betId = ID of bet that you want to cancel
%
%      marketId = market Id to cancel bets from

%%      wallet = betfair wallet to use money from (there is an distinct
%               difference between Australian wallet bets and batfair
%               main-wallet events). The wallet definition for an event is
%               returned by the "listMarketCatalogue" function.
%
%  *** If 'betId' and 'marketId' parameters are not input, ALL open bets
%       will be cancelled ***
%
% OUTPUTS:
% orderStatus = cell array of structures whos fields contain order details
%
% Example:
% 
% % there are a few options for cancelling a single bet, all bets on a market,
% % or all bets on your whole account, all of which are listed below:
% 
% % use API cancelOrders function (https://api.developer.betfair.com/services/webapps/docs/display/1smk3cen4v3lu3yomq5qye0ni/cancelOrders)
% >> cancelStatus = cancelOrder(sessionKey,appKey,'betId',betId,'marketId',market1Id,'wallet',wallet)
% % read the cancelStatus.status field to check cancellation was successful:
% >> cancelStatus.status
% 
% % alternatively, to cancel all bets in a certain market, just enter the
% % 'marketId' parameter:
% >> cancelStatus_OneBetOnly = cancelOrder(sessionKey,appKey,'marketId',market1Id,'wallet',wallet)
% 
% % omit the 'marketId' and betId' parameters to calncel ALL bets:
% >> cancelStatus_ALL = cancelOrder(sessionKey,appKey,'wallet',wallet)
%
%




%% Set up request to sen to Betfair API via HTTP:


% define url to send data to:
urlAUS= ['https://api-au.betfair.com/exchange/betting/json-rpc/v1/'];
urlUK = ['https://api.betfair.com/exchange/betting/json-rpc/v1/'];

% define http-request headers:
headersIn(1).name = 'X-Authentication';
headersIn(1).value = sessionKey;
headersIn(2).name = 'X-Application';
headersIn(2).value = appKey;
headersIn(3).name = 'content-type';
headersIn(3).value = 'application/json';


%% Create and check formatting of the http request body:


% detect if parameter is missing a value
nVars = numel(varargin);
if nVars>0
    if floor(nVars/2)-ceil(nVars/2)~=0
        error('One of the input parameters is missing a value. Pairs must be entered in the form ''param1'',''val1'',''param2'',''val2'', etc. ')
    end
end

bodyFields =struct('betId','',...
    'marketId','',...
    'wallet','');

% boolean for critical fiields existing:
foundbetId = 0;
foundWallet = 0;

% go through all input parameters and modify the order body fields
if nargin>2
    for k= 1 : 2 : size(varargin,2)
        
        
        % find critical fields:
        if strcmp(varargin{k},'marketId') || strcmp(varargin{k},'marketIds')
            varargin{k} = 'marketId';
            foundMarketId=1;
        end
        
        if strcmp(varargin{k},'wallet')
            foundWallet=1;
            wallet = varargin{k+1};
            continue
        end
        
        
        %%
        
        if isfield(bodyFields,varargin{k})
            
            
            % convert numeric inputs to strings to aid the "eval" statement
            % later
            if isnumeric(varargin{k+1})
                if numel(varargin{k+1})>1
                    % block of code below converts numeric [1, 2] to
                    % ["1","2"] (JSON format):
                    num = varargin{k+1};
                    str = num2str(num(:)','"%1d",');
                    str(end)=[]; % removes last comma
                    str = ['' str ''];
                    varargin{k+1}=str;
                else
                    varargin{k+1} = ['"' num2str(varargin{k+1},'%1d') '"'];
                end
            end
            
            % add input parameter and value to the body of the http request:
            if ischar(varargin{k})
                eval(['bodyStruct.' varargin{k} '=''' varargin{k+1} ''' ;']);
            end
        elseif strcmp(varargin{k},'marketIds')==0 % special case with marketId/marketIds must be ignored, but if found another unlisted variable, do this:
            error(['Unkown parameter "' varargin{k} '". Only allowed fields are: marketId,orderType,selectionId,side,wallet,price,size,persistenceType']);
        end
    end
end


if foundWallet == 0
    error('"wallet" must be an input parameter to the function "cancelOrder"')
end

% wrap all parameters into the market-searching params:
if exist('bodyStruct')
    params = bodyStruct;
    params = savejson(params);
    %som e tricky JSON formatting:
    params = strrep(params,'\','');
    params = strrep(params,'"[','[');
    params = strrep(params,']"',']');
    params = strrep(params,'""','"');
    params = strrep(params,'""','"');
    params = strrep(params,'"{','{');
    params = strrep(params,'}"','}');
    assignin('base','params',params);
else
    bodyStruct.empty = 1;
end
assignin('base','bodyStruct',bodyStruct);




%body =





%%

if isempty(strfind(wallet, 'AUS'))==0
    url = urlAUS;
else
    url = urlUK;
end



if isfield(bodyStruct,'betId')==1 && isfield(bodyStruct,'marketId')==0
    if strcmp(bodyStruct.betId,'ALL')==1
        body = ['[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/cancelOrders", "params": {"marketId":"' bodyStruct.marketId '"}, "id": 1}]'];
        111
    else
        body = ['[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/cancelOrders", "params": {"instructions":[{"betId":"' bodyStruct.betId '","sizeReduction":null}]}, "id": 1}]'];
        222
    end
elseif isfield(bodyStruct,'betId')==0 && isfield(bodyStruct,'marketId')==1
    body = ['[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/cancelOrders", "params": {"marketId":"' bodyStruct.marketId '"}, "id": 1}]'];
    333
elseif isfield(bodyStruct,'betId')==1 && isfield(bodyStruct,'marketId')==1
    body = ['[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/cancelOrders", "params": {"marketId":"' bodyStruct.marketId '"}, "id": 1}]'];
    444
elseif isfield(bodyStruct,'empty')==1
    body = ['[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/cancelOrders", "params": {}, "id": 1}]'];
    
end
assignin('base','body',body)

%% send data to url:
[output,extras] = urlread2(url,'POST',body ,headersIn);
assignin('base','output',output)
assignin('base','extras',extras)




%% Read API response:

% check if http communication had any errors (network communication issues):
if strcmp(extras.status.msg,'OK')==0
    error(extras.status.msg)
end

% convert JSON data format into a Matlab-structure:
data = loadjson(output);
assignin('base','data',data);

% check for API errors:
if isfield(data,'error')
    error('API-exception.')
end

% if code reaches this line, there should be no errors and the key
% retrieval should have been successful

if numel(data)==1
    cancelStatus = data{1}.result';
else
    cancelStatus = data.result';
end





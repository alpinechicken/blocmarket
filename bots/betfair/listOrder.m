function orderStatus = listOrder(sessionKey,appKey,varargin)


% function listOrder(sessionKey,appKey,varargin)
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
%      betId = bet Id that you want to check. If set to "ALL", all current
%      bets will be returned
%
%      marketId = market Id to retrieve bets from (optional)
%
%      wallet = betfair wallet to use money from (there is an distinct
%               difference between Australian wallet bets and batfair
%               main-wallet events). The wallet definition for an event is
%               returned by the "listMarketCatalogue" function.
%
%
% OUTPUTS:
% orderStatus = cell array of structures whos fields contain order details
%
% Example:
% % get the previous bet status with the "listOrder" function
% >> orderStatus = listOrder(sessionKey,appKey,'betId',betId,'wallet',wallet)
% %
% % It is important to look at the "sizeMatched" field of the structure returned
% % from "listOrder". If zero, the bet is unmatched, and if lss than the
% % original stake size, the bet is only partially matched. 
% %
% % another option is to list all open bets by setting the 'betId parmeter to 'ALL':
% >>allOrderStatuses = listOrder(sessionKey,appKey,'betId','ALL','wallet',wallet)





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
    error('"wallet" must be an input parameter to the function "listOrder"')
end


% wrap all parameters into the market-searching params:
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



%body =

assignin('base','bodyStruct',bodyStruct);
assignin('base','params',params);



%%

if isempty(strfind(wallet, 'AUS'))==0
    url = urlAUS;
else
    url = urlUK;
end

if isfield(bodyStruct,'betId')==1 && isfield(bodyStruct,'marketId')==0
    if strcmp(bodyStruct.betId,'ALL')==1
        body = ['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listCurrentOrders", "params": {"placedDateRange":{}, "orderProjection":"ALL", "recordCount":1000 },  "id":1}'   ];
    else
        body = ['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listCurrentOrders", "params": {"betIds":["' bodyStruct.betId '"], "placedDateRange":{} },  "id":1}'   ];
 
    end
elseif isfield(bodyStruct,'betId')==0 && isfield(bodyStruct,'marketId')==1
    body = ['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listCurrentOrders", "params": {"marketIds":["' bodyStruct.marketId '"], "placedDateRange":{} },  "id":1}'   ];
elseif isfield(bodyStruct,'betId')==1 && isfield(bodyStruct,'marketId')==1
    body = ['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listCurrentOrders", "params": {"betIds":["' bodyStruct.betId '"], "marketIds":["' bodyStruct.marketId '"], "placedDateRange":{} },  "id":1}'   ];
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

    
orderStatus = data.result.currentOrders';






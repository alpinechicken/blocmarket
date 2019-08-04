function orderStatus = placeOrder(sessionKey,appKey,varargin)


% function placeOrder(sessionKey,appKey,varargin)
%
% Places bet orders on the betfair exchange. All of the inputs listed below
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
%      marketId = The ID number for the betfair market that you want to
%                 place an order on, e.g. "1.119725155" (obtained from the
%                 "listMarketCatalogue" function. Without a marketId, a bet
%                 cannot be placed.
%
%       orderType = type of order to place. Allowable values are 'LIMIT',
%       'LIMIT_ON_CLOSE', 'MARKET_ON_CLOSE'
%
%       selectionId = The specfic Id of a the outcome you want to bet on,
%                     e.g. "7414709", obtained from the "listMarketBook"
%                     function.
%
%       side = Direction to bet. Must be either 'BACK' or 'LAY'
%
%       wallet = betfair wallet to use money from (there is an distinct
%                difference between Australian wallet bets and batfair
%                main-wallet events). The wallet definition for an event is
%                returned by the "listMarketCatalogue" function.
%
%       price = Decimal odds at which bet should be placed. If the
%               odds-price does not agree with the betfair price increments
%               rounding below, it will b =e rounded to the nearest
%               alowable value.
%               Price       Increment
%               1.01 ? 2	0.01
%               2 ? 3       0.02
%               3 ? 4       0.05
%               4 ? 6       0.1
%               6 ? 10      0.2
%               10 ? 20     0.5
%               20 ? 30     1
%               30 ? 50     2
%               50 ? 100	5
%               100 ? 1000	10
%
%       size = Size of bet-take in local currency.
%
%       persistenceType = Determines what happens to your bet if unmatched
%                         at the time when the event turns "in-play" (starts).
%                         Allowable values are:
%                         'LAPSE' ? Lapse the order when the market is
%                                    turned in-play
%                         'PERSIST' ? Persist the order to in-play. The
%                                      bet will be place automatically into
%                                      the in-play market at the start of
%                                      the event.
%                         'MARKET_ON_CLOSE' ? Put the order into the
%                                             auction (SP) at turn-in-play.
%
%
%
% OUTPUTS:
% orderStatus = structure whos fields contain order details
%
% Example:
%
% % To place a back bet with market details obtained in the demo script that lapses (cancels) if unmatched at the start of a game:
% >> orderStatus = placeOrder(sessionKey,appKey,'marketId',market1Id,'selectionId',outcome{1}.selectionId,'orderType','LIMIT','side','BACK','wallet',wallet,'price',oddsToPlace,'size',10,'persistenceType','LAPSE')
%
% % The 'LAPSE' persistenceType parameter causes the bet to be cancelled when
% % the game turns in-play (when the game starts) if it has not been matched
% % by somebody else in the market placing a lay-bet by that time. 
%
% % Check the response from the betting operation:
% >> orderStatus.result
%
% % If succesfully placed, get the betId: 
% >> if strcmp(orderStatus.result.status,'SUCCESS')
% >>    orderStatus.result.instructionReports{1} % lists all fields of the bet order status in the main matlab command window
% >>    betId = orderStatus.result.instructionReports{1}.betId
% >> end
%
% % check the response from the betting operation:
% >> orderStatus.result
    



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

bodyFields =struct('marketId','',...
    'orderType','',...
    'selectionId','',...
    'side','',...
    'wallet','',...
    'price','',...
    'size','',...
    'persistenceType','');

% boolean for critical fiields existing:
foundMarketId = 0;
foundOrderType = 0;
foundSelectionId = 0;
foundSide = 0;
foundWallet = 0;
foundPrice = 0;
fpundSize = 0;
foundPersistenceType = 0;


% go through all input parameters and modify the order body fields
if nargin>2
    for k= 1 : 2 : size(varargin,2)
        
        
        % find critical fields:
        if strcmp(varargin{k},'marketId') || strcmp(varargin{k},'marketIds')
            varargin{k} = 'marketId';
            foundMarketId=1;
            
        end
        
        if strcmp(varargin{k},'orderType')
            foundOrderType=1;
            
        end
        
         if strcmp(varargin{k},'persistenceType')
            foundPersistenceType=1;
        end
        
        if strcmp(varargin{k},'selectionId')
            foundSelectionId=1;
        end
        if strcmp(varargin{k},'side')
            foundSide=1;
           % continue
        end
        %%
        if strcmp(varargin{k},'price')
            foundPrice=1;
            price = varargin{k+1};
            % round it to allowable value!
            if ischar(price)
                price=str2num(price);
            end
            
            % rounding:
            if price<=2
                price = round(price*100)/100;
            elseif price<=3
                price = round(price*50)/50;
            elseif price<=4
                price = round(price*20)/20;
            elseif price<=6
                price = round(price*10)/10;
            elseif price<=10
                price = round(price*5)/5;
            elseif price<=20
                price = round(price*2)/2;
            elseif price<=30
                price = round(price);
            elseif price<=50
                price = round(price*0.5)/0.5;
            elseif price<=100
                price = round(price*0.2)/0.2;
            elseif price<=1000
                price = round(price*0.1)/0.1;
            end
            
            if isnumeric(price)
                price=num2str(price);
            end
            
           % continue
        end
        
        if strcmp(varargin{k},'size')
            foundSize=1;
            betSize= varargin{k+1};
            % round it to allowable decimation!
            if ischar(betSize)
                betSize=str2num(betSize);
            end
           betSize = round(betSize*100)/100;
            if isnumeric(betSize)
                betSize=num2str(betSize);
            end
            
           % continue
        end
        
        if strcmp(varargin{k},'persistenceType')
            foundpersistenceType=1;
            persistenceType = varargin{k+1};
            if strcmp(varargin{k+1},'LAPSE')==0 && strcmp(varargin{k+1},'PERSIST') && strcmp(varargin{k+1},'MARKET_ON_CLOSE')==0
                error('"side" parameter must be ''LAPSE'', ''PERSIST'' or ''MARKET_ON_CLOSE''')
            end
           
           % continue
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
            
            % Some checks:
            
            % parameters that can only be a certain string value:
            if strcmp(varargin{k},'orderType')
                %  only doing the "priceData" component, others seem
                %  redundant
                if strcmp(varargin{k+1},'LIMIT')==0 && strcmp(varargin{k+1},'LIMIT_ON_CLOSE')==0 && ...
                        strcmp(varargin{k+1},'MARKET_ON_CLOSE')==0
                    error('"orderType" parameter must be ''LIMIT'', ''LIMIT_ON_CLOSE'', ''MARKET_ON_CLOSE''')
                end
            end
            
            if strcmp(varargin{k},'side')
                if strcmp(varargin{k+1},'BACK')==0 && strcmp(varargin{k+1},'LAY')==0
                    error('"side" parameter must be ''BACK'' or ''LAY''')
                end
            end
            
            
            %varargin{k+1} = ['["' varargin{k+1} '"]'];
            
            % add input parameter and value to the body of the http request:
            if ischar(varargin{k})
                eval(['bodyStruct.' varargin{k} '=''' varargin{k+1} ''' ;']);
            end
        elseif strcmp(varargin{k},'marketIds')==0 % special case with marketId/marketIds must be ignored, but if found another unlisted variable, do this:
            error(['Unkown parameter "' varargin{k} '". Only allowed fields are: marketId,orderType,selectionId,side,wallet,price,size,persistenceType']);
        end
    end
end



% check some important parameters:
if foundMarketId == 0
    error('"marketId" must be an input parameter to the function "placeOrder"')
end

if foundOrderType == 0
    error('"orderType" must be an input parameter to the function "placeOrder"')
end

if foundSelectionId == 0
    error('"selectionId" must be an input parameter to the function "placeOrder"')
end

if foundSide == 0
    error('"side" must be an input parameter to the function "placeOrder"')
end

if foundWallet == 0
    error('"wallet" must be an input parameter to the function "placeOrder"')
end

if foundPrice == 0
    error('"price" must be an input parameter to the function "placeOrder"')
end

if foundSize == 0
    error('"size" must be an input parameter to the function "placeOrder"')
end

if foundPersistenceType == 0
    error('"persistenceType" must be an input parameter to the function "placeOrder"')
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

% define the body of the http-request:
if isempty(strfind(wallet, 'AUS'))==0
    url = urlAUS;
else
    url = urlUK;
end
body = ['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/placeOrders", "id":"1", "params": {"marketId":"' bodyStruct.marketId '", "instructions":[{"orderType":"' bodyStruct.orderType '", "selectionId":' bodyStruct.selectionId ',"handicap":0.0, "side":"' bodyStruct.side '", "limitOrder":{"size":' betSize ', "price":' price  ', "persistenceType":"' bodyStruct.persistenceType  '"}    }], "customerRef":"1"} }'];


body = strrep(body,sprintf('\n'),''); %removes newline fron JSON string (http://stackoverflow.com/questions/11189339/ignore-n-newline-characters)
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

orderStatus = data;






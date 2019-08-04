function [marketBook] = listMarketBook(sessionKey,appKey,varargin)

% function [marketBook] = listMarketBook(sessionKey,appKey,varargin)
%
% Returns a structure with fields describing market details, incuding 
% available odds and backed/unbacked monetary volumes.
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
%      marketId = One or more market ids. The number of markets returned 
%                 depends on the amount of data you request via the price projection.
%
%      wallet = 'UK' or 'AUS' - this is e critical parameter that tells
%               betfair if the market associates withyour betfair  main
%               wallet or australian wallet
%
%      priceProjection = The projection of price data you want to receive 
%                        in the response. Allowable values are 'SP_AVAILABLE', 
%                        'SP_TRADED', 'EX_BEST_OFFERS', 'EX_ALL_OFFERS', 
%                        or 'EX_TRADED'.
%
%      orderProjection = The orders you want to receive in the response.
%                        Allowable values are 'ALL', 'EXECUTABLE',
%                        'EXECUTION_COMPLETE'.
%
%      matchProjection = If you ask for orders, specifies the representation 
%                        of matches. Allowable values are 'NO_ROLLUP', 
%                        'ROLLED_UP_BY_PRICE', 'ROLLED_UP_BY_AVGE_PRICE'.
%
%      currencyCode = A Betfair standard currency code. If not specified, 
%                     the default currency code is used. Allowable values 
%                     are 'GBP', 'EUR', 'US$', 'HK$', 'AUD', 'CAD', 'DKK',
%                     'NOK', 'SEK', 'SGD'')
%
%      locale = The language used for the response. If not specified, the default is returned.
%
%
% OUTPUTS:
% marketBook = Structure containing market details
%
% Example:
% To list the best offer exchange odds on a market found with the
% "listMarketCataloguue" function: 
% [marketBook] = listMarketBook(sessionKey,appKey,'marketId',market1Id,'priceProjection','EX_BEST_OFFERS','wallet',wallet)
% 
% % I recommend browsing through the "marketBook" structure variable in the
% % main Matlab window, so you can find specific components that you are
% % looking for, although some examples are given below. 
% %
% % The command 
% % >> openvar('marketBook')
% % will open the "marketBook" structure in the Matlab variable-Editor so you
% % can browse it manually.
% 
% % get the exchange price available to back on the first game outcome:
% bestPrice1 = marketBook.runners{1}.ex.availableToBack{1}.price
% % also get the amount of money available to back at the above price:
% bestSize1 = marketBook.runners{1}.ex.availableToBack{1}.size
% 
% % get the exchange price available to back on the 2nd game outcome:
% bestPrice2 = marketBook.runners{2}.ex.availableToBack{1}.price
% % also get the amount of money available to back at the above price:
% bestSize2 = marketBook.runners{2}.ex.availableToBack{1}.size
% 
% % you can also see the 2nd-best price available for the above option by
% % changing the index of the "availableToBack" structure field:
% secondBestPrice2 = marketBook.runners{2}.ex.availableToBack{2}.price
% secondBestSize2 = marketBook.runners{2}.ex.availableToBack{2}.size
% 
% 
% % there are also availableToLay and tradedVolume fields, which will list themselves in the matlab command window from the command:
% marketBook.runners{1}.ex




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

bodyFields =struct('marketIds','',...
    'priceProjection','',...
    'orderProjection','',...
    'matchProjection','',...
    'currencyCode','',...
    'locale','');

% boolean for critical fiields existing:
foundMarketIds = 0;
foundWallet = 0;
foundPriceProjection = 0;


% go through all input parameters and modify the order body fields
if nargin>2
    for k= 1 : 2 : size(varargin,2)
        
        
        % find critical fields:
        if strcmp(varargin{k},'marketId') || strcmp(varargin{k},'marketIds')
            varargin{k} = 'marketIds';
            foundMarketIds=1;
        end
        
        if strcmp(varargin{k},'wallet')
            varargin{k} = 'marketIds';
            foundWallet=1;
            wallet = varargin{k+1};
            continue
        end
        
        
        if isfield(bodyFields,varargin{k})
            
            
            % Some checks:
            
            % parameters that can only be a certain string value:
            if strcmp(varargin{k},'priceProjection')
                %  only doing the "priceData" component, others seem
                %  redundant
                if strcmp(varargin{k+1},'SP_AVAILABLE')==0 && strcmp(varargin{k+1},'SP_TRADED')==0 && ...
                        strcmp(varargin{k+1},'EX_BEST_OFFERS')==0 && strcmp(varargin{k+1},'EX_ALL_OFFERS')==0 && ...
                        strcmp(varargin{k+1},'EX_TRADED')==0
                    error('"priceProjection" parameter must be ''SP_AVAILABLE'', ''SP_TRADED'', ''EX_BEST_OFFERS'', ''EX_ALL_OFFERS'', or ''EX_TRADED''')
                end
                foundPriceProjection = k; % give the index rather than a boolean "one", so we can find the string parameter and edit it later
            end
            
            if strcmp(varargin{k},'orderProjection')
                if strcmp(varargin{k+1},'ALL')==0 && strcmp(varargin{k+1},'EXECUTABLE')==0 && strcmp(varargin{k+1},'EXECUTION_COMPLETE')==0
                    error('"orderProjection" parameter must be ''ALL'', ''EXECUTABLE'', ''EXECUTION_COMPLETE''')
                end
            end
            
            if strcmp(varargin{k},'matchProjection')
                if strcmp(varargin{k+1},'NO_ROLLUP')==0 && strcmp(varargin{k+1},'ROLLED_UP_BY_PRICE')==0 && strcmp(varargin{k+1},'ROLLED_UP_BY_AVGE_PRICE')==0
                    error('"matchProjection" parameter must be ''NO_ROLLUP'', ''ROLLED_UP_BY_PRICE'', ''ROLLED_UP_BY_AVGE_PRICE''')
                end
            end
            
            if strcmp(varargin{k},'currencyCode')
                if strcmp(varargin{k+1},'GBP')==0 && strcmp(varargin{k+1},'EUR')==0 && strcmp(varargin{k+1},'US$')==0  && strcmp(varargin{k+1},'HK$')==0 && strcmp(varargin{k+1},'AUD')==0 && strcmp(varargin{k+1},'CAD')==0 && strcmp(varargin{k+1},'DKK')==0 && strcmp(varargin{k+1},'NOK')==0 && strcmp(varargin{k+1},'SEK')==0 && strcmp(varargin{k+1},'SGD')==0
                    error('"currencyCode" parameter must be ''GBP'', ''EUR'', ''US$'', ''HK$'', ''AUD'', ''CAD'', ''DKK'', ''NOK'', ''SEK'', ''SGD''')
                end
            end
            
            
            varargin{k+1} = ['["' varargin{k+1} '"]'];
            
            % add input parameter and value to the body of the http request:
            if ischar(varargin{k})
                eval(['bodyStruct.' varargin{k} '=''' varargin{k+1} ''' ;']);
            end
        else
            error(['Unkown parameter "' varargin{k} '". Only allowed fields are: marketIds,priceProjection,orderProjection,matchProjection,currencyCode,locale'])
        end
    end
end



% check some important parameters:
if foundMarketIds == 0
    error('"marketId" must be an input parameter to the function "listMarketBook"')
end

if foundWallet == 0
    error('"wallet" must be an input parameter to the function "listMarketBook"')
end

if foundPriceProjection == 0
    % not necessarily an error, only the price data will not be returned!
else
    % format it! (needs extra curly brackets)
    string = varargin{foundPriceProjection+1};
    string = ['{"priceData":' string '}'];
     varargin{foundPriceProjection+1} = string;
      eval(['bodyStruct.' varargin{foundPriceProjection} '=''' varargin{foundPriceProjection+1} ''' ;']);
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
if isempty(strfind(wallet, 'Aus'))==0
    url = urlAUS;
else
    url = urlUK;
end

%  "SportsAPING/v1.0/listMarketBook", "params": {"marketIds":["' & $marketID & '"],"priceProjection":{"priceData":["EX_BEST_OFFERS"]} }, "id": 1}'
%body=['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketBook", "params":',  params(1:end-2), ',"maxResults":' maxResults ',"marketProjection":["COMPETITION","EVENT","EVENT_TYPE","MARKET_DESCRIPTION","RUNNER_DESCRIPTION","RUNNER_METADATA","MARKET_START_TIME"]}, "id": 1}'];


body = ['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketBook", ' params(2:end-2), ', "id": 1}'];

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
    error('API-exception. Check the sessionKey is correct and has not expired. Use betfairLogin() to create a new session-key.')
end

% if code reaches this line, there should be no errors and the key
% retrieval should have been successful

marketBook = data.result{1}';





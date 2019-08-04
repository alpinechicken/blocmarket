function [marketList] = listMarketCatalogue(sessionKey,appKey,varargin)

% function [marketList] = listMarketCatalogue(sessionKey,appKey,'param1','value1','param2','value2'...)
%
% Returns a cell-array containing available markets and details of those
% markets. Each element of the returned cell-array contains a structure
% with fields describing market details.
%
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
%      maxResults = maximum number of markets to return in list. Defaults
%      to 10 if undefined.
%
%      textQuery = Restrict markets by any text associated with the market
%                  such as the Name, Event, Competition, etc. You can
%                  include a wildcard (*) character as long as it is not
%                  the first character.
%
%      eventTypeIds = Restrict markets by event type associated with the
%                     market. (i.e., Football, Hockey, etc)
%
%      eventIds = Restrict markets by the event id associated with the
%                 market. [number]
%                 (1=Soccer, 2=Tennis, 3=Golf, 4=Cricket, 5=Rugby Union,
%                  6=Boxing, 7=Horse Racing, 8=Motor Sport, 9=Special Bets,
%                  468328=Handball, 451485=Winter Sports, 7522=Basketball,
%                  1477=Rugby League, 4339=Greyhound Racing, 19=Politics,
%                  6231=Financial Bets, 99817=Volleyball, 998918=Bowls,
%                  998919=Bandy, 3503=Darts, 72382=Pool, 6422=Snooker,
%                  6423=American Football, 7511=Baseball.
%
%      competitionIds = Restrict markets by the competitions associated
%                       with the market.
%
%      marketIds = Restrict markets by the market id associated with the
%                  market.
%
%      venues = Restrict markets by the venue associated with the market.
%               Currently only Horse Racing markets have venues.
%
%      bspOnly = Restrict to bsp markets only, if True or non-bsp markets
%                if False. If not specified then returns both BSP and
%                non-BSP markets.
%
%      turnInPlayEnabled = Restrict to markets that will turn in play if
%                          True or will not turn in play if false. If not
%                          specified, returns both.
%
%      inPlayOnly = Restrict to markets that are currently in play if True
%                   or are not currently in play if false. If not specified,
%                   returns both.
%
%      marketBettingTypes = Restrict to markets that match the betting type
%                           of the market (i.e. Odds, Asian Handicap
%                           Singles, or Asian Handicap Doubles
%
%      marketCountries = Restrict to markets that are in the specified
%                        country or countries, e.g. 'UK,AUS' for just
%                        British and Australian events. Full List of
%                        country codes is at:
%                        https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
%
%      marketTypeCodes = Restrict to markets that match the type of the
%                        market (i.e., MATCH_ODDS, HALF_TIME_SCORE). You
%                        should use this instead of relying on the market
%                        name as the market type codes are the same in all
%                        locales [e.g. 'MATCH','WIN','PLACE']. See list of
%                        market types in marketTypeCodes.txt. Most popular
%                        options are 'WIN','WINNER','MATCH'.
%
%       marketStartTime = Restrict to markets with a market start time
%                         before or after the specified date
%
%       withOrders = Restrict to markets that I have one or more orders in
%                    these status.
%
%
% OUTPUTS:
% marketList = A cell-array, where each element is a seperate market. Each
%              cell contains a structure containing many market details.
%
% Example:
% % to get up to 20 Rugby League final score (match-odds) markets:
% >>[marketList] = listMarketCatalogue(sessionKey,appKey,'eventTypeIds',1477,'marketBettingTypes','ODDS','marketTypeCodes','MATCH_ODDS','maxResults',20);


%% Set up request to sen to Betfair API via HTTP:

% define url to send data to:
url = ['https://api.betfair.com/exchange/betting/json-rpc/v1'];

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

bodyFields =struct('textquery','',...
    'eventTypeIds','',...
    'eventIds','',...
    'competitionIds','',...
    'marketIds','',...
    'venues','',...
    'bspOnly','',...
    'turnInPlayEnabled','',...
    'inPlayOnly','',...
    'marketBettingTypes','',...
    'marketTypeCodes','',...
    'marketCountries','',...
    'marketStartTime','',...
    'withOrders','');

% boolean for critical fiields existing:
foundMaxResults = 0;

% go through all input parameters and modify the order body fields
if nargin>2
    for k= 1 : 2 : size(varargin,2)
        
        
        % find critical fields:
        if strcmp(varargin{k},'maxResults')
            foundMaxResults=1;
            if isnumeric(varargin{k+1})
                if numel(varargin{k+1})>1
                   error('max results must be a single value');
                else
                    maxResults = num2str(varargin{k+1},'"%1d"');
                end
            elseif ischar(maxResults)
                maxResults = ['" varargin{k} "'];
            end
            continue
        end
        
        
        if isfield(bodyFields,varargin{k})
            
            
            % time filter has it's own special format:
            if strcmp(varargin{k},'marketStartTime')
                eval(['bodyStruct.' varargin{k} '=''' varargin{k+1} ''' ;']);
               continue
            end
            
            % if a number in string format, convert to a numeric array,
            % which is formatted into JSON in the next "if" loop:
            if ischar(varargin{k+1})==1 && isempty(str2num(varargin{k+1}))==0
                varargin{k+1} = str2num(varargin{k+1});
            end
            
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
            % parameters that can only be boolean:
            if strcmp(varargin{k},'bspOnly')
                if strcmp(varargin{k+1},'true')==0 && strcmp(varargin{k+1},'false')==0
                    error('"bspOnly" parameter, must be ''true'' or ''false''')
                end
            end
            if strcmp(varargin{k},'turnInPlayEnabled')
                if strcmp(varargin{k+1},'true')==0 && strcmp(varargin{k+1},'false')==0
                    error('"turnInPlayEnabled" parameter must be ''true'' or ''false''')
                end
            end
            if strcmp(varargin{k},'inPlayOnly')
                if strcmp(varargin{k+1},'true')==0 && strcmp(varargin{k+1},'false')==0
                    error('"inPlayOnly" parameter must be ''true'' or ''false''')
                end
            end
            
            % parameters that can only be a certain string value:
            if strcmp(varargin{k},'marketBettingTypes')
                
                if strcmp(varargin{k+1},'ODDS')==0 && strcmp(varargin{k+1},'LINE')==0 && ...
                        strcmp(varargin{k+1},'RANGE')==0 && strcmp(varargin{k+1},'ASIAN_HANDICAP_DOUBLE_LINE')==0 && ...
                        strcmp(varargin{k+1},'ASIAN_HANDICAP_SINGLE_LINE')==0 && strcmp(varargin{k+1},'FIXED_ODDS')==0
                    error('"marketBettingTypes" parameter must be ''ODDS'', ''LINE'', ''RANGE'', ''ASIAN_HANDICAP_DOUBLE_LINE'', ''ASIAN_HANDICAP_SINGLE_LINE'' or ''FIXED_ODDS''')
                end
            end
            
            if strcmp(varargin{k},'marketTypeCodes')
%                 if strcmp(varargin{k+1},'EXECUTION_COMPLETE')==0 && strcmp(varargin{k+1},'EXECUTABLE')==0
%                     error('"marketTypeCodes" parameter must be ''EXECUTION_COMPLETE'', ''EXECUTABLE''')
%                 end
            end
            
            if strcmp(varargin{k},'withOrders')
                if strcmp(varargin{k+1},'EXECUTION_COMPLETE')==0 && strcmp(varargin{k+1},'EXECUTABLE')==0
                    error('"withOrders" parameter must be ''EXECUTION_COMPLETE'', ''EXECUTABLE''')
                end
            end
            
            
            varargin{k+1} = ['["' varargin{k+1} '"]'];
            
            % add input parameter and value to the body of the http request:
            if ischar(varargin{k})
                eval(['bodyStruct.' varargin{k} '=''' varargin{k+1} ''' ;']);
            end
        else
            error(['Unkown parameter "' varargin{k} '". Only allowed fields are: textquery,eventTypeIds,eventIds,competitionIds,marketIds,venues,bspOnly,turnInPlayEnabled,inPlayOnly,marketBettingTypes,marketCountries,marketStartTime,withOrders'])
        end
    end
end

% wrap all parameters into the market-searching filter:
filter = bodyStruct;
filter = savejson(filter);
%som e tricky JSON formatting:
filter = strrep(filter,'\','');
filter = strrep(filter,'"[','[');
filter = strrep(filter,']"',']');
filter = strrep(filter,'""','"');
filter = strrep(filter,'""','"');
filter = strrep(filter,'"{','{');
filter = strrep(filter,'}"','}');



%body = 

assignin('base','bodyStruct',bodyStruct);
assignin('base','filter',filter);


% add default maxResults value of 10 if undefined. (maxResults is a
% critical variable, the function cannot work without it)
if foundMaxResults == 0
    maxResults='"10"';
end




%%

% define the body of the http-request:
body=['{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketCatalogue", "params":',  filter(1:end-2), ',"maxResults":' maxResults ',"marketProjection":["COMPETITION","EVENT","EVENT_TYPE","MARKET_DESCRIPTION","RUNNER_DESCRIPTION","RUNNER_METADATA","MARKET_START_TIME"]}, "id": 1}'];
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

marketList = data.result';





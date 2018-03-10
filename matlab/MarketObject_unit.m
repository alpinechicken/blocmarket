classdef MarketObject_unit < handle
    % Version of market object  that only allows q=1 or q=-1
    
    % tradeBranchId:
    %           1 = Primary - default (trade initially in order book)
    %           2 = Offset (offset a primary trade => signature from primary)
    %           3 = Match (matched version of primary trade => signature from offset)
    
    % Market object with simplified tables and mock signatures.
    
    properties (SetAccess=private)
        % Table with users and public key for signatures
        userTable = table([], {}, 'VariableNames', {'traderId',...
            'verifyKey'});
        % Order book for all trades, including including order book,
        % matched, and linked trades (offsets, partials, etc)
        orderBook = table([], [], [], [], [], [], [], [], {}, {},...
            'VariableNames',...
            {'tradeRootId', 'tradeBranchId', 'isMatched', 'price',...
            'quantity', 'marketRootId', 'marketBranchId', 'traderId',...
            'signatureMsg', 'signature'});
        % Cache order book (trades can be promoted to the order book)
        cacheBook = table([], [], [], [], [], [], [], [], {}, {},...
            'VariableNames',...
            {'tradeRootId', 'tradeBranchId', 'isMatched', 'price',...
            'quantity', 'marketRootId', 'marketBranchId', 'traderId',...
            'signatureMsg', 'signature'});
        % Market table with minimum and maximum of each market.
        marketTable = table([], [], [], [], [], {}, {}, 'VariableNames',...
            {'marketRootId', 'marketBranchId', 'marketMin', 'marketMax',...
            'traderId', 'signatureMsg', 'signature'});
        % TODO: collateral only for trader 0
        COLLATERAL_LIMIT = -100;
        
    end % Properties
    
    methods (Access = public) % Construct and create users/market/trade
        
        % MarketObject (constructor)
        
        % Create functions:
        % createUser
        % createMarket
        % createTrade
        
        function this = MarketObject(varargin)
            % Constructor
        end  % MarketObject
        
        function this = createUser(this, inputStruct)
            % Create a new row in this.userTable
            % e.g. mo.createUser('verifyKey', 'a')
            
            % TODO: restrict createUser in some way
            this.struct2var(inputStruct);
            
            % Number of users in table
            maxTraderId = height(this.userTable);
            % Add new user if not already in table
            if ~ismember(verifyKey, this.userTable.verifyKey)
                traderId = maxTraderId + 1;
                newUser = table(traderId, {verifyKey}, 'VariableNames',...
                    {'traderId', 'verifyKey'});
                this.userTable = vertcat(this.userTable, newUser);
                disp(['traderId:' num2str(traderId)])
            else
                disp('Verify key already exists');
            end
        end % createUser
        
        function this = createMarket(this, inputStruct)
            % Create a new row in this.marketTable (check signature)
            % e.g. mo.createMarket(struct('marketRootId', 1, 'marketBranchId', 1,...
            %                    'marketMin', 0, 'marketMax', 1,...
            %                    'traderId', 1, 'signatureMsg','sig',...
            %                    'signature', 1);
            %
            % Handle inputs
            this.struct2var(inputStruct);
            
            % New market
            newMarket = table(marketRootId, marketBranchId, marketMin,...
                marketMax, traderId, {signatureMsg}, {signature}, 'VariableNames',...
                {'marketRootId', 'marketBranchId', 'marketMin', 'marketMax',...
                'traderId', 'signatureMsg', 'signature'});
            
            % Check signature
            sigChk = this.verifySignature(traderId, signature, signatureMsg);
            % Check market range
            marketRangeChk = marketMin <= marketMax;
            %TODO
            % - Check that market doesn't already exist
            % - If sub-market, check that super-market exists
            % Checks (correct market number, signature relative to correct parent market, marketMin <= marketMax)
            if marketRangeChk & sigChk
                checks = 1;
            else
                checks = 0;
                disp('Signature does not match or else marketMin > marketMax. Market not added.');
            end
            
            % Add market if checks pass
            if checks
                this.marketTable = vertcat(this.marketTable, newMarket);
            end
            
        end % createMarket
        
        function this = createTrade(this, pTrade, oTrade, mTrade)
            % - Check package of primary+offset+match trades exist and
            % match up
            % - Create trade signatures 
            % - Check that sufficient collateral exists for trade
            % (checkCollateral)
            % - Add primary trade to this.orderBook
            % - Add offset and match trades to this.cacheBook
            
            % e.g. mo.createTrade(struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
            %                    'isMatched', 0, 'price', 0.5,...
            %                    'quantity', 1, 'marketRootId', 1,...
            %                    'marketBranchId', 1,'signatureMsg',...
            %                    'sigMsg', 'signature', 'sig'),...
            %                     struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 2,...
            %                    'isMatched', 0, 'price', 0.5,...
            %                    'quantity', -1, 'marketRootId', 1,...
            %                    'marketBranchId', 1,'signatureMsg',...
            %                    'sigMsg', 'signature', 'sig')...
            %                     struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 3,...
            %                    'isMatched', 1, 'price', 0.5,...
            %                    'quantity', 1, 'marketRootId', 1,...
            %                    'marketBranchId', 1,'signatureMsg',...
            %                    'sigMsg', 'signature', 'sig'));
            %
            
            
            % Check combination :
            % - Same trader id and trade root id
            chk1 = pTrade.traderId == oTrade.traderId ==...
                mTrade.traderId;
            chk2 = pTrade.tradeRootId == oTrade.tradeRootId ==...
                mTrade.tradeRootId;
            % - Trade branch id 1 for primary, 2 for offset, 3 for match
            chk3 = pTrade.tradeBranchId == 1;
            chk4 = oTrade.tradeBranchId == 2;
            chk5 = mTrade.tradeBranchId == 3;            
            % - isMatched == 0 for primary and offset, 1 for matched
            chk6 = pTrade.isMatched == 0;
            chk7 = oTrade.isMatched == 0;
            chk8 = mTrade.isMatched == 1;            
            % - Same price for all
            chk9 = pTrade.price == oTrade.price == mTrade.price;
            % - Same absolure quantity
            chk10 = abs(pTrade.quantity) == abs(oTrade.quantity) ==...
                abs(mTrade.quantity);
            % - Opposite signs for primary and offset            
            chk11 = sign(pTrade.quantity) == -1*sign(oTrade.quantity) == ...
                sign(mTrade.quantity);
            % - Same market root and branch
            chk12 = pTrade.marketRootId == oTrade.marketRootId ==...
                mTrade.marketRootId;
            chk13 = pTrade.marketBranchId == oTrade.marketBranchId ==...
                mTrade.marketBranchId;
            
            primaryOffsetMatchChk = chk1 & chk2 & chk3 & chk4 & chk5 &...
                chk6 & chk7 & chk8 & chk9 & chk10 & chk11 & chk12 &...
                chk13;
            
            % Check quantity is -1 or 1
            validTradeQuantityChk = ismember(pTrade.quantity, [-1, 1]);
            
            % Checks (markets exist, signature relative to parents)
            if any( (pTrade.marketRootId == this.marketTable.marketRootId) & ...
                    (pTrade.marketBranchId == this.marketTable.marketBranchId))
                validMarketChk = 1;
            else
                validMarketChk = 0;
                disp('Market root and/or branch does not exist.');
            end
            
            % Check signatures of all trades match their signature msg 
            sigChkPrimary = this.verifySignature(pTrade.traderId,...
                pTrade.signature, pTrade.signatureMsg);
            sigChkOffset = this.verifySignature(oTrade.traderId,...
                oTrade.signature, oTrade.signatureMsg);
            sigChkMatch = this.verifySignature(mTrade.traderId,...
                mTrade.signature, mTrade.signatureMsg);            
            sigChk = sigChkPrimary & sigChkOffset& sigChkMatch;
            
             % If all checks pass, create a new trade in orderBook.
           
            if primaryOffsetMatchChk & validTradeQuantityChk & validMarketChk & sigChk
                newTrade = struct2table(pTrade);
                offsetTrade = struct2table(oTrade);
                matchTrade = struct2table(mTrade);
                % Check collateral on primary trade
                colChk = this.checkCollateral(newTrade);
                if colChk
                    % Add primary trade to order book
                    this.orderBook = vertcat(this.orderBook, newTrade);
                    % Add offset and match trades to cache order book
                    this.cacheBook = vertcat(this.cacheBook, offsetTrade);
                    this.cacheBook = vertcat(this.cacheBook, matchTrade);
                    % Match trades
                    this.matchTrades();
                else
                    disp(['Failed. Signature check ' num2str(sigChk) ...
                        ', valid market  check ' num2str(validMarketChk)...
                        ', valid quantity  check ' num2str(validTradeQuantityChk)...
                        ', valid input combination  check ' num2str(primaryOffsetMatchChk) ]);
                end % colChk
            end % checks
            
        end % createTrade
        
        function [colChk, netCollateral] = checkCollateral_public(this, newTrade)
            % Public check collateral method
            
            if isstruct(newTrade)
                newTrade = struct2table(newTrade);
            end
            [colChk, netCollateral] = this.checkCollateral(newTrade);
        end % checkCollateral_public
        
    end % Public methods
    
    methods (Access = private) % Check collateral and match
                
        % Check and match functions:
        
        % checkCollateral
        % constructMarketOutcomes
        % constructPayoff
        % matchTrades
        
        function [colChk, netCollateral] = checkCollateral(this, newTrade)
            % Check if sufficient collateral exists for a newTrade by
            % constructing all output combinations for the trader. Returns
            % colChk = 0/1 (1 = suffiient collateral  exists)
            
            % Note that this should not be a public method because it could
            % be used to deduce information about the trader's positions.
            
            % Select own trades
            traderId = newTrade.traderId;
            % Get existing trades for tra der
            ownTrades = this.orderBook((this.orderBook.traderId == traderId), :);
            % Get all root markets (where marketBranchId == 1)
            rootMarkets = this.marketTable(this.marketTable.marketBranchId == 1, :);
            % Get own root  markets
            ownRootMarkets = rootMarkets(ismember(rootMarkets.marketRootId,...
                [ownTrades.marketRootId(:); newTrade.marketRootId(:)]), :);
            
            % Construct corner outcome combinations in root markets (cell array of marketTables)
            outcomeCombinations = this.constructOutcomeCombinations(ownRootMarkets);
            
            for iComb = 1 : length(outcomeCombinations)
                % Add fixed outcomes to market table
                marketTable_test = outerjoin(this.marketTable,...
                    outcomeCombinations{iComb}, 'MergeKeys',true);
                % Construct payoffs for matched and unmatched trades
                matchedTrades = ownTrades(ownTrades.isMatched==1, :);
                openTrades = ownTrades(ownTrades.isMatched==0, :);
                
                % Payoffs for matched trades
                if ~isempty(matchedTrades)
                    matchedTradePayoffs = this.constructPayoff(matchedTrades,...
                        marketTable_test);
                else
                    matchedTradePayoffs = 0;
                end
                
                % Payoff for open (unmatched) trades
                if ~isempty(openTrades)
                    openTradePayoffs =  this.constructPayoff(openTrades,...
                        marketTable_test);
                else
                    openTradePayoffs = 0;
                end
                
                % Payoff for new trade
                newTradePayoff = this.constructPayoff(newTrade, marketTable_test);
                
                % Collateral is all matched trades + worst open trade + worst
                % outcome on new trade
                netCollateral(iComb,:) = sum(matchedTradePayoffs) + min(openTradePayoffs) + ...
                    min(newTradePayoff);
                
            end % iComb
            
            % Collateral available under all worst outcomes
            colChk = all(netCollateral>=this.COLLATERAL_LIMIT);
            
        end % checkCollateral
        
        function marketOutcomes = constructOutcomeCombinations(this, marketTable)
            % Construct all possible outcome combinations root markets
            % Output:
            % marketOutcomes is a marketTable with each possible marketMin/marketMax combination of
            % extrema for existing markets.
            
            % Get highest market minimum for each root market
            marketMaxMin = varfun(@max, marketTable, 'InputVariables',...
                'marketMin', 'GroupingVariables',...
                {'marketRootId'});
            
            % Get lowest market maximum for each root market
            marketMinMax = varfun(@min, marketTable, 'InputVariables',...
                'marketMax', 'GroupingVariables',...
                {'marketRootId'});
            
            % Extrema for each market
            marketExtrema = innerjoin(marketMaxMin, marketMinMax, 'Keys',...
                {'marketRootId'});
            % Rename extrema as marketMin and marketMax
            marketExtrema.Properties.VariableNames(...
                ismember(marketExtrema.Properties.VariableNames,...
                'min_marketMax')) = {'marketMax'};
            marketExtrema.Properties.VariableNames(...
                ismember(marketExtrema.Properties.VariableNames,...
                'max_marketMin')) = {'marketMin'};
            marketExtrema = marketExtrema(:,...
                {'marketRootId', 'marketMin',...
                'marketMax'});
            % Market min/max outcomes
            % {[market 1 min, market 1 max], [market 2 min, market 2 max], ...}
            for iMarket = 1 : height(marketExtrema)
                tmpOutcome{iMarket} = marketExtrema{iMarket, {'marketMin',...
                    'marketMax'}};
            end % iMarket
            
            % Get all combinations
            marketCombinations = this.cartesianProduct(tmpOutcome);
            numCombinations = size(marketCombinations, 1);
            numMarkets = size(marketCombinations,2);
            
            for iOutcome = 1 : numCombinations
                % Get unique markets
                mT = unique(marketTable(:, setdiff(...
                    marketTable.Properties.VariableNames,...
                    {'marketMin', 'marketMax', 'signature',...
                    'signatureMsg'})), 'rows');
                
                marketIds = mT.marketRootId;
                % Set market min/max to each outcomme combination
                for iMarket = 1 : numMarkets
                    mT{mT.marketRootId == marketIds(iMarket),...
                        {'marketMin', 'marketMax'}} = ...
                        [marketCombinations(iOutcome, iMarket),...
                        marketCombinations(iOutcome, iMarket)];
                end % jOutcome
                marketOutcomes{iOutcome} = mT;
            end % iMarket
            
        end % constructOutputCombinations
        
        function payoffs = constructPayoff(this, orderBook, marketTable)
            % Construct minimum payoffs for each trades given marketTable.
            % Output:
            % payoffs - vector of minimum calculated possible payoff for each trade
            
            % Get highest market minimum for each market
            marketMaxMin = varfun(@max, marketTable, 'InputVariables',...
                'marketMin', 'GroupingVariables',...
                {'marketRootId', 'marketBranchId'});
            
            % Get lowest market maximum for each market
            marketMinMax = varfun(@min, marketTable, 'InputVariables',...
                'marketMax', 'GroupingVariables',...
                {'marketRootId', 'marketBranchId'});
            
            % Cumulative minimum along each market branch (inelegant)
            for iMarket = 1 : height(marketMaxMin)
                mRId = marketMaxMin(iMarket, :).marketRootId;
                mBId = marketMaxMin(iMarket, :).marketBranchId;
                parentMarkets = marketMaxMin(marketMaxMin.marketRootId...
                    == mRId & marketMaxMin.marketBranchId <= mBId, :);
                % Higest market minium at branch
                marketMaxMin.branchMarketMin(iMarket) =...
                    max(parentMarkets.max_marketMin);
            end % iMarket
            
            % Cumulative maximum along each market branch
            for iMarket = 1 : height(marketMaxMin)
                mRId = marketMinMax(iMarket, :).marketRootId;
                mBId = marketMinMax(iMarket, :).marketBranchId;
                parentMarkets = marketMinMax(marketMinMax.marketRootId== mRId ...
                    & marketMinMax.marketBranchId <= mBId,:);
                % Lowest market maximum at branch
                marketMinMax.branchMarketMax(iMarket) =...
                    min(parentMarkets.min_marketMax);
            end % iMarket
            
            % Add maxmin and minmax to orderBook
            minMax_test = outerjoin(orderBook, marketMinMax,...
                'Type', 'left', 'MergeKeys', true);
            
            maxMin_test = outerjoin(orderBook, marketMaxMin,...
                'Type', 'left', 'MergeKeys', true);
            
            % Construct  payoff in both  casess
            minMax_payoff = (minMax_test.branchMarketMax -...
                minMax_test.price) .* minMax_test.quantity;
            maxMin_payoff = (maxMin_test.branchMarketMin -...
                maxMin_test.price) .* maxMin_test.quantity;
            
            % Worst possible payoffs for each trade in orderBook
            payoffs = min([minMax_payoff, maxMin_payoff], [], 2);
            
        end % constructPayoff
        
        function this = matchTrades(this)
            % Match trades in this.orderBook
            % - Checks if matchable trade exists
            % - Checks collateral for both sides
            % - Writes trade (adds offsetting unmatched trade and corresponding matched trade)
            
            % Iterate through markets
            for iMarket = 1 : height(this.marketTable)
                allMatched = false;
                marketTmp = this.marketTable(iMarket,:);
                while allMatched == false
                    % Get current unmatched trades for target market
                    ob = innerjoin(this.orderBook,...
                        marketTmp(:,{'marketRootId','marketBranchId'}));
                    ob = ob(ob.isMatched == 0,: );
%                     ob.countInd = ones(height(ob),1);
                    % Calculate net open orders for each trader
                    countOrderBook = varfun(@count, ob, 'GroupingVariables',...
                        {'traderId', 'tradeRootId', 'price'},...
                        'InputVariables', {'quantity'});
                    % Remove any trades that already have an offset or
                    % match in the order book
                    ob = innerjoin(ob, countOrderBook(countOrderBook.count_quantity>1,:));
                    % TODO: need priority to come from signature chain
                    netOrderBook.priority = netOrderBook.tradeRootId./...
                        netOrderBook.GroupCount;
                    % Separate bids and asks 
                    bids = ob(ob.quantity ==1, :);
                    asks = ob(obquantity ==-1, :);
                    % Get max bids/asks
                    maxBid = bids(bids.price == max(bids.price), :);
                    minAsk = asks(asks.price == min(asks.price), :);
                                        
                    if minAsk.price <= maxBid.price
                        % set price according to which trade was first
                        if maxBid.priority < minAsk.priority
                            tradePrice = maxBid.price
                        else
                            tradePrice = minAsk.price
                        end
                        
                        % Unmatched target bid
                        targetBid = maxBid;                        
                        % Unmatched target ask
                        targetAsk = minAsk;
                        
                        checkBid = this.checkCollateral(targetBid);
                        checkAsk = this.checkCollateral(targetAsk);
                        if checkBid & checkAsk
                            % add both trades to matched and offset from
                            % unmatched
                            this = this.writeMatchedTrade(targetBid);
                            this = this.writeMatchedTrade(targetAsk);
                        elseif checkBid & ~ checkAsk
                            % Remove marginal trade from bid
                            this = this.reduceMarginalTrade(targetAsk);
                        elseif ~checkBid & checkAsk
                            % Remove marginal trade from ask
                            this = this.reduceMarginalTrade(targetBid);
                        elseif ~checkBid & ~checkAsk
                            % Remove marginal trade from bid and ask
                            this = this.reduceMarginalTrade(targetAsk);
                            this = this.reduceMarginalTrade(targetBid);
                        end %
                    else
                        % No trades to match
                        allMatched = true;
                    end % minAsk.price <= maxBid.price
                    
                end % while allMatched = false
            end % iMarket
            
        end % matchedTrades
        
    end % methods (Access = private)
    
    methods (Access = private) % Mutate trades (write/reduce marginal)
        
        % Trade mutation functions:
        % writeMatchedTrades
        % reduceMarginalTrade
        
        function this = writeMatchedTrade(this, targetTrade)
            % Add trade by finding closest valid offset and matched trade
            
            % Write offset to original unmatched trade (previous sig from root trade)
            % Find closest offset trade
            offsetTrade = this.findValidOffsetTrade(targetTrade);
            % Add offset trade  (TODO sig check in function)
            this.orderBook = vertcat(this.orderBook, offsetTrade);
            % Write matched ( previous sig from offset trade)
            % Find closest match trade
            matchedTrade = this.findValidMatchedTrade(targetTrade);
            % Add match trade (TODO: sig check in function)
            this.orderBook = vertcat(this.orderBook, matchedTrade);
        end % writeMatchedTrade
        
        function this = reduceMarginalTrade(this, targetTrade)
            % Add offsetting trade (sig check from root trade)
            reduceTrade = this.findValidReduceTrade(targetTrade);
            % TODO sig check in function
            this.orderBook = vertcat(this.orderBook, reduceTrade);
        end % writeMatchedTrade
        
    end % methods (Access = private)
    
    methods (Access = private) % Find offset/matched/reduce
        
        % Find offset trade functions:
        % findValidOffseteTrade
        % findValidMatchedTrade
        % findValidReduceTrade
        
        function offsetTrade = findValidOffsetTrade(this, targetTrade)
            % Return closest valid offset trade (unmatched)
            tt = targetTrade;
            tt.quantity = -1*tt.quantity;
            tt.price = sourceTrade.price;
            tt.isMatched = 0;
            tt.tradeBranchId = -1;
            offsetTrade = tt;
            
            % FUTURE:
            % Request signature for offset trade or take from batch
            
        end % findValidMatchedTrade
        
        function matchedTrade = findValidMatchedTrade(this, targetTrade)
            % Return closest valid matched trade
            tt = targetTrade;
            tt.isMatched = 1;
            tt.tradeBranchId = -2;
            matchedTrade = tt;
            
        end % findValidMatchedTrade
        
        function reduceTrade = findValidReduceTrade(this, targetTrade)
            tt = targetTrade;
            % Reduce quantity by 10%
            tt.quantity = -0.9*tt.quantity;
            tt.isMatched = 0;
            tt.tradeBranchId = -3;
            reduceTrade = tt;
        end
        
        
    end % private methods
    
    methods (Access = private, Static) % Utility functions
        
        % Utility functions
        % cartesianProduct - cartesianProduct product
        
        function C = cartesianProduct(input)
            % Construct cartesianProduct product of e.g. {{[1 2]}, {[2 3]}, {[4,5]}}.
            % Used to create combination of min/max market outcomes across
            % multiple markets.
            
            args = input;
            n = length(input);
            [F{1:n}] = ndgrid(args{:});
            for i=n:-1:1
                G(:,i) = F{i}(:);
            end
            C = unique(G , 'rows');
        end % cartesianProduct
        
        function struct2var(s)
            %STRUCT2VAR Convert structure array to workspace variables.
            %   STRUCT2VAR(S) converts the M-by-N structure S (with P fields)
            %   into P variables defined by fieldnames with dimensions M-by-N.  P
            %   variables are placed in the calling workspace.
            %
            %   Example:
            %     clear s, s.category = 'tree'; s.height = 37.4; s.name = 'birch';
            %     c = struct2cell(s); f = fieldnames(s);
            %
            %   See also STRUCT2CELL, FIELDNAMES.
            
            % Copyright 2010 The MathWorks, Inc.
            if nargin < 1
                error('struct2var:invalidInput','No input structure found')
            elseif nargin > 1
                error('struct2var:invalidInput','Too many inputs')
            elseif ~isstruct(s)
                error('struct2var:invalidInput','Input must be a structure data type')
            end
            
            [r,c] = size(s);
            names = fieldnames(s);
            
            for i=1:length(names)
                assignin('caller',names{i},s.(names{i}));
            end
            
        end % struct2var
        
    end % private methods
    
    methods (Access = public) % Signature methods (mock for matlab version)
        
        % generateSignatureKeys
        % signMessage
        % verifyMessage
        
        function [signingKey_hex, verifyKey_hex] = generateSignatureKeys(this)
            % Generate modk sig/verify pairs
            signingKey_hex = 'sk'
            verifyKey_hex = 'vk';
        end % generateSignatureKeys
        
        function signed = signMessage(this, msg, signingKey_hex)
            % Generate mock signature as message
            signed = msg;
        end %signMessage
        
        function verified = verifyMessage(this, signature, signatureMsg, verifyKey_hex)
            % For mock just check that signature = signatureMsg
            if strcmp(signatureMsg, signature)
                verified = true;
            else
                verified = false;
            end
            
        end %verifyMessage
                    
        function verifyKey = getVerifyKey(this, traderId)
            %         # Get verify key for trader
            %         verifyKey =  pd.read_sql('SELECT verifyKey FROM userTable WHERE'
            %                                  ' traderId = "%s"' %(traderId), self.conn
            %                                  ).verifyKey[0]
            %         return verifyKey
            verifyKey = 'vk';
        end % verifyKey
        
        function signatureKey = getSignatureKey(this, traderId)
            %         # Get signature key for trader (Not in production)
            %         # TODO: Remove for production
            %         signatureKey =  pd.read_sql('SELECT signatureKey FROM userTable WHERE'
            %                                     ' traderId = "%s"' %(traderId), self.conn
            %                                     ).signatureKey[0]
            %         return signatureKey
            signatureKey = 'sk';
        end % signatureKey
        
        function prevSig = getPreviousSig(this, tableName, indexName)
            %         # Get previous signature by choosing signature with maximum index value
            %         prevSig = pd.read_sql(
            %             'SELECT signature FROM %s  WHERE %s  = (SELECT max(%s) FROM %s)'
            %             %(tableName, indexName, indexName, tableName),
            %             self.conn).signature
            %
            %         # Select signature or set to rootsig if empty
            %         if not prevSig.empty:
            %             prevSig = prevSig[0]
            %         else:
            %             prevSig = 'rootsig'.encode("utf-8")
            %
            %         return prevSig
            if strcmp(tableName, 'marketTable')
                maxMarketSig = this.marketTable{this.marketTable.marketRootId ==...
                    max(this.marketTable.marketRootId), 'signature'};
            elseif strcmp(tableName, 'orderBook')
                % Last matched root trade with highest tradeRootId
                obTmp = this.orderBook((this.orderBook.isMatched) & ...
                    (this.orderBook.marketBranchId == 1), :);
                maxOrderBookSig = this.orderBook{this.orderBook.tradeRootId == ...
                    max(this.marketTable.tradeRootId), 'signature'};
            end % cases
                
            prevSig = 'prevSig';
        end % getPrevioussig
        
        %     # Methods to get previous signatures for particular tables
        
        function prevSig = getPreviousMarketTableSig(this)
            %         # Get previous signature from marketData table
            %         prevSig = self.getPreviousSig('marketData', 'marketId')
            %         return prevSig
            prevSig = this.getPreviousSig('marketTable', 'marketId')
        end % getPreviousMarketTableSig
        
        function prevSig = getPreviousOrderBookSig(this)
            %         # Get previous signature from previousOrderBook table
            %         prevSig = self.getPreviousSig('orderBook', 'tradeNum')
            %         return prevSig
            prevSig = this.getPreviousSig('orderBook', 'tradeNum')
        end % getPreviousOrderBookSig
                
        %     # Chain signatures (all need to be on client side eventually)
        
        function signedMarketTable = signMarketTable(this, traderId, underlying, marketMin, marketMax, expiry,  signatureKey_hex)
            %         # Sign previous signature
            %         prevSig = self.getPreviousOpenMarketDataSig()
            %
            %         # Encode signature message in bytes
            %         msg = b'%s%s%s%s%s%s' % (prevSig, traderId.encode("utf-8"), underlying.encode("utf-8"),
            %                            str(marketMin).encode("utf-8"), str(marketMax).encode("utf-8"), str(expiry).encode("utf-8"))
            %
            %         signedOpenMarketData = self.signMessage(msg=msg,
            %                                                    signingKey_hex=signatureKey_hex)
            %         return signedOpenMarketData
            signedMarketTable = 'signedMarketTable';
        end % signedMarketTable
        
        function signedOrderBook = signOrderBook(self, price, quantity, traderId, marketId, signatureKey_hex)
            %         # Sign previous signature
            %         prevSig = self.getPreviousOrderBookSig()
            %
            %         # Encode signature message in bytes
            %         msg = b'%s%s%s%s%s' % (prevSig, traderId.encode("utf-8"), str(marketId).encode("utf-8"),
            %                            str(price).encode("utf-8"), str(quantity).encode("utf-8"))
            %
            %         signedOrderBook = self.signMessage(msg=msg,
            %                                                    signingKey_hex=signatureKey_hex)
            %         return signedOrderBook
            signedOrderBook = 'signedOrderBook';
        end % signOrderBook       
        
        function verified = verifySignature(self, traderId, signature, signatureMsg)
            %         # Vefify a signature messsage by looking up the verify key and checking
            %         verifyKey_hex = self.getVerifyKey(traderId=traderId)
            %         # Verify the message against the signature and verify key
            %         return self.verifyMessage(signature=signature,
            %                                   signatureMsg=signatureMsg,
            %                                   verifyKey_hex=verifyKey_hex)
            verified = true;
        end % verifySignature
                
    end % signature methods
    
end % MarketObject


% Notes::

% Signature setup:

% Mock signatures are 1 + previous signature.

% TODO:
% - Mock signature functions ( => getPreviousSignature) 

% Original order submitted with related-orders on branches (tradeRootId = tId, tradeBranchId = 2, ..., N) all with same
% previous sig from last matched trade (?). Only tradeBranchId=1 trades considered for matching.


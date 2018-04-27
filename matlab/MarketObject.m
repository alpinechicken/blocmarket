classdef MarketObject < handle
    %
    % Version of market object that only allows q=1 or q=-1
    %
    % - Holds an order book (orderBook), user table( userTable), and list of markets (marketTable) for
    % an contract settling beetween some minimum and maximum.
    % - Interface for adding users (createUser), markets
    % (createMarket), and orders (createTrade)
    % - Market object handles collateral calculations and trade matching
    % - Orders are signed from a previous valid orders. Orders can
    % only be added to the order book. Public keys in the user table can
    % verify trade and market chains.
    % - Any root market can have any number of sub-markets that can only
    % settle within the bounds of the previous markets. 
    % - Each order has three components specified by tradeBranchId:
    %
    %           1 = Primary (trade initially in order book)
    %           2 = Offset (offset to a primary trade => signature from primary)
    %           3 = Match (matched version of primary trade => signature from offset)
    % - Each time a new market is added or new bounds are set for an
    % existing market, the possible extreme market values are calculated.
    
    % Market object with simplified tables and mock signatures.
    
    properties (SetAccess=private)
        % Table with users and public key for signatures
        userTable = table([], {}, 'VariableNames', {'traderId',...
            'verifyKey'});
        % Order book for all trades, including including order book,
        % matched, and linked trades (offsets, partials, etc)
        orderBook = table([], [], [], [], [], [], [], {}, {}, {},...
            'VariableNames',...
            {'tradeRootId', 'tradeBranchId', 'price',...
            'quantity', 'marketRootId', 'marketBranchId', 'traderId',...
            'previousSig', 'signatureMsg', 'signature'});
        % Cache order book (trades can be promoted to the order book)
        cacheBook = table([], [], [], [], [], [], [], {}, {}, {},...
            'VariableNames',...
            {'tradeRootId', 'tradeBranchId','price',...
            'quantity', 'marketRootId', 'marketBranchId', 'traderId',...
            'previousSig', 'signatureMsg', 'signature'});
        % Market table with minimum and maximum of each market.
        marketTable = table([], [], [], [], [], {}, {}, {}, 'VariableNames',...
            {'marketRootId', 'marketBranchId', 'marketMin', 'marketMax',...
            'traderId', 'previousSig', 'signatureMsg', 'signature'});               
        
        % Cell array with all possible root market combinations (re-calcluated when a market is
        % added or changed)
        outcomeCombinations
        marketBounds % Lower and upper bounds of markets
        marketOutcomes % Market outcome matrix
        
        % TODO: apply collateral only for trader 0, everyone else  gets
        % from trades.
        COLLATERAL_LIMIT = -2;
        
    end % Properties
    
    methods (Access = public) % Construct and create users/market/trade
        
        % MarketObject (constructor)
        
        % Create functions:
        %
        % createUser
        % createMarket
        % createTrade
        %
        % Get previous functions:
        %
        % getPreviousTrade
        % getPreviousMarket
        %
        % Public access to collateralCheck:
        %
        % collateralCheck_public
        
        function this = MarketObject()
            % Constructor
        end  % MarketObject
        
        function [this, traderId]  = createUser(this, inputStruct)
            % Create a new row in this.userTable
            %
            % In: 
            % inputStruct (struct) - struct with verify key for
            %                        this.userTable
            % 
            % Out:
            % this.userTable (table) - add row
            % traderId (integer) - assigned trader id
            %
            % e.g. 
            % mo = mo.createUser(struct('verifyKey','a'));
            % mo = mo.createUser(struct('verifyKey','b'));
            
            newUser = struct2table(inputStruct);
            
            % Number of users in table
            maxTraderId = height(this.userTable);
            % Add new user if not already in table
            if ~ismember(newUser.verifyKey, this.userTable.verifyKey)
                traderId = maxTraderId + 1;
                newUser = table(traderId, {newUser.verifyKey}, 'VariableNames',...
                    {'traderId', 'verifyKey'});
                this.userTable = vertcat(this.userTable, newUser);
                disp(['traderId:' num2str(traderId)])
            else
                disp('Verify key already exists');
            end
        end % createUser
        
        function this = createMarket(this, newMarket)
            % Create a new row in this.marketTable
            %
            % In: 
            % newMarket (struct) - new market to add 
            %
            % Out:
            % this.MarketTable (table) - add row
            % this.outputCombinations (cell array) - possible extreme market outcomes 
            % this.marketOutcomes (numStates* numMarkets matrix) - market
            %                                                      outcomes
            %                                                      across
            %                                                      states 
            % this.marketBounds (table) - table with bounds for all markets
            %
            % e.g. 
            %   mo.createMarket(struct('marketRootId', 1, 'marketBranchId', 1,...
            %                                'marketMin', 0, 'marketMax', 1,...
            %                                'traderId', 1, 'previousSig', 's', 'signatureMsg','s',...
            %                                'signature', 'ss'))
            %
            %   The signature logic is automated with createMarket:
            %
            %   mo.createMarket(marketMaker(mo, 1, 1, 0, 1, 1))            
            %
            
            % New market from input structure
            newMarket = struct2table(newMarket);
            
            % Check signature chain for markets
            if isempty(this.marketTable)
                % If there are no existing markets chain is ok
                chainChk = true;
            else
                % Last market table entry
                prevMarket = this.marketTable(end, :);
                % Check that signature matches
                chainChk =  strcmp(newMarket.previousSig, prevMarket.signature{1});
            end
                           
            % Check signature of new market is valid
            sigChk = this.verifyMarketSignature(newMarket);
            % Check market range
            marketRangeChk = newMarket.marketMin <= newMarket.marketMax;
            % Checks (correct market number, signature relative to correct parent market, marketMin <= marketMax)
            if marketRangeChk & sigChk & chainChk
                checks = 1;
            else
                checks = 0;
                disp('Signature does not match, bad signature chain, or else marketMin > marketMax. Market not added.');
            end
            
            % Add market if checks pass
            if checks
                this.marketTable = vertcat(this.marketTable, newMarket);
                % Update all possible combinations of root markets
                this.updateOutcomeCombinations;
            end
            
        end % createMarket
        
        function this = createTrade(this, tradePackage)
            % - Check package of primary+offset+match trades exist and
            % are valid
            % - Create trade signatures 
            % - Check that sufficient collateral exists for primary trade
            % (checkCollateral)
            % - Add primary trade to this.orderBook
            % - Add all other trades to this.cacheBook
            % 
            % In:
            % tradePackage (trade package) - trade package with
            %                                primary/offset/match and backup trades (from tradeMaker)
            %
            % Out:
            % this.orderBook (table) - add rows 
            % this.cacheBook (table) - add rows
            %
            %  Example:
            %  tradePackage = tradeMaker(mo, 1, 1, 1, [0.5, 0.4], 1)
            %  mo = mo.createTrade(tradePackage)
            %
            %  Note: tradeMaker constructs the package with primary/offset/match
            %  and adds the correct signatures given the market object mo
            
            
            pTrades = struct2table(tradePackage.primaryTrade);
            oTrades = struct2table(tradePackage.offsetTrade);
            mTrades = struct2table(tradePackage.matchTrade);
            
            % Check trade package structure makes sense:
            
            % - Same trader id and trade root id
            chk1 = pTrades.traderId == oTrades.traderId  &...
                oTrades.traderId == mTrades.traderId;
            chk2 = pTrades.tradeRootId == oTrades.tradeRootId &...
                oTrades.tradeRootId == mTrades.tradeRootId ;
            % - Trade branch id 1 for primary, 2 for offset, 3 for match
            chk3 = pTrades.tradeBranchId == 1;
            chk4 = oTrades.tradeBranchId == 2;
            chk5 = mTrades.tradeBranchId == 3;                      
            % - Same price for all
            chk6 = pTrades.price == oTrades.price &...
                oTrades.price == mTrades.price;
            % - Same absolure quantity
            chk7 = abs(pTrades.quantity) == abs(oTrades.quantity) &...
                abs(oTrades.quantity) == abs(mTrades.quantity);
            % - Opposite signs for primary and offset            
            chk8 = sign(pTrades.quantity) == -1*sign(oTrades.quantity) &...
                -1*sign(oTrades.quantity) == sign(mTrades.quantity);
            % - Same market root and branch
            chk9 = pTrades.marketRootId == oTrades.marketRootId &...
                oTrades.marketRootId == mTrades.marketRootId;
            chk10 = pTrades.marketBranchId == oTrades.marketBranchId &...
                oTrades.marketBranchId == mTrades.marketBranchId;
            
            primaryOffsetMatchChk = all(chk1 & chk2 & chk3 & chk4 & chk5 &...
                chk6 & chk7 & chk8 & chk9 & chk10);            
            
            % Check quantity is -1 or 1
            validTradeQuantityChk = all(ismember(pTrades.quantity, [-1, 1]));
            
            % Check market exists
            if any( (pTrades.marketRootId(1) == this.marketTable.marketRootId) & ...
                    (pTrades.marketBranchId(1) == this.marketTable.marketBranchId))
                validMarketChk = 1;
            else
                validMarketChk = 0;
                disp('Market root and/or branch does not exist.');
            end
            
            % Check signatures of all trades match their signature msg
            for  iTrade = 1 : length(pTrades.traderId)
                sigChkPrimary(iTrade) = this.verifyTradeSignature(pTrades(iTrade,:));
                if ~isempty(this.orderBook)
                    % Find previous trade                    
                    prevTrade = this.orderBook(strcmp(this.orderBook.signature,...
                        pTrades{iTrade, 'previousSig'}), :);
                    % Find previous valid trade
                    prevValidTrade = this.getPreviousTrade;
                    % Check signature matches
                    chainChkPrimary(iTrade) = strcmp(prevTrade.signature,...
                        prevValidTrade.signature);
                else
                    % If it's the first trade it's ok
                    chainChkPrimary(iTrade) = true;
                end
                % Check signature of offset trade
                sigChkOffset(iTrade) = this.verifyTradeSignature(oTrades(iTrade,:));
                % Check previous signature of offset is signature of
                % primary
                chainChkOffset(iTrade) = strcmp(oTrades{iTrade, 'previousSig'},...
                    pTrades{iTrade, 'signature'});
                % Check signature of match trade
                sigChkMatch(iTrade) = this.verifyTradeSignature(mTrades(iTrade, :));
                % Check prepvious signature of matched trade is signature
                % of offset
                chainChkMatch(iTrade) = strcmp(mTrades{iTrade, 'previousSig'},...
                    oTrades{iTrade, 'signature'});
            end
            
            % All signatures  check out
            sigChk = all(sigChkPrimary & sigChkOffset & sigChkMatch);
            
            % All chains check out
            chainChk = all(chainChkPrimary & chainChkOffset & chainChkMatch);
            
            % If all checks pass, add new trade in orderBook and rest to cache.           
            if primaryOffsetMatchChk & validTradeQuantityChk &...
                    validMarketChk & sigChk & chainChk
                primaryTrades = pTrades;
                offsetTrade = oTrades;
                matchTrade = mTrades;
                % New trade is first primary trade
                newTrade = primaryTrades(1,:);
                % Alternative primary trades are other  primary trades
                altPrimaryTrades = primaryTrades(2:end, :);
                % Check collateral on first primary trade
                colChk = this.checkCollateral(newTrade);
                if colChk
                    % Add primary trade to order book
                    this.orderBook = vertcat(this.orderBook, newTrade);
                    % Add offset and match trades to cache order book
                    this.cacheBook = vertcat(this.cacheBook, altPrimaryTrades);                    
                    this.cacheBook = vertcat(this.cacheBook, offsetTrade);
                    this.cacheBook = vertcat(this.cacheBook, matchTrade);
                    % Match trades
                    this.matchTrades();
                else
                    disp(['Failed. Signature check ' num2str(sigChk) ...
                        ', valid market  check ' num2str(validMarketChk)...
                        ', valid quantity  check ' num2str(validTradeQuantityChk)...
                        ', valid input combination check ' num2str(primaryOffsetMatchChk)...
                        ', collateral check' num2str(colChk)]);
                end % colChk
            end % checks
            
        end % createTrade
        
        % TODO: These can be held as properties and updated when
        % new trades are added to this.orderBook. 
        % - Modify the this.previousTrade, this.previousMarketSig properies
        % - call updatePreviousTrade and updatePreviousMarket from
        % createMarket and createTrade
        % - Find calls to getPreviousTrade and getPreviousMarket and change
        % to access the propreties instead
                
        function previousTrade = getPreviousTrade(this)
            % Most recent signature is the highest number on the highest
            % trade number in the order book
            %
            % In:
            % (nothing)
            % Out:
            % previousTrade (table row) - most recent valid trade from
            %                             which to append signature chain
            
            if ~isempty(this.orderBook)
                maxTrade = this.orderBook(this.orderBook.tradeRootId == max(this.orderBook.tradeRootId), :);
                previousTrade = maxTrade(maxTrade.tradeBranchId == max(maxTrade.tradeBranchId), :);
            else
                % Return root trade
                previousTrade = table(0, {'s'}, 'VariableNames', {'tradeRootId', 'signature'});
            end
            
        end % getPreviousTrade

        function previousMarket = getPreviousMarket(this)
            % Most recent market signature relative to some market root
            %
            % In: 
            %
            % Out: 
            % previousMarket (table) - previous market
            
            
            if isempty(this.marketTable)
                % Dummy table if it's the first one
                previousMarket = table(nan, nan, nan, nan, nan, {'s'}, {'s'},{'s'},...
                    'VariableNames', {'marketRootId', 'marketBranchId',...
                    'marketMin', 'marketMax', 'traderId',...
                    'previousSig', 'signatureMsg', 'signature'});
            else
                % previousMarket
                previousMarket = this.marketTable(end, :);
                
            end
            
            
        end % getPreviousTrade
        
        % Public collateral check: 
        
        function [colChk, netCollateral] = checkCollateral_public(this, newTrade)
            % Public check collateral method. Gets current collateral if
            % there is no newTrade input
            %
            % In: newTrade (table row) - new trade to check (can be empty)
            % 
            % Out:
            % colChk (numTraders * 1 logical) - collateral check indicator
            %                                   for each trader
            % netCollateral (numStates * numTraders matrix) - collateral outcomes for each trader in each state 
            
            if ~exist('newTrade', 'var')
               % If there's no new trade just use current state
               newTrade = table();
            end
            if isstruct(newTrade)
                newTrade = struct2table(newTrade);
            end
            [colChk, netCollateral] = this.checkCollateral(newTrade);
        end % checkCollateral_public
                
    end % Public methods
    
    methods (Access = private) % Check collateral and match trades
                
        % Check and match functions:
        
        % checkCollateral
        % updateOutcomeCombinations
        % constructMarketOutcomes
        % matchTrades
        
        function [colChk, netCollateral, colChkAll] = checkCollateral(this, newTrade)
            % Check if sufficient collateral exists for a newTrade by
            % constructing all output combinations for the trader. Returns
            % colChk = 0/1 (1 = sufficient collateral  exists) and
            % netCollateral which is the worst net collateral in each
            % market case.
            %
            % In: 
            % newTrade - trade table row or struct
            %
            % Out:
            % colChk (logical) - collateral check passs for trader from
            % newTrade
            % netCollateral (double numStates*numTraders) -  collateral
            %                                                 outcome for
            %                                                 each trader in each state   
            %
            % colChkAll (logical 1*numTraders) - collateral check pass
            %                                 indicators
            
            % TODO: Some of this can be usefully refactored so only the new trade
            % is checked, and the rest is held as state in netCollateral.
            % In either case it there should be no change in how
            % checkCollateral works.

            if isstruct(newTrade)
                newTrade = struct2table(newTrade);
            end
            % Tack new trade onto order book
            allTrades = vertcat(this.orderBook, newTrade);
            
            % Indicators:
            
            % Is the trade matched
            allTrades.isMatched = allTrades.tradeBranchId == 3;
            matchedTrades = allTrades(allTrades.isMatched, :); 
            % Does a matching trade exist
            unmatchedBranch = varfun(@max, allTrades, 'InputVariables',...
                    'tradeBranchId', 'GroupingVariables', 'tradeRootId');
            unmatchedRoots = unmatchedBranch.tradeRootId(unmatchedBranch.max_tradeBranchId <3, :);
            allTrades.isOpen = arrayfun(@(x) ismember(x, unmatchedRoots), allTrades.tradeRootId);
            
                        
            % Create IM matrix indicating which market trades belong to
            numTrades = height(allTrades);
            numOpenTrades = sum(allTrades.isOpen);
            numMarkets = height(this.marketBounds);
            numTraders = max(this.userTable.traderId);
            numStates = length(this.marketOutcomes);
            
            IM = zeros(numMarkets, numTraders);
            for iTrade = 1 : numTrades
                % Find index in market bounds table
                marketInd = find(allTrades.marketRootId(iTrade) == this.marketBounds.marketRootId & ...
                    allTrades.marketBranchId(iTrade) == this.marketBounds.marketBranchId);
                IM(:, iTrade) = this.makeUnitVector(numMarkets, marketInd)';
            end % iTrade
            
            % Create IQ matrix indicating which trader trades belong to
            IQ = zeros(numTrades, numTraders);
            for iTrade = 1 : numTrades
                IQ(iTrade, :) = this.makeUnitVector(numTraders, allTrades.traderId(iTrade));
            end % iTrade
            
            % Get price and quantity
            p = allTrades.price';
            q = allTrades.quantity';
            % Get market outcomes matrix
            M = this.marketOutcomes;
            
            % Market outcomes (numStates * numTrades)
            Mstar = M*IM;
            % Quantities (numTrades * numTraders)
            Qstar = repmat(q, numTraders, 1)'.*IQ;
            % Prices (numStates x numTrades)
            Pstar = repmat(p, numStates, 1);
            
            % Net collateral for matched trades (numStates * numTraders)
            NC_matched = (Mstar(:, allTrades.isMatched) -...
                Pstar(:, allTrades.isMatched))*Qstar(allTrades.isMatched, :);
            
            % Minimum collateral for open trades (including new trade)
            Mstar_ = Mstar(:, allTrades.isOpen);
            Pstar_  = Pstar(:,allTrades.isOpen);
            NC_open = [];
            if numOpenTrades > 0
                for iTrader = 1 : numTraders
                    Qstar_ = Qstar(allTrades.isOpen, iTrader);
                    if isempty(Qstar_)
                        Qstar_ = zeros(numOpenTrades, 1);
                    end
                    % Minimum payoff from open trades. TODO: neater way to
                    % construct open trade payoffs? 
                    NC_open(:, iTrader) = min((Mstar_ - Pstar_).*...
                        repmat(Qstar_', numStates, 1), [], 2);
                end % iTrader
            else
                NC_open = zeros(size(NC_matched));
            end 
            
            % Collateral available under all worst outcomes
            netCollateral = NC_matched + NC_open;
            % Indicator for which traders fail collateral check
            colChkAll = all(netCollateral >= this.COLLATERAL_LIMIT);    
            % Collateral check for trader
            if ~isempty(newTrade)
                colChk = colChkAll(newTrade.traderId);
            else
                colChk = colChkAll;
            end
        end % checkCollateral   
        
        function this = updateOutcomeCombinations(this)
            % Update outcome combinations (taking into account mins/maxes on branches)
            % 
            % In:
            %
            % Out:
            % this.outputCombinations (cell array) - possible market outcomes 
            % this.marketOutcomes (numStates* numMarkets matrix) - market
            %                                                      outcomes
            %                                                      across
            %                                                      states 
            % this.marketBounds (table) - table with bounds for all markets
            
            mT = this.marketTable;
            rootMarkets = this.marketTable(mT.marketBranchId == 1, :);
            this.outcomeCombinations = this.constructOutcomeCombinations(rootMarkets);
            
            marketBounds = this.constructMarketBounds(mT);

            this.marketBounds = marketBounds(:, {'marketRootId', 'marketBranchId',...
                'marketMin' , 'marketMax'});
            
            numMarkets = height(marketBounds);
            %             numRootMarkets = sum(marketBounds.marketBranchId == 1);
            numStates = length(this.outcomeCombinations);
            M = zeros(numStates, numMarkets);
            for iOutcome = 1 : numStates
                outcome = this.outcomeCombinations{iOutcome};
                % For outcomes min = max
                marketSettle = outcome.marketMin;
                M(iOutcome,:) = marketSettle';
            end % iOutcome
            this.marketOutcomes = M;
           
            
        end % updateOutcomeCombinations
               
        function marketOutcomes = constructOutcomeCombinations(this, marketTable)
            % Construct all possible outcome combinations root markets
            % Output:
            % marketOutcomes is a marketTable with each possible marketMin/marketMax combination of
            % extrema for existing markets.
            
            % Construct extrema of marketTable
            marketExtrema = this.constructMarketBounds(marketTable);           
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

            % Get unique markets
            mT = unique(marketTable(:, setdiff(...
                marketTable.Properties.VariableNames,...
                {'marketMin', 'marketMax', 'signature',...
                'signatureMsg', 'previousSig'})), 'rows');

            marketIds = mT.marketRootId;            
            for iOutcome = 1 : numCombinations

                % Set market min/max to each outcome combination
                for iMarket = 1 : numMarkets
                    mT{mT.marketRootId == marketIds(iMarket),...
                        {'marketMin', 'marketMax'}} = ...
                        [marketCombinations(iOutcome, iMarket),...
                        marketCombinations(iOutcome, iMarket)];
                end % jOutcome
                marketOutcomes{iOutcome} = mT;
            end % iMarket
            
        end % constructOutputCombinations
                
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
                        marketTmp(:, {'marketRootId', 'marketBranchId'}));
                    % Calculate number of branches on trade 
                    numelOrderBook = varfun(@numel, ob, 'GroupingVariables',...
                        {'traderId', 'tradeRootId', 'price'},...
                        'InputVariables', {'quantity'});
                    % Only consider trades without offsets in the order
                    % book
                    ob = innerjoin(ob, numelOrderBook(numelOrderBook.GroupCount == 1, :));
                    % Remove GroupCount
                    ob = ob(:, this.orderBook.Properties.VariableNames);
                    % Separate bids and asks 
                    bids = ob(ob.quantity ==1, :);
                    asks = ob(ob.quantity ==-1, :);
                    % Get max bids/asks
                    maxBid = bids(bids.price == max(bids.price), :);
                    minAsk = asks(asks.price == min(asks.price), :);
                    maxBid(2:end, :) = [];
                    minAsk(2:end, :) = [];
                                        
                    if minAsk.price <= maxBid.price

                            % Add both trades to matched and offset from
                            % unmatched
                            colChkMaxBid = this.checkCollateral(maxBid);
                            colChkMinAsk = this.checkCollateral(minAsk);
                            % If either of the collateral checks fail,
                            % remove a trade and try again.
                            if colChkMaxBid & colChkMinAsk
                                this = this.writeMatchedTrade(maxBid);
                                this = this.writeMatchedTrade(minAsk);
                            elseif ~colChkMaxBid & colChkMinAsk
                                this = this.removeMarginalTrade(maxBid);
                            elseif colChkMaxBid & ~colChkMinAsk
                                this = this.removeMarginalTrade(minAsk);
                            else
                                this = this.removeMarginalTrade(maxBid);
                                this = this.removeMarginalTrade(minAsk);
                            end
                                
                    else
                        % No trades to match
                        allMatched = true;
                    end % minAsk.price <= maxBid.price
                    
                end % while allMatched = false
            end % iMarket
            
        end % matchedTrades
        
    end % methods (Access = private)
    
    methods (Access = private) % Mutate trades (write/remove)
        
        % Trade mutation functions:
        % writeMatchedTrades
        % reduceMarginalTrade
        
        function this = writeMatchedTrade(this, targetTrade)
            % Add trade by finding valid offset and matched trade
            
            % Write offset to original unmatched trade (previous sig from root trade)
            % Find closest offset trade
            offsetTrade = this.findOffsetTrade(targetTrade);
            % Add offset trade  (TODO sig check in function and remove from cache)
            this.orderBook = vertcat(this.orderBook, offsetTrade);
            % Write matched (previous sig from offset trade)
            % Find closest match trade 
            matchedTrade = this.findMatchedTrade(offsetTrade);
            % Add match trade (TODO: sig check and remove from
            % cache)
            this.orderBook = vertcat(this.orderBook, matchedTrade);
        end % writeMatchedTrade
        
        function this = removeMarginalTrade(this, targetTrade)
             % Find an open trade  to reduce
            
            % Write offset to original unmatched trade (previous sig from root trade)
            % Find closest offset trade
            removeTrade = this.findRemoveTrade(targetTrade);
            % Add remove trade  (TODO sig check in function and remove from cache)
            this.orderBook = vertcat(this.orderBook, removeTrade);
      
        end % removeMarginalTrade        
        
    end % methods (Access = private)
    
    methods (Access = private) % Find offset/matched/removed
        
        % Find offset trade functions:
        % findValidOffsetTrade
        % findMatchedTrade
        % findRemoveTrade
         
        function offsetTrade = findOffsetTrade(this, targetTrade)
            % Find match trade
            %
            % In: 
            % targetTrade (table row) - target trade
            %
            % Out:
            % offsetTrade (table row) - offset trade             
            
            
            % Find offset
            isOffset = strcmp(this.cacheBook.previousSig, targetTrade.signature) &...
                this.cacheBook.price == targetTrade.price & ...
                this.cacheBook.tradeRootId == targetTrade.tradeRootId & ...
                this.cacheBook.tradeBranchId == 2 & ... 
                this.cacheBook.traderId == targetTrade.traderId;
            offsetTrade = this.cacheBook(isOffset, :);
            
        end % findMatchedTrade
        
        function matchedTrade = findMatchedTrade(this, offsetTrade)
            % Find match trade
            %
            % In: 
            % offsetTrade (table row) - offset trade
            %
            % Out:
            % matchedTrade (table row) - match trade            
            
            % Return closest valid matched trade signed from offsset trade
            isMatch = strcmp(this.cacheBook.previousSig, offsetTrade.signature) &...
                            this.cacheBook.price == offsetTrade.price & ...                
                            this.cacheBook.tradeRootId == offsetTrade.tradeRootId & ...
                            this.cacheBook.tradeBranchId == 3&... 
                            this.cacheBook.traderId == offsetTrade.traderId;
                        
            matchedTrade = this.cacheBook(isMatch, :);
            
        end % findMatchedTrade
        
        function removeTrade = findRemoveTrade(this, targetTrade)
            % Find a trade from the same traderId in the orderbook with no
            % existing offset
            %
            % In: 
            % targetTrade (table row) - trade asking for removal 
            %
            % Out:
            % removeTrade (table row) - trade identified for removal 
            
            ob = innerjoin(this.orderBook,...
                targetTrade(:, {'marketRootId', 'traderId'}));
            % Calculate number of branches on trade 
            numelOrderBook = varfun(@numel, ob, 'GroupingVariables',...
                {'traderId', 'tradeRootId', 'price'},...
                'InputVariables', {'quantity'});
            % Only consider trades with no offset in orderbook
            ob = innerjoin(ob, numelOrderBook(numelOrderBook.GroupCount == 1, :));
            
            % Dont let a trade remove itself
            ob = ob(ob.tradeRootId ~= targetTrade.tradeRootId, :);
            
            % Kill first trade that fits the criteria. 
            removeTrade = ob(1,:);
       
            
        end % findRemoveTrade
                        
    end % private methods
    
    methods (Access = private, Static) % Static functions (marketBounds and cartesian product)
        
        % Utility functions:
        %
        % constructMarketBounds  - Current upper and lower bounds for some
        %                         marketTable
        % cartesianProduct  - Cartesian product of set
        
        function marketBounds = constructMarketBounds(marketTable)
            
            % Get upper and lower bounds for a particular market table by applying
            % marketMin and marketMax sequentially down branches
            
            % In:
            % marketTable (table) -  marketTable table same format as root  
            %
            % Out:
            % marketBounds (table) - Market bounds table with {'marketRootId', 'marketBranch', 'marketMin' , 'marketMax'}

            mT = unique(marketTable(:, {'marketRootId', 'marketBranchId'}), 'rows');
            mT.marketMin = nan(height(mT), 1);
            mT.marketMax = nan(height(mT), 1);
            % TODO: ensure these are in the order of the market
            % table (order matters). 
            for iMarket = 1 : height(mT)
                tmpMarket = mT(iMarket, :);
                mRId = tmpMarket.marketRootId;
                mBId = tmpMarket.marketBranchId;
                % Get all markets on same or lower branch
                mTmp = marketTable((marketTable.marketRootId == mRId) &...
                    (marketTable.marketBranchId <= mBId), :);
                % Apply marketBounds iteratively
                L_ = [];
                U_ = [];
                for jMarket = 1 : height(mTmp)
                    L_tmp = mTmp.marketMin(jMarket);
                    U_tmp = mTmp.marketMax(jMarket);
                    if jMarket == 1
                        % Set initial market bounds
                        L_(jMarket) = L_tmp;
                        U_(jMarket) = U_tmp;
                    else
                        % Update lower and upper bounds
                        [L_new, U_new] = updateBounds(L_(jMarket-1),...
                            U_(jMarket-1), L_tmp, U_tmp);
                        L_(jMarket) = L_new;
                        U_(jMarket) = U_new; 
                    end
                end % jMarket
                % Upper and lower bounds are final values of this process
                mT.marketMin(iMarket) = L_(end);
                mT.marketMax(iMarket) = U_(end);
            end % iMarket
            % Output market lower and upper bounds
            marketBounds = mT(:, {'marketRootId', 'marketBranchId',...
                'marketMin' , 'marketMax'});
            
            function [L_new, U_new] = updateBounds(L, U, l, u)
                % Rule for apply new bounds to old bounds
                L_new = min(max(L, l), U);
                U_new = max(min(U, u), L);
            end % updateBounds
            
        end % constructMarketBounds
                
        % cartesianProduct - cartesianProduct product
        % makeUnitVector - unit vector with one in some position and zeros
        %                  otherwise
        
        function C = cartesianProduct(input)
            % Construct cartesianProduct product of e.g. {{[1 2]}, {[2 3]}, {[4,5]}}.
            % Used to create combination of min/max market outcomes across
            % multiple markets.
            %
            % In:
            % input (set) - set of things
            %
            % Out:
            % C (cell array) - cartesian product of input set
            
            args = input;
            n = length(input);
            [F{1:n}] = ndgrid(args{:});
            for i=n:-1:1
                G(:,i) = F{i}(:);
            end
            C = unique(G , 'rows');
        end % cartesianProduct
        
        function u = makeUnitVector(L, x)
            % Make unit vector
            %
            % In: 
            % L - length of vector
            % x - position for '1'
            %
            % Out: 
            % u (1xL vector) - unit vector length L with 1 in x positions
            %
            % e.g. makeUnitVector(5,3) -> [0 0 1 0 0]
            I = eye(L);
            u = I(x, :);
        end% makeUnitVector
                
    end % private methods
    
    methods (Access = public) % Signature methods (mock for matlab version)
         
        % generateSignatureKeys
        % signMessage
        % verifyMessage
        % signatureKey
        % signedMarketTable
        % signedOrderBook
        % verifyTradeSignature
        % verifyMarketSignature
        % verifySignature
        
%         function [signingKey_hex, verifyKey_hex] = generateSignatureKeys(this)
%             % Generate mock sig/verify pairs. (Client)
%             signingKey_hex = 'sk'
%             verifyKey_hex = 'vk';
%         end % generateSignatureKeys
        
        function signed = signMessage(this, msg, signingKey_hex)
            % Generate mock signature as message + an s (Client)
            signed = [msg, 's'];
        end %signMessage
        
        function verified = verifyMessage(this, signature, signatureMsg, verifyKey_hex)
            % For mock just check that signature is correct (Server  and
            % client)
            if strcmp(signatureMsg, [msg, 's'])
                verified = true;
            else
                verified = false;
            end
            
        end %verifyMessage
                    
        function verifyKey = getVerifyKey(this, traderId)
            % (server and client)
            %         # Get verify key for trader
            %         verifyKey =  pd.read_sql('SELECT verifyKey FROM userTable WHERE'
            %                                  ' traderId = "%s"' %(traderId), this.conn
            %                                  ).verifyKey[0]
            %         return verifyKey
            verifyKey = 'vk';
        end % verifyKey
        
%         function signatureKey = getSignatureKey(this, traderId)
%             % (client)
%             %         # Get signature key for trader (Not in production)
%             %         # TODO: Remove for production
%             %         signatureKey =  pd.read_sql('SELECT signatureKey FROM userTable WHERE'
%             %                                     ' traderId = "%s"' %(traderId), this.conn
%             %                                     ).signatureKey[0]
%             %         return signatureKey
%             signatureKey = 'sk';
%         end % signatureKey
%                        
%         %     # Chain signatures (all need to be on client side eventually)
%         
%         function signedMarketTable = signMarketTable(this, newMarket,  signatureKey_hex)
%             % (client)
%             %         # Encode signature message in bytes
%             %         msg = b'%s%s%s%s%s%s' % (newMarket.prevSig, newMarket.traderId.encode("utf-8"), newMarket.underlying.encode("utf-8"),
%             %                            str(newMarket.marketMin).encode("utf-8"), str(newMarket.marketMax).encode("utf-8"), str(newMarket.expiry).encode("utf-8"))
%             %
%             %         signedOpenMarketData = this.signMessage(msg=msg,
%             %                                                    signingKey_hex=signatureKey_hex)
%             %         return signedOpenMarketData
%             signedMarketTable = 'signedMarket';
%         end % signedMarketTable
%         
%         function signedOrderBook = signOrderBook(this, newTrade, signatureKey_hex)
%             % (client)
%             %         # Sign previous signature
%             %
%             %         # Encode signature message in bytes
%             %         msg = b'%s%s%s%s%s' % (newTrade.prevSig, newTrade.traderId.encode("utf-8"), str(newTrade.marketId).encode("utf-8"),
%             %                            str(newTrade.price).encode("utf-8"), str(newTrade.quantity).encode("utf-8"))
%             %
%             %         signedOrderBook = this.signMessage(msg=msg,
%             %                                                    signingKey_hex=signatureKey_hex)
%             %         return signedOrderBook
%             signedOrderBook = 'signedTrade';
%         end % signOrderBook       
        
        function verified = verifyTradeSignature(this, newTrade)
            % (server and client)
            % Verify trade signature is correct
            verified = this.verifySignature(newTrade.traderId, newTrade.signature, newTrade.signatureMsg);
        end % verifyTradeSignature        
        
        function verified = verifyMarketSignature(this, newMarket)
            % (server and client)
            % Verify market signature is correct
            verified = this.verifySignature(newMarket.traderId, newMarket.signature, newMarket.signatureMsg);
        end % verifyTradeSignature       
        
        function verified = verifySignature(this, traderId, signature, signatureMsg)
            % (server and client)
            %         # Vefify a signature messsage by looking up the verify key and checking
            %         verifyKey_hex = this.getVerifyKey(traderId=traderId)
            %         # Verify the message against the signature and verify key
            %         return this.verifyMessage(signature=signature,
            %                                   signatureMsg=signatureMsg,
            %                                   verifyKey_hex=verifyKey_hex)
            % Mock signature is message + 's'
            if iscell(signatureMsg)
                verified = strcmp(signature, [signatureMsg{1}, 's']);
            else
                verified = strcmp(signature, [signatureMsg, 's']);
            end
        end % verifySignature
                
    end % signature methods
    
end % MarketObject






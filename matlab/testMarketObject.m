classdef testMarketObject < matlab.unittest.TestCase
    % test MarketObject_new functionality
    
    properties
        mo % market object
    end % properties
 
    methods(TestMethodSetup)
        
        function createMarketObject(testCase)
            
            % Create market object
            testCase.mo = MarketObject();
        end % createMarketObject
        
        function testCreateMarket(testCase)
           % Create a market on (0, 1) and narrow it to (0.4, 1)
           
           % Create a market
            testCase.mo.createMarket(struct('marketRootId', 1, 'marketBranchId', 1,...
                               'marketMin', 0, 'marketMax', 1,...
                               'traderId', 1, 'previousSig', {'s'}, 'signatureMsg',{'s'},...
                               'signature', {'ss'}));                                   
       
            testCase.verifyNotEmpty(testCase.mo.marketTable)
        end % testCreateMarket
        
        function testCreateUser(testCase)
            testCase.mo = testCase.mo.createUser(struct('verifyKey','a'));
            testCase.mo = testCase.mo.createUser(struct('verifyKey','b'));
            testCase.verifyNotEmpty(testCase.mo.userTable)
        end % testCreateUser        
        
    end % TestMethodSetup
 
%     methods(TestMethodTeardown)
%         function destroyMarketObject(testCase)
%             testCase.mo = [];
%         end
%     end % TestMethodTearDown
    
    methods (Test)
        
        function testMatchTrade(testCase)
            
            % Add some trades and check a match for (q=1, p=0.5/0.4).
            % Signatures are [prevSig,s], [prevSig,ss], [prevSig,sss], 
            
            prevTrade= testCase.mo.getPreviousTrade;
            prevSig = prevTrade.signature{1};
            tradeRootId = prevTrade.tradeRootId+1;             
            
            primaryTrades1 = struct('traderId', {1; 1}, 'tradeRootId', {tradeRootId;tradeRootId}, 'tradeBranchId', {1; 1},...
                                           'price', {0.5;0.4}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {prevSig; prevSig}, 'signatureMsg',...
                                           {prevSig; prevSig}, 'signature', {[prevSig, 's']; [prevSig, 's']});
            offsetTrades1 = struct('traderId', {1; 1}, 'tradeRootId', {tradeRootId; tradeRootId}, 'tradeBranchId', {2; 2},...
                                           'price', {0.5; 0.4}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {[prevSig, 's']; [prevSig, 's']}, 'signatureMsg',...
                                           {[prevSig, 's']; [prevSig, 's']}, 'signature', {[prevSig, 'ss']; [prevSig, 'ss']});
            matchTrades1 =  struct('traderId', {1; 1}, 'tradeRootId', {tradeRootId; tradeRootId}, 'tradeBranchId', {3; 3},...
                                           'price', {0.5; 0.4}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig',{[prevSig, 'ss']; [prevSig, 'ss']}, 'signatureMsg',...
                                           {[prevSig, 'ss']; [prevSig, 'ss']}, 'signature', {[prevSig, 'sss']; [prevSig, 'sss']});
                                       
            testCase.mo = testCase.mo.createTrade(primaryTrades1, offsetTrades1, matchTrades1);
            
            % Add matching trade
            prevTrade= testCase.mo.getPreviousTrade;
            prevSig = prevTrade.signature{1};
            tradeRootId = prevTrade.tradeRootId+1;
            
            primaryTrades2 = struct('traderId', {2; 2}, 'tradeRootId', {tradeRootId;tradeRootId}, 'tradeBranchId', {1; 1},...
                                           'price', {0.5;0.6}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {prevSig; prevSig}, 'signatureMsg',...
                                           {prevSig; prevSig}, 'signature', {[prevSig, 's']; [prevSig, 's']});
            offsetTrades2 = struct('traderId', {2; 2}, 'tradeRootId', {tradeRootId; tradeRootId}, 'tradeBranchId', {2; 2},...
                                           'price', {0.5; 0.6}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {[prevSig, 's']; [prevSig, 's']}, 'signatureMsg',...
                                           {[prevSig, 's']; [prevSig, 's']}, 'signature', {[prevSig, 'ss']; [prevSig, 'ss']});
            matchTrades2 =  struct('traderId', {2; 2}, 'tradeRootId', {tradeRootId; tradeRootId}, 'tradeBranchId', {3; 3},...
                                           'price', {0.5; 0.6}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1},'previousSig', {[prevSig, 'ss']; [prevSig, 'ss']}, 'signatureMsg',...
                                           {[prevSig, 'ss']; [prevSig, 'ss']}, 'signature', {[prevSig, 'sss']; [prevSig, 'sss']});                 

            testCase.mo = testCase.mo.createTrade(primaryTrades2, offsetTrades2, matchTrades2);            
            
            % Add an unmatched trade (@0.8)
            prevTrade= testCase.mo.getPreviousTrade;
            prevSig = prevTrade.signature{1};
            tradeRootId = prevTrade.tradeRootId+1;            
            primaryTrades3 = struct('traderId', {2; 2}, 'tradeRootId', {tradeRootId;tradeRootId}, 'tradeBranchId', {1; 1},...
                                           'price', {0.8;0.9}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1},'previousSig', {prevSig; prevSig}, 'signatureMsg',...
                                           {prevSig; prevSig}, 'signature', {[prevSig, 's']; [prevSig, 's']});
            offsetTrades3 = struct('traderId', {2; 2}, 'tradeRootId', {tradeRootId; tradeRootId}, 'tradeBranchId', {2; 2},...
                                           'price', {0.8;0.9}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {[prevSig, 's']; [prevSig, 's']}, 'signatureMsg',...
                                           {[prevSig, 's']; [prevSig, 's']}, 'signature', {[prevSig, 'ss']; [prevSig, 'ss']});
            matchTrades3 =  struct('traderId', {2; 2}, 'tradeRootId', {tradeRootId; tradeRootId}, 'tradeBranchId', {3; 3},...
                                           'price', {0.8;0.9}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig',{[prevSig, 'ss']; [prevSig, 'ss']}, 'signatureMsg',...
                                           {[prevSig, 'ss']; [prevSig, 'ss']}, 'signature', {[prevSig, 'sss']; [prevSig, 'sss']});
            
            % Create trade                           
            testCase.mo = testCase.mo.createTrade(primaryTrades3, offsetTrades3, matchTrades3);   
            
            % There should be three matched trades and one open trade
            testCase.verifyEqual(height(testCase.mo.orderBook),7);

            
            % Check collateral for a fourth trade (sign off last primary)
            
            primaryTrade4 = struct('traderId', {2}, 'tradeRootId', {4}, 'tradeBranchId', {1},...
                                           'price', {0.8}, 'quantity', {-1}, 'marketRootId', {1},...
                                           'marketBranchId', {1}, 'previousSig', {'ssssss'}, 'signatureMsg',...
                                           {'ssssss'}, 'signature', {'sssssss'});
            
            
            [colChk, colNum]  = testCase.mo.checkCollateral_public(primaryTrade4);
            
            testCase.verifyTrue(colChk);
            testCase.verifyEqual(colNum, [0.8; -1.2]);
                                       
            
        end % testMatchTrade
        
        
    end % tests  
    
end % classdef 
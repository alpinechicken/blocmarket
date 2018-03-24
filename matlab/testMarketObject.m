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
            
            % Add some trades and check a match for (q=1, p=0.5/0.4)
            
            
            primaryTrades1 = struct('traderId', {1; 1}, 'tradeRootId', {1;1}, 'tradeBranchId', {1; 1},...
                                           'price', {0.5;0.4}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'s'; 's'}, 'signatureMsg',...
                                           {'s';'s'}, 'signature', {'ss';'ss'});
            offsetTrades1 = struct('traderId', {1; 1}, 'tradeRootId', {1; 1}, 'tradeBranchId', {2; 2},...
                                           'price', {0.5; 0.4}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'ss';'ss'}, 'signatureMsg',...
                                           {'ss';'ss'}, 'signature', {'sss';'sss'});
            matchTrades1 =  struct('traderId', {1; 1}, 'tradeRootId', {1; 1}, 'tradeBranchId', {3; 3},...
                                           'price', {0.5; 0.4}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'sss';'sss'}, 'signatureMsg',...
                                           {'sss';'sss'}, 'signature', {'ssss';'ssss'});                       

            testCase.mo = testCase.mo.createTrade(primaryTrades1, offsetTrades1, matchTrades1);
            
            % Add matching trade
            primaryTrades2 = struct('traderId', {2; 2}, 'tradeRootId', {2;2}, 'tradeBranchId', {1; 1},...
                                           'price', {0.5;0.6}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'ss';'ss'}, 'signatureMsg',...
                                           {'ss';'ss'}, 'signature', {'sss';'sss'});
            offsetTrades2 = struct('traderId', {2; 2}, 'tradeRootId', {2; 2}, 'tradeBranchId', {2; 2},...
                                           'price', {0.5; 0.6}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'sss';'sss'}, 'signatureMsg',...
                                           {'sss';'sss'}, 'signature', {'ssss';'ssss'});
            matchTrades2 =  struct('traderId', {2; 2}, 'tradeRootId', {2; 2}, 'tradeBranchId', {3; 3},...
                                           'price', {0.5; 0.6}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'ssss';'ssss'}, 'signatureMsg',...
                                           {'ssss';'ssss'}, 'signature', {'sssss';'sssss'});                        

            testCase.mo = testCase.mo.createTrade(primaryTrades2, offsetTrades2, matchTrades2);            
            
            % Add an unmatched trade (@0.8)
            primaryTrades3 = struct('traderId', {2; 2}, 'tradeRootId', {3;3}, 'tradeBranchId', {1; 1},...
                                           'price', {0.8;0.9}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'sssss';'sssss'}, 'signatureMsg',...
                                           {'sssss';'sssss'}, 'signature', {'ssssss';'ssssss'});
            offsetTrades3 = struct('traderId', {2; 2}, 'tradeRootId', {3; 3}, 'tradeBranchId', {2; 2},...
                                           'price', {0.8;0.9}, 'quantity', {1; 1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'ssssss';'ssssss'}, 'signatureMsg',...
                                           {'ssssss';'ssssss'}, 'signature', {'sssssss';'sssssss'});
            matchTrades3 =  struct('traderId', {2; 2}, 'tradeRootId', {3; 3}, 'tradeBranchId', {3; 3},...
                                           'price', {0.8;0.9}, 'quantity', {-1; -1}, 'marketRootId', {1; 1},...
                                           'marketBranchId', {1; 1}, 'previousSig', {'sssssss';'sssssss'}, 'signatureMsg',...
                                           {'sssssss';'sssssss'}, 'signature', {'ssssssss';'ssssssss'});  
            
            % Create trade                           
            testCase.mo = testCase.mo.createTrade(primaryTrades3, offsetTrades3, matchTrades3);   
            
            % There should be three matched trades and one open trade
            testCase.verifyEqual(height(testCase.mo.orderBook),7);

            
            % Check collateral for a fourth trade (sign off last primary)
            
            primaryTrade4 = struct('traderId', {2}, 'tradeRootId', {4}, 'tradeBranchId', {1},...
                                           'price', {0.8}, 'quantity', {-1}, 'marketRootId', {1},...
                                           'marketBranchId', {1}, 'previousSig', {'ssssss'}, 'signatureMsg',...
                                           {'ssssss'}, 'signature', {'sssssss'});
            
            
            [colChk, colNum]  =testCase.mo.checkCollateral_public(primaryTrade4);
            
            testCase.verifyTrue(colChk);
            testCase.verifyEqual(colNum, [0.8; -1.2]);
                                       
            
        end % testMatchTrade
        
%    
%         function testSettleTrade(testCase)
%             
%             % Match a trade  at (p=0.5,q=10) and settle market by
%             % setting mark etMax=marketMin=1, then add a new trade that
%             % won't  pass collateral check.
%             
%             testCase.mo.createTrade(struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 10, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig'));
%             
%             
%             testCase.mo.createTrade(struct('traderId', 2, 'tradeRootId', 2, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', -10, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig'));
%             
%             % Settle market at 1
%             
%             testCase.mo.createMarket(struct('marketRootId', 1, 'marketBranchId', 1,...
%                 'marketMin', 1, 'marketMax', 1,...
%                 'traderId', 1, 'signatureMsg','sigmsg1',...
%                 'signature', 'sig1'));   
%             
%             % Add large trade priced at settlement price (will pass collateral) (q=1e6, p=1)
%             
%             testCase.mo.createTrade(struct('traderId', 1, 'tradeRootId', 3, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 1,...
%                 'quantity', 1e6, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig'));
%             
%             testCase.mo.createTrade(struct('traderId', 2, 'tradeRootId', 3, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 1,...
%                 'quantity', -1e6, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig'));
%             
%             testCase.verifyEqual(height(testCase.mo.orderBook), 12)
%             
%             % Add large trade priced at less than settlement (will fail collateral check)
%             testCase.mo.createTrade(struct('traderId', 2, 'tradeRootId', 3, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.9,...
%                 'quantity', -1e6, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig'));            
%             
%             % Height should not have changed
%             testCase.verifyEqual(height(testCase.mo.orderBook), 12)
%             
%         end  % testSettleCase
%         
%         function testSubMarket(testCase)
%             % Test market branch by settling lower branch market and
%             % looking moving collateral cases in upper branch
%             % 
%             % > m11 = (root = 1, branch = 1)
%             %   m12 = (root = 1, branch = 2)
%             %   m13 = (root = 1, branch = 3)
%             % > check collateral on m12 
%             
%             
%             % Settle m12 at 0
%             testCase.mo.createMarket(struct('marketRootId', 1, 'marketBranchId', 2,...
%                                 'marketMin', 0, 'marketMax', 0,...
%                                 'traderId', 1, 'signatureMsg','sigmsg1',...
%                                 'signature', 'sig1'));
%                             
%             % Create submarket m13 (min = 0, max = 1)          
%             testCase.mo.createMarket(struct('marketRootId', 1, 'marketBranchId', 3,...
%                 'marketMin', 0, 'marketMax', 1,...
%                 'traderId', 1, 'signatureMsg','sigmsg1',...
%                 'signature', 'sig1'));
%             
%             % Construct new trade (p = 0.5, q = 10) on m13
%             newTrade13 = struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 10, 'marketRootId', 1,...
%                 'marketBranchId', 3,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig');
%             
%             % Check collateral on open order on m13 (should be settled via
%             % m12)
%             [colChk, netCollateral] = testCase.mo.checkCollateral_public(newTrade13)
%             testCase.verifyEqual(netCollateral, [-5; -5]);
%             
%             % Check collateral for (p=0.5, q=10) on m11 (should still be
%             % [-1,5])
%             newTrade11 = struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 10, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig')
%             % Check collateral on open order on m11
%             [colChk, netCollateral] = testCase.mo.checkCollateral_public(newTrade11);
%             testCase.verifyLessThan( max(abs(netCollateral- [-1; 5])), 1e-9);
%             
%             
%         end % testSubMarket
%         
%         function testMultiMarket(testCase)
%             % Test for three independent markets and check collateral  of
%             % one open orders on each.
%             %
%             % Create market 2
%             testCase.mo.createMarket(struct('marketRootId', 2, 'marketBranchId', 1,...
%                                 'marketMin', 0, 'marketMax', 1,...
%                                 'traderId', 1, 'signatureMsg','sigmsg1',...
%                                 'signature', 'sig1'));
%             % Create market 3                
%             testCase.mo.createMarket(struct('marketRootId', 3, 'marketBranchId', 1,...
%                                 'marketMin', 0, 'marketMax', 1,...
%                                 'traderId', 1, 'signatureMsg','sigmsg1',...
%                                 'signature', 'sig1'));                            
%                             
%                             
%             % Create open trade in m11
%             newTrade11 = struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 10, 'marketRootId', 1,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig')
%             testCase.mo.createTrade(newTrade11);
%             
%             % Create open trade in m21
%             newTrade21 = struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 10, 'marketRootId', 2,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig');
%             testCase.mo.createTrade(newTrade21);
%             
%             % Create open trade in m31
%             newTrade31 = struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 10, 'marketRootId', 3,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig');
%             testCase.mo.createTrade(newTrade31);            
%             
%             % Check collateral of new open order on m31
%             newTrade31_ = struct('traderId', 1, 'tradeRootId', 1, 'tradeBranchId', 1,...
%                 'isMatched', 0, 'price', 0.5,...
%                 'quantity', 5, 'marketRootId', 3,...
%                 'marketBranchId', 1,'signatureMsg',...
%                 'sigMsg', 'signature', 'sig');
%             
%             % Check collateral of open trades and new  trade
%             [colChk, netCollateral] = testCase.mo.checkCollateral_public(newTrade31_) 
%             testCase.verifyLessThan( max(abs(netCollateral- [-7.5; -2.5; -7.5; 1.5; -7.5; -2.5; -7.5; 7.5])), 1e-9)            
%             
%         end % testMultiMarket
        
    end % tests  
    
end % classdef 
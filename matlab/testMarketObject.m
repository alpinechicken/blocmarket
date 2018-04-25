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
           % Create a market on (0, 1) and a sub market (0.1, 0.9)
           
           % Create market11            
            testMarket = marketMaker(testCase.mo, 1, 1, 0, 1, 1)
            testCase.mo.createMarket(testMarket);   
             
           % Create a branch of first market  
           testMarket = marketMaker(testCase.mo, 1, 2, 0.1, 0.9, 1)
           testCase.mo.createMarket(testMarket);                           
       
           testCase.verifyNotEmpty(testCase.mo.marketTable)
        end % testCreateMarket
        
        function testCreateUser(testCase)
            % Create two traders
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
        
        function testSettleMarketUp(testCase)
            % Settle root market (1,1) at 1 and ensure that
            % - Market (1,1) settles at 1
            % - Market (1,2) settles at 0.9
            settleMarket= marketMaker(testCase.mo, 1, 1, 1, 1, 1);
            testCase.mo = testCase.mo.createMarket(settleMarket);
            marketBounds = testCase.mo.marketBounds;
            expectedBounds = table([1;1], [1;2], [1;0.9], [1;0.9],...
                'VariableNames', {'marketRootId', 'marketBranchId',...
                'marketMin', 'marketMax'});
            import matlab.unittest.constraints.TableComparator
            import matlab.unittest.constraints.NumericComparator
            import matlab.unittest.constraints.IsEqualTo
            testCase.verifyThat(marketBounds,IsEqualTo(expectedBounds, ...
                'Using',TableComparator(NumericComparator)));
        end % testSettleMarketUp
        
        function testSettleMarketDown(testCase)
            % Settle root market (1,1) at 0 and ensure that
            % - Market (1,1) settles at 0
            % - Market (1,2) settles at 0.1
            settleMarket= marketMaker(testCase.mo, 1, 1, 0, 0, 1);
            testCase.mo = testCase.mo.createMarket(settleMarket);
            marketBounds = testCase.mo.marketBounds;
            expectedBounds = table([1;1], [1;2], [0;0.1], [0;0.1],...
                'VariableNames', {'marketRootId', 'marketBranchId',...
                'marketMin', 'marketMax'});
            import matlab.unittest.constraints.TableComparator
            import matlab.unittest.constraints.NumericComparator
            import matlab.unittest.constraints.IsEqualTo
            testCase.verifyThat(marketBounds,IsEqualTo(expectedBounds, ...
                'Using',TableComparator(NumericComparator)));
        end % testSettleMarketDown        
        
        function testMatchTrade(testCase)
            
            % Add some trades and check a match for (q=1, p=0.5/0.4).
            
            tradePackage =  tradeMaker(testCase.mo, 1, 1, 1, [0.5; 0.4], 1);          
            testCase.mo = testCase.mo.createTrade(tradePackage);
            
            % Add matching trade by for trader 2 in same market
            tradePackage =  tradeMaker(testCase.mo, 2, 1, 1, [0.5; 0.6], -1);          
       
            testCase.mo = testCase.mo.createTrade(tradePackage);            
            
            % Add an unmatched trade (@0.8/0.9)
            tradePackage =  tradeMaker(testCase.mo, 2, 1, 1, [0.8; 0.9], -1);       
            
            % Create trade                           
            testCase.mo = testCase.mo.createTrade(tradePackage);   
            
            % There should be three matched trades and one open trade
            testCase.verifyEqual(height(testCase.mo.orderBook),7);
            
            % Check collateral for a fourth trade (sign off last primary)            
            tradePackage =  tradeMaker(testCase.mo, 2, 1, 1, [0.9], -1);    
           
            [colChk, colNum]  = testCase.mo.checkCollateral_public(tradePackage.primaryTrade);
            
            testCase.verifyTrue(all(colChk));
            testCase.verifyEqual(colNum, [-0.5 1.3; 0.5 -0.7], 'AbsTol', 1e-10);                                     
            
        end % testMatchTrade
        
        
    end % tests  
    
end % classdef 
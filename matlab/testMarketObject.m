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
           
           % Create market11            
            testMarket = marketMaker(testCase.mo, 1, 1, 0, 1, 1)
            testCase.mo.createMarket(testMarket);   
             
           % Create a branch of first market  
           testMarket = marketMaker(testCase.mo, 1, 2, 0.1, 0.9, 1)
           testCase.mo.createMarket(testMarket);                           
       
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
            tradePackage =  tradeMaker(testCase.mo, 2, 1, 1, [0.8], -1);    
           
            [colChk, colNum]  = testCase.mo.checkCollateral_public(tradePackage.primaryTrade);
            
            testCase.verifyTrue(colChk);
            testCase.verifyEqual(colNum, [2.1; -0.9], 'AbsTol', 1e-10);

                                       
            
        end % testMatchTrade
        
        
    end % tests  
    
end % classdef 
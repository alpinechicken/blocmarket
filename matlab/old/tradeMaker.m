function tradePackage = tradeMaker(mo, traderId, marketRootId, marketBranchId, price, quantity)
% Create test trade package with dummy +s signatures

% Example:
% tradePackage = tradeMaker(mo, 1, 1, 1, [0.5; 0.4], 1)

prevTrade= mo.getPreviousTrade;
prevSig = prevTrade.signature{1};
tradeRootId = prevTrade.tradeRootId+1;


traderId_ = repmat({traderId}, size(price));
tradeRootId_ = repmat({tradeRootId}, size(price));
tradeBranchId_p = repmat({1}, size(price));
tradeBranchId_o = repmat({2}, size(price));
tradeBranchId_m = repmat({3}, size(price));
price_ = num2cell(price);
quantity_ = repmat({quantity}, size(price));
negQuantity_ = repmat({-quantity}, size(price));

marketRootId_ = repmat({marketRootId}, size(price));
marketBranchId_ = repmat({marketBranchId}, size(price));
prevSig_p = repmat({prevSig}, size(price));
prevSig_o = repmat({[prevSig  's']}, size(price));
prevSig_m = repmat({[prevSig  'ss']}, size(price));
sig_p = prevSig_o;
sig_o = prevSig_m;
sig_m = repmat({[prevSig  'sss']}, size(price));


pT = struct('traderId', traderId_, 'tradeRootId', tradeRootId_, 'tradeBranchId', tradeBranchId_p,...
    'price', price_, 'quantity', quantity_, 'marketRootId', marketRootId_,...
    'marketBranchId', marketBranchId_, 'previousSig', prevSig_p, 'signatureMsg',...
    prevSig_p, 'signature', sig_p);
oT = struct('traderId', traderId_, 'tradeRootId', tradeRootId_, 'tradeBranchId', tradeBranchId_o,...
    'price', price_, 'quantity', negQuantity_, 'marketRootId', marketRootId,...
    'marketBranchId', marketBranchId, 'previousSig', prevSig_o, 'signatureMsg',...
    prevSig_o, 'signature', sig_o);
mT =  struct('traderId', traderId_, 'tradeRootId', tradeRootId_, 'tradeBranchId', tradeBranchId_m,...
    'price', price_, 'quantity', quantity_, 'marketRootId', marketRootId_,...
    'marketBranchId', marketBranchId_, 'previousSig', prevSig_m, 'signatureMsg',...
    prevSig_m, 'signature', sig_m);

tradePackage.primaryTrade = pT;
tradePackage.offsetTrade = oT;
tradePackage.matchTrade = mT;

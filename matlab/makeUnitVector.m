function u = makeUnitVector(L, x)
% Make unit vector of lenght L with 1 in the x row and 0 elsewhere

I = eye(L);
u = I(x,:);

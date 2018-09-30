--

CREATE TABLE orderBook (
	tradeRootId INTEGER, 
	tradeBranchId INTEGER, 
	price FLOAT, 
	quantity FLOAT, 
	marketRootId INTEGER, 
	marketBranchId INTEGER, 
	traderId INTEGER, 
	previousSig BLOB, 
	signatureMsg BLOB, 
	signature BLOB
)
CREATE TABLE userTable (
	traderId INTEGER NOT NULL, 
	verifyKey VARCHAR, 
	PRIMARY KEY (traderId)
)
CREATE TABLE marketTable (
	marketRootId INTEGER, 
	marketBranchId INTEGER, 
	marketMin FLOAT, 
	marketMax FLOAT, 
	traderId INTEGER, 
	previousSig BLOB, 
	signatureMsg BLOB, 
	signature BLOB
)
CREATE TABLE cacheBook (
	tradeRootId INTEGER, 
	tradeBranchId INTEGER, 
	price FLOAT, 
	quantity FLOAT, 
	marketRootId INTEGER, 
	marketBranchId INTEGER, 
	traderId INTEGER, 
	previousSig BLOB, 
	signatureMsg BLOB, 
	signature BLOB
)
CREATE TABLE tradeState (
	index BIGINT, 
	tradeRootId BIGINT, 
	tradeBranchId BIGINT, 
	isOpen BOOLEAN, 
	isOffset BOOLEAN, 
	isMatched BOOLEAN, 
	CHECK (isOpen IN (0, 1)), 
	CHECK (isOffset IN (0, 1)), 
	CHECK (isMatched IN (0, 1))
)
--CREATE INDEX ix_tradeState_index ON tradeState (index)
CREATE TABLE outcomeCombinations (
	index BIGINT, 
	marketRootId BIGINT, 
	marketBranchId BIGINT, 
	marketMin FLOAT, 
	marketMax FLOAT, 
	outcomeId BIGINT
)
--CREATE INDEX ix_outcomeCombinations_index ON outcomeCombinations (index)
CREATE TABLE marketBounds (
	index BIGINT, 
	marketRootId BIGINT, 
	marketBranchId BIGINT, 
	marketMin FLOAT, 
	marketMax FLOAT
)
--CREATE INDEX ix_marketBounds_index ON marketBounds (index)

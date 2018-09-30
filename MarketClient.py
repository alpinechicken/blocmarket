
import pandas as pd


# Crypto imports
import nacl.encoding
import nacl.signing


class MarketClient(object):
    # 'Market client class'

    def __init__(self):
        self.signingKey_hex = []
        self.verifyKey_hex = []

    def generateSignatureKeys(self):
        #  Generate signature key pairs.

        # Create signing key
        signingKey = nacl.signing.SigningKey.generate()
        # Obtain the verify key for a given signing key
        verifyKey = signingKey.verify_key

        # Serialize the verify key to send it to a third party
        signingKey_hex = signingKey.encode(encoder=nacl.encoding.HexEncoder)
        verifyKey_hex = verifyKey.encode(encoder=nacl.encoding.HexEncoder)

        # Set as properties
        self.signingKey_hex = signingKey_hex.decode('UTF-8')
        self.verifyKey_hex = verifyKey_hex.decode('UTF-8')

        return signingKey_hex, verifyKey_hex

    def signMessage(self, msg: object, signingKey_hex: str) -> object:
        # Sign a message
        signingKey_bytes = b'%s' % str.encode(signingKey_hex, 'utf-8')
        # Generate signing key
        signingKey = nacl.signing.SigningKey(signingKey_bytes,
                                             encoder=nacl.encoding.HexEncoder)
        # Sign message
        signed = signingKey.sign(msg)
        return signed

    def verifyMessage(self, signature: bytes,
                      signatureMsg: bytes,
                      verifyKey_hex: str) -> object:
        # Verify message
        verifyKey = nacl.signing.VerifyKey(verifyKey_hex,
                                           encoder=nacl.encoding.HexEncoder)
        verified = verifyKey.verify(signatureMsg, signature=signature)
        return verified

    def signMarketTable(self, marketRow: object,
                        previousMarketRow: object,
                        signatureKey_hex: str) -> object:
        # Sign market row
        msg = \
        str(marketRow.loc[0,'marketRootId']).encode("utf-8")+\
        str(marketRow.loc[0,'marketBranchId']).encode("utf-8")+\
        str(marketRow.loc[0, 'marketBranchId']).encode("utf-8")+ \
        str(marketRow.loc[0, 'marketMin']).encode("utf-8") + \
        str(marketRow.loc[0,'marketMax']).encode("utf-8")+\
        str(marketRow.loc[0, 'marketMax']).encode("utf-8")+\
        previousMarketRow.loc[0, 'signature'] + b'end'

        sig = self.signMessage(msg=msg, signingKey_hex=signatureKey_hex)
        newMarketRow = pd.DataFrame({'marketRootId': marketRow['marketRootId'],
                                     'marketBranchId': marketRow['marketBranchId'],
                                     'marketMin': marketRow['marketMin'],
                                     'marketMax': marketRow['marketMax'],
                                     'previousSig': previousMarketRow['signature'],
                                     'signatureMsg': sig.message,
                                     'signature': sig.signature,
                                     'traderId': marketRow['traderId']})

        signedMarketTable = newMarketRow.reset_index(drop=True)
        return signedMarketTable

    def signOrderBook(self, orderRow: object,
                      previousOrderRow: object,
                      signatureKey_hex: str) -> object:
        # Sign previous signature (all columns in order up to previous signature)

        # Encode signature message in bytes
        msg =\
            str(orderRow.loc[0,'tradeRootId']).encode("utf-8")+\
            str(orderRow.loc[0,'tradeBranchId']).encode("utf-8")+\
            str(orderRow.loc[0,'price']).encode("utf-8")+\
            str(orderRow.loc[0,'quantity']).encode("utf-8")+\
            str(orderRow.loc[0,'marketRootId']).encode('utf-8')+\
            str(orderRow.loc[0,'marketBranchId']).encode("utf-8")+\
            str(orderRow.loc[0,'traderId']).encode("utf-8")+\
            previousOrderRow.loc[0,'signature'] + b'end'
        # Sign message
        sig = self.signMessage(msg=msg, signingKey_hex=signatureKey_hex)
        # Debugging chk that signature is correct
        chk = self.verifyMessage(signature=sig.signature, signatureMsg=msg,
                           verifyKey_hex=self.verifyKey_hex)
        newOrderRow = pd.DataFrame({'tradeRootId': orderRow['tradeRootId'],
                                   'tradeBranchId': orderRow['tradeBranchId'],
                                   'price': orderRow['price'],
                                   'quantity': orderRow['quantity'],
                                   'marketRootId': orderRow['marketRootId'],
                                   'marketBranchId': orderRow['marketBranchId'],
                                   'traderId': orderRow['traderId'],
                                   'previousSig': previousOrderRow['signature'],
                                   'signatureMsg': sig.message,
                                   'signature': sig.signature})
        # # Debugging check that orderRow has correct sig
        chk = newOrderRow['signature'] == bytes(sig.signature)
        signedOrderBook = newOrderRow
        return signedOrderBook

    def tradeMaker(self, prevTrade: object,
                   tradeRow: object)->object:
        # Construct a signed trade package (primary/offset/match), possibly
        # for list of prices.

        if isinstance(tradeRow.loc[0,'price'], list):
            numPrices = len(tradeRow.loc[0,'price'])
        else:
            numPrices = 1

        tradeRootId = prevTrade.loc[0,'tradeRootId'] + 1
        #  Sign trades
        pT = pd.DataFrame()
        oT = pd.DataFrame()
        mT = pd.DataFrame()
        for iPrice in range(numPrices):
            # Generate primary trade
            if isinstance(tradeRow.loc[0,'price'], list):
                price = float(tradeRow.loc[0,'price'][iPrice])
            else:
                price = float(tradeRow.loc[0,'price'])

            # Generate primary trade
            t = pd.DataFrame({'tradeRootId': [float(tradeRootId)],
                              'tradeBranchId': [1],
                              'marketRootId': [float(tradeRow.loc[0,'marketRootId'])],
                              'marketBranchId': [float(tradeRow.loc[0,'marketBranchId'])],
                              'price': [price],
                              'quantity': [float(tradeRow.loc[0,'quantity'])],
                              'traderId': [float(tradeRow.loc[0,'traderId'])]})
            p = self.signOrderBook(orderRow=t, previousOrderRow=prevTrade,
                                   signatureKey_hex=self.signingKey_hex)
            chk = self.verifyMessage(signature=p.loc[0,'signature'],
                               signatureMsg=p.loc[0,'signatureMsg'],
                               verifyKey_hex=self.verifyKey_hex)
            pT = pd.concat([pT, p])
            #  Generate offset trade
            o = t.loc[:,['tradeRootId', 'marketRootId', 'marketBranchId', 'price', 'traderId']]
            o.loc[0,'quantity'] = t.loc[0,'quantity'] * -1
            o.loc[0,'tradeBranchId'] = 2
            o = self.signOrderBook(orderRow=o, previousOrderRow=p,
                                   signatureKey_hex=self.signingKey_hex)
            chk = self.verifyMessage(signature=o.loc[0,'signature'],
                               signatureMsg=o.loc[0,'signatureMsg'],
                               verifyKey_hex=self.verifyKey_hex)
            oT = pd.concat([oT, o])
            # Generate match trade
            m = o.loc[:,['tradeRootId', 'marketRootId', 'marketBranchId', 'price', 'traderId']]
            m.loc[0,'quantity'] = o.loc[0,'quantity'] * -1
            m.loc[0,'tradeBranchId'] = 3
            m = self.signOrderBook(orderRow=m, previousOrderRow=o,
                                   signatureKey_hex=self.signingKey_hex)
            chk = self.verifyMessage(signature=m.loc[0,'signature'],
                               signatureMsg=m.loc[0,'signatureMsg'],
                               verifyKey_hex=self.verifyKey_hex)
            mT = pd.concat([mT, m])

        tradePackage = pd.concat([pT, oT, mT]).reset_index(drop=True)

        return tradePackage

    def marketMaker(self, previousMarketRow: object,
                    marketRow: object) -> object:
        #  Construct a signed market row

        marketPackage = self.signMarketTable(marketRow=marketRow,
                                         previousMarketRow=previousMarketRow,
                                         signatureKey_hex=self.signingKey_hex)

        return marketPackage

    # Create functions for the 'client'. At present these pass in a MarketServer
    # object but a proper version they will send to a remote server somewhere.
    #
    # createUser_client()
    # createTrade_client()
    # createMarket_client()

    def createUser_client(self, marketServer=None):
        """Wrapper for createUser from marketServer"""
        # When this is split out, create user  by sending a post request to the
        # createUser() endpoint rather than to a local version of MarketServer.
        # (need to import requests)
        newUsr = marketServer.createUser(self.verifyKey_hex)
        return newUsr

    def createTrade_client(self, tradeRow:object, marketServer=None):
         """
         Wrapper for createTrade from marketServer
         :param: tradeRow: (DataFrame) trade
         :param: marketServer: (MarketServer) market server

         :return allTradeChecks: (boolean) True if all trade checks pass
         :return colChk: (boolean) True if collateral checks pass

         Example::
         ms = MarketServer()
         mc = MarketClient()
         ...
         tradeRow = pd.DataFrame({'marketRootId': [1],
                                 'marketBranchId': [1],
                                 'price': [[0.5, 0.4]],
                                 'quantity': [1],
                                 'traderId': [1]})
         mc.createTrade_client(tradeRow=tradeRow, MarketServer = ms)
         """
         prevTrade = marketServer.getPreviousTrade()
         tradePackage = self.tradeMaker(prevTrade=prevTrade,
                                        tradeRow=tradeRow).reset_index(drop=True)
         allTradeChks, colChk = marketServer.createTrade(tradePackage=tradePackage)
         return allTradeChks, colChk

    def createMarket_client(self, marketRow: object, marketServer=None):
        """
        Wrapper for createMarket from marketServer.

        :param: marketRow: (DataFrame) market
        :param: marketServer: (MarketServer) market server

        :return: checks (bool) true if market created

        Example::
        ms = MarketServer()
        mc = MarketClient()
        ...
        marketRow = pd.DataFrame({'marketRootId': [1],
                              'marketBranchId': [1],
                              'marketMin': [0],
                              'marketMax': [0],
                              'traderId': [1]})
         mc.createMarket_client(marketRow=marketRow, MarketServer = ms)

         .. note::
        """

        prevMarket = marketServer.getPreviousMarket()
        testMarket = self.marketMaker(prevMarket, marketRow)
        checks = marketServer.createMarket(newMarket=testMarket)
        return checks



# - Think about splitting out mc/ms:
# => Modify or split out MarketClient.createUser_client()/createTrade_client()/createMarket_client() so that instead of taking a
# MarketServer object they just talk to the api endpoints for the MarketServer with json post requests.
# =>


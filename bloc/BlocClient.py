
import pandas as pd


# Crypto imports
import nacl.encoding
import nacl.signing


class BlocClient(object):
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
        signingKey = nacl.signing.SigningKey(signingKey_bytes, encoder=nacl.encoding.HexEncoder)
        # Sign message
        signed = signingKey.sign(msg)
        return signed

    def verifyMessage(self, signature: bytes,
                      signatureMsg: bytes,
                      verifyKey_hex: str) -> object:
        # Verify message
        verifyKey = nacl.signing.VerifyKey(verifyKey_hex, encoder=nacl.encoding.HexEncoder)
        verified = verifyKey.verify(signatureMsg, signature=signature)
        return verified

    def signMarketTable(self, marketRow: object,
                        previousMarketRow: object,
                        signatureKey_hex: str) -> object:
        # Sign market row
        msg = \
            str(marketRow.loc[0,'marketRootId']).encode("utf-8")+\
            str(marketRow.loc[0,'marketBranchId']).encode("utf-8")+\
            str(marketRow.loc[0, 'marketMin']).encode("utf-8") + \
            str(marketRow.loc[0,'marketMax']).encode("utf-8")+ \
            str(marketRow.loc[0, 'traderId']).encode("utf-8") + \
            previousMarketRow.loc[0, 'signature'] + b'end'

        sig = self.signMessage(msg=msg, signingKey_hex=signatureKey_hex)
        newMarketRow = pd.DataFrame({'marketRootId': marketRow['marketRootId'],
                                     'marketBranchId': marketRow['marketBranchId'],
                                     'marketMin': marketRow['marketMin'],
                                     'marketMax': marketRow['marketMax'],
                                     'traderId': marketRow['traderId'],
                                     'previousSig': bytes(previousMarketRow.loc[0, 'signature']),
                                     'signature': sig.signature})

        signedMarketTable = newMarketRow.reset_index(drop=True)
        return signedMarketTable

    def signOrderBook(self, orderRow: object,
                      previousOrderRow: object,
                      signatureKey_hex: str) -> object:
        # Sign previous signature (all columns in order up to previous signature)

        # Encode signature message in bytes
        msg =\
            str(orderRow.loc[0,'price']).encode("utf-8")+\
            str(orderRow.loc[0,'quantity']).encode("utf-8")+\
            str(orderRow.loc[0,'marketId']).encode('utf-8')+\
            str(orderRow.loc[0,'traderId']).encode("utf-8")+\
            previousOrderRow.loc[0,'signature'] + b'end'
        # Sign message
        sig = self.signMessage(msg=msg, signingKey_hex=signatureKey_hex)
        # Debugging chk that signature is correct
        chk = self.verifyMessage(signature=sig.signature, signatureMsg=msg,
                           verifyKey_hex=self.verifyKey_hex)
        newOrderRow = pd.DataFrame({
                                   'price': orderRow['price'],
                                   'quantity': orderRow['quantity'],
                                   'marketId': orderRow['marketId'],
                                   'traderId': orderRow['traderId'],
                                   'previousSig': bytes(previousOrderRow.loc[0,'signature']),
                                   'signatureMsg': msg,
                                   'signature': sig.signature})
        # # Debugging check that orderRow has correct signature
        chk = newOrderRow['signature'] == bytes(sig.signature)
        signedOrderBook = newOrderRow
        return signedOrderBook

    def tradeMaker(self, prevTrade: object,
                   tradeRow: object)->object:
        # Construct a signed trade

        # tradeId = prevTrade.loc[0,'tradeId'] + 1

        # Generate primary trade
        t = pd.DataFrame({'marketId': [int(tradeRow.loc[0, 'marketId'])],
                          'price': [float(tradeRow.loc[0, 'price'])],
                          'quantity': [float(tradeRow.loc[0, 'quantity'])],
                          'traderId': [int(tradeRow.loc[0, 'traderId'])]})
        p = self.signOrderBook(orderRow=t, previousOrderRow=prevTrade,
                               signatureKey_hex=self.signingKey_hex)
        chk = self.verifyMessage(signature=p.loc[0, 'signature'],
                                 signatureMsg=p.loc[0, 'signatureMsg'],
                                 verifyKey_hex=self.verifyKey_hex)
        tradePackage = p

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

    def createUser_client(self, blocServer=None):
        """Wrapper for createUser from marketServer"""
        # When this is split out, create user  by sending a post request to the
        # createUser() endpoint rather than to a local version of BlocServer.
        # (need to import requests)
        newUsr = blocServer.createUser(self.verifyKey_hex)
        return newUsr

    def createTrade_client(self, tradeRow:object, blocServer=None):
         """
         Wrapper for createTrade from blocServer
         :param: tradeRow: (DataFrame) trade
         :param: blocServer: (BlocServer) market server

         :return allTradeChecks: (boolean) True if all trade checks pass
         :return colChk: (boolean) True if collateral checks pass

         Example::
         bs = BlocServer()
         bc = BlocClient()
         ...
         tradeRow = pd.DataFrame({'marketRootId': [1],
                                 'marketBranchId': [1],
                                 'price': [[0.5, 0.4]],
                                 'quantity': [1],
                                 'traderId': [1]})
         mc.createTrade_client(tradeRow=tradeRow, BlocServer = bs)
         """
         prevTrade = blocServer.getPreviousOrder()
         tradePackage = self.tradeMaker(prevTrade=prevTrade, tradeRow=tradeRow).reset_index(drop=True)

         colChk = blocServer.createTrade(p_=tradePackage['price'][0],
                                         q_=tradePackage['quantity'][0],
                                         mInd_= tradePackage['marketId'][0],
                                         tInd_= tradePackage['traderId'][0],
                                         previousSig=tradePackage['previousSig'][0],
                                         signature=tradePackage['signature'][0],
                                         verifyKey=self.verifyKey_hex)
         return colChk

    def createMarket_client(self, marketRow: object, blocServer=None):
        """
        Wrapper for createMarket from marketServer.

        :param: marketRow: (DataFrame) market
        :param: blocServer: (BlocServer) market server

        :return: checks (bool) true if market created

         Example::
         bs = BlocServer()
         bc = BlocClient()
        ...
        marketRow = pd.DataFrame({'marketRootId': [1],
                              'marketBranchId': [1],
                              'marketMin': [0],
                              'marketMax': [0],
                              'traderId': [1]})
         bc.createMarket_client(marketRow=marketRow, blocServer = bs)

         .. note::
        """

        prevMarket = blocServer.getPreviousMarket()
        testMarket = self.marketMaker(prevMarket, marketRow)

        checks = blocServer.createMarket(marketRootId=testMarket['marketRootId'][0],
                                marketBranchId=testMarket['marketBranchId'][0],
                                marketMin=testMarket['marketMin'][0],
                                marketMax=testMarket['marketMax'][0],
                                traderId=testMarket['traderId'][0],
                                previousSig=testMarket['previousSig'][0],
                                signature=testMarket['signature'][0],
                                verifyKey=self.verifyKey_hex)
        return checks


from bloc.BlocServer import BlocServer
from bloc.BlocClient import BlocClient

bs = BlocServer()
bc = BlocClient()

bc.generateSignatureKeys()

bc.createUser_client(bs)

marketRow = pd.DataFrame({'marketRootId': [1],
                          'marketBranchId': [1],
                              'marketMin': [0],
                              'marketMax': [0],
                              'traderId': [1]})
bc.createMarket_client(marketRow=marketRow, blocServer = bs)

tradeRow = pd.DataFrame({'marketId': [1],
                         'price': [0.5],
                         'quantity': [1],
                         'traderId': [1]})
bc.createTrade_client(tradeRow=tradeRow, blocServer=bs)
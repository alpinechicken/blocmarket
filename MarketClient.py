
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
        msg = b'%s%s%s%s%s%s' % (
        str(marketRow['marketRootId'][0]).encode("utf-8"),
        str(marketRow['marketBranchId'][0]).encode("utf-8"),
        str(marketRow['marketMin'][0]).encode("utf-8"),
        str(marketRow['marketMax'][0]).encode("utf-8"),
        str(marketRow['traderId'][0]).encode("utf-8"),
        previousMarketRow['signature'][0]
        )

        sig = self.signMessage(msg=msg, signingKey_hex=signatureKey_hex)
        marketRow['previousSig'] = previousMarketRow['signature'][0]
        marketRow['signatureMsg'] = sig.message
        marketRow['signature'] = sig.signature

        signedMarketTable = marketRow.reset_index(drop=True)
        return signedMarketTable

    def signOrderBook(self, orderRow: object,
                      previousOrderRow: object,
                      signatureKey_hex: str) -> object:
        # Sign previous signature (all columns in order up to previous signature)

        # Encode signature message in bytes
        msg = b'%s%s%s%s%s%s%s%s' % (
            str(orderRow['tradeRootId'][0]).encode("utf-8"),
            str(orderRow['tradeBranchId'][0]).encode("utf-8"),
            str(orderRow['price'][0]).encode("utf-8"),
            str(orderRow['quantity'][0]).encode("utf-8"),
            str(orderRow['marketRootId'][0]).encode('utf-8'),
            str(orderRow['marketBranchId'][0]).encode("utf-8"),
            str(orderRow['traderId'][0]).encode("utf-8"),
            previousOrderRow['signature'][0])
        # Sign message
        sig = self.signMessage(msg=msg, signingKey_hex=signatureKey_hex)
        orderRow['previousSig'] = previousOrderRow['signature'][0]
        orderRow['signatureMsg'] = sig.message
        orderRow['signature'] = sig.signature
        signedOrderBook = orderRow
        return signedOrderBook

    def tradeMaker(self, prevTrade: object,
                   tradeRow: object)->object:
        # Construct a signed trade package (primary/offset/match), possibly
        # for list of prices.

        if isinstance(tradeRow['price'][0], list):
            numPrices = len(tradeRow['price'][0])
        else:
            numPrices = 1

        tradeRootId = prevTrade['tradeRootId'][0] + 1
        #  Sign trades
        pT = pd.DataFrame()
        oT = pd.DataFrame()
        mT = pd.DataFrame()
        for iPrice in range(numPrices):
            # Generate primary trade
            if isinstance(tradeRow['price'][0], list):
                price = tradeRow['price'][0][iPrice]
            else:
                price = tradeRow['price'][0]

            # Generate primary trade
            t = pd.DataFrame({'tradeRootId': [tradeRootId],
                              'tradeBranchId': [1],
                              'marketRootId': [tradeRow['marketRootId'][0]],
                              'marketBranchId': [tradeRow['marketBranchId'][0]],
                              'price': [price],
                              'quantity': [tradeRow['quantity'][0]],
                              'traderId': [tradeRow['traderId'][0]]})
            p = self.signOrderBook(orderRow=t, previousOrderRow=prevTrade,
                                   signatureKey_hex=self.signingKey_hex)
            pT = pd.concat([pT, p])
            #  Generate offset trade
            o = t
            o['quantity'] = t['quantity'] * -1
            o['tradeBranchId'] = 2
            o = self.signOrderBook(orderRow=o, previousOrderRow=p,
                                   signatureKey_hex=self.signingKey_hex)
            oT = pd.concat([oT, o])
            # Generate match trade
            m = o
            m['quantity'] = o['quantity'] * -1
            m['tradeBranchId'] = 3
            m = self.signOrderBook(orderRow=m, previousOrderRow=o,
                                   signatureKey_hex=self.signingKey_hex)
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





import datetime
# Crypto imports
import nacl.encoding
import nacl.signing


class BlocTime(object):
    # 'Market time class. Signs current UTC timestamp'

    def __init__(self):
        self.signatureKey_hex = '29ba39f7fea00b2639839d7740e875e884cdb593da4b46af8d4d9af3cc212bf0'
        self.verifyKey_hex = 'e6376aef9f29b5ba13d98f388a2463d42e58300a4438545e769dbfa2a7432f07'

    def signedUTCNow(self):
        # Current UTC stamp
        timeStampUTC = datetime.datetime.utcnow()
        timeStampUTC_bytes = b'%s' % str.encode(str(timeStampUTC))
        # Sign UTC stamp and return
        timeStampUTC_signed = self.signMessage(timeStampUTC_bytes, self.verifyKey_hex)
        return {'timeStampUTC': timeStampUTC, 'timeStampUTCSignature': timeStampUTC_signed.signature, 'verifyKey': self.verifyKey_hex}


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
'''
bt = BlocTime()
z =bt.signedUTCNow()
'''
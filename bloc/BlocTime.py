

import datetime
# Crypto imports
import nacl.encoding
import nacl.signing


class BlocTime(object):
    # 'Market time class. Signs current UTC timestamp'

    def __init__(self):
        self.signatureKey_hex = '0cca0a3739eba76cc78823d9f6e898379014d8c53172f5e45c171a3c54a9f477'
        self.verifyKey_hex = 'cdcfb59431b2579a681cee65656cbed6f8d578d5cc30d3e759e86c1d3e3529ef'

    def signedUTCNow(self):
        # Current UTC stamp
        timeStampUTC = datetime.datetime.utcnow()
        timeStampUTC_bytes = b'%s' % str.encode(str(timeStampUTC))
        # Sign UTC stamp and return
        timeStampUTC_signed = self.signMessage(timeStampUTC_bytes, self.signatureKey_hex)

        return {'timeStampUTC': str(timeStampUTC), 'timeStampUTCSignature': timeStampUTC_signed.signature, 'verifyKey': self.verifyKey_hex}


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
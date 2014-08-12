var bignum = require('bignum');
var crypto = require('crypto');
var util = require('util');

var key = getRandomPrivateKey();
console.log('Private Key in Hex: '+key.toString('hex'));
console.log('Private Key in WIF: '+walletImportFormat(key));

function getRandomPrivateKey() {
    var buf = new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
			  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
			  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
			  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);

    // not every random 32 bytes is a valid private key. this is the top
    var top = new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
			  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE,
			  0xBA, 0xAE, 0xDC, 0xE6, 0xAF, 0x48, 0xA0, 0x3B,
			  0xBF, 0xD2, 0x5E, 0x8C, 0xD0, 0x36, 0x41, 0x41]);

    while (bignum.fromBuffer(buf) > bignum.fromBuffer(top)) {
	try {
	    buf = crypto.randomBytes(32);
	}
	catch (ex) {
	    console.log(ex);
	}
    }
    return(buf);
}

function walletImportFormat(buf) {
    //console.log('add 0x80 in the front for main net');
    var extBuf = new Buffer(buf.length+1);
    extBuf[0] = 0x80;
    buf.copy(extBuf, 1);

    //console.log('double sha256 the result');
    var digest = sha256(sha256(extBuf));

    //console.log('add the first 4 bytes of the double sha256 to the end as a checksum')
    var chkbuf = new Buffer(extBuf.length+4);
    extBuf.copy(chkbuf, 0);
    chkbuf[33] = digest[0];
    chkbuf[34] = digest[1];
    chkbuf[35] = digest[2];
    chkbuf[36] = digest[3];

    //console.log('base58 that');
    return base58Encode(chkbuf);
}

function sha256(data) {
  return new Buffer(crypto.createHash('sha256').update(data).digest('binary'), 'binary');
}

function base58Encode(buf) {
    var globalBuffer = new Buffer(1024);
    var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    var ALPHABET_BUF = new Buffer(ALPHABET, 'ascii');
    var str;
    var x = bignum.fromBuffer(buf);
    var r;

    if (buf.length < 512)
      str = globalBuffer;
    else
      str = new Buffer(buf.length << 1);
    var i = str.length - 1;
    while (x.gt(0)) {
      r = x.mod(58);
      x = x.div(58);
      str[i] = ALPHABET_BUF[r.toNumber()];
      i--;
    }

    // deal with leading zeros
    var j=0;
    while (buf[j] == 0) {
      str[i] = ALPHABET_BUF[0];
      j++;
      i--;
    }

    return str.slice(i+1, str.length).toString('ascii');
}

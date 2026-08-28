// Decrypt final.pkg (the game's encrypted JS bundle).
//
// Layout (recovered from the loader's aCbiuzw/gJLONEI + pkg-fetch code):
//   [0..len-64)   AES-256-GCM ciphertext: IV(12) || body || tag(16)
//   [len-64..end) 64-byte integrity tail (checked by the client's viIybky
//                 custom-SHA256 routine before decryption; not part of the
//                 ciphertext)
// Key: static 32-byte key, hex string FEnCTQ.fcY4ZD in the inline loader
//      (game.deob.js).  Expected plaintext (before gunzip) is gzip.
// Result: 2.9MB one-line obfuscated webpack bundle = the same source that
//         DevTools labeled "VM9" (raw/VM9.txt is the post-loader capture).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const raw = path.join(__dirname, '..', '..', 'raw');
const pkgPath = path.join(raw, 'final.pkg');
const keyHex = 'f6001482da541c968b2c8352b525cf1ba56c256eb035ca22fa5b9fc3f0062e51';

const buf = fs.readFileSync(pkgPath);
const TAIL = 64; // integrity tail, stripped before decryption
const pkg = buf.slice(0, buf.length - TAIL);

console.log('pkg size:', buf.length, '(minus', TAIL, 'byte tail ->', pkg.length, ')');
console.log('tail64 hex:', buf.slice(buf.length - TAIL).toString('hex'));

const key = Buffer.from(keyHex, 'hex');
const iv = pkg.slice(0, 12);
const tag = pkg.slice(pkg.length - 16);
const body = pkg.slice(12, pkg.length - 16);

const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
d.setAuthTag(tag);
const plain = Buffer.concat([d.update(body), d.final()]);
console.log('decrypted:', plain.length, 'bytes; magic:', plain.slice(0, 8).toString('hex'));
console.log('sha256(decrypted):', crypto.createHash('sha256').update(plain).digest('hex'));

const out = zlib.gunzipSync(plain);
console.log('gunzipped:', out.length, 'bytes');
console.log('head:', JSON.stringify(out.slice(0, 80).toString('ascii')));
console.log('sha256(gunzipped):', crypto.createHash('sha256').update(out).digest('hex'));

fs.writeFileSync(path.join(raw, 'final.pkg.gz'), plain);
fs.writeFileSync(path.join(raw, 'final.pkg.js'), out);
console.log('saved raw/final.pkg.gz and raw/final.pkg.js');

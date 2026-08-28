// JS-only AES-256-GCM polyfill for SubtleCrypto, injected into the served
// page. Chrome only exposes crypto.subtle on SECURE contexts; over plain HTTP
// only http://127.0.0.1 / http://localhost qualify — LAN IPs don't. The game
// loader needs importKey("raw", 32B, AES-GCM) + decrypt({iv}, key, data) to
// unwrap final.pkg, so we provide a faithful shim (WebCrypto layout: tag is
// the last 16 bytes of the input).
(function () {
  if (typeof window === 'undefined') return;
  try {
    if (window.crypto && window.crypto.subtle) return; // native available
  } catch (e) { /* ignore */ }

  // ---------- AES-256 ----------
  function gmul(a, b) {
    var p = 0;
    for (var i = 0; i < 8; i++) {
      if (b & 1) p ^= a;
      var hi = a & 0x80;
      a = (a << 1) & 0xff;
      if (hi) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  }
  var S = (function () {
    // multiplicative inverses via exponentiation (a^254 = a^-1)
    var inv = new Array(256);
    for (var i = 0; i < 256; i++) {
      var v = 1;
      var e = 254;
      var base = i;
      while (e > 0) {
        if (e & 1) v = gmul(v, base);
        base = gmul(base, base);
        e >>= 1;
      }
      inv[i] = v;
    }
    inv[0] = 0;
    var rotl = function (x, n) { return ((x << n) | (x >>> (8 - n))) & 0xff; };
    var sbox = new Array(256), rsbox = new Array(256);
    for (var j = 0; j < 256; j++) {
      var x = inv[j];
      var y = x ^ rotl(x, 1) ^ rotl(x, 2) ^ rotl(x, 3) ^ rotl(x, 4) ^ 0x63;
      sbox[j] = y;
      rsbox[y] = j;
    }
    return { sbox: sbox, rsbox: rsbox };
  })();
  var sbox = S.sbox, rsbox = S.rsbox;

  var RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

  function keyExp(key) {
    var Nk = key.length / 4, Nr = Nk + 6;
    var w = [];
    for (var i = 0; i < Nk; i++) w.push([key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]]);
    for (i = Nk; i < 4 * (Nr + 1); i++) {
      var t = w[i-1].slice();
      if (i % Nk === 0) {
        t = [sbox[t[1]], sbox[t[2]], sbox[t[3]], sbox[t[0]]];
        t[0] ^= RCON[i/Nk - 1];
      } else if (Nk > 6 && i % Nk === 4) {
        t = [sbox[t[0]], sbox[t[1]], sbox[t[2]], sbox[t[3]]];
      }
      var prev = w[i - Nk];
      w.push([prev[0]^t[0], prev[1]^t[1], prev[2]^t[2], prev[3]^t[3]]);
    }
    var rk = [];
    for (var r = 0; r <= Nr; r++) {
      var round = [];
      for (var c = 0; c < 4; c++) round.push(w[r * 4 + c].slice());
      rk.push(round);
    }
    return rk;
  }
  function xt(x) { return ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff; }
  function encryptBlock(keyBytes, inBytes) {
    var rk = keyExp(keyBytes);
    var Nr = rk.length - 1;
    var s = [];
    for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) s[r * 4 + c] = inBytes[r + 4 * c];
    var add = function (round) { for (var rr = 0; rr < 4; rr++) for (var cc = 0; cc < 4; cc++) s[rr*4+cc] ^= rk[round][cc][rr]; };
    add(0);
    for (var round = 1; round < Nr; round++) {
      for (var r1 = 0; r1 < 4; r1++) for (var c1 = 0; c1 < 4; c1++) s[r1*4+c1] = sbox[s[r1*4+c1]];
      for (var r2 = 1; r2 < 4; r2++) {
        var row = [s[r2*4], s[r2*4+1], s[r2*4+2], s[r2*4+3]];
        for (var c2 = 0; c2 < 4; c2++) s[r2*4+c2] = row[(c2 + r2) % 4];
      }
      for (var c3 = 0; c3 < 4; c3++) {
        var a = [s[c3], s[4+c3], s[8+c3], s[12+c3]];
        s[c3] = xt(a[0]) ^ (a[1] ^ xt(a[1])) ^ a[2] ^ a[3];
        s[4+c3] = a[0] ^ xt(a[1]) ^ (a[2] ^ xt(a[2])) ^ a[3];
        s[8+c3] = a[0] ^ a[1] ^ xt(a[2]) ^ (a[3] ^ xt(a[3]));
        s[12+c3] = (a[0] ^ xt(a[0])) ^ a[1] ^ a[2] ^ xt(a[3]);
      }
      add(round);
    }
    for (var r3 = 0; r3 < 4; r3++) for (var c4 = 0; c4 < 4; c4++) s[r3*4+c4] = sbox[s[r3*4+c4]];
    for (var r4 = 1; r4 < 4; r4++) {
      var row2 = [s[r4*4], s[r4*4+1], s[r4*4+2], s[r4*4+3]];
      for (var c5 = 0; c5 < 4; c5++) s[r4*4+c5] = row2[(c5 + r4) % 4];
    }
    add(Nr);
    var out = [];
    for (var r5 = 0; r5 < 4; r5++) for (var c6 = 0; c6 < 4; c6++) out[r5 + 4*c6] = s[r5*4+c6];
    return out;
  }

  // ---------- GHASH (GF(2^128) mod x^128+x^7+x^2+x+1) ----------
  function gmulX(b) { // multiply by X (spec: V >> 1 with R = 11100001 || 0^120)
    var carry = 0;
    for (var i = 0; i < 16; i++) {
      var low = b[i] & 1;
      b[i] = (b[i] >> 1) | (carry << 7);
      carry = low;
    }
    if (carry) { b[0] ^= 0xe1; }
  }
  function ghash(H, data, len) {
    // spec Algorithm 1: x_i = i-th bit (i=0 = MSB); V >>= 1, R = 0xE1||0^120
    var y = new Uint8Array(16);
    var block = new Uint8Array(16);
    for (var off = 0; off < len; off += 16) {
      for (var i = 0; i < 16; i++) block[i] = y[i] ^ data[off + i];
      var z = new Uint8Array(16);
      var h = new Uint8Array(16);
      for (var c = 0; c < 16; c++) h[c] = H[c];
      for (var bit = 0; bit < 128; bit++) {
        if ((block[bit >> 3] >>> (7 - (bit & 7))) & 1) {
          for (var j = 0; j < 16; j++) z[j] ^= h[j];
        }
        gmulX(h);
      }
      y = z;
    }
    return y;
  }

  function aesGcmDecrypt(keyBytes, iv, data) {
    var tag = data.slice(data.length - 16);
    var ct = data.slice(0, data.length - 16);
    var H = encryptBlock(keyBytes, new Uint8Array(16));
    // J0 = iv || 0x00000001
    var j0 = new Uint8Array(16);
    for (var i = 0; i < Math.min(iv.length, 12); i++) j0[i] = iv[i];
    j0[15] = 1;
    // decrypt: counter = J0 + inc32
    var counter = j0.slice();
    var pt = new Uint8Array(ct.length);
    for (var off = 0; off < ct.length; off += 16) {
      counter[15] = (counter[15] + 1) & 0xff;
      if (counter[15] === 0) { counter[14] = (counter[14] + 1) & 0xff; }
      var ks = encryptBlock(keyBytes, counter);
      var n = Math.min(16, ct.length - off);
      for (var j = 0; j < n; j++) pt[off + j] = ct[off + j] ^ ks[j];
    }
    // GHASH over ciphertext
    var pad = ct.length % 16;
    var gdata = new Uint8Array(ct.length + (pad ? 16 - pad : 0) + 16);
    gdata.set(ct, 0);
    var alen = 0, clen = ct.length * 8; // GCM lengths are in bits
    var lenBytes = new Uint8Array(16);
    lenBytes[4] = (alen >>> 24) & 0xff; lenBytes[5] = (alen >>> 16) & 0xff; lenBytes[6] = (alen >>> 8) & 0xff; lenBytes[7] = alen & 0xff;
    lenBytes[12] = (clen >>> 24) & 0xff; lenBytes[13] = (clen >>> 16) & 0xff; lenBytes[14] = (clen >>> 8) & 0xff; lenBytes[15] = clen & 0xff;
    gdata.set(lenBytes, gdata.length - 16);
    var s = ghash(H, gdata, gdata.length);
    var mask = encryptBlock(keyBytes, j0);
    var expect = new Uint8Array(16);
    var ok = true;
    for (var q = 0; q < 16; q++) {
      expect[q] = s[q] ^ mask[q];
      if (expect[q] !== tag[q]) ok = false;
    }
    if (!ok) throw new Error('Unsupported state or unable to authenticate data');
    return pt;
  }

  // ---------- shim ----------
  function makeCrypto() {
    var subtle = {
      importKey: function (format, keyData, algo, extractable, usages) {
        return Promise.resolve({ format: format, key: new Uint8Array(keyData), algo: algo, usages: usages });
      },
      decrypt: function (algo, key, data) {
        var keyBytes = key && key.key ? key.key : new Uint8Array(key);
        var iv = new Uint8Array(algo.iv);
        return Promise.resolve(aesGcmDecrypt(keyBytes, iv, new Uint8Array(data)));
      },
      encrypt: function (algo, key, data) { return Promise.reject(new Error('not implemented')); },
      digest: function (algo, data) {
        // minimal SHA-256 fallback if needed (loader may call digest for integrity)
        if (!window.crypto || !window.crypto.subtle) {
          // no sync sha-256 here; try a slow pure-JS sha256 via helper below
        }
        return Promise.reject(new Error('digest not implemented'));
      },
    };
    var crypto = window.crypto || {};
    crypto.subtle = subtle;
    window.crypto = crypto;
  }
  makeCrypto();
  try { window.__subtleShim = true; } catch (e) { /* ignore */ }
  try { window.__shim = { encryptBlock: encryptBlock, keyExp: keyExp, ghash: ghash, gmulX: gmulX, gmul: gmul, S: S }; } catch (e) { /* ignore */ }
})();

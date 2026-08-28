// Capture the ACTUAL AES key by running the game's pkg decrypt in the VM with a
// hooked crypto.subtle. The game computes Fbp9s81 (via SM2pwJ) and calls
// importKey + decrypt — we log the raw key bytes + iv + data, then replicate.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js');
const src = fs.readFileSync(SRC, 'utf8');

function makeMockWindow() {
  const noop = () => {};
  const mockEl = () => ({ style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null, focus: noop, blur: noop, click: noop, getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }), querySelector: () => null, querySelectorAll: () => [], matches: () => false, contains: () => false, requestFullscreen: noop, clientWidth: 0, clientHeight: 0, innerWidth: 0, innerHeight: 0, width: 0, height: 0, value: '', textContent: '', innerHTML: '' });
  const w = {
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
    location: { href: 'https://deadshot.io/', protocol: 'https:', host: 'deadshot.io', hostname: 'deadshot.io', port: '', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
    document: { createElement: (tag) => { const el = mockEl(); if (tag === 'iframe') { const cw = { location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl() }, addEventListener: noop, postMessage: noop }; el.contentWindow = cw; el.contentDocument = cw.document; } return el; }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '', readyState: 'complete', visibilityState: 'visible', hidden: false, createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [] },
    WebSocket: function MockWS() { this.send = noop; this.close = noop; this.addEventListener = noop; this.onmessage = null; this.onopen = null; this.onclose = null; this.onerror = null; this.readyState = 3; },
    XMLHttpRequest: function () { this.open = noop; this.send = noop; this.setRequestHeader = noop; this.addEventListener = noop; },
    fetch: async (url) => {
      // Serve the real final.pkg bytes when the game fetches the package
      if (String(url).includes('final.pkg')) {
        const buf = fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'bundles', 'final.pkg'));
        return { ok: true, status: 200, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), clone: () => null, headers: { get: () => 'application/octet-stream' } };
      }
      return { ok: false, status: 0, json: async () => ({}), text: async () => '', arrayBuffer: async () => new ArrayBuffer(0), clone: () => null };
    },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 }, sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    addEventListener: noop, removeEventListener: noop, requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout, setTimeout, clearTimeout, setInterval, clearInterval,
    Audio: function () { this.play = noop; this.pause = noop; this.addEventListener = noop; }, Image: function () { this.addEventListener = noop; }, MutationObserver: function (cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
    console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, globalThis: null,
    performance: { now: () => Date.now() }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), alert: noop, confirm: () => false, prompt: () => null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    // HOOKED crypto.subtle to capture the real key
    crypto: {
      getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; },
      subtle: {
        async importKey(format, keyData, algo, extractable, usages) {
          const captured = { format, algo: JSON.stringify(algo), keyLen: keyData && keyData.byteLength, keyHex: keyData ? Buffer.from(new Uint8Array(keyData)).toString('hex') : null };
          console.log('CAPTURED importKey:', JSON.stringify(captured));
          fs.writeFileSync(path.join(__dirname, '..', '..', 'raw', 'captured-key.json'), JSON.stringify(captured, null, 2));
          return { type: 'secret', algorithm: algo };
        },
        async decrypt(algo, key, data) {
          const captured = { algo: JSON.stringify(algo), dataLen: data && data.byteLength, dataHex: data ? Buffer.from(new Uint8Array(data)).slice(0, 40).toString('hex') : null };
          console.log('CAPTURED decrypt:', JSON.stringify(captured));
          fs.writeFileSync(path.join(__dirname, '..', '..', 'raw', 'captured-decrypt.json'), JSON.stringify(captured, null, 2));
          // return fake decrypted bytes
          return new Uint8Array(16).buffer;
        },
        digest: async () => new ArrayBuffer(32),
        encrypt: async () => new ArrayBuffer(16),
        generateKey: async () => ({}),
        deriveBits: async () => new ArrayBuffer(32),
        deriveKey: async () => ({}),
      },
    },
    WebAssembly,
  };
  w.globalThis = w; w.window = w; w.self = w; w.top = w; w.parent = w; w.opener = null;
  const genericCtor = function Generic() {}; genericCtor.prototype = {};
  const handler = { get(t, p) { if (p in t) return t[p]; if (p === Symbol.toPrimitive) return () => '[mock global]'; return genericCtor; }, has() { return true; } };
  const permissive = new Proxy(w, handler);
  w.globalThis = permissive; w.window = permissive; w.self = permissive; w.top = permissive; w.parent = permissive;
  return w;
}

const sandbox = makeMockWindow();
vm.createContext(sandbox);
try { vm.runInContext(src, sandbox, { timeout: 25000 }); } catch (e) { console.log('exec note:', e.message); }

// Let async pkg load run
setTimeout(() => {
  console.log('done. captured files written if the game reached decrypt.');
  process.exit(0);
}, 12000);

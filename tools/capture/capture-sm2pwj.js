// Capture SM2pwJ("gQFAti7") result using the PROVEN deobfuscate.js VM setup
// (which runs the whole body to completion), with SM2pwJ instrumentation added.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.deob.js');  // deobfuscated — has literal SM2pwJ args
const src = fs.readFileSync(SRC, 'utf8');

// --- Same mock as deobfuscate.js (which works) ---
function makeMockWindow() {
  const noop = () => {};
  const mockEl = () => ({ style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null, focus: noop, blur: noop, click: noop, getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }), querySelector: () => null, querySelectorAll: () => [], matches: () => false, contains: () => false, requestFullscreen: noop, clientWidth: 0, clientHeight: 0, innerWidth: 0, innerHeight: 0, width: 0, height: 0, value: '', textContent: '', innerHTML: '' });
  const w = {
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
    location: { href: 'https://deadshot.io/', protocol: 'https:', host: 'deadshot.io', hostname: 'deadshot.io', port: '', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
    document: {
      createElement: (tag) => { const el = mockEl(); if (tag === 'iframe') { const cw = { location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl() }, addEventListener: noop, postMessage: noop }; el.contentWindow = cw; el.contentDocument = cw.document; } return el; },
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '', readyState: 'complete', visibilityState: 'visible', hidden: false, createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [],
    },
    WebSocket: function MockWS() { this.send = noop; this.close = noop; this.addEventListener = noop; this.onmessage = null; this.onopen = null; this.onclose = null; this.onerror = null; this.readyState = 3; },
    XMLHttpRequest: function () { this.open = noop; this.send = noop; this.setRequestHeader = noop; this.addEventListener = noop; }, fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 }, sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    addEventListener: noop, removeEventListener: noop, requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout, setTimeout, clearTimeout, setInterval, clearInterval,
    Audio: function () { this.play = noop; this.pause = noop; this.addEventListener = noop; }, Image: function () { this.addEventListener = noop; }, MutationObserver: function (cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
    console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, globalThis: null,
    crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } }, performance: { now: () => Date.now() }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), alert: noop, confirm: () => false, prompt: () => null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  };
  w.globalThis = w; w.window = w; w.self = w; w.top = w; w.parent = w; w.opener = null;
  const genericCtor = function Generic() {}; genericCtor.prototype = {};
  const handler = { get(t, p) { if (p in t) return t[p]; if (p === Symbol.toPrimitive) return () => '[mock global]'; return genericCtor; }, has() { return true; } };
  const permissive = new Proxy(w, handler);
  w.globalThis = permissive; w.window = permissive; w.self = permissive; w.top = permissive; w.parent = permissive;
  return w;
}

const sandbox = makeMockWindow();

// Instrument: wrap `new SM2pwJ("gQFAti7",...)` -> `__sm2cap("gQFAti7", new SM2pwJ(...))`
// __sm2cap calls .w4P3L0 and stores the result on the sandbox global.
const HOOK = `
  function __sm2cap(key, inst) {
    try {
      var v = (typeof inst.w4P3L0 === 'function') ? inst.w4P3L0() : inst.w4P3L0;
      globalThis.__sm2capResult = globalThis.__sm2capResult || {};
      globalThis.__sm2capResult[key] = v;
    } catch(e) { globalThis.__sm2capResult = globalThis.__sm2capResult || {}; globalThis.__sm2capResult['__err_' + key] = String(e); }
    return inst;
  }
`;
// Match: new SM2pwJ(<string-literal>, ...) — wrap with __sm2cap
let instrumented = HOOK + src;
instrumented = instrumented.replace(/new\s+SM2pwJ\(\s*(['"])([^'"]*)\1/g, (whole, q, key) => {
  return '__sm2cap(' + q + key + q + ', new SM2pwJ(' + q + key + q;
});

vm.createContext(sandbox);
try { vm.runInContext(instrumented, sandbox, { timeout: 25000 }); } catch (e) { console.log('exec note:', e.message); }

const results = sandbox.__sm2capResult || {};
console.log('SM2pwJ results:', Object.keys(results).length);
for (const [k, v] of Object.entries(results)) {
  const isBuf = v && v.byteLength;
  console.log(' ', k, '=', isBuf ? ('[bytes:' + v.byteLength + '] ' + Buffer.from(new Uint8Array(v)).toString('hex').slice(0, 80)) : JSON.stringify(String(v).slice(0, 120)));
}
fs.writeFileSync(path.join(__dirname, '..', '..', 'raw', 'analysis', 'sm2pwj-results.json'), JSON.stringify(results, (k, v) => v && v.byteLength ? { __bytes: Buffer.from(new Uint8Array(v)).toString('hex') } : v, 2));
console.log('saved raw/sm2pwj-results.json');

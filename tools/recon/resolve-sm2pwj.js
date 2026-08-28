// Resolve SM2pwJ (the string-builder / key transform) by running the inline
// script's bootstrap and calling SM2pwJ with the key-builder arguments.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js'), 'utf8');

// Reuse the mock from capture-key.js (inline it minimally — SM2pwJ is pure string logic)
function makeMockWindow() {
  const noop = () => {};
  const mockEl = () => ({ style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null, focus: noop, blur: noop, click: noop, getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }), querySelector: () => null, querySelectorAll: () => [], matches: () => false, contains: () => false, requestFullscreen: noop, clientWidth: 0, clientHeight: 0, innerWidth: 0, innerHeight: 0, width: 0, height: 0, value: '', textContent: '', innerHTML: '' });
  const w = {
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
    location: { href: 'https://deadshot.io/', protocol: 'https:', host: 'deadshot.io', hostname: 'deadshot.io', port: '', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
    document: { createElement: (tag) => { const el = mockEl(); if (tag === 'iframe') { const cw = { location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl() }, addEventListener: noop, postMessage: noop }; el.contentWindow = cw; el.contentDocument = cw.document; } return el; }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '', readyState: 'complete', visibilityState: 'visible', hidden: false, createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [] },
    WebSocket: function MockWS() { this.send = noop; this.close = noop; this.addEventListener = noop; this.onmessage = null; this.onopen = null; this.onclose = null; this.onerror = null; this.readyState = 3; },
    XMLHttpRequest: function () { this.open = noop; this.send = noop; this.setRequestHeader = noop; this.addEventListener = noop; }, fetch: () => Promise.resolve({ ok: false, json: async () => ({}), text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 }, sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    addEventListener: noop, removeEventListener: noop, requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout, setTimeout, clearTimeout, setInterval, clearInterval,
    Audio: function () { this.play = noop; this.pause = noop; this.addEventListener = noop; }, Image: function () { this.addEventListener = noop; }, MutationObserver: function (cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
    console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, globalThis: null,
    crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = 0; return a; } }, performance: { now: () => Date.now() }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), alert: noop, confirm: () => false, prompt: () => null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
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

// Instrument the source: after each `new SM2pwJ(key, a, b).w4P3L0`, log the result.
// We wrap `SM2pwJ(key, s1, s2)` constructions by replacing `.w4P3L0` calls with a
// hook that records (key -> result).
const HOOK = `
  var __sm2results = {};
  var __origW4 = null;
  function __sm2hook(inst, key) {
    try {
      var v = inst.w4P3L0();
      __sm2results[key] = v;
      if (typeof window !== 'undefined') window.__sm2results = __sm2results;
      if (typeof globalThis !== 'undefined') globalThis.__sm2results = __sm2results;
    } catch (e) {}
    return inst;
  }
`;
let instrumented = HOOK + src;
// Replace `new SM2pwJ(<literal>, a, b)` with `__sm2hook(new SM2pwJ(<literal>, a, b), <literal>)`
// We match the first arg being a string literal.
instrumented = instrumented.replace(/new\s+SM2pwJ\(\s*(['"])([^'"]*)\1/g, (whole, q, key) => {
  return '__sm2hook(new SM2pwJ(' + q + key + q;
});

try { vm.runInContext(instrumented, sandbox, { timeout: 20000 }); } catch (e) { console.log('exec note:', e.message); }

// Read back results
const res = sandbox.__sm2results || {};
console.log('SM2pwJ results captured:', Object.keys(res).length);
for (const k of Object.keys(res).slice(0, 30)) {
  const v = res[k];
  console.log('  SM2pwJ(' + k + ') =', JSON.stringify(String(v).slice(0, 80)), v && v.byteLength ? '(bytes:' + v.byteLength + ')' : '');
}
// Specifically the key one
if ('gQFAti7' in res) {
  const v = res['gQFAti7'];
  console.log('\nKEY gQFAti7 =', typeof v === 'string' ? v : '(non-string)');
  if (typeof v === 'string' && /^[0-9a-f]+$/i.test(v)) {
    const buf = Buffer.from(v, 'hex');
    console.log('  hex-decoded:', buf.length, 'bytes:', buf.toString('hex'));
  }
}

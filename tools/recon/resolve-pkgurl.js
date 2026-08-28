// Resolve SM2pwJ string-builder outputs by running the game bootstrap in the VM.
// SM2pwJ(key, seed, tag) is wasm-bindgen's string obfuscator; it returns the
// decoded string for a given key. We run the file with mocks, then call SM2pwJ
// with the keys we see at pkgUrl/wasmInit.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js'), 'utf8');

function makeMockWindow() {
  const noop = () => {};
  const mockEl = () => ({ style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null, focus: noop, blur: noop, click: noop, getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }), querySelector: () => null, querySelectorAll: () => [], matches: () => false, contains: () => false, requestFullscreen: noop, clientWidth: 0, clientHeight: 0, innerWidth: 0, innerHeight: 0, width: 0, height: 0, value: '', textContent: '', innerHTML: '' });
  const w = {
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
    location: { href: 'https://deadshot.io/', protocol: 'https:', host: 'deadshot.io', hostname: 'deadshot.io', port: '', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
    document: { createElement: (tag) => { const el = mockEl(); if (tag === 'iframe') { const cw = { location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl() }, addEventListener: noop, postMessage: noop }; el.contentWindow = cw; el.contentDocument = cw.document; } return el; }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '', readyState: 'complete', visibilityState: 'visible', hidden: false, createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [] },
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
vm.createContext(sandbox);
try { vm.runInContext(src, sandbox, { timeout: 20000 }); } catch (e) { console.log('exec note:', e.message); }

// Keys we care about (from pkgUrl/wasmInit analysis)
const keys = ['l_yWuI', 'RwnB8M', 'QYRBQAg', 'kJO_Zd', 'z5Kko50', 'y2wIEm', 'TIrrKQW', 'l_yWuI'];
console.log('SM2pwJ type:', typeof sandbox.SM2pwJ);
for (const k of keys) {
  try {
    const inst = new sandbox.SM2pwJ(k, 'y2wIEm', 'z5Kko50');
    const val = inst && typeof inst.w4P3L0 === 'function' ? inst.w4P3L0() : 'no w4P3L0';
    console.log('SM2pwJ(' + k + ') =', JSON.stringify(val));
  } catch (e) {
    console.log('SM2pwJ(' + k + ') threw:', e.message);
  }
}

// Also try to find any function that returns the pkg URL
for (const name of ['YQVRvZV', 'OLmvjmA', 'S2UZop']) {
  if (typeof sandbox[name] === 'function') {
    try { console.log(name + '():', JSON.stringify(sandbox[name]())); } catch (e) { console.log(name + ' threw:', e.message); }
  }
}

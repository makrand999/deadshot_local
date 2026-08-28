// Phase 1.2 — Deobfuscate deadshot.io's game.js
//
// Strategy v2: execute the ENTIRE file in a sandboxed node:vm with browser APIs
// mocked so the bootstrap runs, builds the string table, and defines the decoder
// functions. We then replace every decoder(0xN) call site with its literal string
// by invoking the real decoders from the live VM.
//
// The game's top-level code also runs, but with network/Audio/DOM mocked and the
// process exiting immediately after, it cannot connect anywhere. This is the
// standard "unpack the obfuscator" technique.
//
// Usage: node tools/deobfuscate.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js');
const OUT = path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.deob.js');

const src = fs.readFileSync(SRC, 'utf8');

// --- Build a mock browser environment ---
function makeMockWindow() {
  const noop = () => {};
  const mockEl = () => ({
    style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop,
    setAttribute: noop, getAttribute: () => null, focus: noop, blur: noop, click: noop,
    getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    querySelector: () => null, querySelectorAll: () => [], matches: () => false, contains: () => false,
    requestFullscreen: noop, clientWidth: 0, clientHeight: 0, innerWidth: 0, innerHeight: 0,
    width: 0, height: 0, value: '', textContent: '', innerHTML: '',
  });
  const w = {
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
    location: { href: 'https://deadshot.io/', protocol: 'https:', host: 'deadshot.io', hostname: 'deadshot.io', port: '', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
    document: {
      createElement: (tag) => {
        const el = mockEl();
        if (tag === 'iframe') {
          // Rich iframe mock for the "clean-realm" init: contentWindow/contentDocument
          const cw = { location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl() }, addEventListener: noop, postMessage: noop };
          el.contentWindow = cw;
          el.contentDocument = cw.document;
          el.setAttribute = noop;
          el.remove = noop;
          el.addEventListener = noop;
        }
        return el;
      },
      getElementById: () => null, querySelector: () => null,
      querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop,
      body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '',
      readyState: 'complete', visibilityState: 'visible', hidden: false,
      createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [],
    },
    WebSocket: function MockWS() { this.send = noop; this.close = noop; this.addEventListener = noop; this.onmessage = null; this.onopen = null; this.onclose = null; this.onerror = null; this.readyState = 3; },
    XMLHttpRequest: function() { this.open = noop; this.send = noop; this.setRequestHeader = noop; this.addEventListener = noop; },
    fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    addEventListener: noop, removeEventListener: noop,
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
    cancelAnimationFrame: clearTimeout,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Audio: function() { this.play = noop; this.pause = noop; this.addEventListener = noop; },
    Image: function() { this.addEventListener = noop; },
    MutationObserver: function(cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
    console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array,
    Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error,
    Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, globalThis: null,
    crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } },
    performance: { now: () => Date.now() },
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    alert: noop, confirm: () => false, prompt: () => null,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  };
  w.globalThis = w;
  w.window = w;
  w.self = w;
  w.top = w;
  w.parent = w;
  w.opener = null;

  // Permissive global: any unknown property resolves to a generic constructible
  // function/object, so the game's global lookups (via Wddnee) never throw.
  const genericCtor = function Generic() {};
  genericCtor.prototype = {};
  const handler = {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === Symbol.toPrimitive) return () => '[mock global]';
      return genericCtor;
    },
    has() { return true; },
  };
  const permissiveGlobal = new Proxy(w, handler);
  w.globalThis = permissiveGlobal;
  w.window = permissiveGlobal;
  w.self = permissiveGlobal;
  w.top = permissiveGlobal;
  w.parent = permissiveGlobal;
  // Also expose the raw w so `MG19FnM` (a Proxy) still has the real props
  Object.defineProperty(w, '_raw', { value: w, enumerable: false });
  return w;
}

const sandbox = makeMockWindow();

// --- Instrument decoders BEFORE running: record every (fn, arg) -> result ---
// We inject a hook that wraps the decoder calls at the source level: replace
// `decoder(0xN)` with `__hook("decoder", 0xN, decoder(0xN))` — no, simpler: we
// define wrapper functions in the VM that shadow the decoders and log results.
// Since body-scoped decoders (vpUcA1) aren't globals, we instrument the SOURCE:
// replace `vpUcA1(0xN)` / `o3kUxo(0xN)` / `pvXRsd(0xN)` with
// `__dbg("name", 0xN, name(0xN))` before running. __dbg records and returns the value.
const record = new Map(); // `${name}|${idx}` -> value
const HOOK_SRC = `
  function __dbg(name, idx, val) {
    try {
      if (typeof recordStore === 'undefined') { /* noop */ }
      else recordStore[name + '|' + idx] = val;
    } catch (e) {}
    return val;
  }
`;
// We can't easily reference `record` from inside the VM context; instead, use a
// sandbox-level store object that __dbg writes to, which we read back after.
sandbox.__recordStore = {};
sandbox.recordStore = sandbox.__recordStore;

let instrumented = src;
for (const name of ['vpUcA1', 'o3kUxo', 'pvXRsd', 'KUDZqIu', 'znb5HN']) {
  // only wrap CALLS of the form name(0xN) — replace with __dbg("name", 0xN, name(0xN))
  const re = new RegExp('\\b' + name + '\\((0x[0-9a-fA-F]+|\\d+)\\)', 'g');
  instrumented = instrumented.replace(re, (whole, arg) => {
    return '__dbg(' + JSON.stringify(name) + ',' + arg + ',' + whole + ')';
  });
}
// prepend __dbg definition
instrumented = HOOK_SRC + instrumented;

// --- Run the whole file in the VM ---
vm.createContext(sandbox);
try {
  vm.runInContext(instrumented, sandbox, { filename: 'game.js', timeout: 20000 });
} catch (e) {
  console.log('note: game execution threw (expected):', e.message);
}
console.log('recorded decoder calls:', Object.keys(sandbox.__recordStore).length);

// --- Rewrite call sites using recorded store + full decoder maps ---
// The recorded store has `name|idx -> value` for EXECUTED calls (captures
// body-scoped vpUcA1). The decoder maps (from probe-decoders.js) have the FULL
// o3kUxo/pvXRsd/KUDZqIu tables. Prefer the full maps; fall back to the store.
const store = sandbox.__recordStore;
let maps = {};
try { maps = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'analysis', 'decoder-maps.json'), 'utf8')); } catch (e) { console.log('no decoder-maps.json, using store only:', e.message); }
console.log('recorded entries:', Object.keys(store).length, '| map sizes:', Object.fromEntries(Object.entries(maps).map(([k, v]) => [k, Object.keys(v).length])));

function lookup(name, idx) {
  const key = name + '|' + idx;
  // 1) full map (numbers stored as object keys — but JSON keys are strings; values may be strings or numbers)
  const map = maps[name];
  if (map) {
    if (String(idx) in map) return map[String(idx)];
    // also try hex-string keys just in case
    if ('0x' + idx.toString(16) in map) return map['0x' + idx.toString(16)];
  }
  // 2) recorded store
  if (key in store) return store[key];
  // 3) live function fallback
  const fn = sandbox[name];
  if (typeof fn === 'function') { try { return fn(idx); } catch (e) {} }
  return undefined;
}

// Rewrite repeatedly to handle nesting (vpUcA1(0xN) -> number -> pvXRsd(<num>) -> string)
let out = src;
const names = ['vpUcA1', 'o3kUxo', 'pvXRsd', 'KUDZqIu', 'znb5HN'];
// match positive AND negative literals: (-0xN | 0xN | -N | N)
const ARG = '(-?0x[0-9a-fA-F]+|-?\\d+)';
for (let pass = 0; pass < 14; pass++) {
  let changed = false;
  for (const name of names) {
    const re = new RegExp('\\b' + name + '\\(' + ARG + '\\)', 'g');
    out = out.replace(re, (whole, arg) => {
      const idx = Number(arg);
      const val = lookup(name, idx);
      if (typeof val === 'string') { changed = true; return JSON.stringify(val); }
      if (typeof val === 'number' && Number.isInteger(val)) { changed = true; return (val < 0 ? '-0x' : '0x') + Math.abs(val).toString(16); }
      return whole;
    });
  }
  if (!changed) break;
}

fs.writeFileSync(OUT, out);
console.log('wrote', OUT, out.length, 'chars (from', src.length + ')');

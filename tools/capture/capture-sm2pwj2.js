// Capture SM2pwJ results by PATCHING the SM2pwJ function definition in the raw source.
// Replace `function SM2pwJ(...) { ... }` with a wrapper that logs (arg1 -> result).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js'), 'utf8');

// --- The exact SM2pwJ function definition (from earlier find) ---
// `function SM2pwJ(zmjVzd_,AeaySZ,Wo6CJ6e){ ... }` at char 863307
// We replace the opening to add a result-tracking wrapper around the constructor.
const SM_DEF_START = 'function SM2pwJ(zmjVzd_,AeaySZ,Wo6CJ6e){';
const idx = src.indexOf(SM_DEF_START);
console.log('SM2pwJ def at', idx);
if (idx < 0) { console.log('SM2pwJ def not found with that exact signature'); process.exit(1); }

// Find the function body end (matching brace)
let depth = 0, end = -1;
for (let i = idx; i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
console.log('SM2pwJ def ends at', end, '(len', end - idx + ')');

// Build a patched version:
//   function SM2pwJ(a,b,c){ var __r = (function(){ <original body> })(); try{ globalThis.__sm2log[a]=__r; }catch(e){} return __r; }
// But the original returns via `return` inside — simplest: rename original to SM2pwJ_orig,
// define SM2pwJ = function that calls SM2pwJ_orig and logs.
const origBody = src.slice(idx, end);
// The original body uses `return ...` — we can't easily wrap. Instead, prepend logging
// INSIDE the constructor: after computing, before each return. Simpler: log the ARG and
// monkey-patch by capturing `this.w4P3L0` — SM2pwJ instances have .w4P3L0 method.
// We patch the prototype method assignment instead: find ".w4P3L0" writes.
// EASIEST: wrap the whole function: SM2pwJ_orig = <original>; SM2pwJ = function(a,b,c){ var r = SM2pwJ_orig(a,b,c); log; return r; }
const patched = src.slice(0, idx)
  + 'function SM2pwJ_orig' + origBody.slice('function SM2pwJ'.length)
  + ';SM2pwJ=function(zmjVzd_,AeaySZ,Wo6CJ6e){var __r=new SM2pwJ_orig(zmjVzd_,AeaySZ,Wo6CJ6e);try{var __v=(typeof __r.w4P3L0==="function")?__r.w4P3L0():__r;globalThis.__sm2log=globalThis.__sm2log||{};globalThis.__sm2log[String(zmjVzd_)]=__v;}catch(__e){globalThis.__sm2log=globalThis.__sm2log||{};globalThis.__sm2log["__err_"+String(zmjVzd_)]=String(__e);}return __r;};'
  + src.slice(end);

// Sanity: count
console.log('patched SM2pwJ wrapper added.');

// --- Run with the working mock (from deobfuscate.js) ---
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
try { vm.runInContext(patched, sandbox, { timeout: 30000 }); } catch (e) { console.log('exec note:', e.message); }

const log = sandbox.__sm2log || {};
console.log('\nSM2pwJ logged entries:', Object.keys(log).length);
for (const [k, v] of Object.entries(log)) {
  const isBuf = v && v.byteLength;
  console.log(' ', JSON.stringify(k), '=', isBuf ? ('[bytes:' + v.byteLength + '] ' + Buffer.from(new Uint8Array(v)).toString('hex').slice(0, 100)) : JSON.stringify(String(v).slice(0, 140)));
}
// Specifically the key
if ('gQFAti7' in log) {
  const v = log['gQFAti7'];
  console.log('\nKEY gQFAti7 =', isBuf ? Buffer.from(new Uint8Array(v)).toString('hex') : v);
}
fs.writeFileSync(path.join(__dirname, '..', '..', 'raw', 'analysis', 'sm2pwj-results.json'), JSON.stringify(log, (k, v) => v && v.byteLength ? { __bytes: Buffer.from(new Uint8Array(v)).toString('hex') } : v, 2));

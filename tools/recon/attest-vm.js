// Attestation VM harness — runs the real deadshot.io loader in a Node vm with a
// faithful-enough sandbox (real builtins, real crypto.webcrypto, functional
// iframe) so the loader's SM2pwJ dispatch and attestation math actually work.
//
// Usage:
//   node tools/recon/attest-vm.js tools/recon/probes/<probe>.js
// The probe file must define a JS snippet to inject at the end of the loader
// body; it runs in the loader's scope (SM2pwJ, ptx_Hx, wufmly, Chy7gN visible)
// and assigns `window.__probeResult`.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');

const SRC = path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js');
const src = fs.readFileSync(SRC, 'utf8');

const noop = () => {};
const mockEl = () => ({ style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, appendChild: noop, removeChild: noop, addEventListener: noop, removeEventListener: noop, setAttribute: noop, getAttribute: () => null, focus: noop, blur: noop, click: noop, getContext: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }), querySelector: () => null, querySelectorAll: () => [], matches: () => false, contains: () => false, requestFullscreen: noop, clientWidth: 0, clientHeight: 0, innerWidth: 0, innerHeight: 0, width: 0, height: 0, value: '', textContent: '', innerHTML: '' });

class MockWS {
  constructor(url) { this.url = url; this.readyState = 1; this.sent = []; this.listeners = {}; }
  send(d) { this.sent.push(d); }
  close() { this.readyState = 3; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  removeEventListener(t, f) { if (this.listeners[t]) this.listeners[t] = this.listeners[t].filter((x) => x !== f); }
  get onmessage() { return this._onmessage; }
  set onmessage(f) { this._onmessage = f; }
  _emit(t, ev) { (this.listeners[t] || []).forEach((f) => f(ev)); if (t === 'message' && this._onmessage) this._onmessage(ev); }
}

const cw = {
  location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl(), documentElement: mockEl() },
  addEventListener: noop, postMessage: noop,
  Math, parseInt, parseFloat, isNaN, isFinite, Number, String, Boolean, Object, Array, Date, JSON,
  Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
  ArrayBuffer, DataView, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, Error, TypeError,
  TextEncoder, TextDecoder, console, crypto: webcrypto,
  WebSocket: MockWS,
  HTMLCanvasElement: function () {}, Document: function () {}, EventTarget: function () {}, Event: function () {},
  MouseEvent: function () {}, Element: function () {}, WebGL2RenderingContext: function () {}, Function,
  atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
};

const w = {
  innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
  location: { href: 'https://deadshot.io/', protocol: 'https:', host: 'deadshot.io', hostname: 'deadshot.io', port: '', pathname: '/', search: '', hash: '' },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
  document: { createElement: (tag) => { const el = mockEl(); if (tag === 'iframe') { el.contentWindow = cw; el.contentDocument = cw.document; el.setAttribute = noop; } return el; }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '', readyState: 'complete', visibilityState: 'visible', hidden: false, createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [] },
  WebSocket: MockWS, XMLHttpRequest: function () { this.open = noop; this.send = noop; this.setRequestHeader = noop; this.addEventListener = noop; },
  fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve(''), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 }, sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
  addEventListener: noop, removeEventListener: noop, requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout, setTimeout, clearTimeout, setInterval, clearInterval,
  Audio: function () { this.play = noop; this.pause = noop; this.addEventListener = noop; }, Image: function () { this.addEventListener = noop; }, MutationObserver: function (cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
  console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, parseInt, parseFloat, isNaN, isFinite, unescape, encodeURIComponent, decodeURIComponent, globalThis: null, crypto: webcrypto, performance: { now: () => Date.now() }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), alert: noop, confirm: () => false, prompt: () => null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
};
w.globalThis = w; w.window = w; w.self = w; w.top = w; w.parent = w; w.opener = null;
const genericCtor = function Generic() {}; genericCtor.prototype = {};
const handler = { get(t, p) { if (p in t) return t[p]; if (p === Symbol.toPrimitive) return () => '[mock]'; return genericCtor; }, has() { return true; } };
const permissive = new Proxy(w, handler);
w.globalThis = permissive; w.window = permissive; w.self = permissive; w.top = permissive; w.parent = permissive;

// inject probe at the end of the loader body
function skipString(str, i, q) { for (i = i + 1; i < str.length; i++) { const c = str[i]; if (c === '\\') { i++; continue; } if (c === q) return i; } return str.length; }
const fnIdx = src.indexOf("function(){'use strict'", 23424);
const bodyStart = src.indexOf('{', fnIdx);
let depth = 0, bodyEnd = -1;
for (let j = bodyStart; j < src.length; j++) {
  const c = src[j];
  if (c === '"' || c === "'" || c === '`') { j = skipString(src, j, c); continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { bodyEnd = j; break; } }
}

const probeFile = process.argv[2];
const probe = probeFile ? fs.readFileSync(probeFile, 'utf8') : 'window.__probeResult = {ok:true};';
const patched = src.slice(0, bodyEnd) + '\n;' + probe + '\n' + src.slice(bodyEnd);

vm.createContext(permissive);
try { vm.runInContext(patched, permissive, { filename: 'game.js', timeout: 60000 }); } catch (e) { console.log('RUN THREW:', e.message); }

const r = permissive.__probeResult;
if (r !== undefined) {
  console.log(JSON.stringify(r, (k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v), 1));
}

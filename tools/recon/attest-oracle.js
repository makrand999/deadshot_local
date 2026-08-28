// Decisive experiment for the msg62 proof.
// Runs the real loader in a VM, reads the module-scope attestation variables,
// calls SM2pwJ("XraP2x") with the real captured msg61 constants (a,b,c,d) and
// the loader's own Chy7gN/wufmly, and compares the resulting 32-byte proof
// against the proof captured from a real session (raw/captures/real-spawn.json).
//
// If it matches, the loader computation is fully reproducible; the exact
// algorithm can then be read from the resolved method statically.
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
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36', platform: 'Win32', language: 'en-US', languages: ['en-US'], onLine: true },
    document: { createElement: (tag) => { const el = mockEl(); if (tag === 'iframe') { const cw = { location: { href: 'about:blank' }, document: { createElement: () => mockEl(), body: mockEl() }, addEventListener: noop, postMessage: noop }; el.contentWindow = cw; el.contentDocument = cw.document; } return el; }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: mockEl(), documentElement: mockEl(), head: mockEl(), title: '', cookie: '', readyState: 'complete', visibilityState: 'visible', hidden: false, createEvent: () => ({ initEvent: noop }), getElementsByTagName: () => [], getElementsByClassName: () => [] },
    WebSocket: function MockWS() { this.send = noop; this.close = noop; this.addEventListener = noop; this.onmessage = null; this.onopen = null; this.onclose = null; this.onerror = null; this.readyState = 3; },
    XMLHttpRequest: function () { this.open = noop; this.send = noop; this.setRequestHeader = noop; this.addEventListener = noop; },
    fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve(''), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 }, sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    addEventListener: noop, removeEventListener: noop, requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout, setTimeout, clearTimeout, setInterval, clearInterval,
    Audio: function () { this.play = noop; this.pause = noop; this.addEventListener = noop; }, Image: function () { this.addEventListener = noop; }, MutationObserver: function (cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
    console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, globalThis: null,
    crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; }, subtle: {} },
    performance: { now: () => Date.now() }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), alert: noop, confirm: () => false, prompt: () => null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  };
  w.globalThis = w; w.window = w; w.self = w; w.top = w; w.parent = w; w.opener = null;
  const genericCtor = function Generic() {}; genericCtor.prototype = {};
  const handler = { get(t, p) { if (p in t) return t[p]; if (p === Symbol.toPrimitive) return () => '[mock global]'; return genericCtor; }, has() { return true; } };
  const permissive = new Proxy(w, handler);
  w.globalThis = permissive; w.window = permissive; w.self = permissive; w.top = permissive; w.parent = permissive;
  return w;
}

// Instrument: after bootstrap, expose the module-scope attestation vars.
const INJECT = `
  (function(){
    try {
      window.__attestState = {
        wufmly: typeof wufmly !== 'undefined' ? wufmly : null,
        Chy7gN: typeof Chy7gN !== 'undefined' ? Chy7gN : null,
        TbP2Dy: typeof TbP2Dy !== 'undefined' ? TbP2Dy : null,
        WY6pCGw: typeof WY6pCGw !== 'undefined' ? WY6pCGw : null,
        SM2pwJ: typeof SM2pwJ !== 'undefined' ? SM2pwJ : null,
        q7pZFiKeys: (function(){ try { var q=typeof q7pZFi!=='undefined'?q7pZFi:null; if(!q) return null; var k=[]; for(var p in q) k.push(p); return k; } catch(e){ return 'err:'+e.message; } })()
      };
    } catch(e) { window.__attestState = { err: e.message }; }
  })();
`;
// Append after the whole source (bootstrap runs synchronously at top level)
let instrumented = src + INJECT;

const sandbox = makeMockWindow();
vm.createContext(sandbox);
try { vm.runInContext(instrumented, sandbox, { filename: 'game.js', timeout: 30000 }); } catch (e) { console.log('run note:', e.message); }

const st = sandbox.__attestState || {};
console.log('state keys:', Object.keys(st));
function hex(v){ if (v == null) return String(v); if (typeof v === 'string') return v; if (typeof v === 'number') return '0x'+v.toString(16); if (Buffer.isBuffer(v)) return v.toString('hex'); if (v && v.buffer) return Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString('hex'); return String(v); }
console.log('wufmly :', typeof st.wufmly, st.wufmly && st.wufmly.byteLength !== undefined ? st.wufmly.byteLength + 'B ' + Buffer.from(st.wufmly).toString('hex').slice(0,32)+'…' : hex(st.wufmly).slice(0,80));
console.log('Chy7gN :', typeof st.Chy7gN, st.Chy7gN && st.Chy7gN.byteLength !== undefined ? st.Chy7gN.byteLength + 'B ' + Buffer.from(st.Chy7gN).toString('hex') : hex(st.Chy7gN));
console.log('TbP2Dy :', hex(st.TbP2Dy));
console.log('WY6pCGw:', hex(st.WY6pCGw));
console.log('q7pZFi keys:', st.q7pZFiKeys ? st.q7pZFiKeys.length + ' => ' + st.q7pZFiKeys.join(',') : st.q7pZFiKeys);

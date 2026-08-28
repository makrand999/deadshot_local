// Capture the game's WebSocket traffic by running the client in our sandboxed VM
// with a LOGGING WebSocket mock. The game's own wasm-bindgen layer will construct
// the real WS URL and send frames — we record them all.
//
// Usage: node tools/capture-vm.js [seconds]
//
// This does NOT execute any malicious code — it runs the game's own bootstrap in a
// sandbox with mocks, same as deobfuscate.js, and logs what the game WOULD send.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = 'raw/bundles/game.js';
const OUT = path.join(__dirname, '..', '..', 'raw', 'captures');
fs.mkdirSync(OUT, { recursive: true });

const captured = { sockets: [], frames: [], wasmUrls: [], fetches: [], xhrs: [] };

// --- Logging WebSocket mock ---
function makeLoggingWS(url, protocols) {
  const ws = {
    url, protocol: protocols ? (Array.isArray(protocols) ? protocols[0] : protocols) : '',
    readyState: 0, bufferedAmount: 0, extensions: '',
    binaryType: 'blob',
    onopen: null, onmessage: null, onclose: null, onerror: null,
    send(data) {
      const s = {
        url, dir: 'send', time: Date.now(),
        kind: typeof data === 'string' ? 'text' : (data instanceof ArrayBuffer ? 'arraybuffer' : 'binary'),
        data: typeof data === 'string' ? data : (data instanceof ArrayBuffer ? Buffer.from(data).toString('hex') : (data && data.buffer ? Buffer.from(data.buffer).toString('hex') : String(data))),
      };
      captured.frames.push(s);
      if (captured.sockets.find((x) => x.url === url)) captured.sockets.find((x) => x.url === url).sent++;
    },
    close() { this.readyState = 3; const e = captured.sockets.find((x) => x.url === url); if (e) e.closed = true; },
    addEventListener(ev, fn) { if (ev === 'open') this.onopen = fn; else if (ev === 'message') this.onmessage = fn; else if (ev === 'close') this.onclose = fn; else if (ev === 'error') this.onerror = fn; },
  };
  if (!captured.sockets.find((x) => x.url === url)) {
    captured.sockets.push({ url, protocols: protocols || [], sent: 0, recv: 0, closed: false });
    console.log('WS CONNECT:', url, protocols || '');
  }
  // simulate open
  setTimeout(() => { ws.readyState = 1; if (ws.onopen) ws.onopen({ target: ws }); }, 50);
  return ws;
}

// --- Logging fetch/XHR ---
// Use the REAL Node fetch so wasm-bindgen can download the actual .wasm from the
// live site (deadshot.io is reachable now). Record the URLs.
async function logFetch(url, opts) {
  captured.fetches.push({ url, opts: opts ? String(opts) : '' });
  console.log('FETCH:', url);
  try {
    const resp = await fetch(url, opts);
    // record wasm-ish responses
    if (/\.wasm|wasm/i.test(url) || (resp.headers.get('content-type') || '').includes('wasm')) {
      const buf = await resp.clone().arrayBuffer();
      captured.wasmUrls.push({ via: 'fetch', url, bytes: buf.byteLength });
      console.log('WASM via fetch:', url, buf.byteLength, 'bytes');
    }
    return resp;
  } catch (e) {
    console.log('fetch error:', url, e.message);
    return { ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve(''), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), clone: () => null };
  }
}

// --- Build the mock browser env (same as deobfuscate.js) ---
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
    WebSocket: makeLoggingWS,
    XMLHttpRequest: function () { this.open = (m, u) => { this.url = u; }; this.send = () => { captured.xhrs.push(this.url); console.log('XHR:', this.url); }; this.setRequestHeader = noop; this.addEventListener = noop; },
    fetch: (url, opts) => logFetch(String(url), opts),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 },
    addEventListener: noop, removeEventListener: noop, requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout, setTimeout, clearTimeout, setInterval, clearInterval,
    Audio: function () { this.play = noop; this.pause = noop; this.addEventListener = noop; }, Image: function () { this.addEventListener = noop; }, MutationObserver: function (cb) { this.observe = noop; this.disconnect = noop; this.takeRecords = () => []; },
    console, TextDecoder, TextEncoder, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Array, String, Number, Object, Boolean, Math, Date, JSON, RegExp, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol, Reflect, Proxy, ArrayBuffer, DataView, Buffer, globalThis: null,
    crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; }, subtle: { digest: async () => new ArrayBuffer(32), importKey: async () => ({}), generateKey: async () => ({}), encrypt: async () => new ArrayBuffer(16), decrypt: async () => new ArrayBuffer(16) } },
    performance: { now: () => Date.now() }, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), alert: noop, confirm: () => false, prompt: () => null, atob: (s) => Buffer.from(s, 'base64').toString('binary'), btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    WebAssembly,
  };
  w.globalThis = w; w.window = w; w.self = w; w.top = w; w.parent = w; w.opener = null;
  const genericCtor = function Generic() {}; genericCtor.prototype = {};
  const handler = { get(t, p) { if (p in t) return t[p]; if (p === Symbol.toPrimitive) return () => '[mock global]'; return genericCtor; }, has() { return true; } };
  const permissive = new Proxy(w, handler);
  w.globalThis = permissive; w.window = permissive; w.self = permissive; w.top = permissive; w.parent = permissive;
  return w;
}

const src = fs.readFileSync(path.join(__dirname, '..', SRC), 'utf8');
const sandbox = makeMockWindow();
vm.createContext(sandbox);

// Trap WebAssembly.instantiate/instantiateStreaming to record the module bytes/URL
const realWA = sandbox.WebAssembly;
sandbox.WebAssembly = new Proxy(realWA, {
  get(t, p) {
    if (p === 'instantiateStreaming') {
      return async (resp, imports) => {
        try {
          const buf = await (resp && resp.arrayBuffer ? resp.arrayBuffer() : null);
          if (buf) { captured.wasmUrls.push({ via: 'instantiateStreaming', bytes: buf.byteLength }); console.log('WASM via instantiateStreaming:', buf.byteLength, 'bytes'); }
        } catch (e) {}
        return t.instantiate(buf || new ArrayBuffer(8), imports);
      };
    }
    if (p === 'instantiate') {
      return async (bytes, imports) => {
        if (bytes && bytes.byteLength) { captured.wasmUrls.push({ via: 'instantiate', bytes: bytes.byteLength }); console.log('WASM via instantiate:', bytes.byteLength, 'bytes'); }
        return { instance: { exports: {} }, module: {} };
      };
    }
    return t[p];
  },
});

console.log('running game in VM (async window)...');
try { vm.runInContext(src, sandbox, { timeout: 20000 }); } catch (e) { console.log('exec note:', e.message); }

// Let async timers/promises run
const waitMs = parseInt(process.argv[2] || '15000', 10);
setTimeout(() => {
  fs.writeFileSync(path.join(OUT, 'vm-capture.json'), JSON.stringify(captured, null, 2));
  console.log('\n=== CAPTURE SUMMARY ===');
  console.log('WS sockets:', captured.sockets.length);
  for (const s of captured.sockets) console.log('  ' + s.url + ' (sent ' + s.sent + ')');
  console.log('WS frames:', captured.frames.length);
  console.log('fetches:', captured.fetches.length);
  for (const f of captured.fetches.slice(0, 20)) console.log('  ' + f.url);
  console.log('wasm:', captured.wasmUrls.length);
  console.log('xhrs:', captured.xhrs.length);
  console.log('\nsaved', path.join(OUT, 'vm-capture.json'));
  process.exit(0);
}, waitMs);

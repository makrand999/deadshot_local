// CDP capture: launch headless Chrome, load deadshot.io, capture:
//   - WebSocket connection URLs + all frames (send/receive)
//   - Network responses (to grab the .wasm)
//   - Console errors
// Usage: node tools/capture.js [seconds]
//
// Uses raw CDP over WebSocket (Node 24 built-in WebSocket). No deps.

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const OUT_DIR = path.join(__dirname, '..', '..', 'raw', 'captures');
const SECONDS = parseInt(process.argv[2] || '25', 10);
const PROFILE = path.join(require('os').tmpdir(), 'ds-capture-' + Date.now());

fs.mkdirSync(OUT_DIR, { recursive: true });

const wsUrls = new Map(); // url -> { sent: [], recv: [], count }
const responses = new Map(); // requestId -> { url, mime, base64 }
let chromeProc;

function log(msg) { console.log('[' + new Date().toISOString().slice(11, 19) + ']', msg); }

function startChrome() {
  return new Promise((resolve, reject) => {
    chromeProc = spawn(CHROME, [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=' + PORT,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--window-size=1280,800',
      '--user-data-dir=' + PROFILE,
      'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    chromeProc.on('error', reject);
    // Poll for CDP instead of relying on stderr text
    let tries = 0;
    const poll = () => {
      http.get('http://127.0.0.1:' + PORT + '/json/version', (res) => {
        res.resume();
        res.on('end', () => resolve());
      }).on('error', () => {
        if (++tries > 15) reject(new Error('chrome CDP not up'));
        else setTimeout(poll, 1000);
      });
    };
    poll();
    setTimeout(() => reject(new Error('chrome start timeout')), 20000);
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// --- CDP client over Node's WebSocket ---
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = {}; }
  static async connect(port) {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) { c.pending.get(msg.id)(msg); c.pending.delete(msg.id); }
      else if (msg.method) {
        const h = c.events[msg.method];
        if (h) h.forEach((fn) => fn(msg.params));
      }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
  close() { this.ws.close(); }
}

async function main() {
  log('starting Chrome...');
  await startChrome();
  log('connecting CDP...');
  const cdp = await CDP.connect(PORT);

  // --- Enable domains ---
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  // --- Track WebSocket frames ---
  cdp.on('Network.webSocketCreated', (p) => {
    if (!wsUrls.has(p.url)) wsUrls.set(p.url, { sent: 0, recv: 0, frames: [], initiator: p.initiator || null });
    log('WS created: ' + p.url);
  });
  cdp.on('Network.webSocketFrameSent', (p) => {
    const e = wsUrls.get(p.response.url);
    if (e) { e.sent++; e.frames.push({ dir: 'send', time: Date.now(), payload: p.response.payloadData }); }
  });
  cdp.on('Network.webSocketFrameReceived', (p) => {
    const e = wsUrls.get(p.response.url);
    if (e) { e.recv++; e.frames.push({ dir: 'recv', time: Date.now(), payload: p.response.payloadData }); }
  });
  cdp.on('Network.webSocketClosed', (p) => {
    log('WS closed: ' + p.url);
  });

  // --- Track network responses (wasm + others of interest) ---
  cdp.on('Network.responseReceived', (p) => {
    const type = p.type;
    if (type === 'Wasm' || (p.response && p.response.mimeType && p.response.mimeType.includes('wasm'))) {
      log('WASM response: ' + p.response.url + ' (status ' + p.response.status + ')');
    }
    responses.set(p.requestId, { url: p.response.url, mime: p.response.mimeType, status: p.response.status, type });
  });
  cdp.on('Network.loadingFinished', async (p) => {
    const meta = responses.get(p.requestId);
    if (!meta) return;
    const isWasm = meta.type === 'Wasm' || (meta.mime && meta.mime.includes('wasm')) || /\.wasm($|\?)/.test(meta.url);
    if (isWasm) {
      try {
        const r = await cdp.send('Network.getResponseBody', { requestId: p.requestId });
        if (r.result && r.result.body) {
          const buf = Buffer.from(r.result.body, r.result.base64Encoded ? 'base64' : 'utf8');
          const fname = 'wasm_' + Date.now() + '_' + meta.url.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 60) + '.wasm';
          fs.writeFileSync(path.join(OUT_DIR, fname), buf);
          log('saved WASM: ' + fname + ' (' + buf.length + ' bytes) from ' + meta.url);
        }
      } catch (e) { log('getResponseBody failed: ' + e.message); }
    }
  });

  // --- Console / errors ---
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'warning') {
      const text = (p.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 200);
      log('console.' + p.type + ': ' + text);
    }
  });
  cdp.on('Runtime.exceptionThrown', (p) => {
    const d = p.exceptionDetails;
    log('EXCEPTION: ' + ((d.exception && d.exception.description) || d.text || '').slice(0, 300));
  });

  // --- Navigate ---
  log('navigating to https://deadshot.io/ ...');
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });
  log('capturing for ' + SECONDS + 's...');
  await new Promise((r) => setTimeout(r, SECONDS * 1000));

  // --- Dump ---
  log('writing capture files...');
  const wsOut = [];
  for (const [url, e] of wsUrls) {
    wsOut.push({ url, sent: e.sent, recv: e.recv, frames: e.frames.slice(0, 500) });
  }
  fs.writeFileSync(path.join(OUT_DIR, 'websockets.json'), JSON.stringify(wsOut, null, 2));
  log('websockets.json: ' + wsOut.length + ' connections');

  const wasmHits = [...responses.values()].filter((r) => r.type === 'Wasm' || /\.wasm/.test(r.url) || (r.mime && r.mime.includes('wasm')));
  fs.writeFileSync(path.join(OUT_DIR, 'responses.json'), JSON.stringify([...responses.values()], null, 2));
  log('responses.json: ' + responses.size + ' responses, ' + wasmHits.length + ' wasm-ish');

  cdp.close();
  chromeProc.kill();
  log('done. Files in ' + OUT_DIR);
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); process.exit(1); });

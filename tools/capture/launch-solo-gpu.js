// ONE hardware-accelerated visible Chrome against the running LAN server.
// Records ws frames, console, errors, screenshots. No server is spawned.
// Usage: node tools/launch-solo-gpu.js [url] [minutes]
// Stop early: touch /tmp/opencode/stop-solo
import { spawn } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const PORT = 9249;
const STOP = '/tmp/opencode/stop-solo';
const URL = process.argv[2] || 'http://10.76.7.224:8080/';
const MINUTES = parseInt(process.argv[3] || '10', 10);
const OUT = path.join(ROOT, 'raw', 'captures', 'solo-gpu.json');

let chromeProc;
const wsUrls = new Set();
const wsFrames = [];
const logs = [];
const errors = [];
const shots = [];
const log = (...a) => console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = {}; }
  static async connect(port) {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); }
      else if (m.method && c.events[m.method]) c.events[m.method].forEach((f) => f(m.params));
    };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
  close() { try { this.ws.close(); } catch (e) {} }
}

async function main() {
  fs.rmSync(STOP, { force: true });
  const flags = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run', '--no-default-browser-check',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy',
    '--window-size=1280,800', '--user-data-dir=' + os.tmpdir() + '/ds-solo-' + Date.now(),
    'about:blank',
  ];
  chromeProc = spawn(CHROME, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
  for (let t = 0; t < 30; t++) {
    try { await getJson(`http://127.0.0.1:${PORT}/json/version`); break; } catch (e) { await sleep(800); }
  }
  let targets = await getJson(`http://127.0.0.1:${PORT}/json`);
  let page = targets.find((t) => t.type === 'page');
  for (let t = 0; t < 15 && !page; t++) { await sleep(1000); targets = await getJson(`http://127.0.0.1:${PORT}/json`); page = targets.find((x) => x.type === 'page'); }
  const cdp = await CDP.connect(PORT);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Network.webSocketCreated', (p) => { if (p.url) { wsUrls.add(p.url); log('WS:', p.url); } });
  cdp.on('Network.webSocketFrameSent', (p) => wsFrames.push({ dir: 'S', hex: Buffer.from(p.response.payloadData).toString('hex') }));
  cdp.on('Network.webSocketFrameReceived', (p) => wsFrames.push({ dir: 'R', hex: Buffer.from(p.response.payloadData).toString('hex') }));
  cdp.on('Runtime.consoleAPICalled', (p) => logs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 300)));

  log('HARDWARE-ACCELERATED window -> ' + URL);
  log('Play and tell me when done (or touch ' + STOP + ', or ' + MINUTES + ' min)');
  await cdp.send('Page.navigate', { url: URL });

  const deadline = Date.now() + MINUTES * 60000;
  let last = Date.now();
  let snap = 0;
  let probe = 0;
  const BRIDGE = `(() => { if (window.__dsTest) return window.__dsTest; const w = window.__dsIframeWins || []; for (let i = 0; i < w.length; i++) { try { if (w[i] && w[i].__dsTest) return w[i].__dsTest; } catch (e) {} } return null; })()`;
  while (Date.now() < deadline) {
    await sleep(5000);
    if (Date.now() - last > 15000) {
      last = Date.now();
      log('frames=' + wsFrames.length + ' errors=' + errors.length);
      for (const e of errors.slice(-2)) log('  err: ' + e.slice(0, 150));
    }
    if (Date.now() - probe > 15000) {
      probe = Date.now();
      try {
        const r = await send('Runtime.evaluate', { expression: `(() => { const b = ${BRIDGE}; if (!b) return 'no-bridge'; const g = b.gameState(); const u = b.ui(); return JSON.stringify({gs: g, ui: u}); })()`, returnByValue: true });
        if (r.result?.result?.value && r.result.result.value !== 'no-bridge') log('probe: ' + String(r.result.result.value).slice(0, 400));
      } catch (e) {}
    }
    if (Date.now() - snap > 45000) {
      snap = Date.now();
      try {
        const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const f = '/tmp/opencode/solo-' + Math.round(snap / 1000) + '.png';
        fs.writeFileSync(f, Buffer.from(r.result.data, 'base64'));
        shots.push(f);
      } catch (e) {}
    }
    if (fs.existsSync(STOP)) { log('stop marker'); break; }
  }
  const out = { ts: Date.now(), url: URL, wsUrls: [...wsUrls], websockets: wsFrames, logs, errors, shots };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  log('saved ' + OUT + ' frames=' + wsFrames.length);
  cdp.close();
  chromeProc.kill();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e && e.stack ? e.stack : e); if (chromeProc) chromeProc.kill(); process.exit(1); });

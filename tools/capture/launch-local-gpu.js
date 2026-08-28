// Local server + ONE visible Chrome with HARDWARE acceleration for manual play.
// Usage: node tools/launch-local-gpu.js [minutes]
// Stop early: touch /tmp/opencode/stop-local
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
const STOP = '/tmp/opencode/stop-local';
const MINUTES = parseInt(process.argv[2] || '8', 10);
const PROFILE = path.join(os.tmpdir(), 'ds-gpu-' + Date.now());

let chromeProc, serverProc;
const wsUrls = new Set();
const wsFrames = [];
const logs = [];
const errors = [];
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
  serverProc = spawn('node', ['server/src/index.mjs'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DS_TEST_MODE: '1', DS_AUTO_LOGIN: '1' },
  });
  serverProc.stdout.on('data', (d) => process.stdout.write('[server] ' + d));
  serverProc.stderr.on('data', (d) => process.stderr.write('[server!] ' + d));
  await sleep(2500);

  const flags = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run', '--no-default-browser-check',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy',
    '--host-resolver-rules=MAP 192.168.local 127.0.0.1',
    '--window-size=1280,800', '--user-data-dir=' + PROFILE, 'about:blank',
  ];
  chromeProc = spawn(CHROME, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
  for (let t = 0; t < 30; t++) {
    try { await getJson(`http://127.0.0.1:${PORT}/json/version`); break; } catch (e) { await sleep(800); }
  }
  const cdp = await CDP.connect(PORT);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Network.webSocketFrameSent', (p) => wsFrames.push({ dir: 'S', hex: Buffer.from(p.response.payloadData).toString('hex') }));
  cdp.on('Network.webSocketFrameReceived', (p) => wsFrames.push({ dir: 'R', hex: Buffer.from(p.response.payloadData).toString('hex') }));
  cdp.on('Runtime.consoleAPICalled', (p) => logs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 200)));

  log('HARDWARE-ACCELERATED local game ready at http://192.168.local:8080/');
  log('Click PLAY, pick a class, test the mouse. Stop: touch ' + STOP + ' (or ' + MINUTES + ' min)');
  await cdp.send('Page.navigate', { url: 'http://192.168.local:8080/' });

  const deadline = Date.now() + MINUTES * 60000;
  let last = Date.now();
  while (Date.now() < deadline) {
    await sleep(5000);
    if (Date.now() - last > 15000) {
      last = Date.now();
      log('frames=' + wsFrames.length + ' errors=' + errors.length);
      const perms = errors.filter((e) => e.includes('Permissions'));
      if (perms.length) log('  permissions-check errors: ' + perms.length + ' e.g. ' + perms[0].slice(0, 120));
    }
    if (fs.existsSync(STOP)) { log('stop marker'); break; }
  }
  const out = { ts: Date.now(), wsUrls: [...wsUrls], websockets: wsFrames, logs, errors };
  fs.writeFileSync(path.join(ROOT, 'raw', 'local-gpu.json'), JSON.stringify(out, null, 2));
  log('saved raw/local-gpu.json frames=' + wsFrames.length);
  cdp.close();
  chromeProc.kill();
  serverProc.kill();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e && e.stack ? e.stack : e); if (chromeProc) chromeProc.kill(); if (serverProc) serverProc.kill(); process.exit(1); });

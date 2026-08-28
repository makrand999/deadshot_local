// Local server + TWO visible Chrome instances (hardware acceleration) for
// manual multiplayer testing. Create a party in one window, join with the
// Party ID in the other, both READY, pick classes, play.
// Usage: node tools/launch-local-gpu2.js [minutes]
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
const PORTS = [9249, 9250];
const STOP = '/tmp/opencode/stop-local';
const MINUTES = parseInt(process.argv[2] || '12', 10);

let serverProc;
const clients = PORTS.map((port, i) => ({
  port, profile: path.join(os.tmpdir(), 'ds-gpu2-' + i + '-' + Date.now()),
  proc: null, cdp: null, wsUrls: new Set(), frames: [], logs: [], errors: [],
}));
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

async function launchClient(c) {
  const flags = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + c.port, '--no-first-run', '--no-default-browser-check',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy',
    '--host-resolver-rules=MAP 192.168.local 127.0.0.1',
    '--window-size=1280,800', '--user-data-dir=' + c.profile, 'about:blank',
  ];
  c.proc = spawn(CHROME, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
  for (let t = 0; t < 30; t++) {
    try { await getJson(`http://127.0.0.1:${c.port}/json/version`); break; } catch (e) { await sleep(800); }
  }
  const cdp = await CDP.connect(c.port);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Network.webSocketCreated', (p) => { if (p.url) c.wsUrls.add(p.url); });
  cdp.on('Network.webSocketFrameSent', (p) => c.frames.push({ dir: 'S', hex: Buffer.from(p.response.payloadData).toString('hex') }));
  cdp.on('Network.webSocketFrameReceived', (p) => c.frames.push({ dir: 'R', hex: Buffer.from(p.response.payloadData).toString('hex') }));
  cdp.on('Runtime.consoleAPICalled', (p) => c.logs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => c.errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 200)));
  c.cdp = cdp;
  await cdp.send('Page.navigate', { url: 'http://192.168.local:8080/' });
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

  await Promise.all(clients.map(launchClient));
  log('TWO hardware-accelerated windows ready at http://192.168.local:8080/');
  log('Host: create a party in window A, copy the Party ID, join it in window B, both READY, pick classes.');
  log('Stop: touch ' + STOP + ' (or ' + MINUTES + ' min)');

  const deadline = Date.now() + MINUTES * 60000;
  let last = Date.now();
  let saveCount = 0;
  const saveAll = () => {
    for (const c of clients) {
      const f = path.join(ROOT, 'raw', 'local-gpu2-' + c.port + '.json');
      fs.writeFileSync(f, JSON.stringify({ ts: Date.now(), wsUrls: [...c.wsUrls], websockets: c.frames, logs: c.logs, errors: c.errors }, null, 2));
      log('saved ' + f + ' frames=' + c.frames.length);
    }
  };
  process.on('SIGTERM', () => { saveAll(); for (const c of clients) { try { c.proc && c.proc.kill(); } catch (e2) {} } try { serverProc && serverProc.kill(); } catch (e2) {} process.exit(0); });
  while (Date.now() < deadline) {
    await sleep(5000);
    if (Date.now() - last > 15000) {
      last = Date.now();
      saveAll();
      log('frames=' + clients.map((c) => c.frames.length).join('/') + ' ws=' + clients.map((c) => c.wsUrls.size).join('/'));
      for (const c of clients) {
        const perms = c.errors.filter((e) => e.includes('Permissions'));
        if (perms.length) log('  window ' + c.port + ' permission errors: ' + perms.length);
      }
    }
    if (fs.existsSync(STOP)) { log('stop marker'); break; }
  }
  for (const c of clients) {
    fs.writeFileSync(path.join(ROOT, 'raw', 'local-gpu2-' + c.port + '.json'),
      JSON.stringify({ ts: Date.now(), wsUrls: [...c.wsUrls], websockets: c.frames, logs: c.logs, errors: c.errors }, null, 2));
    log('saved raw/local-gpu2-' + c.port + '.json frames=' + c.frames.length);
    c.cdp.close();
    c.proc.kill();
  }
  serverProc.kill();
  process.exit(0);
}
main().catch((e) => {
  console.error('FATAL:', e && e.stack ? e.stack : e);
  for (const c of clients) { try { c.proc && c.proc.kill(); } catch (e2) {} }
  try { serverProc && serverProc.kill(); } catch (e2) {}
  process.exit(1);
});

// Dual real-server capture — two GPU Chromes vs https://deadshot.io/
//
// Opens two visible Chromes, each navigates to https://deadshot.io/.
// YOU play both windows (join same region/party if you want same lobby).
// Per-client wire logs: websockets[] keeps {dir:'S'|'R', len, hex} so
//   client S (1 FRF input, 8 shots) and server R (2 K11 enemy pos, etc.)
//   are separable per window — correlate B's S val/x/y against A's R id=B.
// Outputs:
//   raw/captures/real-spawn-clientA.json  (window A)
//   raw/captures/real-spawn-clientB.json  (window B)
//   raw/captures/real-duo.json            (combined meta)
//   raw/analysis/real-spawn-clientA-decoded.txt
//   raw/analysis/real-spawn-clientB-decoded.txt
// Stop early: touch /tmp/opencode/stop-record-duo  (or wait MINUTES)
// Usage: VISIBLE=1 node tools/capture/record-real-server-duo.js [minutes]

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
const STOP = '/tmp/opencode/stop-record-duo';
const MINUTES = parseInt(process.argv[2] || '6', 10);
const OUT_A = path.join(ROOT, 'raw', 'captures', 'real-spawn-clientA.json');
const OUT_B = path.join(ROOT, 'raw', 'captures', 'real-spawn-clientB.json');
const OUT_DUO = path.join(ROOT, 'raw', 'captures', 'real-duo.json');
const OUT_DEC_A = path.join(ROOT, 'raw', 'analysis', 'real-spawn-clientA-decoded.txt');
const OUT_DEC_B = path.join(ROOT, 'raw', 'analysis', 'real-spawn-clientB-decoded.txt');

const VISIBLE = process.env.VISIBLE === '1' || process.env.VISIBLE === 'true';
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

const clients = PORTS.map((port, i) => ({
  label: i === 0 ? 'A' : 'B',
  port,
  profile: path.join(os.tmpdir(), `ds-rec-duo-${i}-${Date.now()}`),
  proc: null,
  cdp: null,
  wsUrls: new Set(),
  frames: [],
  consoleMsgs: [],
  errors: [],
}));

function flagsFor(c) {
  const base = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + c.port, '--no-first-run', '--no-default-browser-check',
    '--window-size=1280,800', '--user-data-dir=' + c.profile, 'about:blank',
  ];
  if (VISIBLE) {
    base.splice(4, 0, '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-zero-copy');
  } else {
    base.unshift('--headless=new');
    base.splice(5, 0, '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader');
  }
  return base;
}

async function launchClient(c) {
  const flags = flagsFor(c);
  c.proc = spawn(CHROME, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
  for (let t = 0; t < 30; t++) {
    try { await getJson(`http://127.0.0.1:${c.port}/json/version`); break; } catch (e) { await sleep(800); }
  }
  const cdp = await CDP.connect(c.port);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Network.webSocketCreated', (p) => { if (p.url) { c.wsUrls.add(p.url); log(`[${c.label}] WS`, p.url); } });
  cdp.on('Network.webSocketFrameSent', (p) => {
    if (p.response?.url) c.wsUrls.add(p.response.url);
    c.frames.push({ dir: 'S', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex') });
  });
  cdp.on('Network.webSocketFrameReceived', (p) => {
    if (p.response?.url) c.wsUrls.add(p.response.url);
    c.frames.push({ dir: 'R', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex') });
  });
  cdp.on('Runtime.consoleAPICalled', (p) => c.consoleMsgs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => c.errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 200)));
  c.cdp = cdp;
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });
  log(`[${c.label}] navigated to https://deadshot.io/ on :${c.port}`);
}

async function saveClient(c, outPath, outDecPath) {
  const summary = {
    ts: Date.now(),
    label: c.label,
    url: 'https://deadshot.io/',
    wsUrls: [...c.wsUrls],
    websockets: c.frames,
    console: c.consoleMsgs.slice(0, 400),
    errors: c.errors.slice(0, 100),
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  log(`[${c.label}] saved ${outPath} frames=${c.frames.length} (S=${c.frames.filter((f) => f.dir === 'S').length} R=${c.frames.filter((f) => f.dir === 'R').length})`);

  try {
    const { loadSchema, decode } = await import('../../packages/protocol/index.mjs');
    loadSchema();
    const lines = [];
    const hist = new Map();
    for (const f of c.frames) {
      const b64text = Buffer.from(f.hex, 'hex').toString('utf8');
      let bin;
      try { bin = Buffer.from(b64text, 'base64'); } catch { bin = Buffer.from(f.hex, 'hex'); }
      if (!bin.length || bin.length < 2) { lines.push(f.dir + ' len=' + f.len + ' :: <no messages>'); continue; }
      try {
        const msgs = decode(bin);
        if (!msgs.length) { lines.push(f.dir + ' len=' + f.len + ' :: <no messages>'); continue; }
        const parts = [];
        for (const m of msgs) {
          hist.set(m.msgId + '|' + f.dir, (hist.get(m.msgId + '|' + f.dir) || 0) + 1);
          let s = 'msgId=' + m.msgId + ' name=' + m.name;
          if (Object.keys(m.fields).length) s += ' fields={' + Object.entries(m.fields).map(([k, v]) => k + '=' + v).join(',') + '}';
          if (m.string !== undefined) s += ' string=' + JSON.stringify(m.string).slice(0, 80);
          parts.push(s);
        }
        lines.push(f.dir + ' len=' + f.len + ' :: ' + parts.join(' | '));
      } catch (e) {
        lines.push(f.dir + ' len=' + f.len + ' :: <decode err: ' + e.message + '>');
      }
    }
    fs.mkdirSync(path.dirname(outDecPath), { recursive: true });
    fs.writeFileSync(outDecPath, lines.join('\n'));
    log(`[${c.label}] saved ${outDecPath} lines=${lines.length}`);
    log(`[${c.label}] histogram: ` + [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => k + '=' + v).join(' '));
  } catch (e) {
    log(`[${c.label}] decode failed: ${e.message}`);
  }
}

async function main() {
  fs.rmSync(STOP, { force: true });
  for (const c of clients) {
    try { await getJson(`http://127.0.0.1:${c.port}/json/version`); throw new Error(`port ${c.port} already in use — close other recorders first`); } catch (e) { if (e.message.includes('already in use')) throw e; }
  }
  log(`Launching ${clients.length} Chromes for dual capture (VISIBLE=${VISIBLE}, MINUTES=${MINUTES})`);
  await Promise.all(clients.map(launchClient));
  log('RECORDING. Two browsers opened on https://deadshot.io/ — PLAY in both (same party/region for same lobby).');
  log('Stop early: touch ' + STOP + '  (or wait ' + MINUTES + ' min)');
  log('Tip: create party in A, copy code, join in B, both READY to share a lobby. Otherwise each sees bots separately.');

  const deadline = Date.now() + MINUTES * 60000;
  let last = Date.now();
  while (Date.now() < deadline) {
    await sleep(5000);
    if (Date.now() - last > 15000) {
      last = Date.now();
      const elapsed = Math.round((Date.now() - deadline + MINUTES * 60000) / 1000);
      for (const c of clients) {
        log(`t+${elapsed}s [${c.label}] frames=${c.frames.length} (S=${c.frames.filter((f) => f.dir === 'S').length} R=${c.frames.filter((f) => f.dir === 'R').length}) ws=${[...c.wsUrls].join(' ') || '(none yet)'}`);
      }
    }
    if (fs.existsSync(STOP)) { log('stop marker found'); break; }
  }

  await saveClient(clients[0], OUT_A, OUT_DEC_A);
  await saveClient(clients[1], OUT_B, OUT_DEC_B);
  fs.mkdirSync(path.dirname(OUT_DUO), { recursive: true });
  fs.writeFileSync(OUT_DUO, JSON.stringify({
    ts: Date.now(),
    url: 'https://deadshot.io/',
    minutes: MINUTES,
    clients: {
      A: { label: 'A', port: PORTS[0], wsUrls: [...clients[0].wsUrls], frames: clients[0].frames.length },
      B: { label: 'B', port: PORTS[1], wsUrls: [...clients[1].wsUrls], frames: clients[1].frames.length },
    },
    files: { A: OUT_A, B: OUT_B, decA: OUT_DEC_A, decB: OUT_DEC_B },
  }, null, 2));
  log('saved duo meta ' + OUT_DUO);
  log('Done. Correlate: B S msg1 val/x/y/tick -> A R msg2 tdkZouYda=B.id x/y/z. See raw/analysis/real-spawn-client*-decoded.txt');

  for (const c of clients) { try { c.cdp.close(); } catch (e) {} try { c.proc.kill(); } catch (e) {} }
  process.exit(0);
}

main().catch(async (e) => {
  console.error('FATAL:', e && e.stack ? e.stack : e);
  try { await saveClient(clients[0], OUT_A, OUT_DEC_A); } catch (e2) { console.error('save A failed:', e2.message); }
  try { await saveClient(clients[1], OUT_B, OUT_DEC_B); } catch (e2) { console.error('save B failed:', e2.message); }
  for (const c of clients) { try { c.proc && c.proc.kill(); } catch (e2) {} try { c.cdp && c.cdp.close(); } catch (e2) {} }
  process.exit(1);
});

// Record the REAL deadshot.io server flow — no auto-clicking.
//
// Opens a visible Chrome on the real game; YOU play (click PLAY, pick a
// class, shoot). Every WebSocket frame is recorded AND the /attest HTTP
// response body is captured (needed to fit the msg60 token). To finish early:
//   touch /tmp/opencode/stop-record
// otherwise it stops after MINUTES (default 6). Frames are always saved
// (raw/captures/real-spawn.json + raw/analysis/real-spawn-decoded.txt).
//
// Usage: node tools/record-real-server.js [minutes]
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
const PROFILE = path.join(os.tmpdir(), 'ds-rec-' + Date.now());
const STOP = '/tmp/opencode/stop-record';
const MINUTES = parseInt(process.argv[2] || '6', 10);
const OUT = path.join(ROOT, 'raw', 'captures', 'real-spawn.json');
const OUT_DEC = path.join(ROOT, 'raw', 'analysis', 'real-spawn-decoded.txt');
const OUT_ATTEST = path.join(ROOT, 'raw', 'analysis', 'attest-capture.json');

let chromeProc;
const wsUrls = new Set();
const wsFrames = [];
const consoleMsgs = [];
const pageErrors = [];
const attests = [];          // {ts,url,hex,bytes,head} — /attest response bodies
const attestUrl = new Map(); // requestId -> url
const pendingAttest = new Set();

const log = (...args) => console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...args);
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
      if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m.result ?? m); c.pending.delete(m.id); }
      else if (m.method && c.events[m.method]) c.events[m.method].forEach((f) => f(m.params));
    };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
  close() { try { this.ws.close(); } catch (e) {} }
}

function parseWiresharkFrames() {
  // unused; kept as placeholder for frame parse helpers
}

function isMsg60Frame(f) {
  if (f.dir !== 'S' || f.len < 3) return false;
  const b = Buffer.from(f.hex, 'hex');
  // msgId 60 (0x003C) + string length u16le + chars+0x80
  if (b.readUInt16BE(0) !== 60) return false;
  const slen = b.readUInt16LE(2);
  return b.length === 4 + slen;
}

function decodeMsg60String(f) {
  const b = Buffer.from(f.hex, 'hex');
  const slen = b.readUInt16LE(2);
  return Buffer.from(b.slice(4).map((x) => (x - 0x80) & 0xFF)).toString('utf8');
}

async function save(label) {
  const summary = {
    ts: Date.now(), label, url: 'https://deadshot.io/',
    wsUrls: [...wsUrls],
    websockets: wsFrames,
    attests,
    console: consoleMsgs.slice(0, 400),
    errors: pageErrors.slice(0, 100),
  };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
  fs.writeFileSync(OUT_ATTEST, JSON.stringify(attests, null, 2));
  const { loadSchema, decode } = await import('../../packages/protocol/index.mjs');
  loadSchema();
  const lines = [];
  const hist = new Map();
  for (const f of wsFrames) {
    try {
      const msgs = decode(Buffer.from(f.hex, 'hex'));
      const parts = [];
      for (const m of msgs) {
        const key = m.msgId + '|' + f.dir;
        hist.set(key, (hist.get(key) || 0) + 1);
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
  // annotate msg60 frames with the decoded 96-byte token
  for (const f of wsFrames) {
    if (isMsg60Frame(f)) {
      const tok = decodeMsg60String(f);
      lines.push('  >> msg60 token (base64url, 96B): ' + tok);
      try { lines.push('  >> msg60 token (hex): ' + Buffer.from(tok, 'base64url').toString('hex')); } catch (e) {}
    }
  }
  fs.writeFileSync(OUT_DEC, lines.join('\n'));
  log('saved ' + OUT + ' frames=' + wsFrames.length + ' attests=' + attests.length);
  log('saved ' + OUT_DEC);
  for (const a of attests) log('  attest: ' + a.bytes + 'B head=' + a.head + ' url=' + a.url);
  log('histogram: ' + [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + '=' + v).join(' '));
  const msg21 = wsFrames.filter((f) => f.dir === 'S' && f.hex.includes('00156400'));
  const msg29 = wsFrames.filter((f) => f.dir === 'R' && f.hex.includes('001d'));
  log('msg21 (class-select) sent frames: ' + msg21.length + ' | msg29 (spawn) received frames: ' + msg29.length);
  for (const f of msg21.slice(0, 3)) log('  msg21 frame: S len=' + f.len + ' hex=' + f.hex.slice(0, 80));
  for (const f of msg29.slice(0, 3)) log('  msg29 frame: R len=' + f.len + ' hex=' + f.hex.slice(0, 80));
}

async function main() {
  fs.rmSync(STOP, { force: true });
  const flags = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run', '--no-default-browser-check',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
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
  cdp.on('Network.webSocketCreated', (p) => { if (p.url) { wsUrls.add(p.url); log('WS created:', p.url); } });
  cdp.on('Network.webSocketFrameSent', (p) => { if (p.response?.url) wsUrls.add(p.response.url); wsFrames.push({ dir: 'S', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex') }); });
  cdp.on('Network.webSocketFrameReceived', (p) => { if (p.response?.url) wsUrls.add(p.response.url); wsFrames.push({ dir: 'R', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex') }); });

  // /attest response-body capture (binary, base64-encoded by CDP)
  cdp.on('Network.responseReceived', (p) => {
    if (p.response && /attest/i.test(p.response.url)) {
      attestUrl.set(p.requestId, p.response.url);
      pendingAttest.add(p.requestId);
      log('attest response: status=' + p.response.status + ' type=' + (p.response.mimeType || '') + ' url=' + p.response.url);
    }
  });
  cdp.on('Network.loadingFinished', async (p) => {
    if (!pendingAttest.has(p.requestId)) return;
    pendingAttest.delete(p.requestId);
    try {
      const { body, base64Encoded } = await cdp.send('Network.getResponseBody', { requestId: p.requestId });
      const buf = base64Encoded ? Buffer.from(body, 'base64') : Buffer.from(body, 'utf8');
      attests.push({ ts: Date.now(), url: attestUrl.get(p.requestId) || '', hex: buf.toString('hex'), bytes: buf.length, head: buf.slice(0, 8).toString('hex') });
      log('ATTEST captured: ' + buf.length + ' bytes head=' + buf.slice(0, 6).toString('hex'));
    } catch (e) {
      log('attest body fetch failed:', e.message);
    }
  });

  cdp.on('Runtime.consoleAPICalled', (p) => consoleMsgs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => pageErrors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 160)));

  log('RECORDING. Browser opened — PLAY and pick a class as you would normally.');
  log('Stop early with: touch ' + STOP + '   (or wait ' + MINUTES + ' min)');
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });

  const deadline = Date.now() + MINUTES * 60000;
  let last = Date.now();
  while (Date.now() < deadline) {
    await sleep(5000);
    if (Date.now() - last > 15000) {
      last = Date.now();
      log('t+' + Math.round((Date.now() - deadline + MINUTES * 60000) / 1000) + 's urls=' + [...wsUrls].join(' ') + ' frames=' + wsFrames.length + ' attests=' + attests.length + (wsFrames.length ? ' (last S=' + wsFrames.filter((f) => f.dir === 'S').length + ' R=' + wsFrames.filter((f) => f.dir === 'R').length + ')' : ''));
    }
    if (fs.existsSync(STOP)) { log('stop marker found'); break; }
  }
  await save('manual-session');
  cdp.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('FATAL:', e && e.stack ? e.stack : e);
  try { await save('fatal'); } catch (e2) { console.error('save failed:', e2.message); }
  if (chromeProc) chromeProc.kill();
  process.exit(1);
});

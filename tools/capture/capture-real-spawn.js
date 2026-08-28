// Capture the REAL deadshot.io server flow through class-select + spawn.
//
// Drives https://deadshot.io/ with CDP: click PLAY -> matchmaking WS ->
// game WS -> click a class card -> record every frame until the spawn
// response (msg 18/17/29) arrives. Saves raw/real-spawn.json (raw frames)
// and raw/real-spawn-decoded.txt (schema-decoded dump).
//
// Usage:
//   node tools/capture-real-spawn.js [holdMs]
//   VISIBLE=1 node tools/capture-real-spawn.js   (watch the browser)
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
const PROFILE = path.join(os.tmpdir(), 'ds-real-' + Date.now());
const HOLD_MS = parseInt(process.argv[2] || '0', 10);
const OUT = path.join(ROOT, 'raw', 'captures', 'real-spawn.json');
const OUT_DEC = path.join(ROOT, 'raw', 'analysis', 'real-spawn-decoded.txt');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

let chromeProc;
const wsUrls = new Set();
const wsFrames = [];
const consoleMsgs = [];
const pageErrors = [];
const shots = [];

const log = (m) => console.log('[' + new Date().toISOString().slice(11, 19) + ']', m);
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

async function launchChrome() {
  const flags = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run', '--no-default-browser-check',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--window-size=1280,800', '--user-data-dir=' + PROFILE, 'about:blank',
  ];
  if (!process.env.VISIBLE) flags.unshift('--headless=new');
  chromeProc = spawn(CHROME, flags, { stdio: ['ignore', 'ignore', 'pipe'] });
  for (let t = 0; t < 30; t++) {
    try { await getJson(`http://127.0.0.1:${PORT}/json/version`); return; } catch (e) { await sleep(800); }
  }
  throw new Error('cdp not up');
}

async function shot(cdp, name) {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const f = '/tmp/opencode/real-' + name + '.png';
    fs.writeFileSync(f, Buffer.from(r.result.data, 'base64'));
    shots.push(f);
    log('screenshot -> ' + f);
  } catch (e) { log('shot failed: ' + e.message); }
}

async function click(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function pressKey(cdp, key, code) {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: code === 'Enter' ? 13 : 32 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: code === 'Enter' ? 13 : 32 });
}

function hexScan(frames, dir, pattern) {
  for (const f of frames) {
    if (f.dir !== dir) continue;
    if (f.hex.includes(pattern)) return true;
  }
  return false;
}

async function main() {
  await launchChrome();
  const cdp = await CDP.connect(PORT);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.setUserAgentOverride', { userAgent: UA });
  cdp.on('Network.webSocketCreated', (p) => {
    if (!p.url) log('WS created (no url!): ' + JSON.stringify(p).slice(0, 300));
    else { wsUrls.add(p.url); log('WS created:', p.url); }
  });
  cdp.on('Network.webSocketFrameSent', (p) => { if (p.response?.url) wsUrls.add(p.response.url); wsFrames.push({ dir: 'S', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex') }); });
  cdp.on('Network.webSocketFrameReceived', (p) => { if (p.response?.url) wsUrls.add(p.response.url); wsFrames.push({ dir: 'R', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex') }); });
  cdp.on('Runtime.consoleAPICalled', (p) => consoleMsgs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => pageErrors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 160)));

  log('navigating to https://deadshot.io/ ...');
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });
  await sleep(30000);
  await shot(cdp, 'menu');

  log('clicking PLAY candidates...');
  const spots = [[640, 420], [640, 380], [640, 460], [640, 340], [640, 500], [640, 300], [400, 420], [880, 420], [640, 240]];
  let ci = 0;
  const mmUrl = 'matchmaking.deadshot.io';
  const playDeadline = Date.now() + 150000;
  while (![...wsUrls].some((u) => u.includes(mmUrl)) && Date.now() < playDeadline) {
    const [x, y] = spots[ci++ % spots.length];
    await click(cdp, x, y);
    await sleep(2000);
    if (ci % 5 === 0) log('still clicking menu... (' + ci + ' clicks)');
  }
  if (![...wsUrls].some((u) => u.includes(mmUrl))) {
    log('mm WS not seen — pressing Enter a few times...');
    for (let i = 0; i < 6 && ![...wsUrls].some((u) => u.includes(mmUrl)); i++) {
      await pressKey(cdp, 'Enter', 'Enter');
      await sleep(2500);
      await click(cdp, 640, 420);
      await sleep(1500);
    }
  }
  if (![...wsUrls].some((u) => u.includes(mmUrl))) throw new Error('matchmaking WS never opened');
  log('matchmaking WS open. waiting for game socket...');
  await shot(cdp, 'mm');

  const gameDeadline = Date.now() + 120000;
  while (![...wsUrls].some((u) => u.includes('/ws?name=hi')) && Date.now() < gameDeadline) await sleep(1000);
  if (![...wsUrls].some((u) => u.includes('/ws?name=hi'))) throw new Error('game socket never opened');
  log('GAME socket open. waiting for spawn batch + map load...');
  await sleep(20000);
  await shot(cdp, 'preselect');

  log('clicking class cards...');
  const cardSpots = [];
  for (const y of [405, 370, 440, 345, 470]) for (const x of [320, 533, 747, 960, 640]) cardSpots.push([x, y]);
  const msg21 = '00156400';
  let clicked = false;
  for (const [x, y] of cardSpots) {
    await click(cdp, x, y);
    await sleep(900);
    if (hexScan(wsFrames, 'S', msg21)) { log('>>> class selected! msg21 sent after click at ' + x + ',' + y); clicked = true; break; }
  }
  if (!clicked) {
    log('no msg21 yet — retrying with Enter + spread clicks...');
    for (let i = 0; i < 20 && !hexScan(wsFrames, 'S', msg21); i++) {
      await pressKey(cdp, ' ', 'Space');
      await sleep(800);
      const [x, y] = cardSpots[i % cardSpots.length];
      await click(cdp, x, y);
      await sleep(900);
    }
  }
  await shot(cdp, 'postselect');

  const spawnDeadline = Date.now() + 30000;
  while (!hexScan(wsFrames, 'R', '001d') && Date.now() < spawnDeadline) await sleep(500);
  log('server spawn reply (msg29) seen: ' + hexScan(wsFrames, 'R', '001d'));

  log('capturing ' + Math.round(spawnDeadline > Date.now() ? (spawnDeadline - Date.now()) / 1000 : 0) + 's more...');
  await sleep(Math.max(0, spawnDeadline - Date.now()));
  await shot(cdp, 'ingame');

  const summary = {
    ts: Date.now(), url: 'https://deadshot.io/',
    wsUrls: [...wsUrls],
    websockets: wsFrames,
    console: consoleMsgs.slice(0, 300),
    errors: pageErrors.slice(0, 100),
  };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
  log('saved ' + OUT + ' frames=' + wsFrames.length);

  const { loadSchema, decode } = await import('../../packages/protocol/index.mjs');
  loadSchema();
  const lines = [];
  const hist = new Map();
  for (const f of wsFrames) {
    try {
      const bin = Buffer.from(f.hex, 'hex');
      const msgs = decode(bin);
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
  fs.writeFileSync(OUT_DEC, lines.join('\n'));
  log('saved ' + OUT_DEC);
  log('msg histogram (top 20): ' + [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => k + '=' + v).join(' '));

  const hold = HOLD_MS;
  if (hold > 0) { log('=== HOLDING browser open ' + hold + 'ms ==='); await sleep(hold); }
  cdp.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e && e.stack ? e.stack : e); if (chromeProc) chromeProc.kill(); process.exit(1); });

// Drive the game menu (canvas-based, no HTML buttons) by clicking candidate
// positions, then capture everything that happens during a match: asset URLs,
// WebSocket frames, console. Downloads missing assets into client/.
//
// Usage: node tools/capture-live.js [seconds]  -- same file, extends the
// base capture with menu clicks.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const os = require('os');

const CHROME = '/usr/bin/google-chrome';
const PORT = 9229;
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'raw', 'captures');
const CLIENT = path.join(ROOT, 'client');
const SECONDS = parseInt(process.argv[2] || '150', 10);
const PROFILE = path.join(os.tmpdir(), 'ds-live-' + Date.now());
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

let chromeProc;
const requests = new Map();
const wsFrames = [];
const wsUrls = new Set();
const consoleMsgs = [];
const pageErrors = [];

function log(m) { console.log('[' + new Date().toISOString().slice(11, 19) + ']', m); }

function startChrome() {
  return new Promise((resolve, reject) => {
    chromeProc = spawn(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--remote-debugging-port=' + PORT, '--no-first-run', '--no-default-browser-check',
      '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
      '--disable-extensions', '--window-size=1280,800',
      '--user-data-dir=' + PROFILE, 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    chromeProc.on('error', reject);
    let tries = 0;
    const poll = () => {
      http.get('http://127.0.0.1:' + PORT + '/json/version', (res) => { res.resume(); res.on('end', resolve); })
        .on('error', () => { if (++tries > 15) reject(new Error('cdp not up')); else setTimeout(poll, 1000); });
    };
    poll();
    setTimeout(() => reject(new Error('chrome timeout')), 25000);
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } }); }).on('error', reject);
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
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) { c.pending.get(msg.id)(msg); c.pending.delete(msg.id); }
      else if (msg.method && c.events[msg.method]) c.events[msg.method].forEach((fn) => fn(msg.params));
    };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve) => { this.pending.set(id, resolve); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
  close() { this.ws.close(); }
}

async function click(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function pressKey(cdp, key, code) {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
}

const EXT_RE = /\.(png|jpe?g|webp|gif|glb|gltf|json|wasm|js|mp3|ogg|wav|woff2?|ttf|css|pkg)$/i;

async function downloadMissing() {
  let n = 0;
  for (const [url, info] of requests) {
    let u;
    try { u = new URL(url); } catch { continue; }
    if (!u.hostname.endsWith('deadshot.io')) continue;
    if (info.status !== 200) continue;
    if (!EXT_RE.test(u.pathname)) continue;
    let rel;
    try { rel = decodeURIComponent(u.pathname).replace(/^\//, ''); } catch { continue; }
    if (rel.startsWith('final.pkg')) continue;
    const dest = path.join(CLIENT, rel.replace(/%20/g, ' '));
    if (fs.existsSync(dest)) continue;
    await new Promise((resolve) => {
      const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
        if (res.statusCode !== 200) { res.resume(); return resolve(); }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, buf);
          log('downloaded ' + rel + ' (' + buf.length + ' B)');
          n++;
          resolve();
        });
      });
      req.on('error', () => resolve());
      req.setTimeout(20000, () => { req.destroy(); resolve(); });
    });
  }
  return n;
}

async function main() {
  log('starting Chrome...');
  await startChrome();
  const cdp = await CDP.connect(PORT);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  cdp.on('Network.responseReceived', (p) => {
    const r = p.response;
    const prev = requests.get(r.url) || { status: r.status, mime: r.mimeType, type: p.type, count: 0 };
    prev.count++;
    if (r.status !== prev.status) prev.status = r.status;
    requests.set(r.url, prev);
  });
  cdp.on('Network.webSocketCreated', (p) => wsUrls.add(p.url));
  cdp.on('Network.webSocketFrameSent', (p) => {
    wsFrames.push({ url: p.response.url, dir: 'S', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex').slice(0, 40000) });
  });
  cdp.on('Network.webSocketFrameReceived', (p) => {
    wsFrames.push({ url: p.response.url, dir: 'R', len: p.response.payloadData.length, hex: Buffer.from(p.response.payloadData).toString('hex').slice(0, 40000) });
  });
  cdp.on('Runtime.consoleAPICalled', (p) => {
    const txt = (p.args || []).map((a) => a.value !== undefined ? a.value : a.description || '').join(' ').slice(0, 300);
    consoleMsgs.push(txt);
  });
  cdp.on('Runtime.exceptionThrown', (p) => {
    pageErrors.push((p.exceptionDetails && (p.exceptionDetails.text || p.exceptionDetails.exception?.description || '').toString()).slice(0, 300));
  });

  log('navigating...');
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });
  await new Promise((r) => setTimeout(r, 28000));
  log('menu loaded. attempting to click PLAY...');

  // Candidate click positions (1280x800 menu canvas)
  const spots = [
    [640, 420], [640, 380], [640, 460], [640, 340], [640, 500],
    [640, 300], [640, 560], [640, 240], [400, 420], [880, 420],
  ];
  let clickedWs = false;
  for (const [x, y] of spots) {
    await click(cdp, x, y);
    await new Promise((r) => setTimeout(r, 1200));
    if (wsUrls.size) { clickedWs = true; log('WS opened after click at ' + x + ',' + y + ': ' + [...wsUrls].join(', ')); break; }
  }
  if (!clickedWs) {
    log('no WS yet — trying Enter + more clicks...');
    await pressKey(cdp, 'Enter', 'Enter');
    await new Promise((r) => setTimeout(r, 3000));
    if (!wsUrls.size) {
      for (const [x, y] of [[640, 600], [640, 200], [320, 400], [960, 400]]) {
        await click(cdp, x, y);
        await new Promise((r) => setTimeout(r, 1200));
        if (wsUrls.size) { log('WS opened!'); break; }
      }
    }
  }

  for (let i = 0; i < SECONDS; i += 10) {
    await new Promise((r) => setTimeout(r, 10000));
    const deadshot = [...requests.keys()].filter((u) => u.includes('deadshot.io')).length;
    log(`t+${i + 10}s reqs=${requests.size} deadshot=${deadshot} ws=${wsUrls.size} wsFrames=${wsFrames.length}`);
    if (wsUrls.size && wsFrames.length === 0 && i > 40) break;
  }

  log('saving...');
  const summary = {
    ts: Date.now(),
    requests: [...requests.entries()].map(([url, info]) => ({ url, ...info })),
    websockets: wsFrames,
    wsUrls: [...wsUrls],
    console: consoleMsgs.slice(0, 200),
    errors: pageErrors.slice(0, 100),
  };
  fs.writeFileSync(path.join(OUT, 'live-capture2.json'), JSON.stringify(summary, null, 2));
  log('saved raw/live-capture2.json');

  const newUrls = [...requests.keys()].filter((u) => u.includes('deadshot.io') && requests.get(u).status === 200);
  log('200 deadshot.io URLs: ' + newUrls.length);
  const n = await downloadMissing();
  log('downloaded ' + n + ' new files');
  if (wsFrames.length) {
    const byUrl = {};
    for (const f of wsFrames) byUrl[f.url] = (byUrl[f.url] || 0) + 1;
    log('WS frame totals: ' + JSON.stringify(byUrl));
  }
  cdp.close();
  chromeProc.kill();
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); process.exit(1); });

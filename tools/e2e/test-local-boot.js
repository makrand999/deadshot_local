// Verify the game boots from the LOCAL server (http://127.0.0.1:8080/):
// starts server/src/index.mjs, loads the page in headless Chrome, records all
// HTTP responses (404s = missing assets), and checks the game connects to the
// local matchmaker ws://127.0.0.1:8081/ws after clicking PLAY.
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const PORT = 9236;
const PROFILE = os.tmpdir() + '/ds-boot-' + Date.now();

let chromeProc, serverProc;
const responses = new Map();
const wsUrls = new Set();
const consoleMsgs = [];
const errors = [];

function log(m) { console.log('[' + new Date().toISOString().slice(11, 19) + ']', m); }

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
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) { c.pending.get(msg.id)(msg); c.pending.delete(msg.id); }
      else if (msg.method && c.events[msg.method]) c.events[msg.method].forEach((f) => f(msg.params));
    };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
  close() { this.ws.close(); }
}

function startServer() {
  return new Promise((res) => {
    serverProc = spawn('node', ['server/src/index.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    serverProc.stdout.on('data', (d) => {});
    serverProc.stderr.on('data', (d) => process.stderr.write('[server] ' + d));
    setTimeout(res, 1500);
  });
}

async function click(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function main() {
  log('starting local server...');
  await startServer();
  chromeProc = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--window-size=1280,800', '--user-data-dir=' + PROFILE, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  await new Promise((res, rej) => { let t = 0; const poll = () => http.get('http://127.0.0.1:' + PORT + '/json/version', (r) => { r.resume(); r.on('end', res); }).on('error', () => { if (++t > 15) rej(new Error('cdp down')); else setTimeout(poll, 1000); }); poll(); });

  const cdp = await CDP.connect(PORT);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  cdp.on('Network.responseReceived', (p) => {
    const r = p.response;
    responses.set(r.url, r.status);
    if (r.status === 404) log('404: ' + r.url);
  });
  cdp.on('Network.webSocketCreated', (p) => wsUrls.add(p.url));
  cdp.on('Runtime.consoleAPICalled', (p) => consoleMsgs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)));
  cdp.on('Runtime.exceptionThrown', (p) => errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 200)));

  log('navigating to http://127.0.0.1:8080/ ...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8080/' });
  await new Promise((r) => setTimeout(r, 30000));

  log('--- click through menu ---');
  for (const [x, y] of [[640, 420], [640, 380], [640, 460], [640, 340], [640, 500], [400, 420], [880, 420], [640, 300]]) {
    await click(cdp, x, y);
    await new Promise((r) => setTimeout(r, 1200));
    if (wsUrls.size) break;
  }
  await new Promise((r) => setTimeout(r, 15000));

  const total = responses.size;
  const notFound = [...responses.entries()].filter(([, s]) => s === 404);
  const okAssets = [...responses.entries()].filter(([u, s]) => s === 200 && !u.includes('final.pkg')).length;
  log('responses: ' + total + ' | 200 assets: ' + okAssets + ' | 404s: ' + notFound.length);
  for (const [u] of notFound) log('  404 ' + u);
  log('WS urls: ' + ([...wsUrls].join(' ') || 'none'));
  log('console errors:');
  errors.slice(0, 10).forEach((e) => log('  EXC: ' + e));
  consoleMsgs.slice(0, 15).forEach((c) => log('  LOG: ' + c));

  fs = require('fs');
  fs.writeFileSync(path.join(ROOT, 'raw', 'captures', 'local-boot.json'), JSON.stringify({ responses: [...responses.entries()], wsUrls: [...wsUrls], console: consoleMsgs, errors }, null, 2));
  log('saved raw/local-boot.json');

  cdp.close();
  chromeProc.kill();
  serverProc.kill();
  process.exit(0);
}

let fs;
main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); if (serverProc) serverProc.kill(); process.exit(1); });

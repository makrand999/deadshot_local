// Debug the in-match death: boot one headless instance, play a solo match,
// and capture the client's console/exceptions while it plays.
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const TRACE = '/tmp/opencode/debug-match.log';
const trace = (m) => fs.appendFileSync(TRACE, '[' + new Date().toISOString().slice(11, 19) + '] ' + m + '\n');
const log = (...a) => { console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...a); trace(a.join(' ')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lanIp = () => { for (const n of Object.keys(os.networkInterfaces())) for (const i of os.networkInterfaces()[n] || []) if (i.family === 'IPv4' && !i.internal) return i.address; return '127.0.0.1'; };

function getJson(url) { return new Promise((res, rej) => { http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej); }); }
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = {}; }
  static async connect(port) {
    const t = await getJson(`http://127.0.0.1:${port}/json`);
    const page = t.find((x) => x.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); } else if (m.method && c.events[m.method]) c.events[m.method].forEach((f) => f(m.params)); };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
}
async function click(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

async function main() {
  fs.rmSync(TRACE, { force: true });
  const port = 9250;
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + port, '--no-first-run',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--host-resolver-rules=MAP 192.168.local ' + lanIp(),
    '--window-size=1280,800', '--user-data-dir=' + os.tmpdir() + '/ds-debug-' + Date.now(), 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  const wsUrls = new Set();
  try {
    for (let t = 0; t < 30; t++) { try { await getJson(`http://127.0.0.1:${port}/json/version`); break; } catch (e) { await sleep(800); } }
    const cdp = await CDP.connect(port);
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Runtime.enable');
    cdp.on('Network.webSocketCreated', (p) => { wsUrls.add(p.url); log('WS:', p.url); });
    cdp.on('Runtime.consoleAPICalled', (p) => {
      const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200);
      log('console[' + p.type + ']:', text);
    });
    cdp.on('Runtime.exceptionThrown', (p) => {
      const d = p.exceptionDetails;
      const text = (d.exception?.description || d.text || '').slice(0, 300);
      log('EXCEPTION:', text);
    });
    await cdp.send('Page.navigate', { url: 'http://192.168.local:8080/' });
    await sleep(40000);
    const deadline = Date.now() + 90000;
    let i = 0;
    const positions = [[640, 420], [640, 380], [640, 460], [500, 420], [780, 420], [640, 340], [640, 500]];
    while (![...wsUrls].some((u) => u.includes('8081')) && Date.now() < deadline) {
      const [x, y] = positions[i++ % positions.length];
      await click(cdp, x, y);
      await sleep(2000);
    }
    log('mm opened:', [...wsUrls].some((u) => u.includes('8081')));
    await sleep(30000);
    log('game socket:', [...wsUrls].some((u) => u.includes(':8080/ws')));
    log('done observing');
  } finally {
    try { chrome.kill(); } catch (e) {}
    process.exit(0);
  }
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

// Load the game from the LOCAL server (http://127.0.0.1:8080/) in headless Chrome
// and check if it connects to ws://127.0.0.1:8080/ws (the local fallback path).
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9235;
const PROFILE = path.join(os.tmpdir(), 'ds-local-' + Date.now());
let chromeProc;

function startChrome() {
  return new Promise((resolve, reject) => {
    chromeProc = spawn(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--remote-debugging-port=' + PORT, '--no-first-run', '--no-default-browser-check',
      '--disable-gpu', '--disable-extensions', '--window-size=1280,800',
      '--user-data-dir=' + PROFILE, 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    chromeProc.on('error', reject);
    let tries = 0;
    const poll = () => {
      http.get('http://127.0.0.1:' + PORT + '/json/version', (res) => { res.resume(); res.on('end', resolve); })
        .on('error', () => { if (++tries > 15) reject(new Error('cdp not up')); else setTimeout(poll, 1000); });
    };
    poll();
    setTimeout(() => reject(new Error('chrome timeout')), 20000);
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

async function main() {
  console.log('starting Chrome...');
  await startChrome();
  const cdp = await CDP.connect(PORT);
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');

  let wsSeen = [];
  cdp.on('Network.webSocketCreated', (p) => { wsSeen.push(p.url); console.log('WS CREATED:', p.url); });
  cdp.on('Network.webSocketFrameSent', (p) => console.log('  SENT:', p.response.payloadData.slice(0, 100)));
  cdp.on('Network.webSocketFrameReceived', (p) => console.log('  RECV:', p.response.payloadData.slice(0, 100)));
  cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') console.log('console.error:', (p.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 120)); });

  console.log('navigating to LOCAL server...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8080/' });
  await new Promise((r) => setTimeout(r, 20000));

  console.log('\nWS connections seen:', wsSeen.length ? wsSeen : 'NONE');
  // Also check what network requests the local page made
  cdp.close(); chromeProc.kill();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); process.exit(1); });

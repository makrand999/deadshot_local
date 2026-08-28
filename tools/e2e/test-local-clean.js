// Clean local-game test: load local page, wait 30s, report WS + key network, EXIT CLEANLY.
// Uses a strict process.exit and kills chrome via taskkill to avoid hangs.
const { spawn, execSync } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9237;
const PROFILE = path.join(os.tmpdir(), 'ds-clean-' + Date.now());
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
        .on('error', () => { if (++tries > 20) reject(new Error('cdp not up')); else setTimeout(poll, 800); });
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
  close() { try { this.ws.close(); } catch (e) {} }
}

async function main() {
  console.log('starting Chrome...');
  await startChrome();
  const cdp = await CDP.connect(PORT);
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');

  const wsUrls = [];
  const keyNet = [];
  const errs = [];
  cdp.on('Network.webSocketCreated', (p) => { wsUrls.push(p.url); console.log('WS CREATED:', p.url); });
  cdp.on('Network.webSocketFrameSent', (p) => console.log('  SENT:', String(p.response.payloadData).slice(0, 80)));
  cdp.on('Network.webSocketFrameReceived', (p) => console.log('  RECV:', String(p.response.payloadData).slice(0, 80)));
  cdp.on('Network.responseReceived', (p) => { if (/audio|wasm|pkg|\.glb|\.gltf/.test(p.response.url) && keyNet.length < 20) keyNet.push(p.response.status + ' ' + p.response.url.replace('http://127.0.0.1:8080', '')); });
  cdp.on('Runtime.exceptionThrown', (p) => { const t = ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text || ''); if (!t.includes('audio')) errs.push(t.slice(0, 120)); });

  console.log('navigating to local...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8080/' });
  console.log('waiting 30s...');
  await new Promise((r) => setTimeout(r, 30000));

  console.log('\n=== WS ===', wsUrls.length ? wsUrls : 'NONE');
  console.log('=== key asset loads ===');
  keyNet.forEach((x) => console.log(' ', x));
  console.log('=== non-audio errors ===', errs.length ? errs : 'none');

  // Try clicking to start
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 640, y: 400, button: 'left', clickCount: 1 }).catch(() => {});
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 640, y: 400, button: 'left', clickCount: 1 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 8000));
  console.log('\n=== WS after click ===', wsUrls.length ? wsUrls : 'still none');

  try { cdp.close(); } catch (e) {}
  try { chromeProc.kill(); } catch (e) {}
  try { execSync('taskkill /F /IM chrome.exe /T 2>nul', { stdio: 'ignore' }); } catch (e) {}
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

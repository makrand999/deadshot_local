// CDP capture v2: load the game, CLICK to start, and capture WebSocket frames.
// The game needs a user interaction (Play click) to connect to the matchmaker.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;
const OUT_DIR = path.join(__dirname, '..', '..', 'raw', 'captures');
const PROFILE = path.join(os.tmpdir(), 'ds-cap2-' + Date.now());
const WAIT = parseInt(process.argv[2] || '30', 10);

fs.mkdirSync(OUT_DIR, { recursive: true });
const wsUrls = new Map();
const consoleMsgs = [];
let chromeProc;

function log(msg) { console.log('[' + new Date().toISOString().slice(11, 19) + ']', msg); }

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
  log('starting Chrome...');
  await startChrome();
  log('connecting CDP...');
  const cdp = await CDP.connect(PORT);
  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');

  cdp.on('Network.webSocketCreated', (p) => { if (!wsUrls.has(p.url)) { wsUrls.set(p.url, { frames: [] }); log('WS: ' + p.url); } });
  cdp.on('Network.webSocketFrameSent', (p) => { const e = wsUrls.get(p.response.url); if (e) e.frames.push({ dir: 'S', payload: p.response.payloadData }); });
  cdp.on('Network.webSocketFrameReceived', (p) => { const e = wsUrls.get(p.response.url); if (e) e.frames.push({ dir: 'R', payload: p.response.payloadData }); });
  cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleMsgs.push((p.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 150)); });
  cdp.on('Runtime.exceptionThrown', (p) => { consoleMsgs.push('EXC: ' + ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text || '').slice(0, 150)); });

  log('navigating...');
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });
  await new Promise((r) => setTimeout(r, 10000));

  // Try to click "Play" — find buttons and click. Use JS to click any visible button with Play/Start text.
  log('attempting to click Play...');
  await cdp.send('Runtime.evaluate', {
    expression: `
      (function(){
        var els = document.querySelectorAll('button, [class*=play], [class*=start], canvas');
        var out = [];
        for (var i=0;i<els.length;i++){ var t=(els[i].textContent||'').trim(); if(t && (t.toLowerCase().indexOf('play')>=0||t.toLowerCase().indexOf('start')>=0||t.toLowerCase().indexOf('join')>=0)){ out.push(t); els[i].click(); } }
        return JSON.stringify(out);
      })()
    `,
    returnByValue: true,
  }).then((r) => log('clicked:', JSON.stringify(r.result && r.result.value))).catch((e) => log('click eval failed: ' + e.message));

  // Click canvas center as fallback
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 640, y: 400, button: 'left', clickCount: 1 }).catch(() => {});
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 640, y: 400, button: 'left', clickCount: 1 }).catch(() => {});

  log('capturing ' + WAIT + 's...');
  await new Promise((r) => setTimeout(r, WAIT * 1000));

  // Dump
  const out = [];
  for (const [url, e] of wsUrls) out.push({ url, frames: e.frames.slice(0, 300) });
  fs.writeFileSync(path.join(OUT_DIR, 'websockets.json'), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'console.json'), JSON.stringify(consoleMsgs, null, 2));
  log('WS connections:', out.length, '| console errors:', consoleMsgs.length);
  if (out.length) log('frames captured:', out.reduce((a, b) => a + b.frames.length, 0));

  cdp.close(); chromeProc.kill();
  log('done -> ' + OUT_DIR);
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); process.exit(1); });

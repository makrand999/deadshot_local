// E2E: full local flow via the hosts-entry trick (192.168.local -> LAN IP),
// simulating what devices on the network will do. Verifies:
//   page -> encrypted final.pkg (local) -> game boots -> login (8082)
//   -> matchmaker (8081) allocation -> game socket (8080) + frames.
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const PORT = 9244;
const PROFILE = os.tmpdir() + '/ds-e2e3-' + Date.now();

const lanIp = () => {
  for (const name of Object.keys(os.networkInterfaces())) {
    for (const i of os.networkInterfaces()[name] || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
};

let chromeProc, serverProc;
const responses = new Map();
const wsUrls = new Set();
const wsFrames = [];
const errors = [];
const logs = [];

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
      const m = JSON.parse(ev.data);
      if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); }
      else if (m.method && c.events[m.method]) c.events[m.method].forEach((f) => f(m.params));
    };
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
async function typeIntoVisibleInput(cdp, text) {
  const expr = `(function(){
    const inp = [...document.querySelectorAll('input')].find(i => i.offsetParent !== null);
    if (!inp) return 'no visible input';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(inp, ${JSON.stringify(text)});
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.focus();
    return 'typed into: ' + inp.className;
  })()`;
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  log('input: ' + (r.result?.result?.value || JSON.stringify(r.result)));
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
}

async function main() {
  const ip = lanIp();
  log('LAN IP: ' + ip + ' (simulating hosts entry 192.168.local -> ' + ip + ')');
  serverProc = spawn('node', ['server/src/index.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProc.stdout.on('data', (d) => process.stdout.write('[server] ' + d));
  serverProc.stderr.on('data', (d) => process.stderr.write('[server!] ' + d));
  await new Promise((r) => setTimeout(r, 2000));

  chromeProc = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--host-resolver-rules=MAP 192.168.local ' + ip,
    '--window-size=1280,800', '--user-data-dir=' + PROFILE, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  await new Promise((res, rej) => { let t = 0; const poll = () => http.get('http://127.0.0.1:' + PORT + '/json/version', (r) => { r.resume(); r.on('end', res); }).on('error', () => { if (++t > 15) rej(new Error('cdp down')); else setTimeout(poll, 1000); }); poll(); });

  const cdp = await CDP.connect(PORT);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  cdp.on('Network.responseReceived', (p) => { responses.set(p.response.url, p.response.status); if (p.response.status === 404) log('404: ' + p.response.url); });
  cdp.on('Network.webSocketCreated', (p) => { wsUrls.add(p.url); log('WS created: ' + p.url); });
  cdp.on('Network.webSocketFrameSent', (p) => wsFrames.push({ dir: 'S', d: p.response.payloadData }));
  cdp.on('Network.webSocketFrameReceived', (p) => wsFrames.push({ dir: 'R', d: p.response.payloadData }));
  cdp.on('Runtime.consoleAPICalled', (p) => logs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 120)));
  cdp.on('Runtime.exceptionThrown', (p) => errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 150)));

  const url = 'http://192.168.local:8080/';
  log('navigating to ' + url);
  await cdp.send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 40000));

  const positions = [[640, 420], [640, 380], [640, 460], [500, 420], [780, 420], [640, 340], [640, 500], [400, 300], [880, 300]];
  log('clicking menu...');
  const deadline = Date.now() + 90000;
  let ci = 0;
  while (![...wsUrls].some((u) => u.includes('8081')) && Date.now() < deadline) {
    const [x, y] = positions[ci++ % positions.length];
    await click(cdp, x, y);
    await new Promise((r) => setTimeout(r, 2500));
  }
  await typeIntoVisibleInput(cdp, 'TestPlayer' + Math.floor(Math.random() * 1000));
  await new Promise((r) => setTimeout(r, 8000));
  while (![...wsUrls].some((u) => u.includes('8081')) && Date.now() < deadline) {
    const [x, y] = positions[ci++ % positions.length];
    await click(cdp, x, y);
    await new Promise((r) => setTimeout(r, 2500));
  }
  await new Promise((r) => setTimeout(r, 15000));

  log('--- summary ---');
  log('page: ' + responses.get(url) + ' | final.pkg: ' + responses.get(url + 'final.pkg'));
  log('404s: ' + [...responses.entries()].filter(([, s]) => s === 404).map(([u]) => u.split('/').pop()).join(', ') || 'none');
  log('WS urls: ' + ([...wsUrls].join(' ') || 'NONE'));
  const dec = (s) => { try { return Buffer.from(s, 'base64').toString('hex').slice(0, 24); } catch { return ''; } };
  log('frames (' + wsFrames.length + '): ' + wsFrames.slice(0, 14).map((f) => f.dir + '[' + f.d.length + ']' + dec(f.d)).join(' | '));
  log('errors: ' + (errors.length ? errors.slice(0, 4).join(' ;; ') : 'none'));
  log('console: ' + logs.filter((l) => /error|fail|match|connect|join|socket|login/i.test(l)).slice(0, 8).join(' ;; ') || '(none)');

  fs.writeFileSync(path.join(ROOT, 'raw', 'captures', 'e2e3.json'), JSON.stringify({ wsUrls: [...wsUrls], frames: wsFrames, responses: [...responses.entries()], errors, logs }, null, 2));
  log('saved raw/e2e3.json');
  chromeProc.kill(); serverProc.kill();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); if (serverProc) serverProc.kill(); process.exit(1); });

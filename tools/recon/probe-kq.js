// Probe: find the game realm (iframe) and check which Kq party methods are reachable.
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const lanIp = () => { for (const n of Object.keys(os.networkInterfaces())) for (const i of os.networkInterfaces()[n] || []) if (i.family === 'IPv4' && !i.internal) return i.address; return '127.0.0.1'; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log('[' + new Date().toISOString().slice(11, 19) + ']', m);

function getJson(url) { return new Promise((res, rej) => { http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej); }); }

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = {}; }
  static async connect(port) {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); } else if (m.method && c.events[m.method]) c.events[m.method].forEach((f) => f(m.params)); };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { (this.events[method] = this.events[method] || []).push(fn); }
}

async function main() {
  const port = 9247;
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + port, '--no-first-run',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--host-resolver-rules=MAP 192.168.local ' + lanIp(),
    '--window-size=1280,800', '--user-data-dir=' + os.tmpdir() + '/ds-probe-' + Date.now(), 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  try {
    for (let t = 0; t < 30; t++) { try { await getJson(`http://127.0.0.1:${port}/json/version`); break; } catch (e) { await sleep(800); } }
    const cdp = await CDP.connect(port);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    const contexts = [];
    cdp.on('Runtime.executionContextCreated', (p) => contexts.push(p.context));
    await cdp.send('Page.navigate', { url: 'http://192.168.local:8080/' });
    for (let t = 0; t < 12; t++) {
      await sleep(5000);
      const ck = await cdp.send('Runtime.evaluate', {
        expression: `(() => ({ iframes: document.querySelectorAll('iframe').length, canvases: document.querySelectorAll('canvas').length }))()`,
        returnByValue: true,
      });
      log('t+' + ((t + 1) * 5) + 's iframes=' + JSON.stringify(ck.result?.result?.value));
      if (contexts.length > 1) break;
    }
    log('contexts: ' + JSON.stringify(contexts.map((c) => ({ id: c.id, name: c.name, origin: c.origin, aux: c.auxData })), null, 2));
    for (const ctx of contexts) {
      const r = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const out = { hasDoc: typeof document !== 'undefined', iframes: typeof document !== 'undefined' ? document.querySelectorAll('iframe').length : -1, canvases: typeof document !== 'undefined' ? document.querySelectorAll('canvas').length : -1, kqType: typeof Kq, kqKeys: typeof Kq === 'object' ? Object.keys(Kq).slice(0, 20) : [] };
          return out;
        })()`,
        contextId: ctx.id,
        returnByValue: true,
      });
      const v = r.result?.result?.value;
      if (v && (v.iframes > 0 || v.canvases > 0 || v.kqType === 'object')) log('ctx ' + ctx.id + ': ' + JSON.stringify(v));
    }
    const ft = await cdp.send('Page.getFrameTree');
    log('frameTree: ' + JSON.stringify(ft.result.frameTree, null, 2).slice(0, 2000));
  } finally {
    try { chrome.kill(); } catch (e) {}
    process.exit(0);
  }
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

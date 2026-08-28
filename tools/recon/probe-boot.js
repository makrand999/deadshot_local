// Debug probe: hook fetch + error handlers across contexts to see why the
// patched bundle doesn't boot.
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const PORT = 9239;
const PROFILE = os.tmpdir() + '/ds-probe2-' + Date.now();
let chromeProc, serverProc;

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

const HOOK = `(function(){
  try {
    if (window.__ph) return; window.__ph = 1;
    window.__fetchLog = [];
    var of = window.fetch.bind(window);
    window.fetch = function() {
      try { window.__fetchLog.push(String(arguments[0]).slice(0, 80)); } catch (e) {}
      return of.apply(window, arguments);
    };
    window.addEventListener('error', function(e) {
      try { window.__errLog = window.__errLog || []; window.__errLog.push((e.message||'').slice(0,150) + ' @' + (e.filename||'').split('/').pop() + ':' + e.lineno); } catch (x) {}
    });
    window.addEventListener('unhandledrejection', function(e) {
      try { window.__errLog = window.__errLog || []; window.__errLog.push('REJ:' + String(e.reason).slice(0,150)); } catch (x) {}
    });
  } catch (e) {}
})();`;

async function main() {
  serverProc = spawn('node', ['server/src/index.mjs'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'] });
  await new Promise((r) => setTimeout(r, 2000));
  chromeProc = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + PORT, '--no-first-run',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--window-size=1280,800', '--user-data-dir=' + PROFILE, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  await new Promise((res, rej) => { let t = 0; const poll = () => http.get('http://127.0.0.1:' + PORT + '/json/version', (r) => { r.resume(); r.on('end', res); }).on('error', () => { if (++t > 15) rej(new Error('cdp down')); else setTimeout(poll, 1000); }); poll(); });

  const cdp = await CDP.connect(PORT);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: HOOK });

  const exc = [];
  const cons = [];
  const ctxs = new Map();
  cdp.on('Runtime.executionContextCreated', (p) => { ctxs.set(p.context.id, p.context); });
  cdp.on('Runtime.exceptionThrown', (p) => { exc.push((p.exceptionDetails?.text || '') + ' | ' + (p.exceptionDetails?.exception?.description || '').slice(0, 200)); });
  cdp.on('Runtime.consoleAPICalled', (p) => { cons.push('[' + (p.type || 'log') + '] ' + (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 150)); });

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8080/' });
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    // read main-world state
    const r = await cdp.send('Runtime.evaluate', {
      expression: 'JSON.stringify({ fetchLog: window.__fetchLog || [], errs: window.__errLog || [], canvases: document.querySelectorAll("canvas").length, title: document.title, body: (document.body.innerText||"").slice(0,120) })',
      returnByValue: true,
    });
    console.log('t+' + (i + 1) * 5 + 's:', r.result?.value);
  }
  console.log('\n=== exceptions (' + exc.length + ') ===');
  exc.slice(0, 10).forEach((e) => console.log(e));
  console.log('\n=== console (' + cons.length + ') ===');
  cons.slice(0, 25).forEach((c) => console.log(c));
  console.log('\n=== contexts ===');
  [...ctxs.entries()].forEach(([id, c]) => console.log(id, c.origin, c.name, c.auxData?.frameId || ''));

  fs.writeFileSync(path.join(ROOT, 'raw', 'captures', 'probe2.json'), JSON.stringify({ exc, cons, ctxs: [...ctxs.entries()] }, null, 2));
  chromeProc.kill(); serverProc.kill();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); if (serverProc) serverProc.kill(); process.exit(1); });

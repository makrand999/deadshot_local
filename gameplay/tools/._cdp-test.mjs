// CDP test driver for the game — validates that headless system Chrome can run the game.
import { spawn } from 'node:child_process';
import WebSocket from '../node_modules/ws/index.js';
import http from 'node:http';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cdpGet(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9223, path, method }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.end();
  });
}

class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map();
    this.ws.on('message', (d) => { const m = JSON.parse(d); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } }); }
  open() { return new Promise((r, j) => { this.ws.on('open', r); this.ws.on('error', j); }); }
  send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++this.id; this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async eval(expr) { const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error('eval threw: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text)); return r.result && r.result.value; }
  close() { try { this.ws.close(); } catch {} }
}

async function main() {
  const server = spawn('node', ['server/src/gameplay-server.mjs'], { cwd: '/home/max/Projects/deadshot/gameplay', stdio: ['ignore', 'ignore', 'ignore'] });
  const profile = '/tmp/opencode/cdp-chrome-' + Date.now();
  const chrome = spawn('google-chrome', [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--ignore-gpu-blocklist', '--no-first-run', '--remote-debugging-port=9223',
    '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });
  let cdpA, cdpB;
  try {
    // wait for CDP endpoint
    for (let i = 0; i < 30; i++) { try { await cdpGet('/json/version'); break; } catch { await sleep(1000); } }
    await sleep(1000);
    // open two tabs on the game
    const tabA = await cdpGet('/json/new?http://127.0.0.1:8080/', 'PUT');
    const tabB = await cdpGet('/json/new?http://127.0.0.1:8080/', 'PUT');
    console.log('tabA url:', tabA.url, 'tabB url:', tabB.url);
    cdpA = new CDP(tabA.webSocketDebuggerUrl);
    cdpB = new CDP(tabB.webSocketDebuggerUrl);
    await Promise.all([cdpA.open(), cdpB.open()]);
    await sleep(3000);
    console.log('A state:', JSON.stringify(await cdpA.eval('({rs:document.readyState, title:document.title, body:document.body ? document.body.innerHTML.length : -1, patch:window.__dsPosPatch||null, Kq:typeof Kq, V3:typeof V3, a0T:typeof a0T, J3:typeof J3, a0c:typeof a0c, gbl:Object.keys(window).length})')));
    console.log('B state:', JSON.stringify(await cdpB.eval('({rs:document.readyState, title:document.title, body:document.body ? document.body.innerHTML.length : -1, patch:window.__dsPosPatch||null, Kq:typeof Kq, V3:typeof V3, a0T:typeof a0T, J3:typeof J3, a0c:typeof a0c, gbl:Object.keys(window).length})')));
    await Promise.all([cdpA.send('Runtime.enable'), cdpB.send('Runtime.enable')]);
    try { await Promise.all([cdpA.send('Network.enable'), cdpB.send('Network.enable')]); } catch {}
    await Promise.all([cdpA.eval(`window.__dsErrors = []; window.addEventListener('error', function(e){ window.__dsErrors.push('ERR ' + (e.message||String(e.error))); }); window.addEventListener('unhandledrejection', function(e){ window.__dsErrors.push('REJ ' + String(e.reason && e.reason.message || e.reason)); });`), cdpB.eval(`window.__dsErrors = []; window.addEventListener('error', function(e){ window.__dsErrors.push('ERR ' + (e.message||String(e.error))); }); window.addEventListener('unhandledrejection', function(e){ window.__dsErrors.push('REJ ' + String(e.reason && e.reason.message || e.reason)); });`)]);
    const consoleLogs = [];
    for (const c of [cdpA, cdpB]) c.ws.on('message', (d) => { try { const m = JSON.parse(d); if (m.method === 'Runtime.exceptionThrown') consoleLogs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception).slice(0, 400)); if (m.method === 'Runtime.consoleAPICalled') consoleLogs.push('CONS[' + m.params.type + '] ' + String(m.params.args && m.params.args[0] && m.params.args[0].value).slice(0, 300)); if (m.method === 'Network.loadingFailed') consoleLogs.push('NETFAIL ' + m.params.errorText + ' ' + m.params.requestId); } catch {} });

    // wait for patch in both
    let pa = null, pb = null;
    for (let i = 0; i < 60; i++) {
      pa = pa || await cdpA.eval('window.__dsPosPatch ? String(window.__dsPosPatch) : null');
      pb = pb || await cdpB.eval('window.__dsPosPatch ? String(window.__dsPosPatch) : null');
      if (pa && pb && pa.startsWith('ok@') && pb.startsWith('ok@')) break;
      await sleep(2000);
    }
    console.log('A patch:', pa);
    console.log('B patch:', pb);
    // wait until the injected __dsDiag bridge is defined (bundle eval reaches anchor)
    let diagReady = false;
    for (let i = 0; i < 40; i++) {
      const r = await cdpA.eval('typeof window.__dsDiag === "object" && typeof window.__dsDiag.create === "function" ? true : false');
      if (r) { diagReady = true; break; }
      await sleep(2000);
    }
    console.log('A diag ready:', diagReady);
    console.log('A webgl:', await cdpA.eval('(function(){var c=document.createElement("canvas");var g=c.getContext("webgl");return g?g.getParameter(g.RENDERER):null;})()'));

    // drive party
    console.log('A.create:', await cdpA.eval('window.__dsDiag.create()'));
    const code = await cdpA.eval('window.__dsDiag.party().id');
    console.log('code:', code);
    await sleep(500);
    console.log('B.join:', await cdpB.eval(`window.__dsDiag.join(${JSON.stringify(code)})`));
    await sleep(500);
    console.log('A.ready:', await cdpA.eval('window.__dsDiag.ready()'));
    await sleep(300);
    console.log('B.ready:', await cdpB.eval('window.__dsDiag.ready()'));
    // wait for select availability
    let sA = null, sB = null;
    for (let i = 0; i < 60; i++) {
      sA = await cdpA.eval('window.__dsDiag.select(0)');
      if (sA === 'ok') break;
      await sleep(2000);
    }
    console.log('A.select:', sA);
    await sleep(1500);
    for (let i = 0; i < 60; i++) {
      sB = await cdpB.eval('window.__dsDiag.select(0)');
      if (sB === 'ok') break;
      await sleep(2000);
    }
    console.log('B.select:', sB);
    // wait for enemies
    for (let i = 0; i < 30; i++) {
      const va = await cdpA.eval('(window.__dsDiag.dump().v3||[]).length');
      const vb = await cdpB.eval('(window.__dsDiag.dump().v3||[]).length');
      if (va >= 1 && vb >= 1) break;
      await sleep(2000);
    }
    console.log('settling 8s'); await sleep(8000);
    console.log('A errors:', JSON.stringify(await cdpA.eval('window.__dsErrors || []')));
    console.log('B errors:', JSON.stringify(await cdpB.eval('window.__dsErrors || []')));
    const da = await cdpA.eval('window.__dsDiag.dump()');
    const db = await cdpB.eval('window.__dsDiag.dump()');
    console.log('DUMP A:', JSON.stringify(da, null, 2));
    console.log('DUMP B:', JSON.stringify(db, null, 2));
  } finally {
    cdpA && cdpA.close(); cdpB && cdpB.close();
    try { chrome.kill('SIGKILL'); } catch {}
    try { server.kill('SIGKILL'); } catch {}
  }
}
main().catch((e) => { console.error('ERR', e); process.exit(1); });

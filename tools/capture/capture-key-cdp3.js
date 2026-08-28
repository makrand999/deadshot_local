// Stealth crypto hook: re-inject via Runtime.evaluate into the live main context
// every few seconds (survives anti-tamper reverts), polling for the decrypt.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9234;
const OUT = path.join(__dirname, '..', '..', 'raw');
const PROFILE = path.join(os.tmpdir(), 'ds-key3-' + Date.now());
let chromeProc;

function log(m) { console.log('[' + new Date().toISOString().slice(11, 19) + ']', m); }
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

const HOOK = `
(function(){
  try {
    if (window.__cap3) return;
    window.__cap3 = { imp: [], dec: [], ok: false, ts: Date.now() };
    var sub = window.crypto.subtle;
    var hex = function(b){ try { var a=new Uint8Array(b); var s=''; for(var i=0;i<a.length;i++){ s += (a[i]<16?'0':'')+a[i].toString(16); if(i>512) break; } return s; } catch(e){ return 'ERR'; } };
    var origImp = sub.importKey.bind(sub);
    var origDec = sub.decrypt.bind(sub);
    sub.importKey = function(format, keyData, algo, extractable, usages){
      window.__cap3.imp.push({ format: format, len: keyData && keyData.byteLength, hex: hex(keyData), algo: algo && algo.name });
      return origImp(format, keyData, algo, extractable, usages);
    };
    sub.decrypt = function(algo, key, data){
      var rec = { algo: algo && algo.name, iv: algo && algo.iv ? hex(algo.iv) : null, dataLen: data && data.byteLength, dataHead: hex(data).slice(0,60) };
      var p = origDec(algo, key, data);
      p.then(function(dec){
        rec.decLen = dec.byteLength; rec.decHead = hex(dec).slice(0,40);
        window.__cap3.dec.push(rec);
        window.__cap3.decrypted = Array.prototype.slice.call(new Uint8Array(dec));
      }).catch(function(e){ rec.err = String(e); window.__cap3.dec.push(rec); });
      return p;
    };
    window.__cap3.ok = true;
  } catch(e) { window.__cap3 = { err: String(e) }; }
})();
`;

async function main() {
  log('starting Chrome...');
  await startChrome();
  log('connecting...');
  const cdp = await CDP.connect(PORT);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: HOOK });
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });

  // Re-inject + poll every 2s
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    // Re-inject the hook (idempotent — __cap3 guard)
    await cdp.send('Runtime.evaluate', { expression: HOOK, returnByValue: true }).catch(() => {});
    const res = await cdp.send('Runtime.evaluate', { expression: 'JSON.stringify(window.__cap3 || "NONE")', returnByValue: true });
    const v = res.result && res.result.value;
    if (v && v !== '"NONE"') {
      try {
        const cap = JSON.parse(v);
        if (cap.dec && cap.dec.length) {
          console.log('\nCAPTURED at poll ' + i + ':');
          console.log('importKey:', JSON.stringify(cap.imp));
          console.log('decrypt:', JSON.stringify(cap.dec));
          if (cap.decrypted && cap.decrypted.length) {
            const buf = Buffer.from(cap.decrypted);
            fs.writeFileSync(path.join(OUT, 'final.pkg.decrypted.capture'), buf);
            console.log('\nSAVED decrypted pkg', buf.length, 'bytes. magic:', buf.slice(0, 8).toString('hex'), JSON.stringify(buf.slice(0, 4).toString('ascii')));
            const sha = require('crypto').createHash('sha256').update(buf).digest('hex');
            console.log('sha256:', sha);
          }
          fs.writeFileSync(path.join(OUT, 'crypto-capture.json'), JSON.stringify(cap, null, 2));
          cdp.close(); chromeProc.kill(); process.exit(0);
        }
        log('poll ' + i + ': imp=' + (cap.imp || []).length + ' dec=' + (cap.dec || []).length + ' ok=' + cap.ok + (cap.err ? ' err=' + cap.err : ''));
      } catch (e) { log('poll ' + i + ' parse err: ' + e.message); }
    } else { log('poll ' + i + ': __cap3 NONE'); }
  }
  cdp.close(); chromeProc.kill();
  log('no capture');
  process.exit(1);
}
main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); process.exit(1); });

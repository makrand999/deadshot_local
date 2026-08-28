// Capture the real AES key + decrypted pkg by hooking crypto.subtle in live Chrome.
// The game fetches final.pkg and decrypts it with AES-GCM via crypto.subtle.
// We inject a document-start override that logs:
//   - importKey: the raw key bytes (hex)
//   - decrypt:   the IV + data head (and the DECRYPTED result)
// This gives us the exact key + the decrypted WASM without needing to reverse SM2pwJ.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9231;
const OUT_DIR = path.join(__dirname, '..', '..', 'raw');
const PROFILE = path.join(os.tmpdir(), 'ds-key-' + Date.now());
const WAIT = parseInt(process.argv[2] || '25', 10);

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

const HOOK_JS = `
(function(){
  if (window.__cap) return;
  window.__cap = { importKey: [], decrypt: [], errors: [] };
  var hex = function(b) { try { return Array.prototype.map.call(new Uint8Array(b), function(x){ return x.toString(16).padStart(2,'0'); }).join(''); } catch(e){ return 'ERR:'+e.message; } };
  try {
    var sub = crypto.subtle;
    var oi = sub.importKey.bind(sub);
    var od = sub.decrypt.bind(sub);
    sub.importKey = function(format, keyData, algo, extractable, usages) {
      var rec = { format: format, keyLen: keyData && keyData.byteLength, keyHex: hex(keyData), algo: algo && algo.name, usages: usages };
      window.__cap.importKey.push(rec);
      return oi(format, keyData, algo, extractable, usages);
    };
    sub.decrypt = function(algo, key, data) {
      var rec = { algo: algo && algo.name, ivHex: algo && algo.iv ? hex(algo.iv) : null, dataLen: data && data.byteLength, dataHead: hex(data).slice(0, 80) };
      var p = od(algo, key, data);
      p.then(function(dec) {
        rec.decryptedLen = dec.byteLength;
        rec.decryptedHead = hex(dec).slice(0, 40);
        window.__cap.decrypt.push(rec);
        if (dec.byteLength > 1000) {
          try { window.__cap.decrypted = Array.prototype.slice.call(new Uint8Array(dec)); } catch(e){}
        }
      }).catch(function(e){ rec.error = String(e); window.__cap.decrypt.push(rec); });
      return p;
    };
  } catch(e) { window.__cap.errors.push('hook:' + e.message); }
})();
`;

async function main() {
  log('starting Chrome...');
  await startChrome();
  log('connecting CDP...');
  const cdp = await CDP.connect(PORT);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  cdp.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') log('console.error: ' + (p.args || []).map((a) => a.value || a.description || '').join(' ').slice(0, 150)); });
  cdp.on('Runtime.exceptionThrown', (p) => { log('EXC: ' + ((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text || '').slice(0, 150)); });

  // Inject hook before navigation
  const inj = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: HOOK_JS });
  log('hook injected:', inj.result && inj.result.identifier ? 'yes' : 'no');

  log('navigating...');
  await cdp.send('Page.navigate', { url: 'https://deadshot.io/' });
  log('waiting ' + WAIT + 's for pkg decrypt...');
  await new Promise((r) => setTimeout(r, WAIT * 1000));

  // Read captured data
  const res = await cdp.send('Runtime.evaluate', {
    expression: 'JSON.stringify({ importKey: window.__cap ? window.__cap.importKey : null, decrypt: window.__cap ? window.__cap.decrypt : null, errors: window.__cap ? window.__cap.errors : null, decrypted: window.__cap && window.__cap.decrypted ? window.__cap.decrypted : null })',
    returnByValue: true,
  });
  let cap = null;
  try { cap = JSON.parse(res.result.value); } catch (e) { log('parse failed: ' + e.message); }

  if (cap) {
    console.log('\n=== importKey calls ===');
    (cap.importKey || []).forEach((k) => console.log(' format=' + k.format, 'len=' + k.keyLen, 'hex=' + (k.keyHex || '').slice(0, 70), k.algo));
    console.log('\n=== decrypt calls ===');
    (cap.decrypt || []).forEach((d) => console.log(' iv=' + (d.ivHex || '').slice(0, 30), 'dataLen=' + d.dataLen, 'decLen=' + d.decryptedLen, 'decHead=' + (d.decryptedHead || ''), d.error || ''));
    console.log('\n=== hook errors ===', cap.errors || []);
    if (cap.decrypted && cap.decrypted.length) {
      const buf = Buffer.from(cap.decrypted);
      const f = path.join(OUT_DIR, 'final.pkg.decrypted.capture');
      fs.writeFileSync(f, buf);
      console.log('\nSAVED decrypted pkg (' + buf.length + ' bytes) ->', f);
      console.log('magic:', buf.slice(0, 8).toString('hex'), JSON.stringify(buf.slice(0, 4).toString('ascii')));
    }
    fs.writeFileSync(path.join(OUT_DIR, 'crypto-capture.json'), JSON.stringify(cap, null, 2));
  }

  cdp.close(); chromeProc.kill();
  log('done');
  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); if (chromeProc) chromeProc.kill(); process.exit(1); });

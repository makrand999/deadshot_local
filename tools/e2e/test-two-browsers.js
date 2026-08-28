// Two-browser party test driven through the test-mode control bridge.
//
// The server is started with DS_TEST_MODE=1, which exposes window.__dsTest
// inside the game realm (party.create/join/ready, input, gameState). No
// canvas clicking and no WebSocket/anti-tamper patching.
//
// Usage: node tools/test-two-browsers.js
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');
const CHROME = '/usr/bin/google-chrome';
const SHOTS = '/tmp/opencode';
const OUT = path.join(ROOT, 'raw', 'captures', 'two-browsers.json');
const TRACE = '/tmp/opencode/two-browsers.log';
const BASE = process.env.BASE_URL || 'http://192.168.local:8080/';

const trace = (m) => fs.appendFileSync(TRACE, '[' + new Date().toISOString().slice(11, 19) + '] ' + m + '\n');
const log = (...args) => { console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...args); trace(args.join(' ')); };

const lanIp = () => {
  for (const name of Object.keys(os.networkInterfaces())) {
    for (const i of os.networkInterfaces()[name] || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  close() { try { this.ws.close(); } catch (e) {} }
}

function launchChrome(port, profile) {
  const flags = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + port, '--no-first-run',
    '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--host-resolver-rules=MAP 192.168.local ' + lanIp(),
    '--window-size=1280,800', '--user-data-dir=' + profile, 'about:blank',
  ];
  if (!process.env.VISIBLE) flags.unshift('--headless=new');
  return spawn(CHROME, flags, { stdio: ['ignore', 'ignore', 'ignore'] });
}

async function waitCdp(port) {
  for (let t = 0; t < 30; t++) {
    try { await getJson(`http://127.0.0.1:${port}/json/version`); return; } catch (e) { await sleep(800); }
  }
  throw new Error('cdp not up on ' + port);
}

async function shot(cdp, name) {
  try {
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64'));
    log('screenshot -> ' + SHOTS + '/' + name + '.png');
  } catch (e) { log('screenshot failed: ' + e.message); }
}

async function evalIn(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error('page eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
  return r.result?.result?.value;
}

async function clickAt(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

// Reach the bridge either directly on the main window (game ran there) or on
// a captured iframe window (game ran in the transient about:blank realm).
const BRIDGE_LOOKUP = `(() => {
  if (window.__dsTest) return { win: 'main', has: true };
  const wins = window.__dsIframeWins || [];
  for (let i = 0; i < wins.length; i++) {
    try { if (wins[i] && wins[i].__dsTest) return { win: 'iframe:' + i, has: true }; } catch (e) {}
  }
  return { win: null, has: false, iframes: wins.length };
})()`;

const BRIDGE_CALL = (callJs) => `(() => {
  if (window.__dsTest) return window.__dsTest.${callJs};
  const wins = window.__dsIframeWins || [];
  for (let i = 0; i < wins.length; i++) {
    try { if (wins[i] && wins[i].__dsTest) return wins[i].__dsTest.${callJs}; } catch (e) {}
  }
  return 'no bridge';
})()`;

function newClient(label, port, profile) {
  const c = { label, port, wsUrls: new Set(), frames: [], logs: [], errors: [] };
  c.chrome = launchChrome(port, profile);
  return c;
}

async function connectClient(c) {
  await waitCdp(c.port);
  const cdp = await CDP.connect(c.port);
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Network.webSocketCreated', (p) => { c.wsUrls.add(p.url); log(c.label, 'WS:', p.url); });
  cdp.on('Network.webSocketFrameSent', (p) => c.frames.push({ dir: 'S', d: p.response.payloadData }));
  cdp.on('Network.webSocketFrameReceived', (p) => c.frames.push({ dir: 'R', d: p.response.payloadData }));
  cdp.on('Runtime.consoleAPICalled', (p) => c.logs.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 140)));
  cdp.on('Runtime.exceptionThrown', (p) => c.errors.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '').slice(0, 160)));
  c.cdp = cdp;
  return cdp;
}

async function bootToBridge(c) {
  const cdp = c.cdp;
  log(c.label, 'navigating...');
  await cdp.send('Page.navigate', { url: BASE });
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    const found = await evalIn(cdp, BRIDGE_LOOKUP).catch(() => null);
    if (found && found.has) { log(c.label, 'bridge at:', found.win); return; }
    await sleep(2000);
  }
  throw new Error(c.label + ': __dsTest bridge never appeared');
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.rmSync(TRACE, { force: true });
  log('LAN IP: ' + lanIp());
  const serverProc = spawn('node', ['server/src/index.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DS_TEST_MODE: '1', DS_LAN_MODE: process.env.DS_LAN_MODE || '1', DS_AUTO_LOGIN: '1' },
  });
  const events = { created: null, joined: null, ready: null, inputs: 0 };
  const serverLogFile = '/tmp/opencode/two-browsers-server.log';
  fs.rmSync(serverLogFile, { force: true });
  serverProc.stdout.on('data', (d) => {
    const line = String(d);
    fs.appendFileSync(serverLogFile, line);
    const m = line.match(/\[room\] CREATE ([A-Z2-9]{6})/);
    if (m) { events.created = m[1]; log('>>> PARTY ID:', m[1]); }
    const j = line.match(/\[room\] JOIN ([A-Z2-9]{6}) members=(\d+)/);
    if (j) { events.joined = { id: j[1], members: j[2] }; log('>>> JOIN:', j[1], 'members', j[2]); }
    const r = line.match(/\[room\] READY ([A-Z2-9]{6})/);
    if (r) { events.ready = r[1]; log('>>> ROOM READY:', r[1]); }
    const inp = line.match(/RECV 1 FRF6r51VY32/);
    if (inp) events.inputs++;
  });
  serverProc.stderr.on('data', (d) => process.stderr.write('[server!] ' + d));
  await sleep(2000);

  const A = newClient('A', 9245, os.tmpdir() + '/ds-two-a-' + Date.now());
  const B = newClient('B', 9246, os.tmpdir() + '/ds-two-b-' + Date.now());
  try {
    await connectClient(A);
    await connectClient(B);
    await bootToBridge(A);
    await bootToBridge(B);

    log('=== A creates a party ===');
    log('A create:', await evalIn(A.cdp, BRIDGE_CALL(`party.create()`)));
    const createDeadline = Date.now() + 15000;
    while (!events.created && Date.now() < createDeadline) await sleep(500);
    if (!events.created) throw new Error('no party id from server log');
    const partyId = events.created;
    await sleep(1500);
    log('A partyState:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`partyState()`))));

    log('=== B joins party ' + partyId + ' ===');
    log('B join:', await evalIn(B.cdp, BRIDGE_CALL(`party.join('${partyId}')`)));
    const joinDeadline = Date.now() + 15000;
    while (!events.joined && Date.now() < joinDeadline) await sleep(500);
    if (!events.joined) throw new Error('B did not join');
    await sleep(1500);
    log('A partyState:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`partyState()`))));
    log('B partyState:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`partyState()`))));

    log('=== A ready, then B ready ===');
    await evalIn(A.cdp, BRIDGE_CALL(`party.ready()`));
    await sleep(2500);
    const gameOf = (c) => [...c.wsUrls].filter((u) => u.includes(':8080/ws'));
    if (gameOf(A).length + gameOf(B).length > 0) throw new Error('match started before every member was ready');
    await evalIn(B.cdp, BRIDGE_CALL(`party.ready()`));
    const readyDeadline = Date.now() + 15000;
    while (!events.ready && Date.now() < readyDeadline) await sleep(500);
    if (!events.ready) throw new Error('room never started');

    const gameDeadline = Date.now() + 40000;
    while ((gameOf(A).length < 1 || gameOf(B).length < 1) && Date.now() < gameDeadline) await sleep(1000);
    if (gameOf(A).length < 1 || gameOf(B).length < 1) throw new Error('game sockets did not open for both');
    await sleep(20000);

    log('A gameState:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`gameState()`))));
    log('A playersDeep:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`playersDeep()`))));
    log('A ui:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`ui()`))));
    log('B gameState:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`gameState()`))));
    log('B playersDeep:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`playersDeep()`))));
    log('B ui:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`ui()`))));

    log('=== both select a class (weapon) ===');
    async function selectClassWithRetry(c, label) {
      const deadline = Date.now() + 60000;
      let fs = null;
      while (Date.now() < deadline) {
        fs = await evalIn(c.cdp, BRIDGE_CALL(`flowState()`)).catch(() => null);
        if (fs && fs.YdshJUELZK === 'built' && fs.XhBuilt === true && fs.L3 >= 1 && fs.P9) break;
        await sleep(1000);
      }
      log(label, 'ready state:', JSON.stringify(fs));
      if (!fs || fs.YdshJUELZK !== 'built') throw new Error(label + ': models never built');
      let r = await evalIn(c.cdp, BRIDGE_CALL(`selectClass(0)`));
      log(label, 'selectClass:', r);
      for (let attempt = 0; attempt < 5 && r !== 'sent21 ok=true'; attempt++) {
        await sleep(5000);
        r = await evalIn(c.cdp, BRIDGE_CALL(`selectClass(0)`));
        log(label, 'selectClass retry ' + (attempt + 1) + ':', r);
      }
      const spawnDeadline = Date.now() + 30000;
      while (Date.now() < spawnDeadline) {
        const s = await evalIn(c.cdp, BRIDGE_CALL(`flowState()`)).catch(() => null);
        if (s && s.Gf === false && s.YGIc === true) { log(label, 'IN GAME'); return; }
        await sleep(1000);
      }
      log(label, 'NOT in game after class select, flow:', JSON.stringify(await evalIn(c.cdp, BRIDGE_CALL(`flowState()`))));
    }
    await selectClassWithRetry(A, 'A');
    await selectClassWithRetry(B, 'B');
    await sleep(5000);
    log('A flowState:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`flowState()`))));
    log('A ui after class:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`ui()`))));
    log('B flowState:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`flowState()`))));
    log('B ui after class:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`ui()`))));

    log('=== pointer lock check ===');
    for (const c of [A, B]) {
      log(c.label, 'pointer before:', JSON.stringify(await evalIn(c.cdp, BRIDGE_CALL(`pointer()`))));
    }
    await clickAt(A.cdp, 640, 400);
    await sleep(1200);
    for (const c of [A, B]) {
      log(c.label, 'lockPointer:', await evalIn(c.cdp, BRIDGE_CALL(`lockPointer()`)));
    }
    await sleep(1200);
    for (const c of [A, B]) {
      log(c.label, 'pointer after lock req:', JSON.stringify(await evalIn(c.cdp, BRIDGE_CALL(`pointer()`))));
      for (let i = 0; i < 8; i++) {
        await c.cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640 + i * 15, y: 400 - i * 10 });
        await sleep(120);
      }
    }
    await sleep(1000);
    for (const c of [A, B]) {
      log(c.label, 'pointer after mouse moves:', JSON.stringify(await evalIn(c.cdp, BRIDGE_CALL(`pointer()`))));
    }

    log('=== A sends movement input (body-yaw byte 128 => facing NORTH per y*pi/128+pi) ===');
    let last = 0;
    for (let i = 0; i < 30; i++) {
      last = await evalIn(A.cdp, BRIDGE_CALL(`input(1, 64, 128, ${i})`));
      await sleep(50);
    }
    log('input result:', last);
    await sleep(2000);
    log('server inputs received:', events.inputs);
    log('A gameState after input:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`gameState()`))));
    log('A playersDeep after input:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`playersDeep()`))));
    log('A flowState after input:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`flowState()`))));
    log('A ui after input:', JSON.stringify(await evalIn(A.cdp, BRIDGE_CALL(`ui()`))));
    log('B gameState after input:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`gameState()`))));
    log('B playersDeep after input:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`playersDeep()`))));
    log('B flowState after input:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`flowState()`))));
    log('B ui after input:', JSON.stringify(await evalIn(B.cdp, BRIDGE_CALL(`ui()`))));

    log('--- summary ---');
    log('A ws:', [...A.wsUrls].join(' ') || 'NONE');
    log('B ws:', [...B.wsUrls].join(' ') || 'NONE');
    log('A frames:', A.frames.length, 'B frames:', B.frames.length);
    log('A errors:', A.errors.length ? A.errors.slice(0, 4).join(' ;; ') : 'none');
    log('B errors:', B.errors.length ? B.errors.slice(0, 4).join(' ;; ') : 'none');
    await shot(A.cdp, 'A-ingame');
    await shot(B.cdp, 'B-ingame');

    fs.writeFileSync(OUT, JSON.stringify({
      partyId, aWs: [...A.wsUrls], bWs: [...B.wsUrls],
      aFrames: A.frames, bFrames: B.frames,
      aErrors: A.errors, bErrors: B.errors,
      aLogs: A.logs, bLogs: B.logs,
    }, null, 2));
    log('saved ' + OUT);

    const hold = parseInt(process.env.HOLD_MS || '0', 10);
    if (hold > 0) {
      log('=== HOLDING browsers open ' + hold + 'ms — look at the windows now ===');
      await sleep(hold);
    }
  } catch (e) {
    console.error('FATAL:', e && e.stack ? e.stack : e);
    trace('FATAL: ' + (e && e.stack ? e.stack : e));
    process.exitCode = 1;
  } finally {
    try { A.chrome.kill(); } catch (e) {}
    try { B.chrome.kill(); } catch (e) {}
    try { serverProc.kill(); } catch (e) {}
  }
}
main().catch((e) => { console.error('OUTER FATAL:', e); process.exitCode = 1; });

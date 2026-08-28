// tools/visual-replay.mjs — Phase-3 visual replay harness.
//
// Replays the RECORDED real server's S->C frames into two real client windows
// (our server's game socket is mocked in-page via the GP_WS_MOCK shim: the
// party/matchmaker stays real, the game ws is intercepted and driven by this
// harness). Result: the windows relive the real match from both perspectives;
// __dsDiag.dump() polls let it be verified headlessly (positions, anims, hp).
//
// Usage:
//   node tools/visual-replay.mjs [--session N] [--rate FPS] [--settle MS]
// Env:
//   GP_CAPTURE_A / GP_CAPTURE_B (default raw/captures/real-spawn-client{A,B}.json)
//
// Also captures the clients' C->S (window.__dsMock.sent) and surfaces page
// errors (__dsErrors) + GP_HITDBG-style diagnostics. Writes
// /tmp/opencode/visual-replay-dump.json and prints a comparison summary.
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REPO = path.join(ROOT, '..');
const DUMP_PATH = '/tmp/opencode/visual-replay-dump.json';
const LOG_PATH = '/tmp/opencode/visual-replay-server.log';
const PORT = 8080;
const CAPTURE_A = process.env.GP_CAPTURE_A || path.join(REPO, 'raw/captures/real-spawn-clientA.json');
const CAPTURE_B = process.env.GP_CAPTURE_B || path.join(REPO, 'raw/captures/real-spawn-clientB.json');

const argv = process.argv.slice(2);
const arg = (flag, def) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : def;
};
const SESSION = arg('--session', -1);   // -1 = last session present in both captures
const RATE = Math.max(1, arg('--rate', 80));
const SETTLE_MS = Math.max(0, arg('--settle', 5000));

if (!process.versions.electron) {
  const electronPath = require('electron');
  const child = spawn(electronPath, [process.argv[1], ...argv], { stdio: 'inherit' });
  child.on('exit', (code, signal) => process.exit(code == null ? 0 : code));
  child.on('error', (e) => { console.error('electron spawn failed:', e); process.exit(1); });
} else {
  main().catch((e) => { console.error('[visual-replay] FATAL', e); process.exit(1); });
}

async function main() {
  const { app, BrowserWindow } = require('electron');
  const { decode, fromWireB64, toWireB64, loadSchema } = await import('../../packages/protocol/index.mjs');
  loadSchema();

  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('no-first-run');
  app.commandLine.appendSwitch('disable-background-timer-throttling');

  let server = null;
  let serverKilled = false;
  let windows = [];
  const polls = { A: [], B: [] };
  const pageErrors = { A: [], B: [] };
  const feedStats = { A: { ok: 0, err: 0 }, B: { ok: 0, err: 0 } };

  process.stdout.on('error', (e) => { if (e.code !== 'EPIPE') throw e; });
  process.stderr.on('error', (e) => { if (e.code !== 'EPIPE') throw e; });
  const log = (...a) => { try { console.log('[' + new Date().toISOString().slice(11, 23) + ']', ...a); } catch {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function killServer() {
    if (server) { serverKilled = true; try { server.kill('SIGKILL'); } catch {} server = null; }
  }
  function cleanup() {
    killServer();
    try { for (const w of windows) w.destroy(); } catch {}
  }
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  try {
    const out = execSync(
      'ps -eo pid=,args= | awk \'$0 ~ /node server.src.gameplay-server.mjs/ && !/awk/ && !/grep/ {print $1}\''
    ).toString();
    for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
      try { process.kill(Number(pid), 'SIGKILL'); log('killed stale server', pid); } catch {}
    }
  } catch {}

  // ---- load + split the captured streams (same logic as tools/replay/replay-match.mjs) ----
  const loadClient = (file) => {
    const d = JSON.parse(fs.readFileSync(file, 'utf8'));
    const frames = [];
    for (const f of d.websockets || []) {
      const raw = Buffer.from(f.hex, 'hex');
      if (!raw.length) continue;
      const bin = raw[0] <= 1 ? raw : Buffer.from(raw.toString('utf8'), 'base64');
      if (bin.length && bin[0] >= 0x80 && bin[0] <= 0xbf) continue; // party msgpack
      frames.push(f);
    }
    return frames;
  };
  const splitSessions = (frames) => {
    const boundaries = [];
    frames.forEach((f, i) => {
      if (f.dir !== 'S') return;
      const raw = Buffer.from(f.hex, 'hex');
      const bin = raw[0] <= 1 ? raw : Buffer.from(raw.toString('utf8'), 'base64');
      try {
        if (decode(bin).some((m) => m.msgId === 48)) boundaries.push(i);
      } catch {}
    });
    const sessions = [];
    for (let s = 0; s < boundaries.length; s++) {
      const from = Math.max(0, boundaries[s] - 3);
      const to = s + 1 < boundaries.length ? boundaries[s + 1] : frames.length;
      sessions.push(frames.slice(from, to));
    }
    return sessions;
  };
  const wirePayload = (f) => {
    const raw = Buffer.from(f.hex, 'hex');
    const bin = raw[0] <= 1 ? raw : Buffer.from(raw.toString('utf8'), 'base64');
    return toWireB64(bin); // always feed text so the client codec path is uniform
  };
  const decodeFrames = (frames) => {
    const out = [];
    for (const f of frames) {
      if (f.dir !== 'R') continue;
      const raw = Buffer.from(f.hex, 'hex');
      const bin = raw[0] <= 1 ? raw : Buffer.from(raw.toString('utf8'), 'base64');
      try { for (const m of decode(bin)) out.push(m); } catch {}
    }
    return out;
  };

  const framesA = loadClient(CAPTURE_A);
  const framesB = loadClient(CAPTURE_B);
  const sessA = splitSessions(framesA);
  const sessB = splitSessions(framesB);
  log('captures:', framesA.length + '/' + framesB.length + ' game frames, sessions A=' + sessA.length + ' B=' + sessB.length);
  const si = SESSION >= 0 ? SESSION : Math.min(sessA.length, sessB.length) - 1;
  if (si < 0 || si >= sessA.length || si >= sessB.length) throw new Error('session ' + si + ' out of range (A=' + sessA.length + ', B=' + sessB.length + ')');
  const feedA = sessA[si].filter((f) => f.dir === 'R');
  const feedB = sessB[si].filter((f) => f.dir === 'R');
  const truthA = decodeFrames(sessA[si]);
  const truthB = decodeFrames(sessB[si]);
  log('session ' + si + ': feeding ' + feedA.length + ' S->C frames to A, ' + feedB.length + ' to B at ~' + RATE + ' fps');

  // ---- spawn the gameplay server with the ws-mock shim enabled ----
  fs.writeFileSync(LOG_PATH, '');
  const outLog = fs.openSync(LOG_PATH, 'a');
  server = spawn('node', ['server/src/gameplay-server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, GP_WS_MOCK: '1', GP_ALLOC_TTL: '0', GP_MATCH_TIME: '3600' },
    stdio: ['ignore', outLog, outLog],
  });
  server.on('exit', (code) => { if (code && !serverKilled) log('server exited', code); });
  server.unref?.();

  await app.whenReady();

  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/');
      if (res.ok) break;
    } catch {}
    if (Date.now() - start > 30000) throw new Error('server did not come up on :' + PORT);
    await sleep(1000);
  }
  log('server up on :' + PORT + ' (log: ' + LOG_PATH + ')');

  windows = [makeWindow('A'), makeWindow('B')];
  const [A, B] = windows;

  const waitJs = async (win, expr, label, timeoutMs = 90000, intervalMs = 2000) => {
    const t0 = Date.now();
    let last;
    while (Date.now() - t0 < timeoutMs) {
      try { last = await win.webContents.executeJavaScript('(' + expr + ')'); if (last) return last; } catch (e) { last = String(e); }
      await sleep(intervalMs);
    }
    throw new Error('timeout waiting for ' + label + ' (last=' + last + ')');
  };

  for (const [label, win] of [['A', A], ['B', B]]) {
    await waitJs(win, 'window.__dsPosPatch && String(window.__dsPosPatch).indexOf("ok@") === 0', label + ' posPatch');
    await waitJs(win, 'typeof window.__dsDiag === "object"', label + ' __dsDiag bridge');
    await waitJs(win, 'window.__dsMock && typeof window.__dsMock.feed === "function"', label + ' ws mock shim');
  }
  log('both windows patched + ws mock ready');

  // ---- drive the party/match flow via __dsDiag (mm is real) ----
  await waitJs(A, 'window.__dsDiag.party() && window.__dsDiag.party().id', 'A party id', 15000, 1000)
    .catch(async () => log('A.create() ->', await A.webContents.executeJavaScript('window.__dsDiag.create()')));
  const code = await waitJs(A, 'window.__dsDiag.party() && window.__dsDiag.party().id', 'A party id');
  log('party code:', code);
  await sleep(500);
  log('B.join() ->', await B.webContents.executeJavaScript('window.__dsDiag.join(' + JSON.stringify(String(code)) + ')'));
  await sleep(500);
  log('A.ready() ->', await A.webContents.executeJavaScript('window.__dsDiag.ready()'));
  await sleep(300);
  log('B.ready() ->', await B.webContents.executeJavaScript('window.__dsDiag.ready()'));
  const selA = await waitJs(A, 'window.__dsDiag.select(0) === "ok" ? "ok" : null', 'A select(0)', 90000, 2000);
  log('A.select(0) ->', selA);
  await sleep(1000);
  const selB = await waitJs(B, 'window.__dsDiag.select(0) === "ok" ? "ok" : null', 'B select(0)', 90000, 2000);
  log('B.select(0) ->', selB);

  // ---- wait for both game sockets to be intercepted ----
  await waitJs(A, 'window.__dsMock.ws && window.__dsMock.ws.__isMock ? "ok" : null', 'A game socket', 60000, 1000);
  await waitJs(B, 'window.__dsMock.ws && window.__dsMock.ws.__isMock ? "ok" : null', 'B game socket', 60000, 1000);
  log('both game sockets intercepted; feeding recorded S->C');

  // ---- 2s headless polls (positions/anims/hp) ----
  const pollTimer = setInterval(async () => {
    for (const [label, win] of [['A', A], ['B', B]]) {
      try {
        const d = await win.webContents.executeJavaScript('window.__dsDiag.dump()');
        const errs = await win.webContents.executeJavaScript('window.__dsErrors || []').catch(() => []);
        polls[label].push({ t: Date.now(), dump: d, errors: errs.slice(-5) });
        const line = (d.v3 || []).map((e) => 'id' + e.id + ' v' + (e.visible ? 1 : 0) + ' p(' + (e.pos ? e.pos.x : '-') + ',' + (e.pos ? e.pos.y : '-') + ') h' + e.hp).join(' | ');
        log('[' + label + '] self=' + d.selfId, line || '(no entities)');
        if (errs.length) log('[' + label + '] PAGE ERRORS:', JSON.stringify(errs.slice(-5)));
      } catch {}
    }
  }, 2000);

  // ---- feed loop ----
  const feed = async (win, frames, label) => {
    const perTick = Math.max(1, Math.round(RATE / 20));
    let i = 0;
    const t0 = Date.now();
    while (i < frames.length) {
      const batch = frames.slice(i, i + perTick);
      for (const f of batch) {
        const r = await win.webContents.executeJavaScript('window.__dsMock.feed(' + JSON.stringify(wirePayload(f)) + ')');
        if (r === 'ok') feedStats[label].ok++;
        else { feedStats[label].err++; if (feedStats[label].err < 10) log('[' + label + '] feed err:', r); }
      }
      i += perTick;
      await sleep(50);
    }
    log('[' + label + '] fed ' + frames.length + ' frames in ' + Math.round((Date.now() - t0) / 1000) + 's');
  };
  await Promise.all([feed(A, feedA, 'A'), feed(B, feedB, 'B')]);

  log('feed done; settling ' + SETTLE_MS + 'ms');
  await sleep(SETTLE_MS);

  // ---- final capture + summary ----
  clearInterval(pollTimer);
  const finalA = await A.webContents.executeJavaScript('window.__dsDiag.dump()');
  const finalB = await B.webContents.executeJavaScript('window.__dsDiag.dump()');
  const sentA = await A.webContents.executeJavaScript('window.__dsMock.sent.slice(0, 5000)');
  const sentB = await B.webContents.executeJavaScript('window.__dsMock.sent.slice(0, 5000)');
  const mockErrA = await A.webContents.executeJavaScript('window.__dsMock.events || []');
  const mockErrB = await B.webContents.executeJavaScript('window.__dsMock.events || []');

  const summary = {
    session: si,
    fedFrames: { A: feedA.length, B: feedB.length },
    feedOk: { A: feedStats.A.ok, B: feedStats.B.ok },
    feedErr: { A: feedStats.A.err, B: feedStats.B.err },
    pageErrors: { A: pageErrors.A, B: pageErrors.B },
    mockEvents: { A: mockErrA, B: mockErrB },
    c2sCaptured: { A: sentA.length, B: sentB.length },
    final: { A: finalA, B: finalB },
    truth: { A: summarizeTruth(truthA), B: summarizeTruth(truthB) },
  };
  fs.mkdirSync(path.dirname(DUMP_PATH), { recursive: true });
  fs.writeFileSync(DUMP_PATH, JSON.stringify(summary, null, 2));
  printSummary(summary, log);
  log('dump written to', DUMP_PATH);

  cleanup();
  app.exit(0);

  // ---- helpers ------------------------------------------------------------
  function makeWindow(label) {
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      show: true,
      webPreferences: { backgroundThrottling: false },
    });
    win.webContents.on('console-message', (...args) => {
      let level = 'log', message = String(args[0]);
      if (args[0] && typeof args[0] === 'object' && 'message' in args[0]) { level = args[0].level; message = String(args[0].message); }
      else if (args.length >= 2) { level = args[0]; message = String(args[1]); }
      if (level === 'error' || level === 'warning' || level === 3 || level === 2) {
        if (pageErrors[label].length < 100) pageErrors[label].push('[' + level + '] ' + message.slice(0, 300));
        log('[' + label + '] console:', message.slice(0, 300));
      }
    });
    win.webContents.on('did-fail-load', (_e, code, desc) => {
      log('[' + label + '] did-fail-load', code, desc);
    });
    win.webContents.on('render-process-gone', (_e, det) => {
      log('[' + label + '] renderer gone', det.reason);
    });
    win.loadURL('http://127.0.0.1:' + PORT + '/');
    return win;
  }
}

function summarizeTruth(msgs) {
  const self = (msgs.find((m) => m.msgId === 3) || {}).fields;
  const players = {};
  const events = [];
  let last2 = null;
  for (const m of msgs) {
    const f = m.fields || {};
    if (m.msgId === 2) {
      const id = f.tdkZouYda;
      const key = id + ':' + f.hkhrYayXI + ':' + f.YSmEAVINAh;
      if (players[id] === undefined || players[id].key !== key) {
        players[id] = { key, hp: f.hkhrYayXI, anim: f.YSmEAVINAh, x: f.JoHdvmpcMvL, y: f.uBHZYKAHa, z: f.yxEKoSFAg, count: (players[id] ? players[id].count : 0) + 1 };
      } else players[id].count++;
    } else if (m.msgId === 25) events.push('KILL ' + f.WJxrwBXgp + '->' + f.PacKJQHkQ + (f.KiQwnWACHo ? ' HEAD' : ''));
    else if (m.msgId === 20) events.push('DEATH ' + f.id);
    else if (m.msgId === 7) events.push('DESPAWN ' + f.tdkZouYda);
  }
  return { self: self ? self.tdkZouYda : null, players, events, last2 };
}

function printSummary(s, log) {
  const ent = (d, name) => {
    log('\n=== ' + name + ' (selfId=' + d.selfId + ') ===');
    const t = s.truth[name === 'A' ? 'A' : 'B'];
    const list = (d.v3 || []).map((e) => {
      const tr = t.players[e.id];
      const d3 = (d.v3d || []).find((x) => x.id === e.id);
      const fade = d3 && d3.fadeObj ? ' fade=' + d3.fadeObj.opacity + '->' + d3.fadeObj.target : '';
      const anim = d3 ? ' anim=' + d3.anim : '';
      const hpMatch = tr ? (tr.hp === e.hp ? 'HP-OK' : 'hp real=' + tr.hp) : 'no-ground-truth';
      return '  id=' + e.id + ' visible=' + e.visible + ' pos={' + (e.pos ? e.pos.x + ',' + e.pos.y : '-') + '}' + anim + fade + ' hp=' + e.hp + ' (' + hpMatch + ')';
    });
    log(list.join('\n') || '  (no entities)');
  };
  ent(s.final.A, 'WINDOW A');
  ent(s.final.B, 'WINDOW B');
  log('\nground truth events A: ' + (s.truth.A.events.join(' | ') || '(none)'));
  log('ground truth events B: ' + (s.truth.B.events.join(' | ') || '(none)'));
  log('feed: A ok=' + s.feedOk.A + ' err=' + s.feedErr.A + ' | B ok=' + s.feedOk.B + ' err=' + s.feedErr.B);
  log('C->S captured: A=' + s.c2sCaptured.A + ' B=' + s.c2sCaptured.B);
  log('mock events: A=' + JSON.stringify(s.mockEvents.A) + ' B=' + JSON.stringify(s.mockEvents.B));
  log('page errors: A=' + JSON.stringify(s.pageErrors.A) + ' B=' + JSON.stringify(s.pageErrors.B));
}

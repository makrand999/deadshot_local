// tools/electron-two.mjs — Electron two-window test harness for the invisible-enemy
// diagnosis. Dual-mode:
//   * `node tools/electron-two.mjs`            -> CLI wrapper (spawns the electron binary)
//   * `electron tools/electron-two.mjs`        -> the actual harness (main process)
//
// It spawns the gameplay server itself, opens two 1280x800 windows on
// http://127.0.0.1:8080/, drives a private-party match (A creates, B joins,
// both ready, both pick class AR), waits ~8s, then dumps __dsDiag.dump() from
// both windows to /tmp/opencode/electron-dump.json and stdout.
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DUMP_PATH = '/tmp/opencode/electron-dump.json';
const SERVER_LOG_PATH = '/tmp/opencode/electron-server.log';
const SESSION_LOG_PATH = '/tmp/opencode/electron-session.log';
const WIN_A_LOG_PATH = '/tmp/opencode/electron-windowA.log';
const WIN_B_LOG_PATH = '/tmp/opencode/electron-windowB.log';
const PORT = 8080;

// ---------------------------------------------------------------------------
// CLI wrapper mode (plain node): exec the electron binary with this same file.
// ---------------------------------------------------------------------------
if (!process.versions.electron) {
  const electronPath = require('electron');
  const child = spawn(electronPath, [process.argv[1]], { stdio: 'inherit', env: process.env });
  child.on('exit', (code, signal) => process.exit(code == null ? 0 : code));
  child.on('error', (e) => { console.error('electron spawn failed:', e); process.exit(1); });
} else {
  main().catch((e) => { console.error('[harness] FATAL', e); process.exit(1); });
}

// ---------------------------------------------------------------------------
// Electron main process
// ---------------------------------------------------------------------------
async function main() {
  const { app, BrowserWindow } = require('electron');

  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('no-first-run');
  app.commandLine.appendSwitch('disable-background-timer-throttling');

  fs.mkdirSync('/tmp/opencode', { recursive: true });
  fs.writeFileSync(SESSION_LOG_PATH, '');
  fs.writeFileSync(WIN_A_LOG_PATH, '');
  fs.writeFileSync(WIN_B_LOG_PATH, '');
  fs.writeFileSync(SERVER_LOG_PATH, '');

  const sessionLogStream = fs.createWriteStream(SESSION_LOG_PATH, { flags: 'a' });
  const winALogStream = fs.createWriteStream(WIN_A_LOG_PATH, { flags: 'a' });
  const winBLogStream = fs.createWriteStream(WIN_B_LOG_PATH, { flags: 'a' });

  const consoleLogs = { A: [], B: [] };
  const consoleErrors = { A: [], B: [] };
  let server = null;
  let serverKilled = false;
  let windows = [];

  process.stdout.on('error', (e) => { if (e.code !== 'EPIPE') throw e; });
  process.stderr.on('error', (e) => { if (e.code !== 'EPIPE') throw e; });
  
  const log = (...a) => {
    const ts = '[' + new Date().toISOString().slice(11, 23) + ']';
    const line = ts + ' ' + a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ');
    try { console.log(line); } catch {}
    try { sessionLogStream.write(line + '\n'); } catch {}
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function killServer() {
    if (server) { serverKilled = true; try { server.kill('SIGKILL'); } catch {} server = null; }
  }
  function cleanup() {
    killServer();
    try { for (const w of windows) w.destroy(); } catch {}
    try { sessionLogStream.end(); } catch {}
    try { winALogStream.end(); } catch {}
    try { winBLogStream.end(); } catch {}
  }
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  // Kill any stale gameplay server on the exact command line (never pkill -f).
  try {
    const out = execSync(
      `ps -eo pid=,args= | awk '$0 ~ /node server.src.gameplay-server.mjs/ && !/awk/ && !/grep/ {print $1}'`
    ).toString();
    for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
      try { process.kill(Number(pid), 'SIGKILL'); log('killed stale server', pid); } catch {}
    }
  } catch {}

  const serverLogStream = fs.createWriteStream(SERVER_LOG_PATH, { flags: 'a' });
  let killCount = 0;
  server = spawn('node', ['server/src/gameplay-server.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GP_HITDBG: '1' },
  });
  const onServerData = (chunk) => {
    try { serverLogStream.write(chunk); } catch {}
    const lines = chunk.toString().split('\n');
    for (const l of lines) {
      if (l.includes('combat KILL')) {
        killCount++;
        log(`[KILL EVENT #${killCount}] ${l.trim()}`);
      }
    }
  };
  server.stdout?.on('data', onServerData);
  server.stderr?.on('data', onServerData);
  server.on('exit', (code) => { if (code && !serverKilled) log('server exited', code); });
  server.unref?.();

  await app.whenReady();

  // Wait for the HTTP server to answer.
  await waitHttp();

  windows = [
    makeWindow('A', consoleLogs.A, consoleErrors.A, winALogStream, log),
    makeWindow('B', consoleLogs.B, consoleErrors.B, winBLogStream, log),
  ];
  const [A, B] = windows;

  // 1. Both windows must load the patched bundle.
  await waitJs(A, "window.__dsPosPatch && String(window.__dsPosPatch).indexOf('ok@') === 0", 'A posPatch');
  await waitJs(B, "window.__dsPosPatch && String(window.__dsPosPatch).indexOf('ok@') === 0", 'B posPatch');
  const patchA = await A.webContents.executeJavaScript('window.__dsPosPatch');
  const patchB = await B.webContents.executeJavaScript('window.__dsPosPatch');
  log('patch ok:', patchA, '|', patchB);

  await waitJs(A, 'typeof window.__dsDiag === "object" && typeof window.__dsDiag.create === "function"', 'A __dsDiag bridge');
  await waitJs(B, 'typeof window.__dsDiag === "object" && typeof window.__dsDiag.create === "function"', 'B __dsDiag bridge');
  // 2. The client auto-creates a party in local mode; create() is a fallback
  //    (calling it twice would re-create the room, so only call when absent).
  await waitJs(A, 'window.__dsDiag.party() && window.__dsDiag.party().id', 'A party id', 15000, 1000).catch(async () => {
    const r = await A.webContents.executeJavaScript('window.__dsDiag.create()');
    log('A.create() ->', r);
  });

  // 3. Read the 6-char party code from A.
  const code = await waitJs(A, 'window.__dsDiag.party() && window.__dsDiag.party().id', 'A party id', 25000, 500);
  log('party code:', code);

  // 4. B joins by code.
  await sleep(500);
  log('B.join() ->', await B.webContents.executeJavaScript(
    `window.__dsDiag.join(${JSON.stringify(String(code))})`));

  // 5. Both ready.
  await sleep(500);
  log('A.ready() ->', await A.webContents.executeJavaScript('window.__dsDiag.ready()'));
  await sleep(300);
  log('B.ready() ->', await B.webContents.executeJavaScript('window.__dsDiag.ready()'));

  // 6. Wait for the class-select screen (L3 populated), then pick AR (0).
  //    Keep polling select() until both windows are in-game (p9) or spawned.
  for (let i = 0; i < 40; i++) {
    await A.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.select(0)').catch(() => {});
    await B.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.select(0)').catch(() => {});
    const dumpA = await A.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.dump()').catch(() => ({}));
    const dumpB = await B.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.dump()').catch(() => ({}));
    if (dumpA && dumpA.v3 && dumpA.v3.length >= 1 && dumpB && dumpB.v3 && dumpB.v3.length >= 1) {
      log('both windows in game and see enemy entities');
      break;
    }
    await sleep(1500);
  }

  // 7. Wait for both to have at least one world entity (the enemy), then settle.
  await waitJs(A, 'window.__dsDiag.dump().v3 && window.__dsDiag.dump().v3.length >= 1', 'A enemy entity', 60000, 2000);
  await waitJs(B, 'window.__dsDiag.dump().v3 && window.__dsDiag.dump().v3.length >= 1', 'B enemy entity', 60000, 2000);
  log('both windows see an enemy entity; testing Gloo Wall deployment');

  // 7.5 Gloo Wall Test: Camera Angle & Surface Snapping
  await sleep(1000);
  log('Testing Gloo Wall deployment for Player A (camera forward)');
  const glooResA = await A.webContents.executeJavaScript('window.__dsDiag.deployGloo()');
  log('A.deployGloo() ->', glooResA);
  await sleep(1000);

  log('Testing Gloo Wall deployment for Player B');
  const glooResB = await B.webContents.executeJavaScript('window.__dsDiag.deployGloo()');
  log('B.deployGloo() ->', glooResB);
  await sleep(1000);

  const glooWallsA = await A.webContents.executeJavaScript('window.__dsDiag.getGlooWalls()');
  const glooWallsB = await B.webContents.executeJavaScript('window.__dsDiag.getGlooWalls()');
  log('Gloo Walls in Window A:', JSON.stringify(glooWallsA));
  log('Gloo Walls in Window B:', JSON.stringify(glooWallsB));

  const targetKills = Number(process.env.DS_KILLS || 5);
  const maxSettleSec = Number(process.env.DS_TIME || process.env.GP_DURATION || 120);
  log(`listening for ${targetKills} kills (or max ${maxSettleSec}s) with periodic state polling...`);
  const settleEnd = Date.now() + maxSettleSec * 1000;
  while (Date.now() < settleEnd) {
    await sleep(2000);
    const dObjA = await A.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.dump()').catch(() => ({}));
    const dObjB = await B.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.dump()').catch(() => ({}));
    const aHp = dObjA?.v3?.[0]?.hp;
    const bHp = dObjB?.v3?.[0]?.hp;
    const aPos = dObjA?.v3?.[0]?.pos;
    const bPos = dObjB?.v3?.[0]?.pos;
    const aVis = dObjA?.v3?.[0]?.visible;
    const bVis = dObjB?.v3?.[0]?.visible;
    log(`[POLL | Kills: ${killCount}/${targetKills}] A sees enemy@(${aPos?.x !== undefined ? aPos.x.toFixed(1) : '-'}, ${aPos?.z !== undefined ? aPos.z.toFixed(1) : '-'}) hp=${aHp ?? '-'} vis=${aVis} | B sees enemy@(${bPos?.x !== undefined ? bPos.x.toFixed(1) : '-'}, ${bPos?.z !== undefined ? bPos.z.toFixed(1) : '-'}) hp=${bHp ?? '-'} vis=${bVis}`);
    if (killCount >= targetKills) {
      log(`Reached target ${targetKills} overall kills! Waiting 3s to capture final state...`);
      await sleep(3000);
      break;
    }
  }

  // 8. Collect page errors & final diagnostic dumps.
  const pageErrorsA = await A.webContents.executeJavaScript('window.__dsErrors || []').catch(() => []);
  const pageErrorsB = await B.webContents.executeJavaScript('window.__dsErrors || []').catch(() => []);
  const dumpA = await A.webContents.executeJavaScript('window.__dsDiag.dump()').catch(() => ({}));
  const dumpB = await B.webContents.executeJavaScript('window.__dsDiag.dump()').catch(() => ({}));

  const result = {
    capturedAt: new Date().toISOString(),
    partyCode: code,
    patchA,
    patchB,
    pageErrors: { A: pageErrorsA, B: pageErrorsB },
    consoleErrors: { A: consoleErrors.A, B: consoleErrors.B },
    consoleLogsCount: { A: consoleLogs.A.length, B: consoleLogs.B.length },
    A: dumpA,
    B: dumpB,
    glooWalls: { A: glooWallsA, B: glooWallsB },
    logsSaved: {
      sessionLog: SESSION_LOG_PATH,
      windowALog: WIN_A_LOG_PATH,
      windowBLog: WIN_B_LOG_PATH,
      serverLog: SERVER_LOG_PATH,
      dumpJson: DUMP_PATH,
    },
  };
  fs.writeFileSync(DUMP_PATH, JSON.stringify(result, null, 2));
  log('diagnostic state dumped to', DUMP_PATH);
  log('session log saved to', SESSION_LOG_PATH);
  log('window A logs saved to', WIN_A_LOG_PATH);
  log('window B logs saved to', WIN_B_LOG_PATH);
  log('server logs saved to', SERVER_LOG_PATH);

  // 9. Human-readable summary on stdout.
  printSummary(dumpA, dumpB, patchA, patchB, consoleErrors, pageErrorsA, pageErrorsB);

  cleanup();
  app.exit(0);

  // ---- helpers ------------------------------------------------------------
  function makeWindow(label, logsArr, errArr, fileStream, log) {
    const showDevTools = Boolean(process.env.DS_DEVTOOLS === '1');
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      show: true,
      webPreferences: { backgroundThrottling: false, devTools: true },
    });
    if (showDevTools) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
    win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        win.webContents.toggleDevTools();
      }
    });
    win.webContents.on('console-message', (...args) => {
      let level = 'log', message = String(args[0]);
      if (args[0] && typeof args[0] === 'object' && 'message' in args[0]) {
        level = args[0].level;
        message = String(args[0].message);
      } else if (args.length >= 2) {
        level = args[0];
        message = String(args[1]);
      }
      const entry = `[${level}] ${message}`;
      logsArr.push(entry);
      try { fileStream.write(`[${new Date().toISOString().slice(11, 23)}] ${entry}\n`); } catch {}

      if (level === 'error' || level === 'warning' || level === 3 || level === 2) {
        if (errArr.length < 100) errArr.push(entry);
        log('[' + label + '] console:', message);
      }
    });
    win.webContents.on('did-fail-load', (_e, code, desc) => {
      const errStr = `did-fail-load ${code} ${desc}`;
      log('[' + label + ']', errStr);
      errArr.push(errStr);
      try { fileStream.write(`[${new Date().toISOString().slice(11, 23)}] [ERROR] ${errStr}\n`); } catch {}
    });
    win.webContents.on('render-process-gone', (_e, det) => {
      const errStr = `render-process-gone ${det.reason}`;
      log('[' + label + ']', errStr);
      errArr.push(errStr);
      try { fileStream.write(`[${new Date().toISOString().slice(11, 23)}] [ERROR] ${errStr}\n`); } catch {}
    });
    win.loadURL('http://127.0.0.1:' + PORT + '/');
    return win;
  }

  async function waitHttp(timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch('http://127.0.0.1:' + PORT + '/');
        if (res.ok) return;
      } catch {}
      await sleep(1000);
    }
    throw new Error('server did not come up on :' + PORT);
  }

  async function waitJs(win, expr, label, timeoutMs = 60000, intervalMs = 2000) {
    const start = Date.now();
    let last;
    while (Date.now() - start < timeoutMs) {
      try {
        last = await win.webContents.executeJavaScript('(' + expr + ')');
        if (last) return last;
      } catch (e) { last = String(e); }
      await sleep(intervalMs);
    }
    throw new Error('timeout waiting for ' + label + ' (last=' + last + ')');
  }
}

function printSummary(dumpA, dumpB, patchA, patchB, errs, pageErrsA, pageErrsB) {
  const line = (d, name) => {
    console.log(`\n=== ${name} (selfId=${d.selfId}, p9=${d.p9}) ===`);
    const list = (d.v3 || []).map((e) => {
      const d3 = (d.v3d || []).find((x) => x.id === e.id);
      return `  enemy id=${e.id} model=${e.model} visible=${e.visible} pos={x:${e.pos && e.pos.x},y:${e.pos && e.pos.y},z:${e.pos && e.pos.z}} hp=${e.hp}` +
        ` | anim=${d3 && d3.anim} fadeObj={opacity:${d3 && d3.fadeObj && d3.fadeObj.opacity},target:${d3 && d3.fadeObj && d3.fadeObj.target}}` +
        ` modelFade=${d3 && d3.modelFade} bodyFade=${d3 && d3.bodyFade} pxxm=${d3 && d3.pxxm}`;
    });
    console.log(list.join('\n') || '  (no entities)');
  };
  line(dumpA, 'WINDOW A');
  line(dumpB, 'WINDOW B');
  console.log('\nconsole errors: A=', JSON.stringify(errs.A), ' B=', JSON.stringify(errs.B));
  console.log('page errors (__dsErrors): A=', JSON.stringify(pageErrsA), ' B=', JSON.stringify(pageErrsB));
}


// tools/electron-two-manual.mjs — long-lived two-window session for manual
// testing. Same shape as electron-two.mjs but does NOT drive the flow or exit:
// it spawns the gameplay server, opens two 1280x800 windows on
// http://127.0.0.1:8080/, surfaces console output, and stays alive until both
// windows are closed (then kills the server and exits).
//   * `node tools/electron-two-manual.mjs`   -> CLI wrapper
//   * `electron tools/electron-two-manual.mjs` -> main process
// Env: GP_ALLOC_TTL=0 disables the match-allocation expiry (long sessions).
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOG_PATH = '/tmp/opencode/electron-manual-server.log';
const PORT = 8080;

if (!process.versions.electron) {
  const electronPath = require('electron');
  const child = spawn(electronPath, [process.argv[1]], { stdio: 'inherit' });
  child.on('exit', (code, signal) => process.exit(code == null ? 0 : code));
  child.on('error', (e) => { console.error('electron spawn failed:', e); process.exit(1); });
} else {
  main().catch((e) => { console.error('[manual] FATAL', e); process.exit(1); });
}

async function main() {
  const { app, BrowserWindow } = require('electron');

  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('no-first-run');
  app.commandLine.appendSwitch('disable-background-timer-throttling');

  let server = null;
  let serverKilled = false;
  let windows = [];

  // EPIPE-proof: if the stdout pipe closes (e.g. `| head`), don't let the crash
  // skip cleanup and orphan the server.
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
      `ps -eo pid=,args= | awk '$0 ~ /node server.src.gameplay-server.mjs/ && !/awk/ && !/grep/ {print $1}'`
    ).toString();
    for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
      try { process.kill(Number(pid), 'SIGKILL'); log('killed stale server', pid); } catch {}
    }
  } catch {}

  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, '');
  const outLog = fs.openSync(LOG_PATH, 'a');
  server = spawn('node', ['server/src/gameplay-server.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', outLog, outLog],
    env: { ...process.env, GP_ALLOC_TTL: '0', GP_MATCH_TIME: '3600' },
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
  log('server up on :' + PORT + ' (server log: ' + LOG_PATH + ')');
  log('close both windows to exit');

  windows = [makeWindow('A'), makeWindow('B')];
  const [A, B] = windows;

  for (const [label, win] of [['A', A], ['B', B]]) {
    const t0 = Date.now();
    for (;;) {
      let ok = false;
      try {
        const v = await win.webContents.executeJavaScript('window.__dsPosPatch');
        ok = v && String(v).indexOf('ok@') === 0;
      } catch {}
      if (ok) { log('[' + label + '] patch ok, game booted'); break; }
      if (Date.now() - t0 > 90000) { log('[' + label + '] WARN: no posPatch after 90s'); break; }
      await sleep(2000);
    }
  }

  const pollDump = setInterval(async () => {
    for (const [label, win] of [['A', A], ['B', B]]) {
      try {
        const d = await win.webContents.executeJavaScript('window.__dsDiag.dump()');
        const v3dMap = new Map((d.v3d || []).map((x) => [x.id, x.anim]));
        const wpns = (d.weapons || []).map((w) => 'w' + w[0] + '=' + w[1]).join(' ');
        const line = (d.v3 || []).map((e) => 'id' + e.id + ' v' + (e.visible ? 1 : 0) + ' m' + (e.model ? 1 : 0) + ' anim=' + (v3dMap.get(e.id) ?? '-') + ' p(' + (e.pos ? e.pos.x : '-') + ',' + (e.pos ? e.pos.y : '-') + ',' + (e.pos ? e.pos.z : '-') + ') h' + e.hp).join(' | ');
        log('[' + label + '] self=' + d.selfId + ' gloo=' + (d.glooMode ? (d.glooValid === null ? 'ON' : (d.glooValid ? 'ON/blue' : 'ON/hidden')) : 'off') + (d.glooHow ? '(' + d.glooHow + ')' : '') + ' dbg=' + (d.glooDbg ? ('er' + (d.glooDbg.erRan ? 1 : 0) + ' n' + d.glooDbg.n + ' min' + d.glooDbg.min + ' g' + (d.glooDbg.g ?? '-') + (d.glooDbg.err ? ' ERR:' + String(d.glooDbg.err).slice(0, 40) : '')) : '-') + (wpns ? ' [' + wpns + ']' : ''), line || '(no entities)');
        let errs = [];
        try { errs = await win.webContents.executeJavaScript('window.__dsErrors || []'); } catch {}
        if (errs.length) log('[' + label + '] PAGE ERRORS:', JSON.stringify(errs.slice(-5)));
      } catch {}
    }
  }, 2000);

  app.on('window-all-closed', () => {
    clearInterval(pollDump);
    log('all windows closed, exiting');
    cleanup();
    app.exit(0);
  });

  function makeWindow(label) {
    const isDebug = Boolean(process.env.DEBUG || process.env.DS_DEBUG || process.env.DEVTOOLS);
    const win = new BrowserWindow({
      width: 1280,
      height: 800,
      show: true,
      webPreferences: { backgroundThrottling: false, devTools: true },
    });
    if (isDebug) {
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
      if (isDebug || level === 'error' || level === 'warning' || level === 3 || level === 2) {
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

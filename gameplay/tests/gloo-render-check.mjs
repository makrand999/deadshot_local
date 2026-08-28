// gameplay/tests/gloo-render-check.mjs
// Diagnostic script to verify Gloo Wall 3D scene insertion, camera alignment, and coordinates.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

import { startGameplayServer } from '../server/src/gameplay-server.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = 8080;

if (!process.versions.electron) {
  const electronPath = require('electron');
  const child = spawn(electronPath, [process.argv[1]], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  main().catch((e) => { console.error('[render-check] FATAL', e); process.exit(1); });
}

async function main() {
  await startGameplayServer({ httpPort: PORT, mmPort: 8081 });
  const { app, BrowserWindow } = require('electron');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('no-first-run');

  await app.whenReady();
  const win = new BrowserWindow({ width: 1280, height: 800, show: false });

  win.webContents.on('console-message', (e) => {
    console.log('[browser console]', e.message);
  });

  await win.loadURL('http://127.0.0.1:' + PORT + '/');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(4000);

  // 1. Create party & ready up
  await win.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.create()');
  await sleep(1000);
  await win.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.ready()');
  await sleep(2000);

  // 2. Select class 0 (AR)
  for (let i = 0; i < 30; i++) {
    const sel = await win.webContents.executeJavaScript("window.__dsDiag && window.__dsDiag.select(0) === 'ok' ? 'ok' : null");
    if (sel === 'ok') break;
    await sleep(500);
  }
  await sleep(2000);

  // 3. Deploy Gloo Wall
  const deployRes = await win.webContents.executeJavaScript('window.__dsDiag && window.__dsDiag.deployGloo()');
  console.log('deployGloo result:', deployRes);
  await sleep(1000);

  // Inspect Gloo Wall in Three.js scene
  const inspect = await win.webContents.executeJavaScript(`(function(){
    var out = {};
    try {
      out.hasHandle = typeof window.__dsHandleGlooNet;
      out.hasScene = typeof window.__dsWorldScene;
      out.hasThree = typeof window.__dsTHREE;
      out.hasTm = typeof Tm;
      out.hasUsv = typeof usvzFuAsEB;
      if (window.__dsHandleGlooNet) {
        window.__dsHandleGlooNet('__gloo:spawn:99:0:10:0:10:0:400');
        out.glooList = window.__dsGlooList;
        out.glooMeshCount = window.__dsGlooMeshes ? window.__dsGlooMeshes.size : 0;
        var m = window.__dsGlooMeshes && window.__dsGlooMeshes.get(99);
        if (m) {
          out.testMeshPos = { x: m.position.x, y: m.position.y, z: m.position.z };
          out.testMeshParent = !!m.parent;
          out.testMeshVisible = m.visible;
        }
      }
      if (typeof SW !== 'undefined' && SW && SW.position) {
        out.playerPos = { x: SW.position.x, y: SW.position.y, z: SW.position.z };
      }
      if (typeof Tm !== 'undefined' && Tm) {
        out.sceneChildren = Tm.children.length;
      }
    } catch(e) {
      out.error = String(e);
    }
    return out;
  })()`);

  console.log('--- 3D Scene Inspection ---');
  console.log(JSON.stringify(inspect, null, 2));

  app.exit(0);
}

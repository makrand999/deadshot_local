// Deadshot LAN — Electron main process.
// Embeds the private server (login/matchmaker/game socket), serves the game
// locally with the decrypted-bundle runtime (no crypto, no attest, no
// internet), and stubs every external host the client would phone home to.
import { app, BrowserWindow, session, Menu, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;
const ROOT = path.resolve(__dirname, '..');

// resource locations (repo paths in dev, extraResources when packaged)
const clientDir = isDev ? path.join(ROOT, 'client') : path.join(process.resourcesPath, 'client');
const rawDir = isDev ? path.join(ROOT, 'raw') : path.join(process.resourcesPath, 'raw');
const logDir = path.join(app.getPath('userData'), 'server-capture');
const serverDir = isDev
  ? (fs.existsSync(path.join(ROOT, 'gameplay', 'server', 'src', 'gameplay-server.mjs'))
      ? path.join(ROOT, 'gameplay', 'server', 'src')
      : path.join(__dirname, 'embedded-server'))
  : path.join(process.resourcesPath, 'server');
const remoteUrl = process.env.DS_SERVER_URL || '';
const useEmbeddedServer = !remoteUrl;

let startServer = null;
if (useEmbeddedServer) {
  const gpFile = path.join(serverDir, 'gameplay-server.mjs');
  const idxFile = path.join(serverDir, 'index.mjs');
  const targetFile = fs.existsSync(gpFile) ? gpFile : idxFile;
  const mod = await import(pathToFileURL(targetFile).href);
  startServer = mod.startGameplayServer || mod.startServer;
}

const PAGE_URL = remoteUrl || 'http://127.0.0.1:8080/';
const SERVER_ORIGIN = new URL(PAGE_URL).origin;
let serverHandle = null;
let win = null;

function stubExternalHosts() {
  const filter = {
    urls: [
      'https://matchmaking.deadshot.io/*',
      'https://error.deadshot.io/*',
      'https://login.deadshot.io/*',
      'https://party.deadshot.io/*',
    ],
  };
  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    let target = SERVER_ORIGIN + '/stub/error';
    if (details.url.includes('matchmaking.deadshot.io')) target = SERVER_ORIGIN + '/stub/attest';
    console.log('[stub]', details.url, '->', target);
    callback({ redirectURL: target });
  });
}

function buildMenu() {
  const template = [
    {
      label: 'Game',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
        { label: 'Toggle DevTools', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function main() {
  await app.whenReady();
  stubExternalHosts();
  buildMenu();

  if (useEmbeddedServer) {
    try {
      serverHandle = await startServer({
        httpPort: 8080,
        mmPort: 8081,
        loginPort: 8082,
        bindHost: '0.0.0.0',
        localPkg: true,
        autoLogin: true,
        clientDir,
        rawDir,
        logDir,
        name: 'Deadshot LAN (embedded server)',
      });
    } catch (e) {
      dialog.showErrorBox('Deadshot LAN', 'Could not start the local server:\n' + e.message + '\n\nIs port 8080/8081/8082 already in use?');
      app.quit();
      return;
    }
  } else {
    console.log('[client-only] loading shared server at', PAGE_URL);
  }

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    title: 'Deadshot LAN',
    show: !process.env.DS_HIDDEN,
  });
  win.setMenuBarVisibility(false);
  win.loadURL(PAGE_URL);
  win.on('closed', () => { win = null; });

  if (process.env.DS_SHOT) {
    setTimeout(async () => {
      try {
        const img = await win.capturePage();
        fs.writeFileSync(process.env.DS_SHOT, img.toPNG());
        console.log('[shot] saved', process.env.DS_SHOT);
      } catch (e) { console.error('[shot] failed:', e.message); }
      app.quit();
    }, 25000);
  }

  app.on('window-all-closed', () => {
    app.quit();
  });
}

app.on('before-quit', () => {
  if (serverHandle) { try { serverHandle.close(); } catch (e) { /* ignore */ } }
});

main().catch((e) => {
  console.error('FATAL:', e);
  dialog.showErrorBox('Deadshot LAN', 'Fatal error:\n' + (e && e.message ? e.message : e));
  app.quit();
});

// Launch headless Chrome with a fresh profile and verify CDP works.
// Uses a temp user-data-dir + --no-sandbox for Windows headless reliability.
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9230;
const profile = path.join(os.tmpdir(), 'ds-cdp-' + Date.now());

const p = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=' + PORT,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-extensions',
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let out = '';
p.stdout.on('data', (d) => { out += d.toString(); });
p.stderr.on('data', (d) => { out += d.toString(); });

function check(tries) {
  http.get('http://127.0.0.1:' + PORT + '/json/version', (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => {
      console.log('CDP OK:', d.slice(0, 200));
      p.kill();
      process.exit(0);
    });
  }).on('error', () => {
    if (tries > 0) setTimeout(() => check(tries - 1), 1000);
    else { console.log('CDP FAIL. Output was:\n' + out.slice(0, 1500)); p.kill(); process.exit(1); }
  });
}
check(10);

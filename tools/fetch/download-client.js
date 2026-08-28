// Phase 1.1 — Download the deadshot.io client (page + referenced assets) to ./client
// so the game can be served locally without internet.
//
// Usage: node tools/download-client.js
//
// This mirrors what a browser loads. It does NOT execute any of the client's code.

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const BASE = 'https://deadshot.io/';
const OUT = path.join(__dirname, '..', '..', 'client');
const MAX_BYTES = 20 * 1024 * 1024; // 20MB per file safety cap

const REFS = [
  // <script src>, <link href>, img/favicon etc. — filled in after parsing index.html
];

function fetchToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchToFile(new URL(res.headers.location, url).toString(), destPath));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${url} -> HTTP ${res.statusCode}`));
        return;
      }
      const tmp = destPath + '.part';
      const ws = fs.createWriteStream(tmp);
      let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > MAX_BYTES) {
          ws.destroy();
          reject(new Error(`${url} exceeds ${MAX_BYTES} bytes`));
          return;
        }
      });
      res.pipe(ws);
      ws.on('finish', () => {
        ws.close(() => {
          fs.renameSync(tmp, destPath);
          resolve({ url, size, dest: destPath });
        });
      });
      ws.on('error', reject);
    }).on('error', reject);
  });
}

function absoluteRef(base, ref) {
  return new URL(ref, base).toString();
}

function safeName(url) {
  // Turn a URL into a stable relative filename: deadshot.io/css/settings.css -> css/settings.css
  const u = new URL(url);
  let p = u.pathname.replace(/^\//, '');
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log('Fetching', BASE);
  const index = await new Promise((resolve, reject) => {
    https.get(BASE, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error('index HTTP ' + res.statusCode));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  const indexDest = path.join(OUT, 'index.html');
  fs.writeFileSync(indexDest, index);
  console.log(`  saved index.html (${index.length} chars)`);

  // Collect asset references: script src, link href, img src, and url() in inline CSS.
  const refs = new Set();
  for (const m of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(data:|javascript:|mailto:|#)/.test(ref)) continue;
    refs.add(absoluteRef(BASE, ref));
  }
  for (const m of index.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const ref = m[1];
    if (/^(data:|about:)/.test(ref)) continue;
    refs.add(absoluteRef(BASE, ref));
  }

  const seen = new Set();
  const jobs = [];
  for (const url of refs) {
    const name = safeName(url);
    if (seen.has(name)) continue;
    seen.add(name);
    jobs.push({ url, dest: path.join(OUT, name) });
  }

  console.log(`Fetching ${jobs.length} referenced assets...`);
  for (const j of jobs) {
    fs.mkdirSync(path.dirname(j.dest), { recursive: true });
    try {
      const r = await fetchToFile(j.url, j.dest);
      console.log(`  ${r.size.toString().padStart(9)}  ${r.url}`);
    } catch (e) {
      console.log(`  !FAILED    ${j.url} (${e.message})`);
    }
  }

  console.log('Done. Client bundle saved to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

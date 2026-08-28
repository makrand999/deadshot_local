// Fetch all game asset files referenced by the client code from deadshot.io
// (or three.js CDN fallback for the draco/basis decoder files), saving them
// into client/ so the game can run fully offline.
//
// Asset path sources:
//   1. raw/final.pkg.js      — the decrypted game bundle (pristine source)
//   2. raw/VM9.deob.txt      — deobfuscated copy (extra decoded strings)
//   3. raw/capture/responses.json — URLs from the live capture session
//
// Usage: node tools/fetch-assets.js [--dry-run]
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..', '..');
const CLIENT = path.join(ROOT, 'client');
const BASE = 'https://deadshot.io/';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const CONCURRENCY = 4;
const TIMEOUT = 20000;

const EXT_RE = /\.(png|jpe?g|webp|gif|glb|gltf|json|wasm|js|mp3|ogg|wav|woff2?|ttf|css)$/i;

// known directories under the site root that hold game assets
const DIRS = new Set([
  'textures', 'weapons', 'audio', 'fonts', 'maps', 'promo', 'mobile',
  'edskins', 'atedskins', 'experiments', 'compressedTextures', 'draco',
  'character', 'models', 'skybox', 'css', 'libs', 'js', 'sound', 'sounds',
]);

// library/code strings that look like files but are not assets
const SKIP = new Set([
  'three.js', 'typeface.js', 'liteGL.js', 'litegl.js', 'mes-sdk-v2.js',
  'index.js', 'widget.min.js', 'beacon.min.js', 'gsi/client',
]);

// files always needed (decoder libs + favicon), even if not referenced literally
const ALWAYS = [
  'favicon.png',
  'draco/draco_decoder.js',
  'draco/draco_wasm_wrapper.js',
  'draco/draco_decoder.wasm',
  'draco/basis_transcoder.js',
  'draco/basis_transcoder.wasm',
];

// three.js r124 upstream (used only if deadshot.io is unreachable for these)
const THREE_FALLBACKS = {
  'draco/draco_decoder.js': 'https://unpkg.com/three@0.124.0/examples/jsm/libs/draco/draco_decoder.js',
  'draco/draco_wasm_wrapper.js': 'https://unpkg.com/three@0.124.0/examples/jsm/libs/draco/draco_wasm_wrapper.js',
  'draco/draco_decoder.wasm': 'https://unpkg.com/three@0.124.0/examples/jsm/libs/draco/draco_decoder.wasm',
  'draco/basis_transcoder.js': 'https://unpkg.com/three@0.124.0/examples/jsm/libs/basis/basis_transcoder.js',
  'draco/basis_transcoder.wasm': 'https://unpkg.com/three@0.124.0/examples/jsm/libs/basis/basis_transcoder.wasm',
};

const dryRun = process.argv.includes('--dry-run');

function extractPaths(text) {
  const out = new Set();
  const re = /([A-Za-z0-9_~!()\-%.+@ ]+\/(?:[A-Za-z0-9_~!()\-%.+@ ]+\/)*[A-Za-z0-9_~!()\-%.+@ ]+\.(?:png|jpe?g|webp|gif|glb|gltf|json|wasm|js|mp3|ogg|wav|woff2?|ttf|css))/gi;
  // first pass: paths with a directory part
  let m;
  while ((m = re.exec(text))) {
    const p = m[1].replace(/^\.?\//, '').trim();
    if (p && p.length > 2 && !p.includes('..')) out.add(p);
  }
  // second pass: root-level files (no slash) but only when the full token
  // looks like a filename (len >= 5) to avoid string-fragment noise
  const re2 = /['"\s(]([A-Za-z0-9_~!()\-%.+@]{5,}\.(?:png|jpe?g|webp|gif|glb|gltf|json|wasm|js|mp3|ogg|wav|woff2?|ttf|css))/gi;
  while ((m = re2.exec(text))) {
    const p = m[1].trim();
    if (!/^[a-z0-9_]{1,3}$/i.test(path.basename(p).split('.')[0]) || p.length >= 8) out.add(p);
  }
  return out;
}

function collect() {
  const paths = new Set(ALWAYS);
  const sources = [];
  for (const f of ['raw/bundles/final.pkg.js', 'raw/bundles/VM9.deob.txt']) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) sources.push(fs.readFileSync(p, 'ascii'));
  }
  const cap = path.join(ROOT, 'raw/capture/responses.json');
  if (fs.existsSync(cap)) {
    try {
      const j = JSON.parse(fs.readFileSync(cap, 'utf8'));
      for (const u of j) {
        if (!u.url) continue;
        let p;
        try { p = new URL(u.url); } catch { continue; }
        if (p.hostname.endsWith('deadshot.io')) {
          const rel = decodeURIComponent(p.pathname).replace(/^\//, '');
          if (EXT_RE.test(rel)) paths.add(rel);
        }
      }
    } catch { /* ignore */ }
  }
  for (const s of sources) for (const p of extractPaths(s)) paths.add(p);
  return paths;
}

function normalize(p) {
  // strip query/hash, leading slashes, ./ prefixes; keep %20 style escapes decoded
  let segs;
  try {
    segs = p.split('?')[0].split('#')[0].replace(/^\/+/, '').split('/');
    segs = segs.map((s) => decodeURIComponent(s));
  } catch {
    return null; // undecodable (code fragment)
  }
  if (segs.some((s) => /[^A-Za-z0-9_~!()\-%.+@ ]/.test(s))) return null;
  const norm = segs.join('/').replace(/\/+/g, '/');
  if (!EXT_RE.test(norm)) return null;
  if (norm.includes('..')) return null;
  if (/\.io\//.test(norm)) return null; // host names leaked into paths (deadshot.io, vlitag.com, ...)
  if (SKIP.has(norm)) return null;
  const first = norm.split('/')[0].toLowerCase();
  if (!EXT_RE.test(first) && !DIRS.has(first) && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(first)) return null; // foreign host
  return norm;
}

// for root-level files, also try the natural subdirectories
function variants(p) {
  const list = [p];
  const ext = path.extname(p).toLowerCase();
  const name = path.basename(p);
  if (!p.includes('/')) {
    if (['.mp3', '.ogg', '.wav'].includes(ext)) list.push('audio/' + name);
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) list.push('textures/' + name);
    if (['.glb', '.gltf', '.json'].includes(ext)) list.push('models/' + name);
  }
  return list;
}

function haveOnDisk(p) {
  const fp = path.join(CLIENT, p.replace(/%20/g, ' '));
  return fs.existsSync(fp);
}

function fetchBuf(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(fetchBuf(new URL(res.headers.location, url).toString(), timeout));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(new Error('timeout')); });
  });
}

async function fetchOne(url, dest) {
  const buf = await fetchBuf(url);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const raw = collect();
  const paths = new Set();
  for (const p of raw) {
    const n = normalize(p);
    if (!n) continue;
    for (const v of variants(n)) paths.add(v);
  }
  const candidates = [...paths].sort();
  const todo = [];
  for (const p of candidates) {
    if (p === 'final.pkg' || p.startsWith('final.pkg')) continue;
    if (haveOnDisk(p)) continue;
    todo.push(p);
  }
  console.log('referenced:', candidates.length, 'already on disk:', candidates.length - todo.length, 'to fetch:', todo.length);
  if (dryRun) {
    console.log(todo.join('\n'));
    return;
  }

  let ok = 0, fail = 0, idx = 0;
  const report = [];
  async function worker() {
    while (idx < todo.length) {
      const p = todo[idx++];
      const url = BASE + p.split('/').map(encodeURIComponent).join('/');
      const dest = path.join(CLIENT, p);
      try {
        const len = await fetchOne(url, dest);
        ok++;
        report.push('OK   ' + p + ' (' + len + ' B)');
      } catch (e) {
        if (THREE_FALLBACKS[p]) {
          try {
            const len = await fetchOne(THREE_FALLBACKS[p], dest);
            ok++;
            report.push('OK(CDN) ' + p + ' (' + len + ' B)');
            continue;
          } catch { /* fall through */ }
        }
        fail++;
        report.push('FAIL ' + p + ' (' + (e.message || e).slice(0, 40) + ')');
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  report.forEach((r) => console.log(r));
  console.log('\ndone: fetched ' + ok + ', failed ' + fail);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });

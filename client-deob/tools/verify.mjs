// client-deob/tools/verify.mjs — Phase D, step 3 (PLAN §3 Phase D, M2 scope)
//
// L1 exact:  build/vm9.rebuilt.js === raw/bundles/VM9.deob.txt (byte-for-byte)
//            + build/manifest.regen.json total matches M0 measuredVm9Total.
//            Passes only on the UNRENAMED tree (M1 ground truth).
// L2 renamed: canonical token-stream compare of build/vm9.rebuilt.js vs the
//            original modulo data/rename-map.json substitutions — every token
//            pair must be identical, except identifier tokens whose renamed
//            name maps back to the original token via the map. Independent of
//            tools/rename.mjs internals (uses only the map + both texts).
//            Passes on unrenamed trees (empty substitution) and renamed trees.
// L3 behavioral: M4 harness (tools/behavioral.mjs) — B1 L2 gate, B2 AST parity,
//            B3 differential binding parity, B4 execution goldens + vm compile,
//            B5 electron/server probe (SKIP by default; --probe-electron to run).
//            Passes on the renamed tree. See PLAN §3 Phase D + §6.1 scope note
//            (VM9 lineage: differential parity, not cross-lineage WS-frame diff).
//
// SCOPE NOTE: PLAN names this level "build/final.pkg.js == raw/bundles/final.pkg.js",
// but src/ derives from VM9.deob.txt (older lineage per PLAN §6.1), so VM9 is the
// only honest L1/L2 target in M1–M2. See tools/bundle.mjs SCOPE NOTE.
//
// Exit code 0 only when the requested level passes. Prints first divergent offset
// with context on failure. Usage: node tools/verify.mjs [--level L1|L2|L3]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { corpus, readSourceText, readRebuiltCode } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

function firstDivergentByte(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return i;
  }
  return a.length === b.length ? -1 : n;
}

function tokenizeAll(src) {
  const toks = [];
  const tz = acorn.tokenizer(src, { ecmaVersion: 'latest' });
  for (;;) {
    const t = tz.getToken();
    toks.push(t);
    if (t.type === acorn.tokTypes.eof) break;
  }
  return toks;
}

async function verifyL2() {
  const C = corpus();
  const REBUILT_PATH = path.join(C.buildDir, C.rebuiltFile);
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  if (!fs.existsSync(REBUILT_PATH)) {
    throw new Error(`verify L2: ${path.relative(ROOT, REBUILT_PATH)} missing (run node tools/bundle.mjs first)`);
  }
  const map = JSON.parse(fs.readFileSync(C.renameMapPath, 'utf8'));
  const orig = readSourceText();
  const rebuilt = readRebuiltCode();
  if (rebuilt.includes('// __UNIT__')) {
    throw new Error('verify L2: FAILED: rebuilt bundle leaks emit markers');
  }
  // Normalization: new name -> acceptable original tokens. A new name that
  // already occurred in the original (e.g. vendor FileLoader `handlers`) also
  // accepts itself.
  const to = tokenizeAll(orig);
  const tn = tokenizeAll(rebuilt);
  const origNames = new Set();
  for (const t of to) {
    if (t.type === acorn.tokTypes.name) origNames.add(orig.slice(t.start, t.end));
  }
  const norm = new Map(); // newName -> Set(originalToken)
  const addNorm = (e) => {
    if (!norm.has(e.name)) norm.set(e.name, new Set());
    norm.get(e.name).add(e.token);
    if (origNames.has(e.name)) norm.get(e.name).add(e.name);
  };
  for (const token of map.order) {
    const e = map.entries[token];
    if (e.action !== 'rename') continue;
    addNorm(e);
  }
  // Locals map: same pairwise rule (name -> tokens SET, so repeated local
  // names across disjoint bindings are accepted per position).
  const LOCALS_PATH = path.join(path.dirname(C.renameMapPath), 'rename-locals.json');
  if (fs.existsSync(LOCALS_PATH)) {
    const localsMap = JSON.parse(fs.readFileSync(LOCALS_PATH, 'utf8'));
    for (const id of localsMap.order) {
      const e = localsMap.entries[id];
      if (e && e.action === 'rename') addNorm(e);
    }
  }
  if (to.length !== tn.length) {
    throw new Error(`verify L2: FAILED: token count ${tn.length} != original ${to.length}`);
  }
  let normalized = 0;
  for (let i = 0; i < to.length; i++) {
    const a = to[i];
    const b = tn[i];
    if (a.type !== b.type) {
      throw new Error(`verify L2: FAILED at token ${i}: kind ${b.type.label} != ${a.label} near ${JSON.stringify(rebuilt.slice(Math.max(0, b.start - 40), b.start + 40))}`);
    }
    if (a.type === acorn.tokTypes.name) {
      const ao = orig.slice(a.start, a.end);
      const bn = rebuilt.slice(b.start, b.end);
      if (bn === ao) continue;
      const ok = norm.get(bn);
      if (!ok || !ok.has(ao)) {
        throw new Error(`verify L2: FAILED at token ${i}: identifier ${JSON.stringify(bn)} is not a mapped rename of ${JSON.stringify(ao)} near ${JSON.stringify(rebuilt.slice(Math.max(0, b.start - 40), b.start + 40))}`);
      }
      normalized++;
    } else if (orig.slice(a.start, a.end) !== rebuilt.slice(b.start, b.end)) {
      throw new Error(`verify L2: FAILED at token ${i} (${a.type.label}): non-identifier bytes differ near ${JSON.stringify(rebuilt.slice(Math.max(0, b.start - 40), b.start + 40))}`);
    }
  }
  const applied = map.order.filter((t) => map.entries[t].action === 'rename').length;
  console.log(`verify L2: PASS (tokens=${to.length}, renamed-identifier tokens=${normalized}, map rename entries=${applied})`);
  return { level: 'L2', tokens: to.length, normalized, globalEntries: applied };
}

export async function verify(level = 'L1', opts = {}) {
  const C = corpus();
  if (level === 'L2') return verifyL2();
  if (level === 'L3') {
    // Dynamic import: behavioral.mjs statically imports verify.mjs (B1 L2 gate),
    // so a static back-import here would be circular. Deferred resolution is safe
    // (both modules only call each other's functions at runtime).
    const { behavioral } = await import('./behavioral.mjs');
    return behavioral(opts);
  }
  if (level !== 'L1') throw new Error(`verify: unknown level ${JSON.stringify(level)} (want L1|L2|L3)`);

  const REBUILT_PATH = path.join(C.buildDir, C.rebuiltFile);
  const REGEN_PATH = path.join(C.buildDir, C.regenFile);
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  if (!fs.existsSync(REBUILT_PATH)) {
    throw new Error(`verify L1: ${path.relative(ROOT, REBUILT_PATH)} missing (run node tools/bundle.mjs first)`);
  }
  // L1 target: vm9 → rebuilt code == VM9 file; served → rebuilt FULL file ==
  // final.pkg.js (manifest regen + code), byte-for-byte.
  const origBytes = C.name === 'served' ? fs.readFileSync(C.pkgPath) : Buffer.from(readSourceText(), 'utf8');
  const builtBytes = fs.readFileSync(REBUILT_PATH);
  console.log(`verify L1(${C.name}): orig=${origBytes.length} bytes rebuilt=${builtBytes.length} bytes`);
  if (!origBytes.equals(builtBytes)) {
    const off = firstDivergentByte(origBytes, builtBytes);
    const show = (buf, o) => JSON.stringify(buf.slice(Math.max(0, o - 60), o + 60).toString('utf8'));
    throw new Error(
      `verify L1: FAILED at byte ${off} (orig ${origBytes.length} vs rebuilt ${builtBytes.length})\n` +
        `  orig context:    ${show(origBytes, off)}\n` +
        `  rebuilt context: ${show(builtBytes, off)}`
    );
  }

  if (!fs.existsSync(REGEN_PATH)) {
    throw new Error(`verify L1: ${path.relative(ROOT, REGEN_PATH)} missing (run node tools/bundle.mjs first)`);
  }
  const regen = JSON.parse(fs.readFileSync(REGEN_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const expectedTotal = C.name === 'served' ? manifest.meta.measuredPkgTotal : manifest.meta.measuredVm9Total;
  if (regen.meta.total !== expectedTotal) {
    throw new Error(
      `verify L1: regen total ${regen.meta.total} != expected ${expectedTotal}`
    );
  }

  console.log(`verify L1(${C.name}): PASS (byte-exact, ${origBytes.length} bytes; regen total ${regen.meta.total})`);
  return { level, bytes: origBytes.length, regenTotal: regen.meta.total };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  let level = 'L1';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--level' && i + 1 < argv.length) level = argv[++i];
    else if (argv[i].startsWith('--level=')) level = argv[i].split('=')[1];
  }
  const opts = {
    probeElectron: argv.includes('--probe-electron'),
    requireElectron: argv.includes('--require-electron'),
    json: argv.includes('--json'),
  };
  verify(level, opts).catch((err) => {
    console.error(`verify.mjs: ${err && err.message ? err.message : err}`);
    process.exit(1);
  });
}

// client-deob/tools/bundle.mjs — Phase D, step 1 (PLAN §3 Phase D, M1 split-only pass)
//
// Reads:  ../src/**/*.js (fragment files from tools/emit.mjs; src/index.js carries
//         no markers and is naturally ignored) + ../data/units.json (ground truth
//         for ids/ranges) + ../data/manifest.json (symbol order for regen)
// Writes: ../build/vm9.rebuilt.js    — unit bodies concatenated in emission order
//         ../build/manifest.regen.json — manifest regenerated bottom-up by scanning
//         the rebuilt output for every known name (machinery demo for Phase D step 2)
//
// SCOPE NOTE (PLAN §6.1 lineage drift): src/ derives from VM9.deob.txt, which is an
// OLDER lineage than raw/bundles/final.pkg.js (string-decoding + ~55k of drift), so
// no VM9-derived bundle can ever equal final.pkg.js byte-for-byte. M1 L1 is therefore
// defined as build/vm9.rebuilt.js == raw/bundles/VM9.deob.txt. A final.pkg.js-format
// rebuild from VM9 code is deliberately NOT produced (it would be a misleading file).
// Re-running this pipeline on the served build to close the drift is deferred per §6.1.
//
// Rules: deterministic (sorted traversal, no timestamps); fail loudly on any
// id/range/kind/count mismatch or tiling break. Marker len= (CURRENT body
// length, changed by renames) is validated by the fragment parser, not against
// units.json (which records VM9-original lengths).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragmentFile } from './emit.mjs';
import { corpus, emitManifest } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

function findAll(haystack, needle) {
  const out = [];
  if (!needle) return out;
  let idx = 0;
  for (;;) {
    idx = haystack.indexOf(needle, idx);
    if (idx < 0) break;
    out.push(idx);
    idx += needle.length;
    if (idx >= haystack.length) break;
  }
  return out;
}

function collectJsFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.js')) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

export async function bundle() {
  const C = corpus();
  const SRC_DIR = C.srcDir;
  const BUILD_DIR = C.buildDir;
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  const REBUILT_OUT = path.join(BUILD_DIR, C.rebuiltFile);
  const REGEN_OUT = path.join(BUILD_DIR, C.regenFile);
  const { meta, units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const byId = new Map(units.map((u) => [u.id, u]));

  if (!fs.existsSync(SRC_DIR)) throw new Error('bundle: src/ missing (run emit first)');
  const files = collectJsFiles(SRC_DIR);
  if (files.length === 0) throw new Error('bundle: no src/**/*.js files (run emit first)');

  // Collect units from fragments.
  const seen = new Map();
  for (const f of files) {
    const rel = path.relative(SRC_DIR, f).split(path.sep).join('/');
    const text = fs.readFileSync(f, 'utf8');
    for (const u of parseFragmentFile(text, rel)) {
      if (seen.has(u.id)) throw new Error(`bundle: duplicate unit ${u.id} (in ${rel})`);
      const want = byId.get(u.id);
      if (!want) throw new Error(`bundle: unknown unit ${u.id} (in ${rel})`);
      if (u.start !== want.start || u.end !== want.end) {
        throw new Error(`bundle: range mismatch for ${u.id} in ${rel}: got [${u.start},${u.end}) want [${want.start},${want.end})`);
      }
      if (u.kind !== want.kind) throw new Error(`bundle: kind mismatch for ${u.id} in ${rel}`);
      // NOTE: u.len (marker len=, CURRENT body length) is intentionally NOT
      // compared to units.json (VM9-original length): renames change body
      // lengths. parseFragmentFile already validated body against the marker.
      if (rel !== want.module) {
        throw new Error(`bundle: misplaced unit ${u.id}: found in ${rel}, units.json says ${want.module}`);
      }
      seen.set(u.id, u);
    }
  }
  if (seen.size !== units.length) {
    const missing = units.map((u) => u.id).filter((id) => !seen.has(id));
    throw new Error(`bundle: unit count mismatch: got ${seen.size} want ${units.length} (e.g. missing ${missing.slice(0, 5).join(',')})`);
  }

  // Emission order = sorted by start (== units.json order); verify tiling.
  const ordered = [...seen.values()].sort((a, b) => a.start - b.start);
  const totalLen = meta.lengthChars;
  if (ordered[0].start !== 0 || ordered[ordered.length - 1].end !== totalLen) {
    throw new Error('bundle: rebuilt units do not cover [0, len)');
  }
  for (let i = 0; i < ordered.length - 1; i++) {
    if (ordered[i].end !== ordered[i + 1].start) {
      throw new Error(`bundle: tiling break at ${ordered[i].id} -> ${ordered[i + 1].id}`);
    }
  }
  const rebuilt = ordered.map((u) => u.raw).join('');

  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // Served corpus: the rebuilt file is the FULL final.pkg.js format —
  // regenerated manifest text + code bodies. The manifest is emitted from the
  // VALIDATED original hint lists (byte-exact round-trip rule, incl. the 49
  // zero-anchor names); fresh scans cannot reproduce it because hints are
  // escape-shifted occurrence positions (M6 measurement: same counts, shifted
  // bytes). The emit is verified byte-exact against the original manifest
  // block below — the code bodies carry the L1 proof.
  let fileBytes = rebuilt;
  if (C.name === 'served') {
    const hintsByName = new Map(manifest.order.map((n) => [n, manifest.symbols[n].hint]));
    const manifestText = emitManifest(manifest.order, hintsByName);
    const pkgOrig = fs.readFileSync(C.pkgPath, 'utf8');
    const origManifest = pkgOrig.slice(0, manifest.meta.codeStart);
    if (manifestText !== origManifest) {
      throw new Error('bundle(served): manifest regen != original manifest block (emit rule broken?)');
    }
    fileBytes = manifestText + rebuilt;
  }
  fs.writeFileSync(REBUILT_OUT, fileBytes);

  // Bottom-up manifest regen (Phase D step 2 machinery): scan the REBUILT output
  // for every known name in manifest order. vm9 coordinates are absolute char
  // offsets in the rebuilt file (VM9 has no manifest); served coordinates are
  // code-relative (manifest hints are code-relative). The L1 gate compares the
  // regen total against the M0/M6 measured total for the active corpus.
  const regen = {};
  let regenTotal = 0;
  for (const name of manifest.order) {
    const pos = findAll(rebuilt, name);
    regen[name] = pos;
    regenTotal += pos.length;
  }
  const expectedTotal = C.name === 'served' ? manifest.meta.measuredPkgTotal : manifest.meta.measuredVm9Total;
  fs.writeFileSync(
    REGEN_OUT,
    JSON.stringify(
      {
        meta: {
          source: path.relative(ROOT, REBUILT_OUT),
          coordinate: C.name === 'served' ? 'code-relative char offsets in rebuilt code region' : 'absolute char offsets in rebuilt file',
          names: manifest.order.length,
          total: regenTotal,
          expectedTotal,
          generatedBy: `client-deob/tools/bundle.mjs (M1${C.name === 'served' ? '/M6 served' : ''})`,
        },
        order: manifest.order,
        symbols: regen,
      },
      null,
      2
    ) + '\n'
  );
  if (regenTotal !== expectedTotal) {
    // Expected on renamed trees (old-token occurrences drop by design); the
    // hard gate lives in `verify --level L1`, which only passes unrenamed.
    console.warn(
      `bundle(${C.name}): note: regen total ${regenTotal} != expected ${expectedTotal} (renamed tree or drift?)`
    );
  }

  console.log(`bundle(${C.name}): fragments=${files.length} units=${ordered.length} rebuilt=${fileBytes.length} chars -> ${path.relative(ROOT, REBUILT_OUT)}`);
  console.log(`bundle(${C.name}): manifest regen names=${manifest.order.length} total=${regenTotal} -> ${path.relative(ROOT, REGEN_OUT)}`);
  return { files: files.length, count: ordered.length, length: fileBytes.length, regenTotal };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bundle().catch((err) => {
    console.error(`bundle.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

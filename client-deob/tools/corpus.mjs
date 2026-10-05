// client-deob/tools/corpus.mjs — corpus selector (M6): 'vm9' (default, M0–M5)
// vs 'served' (M6, raw/bundles/final.pkg.js lineage — the file the live server
// ships). Selected via DS_CORPUS env (default 'vm9'). Read lazily via corpus()
// (never at module top level) so tests can set process.env.DS_CORPUS before use.
//
// Layout: vm9 outputs live in data/ src/ build/ (unchanged M0–M5 paths);
// served outputs live in served/data/ served/src/ served/build/ (isolated —
// the vm9 pipeline and its tests keep passing untouched). The rename map stays
// canonical at data/rename-map.json and is shared (tokens are lineage-stable;
// evidence offsets reference VM9).
//
// Served source text = final.pkg.js sliced at CODE_ANCHOR (manifest stripped;
// units tile the code region, offsets are code-relative). The rebuilt served
// file = regenerated manifest text + code bodies, compared full-file vs
// final.pkg.js. Manifest hints are code-relative occurrence positions shifted
// by string-escape processing (measured M6: same counts, shifted bytes), so
// regen emits the VALIDATED original hint lists (parse→emit round-trip proven
// byte-exact incl. 49 zero-anchor names), never fresh scans.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEOB_DIR = path.resolve(TOOLS_DIR, '..');
const ROOT = path.resolve(DEOB_DIR, '..');

export const CODE_ANCHOR = ';var battle_royale_enabled=false;';

export function corpus() {
  const name = process.env.DS_CORPUS || 'vm9';
  if (name !== 'vm9' && name !== 'served') {
    throw new Error(`corpus: unknown DS_CORPUS=${JSON.stringify(name)} (want vm9|served)`);
  }
  const shared = {
    name,
    root: ROOT,
    deobDir: DEOB_DIR,
    codeAnchor: CODE_ANCHOR,
    pkgPath: path.join(ROOT, 'raw', 'bundles', 'final.pkg.js'),
    gzPath: path.join(ROOT, 'raw', 'bundles', 'final.pkg.gz'),
    pagePath: path.join(ROOT, 'gameplay', 'client', 'index.html'),
    serverPath: path.join(ROOT, 'gameplay', 'server', 'src', 'gameplay-server.mjs'),
    // Canonical shared inputs (lineage-stable).
    renameMapPath: path.join(DEOB_DIR, 'data', 'rename-map.json'),
    protocolDir: path.join(ROOT, 'gameplay', 'packages', 'protocol'),
  };
  if (name === 'served') {
    return {
      ...shared,
      flat: true,
      sourceLabel: 'raw/bundles/final.pkg.js [code region]',
      emitHeaderSource: '../../raw/bundles/final.pkg.js [code region]',
      dataDir: path.join(DEOB_DIR, 'served', 'data'),
      srcDir: path.join(DEOB_DIR, 'served', 'src'),
      buildDir: path.join(DEOB_DIR, 'served', 'build'),
      unitsFile: 'units.json',
      manifestFile: 'manifest.json',
      inventoryFile: 'inventory.json',
      coverageFile: 'coverage.json',
      rebuiltFile: 'final.pkg.rebuilt', // full file: manifest text + code
      regenFile: 'manifest.regen.json',
      renameReportFile: 'rename-report.json',
      behavioralReportFile: 'behavioral-report.json',
      serverAnchorsReportFile: 'server-anchors.json',
    };
  }
  return {
    ...shared,
    flat: false,
    vm9Path: path.join(ROOT, 'raw', 'bundles', 'VM9.deob.txt'),
    sourceLabel: 'raw/bundles/VM9.deob.txt',
    emitHeaderSource: '../../raw/bundles/VM9.deob.txt',
    dataDir: path.join(DEOB_DIR, 'data'),
    srcDir: path.join(DEOB_DIR, 'src'),
    buildDir: path.join(DEOB_DIR, 'build'),
    unitsFile: 'units.json',
    manifestFile: 'manifest.json',
    inventoryFile: 'inventory.json',
    coverageFile: 'coverage.json',
    rebuiltFile: 'vm9.rebuilt.js',
    regenFile: 'manifest.regen.json',
    renameReportFile: 'rename-report.json',
    behavioralReportFile: 'behavioral-report.json',
    serverAnchorsReportFile: 'server-anchors.json',
  };
}

// Original source text for the active corpus (never modified).
export function readSourceText() {
  const C = corpus();
  if (C.name === 'vm9') return fs.readFileSync(C.vm9Path, 'utf8');
  const pkg = fs.readFileSync(C.pkgPath, 'utf8');
  const first = pkg.indexOf(C.codeAnchor);
  if (first < 0) throw new Error('corpus: CODE_ANCHOR not found in final.pkg.js');
  if (pkg.indexOf(C.codeAnchor, first + 1) >= 0) {
    throw new Error('corpus: CODE_ANCHOR is not unique in final.pkg.js');
  }
  return pkg.slice(first);
}

// Rebuilt CODE region text (served rebuilt file = manifest text + code;
// vm9 rebuilt file is code only). The manifest block must never enter scope
// analysis, token compares, or vm.Script compiles.
// The split point is the ORIGINAL manifest length (bundle guarantees the
// rebuilt manifest block byte-exact), never a literal code anchor: the code
// region carries renames (RV3 renamed the old CODE_ANCHOR token itself), so a
// literal search on the rebuilt side is rename-fragile by construction.
export function readRebuiltCode() {
  const C = corpus();
  const text = fs.readFileSync(path.join(C.buildDir, C.rebuiltFile), 'utf8');
  if (C.name === 'vm9') return text;
  const pkg = fs.readFileSync(C.pkgPath, 'utf8');
  const codeStart = servedCodeStart(pkg);
  const origManifest = pkg.slice(0, codeStart);
  if (text.slice(0, codeStart) !== origManifest) {
    throw new Error('corpus: served rebuilt manifest block != original manifest block');
  }
  return text.slice(codeStart);
}

// Code-region start (file-absolute char offset) for the served corpus.
export function servedCodeStart(pkgText) {
  const first = pkgText.indexOf(CODE_ANCHOR);
  if (first < 0) throw new Error('corpus: CODE_ANCHOR not found');
  if (pkgText.indexOf(CODE_ANCHOR, first + 1) >= 0) {
    throw new Error('corpus: CODE_ANCHOR is not unique');
  }
  return first;
}

// Parse the served manifest block. Returns { codeStart, manifestText, order,
// hints: Map(name -> number[]), anchorCount }. Shared by extract (served) and
// bundle (served regen); identical semantics to the M0 inline parser.
export function parseManifest(pkgText) {
  const codeStart = servedCodeStart(pkgText);
  const manifestText = pkgText.slice(0, codeStart);
  const order = [];
  const hints = new Map();
  let anchorCount = 0;
  for (const part of manifestText.split('@')) {
    if (part === '') continue;
    const i = part.indexOf(':');
    if (i < 0) throw new Error(`manifest parse: part without colon: ${JSON.stringify(part.slice(0, 60))}`);
    const name = part.slice(0, i);
    if (!name) throw new Error('manifest parse: empty name');
    const nums = [];
    for (const f of part.slice(i + 1).split(':')) {
      if (f === '') continue; // trailing colon / zero-anchor name
      if (!/^\d+$/.test(f)) throw new Error(`manifest parse: non-numeric anchor ${JSON.stringify(f)} for ${name}`);
      nums.push(Number(f));
    }
    order.push(name);
    hints.set(name, nums);
    anchorCount += nums.length;
  }
  return { codeStart, manifestText, order, hints, anchorCount };
}

// Emit manifest text from validated hint lists. Byte-exact round-trip rule
// (proven on the original: zero-anchor names emit `name:`, others
// `name:n1:n2:…:`, parts joined by '@', no trailing terminator — the code
// anchor's leading ';' follows immediately).
export function emitManifest(order, hintsByName) {
  return order.map((name) => {
    const nums = hintsByName.get(name) || [];
    return nums.length ? `${name}:${nums.join(':')}:` : `${name}:`;
  }).join('@');
}

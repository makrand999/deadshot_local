import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragmentFile } from '../tools/emit.mjs';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const SERVED_DIR = path.join(__dirname, '..', 'served');
const SRC_DIR = path.join(SERVED_DIR, 'src');
const BUILD_DIR = path.join(SERVED_DIR, 'build');
const DATA_DIR = path.join(SERVED_DIR, 'data');
const PKG_PATH = path.join(ROOT, 'raw', 'bundles', 'final.pkg.js');
const REBUILT_PATH = path.join(BUILD_DIR, 'final.pkg.rebuilt');

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

test('m6 served bundle: src tree carries every unit exactly once', () => {
  const { units } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));
  const frags = [];
  for (const f of collectJsFiles(SRC_DIR)) {
    const rel = path.relative(SRC_DIR, f).split(path.sep).join('/');
    for (const u of parseFragmentFile(fs.readFileSync(f, 'utf8'), rel)) {
      frags.push({ ...u, file: rel });
    }
  }
  assert.equal(frags.length, units.length);
  assert.equal(new Set(frags.map((u) => u.id)).size, units.length);
  const want = new Set(units.map((u) => u.id));
  for (const u of frags) assert.ok(want.has(u.id), `unknown unit ${u.id} in ${u.file}`);
  const modOf = new Map(units.map((u) => [u.id, u.module]));
  for (const u of frags) assert.equal(u.file, modOf.get(u.id), `misplaced ${u.id}`);
});

test('m6 served bundle: rebuilt file coherence with tree state (L1 iff unrenamed)', () => {
  // Full-file L1 holds only on the unrenamed tree; on the renamed tree the
  // file must differ (exactly by the mapped renames — see L2/behavioral).
  // The manifest block is byte-exact in BOTH states (emitted from validated
  // hint lists, never from scans).
  const origBytes = fs.readFileSync(PKG_PATH);
  const builtBytes = fs.readFileSync(REBUILT_PATH);
  const repPath = path.join(BUILD_DIR, 'rename-report.json');
  const renamedTree = fs.existsSync(repPath) && JSON.parse(fs.readFileSync(repPath, 'utf8')).totals.renamed > 0;
  assert.equal(builtBytes.equals(origBytes), !renamedTree);
  const CODE_START = 111079;
  assert.ok(builtBytes.slice(0, CODE_START).equals(origBytes.slice(0, CODE_START)), 'manifest block must be byte-exact in any tree state');
  const map = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rename-map.json'), 'utf8'));
  const anchorTok = 'battle_royale_enabled';
  const anchorName = renamedTree && map.entries[anchorTok] ? map.entries[anchorTok].name : anchorTok;
  assert.ok(builtBytes.slice(CODE_START).toString('utf8').startsWith(`;var ${anchorName}=false;`));
  if (renamedTree) {
    assert.ok(builtBytes.includes('localPlayer'), 'renamed tree missing expected identifier');
    assert.ok(builtBytes.length !== origBytes.length, 'renamed bundle unexpectedly same length');
  } else {
    assert.equal(builtBytes.length, 2934038);
  }
  assert.ok(!builtBytes.toString('utf8').includes('// __UNIT__'), 'emit marker leaked into bundle');
});

test('m6 served bundle: regenerated manifest is self-consistent', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'));
  const regen = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.regen.json'), 'utf8'));
  const rep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
  assert.deepEqual(regen.order, manifest.order);
  // Same rename-aware invariant as the vm9 lineage: renamed manifest names
  // YdshJUELZK (111) + lrRnpundBY (15) + ktLerTRTAa (3) + cgKhuMbVj (3)
  // + zYkfnulmBd (2, b17) + L1P locals (klYMxzxpTL 4 + aKmLbYuMC 6 +
  // BhSKyEIxpfR 5 = 15) + LA1 locals (same 8 tokens, same counts as vm9:
  // fkXbORMTcl 28 + loPNdwjKE 4 + pkghYgdlX 491 + qIySEZgti 54 +
  // QtjDeukbWl 9 + URKVNwauOZ 287 + AyXbLxaib 13 + AUbXpMajF 19 = 905)
  // + LA2 locals (same 8 new tokens + loPNdwjKE/AyXbLxaib growth as vm9 =
  // 138) + LA3 locals (same RNQDluasaN +217 / tDrlYTeenN +8 / 3 new tokens
  // 87 as vm9 = 312) + LA4 locals (same AUbXpMajF +135 / qIySEZgti +9 /
  // RNQDluasaN +4 as vm9 = 148) + LA5 locals (same qIySEZgti +16 /
  // RNQDluasaN +4 / dhHAhrXfI 5 as vm9 = 25) + LA6 locals (same +76
  // as vm9) + LA7 locals (same +214 as vm9) + LA8 locals (same +14
  // as vm9) + LA9 locals (same +113 as vm9) + LA10 locals (same +74
  // as vm9) + LA11 locals (same +171 as vm9) + LA12 locals (same +107
  // as vm9) + LA13 locals (0, all-keep wave) + LA14 locals (same +111
  // as vm9) + LA15 locals (same +159 as vm9) + LA16 locals (0,
  // all-keep wave) + LA17 locals (same +6 as vm9) + LA18 locals (same
  // +89 as vm9) + LA19 locals (same +5 as vm9) + LA20 locals (same
  // +44 as vm9) + LA21 locals (same +11 as vm9) + LA22 locals
  // (same +0 as vm9) + LA23 locals (same +38 as vm9) + LA24
  // locals (same +34 as vm9) + LA25 locals (same +94 as vm9)
  // = 3037 + LA26 locals (same +24 as vm9) + LA27 locals
  // (same +30 as vm9) + LA28 locals (0, all-keep wave) +
  // LA29 locals (same +15 as vm9) + LA30 locals (same
  // +335 as vm9) + LA31 locals (same +52 as vm9) + LA32
  // locals (same +6 as vm9) + LA33 locals (same +6 as vm9)
  // = 3505 + LA34 locals (same +0 as vm9) + LA35 locals
  // (same +2 as vm9) + LA36 locals (same +0 as vm9) +
  // LA37 locals (same +0 as vm9) + LA38 locals (same
  // +2 as vm9) + LA39 locals (same +15 as vm9) + LA40
  // locals (0, all-keep wave) + LA41 locals (0, all-keep
  // wave) + LA42 locals (0, all-keep wave) + LA43 locals
  // (0, all-keep wave) + LA44 locals (0, all-keep wave)
  // + LD1 locals (same +0 as vm9) + LD2 locals (same
  // +0 as vm9) + LD3 locals (same +0 as vm9) + LD4 locals
  // (same +0 as vm9) + LD5 locals (same +0 as vm9)
  // + LD6 locals (same +0 as vm9) + LD7 locals (same +0
  // as vm9) + LD8 locals (same +0 as vm9) + LD9 locals
  // (same +0 as vm9) + LD10 locals (same +0 as vm9)
  // + LD11 locals (same +0 as vm9)
  // + LD12 locals (same +0 as vm9)
  // + LD13 locals (same +0 as vm9)
  // + LD14 locals (same +0 as vm9)
  // + LD15 locals (same +0 as vm9)
  // + LD16 locals (same +0 as vm9)
  // + LD17 locals (same +0 as vm9)
  // + LD18 locals (same +0 as vm9)
  // + LD19 locals (same +0 as vm9)
  // + LD20 locals (same +13 as vm9)
  // + LD21 locals (same +0 as vm9)
  // + LD22 locals (same +0 as vm9)
  // + LD23 locals (same +0 as vm9)
  // + LD24 locals (same +0 as vm9)
  // = 3537
  // (zero lineage divergence,
  // per-lineage fingerprints).
  const manNames = new Set(manifest.order);
  const renamedAway = Object.entries(rep.entries)
    .filter(([t, r]) => manNames.has(t) || manNames.has(r.token))
    .reduce((n, [, r]) => n + (r.renamed || 0), 0);
  assert.equal(renamedAway, 3537);
  assert.equal(regen.meta.total, manifest.meta.measuredPkgTotal - renamedAway);
  assert.equal(regen.meta.total, 9812);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../tools/lint.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SRC_DIR = path.join(__dirname, '..', 'src');
const BUILD_DIR = path.join(__dirname, '..', 'build');

const inv = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'inventory.json'), 'utf8'));
const cov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coverage.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-map.json'), 'utf8'));
const unitsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));

test('m3 inventory: full census (prototype-safe, deterministic)', () => {
  assert.equal(inv.meta.distinctNames, 11886);
  assert.equal(inv.meta.totalNameTokens, 188893);
  assert.equal(inv.meta.topDeclCount, 2477);
  assert.equal(inv.meta.bracketDistinct, 3353);
  assert.equal(Object.keys(inv.names).length, 11886);
  assert.equal(inv.topDecls.length, 2477);
  // Prototype-pollution guard: __proto__ is a real identifier + string key.
  assert.ok(Object.prototype.hasOwnProperty.call(inv.names, '__proto__'), 'inventory missing __proto__ identifier');
  assert.equal(inv.names['__proto__'].count, 4);
  assert.ok(Object.prototype.hasOwnProperty.call(inv.bracketStrings, '__proto__') || '__proto__' in inv.bracketStrings, 'inventory missing __proto__ string');
  // Top-decl coverage sanity (M2 90 + b1-18 2020 + rv1 12 + rv2 146 + rv3 3 + rv4 50 = 2321 covered).
  assert.equal(inv.meta.topDeclCoveredByRenameMap, 2321);
  assert.equal(inv.meta.topDeclCoveredByRenameMap + inv.meta.topDeclUncovered, 2477);
});

test('m3 coverage: 100% of identifiers + strings have an explicit disposition', () => {
  assert.equal(cov.meta.distinctNames, 11886);
  assert.equal(cov.meta.covered, 11886);
  assert.equal(cov.order.length, 11886);
  assert.equal(cov.meta.renamed, 2342);
  assert.equal(cov.meta.keepMap, 3);
  assert.equal(cov.meta.keepTop + cov.meta.keepLocal + cov.meta.keepBuiltin + cov.meta.renamed + cov.meta.keepMap + cov.meta.renamedLocal + cov.meta.partialLocal, 11886);
  for (const n of cov.order) {
    const e = cov.entries[n];
    assert.ok(e, `missing coverage for ${n}`);
    assert.ok(['renamed', 'keep-map', 'keep-builtin', 'keep-top', 'keep-local', 'renamed-local', 'partial-local'].includes(e.disposition), `bad disposition ${n}`);
    assert.ok(typeof e.evidence === 'string' && e.evidence.length > 0, `no evidence ${n}`);
  }
  // Curated keeps are keep-map (identifier side).
  for (const tok of ['a3D', 'a3J', 'a3v']) {
    assert.equal(cov.entries[tok].disposition, 'keep-map');
  }
  // YGIcYCdrEk has no identifier positions (string-only) — absent from names,
  // covered under strings as keep-map.
  assert.ok(!Object.prototype.hasOwnProperty.call(cov.entries, 'YGIcYCdrEk'));
  // Strings: protected-wire + keep-map + keep-string cover all.
  assert.equal(cov.meta.bracketDistinct, 3353);
  assert.equal(cov.meta.bracketProtected + cov.meta.bracketKeepMap + cov.meta.bracketKeep, 3353);
  assert.equal(cov.meta.bracketKeepMap, 24);
  assert.ok(cov.strings['YGIcYCdrEk'], 'YGIcYCdrEk string missing');
  assert.equal(cov.strings['YGIcYCdrEk'].disposition, 'keep-map');
  for (const w of ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P']) {
    // PLAN §B.3 anchors: either protected-wire (manifest) or keep-map (curated);
    // never keep-string, never renamed.
    assert.ok(['protected-wire', 'keep-map'].includes(cov.strings[w].disposition), `${w} disposition`);
  }
});

test('m3 placement: fallback polished (2736 -> 2264), order/tiling invariant', () => {
  const { meta, units } = unitsData;
  assert.equal(units.length, 2884);
  assert.ok(meta.reclassified, 'units.json missing M3 reclassified meta');
  assert.equal(meta.reclassified.moved, 472);
  assert.equal(meta.reclassified.remainingFallback, 2264);
  const hist = {};
  for (const u of units) hist[u.module] = (hist[u.module] || 0) + 1;
  assert.equal(hist['sim/game-loop.js'], 2264);
  assert.ok(hist['sim/game-loop.js'] < 2736, 'fallback did not shrink');
  // Every non-fallback M0 placement preserved (spot-check: vendor + handlers).
  assert.equal(hist['vendor/browserify-lib.js'], 1);
  assert.equal(units.filter((u) => u.kind === 'handler-entry').length, 49);
  // All modules in the histogram have a src file with matching units.
  for (const mod of Object.keys(hist)) {
    const p = path.join(SRC_DIR, mod);
    assert.ok(fs.existsSync(p), `missing src file for ${mod}`);
  }
  // No unit lost: ids tile u0000..u2883.
  units.forEach((u, i) => assert.equal(u.id, 'u' + String(i).padStart(4, '0')));
});

test('m3 lint: no undeclared/duplicate (differential VM9 vs rebuilt)', async () => {
  const rep = await lint({});
  assert.equal(rep.errors.length, 0);
});

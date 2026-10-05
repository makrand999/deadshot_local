import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRebuiltCode } from '../tools/corpus.mjs';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVED_DIR = path.join(__dirname, '..', 'served');
const BUILD_DIR = path.join(SERVED_DIR, 'build');

test('m6 served rename: one-shot migration totals for the served lineage', () => {
  const rep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
  // Same map (2342 rename entries): served 22276 vs vm9 19646. Review2 is the
  // first round whose counts diverge by lineage (served +1374 vs vm9 +1383):
  // pZ→isHeadless renames 10 positions in vm9 but 1 in served, where the other
  // 9 are shadow bindings (skipped), so served skips 9 more (2918 vs 2909).
  // Batches 7-17 add zero divergence (+984/+818/+737/+704/+671/+590/+600/
  // +452/+438/+276/+154 both sides; batches 11-18 add zero new shadows).
  // rv3 (+3) and rv4 (+72) add zero divergence; rv4 adds +39 shadows both
  // sides (s0: 28 local/GLSL positions, Q2: 11 shadow positions) so the
  // lineage gap stays 9 (2918 vs 2909).
  // B3 alignment holds both sides. Nothing deferred-ambiguous either side.
  assert.equal(rep.totals.renamed, 22276);
  assert.equal(rep.totals.skippedShadowed, 2918);
  assert.equal(rep.totals.deferred, 0);
  assert.equal(rep.meta.units, 2884);
});

test('m6 served rename: new names applied, wire strings survive byte-identical', () => {
  const ROOT = path.join(__dirname, '..', '..');
  const code = fs.readFileSync(path.join(ROOT, 'raw', 'bundles', 'final.pkg.js'), 'utf8').slice(111079);
  const rebuilt = readRebuiltCode(); // rename-proof split (RV3 renamed the old literal anchor)
  // renamed identifiers land in the served rebuild…
  for (const w of ['localPlayer', 'templatesLive', 'partyController', 'entityList']) {
    assert.ok(rebuilt.includes(w), `renamed ${w} missing from served rebuild`);
    assert.ok(!code.includes(w), `${w} already in original (bad test?)`);
  }
  // …while wire strings are untouched.
  for (const w of ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P']) {
    const q = (h) => h.split(`'${w}'`).length - 1 + h.split(`"${w}"`).length - 1;
    assert.equal(q(rebuilt), q(code), `wire string '${w}' count changed`);
    assert.ok(q(code) > 0, `wire string '${w}' missing from original (bad test?)`);
  }
});

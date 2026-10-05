import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { behavioral } from '../tools/behavioral.mjs';
import { verify } from '../tools/verify.mjs';
import { readRebuiltCode } from '../tools/corpus.mjs';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const SERVED_DIR = path.join(__dirname, '..', 'served');
const BUILD_DIR = path.join(SERVED_DIR, 'build');
const REPORT_PATH = path.join(BUILD_DIR, 'behavioral-report.json');
const PKG_PATH = path.join(ROOT, 'raw', 'bundles', 'final.pkg.js');
const REBUILT_PATH = path.join(BUILD_DIR, 'final.pkg.rebuilt');
const ANCHOR = ';var battle_royale_enabled=false;';

const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const servedCode = () => {
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  return pkg.slice(pkg.indexOf(ANCHOR));
};
const rebuiltCode = () => readRebuiltCode(); // rename-proof split (RV3 renamed the old literal anchor)

test('m6 served behavioral: L3 harness passes (B1..B4 green, B5 skip-by-default)', async () => {
  const rep = await behavioral({});
  assert.equal(rep.level, 'L3');
  assert.equal(rep.pass, true);
  assert.equal(rep.meta.corpus, 'served');
  assert.equal(rep.sections.b1.status, 'PASS');
  assert.equal(rep.sections.b2.status, 'PASS');
  assert.equal(rep.sections.b3.status, 'PASS');
  assert.equal(rep.sections.b4.status, 'PASS');
  assert.equal(rep.sections.b5.status, 'SKIP');
  // B1 gates the served L2 proof (M3 3081 + b1 7327 + b2 1154 + b3 841 + b4 489 + rv1 321 + b5 522 + b6 637 + rv2 1374 + b7 984 + b8 818 + b9 737 + b10 704 + b11 671 + b12 590 + b13 600 + b14 452 + b15 438 + b16 276 + b17 154 + b18 31 + rv3 3 + rv4 72 + L1P 22 + LA1 5636 + LA2 2854).
  assert.equal(rep.sections.b1.l2Tokens, 836034);
  assert.equal(rep.sections.b1.l2Normalized, 69144);
  assert.equal(rep.sections.b1.renamedTokens, 22276);
  // B2 compared the whole served program structure (2.8 MB code region).
  assert.ok(rep.sections.b2.astNodes > 1000000, `astNodes ${rep.sections.b2.astNodes}`);
  // B3 checked every binding position on the served lineage.
  assert.equal(rep.sections.b3.decls, 21475);
  assert.equal(rep.sections.b3.refs, 138417);
  assert.equal(rep.sections.b3.propUses, 35940);
  // B4 executed the documented wire/math behavior (lineage-independent goldens).
  assert.deepEqual(rep.sections.b4.goldens.codecMessages,
    ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P', 'kM86hVW024']);
  for (const w of ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P', 'Math.PI', 'getUint16']) {
    assert.ok(rep.sections.b4.anchors[w] > 0, `anchor ${w} missing`);
  }
  // The written report matches the returned one and the code it fingerprints.
  const onDisk = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  assert.deepEqual(onDisk, JSON.parse(JSON.stringify({ meta: rep.meta, sections: rep.sections, pass: rep.pass })));
  assert.equal(onDisk.meta.sources.vm9.sha256, sha256(servedCode()));
  assert.equal(onDisk.meta.sources.rebuilt.sha256, sha256(rebuiltCode()));
  assert.equal(onDisk.meta.renameMap.entries, 2375);
});

test('m6 served behavioral: report is deterministic across runs (no timestamps)', async () => {
  const a = await behavioral({});
  const b = await behavioral({});
  assert.equal(JSON.stringify({ meta: a.meta, sections: a.sections, pass: a.pass }),
    JSON.stringify({ meta: b.meta, sections: b.sections, pass: b.pass }));
});

test('m6 served: verify --level L3 passes through the harness', async () => {
  const r = await verify('L3', {});
  assert.equal(r.level, 'L3');
  assert.equal(r.pass, true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVED_DIR = path.join(__dirname, '..', 'served');
const BUILD_DIR = path.join(SERVED_DIR, 'build');
const DATA_DIR = path.join(SERVED_DIR, 'data');

test('m6 served locals: same 46868 positions, zero lineage divergence (LD24)', () => {
  const rep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
  const want = {
    'klYMxzxpTL@u0417#0': 2,
    'klYMxzxpTL@u0417#1': 2,
    'aKmLbYuMC@u0417#0': 6,
    'DdN@u0417#0': 7,
    'BhSKyEIxpfR@u0417#0': 5,
  };
  for (const [id, n] of Object.entries(want)) {
    assert.equal(rep.entries[id].status, 'applied');
    assert.equal(rep.entries[id].renamed, n);
  }
  // L1P 22 + LA1 5636 + LA2 2854 + LA3 2544 + LA4 1398 + LA5 1344 + LA6 948 + LA7 523 + LA8 116 + LA9 137 + LA10 120 + LA11 180 + LA12 196 + LA13 0 + LA14 165 + LA15 159 + LA16 0 + LA17 24 + LA18 89 + LA19 5 + LA20 55 + LA21 159 + LA22 29 + LA23 136 + LA24 44 + LA25 139 + LA26 42 + LA27 69 + LA28 0 + LA29 15 + LA30 349 + LA31 55 + LA32 186 + LA33 9 + LA34 17 + LA35 2 + LA36 73 + LA37 15 + LA38 70 + LA39 87 + LA40 0 + LA41 0 + LA42 0 + LA43 0 + LA44 0 + LD1 1815 + LD2 1368 + LD3 1444 + LD4 1750 + LD5 1469 + LD6 1179 + LD7 1097 + LD8 1013 + LD9 1121 + LD10 1029 + LD11 1137 + LD12 1393 + LD13 1159 + LD14 988 + LD15 1156 + LD16 1272 + LD17 1198 + LD18 1000 + LD19 1050 + LD20 995 + LD21 1165 + LD22 888 + LD23 1119 + LD24 1052 = 46868, identical to vm9 (per-lineage fingerprints).
  assert.equal(rep.totals.renamedLocal, 46868);
  assert.equal(rep.totals.deferredLocal, 0);
  assert.deepEqual(rep.keepLocals, ['f@u0417#0']);
});

test('m6 served locals: coverage + B1 pins (LD24)', () => {
  const cov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coverage.json'), 'utf8'));
  assert.equal(cov.meta.renamedLocal, 1119);
  assert.equal(cov.meta.partialLocal, 250);
  assert.equal(cov.meta.localBindings, 27151);
  assert.equal(cov.meta.localRenamed, 7701);
  assert.equal(cov.meta.localDeferred, 0);
  const brep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'behavioral-report.json'), 'utf8'));
  // Served global chain 22276 + L1P 22 + LA1 5636 + LA2 2854 + LA3 2544 + LA4 1398 + LA5 1344 + LA6 948 + LA7 523 + LA8 116 + LA9 137 + LA10 120 + LA11 180 + LA12 196 + LA13 0 + LA14 165 + LA15 159 + LA16 0 + LA17 24 + LA18 89 + LA19 5 + LA20 55 + LA21 159 + LA22 29 + LA23 136 + LA24 44 + LA25 139 + LA26 42 + LA27 69 + LA28 0 + LA29 15 + LA30 349 + LA31 55 + LA32 186 + LA33 9 + LA34 17 + LA35 2 + LA36 73 + LA37 15 + LA38 70 + LA39 87 + LA40 0 + LA41 0 + LA42 0 + LA43 0 + LA44 0 + LD1 1815 + LD2 1368 + LD3 1444 + LD4 1750 + LD5 1469 + LD6 1179 + LD7 1097 + LD8 1013 + LD9 1121 + LD10 1029 + LD11 1137 + LD12 1393 + LD13 1159 + LD14 988 + LD15 1156 + LD16 1272 + LD17 1198 + LD18 1000 + LD19 1050 + LD20 995 + LD21 1165 + LD22 888 + LD23 1119 + LD24 1052 = 69144.
  assert.equal(brep.sections.b1.l2Normalized, 69144);
  assert.equal(brep.sections.b1.renamedTokens, 22276);
  assert.equal(brep.sections.b1.renamedLocalTokens, 46868);
  assert.equal(brep.sections.b1.deferredLocal, 0);
});

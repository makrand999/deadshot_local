import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const BUILD_DIR = path.join(__dirname, '..', 'build');

const lmap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-locals.json'), 'utf8'));
const rep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
const census = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'local-bindings.json'), 'utf8'));

test('locals map: schema valid, 7702 entries (L1P 5+1 + LA1 595 + LA2 516 + LA3 442 + LA4 274 + LA5 295 + LA6 265 + LA7 160 + LA8 34 + LA9 13 + LA10 17 + LA11 37 + LA12 34 + LA13 0 + LA14 35 + LA15 33 + LA16 0 + LA17 4 + LA18 25 + LA19 5 + LA20 8 + LA21 41 + LA22 11 + LA23 36 + LA24 11 + LA25 30 + LA26 9 + LA27 18 + LA28 0 + LA29 10 + LA30 18 + LA31 20 + LA32 64 + LA33 7 + LA34 7 + LA35 1 + LA36 30 + LA37 6 + LA38 33 + LA39 38 + LA40 0 + LA41 0 + LA42 0 + LA43 0 + LA44 0 + LD1 175 + LD2 163 + LD3 179 + LD4 167 + LD5 181 + LD6 185 + LD7 180 + LD8 191 + LD9 190 + LD10 198 + LD11 177 + LD12 237 + LD13 166 + LD14 177 + LD15 199 + LD16 195 + LD17 195 + LD18 181 + LD19 190 + LD20 172 + LD21 224 + LD22 176 + LD23 197 + LD24 219)', () => {
  assert.equal(lmap.order.length, 7702);
  assert.equal(Object.keys(lmap.entries).length, 7702);
  assert.equal(lmap.meta.entryCount, 7702);
  const rens = lmap.order.map((id) => lmap.entries[id]).filter((e) => e.action === 'rename');
  const keeps = lmap.order.map((id) => lmap.entries[id]).filter((e) => e.action === 'keep');
  assert.equal(rens.length, 7701);
  assert.equal(keeps.length, 1);
  assert.equal(lmap.meta.renameCount, 7701);
  assert.equal(lmap.meta.keepCount, 1);
  for (const id of lmap.order) {
    const e = lmap.entries[id];
    assert.equal(e.scope, 'local');
    assert.equal(id, `${e.token}@${e.binding.unit}#${e.binding.index}`);
  }
});

test('locals pilot: report entries applied with exact position counts', () => {
  // L1P pilot (u0417 raycast): klYM#0 1decl+1ref, klYM#1 1+1, aKm 1+5,
  // DdN 1+6, BhS 1+4 = 22 local positions; f kept.
  const want = {
    'klYMxzxpTL@u0417#0': 2,
    'klYMxzxpTL@u0417#1': 2,
    'aKmLbYuMC@u0417#0': 6,
    'DdN@u0417#0': 7,
    'BhSKyEIxpfR@u0417#0': 5,
  };
  for (const [id, n] of Object.entries(want)) {
    assert.equal(rep.entries[id].status, 'applied');
    assert.equal(rep.entries[id].scope, 'local');
    assert.equal(rep.entries[id].renamed, n);
  }
  // L1P 22 + LA1 5636 + LA2 2854 + LA3 2544 + LA4 1398 + LA5 1344 + LA6 948 + LA7 523 + LA8 116 + LA9 137 + LA10 120 + LA11 180 + LA12 196 + LA13 0 + LA14 165 + LA15 159 + LA16 0 + LA17 24 + LA18 89 + LA19 5  + LA20 55 + LA21 159 + LA22 29 + LA23 136 + LA24 44 + LA25 139 + LA26 42 + LA27 69 + LA28 0 + LA29 15 + LA30 349 + LA31 55 + LA32 186 + LA33 9 + LA34 17 + LA35 2 + LA36 73 + LA37 15 + LA38 70 + LA39 87 + LA40 0 + LA41 0 + LA42 0 + LA43 0 + LA44 0 + LD1 1815 + LD2 1368 + LD3 1444 + LD4 1750 + LD5 1469 + LD6 1179 + LD7 1097 + LD8 1013 + LD9 1121 + LD10 1029 + LD11 1137 + LD12 1393 + LD13 1159 + LD14 988 + LD15 1156 + LD16 1272 + LD17 1198 + LD18 1000 + LD19 1050 + LD20 995 + LD21 1165 + LD22 888 + LD23 1119 + LD24 1052 = 46868 (zero served divergence).
  assert.equal(rep.totals.renamedLocal, 46868);
  assert.equal(rep.totals.deferredLocal, 0);
  assert.deepEqual(rep.keepLocals, ['f@u0417#0']);
  // Duplicate new name across disjoint bindings (the set-semantics case).
  assert.equal(rep.entries['klYMxzxpTL@u0417#0'].name, 'direction');
  assert.equal(rep.entries['klYMxzxpTL@u0417#1'].name, 'direction');
});

test('locals pilot: entries resolve against the census fingerprint', () => {
  for (const id of lmap.order) {
    const e = lmap.entries[id];
    const list = census.units[e.binding.unit].tokens[e.token];
    const c = list[e.binding.index];
    assert.equal(c.redeclOf, -1);
    assert.equal(c.globalTarget, false);
    assert.equal(c.refCount, e.binding.refCount);
    assert.equal(c.snippet, e.binding.snippet);
  }
});

test('locals coverage: binding dispositions pinned', () => {
  const cov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coverage.json'), 'utf8'));
  // L1P: 4 pilot tokens partially renamed (klYM x2 bindings same token).
  // LA1: 59 fully renamed + 144 partial (keepLocal 9289 -> 9090).
  // LA2: 93 fully renamed + 187 partial (keepLocal 9090 -> 9013).
  // LA3: 129 fully renamed + 190 partial (keepLocal 9013 -> 8974).
  // LA4: 197 fully renamed + 199 partial (keepLocal 8974 -> 8897; Gq revert).
  // LA5: 256 fully renamed + 216 partial (keepLocal 8897 -> 8821).
  // LA6: 303 fully renamed + 219 partial (keepLocal 8821 -> 8771).
  // LA7: 313 fully renamed + 218 partial (keepLocal 8771 -> 8762).
  // LA8: 319 fully renamed + 220 partial (keepLocal 8762 -> 8754).
  // LA9: 320 fully renamed + 219 partial (keepLocal 8754 -> 8754, net zero).
  // LA10: 333 fully renamed + 217 partial (keepLocal 8754 -> 8743).
  // LA11: 335 fully renamed + 217 partial (keepLocal 8743 -> 8741).
  // LA12: 337 fully renamed + 218 partial (keepLocal 8741 -> 8738).
  // LA13: no change (all-keep wave, 0 merged).
  // LA14: 349 fully renamed + 220 partial (keepLocal 8738 -> 8724).
  // LA15: 352 fully renamed + 219 partial (keepLocal 8724 -> 8722).
  // LA16: no change (all-keep wave, 0 merged).
  // LA17: 355 fully renamed + 219 partial (keepLocal 8722 -> 8719).
  // LA18: 358 fully renamed + 218 partial (keepLocal 8719 -> 8717).
  // LA19: 359 fully renamed + 218 partial (keepLocal 8717 -> 8716).
  // LA20: 363 fully renamed + 218 partial (keepLocal 8716 -> 8712).
  // LA21: 373 fully renamed + 218 partial (keepLocal 8712 -> 8702).
  // LA22: 380 fully renamed + 219 partial (keepLocal 8702 -> 8694).
  // LA23: 380 fully renamed + 219 partial (keepLocal 8694 -> 8694, net zero).
  // LA24: 384 fully renamed + 218 partial (keepLocal 8694 -> 8691).
  // LA25: 395 fully renamed + 215 partial (keepLocal 8691 -> 8683).
  // LA26: 400 fully renamed + 215 partial (keepLocal 8683 -> 8678).
  // LA27: 406 fully renamed + 214 partial (keepLocal 8678 -> 8673).
  // LA28: no change (all-keep wave, 0 merged).
  // LA29: 409 fully renamed + 214 partial (keepLocal 8673 -> 8670).
  // LA30: 416 fully renamed + 212 partial (keepLocal 8670 -> 8665).
  // LA31: 420 fully renamed + 212 partial (keepLocal 8665 -> 8661).
  // LA32: 434 fully renamed + 211 partial (keepLocal 8661 -> 8648).
  // LA33: 438 fully renamed + 211 partial (keepLocal 8648 -> 8644).
  // LA34: 443 fully renamed + 211 partial (keepLocal 8644 -> 8639).
  // LA35: 444 fully renamed + 211 partial (keepLocal 8639 -> 8638).
  // LA36: 458 fully renamed + 212 partial (keepLocal 8638 -> 8623).
  // LA37: 460 fully renamed + 211 partial (keepLocal 8623 -> 8622).
  // LA38: 466 fully renamed + 213 partial (keepLocal 8622 -> 8614; 8 distinct tokens resolved).
  // LA39: 477 fully renamed + 213 partial (keepLocal 8614 -> 8603; 11 distinct tokens resolved, 3 stay partial).
  // LA40: no change (all-keep wave, 0 merged).
  // LA41: no change (all-keep wave, 0 merged).
  // LA42: no change (all-keep wave, 0 merged).
  // LA43: no change (all-keep wave, 0 merged).
  // LA44: no change (all-keep wave, 0 merged; pool exhausted).
  // LD1: 554 fully renamed + 228 partial (keepLocal 8603 -> 8511; diverged snippet-only wave).
  // LD2: 637 fully renamed + 252 partial (keepLocal 8511 -> 8404; diverged snippet-only wave).
  // LD3: 696 fully renamed + 254 partial (keepLocal 8404 -> 8343; diverged snippet-only wave).
  // LD4: 770 fully renamed + 256 partial (keepLocal 8343 -> 8267; diverged snippet-only wave).
  // LD5: 830 fully renamed + 257 partial (keepLocal 8267 -> 8206; diverged snippet-only wave).
  // LD6: 866 fully renamed + 277 partial (keepLocal 8206 -> 8150; diverged snippet-only wave).
  // LD7: 930 fully renamed + 278 partial (keepLocal 8150 -> 8085; diverged snippet-only wave).
  // LD8: 994 fully renamed + 276 partial (keepLocal 8085 -> 8023; diverged snippet-only wave).
  // LD9: 1001 fully renamed + 281 partial (keepLocal 8023 -> 8011; diverged snippet-only wave).
  // LD10: 1016 fully renamed + 271 partial (keepLocal 8011 -> 8006; diverged snippet-only wave).
  // LD11: 1026 fully renamed + 272 partial (keepLocal 8006 -> 7995; diverged snippet-only wave).
  // LD12: 1097 fully renamed + 265 partial (keepLocal 7995 -> 7931; diverged snippet-only wave).
  // LD13: 1097 fully renamed + 266 partial (keepLocal 7931 -> 7930; new token Ja stays partial 1/2).
  // LD14: 1097 fully renamed + 266 partial (keepLocal unchanged 7930; all 177 merges land on already-renamed tokens).
  // LD15: 1097 fully renamed + 266 partial (keepLocal unchanged 7930; all 199 merges land on already-renamed tokens).
  // LD16: 1114 fully renamed + 249 partial (keepLocal unchanged 7930; 17 u2654 a5* tokens partial->fully, 0 new partials).
  // LD17: 1115 fully renamed + 249 partial (keepLocal 7930 -> 7929; single-binding token Rx keep->fully, 0 new partials).
  // LD18: 1115 fully renamed + 249 partial (keepLocal unchanged 7929; all 181 merges land on already-partial tokens, 0 new partials, 0 completions).
  // LD19: 1115 fully renamed + 249 partial (keepLocal unchanged 7929; all 190 merges land on already-partial tokens, 0 new partials, 0 completions).
  // LD20: 1117 fully renamed + 250 partial (keepLocal 7929 -> 7926; Jb + rwWvECiaAns keep->fully, HX keep->partial 1/2).
  // LD21: 1119 fully renamed + 250 partial (keepLocal 7926 -> 7924; a1M + a1N keep->fully single-binding tokens, 0 new partials).
  // LD22: 1119 fully renamed + 250 partial (keepLocal unchanged 7924; all 176 merges land on already-renamed tokens, 0 new partials, 0 completions).
  // LD23: 1119 fully renamed + 250 partial (keepLocal unchanged 7924; all 197 merges land on already-renamed tokens, 0 new partials, 0 completions).
  // LD24: 1119 fully renamed + 250 partial (keepLocal unchanged 7924; all 219 merges land on already-renamed tokens, 0 new partials, 0 completions).
  assert.equal(cov.meta.renamedLocal, 1119);
  assert.equal(cov.meta.partialLocal, 250);
  assert.equal(cov.meta.localBindings, 27152);
  assert.equal(cov.meta.localRenamed, 7701);
  assert.equal(cov.meta.localDeferred, 0);
  assert.equal(cov.entries['DdN'].disposition, 'partial-local');
  // LA25: klYMxzxpTL flipped partial -> fully renamed (L1P 2 + LA6/LA7/LA11
  // growth + LA25 8 direction bindings cover every binding of the token).
  assert.equal(cov.entries['klYMxzxpTL'].disposition, 'renamed-local');
});

test('locals guards: shorthand + protected-token proposals held (LA4 revert)', () => {
  // RNQDluasaN@u0035#0 has a shorthand-property use ({RNQDluasaN} postMessage
  // payload): renaming it renames the key, which B3 forbids. Gq is a protected
  // server anchor: renaming it breaks the protected-identifier counts. Both
  // were merged in LA4, caught by the gates, reverted, and are now held by
  // merger guards (census hasShorthand flag + protected-token check).
  const b4 = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-locals-batch4.json'), 'utf8'));
  const bySel = new Map(b4.proposals.map((p) => [p.selector, p]));
  assert.equal(bySel.get('RNQDluasaN@u0035#0').disposition, 'held-invalid');
  assert.match(bySel.get('RNQDluasaN@u0035#0').reason, /shorthand/);
  assert.equal(bySel.get('Gq@u1718#0').disposition, 'held-invalid');
  assert.match(bySel.get('Gq@u1718#0').reason, /protected/);
  assert.ok(!lmap.entries['RNQDluasaN@u0035#0'], 'shorthand binding must stay unmerged');
  assert.ok(!lmap.entries['Gq@u1718#0'], 'protected token must stay unmerged');
  assert.equal(census.units['u0035'].tokens['RNQDluasaN'][0].hasShorthand, true);
  assert.equal(census.units['u0035'].tokens['RNQDluasaN'][1].hasShorthand, false);
  // The sibling without shorthand DID merge.
  assert.equal(lmap.entries['RNQDluasaN@u0035#1'].name, 'decodedGeometry');
  // LA5: a3l@u2345#0→elimName would capture the in-scope implicit global
  // elimName['image']; caught by the dry-run resolution backstop, reverted.
  const b5 = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-locals-batch5.json'), 'utf8'));
  const elim = b5.proposals.find((p) => p.selector === 'a3l@u2345#0');
  assert.equal(elim.disposition, 'held-invalid');
  assert.match(elim.reason, /capture/);
  // LA6 re-proposed the same binding under a safe name (victimName); the
  // invariant is that the capturing name stays out, not the binding itself.
  assert.notEqual(lmap.entries['a3l@u2345#0']?.name, 'elimName');
  assert.equal(lmap.entries['a3l@u2345#0']?.name, 'victimName');
});

test('locals B1: L2 normalized includes the 46868 local positions', () => {
  const brep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'behavioral-report.json'), 'utf8'));
  // Global chain 19646 + L1P 22 + LA1 5636 + LA2 2854 + LA3 2544 + LA4 1398 + LA5 1344 + LA6 948 + LA7 523 + LA8 116 + LA9 137 + LA10 120 + LA11 180 + LA12 196 + LA13 0 + LA14 165 + LA15 159 + LA16 0 + LA17 24 + LA18 89 + LA19 5 + LA20 55 + LA21 159 + LA22 29 + LA23 136 + LA24 44 + LA25 139 + LA26 42 + LA27 69 + LA28 0 + LA29 15 + LA30 349 + LA31 55 + LA32 186 + LA33 9 + LA34 17 + LA35 2 + LA36 73 + LA37 15 + LA38 70 + LA39 87 + LA40 0 + LA41 0 + LA42 0 + LA43 0 + LA44 0 + LD1 1815 + LD2 1368 + LD3 1444 + LD4 1750 + LD5 1469 + LD6 1179 + LD7 1097 + LD8 1013 + LD9 1121 + LD10 1029 + LD11 1137 + LD12 1393 + LD13 1159 + LD14 988 + LD15 1156 + LD16 1272 + LD17 1198 + LD18 1000 + LD19 1050 + LD20 995 + LD21 1165 + LD22 888 + LD23 1119 + LD24 1052 = 66514.
  assert.equal(brep.sections.b1.l2Normalized, 66514);
  assert.equal(brep.sections.b1.renamedTokens, 19646);
  assert.equal(brep.sections.b1.renamedLocalTokens, 46868);
  assert.equal(brep.sections.b1.deferredLocal, 0);
});

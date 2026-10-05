import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from '../tools/lint.mjs';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVED_DIR = path.join(__dirname, '..', 'served');
const DATA_DIR = path.join(SERVED_DIR, 'data');

test('m6 served coverage: inventory census pins served-lineage counts', () => {
  const inv = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'inventory.json'), 'utf8'));
  assert.equal(inv.meta.distinctNames, 11887);
  assert.equal(inv.meta.totalNameTokens, 204271);
  assert.equal(inv.meta.topDeclCount, 2477);
  assert.equal(inv.meta.topDeclCoveredByRenameMap, 2321);
  assert.equal(inv.meta.topDeclUncovered, 156);
  assert.equal(inv.meta.bracketDistinct, 2959);
  assert.equal(inv.meta.bracketTotal, 27065);
  assert.equal(inv.meta.units, 2884);
});

test('m6 served coverage: 100% explicit disposition', () => {
  const cov = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coverage.json'), 'utf8'));
  assert.equal(cov.meta.distinctNames, 11887);
  assert.equal(cov.meta.renamed, 2342);
  assert.equal(cov.meta.keepMap, 3);
  assert.equal(cov.meta.keepBuiltin, 92);
  assert.equal(cov.meta.keepTop, 156);
  // LA1: 9290 -> 9091 (-199 = 59 renamed-local + 144 partial-local - 4 L1P
  // partial); still exactly 1 above the vm9 9090 (pZ lineage case).
  // LA2: 9091 -> 9014 (-77 = 93 + 187 - 59 - 144); still 1 above vm9 9013.
  // LA3: 9014 -> 8975 (-39 = 129 + 190 - 93 - 187); still 1 above vm9 8974.
  // LA4: 8975 -> 8898 (-77 = 197 + 199 - 129 - 190); still 1 above vm9 8897.
  // LA5: 8898 -> 8822 (-76 = 256 + 216 - 197 - 199); still 1 above vm9 8821.
  // LA6: 8822 -> 8772 (-50 = 303 + 219 - 256 - 216); still 1 above vm9 8771.
  // LA7: 8772 -> 8763 (-9 = 313 + 218 - 303 - 219); still 1 above vm9 8762.
  // LA8: 8763 -> 8755 (-8 = 319 + 220 - 313 - 218); still 1 above vm9 8754.
  // LA9: 8755 -> 8755 (net zero = 320 + 219 - 319 - 220); still 1 above vm9 8754.
  // LA10: 8755 -> 8744 (-11 = 333 + 217 - 320 - 219); still 1 above vm9 8743.
  // LA11: 8744 -> 8742 (-2 = 335 + 217 - 333 - 217); still 1 above vm9 8741.
  // LA12: 8742 -> 8739 (-3 = 337 + 218 - 335 - 217); still 1 above vm9 8738.
  // LA13: no change (all-keep wave, 0 merged).
  // LA14: 8739 -> 8725 (-14 = 349 + 220 - 337 - 218); still 1 above vm9 8724.
  // LA15: 8725 -> 8723 (-2 = 352 + 219 - 349 - 220); still 1 above vm9 8722.
  // LA16: no change (all-keep wave, 0 merged).
  // LA17: 8723 -> 8720 (-3 = 355 + 219 - 352 - 219); still 1 above vm9 8719.
  // LA18: 8720 -> 8718 (-2 = 358 + 218 - 355 - 219); still 1 above vm9 8717.
  // LA19: 8718 -> 8717 (-1 = 359 + 218 - 358 - 218); still 1 above vm9 8716.
  // LA20: 8717 -> 8713 (-4 = 363 + 218 - 359 - 218); still 1 above vm9 8712.
  // LA21: 8713 -> 8703 (-10 = 373 + 218 - 363 - 218); still 1 above vm9 8702.
  // LA22: 8703 -> 8695 (-8 = 380 + 219 - 373 - 218); still 1 above vm9 8694.
  // LA23: no change (net-zero wave, 380 + 219 unchanged); still 1 above vm9 8694.
  // LA24: 8695 -> 8692 (-3 = 384 + 218 - 380 - 219); still 1 above vm9 8691.
  // LA25: 8692 -> 8684 (-8 = 395 + 215 - 384 - 218); still 1 above vm9 8683.
  // LA26: 8684 -> 8679 (-5 = 400 + 215 - 395 - 215); still 1 above vm9 8678.
  // LA27: 8679 -> 8674 (-5 = 406 + 214 - 400 - 215); still 1 above vm9 8673.
  // LA28: no change (all-keep wave, 0 merged).
  // LA29: 8674 -> 8671 (-3 = 409 + 214 - 406 - 214); still 1 above vm9 8670.
  // LA30: 8671 -> 8666 (-5 = 416 + 212 - 409 - 214); still 1 above vm9 8665.
  // LA31: 8666 -> 8662 (-4 = 420 + 212 - 416 - 212); still 1 above vm9 8661.
  // LA32: 8662 -> 8649 (-13 = 434 + 211 - 420 - 212); still 1 above vm9 8648.
  // LA33: 8649 -> 8645 (-4 = 438 + 211 - 434 - 211); still 1 above vm9 8644.
  // LA34: 8645 -> 8640 (-5 = 443 + 211 - 438 - 211); still 1 above vm9 8639.
  // LA35: 8640 -> 8639 (-1 = 444 + 211 - 443 - 211); still 1 above vm9 8638.
  // LA36: 8639 -> 8624 (-15 = 458 + 212 - 444 - 211); still 1 above vm9 8623.
  // LA37: 8624 -> 8623 (-1 = 460 + 211 - 458 - 212); still 1 above vm9 8622.
  // LA38: 8623 -> 8615 (-8 = 466 + 213 - 460 - 211); still 1 above vm9 8614.
  // LA39: 8615 -> 8604 (-11 = 477 + 213 - 466 - 213); still 1 above vm9 8603.
  // LA40: no change (all-keep wave, 0 merged).
  // LA41: no change (all-keep wave, 0 merged).
  // LA42: no change (all-keep wave, 0 merged).
  // LA43: no change (all-keep wave, 0 merged).
  // LA44: no change (all-keep wave, 0 merged; pool exhausted).
  // LD1: 8604 -> 8512 (-92 = 554 + 228 - 477 - 213); still 1 above vm9 8511.
  // LD2: 8512 -> 8405 (-107 = 637 + 252 - 554 - 228); still 1 above vm9 8404.
  // LD3: 8405 -> 8344 (-61 = 696 + 254 - 637 - 252); still 1 above vm9 8343.
  // LD4: 8344 -> 8268 (-76 = 770 + 256 - 696 - 254); still 1 above vm9 8267.
  // LD5: 8268 -> 8207 (-61 = 830 + 257 - 770 - 256); still 1 above vm9 8206.
  // LD6: 8207 -> 8151 (-56 = 866 + 277 - 830 - 257); still 1 above vm9 8150.
  // LD7: 8151 -> 8086 (-65 = 930 + 278 - 866 - 277); still 1 above vm9 8085.
  // LD8: 8086 -> 8024 (-62 = 994 + 276 - 930 - 278); still 1 above vm9 8023.
  // LD9: 8024 -> 8012 (-12 = 1001 + 281 - 994 - 276); still 1 above vm9 8011.
  // LD10: 8012 -> 8007 (-5 = 1016 + 271 - 1001 - 281); still 1 above vm9 8006.
  // LD11: 8007 -> 7996 (-11 = 1026 + 272 - 1016 - 271); still 1 above vm9 7995.
  // LD12: 7996 -> 7932 (-64 = 1097 + 265 - 1026 - 272); still 1 above vm9 7931.
  // LD13: 7932 -> 7931 (-1 = 1097 + 266 - 1097 - 265); still 1 above vm9 7930.
  // LD14: no change (net-zero wave, 1097 + 266 unchanged); still 1 above vm9 7930.
  // LD15: no change (net-zero wave, 1097 + 266 unchanged); still 1 above vm9 7930.
  // LD16: no change (keepLocal unchanged 7931; 17 tokens partial->fully, 1114 + 249); still 1 above vm9 7930.
  // LD17: 7931 -> 7930 (-1 = 1115 + 249 - 1114 - 249; single-binding token Rx keep->fully); still 1 above vm9 7929.
  // LD18: no change (net-zero wave, 1115 + 249 unchanged); still 1 above vm9 7929.
  // LD19: no change (net-zero wave, 1115 + 249 unchanged); still 1 above vm9 7929.
  // LD20: 7930 -> 7927 (-3 = 1117 + 250 - 1115 - 249; Jb/rwWvECiaAns keep->fully, HX keep->partial); still 1 above vm9 7926.
  // LD21: 7927 -> 7925 (-2 = 1119 + 250 - 1117 - 250; a1M/a1N keep->fully single-binding tokens); still 1 above vm9 7924.
  // LD22: no change (net-zero wave, 1119 + 250 unchanged); still 1 above vm9 7924.
  // LD23: no change (net-zero wave, 1119 + 250 unchanged); still 1 above vm9 7924.
  // LD24: no change (net-zero wave, 1119 + 250 unchanged); still 1 above vm9 7924.
  assert.equal(cov.meta.keepLocal, 7925);
  assert.equal(cov.meta.covered, 11887);
  assert.equal(cov.order.length, 11887);
  assert.equal(cov.meta.bracketDistinct, 2959);
  assert.equal(cov.meta.bracketProtected, 516);
  assert.equal(cov.meta.bracketKeepMap, 23);
  assert.equal(cov.meta.bracketKeep, 2420);
});

test('m6 served lint: differential no-undeclared + keeps + pinned eval', async () => {
  const rep = await lint({});
  assert.deepEqual(rep.errors, [], `lint violations: ${JSON.stringify(rep.errors)}`);
  const notes = rep.notes.join('\n');
  assert.ok(notes.includes('normalized diff 0'), 'L2 differential note missing');
  assert.ok(notes.includes('pinned inert eval site intact'), 'L5 eval note missing');
});

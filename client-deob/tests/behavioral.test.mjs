import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { behavioral, makeAccept, compareAst } from '../tools/behavioral.mjs';
import { verify } from '../tools/verify.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, '..', 'build');
const VM9_PATH = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.deob.txt');
const REBUILT_PATH = path.join(BUILD_DIR, 'vm9.rebuilt.js');
const REPORT_PATH = path.join(BUILD_DIR, 'behavioral-report.json');

const sha256File = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('m4 behavioral: L3 harness passes (B1..B4 green, B5 skip-by-default)', async () => {
  const rep = await behavioral({});
  assert.equal(rep.level, 'L3');
  assert.equal(rep.pass, true);
  assert.equal(rep.sections.b1.status, 'PASS');
  assert.equal(rep.sections.b2.status, 'PASS');
  assert.equal(rep.sections.b3.status, 'PASS');
  assert.equal(rep.sections.b4.status, 'PASS');
  assert.equal(rep.sections.b5.status, 'SKIP');
  // B1 pins the proof it gates on (M3 3081 + b1 4688 + b2 1154 + b3 841 + b4 489 + rv1 321 + b5 522 + b6 637 + rv2 1383 + b7 984 + b8 818 + b9 737 + b10 704 + b11 671 + b12 590 + b13 600 + b14 452 + b15 438 + b16 276 + b17 154 + b18 31 + rv3 3 + rv4 72 + L1P 22 + LA1 5636 + LA2 2854).
  assert.equal(rep.sections.b1.l2Tokens, 789925);
  assert.equal(rep.sections.b1.l2Normalized, 66514);
  assert.equal(rep.sections.b1.renamedTokens, 19646);
  // B2 compared the whole program structure (2.8 MB bundle).
  assert.ok(rep.sections.b2.astNodes > 1000000, `astNodes ${rep.sections.b2.astNodes}`);
  // B3 checked every binding position; cross-checks lint's independent count.
  assert.equal(rep.sections.b3.decls, 21476);
  assert.equal(rep.sections.b3.refs, 123038);
  assert.equal(rep.sections.b3.propUses, 35940);
  // B4 executed the documented wire/math behavior.
  assert.deepEqual(rep.sections.b4.goldens.codecMessages,
    ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P', 'kM86hVW024']);
  for (const w of ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P', 'Math.PI', 'getUint16']) {
    assert.ok(rep.sections.b4.anchors[w] > 0, `anchor ${w} missing`);
  }
  // The written report matches the returned one and the files it fingerprints.
  const onDisk = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  assert.deepEqual(onDisk, JSON.parse(JSON.stringify({ meta: rep.meta, sections: rep.sections, pass: rep.pass })));
  assert.equal(onDisk.meta.sources.vm9.sha256, sha256File(VM9_PATH));
  assert.equal(onDisk.meta.sources.rebuilt.sha256, sha256File(REBUILT_PATH));
  assert.equal(onDisk.meta.renameMap.entries, 2375);
});

test('m4 behavioral: report is deterministic across runs (no timestamps)', async () => {
  const a = await behavioral({});
  const b = await behavioral({});
  assert.equal(JSON.stringify({ meta: a.meta, sections: a.sections, pass: a.pass }),
    JSON.stringify({ meta: b.meta, sections: b.sections, pass: b.pass }));
});

test('m4: verify --level L3 passes through the harness', async () => {
  const r = await verify('L3', {});
  assert.equal(r.level, 'L3');
  assert.equal(r.pass, true);
});

test('m4 behavioral: comparator accepts renames, rejects structural drift', () => {
  const accept = makeAccept(new Map([['localPlayer', new Set(['SW'])]]));
  const parse = (s) => acorn.parse(s, { ecmaVersion: 'latest' });
  const cmp = (a, b) => compareAst(parse(a), parse(b), accept, '$', { nodes: 0 });
  // Identical programs pass.
  cmp('var SW = 1; SW + 2;', 'var SW = 1; SW + 2;');
  // Mapped renames pass (both declaration and reference positions).
  cmp('var SW = 1; SW + 2;', 'var localPlayer = 1; localPlayer + 2;');
  // Unmapped identifier swaps fail loudly (would change behavior).
  assert.throws(() => cmp('var SW = 1;', 'var zorg = 1;'), /B2: identifier/);
  // Set semantics: one new name may map two original tokens (locals phase).
  const accept2 = makeAccept(new Map([['index', new Set(['i', 'a3o'])]]));
  const cmp2 = (a, b) => compareAst(parse(a), parse(b), accept2, '$', { nodes: 0 });
  cmp2('var i = 1; i + 2;', 'var index = 1; index + 2;');
  cmp2('var a3o = 1; a3o + 2;', 'var index = 1; index + 2;');
  assert.throws(() => cmp2('var j = 1;', 'var index = 1;'), /B2: identifier/);
  // Operator changes fail (structure, not spelling).
  assert.throws(() => cmp('a + b;', 'a - b;'), /B2:/);
  // Literal changes fail (computation, not spelling).
  assert.throws(() => cmp('x = 0x40;', 'x = 0x41;'), /B2: literal/);
  // Reordered statements fail (order is semantic).
  assert.throws(() => cmp('a(); b();', 'b(); a();'), /B2:/);
  // Computed-vs-static property access is structural, not spelling.
  assert.throws(() => cmp('o[SW];', 'o.SW;'), /B2:/);
  // NOTE: `o.SW` vs `o.localPlayer` (property-rename spelling) passes at the B2
  // level by design — spelling laxity is B3's domain, which pins all 35,940
  // property uses strictly (rename.mjs never touches property positions).
});

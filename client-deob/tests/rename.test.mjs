import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { verify } from '../tools/verify.mjs';
import { rename } from '../tools/rename.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const VM9_PATH = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.deob.txt');

const map = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-map.json'), 'utf8'));
const renameEntries = map.order.map((t) => map.entries[t]).filter((e) => e.action === 'rename');

test('rename-map: schema valid, 2375 entries (M3 144 + b1-18 2020 + rv1 12 + rv2 146 + rv3 3 + rv4 50; 2342 rename + 33 keep)', () => {
  // Merges: batches 1-17 high/medium (87+67+71+56+64+91+147+148+148+143+150
  // +148+150+148+147+138+86, net of the batch4 faceBufferLength self-rename)
  // + review round 1 (12 adopts; 3 rename-tos change names only) + review
  // round 2 (146 held-low adopts, 5 still held) + batch7 (Tg/XY abstain +
  // rd low held) + batch8 (a1P low + r9 abstain held) + batch9 (Hw/P2
  // abstain held) + batch10 (r0 abstain + ve-vj low held) + batch11 (0
  // held) + batch12 (H4/Mw abstain held) + batch13 (0 held) + batch14
  // (Me/SJ abstain held) + batch15 (Y1 low + a0N/$ abstain held) +
  // batch16 (9 low + Oi/W3/Xv abstain held) + batch17 (64 abstains held).
  // Keeps 33.
  assert.equal(map.order.length, 2375);
  assert.equal(Object.keys(map.entries).length, 2375);
  assert.equal(map.meta.entryCount, 2375);
  assert.equal(map.meta.renameCount, renameEntries.length);
  assert.equal(renameEntries.length, 2342);
  assert.equal(map.meta.keepCount, 33);
  for (const t of map.order) {
    const e = map.entries[t];
    assert.equal(e.token, t);
    assert.ok(/^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(t), `bad token ${t}`);
    assert.ok(['rename', 'keep'].includes(e.action), `bad action ${t}`);
    assert.ok(['global', 'loader', 'string-key', 'local'].includes(e.scope) || e.scope.startsWith('property:'), `bad scope ${t}`);
    assert.ok(typeof e.evidence === 'string' && e.evidence.length > 0, `no evidence ${t}`);
    assert.ok(typeof e.docs === 'string' && e.docs.length > 0, `no docs ${t}`);
    assert.ok(Array.isArray(e.alternates), `no alternates ${t}`);
    if (e.action === 'rename') {
      assert.equal(e.scope, 'global', `M2/M3 support only global renames: ${t}`);
      assert.ok(/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.name), `bad name ${t}`);
    }
  }
  // M3 curation: a3D/a3J/a3v are keep/local (reused minified locals, 25/21/54
  // tied scopes); YGIcYCdrEk is keep/property:Kq (string-only, 0 identifier
  // positions). See data/rename-map.json m3CurationNote.
  for (const tok of ['a3D', 'a3J', 'a3v']) {
    const e = map.entries[tok];
    assert.equal(e.action, 'keep');
    assert.equal(e.scope, 'local');
  }
  assert.equal(map.entries['YGIcYCdrEk'].action, 'keep');
  assert.equal(map.entries['YGIcYCdrEk'].scope, 'property:Kq');
  // No duplicate new names among renames (namespaces are all variable scope).
  const names = renameEntries.map((e) => e.name);
  assert.equal(new Set(names).size, names.length);
});

test('rename-map: protected server anchors are never rename targets', () => {
  for (const p of map.meta.protectedIdentifiers) {
    assert.ok(!renameEntries.some((e) => e.token === p), `${p} must not be renamed`);
  }
});

test('rename report: every entry applied (M3: 0 deferred, curated keeps excluded)', () => {
  const rep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
  assert.equal(Object.values(rep.entries).filter((r) => r.scope !== 'local').length, renameEntries.length);
  assert.equal(rep.totals.deferred, 0);
  const deferred = [];
  for (const e of renameEntries) {
    const r = rep.entries[e.token];
    assert.ok(r, `missing report for ${e.token}`);
    if (r.status === 'deferred-ambiguous') {
      deferred.push(e.token);
      assert.ok(r.tiedScopes >= 2, `${e.token}: tie needs >=2 scopes`);
      assert.ok(r.declCount > 1, `${e.token}: tie needs several declarations`);
    } else {
      assert.equal(r.status, 'applied');
      assert.ok(r.renamed > 0 || (r.declCount === 0 && r.refCount === 0),
        `${e.token}: renamed=0 but identifier positions exist`);
    }
  }
  // M3 curation resolved the M2 deferred set (a3D/a3J/a3v are now keep/local,
  // YGIcYCdrEk is keep/property:Kq): no rename entry defers. Any change here
  // is a conscious future curation decision.
  assert.deepEqual(deferred.sort(), []);
  const sum = Object.values(rep.entries).filter((r) => r.scope !== 'local').reduce((n, r) => n + (r.renamed || 0), 0);
  assert.equal(sum, rep.totals.renamed);
  // M3 3081 + b1 4688 + b2 1154 + b3 841 + b4 489 + rv1 321 + b5 522 + b6 637 + rv2 1383 + b7 984 + b8 818 + b9 737 + b10 704 + b11 671 + b12 590 + b13 600 + b14 452 + b15 438 + b16 276 + b17 154 + b18 31 + rv3 3 + rv4 72.
  assert.equal(sum, 19646);
});

test('rename: sole direct eval is the pinned inert global-access site (no with)', () => {
  const src = fs.readFileSync(VM9_PATH, 'utf8');
  const tz = acorn.tokenizer(src, { ecmaVersion: 'latest' });
  const calls = [];
  let prev = null;
  for (;;) {
    const t = tz.getToken();
    if (t.type === acorn.tokTypes.eof) break;
    if (prev && prev.type === acorn.tokTypes.name) {
      const w = src.slice(prev.start, prev.end);
      if ((w === 'eval' || w === 'with') && t.type.label === '(') {
        calls.push({ w, off: prev.start, ctx: src.slice(prev.start, prev.start + 30) });
      }
    }
    prev = t;
  }
  // Pinned: `var NY=eval('win'+"dow")` — reads the global object, declares and
  // assigns nothing, so scope analysis stays sound. Any further eval/with must
  // force an analysis upgrade (this test fails loudly).
  assert.equal(calls.length, 1);
  assert.equal(calls[0].w, 'eval');
  assert.match(calls[0].ctx, /^eval\('win'\+\"dow\"\)/);
});

test('rename: re-apply on a renamed tree refuses (one-shot migration)', async () => {
  await assert.rejects(rename({}), /already contains renamed/);
});

test('L2: rebuilt bundle matches original modulo the rename map', async () => {
  const r = await verify('L2');
  assert.equal(r.level, 'L2');
  assert.ok(r.tokens > 700000);
});

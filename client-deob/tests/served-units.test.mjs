import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const SERVED_DIR = path.join(__dirname, '..', 'served');
const DATA_DIR = path.join(SERVED_DIR, 'data');
const PKG_PATH = path.join(ROOT, 'raw', 'bundles', 'final.pkg.js');
const CODE_START = 111079;

function loadUnits() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));
}

function servedCode() {
  return fs.readFileSync(PKG_PATH, 'utf8').slice(CODE_START);
}

test('m6 served units: tile the code region with no gaps/overlaps', () => {
  const { meta, units } = loadUnits();
  const code = servedCode();
  assert.equal(meta.corpus, 'served');
  assert.equal(meta.codeStart, CODE_START);
  assert.equal(meta.lengthChars, code.length);
  assert.equal(meta.lengthChars, 2822950);
  assert.equal(units[0].start, 0);
  assert.equal(units[units.length - 1].end, code.length);
  for (let i = 0; i < units.length - 1; i++) {
    assert.equal(units[i].end, units[i + 1].start, `gap at ${units[i].id} -> ${units[i + 1].id}`);
  }
  assert.equal(units.length, meta.count);
  assert.equal(units.length, 2884);
  // rejoin is byte-exact vs the served code region
  const rejoined = units.map((u) => code.slice(u.start, u.end)).join('');
  assert.equal(rejoined.length, code.length);
  assert.equal(rejoined, code);
  assert.equal(Buffer.byteLength(rejoined, 'utf8'), meta.lengthBytes);
});

test('m6 served units: byte offsets are exact UTF-8 (no 2-byte assumption)', () => {
  const { units } = loadUnits();
  const code = servedCode();
  for (const u of units) {
    assert.equal(u.byteStart, Buffer.byteLength(code.slice(0, u.start), 'utf8'), `byteStart ${u.id}`);
    assert.equal(u.byteEnd, Buffer.byteLength(code.slice(0, u.end), 'utf8'), `byteEnd ${u.id}`);
    assert.equal(u.length, u.end - u.start);
  }
});

test('m6 served units: handler table split per entry + single vendor unit', () => {
  const { meta, units } = loadUnits();
  const entries = units.filter((u) => u.kind === 'handler-entry');
  assert.equal(entries.length, meta.handlerEntries);
  assert.equal(entries.length, 49);
  assert.equal(entries[0].handlerKey, 'GDzF2709XA3');
  const vendors = units.filter((u) => u.kind === 'vendor-lib');
  assert.equal(vendors.length, 1);
  assert.equal(vendors[0].module, 'vendor/browserify-lib.js');
  assert.ok(vendors[0].length > 50000);
  // flat corpus: no wrapper units, one big-open/big-close pair, one trailing unit
  const kinds = new Set(units.map((u) => u.kind));
  assert.ok(!kinds.has('wrapper-open') && !kinds.has('wrapper-close'), 'served has no VM9 wrapper');
  assert.equal(units.filter((u) => u.kind === 'big-open').length, 1);
  assert.equal(units.filter((u) => u.kind === 'big-close').length, 1);
  assert.equal(units.filter((u) => u.kind === 'trailing-newline').length, 1);
});

test('m6 served units: ids deterministic, modules assigned', () => {
  const { units } = loadUnits();
  units.forEach((u, i) => assert.equal(u.id, 'u' + String(i).padStart(4, '0')));
  const mods = new Set(units.map((u) => u.module));
  assert.ok(mods.has('sim/game-loop.js'));
  assert.ok(mods.has('network/handlers.js'));
  assert.ok(mods.has('vendor/browserify-lib.js'));
});

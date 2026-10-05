import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UNITS_PATH = path.join(__dirname, '..', 'data', 'units.json');
const VM9_PATH = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.deob.txt');

test('units: tile [0, len) with no gaps/overlaps', () => {
  const { meta, units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');
  assert.equal(meta.lengthChars, vm9.length);
  assert.equal(units[0].start, 0);
  assert.equal(units[units.length - 1].end, vm9.length);
  for (let i = 0; i < units.length - 1; i++) {
    assert.equal(units[i].end, units[i + 1].start, `gap at ${units[i].id} -> ${units[i + 1].id}`);
    assert.deepEqual(units[i].range, [units[i].start, units[i].end]);
  }
});

test('units: concatenate to byte-exact original', () => {
  const { units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');
  const rejoined = units.map((u) => vm9.slice(u.start, u.end)).join('');
  assert.equal(rejoined.length, vm9.length);
  assert.equal(rejoined, vm9);
  // byte-level check (file has 16 non-ASCII chars => +16 bytes in UTF-8)
  const vm9Bytes = fs.statSync(VM9_PATH).size;
  assert.equal(Buffer.byteLength(rejoined, 'utf8'), vm9Bytes);
});

test('units: handler table split per entry + single vendor unit', () => {
  const { meta, units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const entries = units.filter((u) => u.kind === 'handler-entry');
  assert.equal(entries.length, meta.handlerEntries);
  assert.ok(entries.length >= 40, `expected ~49 handler entries, got ${entries.length}`);
  // handler keys are message names, first one is the join message
  assert.equal(entries[0].handlerKey, 'GDzF2709XA3');
  const vendors = units.filter((u) => u.kind === 'vendor-lib');
  assert.equal(vendors.length, 1);
  assert.equal(vendors[0].module, 'vendor/browserify-lib.js');
  assert.ok(vendors[0].length > 50000);
  // wrapper framing exists
  const kinds = new Set(units.map((u) => u.kind));
  for (const k of ['wrapper-open', 'wrapper-close', 'big-open', 'big-close', 'handler-prefix', 'handler-suffix']) {
    assert.ok(kinds.has(k), `missing kind ${k}`);
  }
});

test('units: ids deterministic, modules assigned', () => {
  const { units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  units.forEach((u, i) => assert.equal(u.id, 'u' + String(i).padStart(4, '0')));
  for (const u of units) {
    assert.ok(typeof u.module === 'string' && u.module.endsWith('.js'), `${u.id} bad module`);
    assert.ok(Array.isArray(u.exports));
  }
});

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

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'));
}

test('m6 served manifest: 656 names / 13349 anchors, hints resolve in served code', () => {
  const man = loadManifest();
  assert.equal(man.meta.corpus, 'served');
  assert.equal(man.meta.names, 656);
  assert.equal(man.meta.anchors, 13349);
  assert.equal(man.meta.codeStart, 111079);
  assert.equal(man.order.length, 656);
  assert.equal(Object.keys(man.symbols).length, 656);
  const total = man.order.reduce((n, k) => n + man.symbols[k].hint.length, 0);
  assert.equal(total, 13349);
  assert.equal(man.meta.checkedHints, 13349);
  assert.ok(man.meta.maxHintDelta <= 200, `maxDelta ${man.meta.maxHintDelta} > 200`);
  assert.equal(man.meta.allHintsWithinWindow, true);
  // measuredPkg is the served-code occurrence scan (code-relative).
  assert.equal(man.meta.measuredPkgTotal, 13349);
});

test('m6 served manifest: zero-anchor names have no occurrences anywhere', () => {
  const man = loadManifest();
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  const code = pkg.slice(man.meta.codeStart);
  let zero = 0;
  for (const name of man.order) {
    const s = man.symbols[name];
    if (s.hint.length === 0) {
      zero++;
      assert.equal(s.measuredPkg.length, 0, `${name} has empty hints but occurs in served code`);
    }
  }
  assert.equal(zero, 49);
  void code;
});

test('m6 served manifest: hint spots resolve within ±200 chars in served code', () => {
  const man = loadManifest();
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  const code = pkg.slice(man.meta.codeStart);
  // spot-check every 53rd hinted name (full check lives in extract, rebuilds it).
  let checked = 0;
  for (let i = 0; i < man.order.length; i += 53) {
    const name = man.order[i];
    const s = man.symbols[name];
    if (s.hint.length === 0) continue;
    for (const h of s.hint) {
      const window = code.slice(Math.max(0, h - 200), h + 200 + name.length);
      assert.ok(window.includes(name), `${name}@${h} resolves nowhere near`);
      checked++;
    }
  }
  assert.ok(checked > 100, `too few spots checked: ${checked}`);
});

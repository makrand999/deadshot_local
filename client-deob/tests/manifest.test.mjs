import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'manifest.json');
const PKG_PATH = path.join(__dirname, '..', '..', 'raw', 'bundles', 'final.pkg.js');

test('manifest: 656 names / 13349 anchors', () => {
  const man = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assert.equal(man.meta.names, 656);
  assert.equal(man.meta.anchors, 13349);
  assert.equal(man.order.length, 656);
  assert.equal(Object.keys(man.symbols).length, 656);
  const total = man.order.reduce((n, k) => n + man.symbols[k].hint.length, 0);
  assert.equal(total, 13349);
});

test('manifest: hints are hints, measured positions are exact', () => {
  const man = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  assert.ok(man.meta.maxHintDelta <= 200, `maxDelta ${man.meta.maxHintDelta} > 200`);
  assert.equal(man.meta.checkedHints, 13349);
  // Spot-check: FRF6 first hint resolves within window of a real token
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  const codeStart = man.meta.codeStart;
  for (const name of ['FRF6r51VY32', 'usvzFuAsEB']) {
    const s = man.symbols[name];
    assert.ok(s.hint.length > 0);
    assert.ok(s.measuredPkg.length > 0);
    for (const h of s.hint.slice(0, 3)) {
      const abs = codeStart + h;
      const window = pkg.slice(Math.max(codeStart, abs - 200), abs + 200 + name.length);
      assert.ok(window.includes(name), `${name} hint ${h} has no nearby token`);
    }
    // measured positions must be exact occurrences
    const code = pkg.slice(codeStart);
    for (const m of s.measuredPkg.slice(0, 3)) {
      assert.equal(code.slice(m, m + name.length), name);
    }
  }
});

test('manifest: zero-hint placeholders stay empty', () => {
  const man = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const s = man.symbols['li6352N4H8u'];
  assert.ok(s);
  assert.equal(s.hint.length, 0);
  assert.equal(s.measuredPkg.length, 0);
});

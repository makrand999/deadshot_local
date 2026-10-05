import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const VM9_PATH = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.deob.txt');
const REBUILT_PATH = path.join(BUILD_DIR, 'vm9.rebuilt.js');

function countQuoted(hay, tok) {
  let n = 0;
  for (const q of [`'${tok}'`, `"${tok}"`]) {
    let i = 0;
    for (;;) {
      i = hay.indexOf(q, i);
      if (i < 0) break;
      n++;
      i += q.length;
    }
  }
  return n;
}
function countWords(hay, tok) {
  const re = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  let n = 0;
  while (re.exec(hay) !== null) n++;
  return n;
}

test('protected: wire strings + settings category survive renames byte-identical', () => {
  const orig = fs.readFileSync(VM9_PATH, 'utf8');
  const rebuilt = fs.readFileSync(REBUILT_PATH, 'utf8');
  // PLAN Phase B.3 named anchors (settings category doubles as wire string).
  for (const w of ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P']) {
    assert.equal(countQuoted(rebuilt, w), countQuoted(orig, w), `string '${w}' count changed`);
    assert.ok(countQuoted(orig, w) > 0, `string '${w}' missing from original (bad test?)`);
  }
});

test('protected: server patch-anchor identifiers keep their names', () => {
  const map = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-map.json'), 'utf8'));
  const orig = fs.readFileSync(VM9_PATH, 'utf8');
  const rebuilt = fs.readFileSync(REBUILT_PATH, 'utf8');
  for (const p of map.meta.protectedIdentifiers) {
    assert.ok(!map.order.some((t) => map.entries[t].action === 'rename' && map.entries[t].token === p));
    assert.equal(countWords(rebuilt, p), countWords(orig, p), `identifier ${p} count changed`);
  }
});

test('protected: rebuilt bundle carries no emit markers or scaffolding', () => {
  const rebuilt = fs.readFileSync(REBUILT_PATH, 'utf8');
  assert.ok(!rebuilt.includes('// __UNIT__'), 'emit marker leaked into bundle');
  assert.ok(!rebuilt.includes('GENERATED from'), 'emit header leaked into bundle');
});

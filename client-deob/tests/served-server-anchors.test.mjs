import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverAnchors } from '../tools/server-anchors.mjs';

process.env.DS_CORPUS = 'served';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const SERVED_DIR = path.join(__dirname, '..', 'served');
const SRC_DIR = path.join(SERVED_DIR, 'src');
const BUILD_DIR = path.join(SERVED_DIR, 'build');
const REPORT_PATH = path.join(BUILD_DIR, 'server-anchors.json');

function loadReport() {
  return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
}

test('m6 served server-anchors: report exists and is fresh (deterministic)', () => {
  assert.ok(fs.existsSync(REPORT_PATH), 'run npm run anchors:served first');
  const onDisk = fs.readFileSync(REPORT_PATH, 'utf8');
  const fresh = serverAnchors({ writeReport: false });
  assert.equal(JSON.stringify(fresh, null, 2) + '\n', onDisk, 'report is stale or nondeterministic');
});

test('m6 served server-anchors: E1 counts + lineage drift sets (corpus-independent facts)', () => {
  const r = loadReport();
  assert.equal(r.meta.corpus, 'served');
  assert.equal(r.meta.decision, 'E1');
  assert.equal(r.meta.counts.bundle, 31);
  assert.equal(r.meta.counts.page, 2);
  assert.deepEqual(r.summary.vm9Missing, [
    'autoreload', 'kick', 'ray', 'reload', 'xhair-p1', 'xhair-p5', 'xhair-p6',
  ]);
  assert.deepEqual(r.summary.servedMissing, [
    'ui-ch1', 'ui-ch3', 'ui-discord', 'ui-nav', 'ui-terms',
  ]);
  assert.deepEqual(r.summary.pageMissing, []);
});

test('m6 served server-anchors: every served-present anchor maps into served/src', () => {
  const r = loadReport();
  for (const a of r.anchors) {
    if (a.kind !== 'bundle' || !a.served.present) continue;
    assert.equal(a.modules.length, 1, `${a.id} maps to ${a.modules.length} modules`);
    assert.ok(fs.existsSync(path.join(SRC_DIR, a.modules[0])), `${a.id}: src/${a.modules[0]} missing`);
  }
  for (const m of r.summary.modules) {
    assert.ok(fs.existsSync(path.join(SRC_DIR, m)), `module file missing: served/src/${m}`);
  }
  // E2-critical gameplay anchors land in navigable subsystems on the NEW tree.
  const mods = (id) => r.anchors.find((a) => a.id === id).modules;
  assert.deepEqual(mods('chat'), ['network/handlers.js']);
  assert.deepEqual(mods('joinparty'), ['network/matchmaker.js']);
  assert.deepEqual(mods('wm'), ['sim/input.js']);
  assert.deepEqual(mods('reload'), ['world/weapons.js']);
  assert.deepEqual(mods('ray'), ['combat/fire.js']);
  // renamed-token cross-reference still resolves on the served tree.
  const tok = (id, name) => r.anchors.find((a) => a.id === id).tokens.find((t) => t.token === name);
  assert.equal(tok('phys', 'SW').map.name, 'localPlayer');
  assert.equal(tok('pospatch', 'J3').map.name, 'templatesLive');
});

test('m6 served server-anchors: transcription guard covers all anchors', () => {
  const r = loadReport();
  const server = fs.readFileSync(path.join(ROOT, 'gameplay', 'server', 'src', 'gameplay-server.mjs'), 'utf8');
  assert.equal(new Set(r.anchors.map((a) => a.id)).size, 33);
  assert.ok(server.includes("if(!Gj){a8z['add'](Mj(a3k,'Latest"));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { serverAnchors } from '../tools/server-anchors.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SRC_DIR = path.join(__dirname, '..', 'src');
const REPORT_PATH = path.join(BUILD_DIR, 'server-anchors.json');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function loadReport() {
  return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
}

test('m5: server-anchors report exists and is fresh (deterministic re-run matches)', () => {
  assert.ok(fs.existsSync(REPORT_PATH), 'run node tools/server-anchors.mjs first (npm run anchors)');
  const onDisk = fs.readFileSync(REPORT_PATH, 'utf8');
  const fresh = serverAnchors({ writeReport: false });
  assert.equal(JSON.stringify(fresh, null, 2) + '\n', onDisk, 'report is stale or nondeterministic');
});

test('m5: E1 decision recorded with 31 bundle + 2 page anchors', () => {
  const r = loadReport();
  assert.equal(r.meta.decision, 'E1');
  assert.equal(r.meta.counts.bundle, 31);
  assert.equal(r.meta.counts.page, 2);
  assert.equal(r.anchors.length, 33);
  assert.equal(r.meta.renameMap.entries, 144);
});

test('m5: lineage drift pinned — 7 served gameplay anchors absent from VM9 (E2 rejected)', () => {
  const r = loadReport();
  assert.deepEqual(r.summary.vm9Missing, [
    'autoreload', 'kick', 'ray', 'reload', 'xhair-p1', 'xhair-p5', 'xhair-p6',
  ]);
  assert.equal(r.summary.vm9Present, 24);
  // every VM9-missing anchor is present in the served build (drift, not dead code)
  for (const id of r.summary.vm9Missing) {
    const a = r.anchors.find((x) => x.id === id);
    assert.ok(a.served.present, `${id} missing from BOTH lineages (transcription error?)`);
  }
});

test('m5: 5 stale UI anchors pinned — match VM9 but silently skip on served', () => {
  const r = loadReport();
  assert.deepEqual(r.summary.servedMissing, [
    'ui-ch1', 'ui-ch3', 'ui-discord', 'ui-nav', 'ui-terms',
  ]);
  assert.equal(r.summary.servedPresent, 26);
  for (const id of r.summary.servedMissing) {
    const a = r.anchors.find((x) => x.id === id);
    assert.ok(a.vm9.present, `${id} missing from BOTH lineages (transcription error?)`);
  }
  assert.deepEqual(r.summary.pageMissing, []);
  assert.equal(r.summary.pagePresent, 2);
});

test('m5: every anchor literal is transcribed from the server source (no drift)', () => {
  const r = loadReport();
  const server = fs.readFileSync(path.join(ROOT, 'gameplay', 'server', 'src', 'gameplay-server.mjs'), 'utf8');
  assert.equal(new Set(r.anchors.map((a) => a.id)).size, 33, 'duplicate anchor ids');
  for (const a of r.anchors) {
    assert.ok(a.serverParts >= 1, `${a.id} has no serverParts guard`);
    assert.ok(a.serverRef.startsWith('gameplay/server/src/gameplay-server.mjs:L'), `${a.id} bad serverRef`);
  }
  // spot-check a _BS-constructed and a _Q-constructed anchor against server source halves
  assert.ok(server.includes("if(!Gj){a8z['add'](Mj(a3k,'Latest"));
  assert.ok(server.includes('a6h[' + "'add'](a6g),Mm['add'](a6h),Kq["));
});

test('m5: rename-map cross-reference is consistent (renamed tokens resolve, wire anchors kept)', () => {
  const r = loadReport();
  const byId = new Map(r.anchors.map((a) => [a.id, a]));
  const tok = (id, name) => byId.get(id).tokens.find((t) => t.token === name);
  assert.deepEqual(tok('phys', 'SW').map, { action: 'rename', name: 'localPlayer', scope: 'global' });
  assert.deepEqual(tok('phys', 'V3').map, { action: 'rename', name: 'entityList', scope: 'global' });
  assert.deepEqual(tok('pospatch', 'J3').map.action, 'rename');
  assert.equal(tok('pospatch', 'J3').map.name, 'templatesLive');
  assert.deepEqual(tok('ui-ch2', 'Kq').map.name, 'partyController');
  // protected server-anchor identifiers are never renamed anywhere
  for (const a of r.anchors) {
    for (const t of a.tokens) {
      if (t.token === 'Gq' || t.token === 'EnJV2g') {
        assert.ok(!t.map || t.map.action !== 'rename', `${a.id}: protected ${t.token} renamed`);
      }
    }
  }
  // every renamed token referenced by an anchor is a real rename-map entry
  assert.ok(r.summary.renamedTokens.length >= 10, 'expected >=10 renamed tokens referenced');
  assert.ok(r.summary.renamedTokens.includes('SW->localPlayer'));
  assert.ok(r.summary.renamedTokens.includes('Kq->partyController'));
});

test('m5: anchor modules all exist in src/ (reference stays navigable)', () => {
  const r = loadReport();
  assert.ok(r.summary.modules.length >= 5, 'expected anchors across >=5 modules');
  for (const m of r.summary.modules) {
    assert.ok(fs.existsSync(path.join(SRC_DIR, m)), `module file missing: src/${m}`);
  }
  // gameplay-critical anchors land in navigable subsystems (verified offsets)
  const mods = (id) => r.anchors.find((a) => a.id === id).modules;
  assert.deepEqual(mods('chat'), ['network/handlers.js'], 'chat splice should map to the handler table');
  assert.deepEqual(mods('joinparty'), ['network/matchmaker.js'], 'joinParty validation should map to matchmaker');
  assert.deepEqual(mods('wm'), ['sim/input.js'], 'WM input-loop hook should map to input');
});

test('m5: E1 corpus invariants — served is the shipped gzip, VM9 has no manifest', () => {
  const r = loadReport();
  const pkg = fs.readFileSync(path.join(ROOT, 'raw', 'bundles', 'final.pkg.js'));
  const gz = fs.readFileSync(path.join(ROOT, 'raw', 'bundles', 'final.pkg.gz'));
  const vm9 = fs.readFileSync(path.join(ROOT, 'raw', 'bundles', 'VM9.deob.txt'), 'utf8');
  assert.equal(sha256(zlib.gunzipSync(gz)), sha256(pkg), 'served gzip !== final.pkg.js');
  assert.equal(r.meta.sources.served.sha256, sha256(pkg));
  assert.equal(r.meta.sources.gz.sha256, sha256(gz));
  assert.ok(pkg.toString('utf8').startsWith('FRF6r51VY32:'), 'served bundle should start with the manifest block');
  assert.ok(vm9.startsWith('(function anonymous('), 'VM9 should start with the wrapper (no manifest)');
});

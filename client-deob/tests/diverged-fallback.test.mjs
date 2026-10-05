import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Diverged-fallback (LD waves) invariants: snippet-only diverged renames carry
// per-lineage fingerprints and apply on both sides with zero divergence.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SERVED_BUILD_DIR = path.join(__dirname, '..', 'served', 'build');

const lmap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-locals.json'), 'utf8'));
const vm9c = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'local-bindings.json'), 'utf8'));
const svc = JSON.parse(fs.readFileSync(path.join(SERVED_BUILD_DIR, 'local-bindings.json'), 'utf8'));
const vrep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
const srep = JSON.parse(fs.readFileSync(path.join(SERVED_BUILD_DIR, 'rename-report.json'), 'utf8'));

const divEntries = Object.entries(lmap.entries).filter(([, e]) => e.divClass === 'snippet-only');
const findBinding = (census, unit, token, index) => census.units?.[unit]?.tokens?.[token]?.[index];

test('diverged fallback: snippet-only entries carry per-lineage fingerprints', () => {
  assert.ok(divEntries.length > 0, 'expected at least one snippet-only entry (LD1 merged 175)');
  for (const [sel, e] of divEntries) {
    assert.ok(e.bindingServed, `${sel} missing bindingServed`);
    assert.equal(e.bindingServed.unit, e.binding.unit, `${sel} unit drift`);
    assert.equal(e.bindingServed.index, e.binding.index, `${sel} index drift`);
    assert.equal(e.bindingServed.refCount, e.binding.refCount, `${sel} refCount drift`);
    assert.notEqual(e.bindingServed.snippet, e.binding.snippet, `${sel} not actually diverged`);
  }
});

test('diverged fallback: per-lineage fingerprints match both censuses', () => {
  for (const [sel, e] of divEntries) {
    const [, token, unit, idxStr] = /^(.+)@(u\d+)#(\d+)$/.exec(sel);
    const index = Number(idxStr);
    const v = findBinding(vm9c, unit, token, index);
    const s = findBinding(svc, unit, token, index);
    assert.ok(v, `${sel} missing from vm9 census`);
    assert.ok(s, `${sel} missing from served census`);
    assert.equal(v.refCount, e.binding.refCount, `${sel} vm9 refCount`);
    assert.equal(v.snippet, e.binding.snippet, `${sel} vm9 snippet`);
    assert.equal(s.refCount, e.bindingServed.refCount, `${sel} served refCount`);
    assert.equal(s.snippet, e.bindingServed.snippet, `${sel} served snippet`);
  }
});

test('diverged fallback: entries applied on both sides with zero divergence', () => {
  const vent = Array.isArray(vrep.entries) ? vrep.entries : Object.entries(vrep.entries).map(([selector, r]) => ({ selector, ...r }));
  const sent = Array.isArray(srep.entries) ? srep.entries : Object.entries(srep.entries).map(([selector, r]) => ({ selector, ...r }));
  for (const [sel, e] of divEntries) {
    const v = vent.find((x) => x.selector === sel);
    const s = sent.find((x) => x.selector === sel);
    assert.ok(v, `${sel} missing from vm9 rename report`);
    assert.ok(s, `${sel} missing from served rename report`);
    assert.ok((v.renamed || 0) > 0, `${sel} zero-renamed on vm9`);
    assert.ok((s.renamed || 0) > 0, `${sel} zero-renamed on served`);
    assert.equal(s.renamed, v.renamed, `${sel} lineage divergence`);
  }
});

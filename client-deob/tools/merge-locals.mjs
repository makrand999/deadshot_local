// Merge locals proposals (wave N) into data/rename-locals.json.
// Usage: node tools/merge-locals.mjs [--wave N]
// Reads data/rename-locals-prop-slice-*.json + slices + both censuses,
// validates every proposal, writes data/rename-locals-batch<N>.json
// (all proposals with dispositions) and appends merged entries to
// data/rename-locals.json (existing entries preserved; re-runs skip them).
// Same-scope / capture hazards are NOT decided here: run
// `node tools/rename.mjs --dry-run` afterwards and hold whatever it rejects.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : def;
};
const WAVE = opt('--wave', 1);

const RESERVED = new Set(
  ('break case catch class const continue debugger default delete do else export extends ' +
    'finally for function if import in instanceof new return super switch this throw try ' +
    'typeof var void while with yield let static enum await implements interface package ' +
    'private protected public null true false').split(' ')
);
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const slices = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `locals-wave${WAVE}-slices.json`), 'utf8'));
const vm9c = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'local-bindings.json'), 'utf8'));
const svc = JSON.parse(fs.readFileSync(path.join(ROOT, 'served', 'build', 'local-bindings.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rename-map.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'manifest.json'), 'utf8'));
const locals = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rename-locals.json'), 'utf8'));

const mapKeys = new Set(Object.keys(map.entries || {}));
const mapVals = new Set(Object.values(map.entries || {}).map((e) => e.name));
const localNames = new Set(Object.values(locals.entries || {}).map((e) => e.name));
const wireSet = new Set(manifest.order || []);
const protectedIds = new Set(map.meta.protectedIdentifiers || []);

const findBinding = (census, unit, token, index) => {
  const u = census.units?.[unit];
  if (!u) return null;
  const arr = u.tokens?.[token];
  if (!arr || !arr[index]) return null;
  return arr[index];
};

const out = [];
const missingFiles = [];
for (const sl of slices.slices) {
  // Wave-aware names (w2+); wave 1 used the unprefixed form.
  let f = path.join(ROOT, 'data', `rename-locals-prop-w${WAVE}-${sl.id}.json`);
  if (WAVE === 1 || !fs.existsSync(f)) f = path.join(ROOT, 'data', `rename-locals-prop-${sl.id}.json`);
  if (!fs.existsSync(f)) { missingFiles.push(sl.id); continue; }
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const x of p.proposals || []) out.push({ ...x, slice: sl.id });
}

const batch = [];
let merged = 0, heldLow = 0, heldInvalid = 0, kept = 0, skippedDone = 0;
for (const x of out) {
  const rec = { ...x, disposition: null, reason: null };
  const m = /^(.+)@(u\d+)#(\d+)$/.exec(x.selector || '');
  if (x.action === 'keep') {
    // Keeps are inert, but their selectors must still resolve: a malformed
    // keep selector (LA5 slice-04 dropped the unit id) corrupts the batch
    // audit trail and hides proposer bugs.
    const [, ktok, kunit, kidx] = m || [];
    if (!m || !findBinding(vm9c, kunit, ktok, Number(kidx))) {
      rec.disposition = 'held-invalid'; rec.reason = 'keep selector does not resolve'; heldInvalid++;
    } else {
      rec.disposition = 'keep';
      kept++;
    }
  } else if (!m) {
    rec.disposition = 'held-invalid'; rec.reason = 'bad selector format'; heldInvalid++;
  } else if (locals.entries[x.selector]) {
    rec.disposition = 'already-merged'; rec.reason = 'present in rename-locals.json'; skippedDone++;
  } else {
    const [, token, unit, idxStr] = m;
    const index = Number(idxStr);
    const v = findBinding(vm9c, unit, token, index);
    const s = findBinding(svc, unit, token, index);
    const bad =
      !v ? 'no vm9 census binding' :
      !s ? 'no served census binding' :
      v.redeclOf !== -1 ? 'redeclOf!=−1 (not first-per-scope)' :
      v.globalTarget ? 'globalTarget (handled by global entry)' :
      v.refCount !== s.refCount ? 'served refCount diverged' :
      x.name === token ? 'self-rename' :
      !IDENT.test(x.name) ? 'invalid identifier' :
      RESERVED.has(x.name) ? 'reserved word' :
      wireSet.has(x.name) ? 'wire symbol' :
      protectedIds.has(x.name) ? 'protected server anchor' :
      protectedIds.has(token) ? 'protected server anchor token (must keep name)' :
      v.hasShorthand ? 'shorthand property use (engine cannot expand)' :
      mapKeys.has(x.name) || mapVals.has(x.name) ? 'collides with rename-map key/value' :
      null;
    if (bad) {
      rec.disposition = 'held-invalid'; rec.reason = bad; heldInvalid++;
    } else if (x.confidence === 'low') {
      rec.disposition = 'held-low'; rec.reason = 'low confidence: held for review'; heldLow++;
    } else {
      rec.disposition = 'merged';
      rec.token = token;
      rec.binding = { unit, index, refCount: v.refCount, snippet: v.snippet };
      if (v.snippet !== s.snippet) {
        // Snippet-only divergence (LD waves): same binding + refCount, shifted
        // context bytes. The rename engine asserts per-lineage fingerprints.
        rec.divClass = 'snippet-only';
        rec.bindingServed = { unit, index, refCount: s.refCount, snippet: s.snippet };
      }
      merged++;
    }
  }
  batch.push(rec);
}

// Append merged entries to rename-locals.json.
let added = 0;
for (const r of batch) {
  if (r.disposition !== 'merged' || locals.entries[r.selector]) continue;
  const [, token] = /^(.+)@u\d+#\d+$/.exec(r.selector);
  locals.entries[r.selector] = {
    token, name: r.name, scope: 'local', action: 'rename',
    binding: r.binding,
    ...(r.bindingServed ? { bindingServed: r.bindingServed, divClass: r.divClass } : {}),
    evidence: `batch L1 wave${WAVE} [${r.confidence}]${r.divClass ? ` [${r.divClass}]` : ''}: ${r.evidence}`,
    docs: `data/rename-locals-prop-${WAVE === 1 ? '' : `w${WAVE}-`}${r.slice}.json`,
  };
  locals.order.push(r.selector);
  added++;
}
const entries = Object.values(locals.entries);
locals.meta = {
  ...locals.meta,
  entryCount: entries.length,
  renameCount: entries.filter((e) => e.action === 'rename').length,
  keepCount: entries.filter((e) => e.action !== 'rename').length,
};

fs.writeFileSync(
  path.join(ROOT, 'data', `rename-locals-batch${WAVE}.json`),
  JSON.stringify({ meta: { generatedBy: 'client-deob/tools/merge-locals.mjs', wave: WAVE, date: new Date().toISOString().slice(0, 10), merged, heldLow, heldInvalid, kept, skippedDone, missingFiles }, proposals: batch }, null, 1) + '\n'
);
fs.writeFileSync(path.join(ROOT, 'data', 'rename-locals.json'), JSON.stringify(locals, null, 1) + '\n');
console.log(`wave${WAVE} merge: merged=${merged} heldLow=${heldLow} heldInvalid=${heldInvalid} keep=${kept} alreadyDone=${skippedDone} missingFiles=${missingFiles.length ? missingFiles.join(',') : 'none'} added=${added}`);
for (const r of batch.filter((b) => b.disposition === 'held-invalid')) {
  console.log(`  INVALID ${r.selector} -> ${r.name}: ${r.reason}`);
}

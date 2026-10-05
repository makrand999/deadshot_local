// Per-binding context dossiers for locals proposers.
// Usage: node tools/local-dossier.mjs [--wave N]
// Reads data/locals-wave<N>-slices.json + data/units.json + raw VM9 text,
// writes data/locals-wave<N>-dossier-slice-NN.txt (one per slice).
// Each binding section carries a DECL window + nearest USE windows so a
// proposer can decide rename/keep with ~2 file reads instead of ~200 greps.
// Windows come from the ORIGINAL VM9 text (offsets valid; global identifiers
// appear cryptic — resolve via data/rename-map.json when needed).
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

const slices = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `locals-wave${WAVE}-slices.json`), 'utf8'));
const { units } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'units.json'), 'utf8'));
const byId = new Map(units.map((u) => [u.id, u]));
const vm9 = fs.readFileSync(path.join(ROOT, '..', 'raw', 'bundles', 'VM9.deob.txt'), 'utf8');
// Served side (LD waves): final.pkg.js code region (code-relative offsets match
// served/data/units.json and the served census declInner values).
const CODE_ANCHOR = ';var battle_royale_enabled=false;';
const pkgText = fs.readFileSync(path.join(ROOT, '..', 'raw', 'bundles', 'final.pkg.js'), 'utf8');
const servedText = pkgText.slice(pkgText.indexOf(CODE_ANCHOR));
const { units: servedUnits } = JSON.parse(fs.readFileSync(path.join(ROOT, 'served', 'data', 'units.json'), 'utf8'));
const servedById = new Map(servedUnits.map((u) => [u.id, u]));

const esc = (s) => s.replace(/\r/g, '').replace(/[^\x20-\x7E\n\t]/g, '?');
function window(raw, at, before, after, maxLines = 25) {
  let s = esc(raw.slice(Math.max(0, at - before), at + after));
  const lines = s.split('\n');
  if (lines.length > maxLines) {
    s = [...lines.slice(0, 14), `[...${lines.length - 19} lines elided...]`, ...lines.slice(-5)].join('\n');
  }
  return s.split('\n').map((l) => (l.length > 600 ? l.slice(0, 600) + '[...line truncated...]' : l)).join('\n');
}

let located = 0, unlocated = 0, servedLocated = 0, servedUnlocated = 0;
const rawCache = new Map();
const unitRaw = (uid) => {
  if (!rawCache.has(uid)) {
    const u = byId.get(uid);
    rawCache.set(uid, vm9.slice(u.start, u.end));
  }
  return rawCache.get(uid);
};
const servedRawCache = new Map();
const servedUnitRaw = (uid) => {
  if (!servedRawCache.has(uid)) {
    const u = servedById.get(uid);
    servedRawCache.set(uid, servedText.slice(u.start, u.end));
  }
  return servedRawCache.get(uid);
};

for (const sl of slices.slices) {
  const out = [];
  const nDiv = sl.bindings.filter((b) => b.divClass).length;
  out.push(`# DOSSIER ${sl.id} (wave ${WAVE}, ${sl.bindings.length} bindings${nDiv ? `, ${nDiv} DIVERGED snippet-only` : ''})`);
  out.push('# Conventions: windows are char-slices of ORIGINAL VM9 unit text; @ = unit-relative offset.');
  out.push('# Globals appear CRYPTIC here (pre-rename); resolve via data/rename-map.json if needed.');
  out.push(nDiv
    ? '# DIVERGED wave: bindings marked [DIVERGED snippet-only] carry SERVED-side DECL+USES too — same binding, shifted context bytes. Verify the role on BOTH sides before renaming.'
    : '# Served twin is fingerprint-identical for every binding in this wave (agree-only).');
  out.push('# Decide RENAME (cryptic, role clear) or KEEP (idiomatic/already-readable) per binding.');
  sl.bindings.forEach((b, k) => {
    const raw = unitRaw(b.selector.split('@')[1].split('#')[0]);
    out.push('='.repeat(78));
    out.push(`[${k + 1}/${sl.bindings.length}] ${b.selector} | kind=${b.kind} depth=${b.depth} refCount=${b.refCount} | ${b.module}${b.divClass ? ' [DIVERGED snippet-only]' : ''}`);
    // Verify decl offset via census snippet fingerprint.
    const probe = raw.slice(Math.max(0, b.declInner - 100), b.declInner + 60).replace(/\s+/g, ' ');
    const ok = probe === b.snippet;
    if (ok) located++; else unlocated++;
    out.push(`DECL @${b.declInner} (${ok ? 'verified' : 'UNLOCATED - spot-check ' + b.srcFile}):`);
    out.push(window(raw, b.declInner, 600, 600));
    // Use sites: token occurrences nearest the decl.
    const re = new RegExp(`\\b${b.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const hits = [];
    let m;
    while ((m = re.exec(raw)) !== null) hits.push(m.index);
    hits.sort((a, c) => Math.abs(a - b.declInner) - Math.abs(c - b.declInner));
    const show = hits.filter((h) => Math.abs(h - b.declInner) > 600).slice(0, 8);
    out.push(`USES: refCount=${b.refCount}, ${hits.length} token-occurrences in unit, showing ${show.length} nearest outside DECL window:`);
    for (const h of show) out.push(`@${h}: ${window(raw, h, 250, 250, 8).split('\n').join(' | ')}`);
    if (b.divClass) {
      // Served twin: same binding, shifted context bytes. Narrower windows
      // (diverged dossiers run ~2x the size already).
      const sraw = servedUnitRaw(b.selector.split('@')[1].split('#')[0]);
      const sprobe = sraw.slice(Math.max(0, b.servedDeclInner - 100), b.servedDeclInner + 60).replace(/\s+/g, ' ');
      const sok = sprobe === b.servedSnippet;
      if (sok) servedLocated++; else servedUnlocated++;
      out.push(`SERVED DECL @${b.servedDeclInner} (${sok ? 'verified' : 'UNLOCATED - role from vm9 side only'}), servedRefCount=${b.servedRefCount}:`);
      out.push(window(sraw, b.servedDeclInner, 400, 400));
      const sre = new RegExp(`\\b${b.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const shits = [];
      let sm;
      while ((sm = sre.exec(sraw)) !== null) shits.push(sm.index);
      shits.sort((a, c) => Math.abs(a - b.servedDeclInner) - Math.abs(c - b.servedDeclInner));
      const sshow = shits.filter((h) => Math.abs(h - b.servedDeclInner) > 400).slice(0, 4);
      out.push(`SERVED USES: ${shits.length} token-occurrences in unit, showing ${sshow.length} nearest outside DECL window:`);
      for (const h of sshow) out.push(`@${h}: ${window(sraw, h, 200, 200, 6).split('\n').join(' | ')}`);
    }
  });
  out.push('='.repeat(78));
  out.push(`END ${sl.id}: propose EVERY binding above.`);
  const p = path.join(ROOT, 'data', `locals-wave${WAVE}-dossier-${sl.id}.txt`);
  fs.writeFileSync(p, out.join('\n') + '\n');
}
console.log(`wave${WAVE} dossiers: ${slices.slices.length} files, decl located=${located} unlocated=${unlocated} servedLocated=${servedLocated} servedUnlocated=${servedUnlocated}`);
if (unlocated > 0 || servedUnlocated > 0) process.exitCode = 1;

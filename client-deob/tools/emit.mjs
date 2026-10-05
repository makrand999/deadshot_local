// client-deob/tools/emit.mjs — Phase C (PLAN §3 Phase C, M1 split-only pass)
//
// Reads:  ../data/units.json (canonical emission order + module placement, from M0)
//         ../../raw/bundles/VM9.deob.txt (source slices, never modified)
// Writes: ../src/<module>.js — one file per feature, obfuscated names KEPT (no renaming in M1)
//         ../src/index.js    — emission-order manifest (no unit bodies; ignored by bundle.mjs)
//
// Fragment format (must stay in sync with tools/bundle.mjs `parseFragmentFile`):
//   <file header: 3 `// GENERATED ...` lines, no markers>
//   for each unit in global emission order:
//     `// __UNIT__ <id> [<start>,<end>) kind=<kind>[ handlerKey=<key>] len=<len>\n`
//     <raw source slice, byte-exact from VM9.deob.txt>
//     `\n`
// bundle.mjs strips exactly one trailing `\n` per unit to recover the raw slice.
// Raw slices never contain a line exactly equal to a marker (minified single-line
// statements + tiny known wrappers), and bundle.mjs verifies every recovered slice
// length against units.json, so a collision would fail loudly, never silently.
//
// Rules: emission order is data (units.json sorted by start); nothing is reordered.
//        No imports/exports are added in M1 — files are fragments, not runnable ESM
//        modules (ESM-ification is a later pass). Deterministic: no timestamps.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus, readSourceText } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// Keep in sync with bundle.mjs.
export const MARKER_RE_SRC =
  '^// __UNIT__ (u\\d{4}) \\[(\\d+),(\\d+)\\) kind=([A-Za-z-]+)(?: handlerKey=(\\S+))? len=(\\d+)$';

export function formatMarker(u) {
  const hk = u.handlerKey !== undefined ? ` handlerKey=${u.handlerKey}` : '';
  return `// __UNIT__ ${u.id} [${u.start},${u.end}) kind=${u.kind}${hk} len=${u.length}`;
}

// Parse one fragment file. Returns [{ id, start, end, kind, handlerKey, len, raw }].
// Files without markers (e.g. src/index.js) return [].
export function parseFragmentFile(text, relPath) {
  const re = new RegExp(MARKER_RE_SRC, 'gm');
  const markers = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    markers.push({
      id: m[1],
      start: Number(m[2]),
      end: Number(m[3]),
      kind: m[4],
      handlerKey: m[5],
      len: Number(m[6]),
      markerStart: m.index,
      markerEnd: m.index + m[0].length,
    });
  }
  const out = [];
  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i];
    if (text[mk.markerEnd] !== '\n') {
      throw new Error(`bundle parse: marker line not followed by \\n in ${relPath} (${mk.id})`);
    }
    const contentStart = mk.markerEnd + 1;
    const nextMarkerStart = i + 1 < markers.length ? markers[i + 1].markerStart : text.length;
    if (nextMarkerStart <= contentStart) {
      throw new Error(`bundle parse: empty unit body in ${relPath} (${mk.id})`);
    }
    // emit.mjs appends exactly one '\n' after each raw slice.
    if (text[nextMarkerStart - 1] !== '\n') {
      throw new Error(`bundle parse: unit body not newline-terminated in ${relPath} (${mk.id})`);
    }
    const raw = text.slice(contentStart, nextMarkerStart - 1);
    if (raw.length !== mk.len) {
      throw new Error(
        `bundle parse: length mismatch in ${relPath} (${mk.id}): marker len=${mk.len} recovered=${raw.length}`
      );
    }
    out.push({ id: mk.id, start: mk.start, end: mk.end, kind: mk.kind, handlerKey: mk.handlerKey, len: mk.len, raw });
  }
  return out;
}

function collectJsFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.js')) out.push(p);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out.sort();
}

export async function emit() {
  const C = corpus();
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const SRC_DIR = C.srcDir;
  const source = readSourceText();
  const { meta, units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));

  if (units.length === 0) throw new Error('emit: no units in units.json (run extract first)');
  if (units[0].start !== 0 || units[units.length - 1].end !== source.length) {
    throw new Error(
      `emit: units do not cover [0, ${source.length}): first=${units[0].start} lastEnd=${units[units.length - 1].end}`
    );
  }
  for (let i = 0; i < units.length - 1; i++) {
    if (units[i].end !== units[i + 1].start) {
      throw new Error(`emit: units gap/overlap at ${units[i].id} -> ${units[i + 1].id}`);
    }
    if (units[i].start >= units[i].end) throw new Error(`emit: inverted unit ${units[i].id}`);
  }
  // Sanity: slices must reproduce the source (same gate as M0).
  const rejoined = units.map((u) => source.slice(u.start, u.end)).join('');
  if (rejoined !== source) throw new Error(`emit: units do not rejoin to ${C.sourceLabel}`);

  // Group by module; order within a file follows global emission order.
  const byModule = new Map();
  for (const u of units) {
    if (!byModule.has(u.module)) byModule.set(u.module, []);
    byModule.get(u.module).push(u);
  }
  const modules = [...byModule.keys()].sort();

  // Wipe previously emitted fragment files (all of src/** is generated).
  for (const f of collectJsFiles(SRC_DIR)) fs.unlinkSync(f);

  let files = 0;
  for (const mod of modules) {
    const list = byModule.get(mod);
    const header =
      `// GENERATED from ${C.emitHeaderSource} — edit tools/, not this file.\n` +
      `// module: ${mod} | units: ${list.length} | span: [${list[0].start},${list[list.length - 1].end}) (interleaved; exact ranges are per-unit markers below)\n` +
      `// emission order within this file follows global order (sorted by start); rebundle with: node tools/bundle.mjs\n`;
    let body = header;
    for (const u of list) {
      const raw = source.slice(u.start, u.end);
      if (raw.length !== u.length) {
        throw new Error(`emit: slice length mismatch for ${u.id}: expected ${u.length} got ${raw.length}`);
      }
      body += formatMarker(u) + '\n' + raw + '\n';
    }
    const outPath = path.join(SRC_DIR, mod);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, body);
    files++;
  }

  // src/index.js: order manifest (no unit bodies; bundle.mjs finds no markers here).
  const indexBody =
    `// GENERATED from ${C.emitHeaderSource} — edit tools/, not this file.\n` +
    `// Emission-order manifest for the M1 split-only tree (obfuscated names kept).\n` +
    `// Rebundle: node tools/bundle.mjs (concatenates unit bodies sorted by start).\n` +
    `// NOTE: fragment files under src/ are NOT runnable ESM modules in M1 (no\n` +
    `// imports/exports added); ESM-ification is a later pass. This index only\n` +
    `// records the canonical order.\n` +
    `export const SOURCE = '${C.emitHeaderSource}';\n` +
    `export const UNIT_COUNT = ${units.length};\n` +
    `export const EMISSION_ORDER = ${JSON.stringify(units.map((u) => u.id))};\n` +
    `export const UNIT_MODULES = ${JSON.stringify(Object.fromEntries(units.map((u) => [u.id, u.module])))};\n`;
  fs.writeFileSync(path.join(SRC_DIR, 'index.js'), indexBody);

  console.log(`emit(${C.name}): source chars=${source.length} units=${units.length} modules=${modules.length} files=${files + 1} (incl. index.js)`);
  console.log(`emit(${C.name}): wrote ${path.relative(ROOT, SRC_DIR)}/{${modules.slice(0, 5).join(',')}${modules.length > 5 ? ',…' : ''}} + index.js`);
  return { modules, files: files + 1, count: units.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  emit().catch((err) => {
    console.error(`emit.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

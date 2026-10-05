// client-deob/tools/coverage.mjs — M3 full naming coverage (PLAN §3 Phase B, M3)
//
// Reads:  ../data/inventory.json (M3 census: 11886 names, 3352 bracket strings)
//         ../data/rename-map.json (M2 seed: 115 rename + 29 keep; M3 curates 3 deferred)
//         ../data/manifest.json (656 wire symbols, protected strings)
//         ../build/local-bindings.json (locals universe; rename --census on M1 tree)
//         ../build/rename-report.json (applied truth incl. per-binding locals)
// Writes: ../data/coverage.json
//         { meta, order, entries: { <ident>: { disposition, evidence, ... } },
//           strings: { <key>: { disposition, evidence } } }
//
// Dispositions for identifiers:
//   renamed      — action=rename in rename-map (applied by tools/rename.mjs, proven by L2)
//   keep-map     — action=keep in rename-map (curated, strings/loader/property)
//   keep-builtin — standard JS/DOM/Node globals (never renamed by design)
//   renamed-local— non-top name whose every local binding is renamed per
//                data/rename-locals.json (proven applied by rename-report)
//   partial-local— non-top name with some (not all) local bindings renamed
//   keep-top     — remaining top-level globals, explicitly kept per PLAN
//                correctness-first ("keep + // TODO name" when role unclear)
//   keep-local   — remaining function/block-scoped locals, explicitly kept
//                (minified reuse like a3o/a3y/a3i awaiting per-binding curation)
//
// Dispositions for bracket strings (never renamed — verify L2 + protected.test):
//   protected-wire — in manifest order (656 wire/message symbols) or PLAN §B.3
//                  anchors (FRF6r51VY32, K11Co2hvi1l, e479Jk50P)
//   keep-string    — all other string keys (readable or obfuscated bone/wire
//                  keys held only as strings; renaming strings is forbidden)
//
// Target: 100% of inventory names + strings have an explicit disposition.
// Deterministic: sorted keys, no timestamps.
//
// Usage: node tools/coverage.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
// Corpus paths resolve lazily inside coverage().

// Standard builtins: JS + DOM + Node + WebGL/THREE-adjacent globals that are
// never obfuscated and never renamed. Curated once; coverage test pins the list.
const BUILTINS = new Set(
  ('undefined NaN Infinity ' +
    'Object Array String Number Boolean Function Symbol BigInt ' +
    'Math JSON Date RegExp Error TypeError RangeError SyntaxError ReferenceError ' +
    'Map Set WeakMap WeakSet Promise Proxy Reflect ' +
    'ArrayBuffer DataView Uint8Array Int8Array Uint16Array Int16Array Uint32Array Int32Array ' +
    'Float32Array Float64Array Uint8ClampedArray BigUint64Array BigInt64Array ' +
    'Blob URL URLSearchParams TextEncoder TextDecoder ' +
    'window document navigator console performance location history screen ' +
    'localStorage sessionStorage indexedDB ' +
    'setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame ' +
    'fetch XMLHttpRequest WebSocket Worker WebAssembly ' +
    'addEventListener removeEventListener dispatchEvent CustomEvent Event ' +
    'innerWidth innerHeight innerHTML outerHTML devicePixelRatio pageX pageY ' +
    'global exports module require define self top parent frames open close ' +
    'alert confirm prompt btoa atob encodeURIComponent decodeURIComponent encodeURI decodeURI ' +
    'isNaN isFinite parseInt parseFloat Number isInteger ' +
    'prototype constructor length name value type data ' +
    'GL global vec3').split(' ')
);

const PROTECTED_STRINGS = new Set(['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P']);

export async function coverage() {
  const C = corpus();
  const INV_PATH = path.join(C.dataDir, 'inventory.json');
  const MAP_PATH = C.renameMapPath;
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  const OUT_PATH = path.join(C.dataDir, 'coverage.json');
  const inv = JSON.parse(fs.readFileSync(INV_PATH, 'utf8'));
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const manifestSet = new Set(manifest.order);
  // Locals universe (census) + applied truth (report). Census runs on the M1
  // tree (rename --census, post-emit); report on the same tree post-apply.
  const CENSUS_PATH = path.join(C.buildDir, 'local-bindings.json');
  const REPORT_PATH = path.join(C.buildDir, C.renameReportFile);
  if (!fs.existsSync(CENSUS_PATH)) throw new Error(`coverage: ${path.relative(ROOT, CENSUS_PATH)} missing (run node tools/rename.mjs --census first)`);
  if (!fs.existsSync(REPORT_PATH)) throw new Error(`coverage: ${path.relative(ROOT, REPORT_PATH)} missing (run node tools/rename.mjs --apply first)`);
  const census = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf8'));
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const localUniverse = new Map(); // token -> bindings not globally targeted
  for (const uid of Object.keys(census.units)) {
    for (const [token, list] of Object.entries(census.units[uid].tokens)) {
      for (const b of list) {
        if (b.globalTarget) continue;
        localUniverse.set(token, (localUniverse.get(token) || 0) + 1);
      }
    }
  }
  const localRenamed = new Map(); // token -> applied local bindings
  let localDeferred = 0;
  for (const [id, r] of Object.entries(report.entries)) {
    if (r.scope !== 'local') continue;
    if (r.status === 'applied') localRenamed.set(r.token, (localRenamed.get(r.token) || 0) + 1);
    else if (r.status === 'deferred-lineage') localDeferred++;
  }

  const renameSet = new Set(
    map.order.filter((t) => map.entries[t].action === 'rename' && !t.includes('.'))
  );
  const keepMapSet = new Set(
    map.order.filter((t) => map.entries[t].action === 'keep')
  );
  // Keep-map base tokens (for dotted Kq.xxx entries, the base Kq is renamed;
  // the property part is string-held and covered under strings).
  const keepMapBase = new Set([...keepMapSet].map((t) => t.split('.')[0]));

  // Null-prototype outputs: VM9 contains `__proto__` as a real identifier
  // and string key; plain `{}` would drop it via the prototype setter.
  const entries = Object.create(null);
  const order = Object.keys(inv.names).sort();
  // Safe lookup: inventory.json round-trips `__proto__` as an own property;
  // `inv.names[n]` still resolves correctly (own shadows prototype), but
  // `in` / hasOwnProperty checks must not use the prototype chain.
  const hasName = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  let cRenamed = 0, cKeepMap = 0, cBuiltin = 0, cTop = 0, cLocal = 0, cRenamedLocal = 0, cPartialLocal = 0;

  // Rename-map keep tokens that are string-held: dotted `Base.attr` property
  // attrs + bare string-key tokens. They are covered under `strings`, but link
  // them here so the identifier side does not claim them as uncovered.
  const keepStringAttrs = new Set();
  const keepBareTokens = new Set();
  for (const t of map.order) {
    const e = map.entries[t];
    if (e.action !== 'keep') continue;
    if (t.includes('.')) keepStringAttrs.add(t.split('.').slice(1).join('.'));
    else if (e.scope === 'string-key' || e.scope === 'loader' || e.scope.startsWith('property:')) keepBareTokens.add(t);
  }

  for (const n of order) {
    const info = inv.names[n];
    let disposition, evidence;
    if (renameSet.has(n)) {
      const e = map.entries[n];
      disposition = 'renamed';
      evidence = `rename-map ${n}->${e.name} (${e.docs})`;
      cRenamed++;
    } else if (hasName(map.entries, n) && map.entries[n].action === 'keep') {
      const e = map.entries[n];
      disposition = 'keep-map';
      evidence = `rename-map keep ${n} (${e.scope}): ${e.evidence.slice(0, 160)}`;
      cKeepMap++;
    } else if (BUILTINS.has(n)) {
      disposition = 'keep-builtin';
      evidence = `standard JS/DOM/Node global (count=${info.count}); never obfuscated, never renamed`;
      cBuiltin++;
    } else if (info.isTopDecl) {
      disposition = 'keep-top';
      const lu = localUniverse.get(n) || 0;
      const lr = localRenamed.get(n) || 0;
      evidence = `top-level ${info.topKind || 'decl'} (count=${info.count}); explicitly kept per PLAN correctness-first` +
        (lu > 0 ? `; ${lr}/${lu} same-name inner bindings renamed per rename-locals.json` : ``);
      cTop++;
    } else {
      const lu = localUniverse.get(n) || 0;
      const lr = localRenamed.get(n) || 0;
      if (lu > 0 && lr >= lu) {
        disposition = 'renamed-local';
        evidence = `all ${lu} local bindings renamed per rename-locals.json (rename-report applied)`;
        cRenamedLocal++;
      } else if (lr > 0) {
        disposition = 'partial-local';
        evidence = `${lr}/${lu} local bindings renamed per rename-locals.json (rename-report applied)`;
        cPartialLocal++;
      } else {
        disposition = 'keep-local';
        evidence = `function/block-scoped or property-position identifier (count=${info.count}` +
          (lu > 0 ? `, ${lu} local bindings` : ``) + `); explicitly kept — minified reuse across disjoint scopes awaiting per-binding curation`;
        cLocal++;
      }
    }
    entries[n] = {
      disposition,
      count: info.count,
      isTopDecl: info.isTopDecl,
      evidence,
    };
  }

  // ---- Bracket strings ----
  const strings = Object.create(null);
  const skeys = Object.keys(inv.bracketStrings).sort();
  let sProtected = 0, sKeep = 0, sKeepMap = 0;
  for (const k of skeys) {
    let disposition, evidence;
    if (keepStringAttrs.has(k) || keepBareTokens.has(k)) {
      disposition = 'keep-map';
      evidence = `rename-map keep (property/string-key scope); strings are never renamed by design`;
      sKeepMap++;
    } else if (manifestSet.has(k) || PROTECTED_STRINGS.has(k)) {
      disposition = 'protected-wire';
      evidence = `wire/message symbol (manifest or PLAN §B.3); strings are never renamed (protected.test.mjs)`;
      sProtected++;
    } else {
      disposition = 'keep-string';
      evidence = `string-held key (count=${inv.bracketStrings[k]}); strings are never renamed by design`;
      sKeep++;
    }
    strings[k] = { disposition, count: inv.bracketStrings[k], evidence };
  }

  const localUniverseTotal = [...localUniverse.values()].reduce((a, b) => a + b, 0);
  const localRenamedTotal = [...localRenamed.values()].reduce((a, b) => a + b, 0);
  const meta = {
    generatedBy: 'client-deob/tools/coverage.mjs (M3)',
    distinctNames: order.length,
    totalNameTokens: inv.meta.totalNameTokens,
    renamed: cRenamed,
    keepMap: cKeepMap,
    keepBuiltin: cBuiltin,
    keepTop: cTop,
    keepLocal: cLocal,
    renamedLocal: cRenamedLocal,
    partialLocal: cPartialLocal,
    localBindings: localUniverseTotal,
    localRenamed: localRenamedTotal,
    localDeferred: localDeferred,
    covered: cRenamed + cKeepMap + cBuiltin + cTop + cLocal + cRenamedLocal + cPartialLocal,
    bracketDistinct: skeys.length,
    bracketProtected: sProtected,
    bracketKeepMap: sKeepMap,
    bracketKeep: sKeep,
    builtinListSize: BUILTINS.size,
  };
  if (meta.covered !== meta.distinctNames) {
    throw new Error(`coverage: covered ${meta.covered} != distinct ${meta.distinctNames}`);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ meta, order, entries, strings }, null, 2) + '\n');
  console.log(`coverage: names=${meta.distinctNames} (renamed=${cRenamed} keepMap=${cKeepMap} builtin=${cBuiltin} top=${cTop} local=${cLocal} renamedLocal=${cRenamedLocal} partialLocal=${cPartialLocal}) strings=${skeys.length} (protected=${sProtected} keepMap=${sKeepMap} keep=${sKeep}) localBindings=${localUniverseTotal}/${localRenamedTotal} -> ${path.relative(ROOT, OUT_PATH)}`);
  return { meta };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  coverage().catch((err) => {
    console.error(`coverage.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

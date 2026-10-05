// client-deob/tools/extract.mjs — Phase A, step 1 (PLAN §3 Phase A)
//
// Reads:  raw/bundles/final.pkg.js   (manifest: 656 names / 13,349 anchors, hints only)
//         raw/bundles/VM9.deob.txt   (code text, strings decoded)
// Writes: ../data/manifest.json      { name: { hint: [pos], measured: [pos] } }
//         ../data/units.json         ordered top-level units: { id, kind, range, module, exports }
//
// Rules: anchors are HINTS (they resolve within ±200 chars, never assume exact offset);
//        measure real positions by scanning; units must tile [0, len) with no gaps.
//
// Status: implemented (M0). See PLAN.md §1.1 and §3 Phase A.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { corpus, readSourceText, parseManifest as parseServedManifest } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PKG_PATH = path.join(ROOT, 'raw', 'bundles', 'final.pkg.js');
const VM9_PATH = path.join(ROOT, 'raw', 'bundles', 'VM9.deob.txt');

const CODE_ANCHOR = ';var battle_royale_enabled=false;';
const HINT_WINDOW = 200;
const VENDOR_MARKER = '},{},[0x1])(0x1)';
const HANDLER_DEF_MARKER = 'a0I={';

function findAll(haystack, needle) {
  const out = [];
  if (!needle) return out;
  let idx = 0;
  for (;;) {
    idx = haystack.indexOf(needle, idx);
    if (idx < 0) break;
    out.push(idx);
    idx += needle.length;
    if (idx >= haystack.length) break;
  }
  return out;
}

function parseManifest(pkg) {
  const codeStart = pkg.indexOf(CODE_ANCHOR);
  if (codeStart < 0) throw new Error('manifest parse: code anchor not found');
  // CODE_ANCHOR starts with ';' which is the manifest terminator.
  // Manifest text is everything before codeStart; code starts with ';var ...'.
  const manifestText = pkg.slice(0, codeStart);
  const rawParts = manifestText.split('@');
  const order = [];
  const hints = new Map();
  let anchorCount = 0;
  for (const part of rawParts) {
    if (part === '') continue;
    const fields = part.split(':');
    const name = fields[0];
    if (!name) throw new Error('manifest parse: empty name');
    const nums = [];
    for (let i = 1; i < fields.length; i++) {
      const f = fields[i];
      if (f === '') continue; // trailing colon
      if (!/^\d+$/.test(f)) throw new Error(`manifest parse: non-numeric anchor ${JSON.stringify(f)} for ${name}`);
      nums.push(Number(f));
    }
    order.push(name);
    hints.set(name, nums);
    anchorCount += nums.length;
  }
  return { codeStart, manifestText, order, hints, anchorCount };
}

// Priority-ordered module classifier for M0 (heuristic; M1 refines placement).
// First match wins. Deterministic: fixed order, substring tests only.
const MODULE_RULES = [
  { module: 'core/bootstrap.js', test: (s) => s.includes('battle_royale_enabled') },
  { module: 'core/bootstrap.js', test: (s) => s.includes('function n(){var aHp') },
  { module: 'core/bootstrap.js', test: (s) => s.includes('var pZ=![],q0=![]') },
  { module: 'core/constants.js', test: (s) => s.includes('G5=29.5') },
  { module: 'core/bitfield.js', test: (s) => s.includes('var H1=[]') },
  { module: 'network/codec.js', test: (s) => s.includes('var J2={}') },
  { module: 'network/codec.js', test: (s) => s.includes('var J3=J2') },
  { module: 'network/codec.js', test: (s) => s.includes('function Je(') },
  { module: 'network/codec.js', test: (s) => s.includes('function Jg(') },
  { module: 'network/codec.js', test: (s) => s.includes('var J9=H2(J3)') },
  { module: 'network/dispatch.js', test: (s) => s.includes('a0Y') },
  { module: 'network/handshake.js', test: (s) => s.includes('0x178C4E') },
  { module: 'network/matchmaker.js', test: (s) => s.includes('matchmaker-socket-create') },
  { module: 'network/matchmaker.js', test: (s) => s.includes('matchmaker') && s.includes('msgpack') },
  { module: 'sim/player.js', test: (s) => s.includes('SW=new SV()') || s.includes('new SV()') },
  { module: 'sim/physics.js', test: (s) => s.includes('function QQ(') },
  { module: 'sim/input.js', test: (s) => s.includes('pointerlockchange') || s.includes('pointer lock') },
  { module: 'sim/game-loop.js', test: (s) => s.includes('requestAnimationFrame') },
  { module: 'sim/entities.js', test: (s) => s.includes('var V3=vec3.create') },
  { module: 'combat/raycast.js', test: (s) => s.includes('threeRaycaster') || s.includes('Raycaster') },
  { module: 'combat/fire.js', test: (s) => s.includes('recoil') || s.includes('a1U') },
  { module: 'combat/effects.js', test: (s) => s.includes('tracer') || s.includes('hitmarker') || s.includes('EffectComposer') === false && s.includes('blood') },
  { module: 'combat/scope-crosshair.js', test: (s) => s.includes('crosshair') || s.includes('xhairbloom') },
  { module: 'engine/webgl-renderer.js', test: (s) => s.includes('EffectComposer') || s.includes('WebGLRenderer') || s.includes('WebGL1Renderer') },
  { module: 'engine/assets-draco.js', test: (s) => s.includes('decodeDracoFile') || s.includes('Draco') || s.includes('KTX2') || s.includes('GLTF') },
  { module: 'engine/shaders.js', test: (s) => s.includes('vertexShader') || s.includes('fragmentShader') },
  { module: 'characters/animation.js', test: (s) => s.includes('AnimationMixer') || s.includes('AnimationClip') },
  { module: 'characters/rigs.js', test: (s) => s.includes('armature') || (s.includes('bone') && s.includes('Xw')) },
  { module: 'characters/mesh-pool.js', test: (s) => s.includes("XW") && s.includes("create") && s.includes("recycle") },
  { module: 'ui/hud.js', test: (s) => s.includes('killfeed') || s.includes('scoreboard') || s.includes('healthUpdateTime') },
  { module: 'ui/party-lobby.js', test: (s) => s.includes('party') && s.includes('ready') },
  { module: 'ui/challenges.js', test: (s) => s.includes('daily') && s.includes('weekly') },
  { module: 'ui/shop-locker.js', test: (s) => s.includes('inspect modal') || (s.includes('shop') && s.includes('skin')) },
  { module: 'ui/menu.js', test: (s) => s.includes('settingsDiv') || s.includes('main menu') },
  { module: 'ui/widgets.js', test: (s) => s.includes('settingsDiv') === false && (s.includes('a3D') && s.includes('button')) },
  { module: 'world/weapons.js', test: (s) => s.includes('shotgunKills') || s.includes('/weapons/vecto') },
  { module: 'world/map-table.js', test: (s) => s.includes('WoodFloor') || s.includes('MetalDoor') || s.includes('BuildingAtlas') },
];

function classifyUnit(snippet) {
  for (const r of MODULE_RULES) {
    try {
      if (r.test(snippet)) return r.module;
    } catch { /* ignore */ }
  }
  return 'sim/game-loop.js';
}

function kindForStatement(node, snippet) {
  switch (node.type) {
    case 'VariableDeclaration': return 'var';
    case 'FunctionDeclaration': return 'function';
    case 'ExpressionStatement':
      if (/^\(function/.test(snippet) || /^!function/.test(snippet) || /^\(function\(/.test(snippet)) return 'iife';
      return 'expr';
    case 'IfStatement': return 'if';
    case 'ForStatement': return 'for';
    case 'WhileStatement': return 'while';
    case 'ClassDeclaration': return 'class';
    case 'TryStatement': return 'try';
    case 'EmptyStatement': return 'empty';
    default: return node.type.toLowerCase();
  }
}

function exportsForStatement(node) {
  try {
    if (node.type === 'VariableDeclaration') {
      return node.declarations.map((d) => (d.id && d.id.name ? d.id.name : null)).filter(Boolean);
    }
    if (node.type === 'FunctionDeclaration' && node.id && node.id.name) return [node.id.name];
    if (node.type === 'ClassDeclaration' && node.id && node.id.name) return [node.id.name];
  } catch { /* ignore */ }
  return [];
}

export async function extract() {
  const C = corpus();
  if (C.name === 'served') return extractServed(C);
  return extractVm9(C);
}

// M0 vm9 path — UNCHANGED semantics (byte-identical data/manifest.json +
// data/units.json); only the output dir now comes from the corpus.
async function extractVm9(C) {
  const DATA_DIR = C.dataDir;
  const MANIFEST_OUT = path.join(DATA_DIR, 'manifest.json');
  const UNITS_OUT = path.join(DATA_DIR, 'units.json');
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');
  const pkgBytes = fs.statSync(PKG_PATH).size;
  const vm9Bytes = fs.statSync(VM9_PATH).size;

  // --- 1. Manifest: name list + hint offsets ---
  const { codeStart, order, hints, anchorCount } = parseManifest(pkg);
  if (order.length !== 656) {
    throw new Error(`manifest: expected 656 names, got ${order.length}`);
  }
  if (anchorCount !== 13349) {
    throw new Error(`manifest: expected 13349 anchors, got ${anchorCount}`);
  }
  const code = pkg.slice(codeStart);

  // --- 2. Re-locate every token precisely by scanning ---
  const symbols = {};
  let totalMeasuredPkg = 0;
  let totalMeasuredVm9 = 0;
  for (const name of order) {
    const hint = hints.get(name) || [];
    const measuredPkg = findAll(code, name);
    const measuredVm9 = findAll(vm9, name);
    totalMeasuredPkg += measuredPkg.length;
    totalMeasuredVm9 += measuredVm9.length;
    symbols[name] = { hint, measuredPkg, measuredVm9 };
  }

  // --- 3. Verify each hint resolves within ±200 chars of a real token ---
  let maxDelta = 0;
  let checked = 0;
  const failures = [];
  for (const name of order) {
    const hint = symbols[name].hint;
    const measured = symbols[name].measuredPkg;
    if (hint.length === 0) continue;
    if (measured.length === 0) {
      failures.push({ name, reason: 'no measured occurrence in code but has hints', hintCount: hint.length });
      continue;
    }
    // measured is sorted (findAll scans left to right); two-pointer nearest check
    let j = 0;
    for (const h of hint) {
      while (j + 1 < measured.length && Math.abs(measured[j + 1] - h) < Math.abs(measured[j] - h)) j++;
      // j may need to move back if earlier is closer; scan neighbours
      let best = Math.abs(measured[j] - h);
      if (j > 0) best = Math.min(best, Math.abs(measured[j - 1] - h));
      if (j + 1 < measured.length) best = Math.min(best, Math.abs(measured[j + 1] - h));
      if (best > maxDelta) maxDelta = best;
      checked++;
      if (best > HINT_WINDOW) {
        failures.push({ name, hint: h, nearestDelta: best });
        if (failures.length > 5) break;
      }
    }
    if (failures.length > 5) break;
  }
  if (failures.length > 0) {
    throw new Error(`manifest hints: ${failures.length} anchors outside ±${HINT_WINDOW}: ${JSON.stringify(failures.slice(0, 3))}`);
  }

  // --- 4. Statement boundaries via acorn (not regex) ---
  const ast = acorn.parse(vm9, { ecmaVersion: 'latest' });
  if (ast.body.length !== 1 || ast.body[0].type !== 'ExpressionStatement' || ast.body[0].expression.type !== 'FunctionExpression') {
    throw new Error('VM9: expected single outer (function anonymous(){...}) wrapper');
  }
  const outerExpr = ast.body[0].expression;
  const outerBody = outerExpr.body.body; // 6 statements
  if (outerBody.length < 6) throw new Error(`VM9: expected >=6 outer statements, got ${outerBody.length}`);
  const bigStmt = outerBody[outerBody.length - 1];
  if (bigStmt.type !== 'ExpressionStatement' || bigStmt.expression.type !== 'CallExpression' || bigStmt.expression.callee.type !== 'FunctionExpression') {
    throw new Error('VM9: expected last outer statement to be (function(){...})()');
  }
  const bigFn = bigStmt.expression.callee;
  const innerStmts = bigFn.body.body; // 2825 statements

  // Locate handler + vendor statements
  let handlerStmtIndex = -1;
  let vendorStmtIndex = -1;
  for (let i = 0; i < innerStmts.length; i++) {
    const s = innerStmts[i];
    const snip = vm9.slice(s.start, Math.min(s.end, s.start + 400));
    const full = vm9.slice(s.start, s.end);
    if (full.includes(HANDLER_DEF_MARKER) && handlerStmtIndex < 0) {
      // confirm it declares a0I as object
      handlerStmtIndex = i;
    }
    if (full.includes(VENDOR_MARKER)) vendorStmtIndex = i;
  }
  if (handlerStmtIndex < 0) throw new Error('VM9: handler table (a0I={) not found');
  if (vendorStmtIndex < 0) throw new Error('VM9: vendor browserify bundle marker not found');

  // Handler object properties for per-entry split
  const handlerStmt = innerStmts[handlerStmtIndex];
  if (handlerStmt.type !== 'VariableDeclaration') throw new Error('VM9: handler statement is not a VariableDeclaration');
  const handlerDecl = handlerStmt.declarations.find((d) => d.id && d.id.name === 'a0I');
  if (!handlerDecl || !handlerDecl.init || handlerDecl.init.type !== 'ObjectExpression') {
    throw new Error('VM9: a0I declarator is not an ObjectExpression');
  }
  const handlerProps = handlerDecl.init.properties;
  if (handlerProps.length === 0) throw new Error('VM9: handler object has no properties');
  const handlerObjStart = handlerDecl.init.start;
  const handlerObjEnd = handlerDecl.init.end;

  // --- 5. Build units (must tile [0, len) with no gaps) ---
  // Non-ASCII table for byte offsets (each such char is 2 bytes in UTF-8 here)
  const nonAsciiBefore = new Array(vm9.length + 1).fill(0);
  // Efficient prefix count: single pass
  {
    let c = 0;
    for (let i = 0; i < vm9.length; i++) {
      nonAsciiBefore[i] = c;
      if (vm9.charCodeAt(i) > 127) c += 1; // all observed are 2-byte => +1 byte each
    }
    nonAsciiBefore[vm9.length] = c;
  }
  const byteOf = (charPos) => charPos + nonAsciiBefore[charPos];

  const rawUnits = [];
  const pushUnit = (kind, start, end, module, extra = {}) => {
    if (end < start) throw new Error(`unit inverted: ${kind} ${start}..${end}`);
    if (end === start) return; // skip empty
    const snippet = vm9.slice(start, end);
    rawUnits.push({ kind, start, end, byteStart: byteOf(start), byteEnd: byteOf(end), length: end - start, module, snippetForClassify: snippet, ...extra });
  };

  // wrapper-open
  pushUnit('wrapper-open', 0, outerBody[0].start, 'core/bootstrap.js');
  // first 5 outer statements (index 0..len-2)
  for (let i = 0; i < outerBody.length - 1; i++) {
    const s = outerBody[i];
    const snippet = vm9.slice(s.start, s.end);
    pushUnit(kindForStatement(s, snippet), s.start, s.end, classifyUnit(snippet), { exports: exportsForStatement(s) });
  }
  // big-open: (function(){
  pushUnit('big-open', bigStmt.start, innerStmts[0].start, 'core/bootstrap.js');
  // inner statements
  for (let i = 0; i < innerStmts.length; i++) {
    const s = innerStmts[i];
    const full = vm9.slice(s.start, s.end);
    if (i === vendorStmtIndex) {
      pushUnit('vendor-lib', s.start, s.end, 'vendor/browserify-lib.js', { exports: exportsForStatement(s) });
      continue;
    }
    if (i === handlerStmtIndex) {
      // prefix: stmt.start .. first prop.start
      const firstProp = handlerProps[0];
      pushUnit('handler-prefix', s.start, firstProp.start, 'network/handlers.js', { exports: exportsForStatement(s) });
      for (let p = 0; p < handlerProps.length; p++) {
        const prop = handlerProps[p];
        const entryEnd = p + 1 < handlerProps.length ? handlerProps[p + 1].start : handlerObjEnd;
        const key = prop.key && (prop.key.value !== undefined ? String(prop.key.value) : prop.key.name);
        pushUnit('handler-entry', prop.start, entryEnd, 'network/handlers.js', { handlerKey: key });
      }
      // suffix: obj.end .. stmt.end (usually just ';')
      pushUnit('handler-suffix', handlerObjEnd, s.end, 'network/handlers.js');
      continue;
    }
    const snippet = full;
    pushUnit(kindForStatement(s, snippet), s.start, s.end, classifyUnit(snippet), { exports: exportsForStatement(s) });
  }
  // big-close: }());
  pushUnit('big-close', innerStmts[innerStmts.length - 1].end, bigStmt.end, 'core/bootstrap.js');
  // wrapper-close
  pushUnit('wrapper-close', bigStmt.end, vm9.length, 'core/bootstrap.js');

  // Sort by start (already in order) and verify tiling
  rawUnits.sort((a, b) => a.start - b.start);
  if (rawUnits[0].start !== 0) throw new Error(`units do not start at 0 (start=${rawUnits[0].start})`);
  if (rawUnits[rawUnits.length - 1].end !== vm9.length) {
    throw new Error(`units do not end at len ${vm9.length} (end=${rawUnits[rawUnits.length - 1].end})`);
  }
  for (let i = 0; i < rawUnits.length - 1; i++) {
    if (rawUnits[i].end !== rawUnits[i + 1].start) {
      throw new Error(`units gap/overlap at index ${i}: [${rawUnits[i].start},${rawUnits[i].end}) vs [${rawUnits[i + 1].start},${rawUnits[i + 1].end}) text=${JSON.stringify(vm9.slice(rawUnits[i].end, rawUnits[i + 1].start).slice(0, 60))}`);
    }
  }
  // Round-trip: concatenation must reproduce the file byte-for-byte (as string)
  const rejoined = rawUnits.map((u) => vm9.slice(u.start, u.end)).join('');
  if (rejoined !== vm9) {
    // find first divergence
    let d = 0;
    while (d < rejoined.length && d < vm9.length && rejoined[d] === vm9[d]) d++;
    throw new Error(`units rejoin mismatch at offset ${d}: ${JSON.stringify(vm9.slice(d - 40, d + 40))} vs ${JSON.stringify(rejoined.slice(d - 40, d + 40))}`);
  }

  // Assign deterministic ids and strip helper fields
  const units = rawUnits.map((u, idx) => {
    const id = 'u' + String(idx).padStart(4, '0');
    const { snippetForClassify, ...rest } = u;
    void snippetForClassify;
    const out = {
      id,
      kind: u.kind,
      range: [u.start, u.end],
      start: u.start,
      end: u.end,
      byteStart: u.byteStart,
      byteEnd: u.byteEnd,
      length: u.length,
      module: u.module,
      exports: u.exports || [],
    };
    if (u.handlerKey !== undefined) out.handlerKey = u.handlerKey;
    return out;
  });

  // Module histogram for the log
  const hist = {};
  for (const u of units) hist[u.module] = (hist[u.module] || 0) + 1;

  // --- 6. Write outputs (deterministic, no timestamps) ---
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const manifestJson = {
    meta: {
      source: 'raw/bundles/final.pkg.js',
      codeStart,
      manifestChars: codeStart,
      names: order.length,
      anchors: anchorCount,
      hintWindow: HINT_WINDOW,
      checkedHints: checked,
      maxHintDelta: maxDelta,
      allHintsWithinWindow: true,
      measuredPkgTotal: totalMeasuredPkg,
      measuredVm9Total: totalMeasuredVm9,
      generatedBy: 'client-deob/tools/extract.mjs (M0)',
      offsetUnit: 'char offsets in UTF-8-decoded string (JS string indices); hints are code-relative (code = file.slice(codeStart)), measuredPkg code-relative, measuredVm9 absolute in VM9.deob.txt',
    },
    order,
    symbols,
  };
  const unitsJson = {
    meta: {
      source: 'raw/bundles/VM9.deob.txt',
      lengthChars: vm9.length,
      lengthBytes: vm9Bytes,
      pkgLengthChars: pkg.length,
      pkgLengthBytes: pkgBytes,
      count: units.length,
      innerStatements: innerStmts.length,
      handlerEntries: handlerProps.length,
      handlerStatement: [handlerStmt.start, handlerStmt.end],
      vendorStatement: [innerStmts[vendorStmtIndex].start, innerStmts[vendorStmtIndex].end],
      generatedBy: 'client-deob/tools/extract.mjs (M0)',
      offsetUnit: 'char offsets (acorn start/end); byteStart/byteEnd are UTF-8 byte offsets',
      modules: hist,
    },
    units,
  };
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifestJson, null, 2) + '\n');
  fs.writeFileSync(UNITS_OUT, JSON.stringify(unitsJson, null, 2) + '\n');

  console.log(`extract: names=${order.length} anchors=${anchorCount} checked=${checked} maxDelta=${maxDelta}`);
  console.log(`extract: vm9 chars=${vm9.length} bytes=${vm9Bytes} units=${units.length} handlerEntries=${handlerProps.length}`);
  console.log(`extract: wrote ${path.relative(ROOT, MANIFEST_OUT)} + ${path.relative(ROOT, UNITS_OUT)}`);
  console.log(`extract: modules: ${Object.entries(hist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  return { manifest: manifestJson, units: unitsJson };
}

// M6 served path — the same Phase-A pipeline over the final.pkg.js code
// region (manifest stripped). Served code is a FLAT top-level statement list
// (no VM9 outer wrapper): one unit per statement, with the same handler-split
// (per a0I entry) and single vendor-lib unit. Units tile [0, code.length) with
// code-relative offsets; byte offsets are EXACT UTF-8 (no 2-byte assumption).
async function extractServed(C) {
  const DATA_DIR = C.dataDir;
  const MANIFEST_OUT = path.join(DATA_DIR, 'manifest.json');
  const UNITS_OUT = path.join(DATA_DIR, 'units.json');
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  const pkgBytes = fs.statSync(PKG_PATH).size;

  // --- 1. Manifest (shared parser; same 656/13349 gates as M0) ---
  const { codeStart, manifestText, order, hints, anchorCount } = parseServedManifest(pkg);
  if (order.length !== 656) {
    throw new Error(`manifest(served): expected 656 names, got ${order.length}`);
  }
  if (anchorCount !== 13349) {
    throw new Error(`manifest(served): expected 13349 anchors, got ${anchorCount}`);
  }
  if (Buffer.byteLength(manifestText, 'utf8') !== manifestText.length) {
    throw new Error('manifest(served): manifest block is not ASCII (byte math would shift)');
  }
  const code = pkg.slice(codeStart);
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');

  // --- 2. Occurrence scan in served code (+ cross-measure in VM9, same schema) ---
  const symbols = {};
  let totalMeasuredPkg = 0;
  let totalMeasuredVm9 = 0;
  for (const name of order) {
    const measuredPkg = findAll(code, name);
    const measuredVm9 = findAll(vm9, name);
    totalMeasuredPkg += measuredPkg.length;
    totalMeasuredVm9 += measuredVm9.length;
    symbols[name] = { hint: hints.get(name) || [], measuredPkg, measuredVm9 };
  }

  // --- 3. Hint window check vs SERVED code (same ±200 rule as M0) ---
  let maxDelta = 0;
  let checked = 0;
  const failures = [];
  for (const name of order) {
    const hint = symbols[name].hint;
    const measured = symbols[name].measuredPkg;
    if (hint.length === 0) continue;
    if (measured.length === 0) {
      failures.push({ name, reason: 'no measured occurrence in served code but has hints', hintCount: hint.length });
      continue;
    }
    let j = 0;
    for (const h of hint) {
      while (j + 1 < measured.length && Math.abs(measured[j + 1] - h) < Math.abs(measured[j] - h)) j++;
      let best = Math.abs(measured[j] - h);
      if (j > 0) best = Math.min(best, Math.abs(measured[j - 1] - h));
      if (j + 1 < measured.length) best = Math.min(best, Math.abs(measured[j + 1] - h));
      if (best > maxDelta) maxDelta = best;
      checked++;
      if (best > HINT_WINDOW) {
        failures.push({ name, hint: h, nearestDelta: best });
        if (failures.length > 5) break;
      }
    }
    if (failures.length > 5) break;
  }
  if (failures.length > 0) {
    throw new Error(`manifest(served) hints: ${failures.length} anchors outside ±${HINT_WINDOW}: ${JSON.stringify(failures.slice(0, 3))}`);
  }

  // --- 4. Statement boundaries via acorn (flat top level + big IIFE) ---
  const ast = acorn.parse(code, { ecmaVersion: 'latest' });
  const topStmts = ast.body;
  if (topStmts.length < 2) throw new Error('served: expected several top-level statements');
  const bigStmt = topStmts[topStmts.length - 1];
  if (bigStmt.type !== 'ExpressionStatement' || bigStmt.expression.type !== 'CallExpression' || bigStmt.expression.callee.type !== 'FunctionExpression') {
    throw new Error('served: expected last top-level statement to be (function(){...})()');
  }
  const innerStmts = bigStmt.expression.callee.body.body;
  if (innerStmts.length === 0) throw new Error('served: big IIFE has no inner statements');
  if (bigStmt.start !== innerStmts[0].start && code.slice(bigStmt.start, innerStmts[0].start).length === 0) {
    throw new Error('served: big-open region empty (unexpected)');
  }

  let handlerStmtIndex = -1;
  let vendorStmtIndex = -1;
  for (let i = 0; i < innerStmts.length; i++) {
    const full = code.slice(innerStmts[i].start, innerStmts[i].end);
    if (full.includes(HANDLER_DEF_MARKER)) {
      if (handlerStmtIndex >= 0) throw new Error('served: handler table (a0I={) in >1 inner statement');
      handlerStmtIndex = i;
    }
    if (full.includes(VENDOR_MARKER)) {
      if (vendorStmtIndex >= 0) throw new Error('served: vendor marker in >1 inner statement');
      vendorStmtIndex = i;
    }
  }
  if (handlerStmtIndex < 0) throw new Error('served: handler table (a0I={) not found');
  if (vendorStmtIndex < 0) throw new Error('served: vendor browserify bundle marker not found');
  if (handlerStmtIndex === vendorStmtIndex) throw new Error('served: handler + vendor markers in one statement');

  const handlerStmt = innerStmts[handlerStmtIndex];
  if (handlerStmt.type !== 'VariableDeclaration') {
    throw new Error(`served: handler statement is ${handlerStmt.type}, not a VariableDeclaration`);
  }
  const handlerDecl = handlerStmt.declarations.find((d) => d.id && d.id.name === 'a0I');
  if (!handlerDecl || !handlerDecl.init || handlerDecl.init.type !== 'ObjectExpression') {
    throw new Error('served: a0I declarator is not an ObjectExpression');
  }
  const handlerProps = handlerDecl.init.properties;
  if (handlerProps.length === 0) throw new Error('served: handler object has no properties');
  const handlerObjEnd = handlerDecl.init.end;

  // --- 5. Units (tile [0, code.length); exact UTF-8 byte offsets) ---
  const prefix = new Array(code.length + 1);
  {
    let b = 0, i = 0;
    while (i < code.length) {
      prefix[i] = b;
      const cp = code.codePointAt(i);
      b += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
      i += cp > 0xffff ? 2 : 1;
    }
    prefix[code.length] = b;
  }
  const byteOf = (p) => {
    const b = prefix[p];
    if (b === undefined) throw new Error(`served: byte offset unavailable at char ${p} (surrogate pair interior?)`);
    return b;
  };

  const rawUnits = [];
  const pushUnit = (kind, start, end, module, extra = {}) => {
    if (end < start) throw new Error(`unit inverted: ${kind} ${start}..${end}`);
    if (end === start) return;
    rawUnits.push({ kind, start, end, byteStart: byteOf(start), byteEnd: byteOf(end), length: end - start, module, ...extra });
  };

  for (let i = 0; i < topStmts.length - 1; i++) {
    const s = topStmts[i];
    const snippet = code.slice(s.start, s.end);
    pushUnit(kindForStatement(s, snippet), s.start, s.end, classifyUnit(snippet), { exports: exportsForStatement(s) });
  }
  // big-open: (function(){
  pushUnit('big-open', bigStmt.start, innerStmts[0].start, 'core/bootstrap.js');
  // inner statements
  for (let i = 0; i < innerStmts.length; i++) {
    const s = innerStmts[i];
    if (i === vendorStmtIndex) {
      pushUnit('vendor-lib', s.start, s.end, 'vendor/browserify-lib.js', { exports: exportsForStatement(s) });
      continue;
    }
    if (i === handlerStmtIndex) {
      const firstProp = handlerProps[0];
      pushUnit('handler-prefix', s.start, firstProp.start, 'network/handlers.js', { exports: exportsForStatement(s) });
      for (let p = 0; p < handlerProps.length; p++) {
        const prop = handlerProps[p];
        const entryEnd = p + 1 < handlerProps.length ? handlerProps[p + 1].start : handlerObjEnd;
        const key = prop.key && (prop.key.value !== undefined ? String(prop.key.value) : prop.key.name);
        pushUnit('handler-entry', prop.start, entryEnd, 'network/handlers.js', { handlerKey: key });
      }
      pushUnit('handler-suffix', handlerObjEnd, s.end, 'network/handlers.js');
      continue;
    }
    const snippet = code.slice(s.start, s.end);
    pushUnit(kindForStatement(s, snippet), s.start, s.end, classifyUnit(snippet), { exports: exportsForStatement(s) });
  }
  // big-close: }());
  pushUnit('big-close', innerStmts[innerStmts.length - 1].end, bigStmt.end, 'core/bootstrap.js');
  // trailing bytes after the last statement (served file ends "}());\n"):
  // kept as their own unit so the tiling covers [0, code.length) exactly.
  if (bigStmt.end !== code.length) {
    pushUnit('trailing-newline', bigStmt.end, code.length, 'core/bootstrap.js');
  }

  rawUnits.sort((a, b) => a.start - b.start);
  if (rawUnits[0].start !== 0) throw new Error(`served: units do not start at 0 (start=${rawUnits[0].start})`);
  if (rawUnits[rawUnits.length - 1].end !== code.length) {
    throw new Error(`served: units do not end at len ${code.length} (end=${rawUnits[rawUnits.length - 1].end})`);
  }
  for (let i = 0; i < rawUnits.length - 1; i++) {
    if (rawUnits[i].end !== rawUnits[i + 1].start) {
      throw new Error(`served: units gap/overlap at index ${i}: [${rawUnits[i].start},${rawUnits[i].end}) vs [${rawUnits[i + 1].start},${rawUnits[i + 1].end}) text=${JSON.stringify(code.slice(rawUnits[i].end, rawUnits[i + 1].start).slice(0, 60))}`);
    }
  }
  const rejoined = rawUnits.map((u) => code.slice(u.start, u.end)).join('');
  if (rejoined !== code) {
    let d = 0;
    while (d < rejoined.length && d < code.length && rejoined[d] === code[d]) d++;
    throw new Error(`served: units rejoin mismatch at offset ${d}`);
  }

  const units = rawUnits.map((u, idx) => {
    const out = {
      id: 'u' + String(idx).padStart(4, '0'),
      kind: u.kind,
      range: [u.start, u.end],
      start: u.start,
      end: u.end,
      byteStart: u.byteStart,
      byteEnd: u.byteEnd,
      length: u.length,
      module: u.module,
      exports: u.exports || [],
    };
    if (u.handlerKey !== undefined) out.handlerKey = u.handlerKey;
    return out;
  });

  const hist = {};
  for (const u of units) hist[u.module] = (hist[u.module] || 0) + 1;

  // --- 6. Write outputs ---
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const manifestJson = {
    meta: {
      source: 'raw/bundles/final.pkg.js [code region]',
      corpus: 'served',
      codeStart,
      manifestChars: codeStart,
      fileLengthChars: pkg.length,
      fileLengthBytes: pkgBytes,
      names: order.length,
      anchors: anchorCount,
      hintWindow: HINT_WINDOW,
      checkedHints: checked,
      maxHintDelta: maxDelta,
      allHintsWithinWindow: true,
      measuredPkgTotal: totalMeasuredPkg,
      measuredVm9Total: totalMeasuredVm9,
      generatedBy: 'client-deob/tools/extract.mjs (M6 served)',
      offsetUnit: 'char offsets in code region (file.slice(codeStart)); hints + measuredPkg code-relative, measuredVm9 absolute in VM9.deob.txt',
    },
    order,
    symbols,
  };
  const unitsJson = {
    meta: {
      source: 'raw/bundles/final.pkg.js [code region]',
      corpus: 'served',
      codeStart,
      lengthChars: code.length,
      lengthBytes: byteOf(code.length),
      fileLengthChars: pkg.length,
      fileLengthBytes: pkgBytes,
      count: units.length,
      topLevelStatements: topStmts.length,
      innerStatements: innerStmts.length,
      handlerEntries: handlerProps.length,
      handlerStatement: [handlerStmt.start, handlerStmt.end],
      vendorStatement: [innerStmts[vendorStmtIndex].start, innerStmts[vendorStmtIndex].end],
      generatedBy: 'client-deob/tools/extract.mjs (M6 served)',
      offsetUnit: 'code-relative char offsets (acorn start/end); byteStart/byteEnd are exact UTF-8 byte offsets',
      modules: hist,
    },
    units,
  };
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifestJson, null, 2) + '\n');
  fs.writeFileSync(UNITS_OUT, JSON.stringify(unitsJson, null, 2) + '\n');

  console.log(`extract(served): names=${order.length} anchors=${anchorCount} checked=${checked} maxDelta=${maxDelta}`);
  console.log(`extract(served): code chars=${code.length} units=${units.length} topLevel=${topStmts.length} inner=${innerStmts.length} handlerEntries=${handlerProps.length}`);
  console.log(`extract(served): wrote ${path.relative(ROOT, MANIFEST_OUT)} + ${path.relative(ROOT, UNITS_OUT)}`);
  console.log(`extract(served): modules: ${Object.entries(hist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  return { manifest: manifestJson, units: unitsJson };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extract().catch((err) => {
    console.error(`extract.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

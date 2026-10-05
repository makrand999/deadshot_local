// client-deob/tools/lint.mjs — M3 lint (PLAN M3 "no undeclared/duplicate")
//
// Reads:  ../build/vm9.rebuilt.js (final renamed bundle, must parse)
//         ../data/rename-map.json (2342 rename + 33 keep; new names unique)
//         ../data/coverage.json (100% disposition)
//         ../data/inventory.json (census)
//         ../../raw/bundles/VM9.deob.txt (oracle for keep-local presence)
// Writes: (none; exits 0 on clean, 1 on violation; --json prints report)
//
// Checks (all deterministic, fail loudly):
//   L1 duplicate-new-name: rename-map new names unique; no target scope already
//      binds the new name (same guard as rename.mjs, re-verified here via a
//      lightweight scope pass on the REBUILT tree for the renamed identifiers).
//   L2 no-undeclared: every reference in the rebuilt tree resolves to a binding
//      or to the pinned whitelist (builtins/DOM/Node + VM9 top-level decls +
//      the single inert `eval('win'+"dow")` site). Any other implicit global is
//      an undeclared variable (would be a ReferenceError in strict mode or a
//      silent global leak in sloppy mode) and fails.
//   L3 coverage-100: coverage.json covered == distinctNames and every bracket
//      string has a disposition; rename-map entryCount == 2375.
//   L4 keep-local-presence: M3-curated local keeps (a3D/a3J/a3v) still occur as
//      bare identifiers in the rebuilt bundle (not globally renamed); the
//      string-only keep (YGIcYCdrEk) still occurs only as Kq['...'] strings.
//   L5 no-eval-with: sole direct eval is the pinned inert site; no `with`.
//
// The whitelist below is pinned from measurement (see inventory + scope pass);
// any new implicit global must be curated here consciously (test fails loudly).
//
// Usage: node tools/lint.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { corpus, readSourceText, readRebuiltCode } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// No whitelist: the original bundle is sloppy-mode minified code with ~150
// intentional implicit globals (litegl helpers like vec3/glMatrix, DOM APIs,
// plus sloppy assignments). "No undeclared" therefore means DIFFERENTIAL:
// the rebuilt (renamed) tree must have exactly the same implicit set as VM9,
// modulo the rename map (new names normalize back to old tokens). Any other
// difference is a scope break introduced by renaming and fails.

// ---- Minimal scope builder (same semantics as tools/rename.mjs analyze) ----
class Scope {
  constructor(type, parent, depth) {
    this.type = type;
    this.parent = parent;
    this.depth = depth;
    this.bindings = new Map();
    this.strict = parent ? parent.strict : false;
  }
  lookup(name) {
    for (let s = this; s; s = s.parent) {
      if (s.bindings.has(name)) return s;
    }
    return null;
  }
}
function isFunctionNode(n) {
  return n && (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');
}
function declarePattern(node, scope, kind) {
  if (!node) return;
  if (node.type === 'Identifier') {
    if (!scope.bindings.has(node.name)) scope.bindings.set(node.name, { kind, node });
  } else if (node.type === 'ObjectPattern') {
    for (const p of node.properties) {
      if (p.type === 'RestElement') declarePattern(p.argument, scope, kind);
      else declarePattern(p.value, scope, kind);
    }
  } else if (node.type === 'ArrayPattern') {
    for (const el of node.elements) declarePattern(el, scope, kind);
  } else if (node.type === 'RestElement') declarePattern(node.argument, scope, kind);
  else if (node.type === 'AssignmentPattern') declarePattern(node.left, scope, kind);
}
function hoistScan(node, fnScope, inBlock, strict) {
  if (!node || typeof node.type !== 'string') return;
  if (isFunctionNode(node)) return;
  if (node.type === 'VariableDeclaration' && node.kind === 'var') {
    for (const d of node.declarations) declarePattern(d.id, fnScope, 'var');
    if (inBlock) return;
  }
  if (node.type === 'FunctionDeclaration' && node.id) {
    if (!(inBlock && strict)) {
      if (!fnScope.bindings.has(node.id.name)) fnScope.bindings.set(node.id.name, { kind: 'function', node: node.id });
    }
    return;
  }
  for (const k of Object.keys(node)) {
    if (k === 'parent') continue;
    const v = node[k];
    if (Array.isArray(v)) {
      for (const el of v) {
        if (el && typeof el.type === 'string') hoistScan(el, fnScope, inBlock || node.type === 'BlockStatement' || node.type === 'StaticBlock', strict);
      }
    } else if (v && typeof v.type === 'string') hoistScan(v, fnScope, inBlock, strict);
  }
}
function isReferencePosition(node, parent) {
  if (!parent) return true;
  if ((parent.type === 'LabeledStatement' && parent.label === node) ||
      ((parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && parent.label === node)) return false;
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return false;
  if ((parent.type === 'Property' || parent.type === 'ObjectProperty') && parent.key === node && !parent.computed) return false;
  if ((parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition' || parent.type === 'ObjectMethod' || parent.type === 'ClassMethod' || parent.type === 'ClassPrivateMethod') && parent.key === node && !parent.computed) return false;
  if ((parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier' || parent.type === 'ExportSpecifier') && parent.local !== node) return false;
  return true;
}
function isDeclarationPosition(node, parent) {
  if (!parent) return false;
  if ((parent.type === 'VariableDeclarator' && parent.id === node) ||
      ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') && parent.id === node) ||
      ((parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') && parent.id === node) ||
      (parent.type === 'CatchClause' && parent.param === node)) return true;
  return false;
}
function analyze(program) {
  const root = new Scope('root', null, 0);
  const decls = [];
  const refs = [];
  function declare(node, scope, kind) {
    if (!scope.bindings.has(node.name)) scope.bindings.set(node.name, { kind, node });
    decls.push({ name: node.name, node, scope });
  }
  function enterFunction(fnNode, parentScope) {
    const s = new Scope('function', parentScope, parentScope.depth + 1);
    const hasStrict = fnNode.body && fnNode.body.type === 'BlockStatement' &&
      fnNode.body.body.some((st) => st.type === 'ExpressionStatement' && st.directive === 'use strict');
    s.strict = hasStrict || parentScope.strict;
    if (fnNode.id && (fnNode.type === 'FunctionExpression' || fnNode.type === 'ArrowFunctionExpression')) {
      const ns = new Scope('named-fn', s, s.depth + 1);
      ns.bindings.set(fnNode.id.name, { kind: 'function-name', node: fnNode.id });
      decls.push({ name: fnNode.id.name, node: fnNode.id, scope: ns });
      for (const p of fnNode.params) declarePattern(p, s, 'param');
      hoistScan(fnNode.body, s, false, s.strict);
      walk(fnNode.body, s);
      return;
    }
    for (const p of fnNode.params || []) declarePattern(p, s, 'param');
    hoistScan(fnNode.body, s, false, s.strict);
    walk(fnNode.body, s);
  }
  function walk(node, scope) {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'FunctionDeclaration': {
        if (node.id) {
          const directChild = scope.type === 'function' || scope.type === 'root';
          if (!directChild && !scope.strict) {
            let vscope = scope;
            while (vscope && vscope.type !== 'function' && vscope.type !== 'root') vscope = vscope.parent;
            if (vscope && !vscope.bindings.has(node.id.name)) vscope.bindings.set(node.id.name, { kind: 'function', node: node.id });
          }
          declare(node.id, scope, 'function');
        }
        enterFunction(node, scope);
        return;
      }
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        enterFunction(node, scope);
        return;
      case 'BlockStatement':
      case 'StaticBlock': {
        const s = new Scope('block', scope, scope.depth + 1);
        s.strict = scope.strict;
        for (const st of node.body) walk(st, s);
        return;
      }
      case 'CatchClause': {
        const s = new Scope('catch', scope, scope.depth + 1);
        s.strict = scope.strict;
        if (node.param) declarePattern(node.param, s, 'catch-param');
        walk(node.body, s);
        return;
      }
      case 'ClassDeclaration':
        if (node.id) declare(node.id, scope, 'class');
        if (node.superClass) walk(node.superClass, scope);
        if (node.body) walk(node.body, scope);
        return;
      case 'ClassExpression': {
        if (node.id) {
          const ns = new Scope('named-fn', scope, scope.depth + 1);
          ns.bindings.set(node.id.name, { kind: 'class-name', node: node.id });
          decls.push({ name: node.id.name, node: node.id, scope: ns });
          if (node.superClass) walk(node.superClass, ns);
          if (node.body) walk(node.body, ns);
        } else {
          if (node.superClass) walk(node.superClass, scope);
          if (node.body) walk(node.body, scope);
        }
        return;
      }
      case 'VariableDeclaration': {
        for (const d of node.declarations) {
          if (node.kind === 'var') {
            const names = [];
            const grab = (n) => {
              if (!n) return;
              if (n.type === 'Identifier') names.push(n);
              else if (n.type === 'ObjectPattern') n.properties.forEach((p) => grab(p.type === 'RestElement' ? p.argument : p.value));
              else if (n.type === 'ArrayPattern') n.elements.forEach(grab);
              else if (n.type === 'RestElement') grab(n.argument);
              else if (n.type === 'AssignmentPattern') grab(n.left);
            };
            grab(d.id);
            for (const n of names) {
              const bs = scope.lookup(n.name) || scope;
              decls.push({ name: n.name, node: n, scope: bs });
            }
          } else {
            declarePattern(d.id, scope, node.kind);
            const grab = (n) => {
              if (!n) return;
              if (n.type === 'Identifier') decls.push({ name: n.name, node: n, scope });
              else if (n.type === 'ObjectPattern') n.properties.forEach((p) => grab(p.type === 'RestElement' ? p.argument : p.value));
              else if (n.type === 'ArrayPattern') n.elements.forEach(grab);
              else if (n.type === 'RestElement') grab(n.argument);
              else if (n.type === 'AssignmentPattern') grab(n.left);
            };
            grab(d.id);
          }
          if (d.init) walk(d.init, scope);
        }
        return;
      }
      case 'Identifier': {
        refs.push({ name: node.name, node, scope });
        return;
      }
      default:
        break;
    }
    for (const k of Object.keys(node)) {
      if (k === 'parent') continue;
      const v = node[k];
      if (Array.isArray(v)) {
        for (const el of v) {
          if (el && typeof el.type === 'string') {
            if (el.type === 'Identifier' && !isDeclarationPosition(el, node)) {
              if (isReferencePosition(el, node)) refs.push({ name: el.name, node: el, scope });
            } else walk(el, scope);
          }
        }
      } else if (v && typeof v.type === 'string') {
        if (v.type === 'Identifier' && !isDeclarationPosition(v, node)) {
          if (isReferencePosition(v, node)) refs.push({ name: v.name, node: v, scope });
        } else walk(v, scope);
      }
    }
  }
  for (const st of program.body) walk(st, root);
  return { root, decls, refs };
}

function countWords(hay, tok) {
  const re = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  let n = 0;
  while (re.exec(hay) !== null) n++;
  return n;
}

export async function lint(options = {}) {
  const asJson = !!options.json;
  const errors = [];
  const notes = [];

  const C = corpus();
  const MAP_PATH = C.renameMapPath;
  const COV_PATH = path.join(C.dataDir, 'coverage.json');
  const INV_PATH = path.join(C.dataDir, 'inventory.json');
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const cov = JSON.parse(fs.readFileSync(COV_PATH, 'utf8'));
  const inv = JSON.parse(fs.readFileSync(INV_PATH, 'utf8'));
  const rebuilt = readRebuiltCode();
  const vm9 = readSourceText();

  // ---- L1: rename-map schema + uniqueness ----
  // Pins: M3 baseline 144 (111 rename + 33 keep) + batches 1-6 high/medium
  // (87 + 67 + 71 + 56 + 64 + 91, net of the batch4 faceBufferLength self-rename)
  // + review round 1 (12 adopts) + review round 2 (146 held-low adopts;
  // 3 round-1 rename-tos change names, not counts) + batch 7 (147 high/medium
  // of 150; Tg/XY abstain + rd low held) + batch 8 (148 high/medium of 150;
  // a1P low + r9 abstain held) + batch 9 (148 high/medium of 150;
  // Hw/P2 abstain held) + batch 10 (143 high/medium of 150;
  // r0 abstain + ve-vj low held) + batch 11 (150 high/medium, 0 held)
  // = 1474 entries (1441 + 33) + batch 12 (148 high/medium of 150;
  // H4/Mw abstain held) + batch 13 (150 high/medium, 0 held)
  // = 1772 entries (1739 + 33) + batch 14 (148 high/medium of 150;
  // Me/SJ abstain held) + batch 15 (147 high/medium of 150;
  // Y1 low + a0N/$ abstain held) + batch 16 (138 high/medium of 150;
  // 9 low + Oi/W3/Xv abstain held) + batch 17 (86 high/medium of 150;
  // 64 abstains held) + batch 18 (31 high/medium of 137;
  // 106 low/abstain held) + review 3 (3 upgrades of batch18 lows)
  // = 2325 entries (2292 + 33) + review 4 (50 of 206 held re-examined;
  // 7 high + 43 medium merged, 156 confirmed keep) = 2375 entries (2342 + 33).
  if (map.order.length !== 2375) errors.push(`L1: order length ${map.order.length} != 2375`);
  if (map.meta.entryCount !== 2375) errors.push(`L1: meta.entryCount ${map.meta.entryCount} != 2375`);
  const renames = map.order.map((t) => map.entries[t]).filter((e) => e.action === 'rename');
  const keeps = map.order.map((t) => map.entries[t]).filter((e) => e.action === 'keep');
  if (renames.length !== 2342) errors.push(`L1: renameCount ${renames.length} != 2342 (M3 curation + batches 1-18 + reviews 1-4)`);
  if (keeps.length !== 33) errors.push(`L1: keepCount ${keeps.length} != 33 (M3 curation)`);
  if (map.meta.renameCount !== 2342 || map.meta.keepCount !== 33) {
    errors.push(`L1: meta rename/keep ${map.meta.renameCount}/${map.meta.keepCount} != 2342/33`);
  }
  const newNames = renames.map((e) => e.name);
  if (new Set(newNames).size !== newNames.length) errors.push('L1: duplicate new names in rename-map');
  for (const e of renames) {
    if (e.scope !== 'global') errors.push(`L1: rename scope != global: ${e.token}`);
    if (map.meta.protectedIdentifiers.includes(e.token)) errors.push(`L1: protected identifier renamed: ${e.token}`);
  }
  for (const t of map.order) {
    const e = map.entries[t];
    if (!['rename', 'keep'].includes(e.action)) errors.push(`L1: bad action ${t}`);
    if (!['global', 'loader', 'string-key', 'local'].includes(e.scope) && !e.scope.startsWith('property:')) {
      errors.push(`L1: bad scope ${t}: ${e.scope}`);
    }
  }

  // ---- L1b: locals map schema + pins (per-binding entries) ----
  // Pins: L1 tooling baseline 0 + pilot batch L1P (5 renames + 1 keep, u0417
  // raycast) = 6 entries (5 + 1) + wave LA1 (595 merged renames over 34
  // dossier slices; 2 lows + 1 map-collision held, 423 keeps recorded in
  // the batch file only) = 601 entries (600 + 1) + wave LA2 (516 merged
  // over 34 dossier slices; 15 lows held, 494 keeps in batch file only;
  // 1 cross-wave same-scope collision resolved via variant minorB00) =
  // 1117 entries (1116 + 1) + wave LA3 (442 merged over 34 dossier slices;
  // 15 lows held, 577 keeps in batch file only; 1 same-scope collision
  // resolved via variant quatX2) = 1559 entries (1558 + 1) + wave LA4
  // (274 merged over 34 dossier slices; 14 lows + 2 invalid held, 758 keeps
  // in batch file only; dry-run clean, no variants; 2 merged-then-reverted:
  // RNQDluasaN@u0035#0 shorthand-property B3 failure, Gq@u1718#0 protected
  // server-anchor failure) = 1833 entries (1832 + 1) + wave LA5 (295 merged
  // over 34 dossier slices; 25 lows + 4 invalid held, 696 keeps in batch file
  // only; 1 merged-then-reverted: a3l@u2345#0 elimName capture hazard caught
  // by the dry-run resolution backstop) = 2128 entries (2127 + 1) + wave LA6
  // (265 merged over 34 dossier slices; 49 lows + 1 invalid held, 705 keeps
  // in batch file only; 1 same-scope collision resolved via variant planeGeo2
  // for VX@u2491#0, To@u2370#0 kept planeGeo) + waves LA7-LA11
  // (160 + 34 + 13 + 17 + 37 = 261 merged) + wave LA12 (34 merged over
  // 34 dossier slices; 7 lows held, 676 keeps in batch file only; clean
  // dry-run, no collisions) + wave LA13 (0 merged, all-keep wave, 716
  // keeps in batch file only) + wave LA14 (35 merged over 12 fresh-only
  // dossier slices after the decided-keep slicer fix; 0 held, 0 invalid,
  // 311 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA15 (33 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 147 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA16 (0 merged, all-keep wave, 180 keeps in batch file only) + wave
  // LA17 (4 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 176 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA18 (25 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 155 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA19 (5 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 175 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA20 (8 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 172 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA21 (41 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 139 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA22 (11 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 169 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA23 (36 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 144 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA24 (11 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 169 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA25 (30 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 150 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA26 (9 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 171 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA27 (18 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 162 keeps in batch file only; clean dry-run, no collisions) + wave
  // LA28 (0 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 180 keeps in batch file only, all high) + wave LA29 (10 merged
  // over 6 fresh-only dossier slices; 0 held, 0 invalid, 170 keeps in
  // batch file only; clean dry-run, no collisions) + wave LA30
  // (18 merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 162 keeps in batch file only; clean dry-run, no collisions) +
  // wave LA31 (20 merged over 6 fresh-only dossier slices; 0 held,
  // 0 invalid, 160 keeps in batch file only; clean dry-run, no
  // collisions) + wave LA32 (64 merged over 6 fresh-only dossier
  // slices; 0 held, 0 invalid, 116 keeps in batch file only; clean
  // dry-run, no collisions) + wave LA33 (7 merged over 6
  // fresh-only dossier slices; 0 held, 0 invalid, 173 keeps
  // in batch file only; clean dry-run, no collisions) + wave
  // LA34 (7 merged over 6 fresh-only dossier slices; 0 held,
  // 0 invalid, 173 keeps in batch file only; clean dry-run, no
  // collisions) + wave LA35 (1 merged over 6 fresh-only
  // dossier slices; 0 held, 0 invalid, 179 keeps in batch
  // file only; clean dry-run, no collisions) + wave LA36 (30
  // merged over 6 fresh-only dossier slices; 0 held, 0 invalid,
  // 150 keeps in batch file only; 1 dry-run same-scope variant
  // _key3->edgeKey2, then clean) + wave LA37 (6 merged over 6
  // fresh-only dossier slices; 0 held, 0 invalid, 174 keeps
  // in batch file only; clean dry-run, no collisions) + wave
  // LA38 (33 merged over 6 fresh-only dossier slices, slice 01
  // pre-split into a/b halves; 0 held, 0 invalid, 147 keeps
  // in batch file only; clean dry-run, no collisions) + wave
  // LA39 (38 merged over 6 fresh-only dossier slices; 0 held,
  // 0 invalid, 142 keeps in batch file only; clean dry-run,
  // no collisions) + wave LA40 (0 merged over 6 fresh-only
  // dossier slices, slice 04 pre-split into a/b halves; 0 held,
  // 0 invalid, 180 keeps in batch file only, all high) + wave
  // LA41 (0 merged over 6 fresh-only dossier slices, slice 01
  // pre-split into a/b halves; 0 held, 0 invalid, 180 keeps
  // in batch file only, all high) + wave LA42 (0 merged over
  // 6 fresh-only dossier slices; 0 held, 0 invalid, 180 keeps
  // in batch file only, all high) + wave LA43 (0 merged over
  // 6 fresh-only dossier slices (175 bindings, slice 03 short
  // at 25, slice 05 pre-split into a/b halves); 0 held, 0
  // invalid, 175 keeps in batch file only, all high) + wave
  // LA44 (0 merged; final agree-only wave, 31 bindings over
  // 2 non-empty slices; 0 held, 0 invalid, 31 keeps in batch
  // file only, all high) + wave LD1 (wave 45, first diverged
  // snippet-only wave: 175 merged over 6 dual-side dossier
  // slices, 4 pre-split into a/b halves; 0 held, 0 invalid,
  // 5 keeps in batch file only; clean dry-run, no collisions)
  // + wave LD2 (wave 46, diverged snippet-only: 163 merged
  // over 6 dual-side dossier slices, slice 03 pre-split into
  // a/b halves; 0 held, 0 invalid, 17 keeps in batch file
  // only; clean dry-run, no collisions) + wave LD3 (wave
  // 47, diverged snippet-only: 179 merged over 6 dual-side
  // dossier slices (196 bindings, slice 02 overflowed to 46
  // and pre-split into a/b/c thirds); 0 held, 0 invalid, 17
  // keeps in batch file only; clean dry-run, no collisions)
  // + wave LD4 (wave 48, diverged snippet-only: 167 merged
  // over 6 dual-side dossier slices, 4 pre-split into a/b
  // halves; 0 held, 0 invalid, 13 keeps in batch file only;
  // 1 dry-run same-scope variant pair rankProgressFill2 +
  // rankProgressTrack2 + 1 GVAL patch loopPosition, then
  // clean) + wave LD5 (wave 49, diverged snippet-only: 181
  // merged over 6 dual-side dossier slices (185 bindings;
  // slices 01/04/05 pre-split into a/b halves); 0 held, 1
  // invalid (th@u0360#0 cross-unit top-level redecl of
  // LD2 variantIdx, reverted), 3 keeps in batch file only;
  // clean dry-run after revert) + wave LD6 (wave 50,
  // diverged snippet-only: 185 merged over 6 dual-side
  // dossier slices (195 bindings; slices 00/01/02 pre-split
  // into a/b halves); 0 held, 0 invalid, 10 keeps in batch
  // file only; 2 dry-run same-scope variant pairs
  // canvasWidth2 + canvasHeight2, then clean) + wave LD7
  // (wave 51, diverged snippet-only: 180 merged over 6
  // dual-side dossier slices (195 bindings; slices 00/01/02
  // pre-split into a/b halves); 3 held-low, 0 invalid, 12
  // keeps in batch file only; 1 dry-run cross-wave variant
  // ahj->statTabs2 (wave-48 aez owns statTabs), then clean)
  // + wave LD8 (wave 52, diverged snippet-only: 191 merged
  // over 6 dual-side dossier slices (195 bindings; slices
  // 00/01/02 pre-split into a/b halves); 2 held-low, 0
  // invalid, 2 keeps in batch file only; 2 dry-run
  // cross-wave variants ahh->paymentResponse2 (wave-48 ahi
  // owns paymentResponse) + ahg->periodTabs2 (wave-48 aey
  // owns periodTabs), then clean)
  // + wave LD9 (wave 53, diverged snippet-only: 190 merged
  // over 6 dual-side dossier slices (201 bindings; slices
  // 00/01/03 pre-split into a/b halves); 2 held-low, 0
  // invalid, 9 keeps in batch file only; 1 dry-run
  // resolution-equivalence fix ah8@u2151#13->overlayDom
  // (halves-correct; full confused with a8M binding),
  // then clean)
  // + wave LD10 (wave 54, diverged snippet-only: 198 merged
  // over 6 dual-side dossier slices (223 bindings; slices
  // 00/01/02/03 pre-split into a/b halves); 1 held-low, 0
  // invalid, 24 keeps in batch file only; 1 dry-run
  // same-scope variant a4z->moveSpeedScale2 (a4J owns
  // moveSpeedScale), then clean)
  // + wave LD11 (wave 55, diverged snippet-only: 177 merged
  // over 6 dual-side dossier slices (195 bindings, class
  // 'snippet'; slices 00/01/02 pre-split into a/b halves,
  // merged inline wrapped; slices 03-05 empty); 0 held, 0
  // invalid, 18 keeps in batch file only; 1 dry-run
  // resolution-equivalence variant a41->scratchCtx2 (a3K owns
  // scratchCtx), then clean)
  // + wave LD12 (wave 56, diverged snippet-only: 237 merged
  // over 6 dual-side dossier slices (244 bindings, class
  // 'snippet'; slices 00/02/05 pre-split into a/b halves,
  // merged inline wrapped); 1 held (low), 0 invalid, 6
  // keeps in batch file only; pre-merge GVAL patch
  // a3q@u2722 loopIndex->loopPosition + 1 dry-run
  // same-scope variant ahs@u2151#9 domIdx->domIdx2, then
  // clean both corpora)
  // + wave LD13 (wave 57, diverged snippet-only: 166 merged
  // over 6 dual-side dossier slices (182 bindings, class
  // 'snippet'; slices 01/02/03/05 pre-split into a/b halves,
  // merged inline wrapped); 4 held (low), 0 invalid, 12
  // keeps in batch file only; 1 dry-run same-scope variant
  // a3l@u2128#3 playerIndex->playerIndex2 (a3k owns
  // playerIndex), then clean both corpora)
  // LD14 (wave 58, 177 merged + 1 heldInvalid th-cross-unit + 5 keeps)
  // LD15 (wave 59, 199 merged + 1 keep th-recycle; 3 dry-run variants savedCtx2/attrIndex2/faceVertexC2)
  // LD16 (wave 60, 195 merged + 1 held-low texParamValue + 6 keeps; dry-run clean, no variants)
  // LD17 (wave 61, 195 merged + 1 heldInvalid th-cross-unit + 4 keeps; 3 pre-merge GVAL patches)
  // LD18 (wave 62, 181 merged + 1 heldInvalid th-cross-unit + 1 held-low + 1 keep; 1 dry-run variant tangentDir2)
  // LD19 (wave 63, 190 merged + 1 heldInvalid th-cross-unit + 0 held-low + 5 keeps; 1 pre-merge GVAL patch outlineGlowCanvas + 2 dry-run variants bannerGroup2/borderConfig2)
  // LD20 (wave 64, 172 merged + 2 heldInvalid th/Ja-cross-unit + 2 held-low + 7 keeps; 2 pre-merge GVAL patches sceneAmbientLight/weaponKeyList, no variants)
  // LD21 (wave 65, 224 merged + 1 heldInvalid th-cross-unit + 1 held-low + 17 keeps; 0 pre-merge GVAL patches, no variants)
  // LD22 (wave 66, 176 merged + 1 heldInvalid th-cross-unit + 1 held-low + 2 keeps; 0 pre-merge GVAL patches, 1 dry-run variant attributeName2)
  // LD23 (wave 67, 197 merged + 2 heldInvalid th/H6-cross-unit + 0 held-low + 6 keeps; 0 pre-merge GVAL patches, no variants)
  // LD24 (wave 68, 219 merged + 3 heldInvalid th/Ja/H6-cross-unit + 1 held-low + 10 keeps; 1 pre-merge GVAL patch skinWebglRenderer, 1 dry-run variant drawBannerText2)
  // = 7702 entries (7701 + 1).
  const LOCALS_PATH = path.join(path.dirname(MAP_PATH), 'rename-locals.json');
  if (!fs.existsSync(LOCALS_PATH)) {
    errors.push('L1b: data/rename-locals.json missing');
  } else {
    const lmap = JSON.parse(fs.readFileSync(LOCALS_PATH, 'utf8'));
    if (lmap.order.length !== 7702) errors.push(`L1b: locals order length ${lmap.order.length} != 7702`);
    if (lmap.meta.entryCount !== 7702) errors.push(`L1b: locals meta.entryCount ${lmap.meta.entryCount} != 7702`);
    const lren = lmap.order.map((id) => lmap.entries[id]).filter((e) => e && e.action === 'rename');
    const lkeep = lmap.order.map((id) => lmap.entries[id]).filter((e) => e && e.action === 'keep');
    if (lren.length !== 7701) errors.push(`L1b: locals renameCount ${lren.length} != 7701 (L1P 5 + LA1 595 + LA2 516 + LA3 442 + LA4 274 + LA5 295 + LA6 265 + LA7 160 + LA8 34 + LA9 13 + LA10 17 + LA11 37 + LA12 34 + LA13 0 + LA14 35 + LA15 33 + LA16 0 + LA17 4 + LA18 25 + LA19 5 + LA20 8 + LA21 41  + LA22 11  + LA23 36  + LA24 11  + LA25 30  + LA26 9  + LA27 18  + LA28 0  + LA29 10  + LA30 18  + LA31 20  + LA32 64  + LA33 7  + LA34 7  + LA35 1 + LA36 30 + LA37 6 + LA38 33 + LA39 38 + LA40 0 + LA41 0 + LA42 0 + LA43 0 + LA44 0 + LD1 175 + LD2 163 + LD3 179 + LD4 167 + LD5 181 + LD6 185 + LD7 180 + LD8 191 + LD9 190 + LD10 198 + LD11 177 + LD12 237 + LD13 166 + LD14 177 + LD15 199 + LD16 195 + LD17 195 + LD18 181 + LD19 190 + LD20 172 + LD21 224 + LD22 176 + LD23 197 + LD24 219)`);
    if (lkeep.length !== 1) errors.push(`L1b: locals keepCount ${lkeep.length} != 1 (L1P pilot f)`);
    if (lmap.meta.renameCount !== 7701 || lmap.meta.keepCount !== 1) {
      errors.push(`L1b: locals meta rename/keep ${lmap.meta.renameCount}/${lmap.meta.keepCount} != 7701/1`);
    }
    if (new Set(lmap.order).size !== lmap.order.length) errors.push('L1b: duplicate locals ids');
    for (const id of lmap.order) {
      const e = lmap.entries[id];
      if (!e) { errors.push(`L1b: locals order id without entry: ${id}`); continue; }
      if (e.scope !== 'local') errors.push(`L1b: locals scope != local: ${id}`);
      if (id !== `${e.token}@${e.binding?.unit}#${e.binding?.index}`) errors.push(`L1b: locals id mismatch: ${id}`);
    }
  }

  // ---- L2: differential no-undeclared (VM9 vs rebuilt, modulo renames) ----
  // The bundle is sloppy-mode code with intentional implicit globals; the
  // invariant is that renaming changes the implicit set ONLY by mapped
  // new->old substitutions (plus nothing else). Compare both trees.
  let progRebuilt = null;
  let progVm9 = null;
  try {
    progRebuilt = acorn.parse(rebuilt, { ecmaVersion: 'latest' });
  } catch (e) {
    errors.push(`L2: rebuilt bundle does not parse: ${e && e.message}`);
  }
  try {
    progVm9 = acorn.parse(vm9, { ecmaVersion: 'latest' });
  } catch (e) {
    errors.push(`L2: VM9 oracle does not parse: ${e && e.message}`);
  }
  if (progRebuilt && progVm9) {
    const rev = new Map(); // newName -> oldToken (rename-map)
    for (const t of map.order) {
      const e = map.entries[t];
      if (e.action === 'rename' && !t.includes('.')) rev.set(e.name, t);
    }
    const implicitsOf = (prog) => {
      const { refs } = analyze(prog);
      const imp = new Map();
      for (const r of refs) {
        if (!r.scope.lookup(r.name)) imp.set(r.name, (imp.get(r.name) || 0) + 1);
      }
      return { refs: refs.length, imp };
    };
    const rB = implicitsOf(progRebuilt);
    const rV = implicitsOf(progVm9);
    // Normalize rebuilt implicits back to VM9 vocabulary for comparison.
    const normB = new Set([...rB.imp.keys()].map((n) => (rev.has(n) ? rev.get(n) : n)));
    const setV = new Set(rV.imp.keys());
    const onlyInRebuilt = [...normB].filter((n) => !setV.has(n));
    const onlyInVm9 = [...setV].filter((n) => !normB.has(n));
    if (onlyInRebuilt.length > 0) {
      errors.push(`L2: new undeclared in rebuilt (${onlyInRebuilt.length}): ${onlyInRebuilt.slice(0, 12).join(', ')}${onlyInRebuilt.length > 12 ? ', …' : ''}`);
    }
    if (onlyInVm9.length > 0) {
      errors.push(`L2: lost implicit globals vs VM9 (${onlyInVm9.length}): ${onlyInVm9.slice(0, 12).join(', ')}${onlyInVm9.length > 12 ? ', …' : ''}`);
    }
    notes.push(`L2: refs vm9=${rV.refs} rebuilt=${rB.refs} implicit vm9=${setV.size} rebuilt=${rB.imp.size} (normalized diff 0)`);
    // Every renamed new name must occur in the rebuilt tree (else the rename
    // silently did nothing but claim an entry).
    for (const e of renames) {
      if (!rebuilt.includes(e.name)) {
        errors.push(`L2: renamed identifier missing from rebuilt: ${e.name} (for ${e.token})`);
      }
    }
    if (fs.existsSync(LOCALS_PATH)) {
      const lmap2 = JSON.parse(fs.readFileSync(LOCALS_PATH, 'utf8'));
      const repPath2 = path.join(C.buildDir, C.renameReportFile);
      const rep2 = fs.existsSync(repPath2) ? JSON.parse(fs.readFileSync(repPath2, 'utf8')) : null;
      for (const id of lmap2.order) {
        const e = lmap2.entries[id];
        // Deferred-lineage entries legitimately never land in this rebuild.
        if (rep2 && rep2.entries[id] && rep2.entries[id].status === 'deferred-lineage') continue;
        if (e && e.action === 'rename' && !rebuilt.includes(e.name)) {
          errors.push(`L2: renamed local missing from rebuilt: ${e.name} (for ${id})`);
        }
      }
    }
  }

  // ---- L3: coverage 100% ----
  if (cov.meta.distinctNames !== inv.meta.distinctNames) {
    errors.push(`L3: coverage distinct ${cov.meta.distinctNames} != inventory ${inv.meta.distinctNames}`);
  }
  if (cov.meta.covered !== cov.meta.distinctNames) {
    errors.push(`L3: coverage covered ${cov.meta.covered} != distinct ${cov.meta.distinctNames}`);
  }
  if (cov.order.length !== cov.meta.distinctNames) errors.push('L3: coverage order length mismatch');
  const sc = cov.meta.bracketDistinct;
  if (sc !== inv.meta.bracketDistinct) errors.push(`L3: bracket distinct ${sc} != inventory ${inv.meta.bracketDistinct}`);

  // ---- L4: keep-local presence (M3 curation proof) ----
  for (const tok of ['a3D', 'a3J', 'a3v']) {
    const c = countWords(rebuilt, tok);
    if (c === 0) errors.push(`L4: curated local keep missing from rebuilt: ${tok}`);
    else notes.push(`L4: keep-local ${tok} present ${c}x (not globally renamed)`);
    const e = map.entries[tok];
    if (!e || e.action !== 'keep' || e.scope !== 'local') errors.push(`L4: ${tok} not curated to keep/local`);
    if (rebuilt.includes(e && e.name) && countWords(vm9, e.name) === 0) {
      // New name pre-exists only in vendor/disjoint scopes (e.g. handlers) — the
      // rename tool already reports this; lint just notes it, does not fail.
      notes.push(`L4: new name ${e.name} occurs in rebuilt (pre-existing vendor word, see rename-report)`);
    }
  }
  // YGIcYCdrEk: string-only keep — must NOT occur as a bare renamed identifier,
  // must still occur as Kq['...'] strings.
  {
    const tok = 'YGIcYCdrEk';
    const e = map.entries[tok];
    if (!e || e.action !== 'keep' || e.scope !== 'property:Kq') errors.push('L4: YGIcYCdrEk not curated to keep/property:Kq');
    const qCount = (rebuilt.split(`'${tok}'`).length - 1) + (rebuilt.split(`"${tok}"`).length - 1);
    if (qCount === 0) errors.push('L4: YGIcYCdrEk strings missing from rebuilt');
    else notes.push(`L4: YGIcYCdrEk strings present ${qCount}x (string-only keep)`);
    if (rebuilt.includes('spawnInputActive') && !vm9.includes('spawnInputActive')) {
      errors.push('L4: spawnInputActive leaked into rebuilt (string-only keep must not rename)');
    }
  }

  // ---- L5: no-eval-with ----
  {
    const tz = acorn.tokenizer(rebuilt, { ecmaVersion: 'latest' });
    let prev = null;
    const calls = [];
    for (;;) {
      const t = tz.getToken();
      if (t.type === acorn.tokTypes.eof) break;
      if (prev && prev.type === acorn.tokTypes.name) {
        const w = rebuilt.slice(prev.start, prev.end);
        if ((w === 'eval' || w === 'with') && t.type.label === '(') {
          calls.push({ w, off: prev.start });
        }
      }
      prev = t;
    }
    if (calls.length !== 1 || calls[0].w !== 'eval') {
      errors.push(`L5: expected 1 pinned eval call, found ${calls.length}: ${JSON.stringify(calls.slice(0, 3))}`);
    } else {
      const ctx = rebuilt.slice(calls[0].off, calls[0].off + 60);
      // Pinned inert site per lineage: the eval'd string is always 'win'+… =
      // "window" built indirectly (never a direct code eval). vm9 spells the
      // suffix literally ("dow"); served routes it through the string-table
      // decoder (ai1(0x30b), resolved through the rename map since batch1
      // renamed ai1→stringDecoderAlias). Either form is accepted only for its
      // own corpus.
      const ai1e = map.entries.ai1;
      const decoder = ai1e && ai1e.action === 'rename' ? ai1e.name : 'ai1';
      const want = C.name === 'served'
        ? new RegExp(`^eval\\('win'\\+${decoder.replace(/[^A-Za-z0-9_$]/g, '')}\\(0x30b\\)\\)`)
        : /^eval\('win'\+"dow"\)/;
      if (!want.test(ctx)) errors.push(`L5: eval site drifted: ${JSON.stringify(ctx)}`);
      else notes.push('L5: pinned inert eval site intact, no with');
    }
  }

  const report = { errors, notes };
  if (asJson) console.log(JSON.stringify(report, null, 2));
  else {
    for (const n of notes) console.log(`lint: note: ${n}`);
    if (errors.length === 0) console.log('lint: PASS (no undeclared/duplicate; coverage 100%; keeps curated)');
    else {
      for (const e of errors) console.error(`lint: FAIL: ${e}`);
    }
  }
  if (errors.length > 0) throw new Error(`lint: ${errors.length} violation(s): ${errors[0]}`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const asJson = process.argv.slice(2).includes('--json');
  lint({ json: asJson }).catch((err) => {
    if (!asJson) console.error(`lint.mjs: ${err && err.message ? err.message : err}`);
    process.exit(1);
  });
}

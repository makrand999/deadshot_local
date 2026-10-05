// client-deob/tools/rename.mjs — Phase B/C scope-aware apply (M2)
//
// Reads:  ../data/rename-map.json (seeded by tools/seed-rename-map.mjs)
//         ../src/**/*.js (fragments from tools/emit.mjs; must be the UNRENAMED
//         M1 tree — re-running on a renamed tree is refused, reset via emit)
//         ../../raw/bundles/VM9.deob.txt (immutable freshness oracle for new names)
// Writes: renamed ../src/**/*.js (marker ranges stay VM9-original; marker len=
//         tracks the CURRENT body length — see tools/README.md fragment format)
//         ../build/rename-report.json (per-entry stats for human review)
//
// Method: concatenate unit bodies in emission order (== whole program), single
// acorn parse, custom scope builder (var hoisting incl. sloppy Annex B,
// let/const/class block scope, params, catch params, named function expressions),
// then per scope=global entry rename ONLY the declaration + references resolving
// to the OUTERMOST binding of the old token. Same-named unrelated bindings (e.g.
// the ~12 THREE.js matrix `a11` locals vs the `a11` dispatch function; the vendor
// FileLoader `handlers` local vs ex-`a0I`) are left untouched by construction.
// Soundness assumption (guarded by tests/rename.test.mjs): the only direct
// eval in the tree is the inert global-access `eval('win'+"dow")`, and there is
// no `with` — so lexical scope resolution is sound. Any other lineage with more
// eval/with fails the test and forces an analysis upgrade.
// Capture safety: new names are fresh w.r.t. VM9, same-scope merges and
// nearer-scope captures are asserted per renamed reference (fail loudly).
// Strings, numbers, property positions (non-computed `.x`), labels and template
// parts are never touched. scope=property rename-action entries are refused
// (their properties live only as `base['key']` strings — deferred to M3).
//
// Usage: node tools/rename.mjs --apply|--dry-run|--census  (default --apply)
//   --census writes build/local-bindings.json (per-binding locals census for
//   proposers; requires the M1 tree) instead of applying renames.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { parseFragmentFile, MARKER_RE_SRC } from './emit.mjs';
import { corpus, readSourceText } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DEOB_DIR = path.resolve(__dirname, '..');
// Corpus paths resolve lazily inside rename() (see below); the rename map
// stays canonical at data/rename-map.json for both corpora.

const RESERVED = new Set(
  ('break case catch class const continue debugger default delete do else export extends ' +
    'finally for function if import in instanceof new return super switch this throw try ' +
    'typeof var void while with yield let static enum await implements interface package ' +
    'private protected public null true false').split(' ')
);

function identifierNamesOf(src) {
  const names = new Set();
  const tz = acorn.tokenizer(src, { ecmaVersion: 'latest' });
  for (;;) {
    const t = tz.getToken();
    if (t.type === acorn.tokTypes.eof) break;
    if (t.type === acorn.tokTypes.name) names.add(src.slice(t.start, t.end));
  }
  return names;
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
  walk(dir);
  return out.sort();
}

class Scope {
  constructor(type, parent, depth) {
    this.type = type; // 'root' | 'function' | 'block' | 'catch' | 'named-fn'
    this.parent = parent;
    this.depth = depth;
    this.bindings = new Map(); // name -> { kind, node }
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

function declarePattern(node, scope, kind, sink) {
  if (!node) return;
  if (node.type === 'Identifier') {
    if (!scope.bindings.has(node.name)) scope.bindings.set(node.name, { kind, node });
    // Params/catch-params/patterns: bindings exist for resolution, but decls[]
    // only records var/let/const/function/class positions (B3 pins that shape).
    // Pattern declarators go to the separate paramDecls census (locals phase).
    if (sink && (kind === 'param' || kind === 'catch-param')) sink.push({ name: node.name, node, scope, kind });
  } else if (node.type === 'ObjectPattern') {
    for (const p of node.properties) {
      if (p.type === 'RestElement') declarePattern(p.argument, scope, kind, sink);
      else declarePattern(p.value, scope, kind, sink);
    }
  } else if (node.type === 'ArrayPattern') {
    for (const el of node.elements) declarePattern(el, scope, kind, sink);
  } else if (node.type === 'RestElement') {
    declarePattern(node.argument, scope, kind, sink);
  } else if (node.type === 'AssignmentPattern') {
    declarePattern(node.left, scope, kind, sink);
  }
}

// Hoisted (var + function) declarations visible throughout a function scope,
// stopping at nested function boundaries. Conservative Annex B: sloppy-mode
// block-level function declarations bind the block AND the var scope.
function hoistScan(node, fnScope, inBlock, strict) {
  if (!node || typeof node.type !== 'string') return;
  if (isFunctionNode(node)) return; // nested function: own scope handles it
  if (node.type === 'VariableDeclaration' && node.kind === 'var' && !inBlock) {
    for (const d of node.declarations) declarePattern(d.id, fnScope, 'var');
  }
  if (node.type === 'VariableDeclaration' && node.kind === 'var' && inBlock) {
    for (const d of node.declarations) declarePattern(d.id, fnScope, 'var');
    return;
  }
  if (node.type === 'FunctionDeclaration' && node.id) {
    // Sloppy-mode block-level functions also bind the var scope (Annex B);
    // strict-mode ones bind the block only (main walk handles the block side).
    if (!(inBlock && strict)) {
      if (!fnScope.bindings.has(node.id.name)) fnScope.bindings.set(node.id.name, { kind: 'function', node: node.id });
    }
    return; // do not descend into its body here
  }
  for (const k of Object.keys(node)) {
    if (k === 'parent') continue;
    const v = node[k];
    if (Array.isArray(v)) {
      for (const el of v) {
        if (el && typeof el.type === 'string') {
          hoistScan(el, fnScope, inBlock || node.type === 'BlockStatement' || node.type === 'StaticBlock', strict);
        }
      }
    } else if (v && typeof v.type === 'string') {
      hoistScan(v, fnScope, inBlock, strict);
    }
  }
}

function isReferencePosition(node, parent) {
  if (!parent) return true;
  // Labels never rename.
  if ((parent.type === 'LabeledStatement' && parent.label === node) ||
      ((parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && parent.label === node)) {
    return false;
  }
  // Non-computed properties live in the property namespace, not the variable one.
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return false;
  if ((parent.type === 'Property' || parent.type === 'ObjectProperty') && parent.key === node && !parent.computed) return false;
  if ((parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition' || parent.type === 'ObjectMethod' || parent.type === 'ClassMethod' || parent.type === 'ClassPrivateMethod') && parent.key === node && !parent.computed) return false;
  if ((parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier' || parent.type === 'ExportSpecifier') && parent.local !== node) return false;
  return true;
}

// Shorthand object values ({tok}) are variable refs that ALSO fix the property
// key: renaming the token would rename the key, which B3 forbids. The engine
// has no shorthand-expansion machinery, so the census flags these bindings
// (hasShorthand) and the slicer/merger hold them. Refs collected via the
// `case 'Identifier'` site are never shorthand values (those always arrive as
// Property children through the generic descent above), so they need no tag.
function isShorthandValue(node, parent) {
  return !!parent && (parent.type === 'Property' || parent.type === 'ObjectProperty') &&
    parent.value === node && !!parent.shorthand;
}

function isDeclarationPosition(node, parent) {
  if (!parent) return false;
  if ((parent.type === 'VariableDeclarator' && parent.id === node) ||
      ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression') && parent.id === node) ||
      ((parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') && parent.id === node) ||
      (parent.type === 'CatchClause' && parent.param === node)) return true;
  return false;
}

// Full walk: builds scopes, collects declarations + references with positions.
// Positions are offsets in the concatenated program text.
//
// NOTE (M4): exported for tools/behavioral.mjs B3 (differential binding parity).
// The analysis is read-only; exporting changes no behavior.
export function analyze(program) {
  const root = new Scope('root', null, 0);
  const decls = []; // { name, node, scope }
  const paramDecls = []; // { name, node, scope, kind } params + catch-params (locals census; NOT in decls/B3)
  const refs = []; // { name, node, scope }
  const propUses = []; // non-computed property names (namespace guard data)

  function declare(node, scope, kind) {
    if (!scope.bindings.has(node.name)) scope.bindings.set(node.name, { kind, node });
    decls.push({ name: node.name, node, scope });
  }

  function enterFunction(fnNode, parentScope, nameKind) {
    const s = new Scope('function', parentScope, parentScope.depth + 1);
    const hasStrict = fnNode.body && fnNode.body.type === 'BlockStatement' &&
      fnNode.body.body.some((st) => st.type === 'ExpressionStatement' && st.directive === 'use strict');
    s.strict = hasStrict || parentScope.strict;
    if (fnNode.id && (fnNode.type === 'FunctionExpression' || fnNode.type === 'ArrowFunctionExpression')) {
      // Named function expression: name binds in an intermediate scope.
      const ns = new Scope('named-fn', s, s.depth + 1);
      ns.bindings.set(fnNode.id.name, { kind: 'function-name', node: fnNode.id });
      decls.push({ name: fnNode.id.name, node: fnNode.id, scope: ns });
      for (const p of fnNode.params) declarePattern(p, s, 'param', paramDecls);
      hoistScan(fnNode.body, s, false, s.strict);
      walk(fnNode.body, s);
      return;
    }
    for (const p of fnNode.params || []) declarePattern(p, s, 'param', paramDecls);
    hoistScan(fnNode.body, s, false, s.strict);
    walk(fnNode.body, s);
  }

  function walk(node, scope) {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'FunctionDeclaration': {
        if (node.id) {
          // Block-level (non-direct-child-of-function/program) declarations:
          // strict → block scope; sloppy → block + var scope (Annex B).
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
        if (node.param) declarePattern(node.param, s, 'catch-param', paramDecls);
        walk(node.body, s);
        return;
      }
      case 'ClassDeclaration':
        if (node.id) declare(node.id, scope, 'class');
        walkClasses(node, scope);
        return;
      case 'ClassExpression': {
        const s = scope;
        if (node.id) {
          const ns = new Scope('named-fn', scope, scope.depth + 1);
          ns.bindings.set(node.id.name, { kind: 'class-name', node: node.id });
          decls.push({ name: node.id.name, node: node.id, scope: ns });
          walkClasses(node, ns);
        } else walkClasses(node, s);
        return;
      }
      case 'VariableDeclaration': {
        for (const d of node.declarations) {
          if (node.kind === 'var') {
            // Already hoisted; record position. (Bindings map keeps first.)
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
            // Resolve the hoisted scope for the record.
            for (const n of names) {
              const bs = scope.lookup(n.name) || scope;
              decls.push({ name: n.name, node: n, scope: bs });
            }
          } else {
            declarePattern(d.id, scope, node.kind);
            // Record positions for let/const declarators.
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
        // Reached only for expression positions (declarations handled by parents above
        // except var-declarator ids recorded above; this case = reference).
        refs.push({ name: node.name, node, scope });
        return;
      }
      default:
        break;
    }
    // Generic descent with parent-aware identifier classification.
    for (const k of Object.keys(node)) {
      if (k === 'parent') continue;
      const v = node[k];
      if (Array.isArray(v)) {
        for (const el of v) {
          if (el && typeof el.type === 'string') {
            if (el.type === 'Identifier' && !isDeclarationPosition(el, node)) {
              if (isReferencePosition(el, node)) refs.push({ name: el.name, node: el, scope, shorthand: isShorthandValue(el, node) });
              else if (el !== node) propUses.push({ name: el.name, node: el, scope });
            } else walk(el, scope);
          }
        }
      } else if (v && typeof v.type === 'string') {
        if (v.type === 'Identifier' && !isDeclarationPosition(v, node)) {
          if (isReferencePosition(v, node)) refs.push({ name: v.name, node: v, scope, shorthand: isShorthandValue(v, node) });
          else propUses.push({ name: v.name, node: v, scope });
        } else walk(v, scope);
      }
    }
  }

  function walkClasses(node, scope) {
    if (node.superClass) walk(node.superClass, scope);
    if (node.body) walk(node.body, scope);
  }

  // Note: Program body statements walk in root scope.
  for (const st of program.body) walk(st, root);
  return { root, decls, refs, propUses, paramDecls };
}

function resolveRef(ref) {
  return ref.scope.lookup(ref.name);
}

// ---- Locals phase: per-binding census + resolution ----

// Index every local binding by "unitId|token" in absolute-offset order. Shared
// by --census and apply so selectors mean the same in both. decls and
// paramDecls interleave by position; index = rank within (unit, token).
function indexLocalDecls(allDecls, locate, ordered) {
  const byKey = new Map();
  const sorted = [...allDecls].sort((a, b) => a.node.start - b.node.start);
  for (const d of sorted) {
    const { idx } = locate(d.node.start);
    const key = `${ordered[idx].unit.id}|${d.name}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(d);
  }
  return byKey;
}

// Whole-tree post-rename resolution equivalence (locals backstop, also covers
// globals). Simulates every binding rename, then re-resolves EVERY reference:
// any ref whose target binding identity changes (including implicit-global
// flips and same-scope merges) throws. Per-entry capture checks give better
// errors for common cases; this is the complete net for cross-entry hazards
// (two entries, same new name, overlapping chains).
function assertResolutionEquivalence(refs, refTarget, renamesByScope, implicitRenames) {
  // renamesByScope: Map<Scope, Map<oldName, newName>>; implicitRenames:
  // Map<token, newName> for global entries targeting implicit globals.
  const postBinding = (scope, name) => {
    // Walk the simulated chain: nearest scope whose POST image binds `name`.
    for (let s = scope; s; s = s.parent) {
      const rn = renamesByScope.get(s);
      if (rn) {
        for (const [oldN, newN] of rn) {
          if (newN === name) return { scope: s, pre: oldN };
        }
        if (rn.has(name)) continue; // renamed away here
      }
      if (s.bindings.has(name)) return { scope: s, pre: name };
    }
    return null;
  };
  refs.forEach((r, i) => {
    const preT = refTarget.get(i);
    const pre = preT ? { scope: preT, pre: r.name } : null;
    let postName = r.name;
    // A ref is renamed iff its own binding was renamed (same scope+name).
    const own = preT ? renamesByScope.get(preT) : null;
    if (own && own.get(r.name)) postName = own.get(r.name);
    else if (!preT && implicitRenames.has(r.name)) postName = implicitRenames.get(r.name);
    const post = postBinding(r.scope, postName);
    const same = (pre === null && post === null) ||
      (pre && post && pre.scope === post.scope && pre.pre === post.pre);
    if (!same) {
      const fmt = (x) => (x ? `depth${x.scope.depth}:${x.pre}` : 'implicit');
      throw new Error(`rename: resolution changed for ref ${JSON.stringify(r.name)} at offset ${r.node.start}: ${fmt(pre)} -> ${fmt(post)} (rename ${JSON.stringify(r.name)}->${JSON.stringify(postName)})`);
    }
  });
}

export async function rename(options = {}) {
  const dryRun = !!options.dryRun;
  const C = corpus();
  const SRC_DIR = C.srcDir;
  const BUILD_DIR = C.buildDir;
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const MAP_PATH = C.renameMapPath;
  const REPORT_OUT = path.join(BUILD_DIR, C.renameReportFile);
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const { meta: unitsMeta, units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const vm9 = readSourceText();

  const renameEntries = map.order.map((t) => map.entries[t]).filter((e) => e.action === 'rename');
  const keepEntries = map.order.map((t) => map.entries[t]).filter((e) => e.action === 'keep');

  // ---- Static guards (map-level, independent of src state) ----
  for (const e of renameEntries) {
    if (e.scope !== 'global') {
      throw new Error(`rename: scope=${e.scope} rename not supported in M2 (deferred to M3): ${e.token}`);
    }
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.token) || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.name)) {
      throw new Error(`rename: invalid token/name pair: ${e.token} -> ${e.name}`);
    }
    if (RESERVED.has(e.name)) throw new Error(`rename: new name is reserved: ${e.name} (for ${e.token})`);
    if (map.meta.protectedIdentifiers.includes(e.token)) {
      throw new Error(`rename: token is a protected server anchor: ${e.token}`);
    }
  }
  const newNameUse = new Map();
  for (const e of renameEntries) {
    if (newNameUse.has(e.name)) throw new Error(`rename: duplicate new name ${e.name} (${newNameUse.get(e.name)}, ${e.token})`);
    newNameUse.set(e.name, e.token);
  }
  if (new Set(renameEntries.map((e) => e.token)).size !== renameEntries.length) {
    throw new Error('rename: duplicate old tokens in map');
  }
  // ---- Locals map (per-binding entries; empty until the locals phase) ----
  const LOCALS_PATH = path.join(DEOB_DIR, 'data', 'rename-locals.json');
  if (!fs.existsSync(LOCALS_PATH)) throw new Error(`rename: ${path.relative(ROOT, LOCALS_PATH)} missing`);
  const localsMap = JSON.parse(fs.readFileSync(LOCALS_PATH, 'utf8'));
  const unitIds = new Set(units.map((u) => u.id));
  const manifest = JSON.parse(fs.readFileSync(path.join(C.dataDir, 'manifest.json'), 'utf8'));
  const wireSet = new Set(manifest.order);
  const localEntries = [];
  const localKeepEntries = [];
  {
    const seenIds = new Set();
    for (const id of localsMap.order) {
      const e = localsMap.entries[id];
      if (!e) throw new Error(`rename: locals order id ${id} has no entry`);
      if (e.scope !== 'local') throw new Error(`rename: locals entry ${id} scope=${e.scope} (want local)`);
      if (seenIds.has(id)) throw new Error(`rename: duplicate locals id ${id}`);
      seenIds.add(id);
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.token) || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.name)) {
        throw new Error(`rename: invalid locals token/name pair: ${e.token} -> ${e.name}`);
      }
      if (RESERVED.has(e.name)) throw new Error(`rename: locals new name is reserved: ${e.name} (for ${id})`);
      if (map.meta.protectedIdentifiers.includes(e.name)) throw new Error(`rename: locals new name is a protected server anchor: ${e.name} (for ${id})`);
      if (wireSet.has(e.name)) throw new Error(`rename: locals new name is a wire symbol: ${e.name} (for ${id})`);
      const b = e.binding || {};
      if (id !== `${e.token}@${b.unit}#${b.index}`) {
        throw new Error(`rename: locals id ${id} does not match token@unit#index (${e.token}@${b.unit}#${b.index})`);
      }
      if (!unitIds.has(b.unit)) throw new Error(`rename: locals ${id} unknown unit ${b.unit}`);
      if (!Number.isInteger(b.index) || b.index < 0) throw new Error(`rename: locals ${id} bad index ${b.index}`);
      if (e.action === 'rename') localEntries.push({ id, ...e });
      else if (e.action === 'keep') localKeepEntries.push({ id, ...e });
      else throw new Error(`rename: locals ${id} bad action ${e.action}`);
    }
  }
  // Freshness oracle = immutable source text (stable across re-runs on renamed src).
  const stale = [];
  for (const e of [...renameEntries, ...localEntries]) {
    if (vm9.includes(e.name) && !new RegExp(`^${e.name}$`).test(e.token)) {
      // Word-level pre-existence (may be string/vendor-local; scope pass decides).
      const re = new RegExp(`\\b${e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      let n = 0;
      while (re.exec(vm9) !== null && ++n <= 1000);
      stale.push({ token: e.token, name: e.name, vm9Words: n });
    }
  }

  // ---- Collect current unit bodies from src ----
  if (!fs.existsSync(SRC_DIR)) throw new Error('rename: src/ missing (run emit first)');
  const byId = new Map(units.map((u) => [u.id, u]));
  const seen = new Map(); // id -> { unit, raw, file }
  const fileOf = new Map(); // absPath -> rel
  for (const f of collectJsFiles(SRC_DIR)) {
    const rel = path.relative(SRC_DIR, f).split(path.sep).join('/');
    const text = fs.readFileSync(f, 'utf8');
    for (const u of parseFragmentFile(text, rel)) {
      const want = byId.get(u.id);
      if (!want) throw new Error(`rename: unknown unit ${u.id} in ${rel}`);
      if (u.start !== want.start || u.end !== want.end || u.kind !== want.kind || rel !== want.module) {
        throw new Error(`rename: unit ${u.id} in ${rel} does not match units.json (re-run emit?)`);
      }
      if (seen.has(u.id)) throw new Error(`rename: duplicate unit ${u.id}`);
      seen.set(u.id, { unit: want, raw: u.raw, file: f, rel });
    }
  }
  if (seen.size !== units.length) throw new Error(`rename: unit count ${seen.size} != ${units.length} (re-run emit?)`);

  const ordered = units.map((u) => seen.get(u.id));
  const concat = ordered.map((o) => o.raw).join('');
  // ---- One-shot migration guard: refuse trees that already contain renamed
  // identifiers. Re-running on a renamed tree would re-target the leftovers
  // (ambiguous lookalikes) instead of no-op-ing. Reset with emit first.
  {
    const newNames = new Set([...renameEntries, ...localEntries].map((e) => e.name));
    const vm9Ids = identifierNamesOf(vm9);
    const curIds = identifierNamesOf(concat);
    const introduced = [...newNames].filter((n) => curIds.has(n) && !vm9Ids.has(n));
    if (introduced.length > 0) {
      throw new Error(
        `rename: src tree already contains renamed identifiers (${introduced.slice(0, 8).join(', ')}${introduced.length > 8 ? ', …' : ''}); refusing to re-run (targets would flip to lookalikes). Re-run \`node tools/emit.mjs\` to reset to the M1 tree first.`
      );
    }
  }
  const bounds = []; // prefix sums over raw lengths
  {
    let acc = 0;
    for (const o of ordered) {
      bounds.push(acc);
      acc += o.raw.length;
    }
  }
  const locate = (off) => {
    // binary search owning unit
    let lo = 0, hi = ordered.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (bounds[mid] <= off) lo = mid;
      else hi = mid - 1;
    }
    return { idx: lo, inner: off - bounds[lo] };
  };

  // ---- Parse + scope analysis on CURRENT src state ----
  const program = acorn.parse(concat, { ecmaVersion: 'latest' });
  const { root, decls, refs, paramDecls } = analyze(program);

  // Index declarations by name.
  const declByName = new Map();
  for (const d of decls) {
    if (!declByName.has(d.name)) declByName.set(d.name, []);
    declByName.get(d.name).push(d);
  }
  // Resolve references once.
  const refTarget = new Map(); // ref idx -> Scope|null (null = implicit global)
  refs.forEach((r, i) => refTarget.set(i, resolveRef(r)));
  const refBySpan = new Map(); // "start:end:name" -> ref idx (spans are unique)
  refs.forEach((r, i) => refBySpan.set(`${r.node.start}:${r.node.end}:${r.name}`, i));

  // ---- Census mode: emit the per-binding local census (proposer input). ----
  // Requires the M1 tree (one-shot guard above already refused renamed trees).
  if (options.census) {
    const localIndex = indexLocalDecls([...decls, ...paramDecls], locate, ordered);
    const bindingRefCounts = new Map();
    const bindingShorthand = new Map(); // scope -> Set<name> with a shorthand-value use
    refs.forEach((r, i) => {
      const t = refTarget.get(i);
      if (!t) return;
      let m = bindingRefCounts.get(t);
      if (!m) { m = new Map(); bindingRefCounts.set(t, m); }
      m.set(r.name, (m.get(r.name) || 0) + 1);
      if (r.shorthand) {
        let s = bindingShorthand.get(t);
        if (!s) { s = new Set(); bindingShorthand.set(t, s); }
        s.add(r.name);
      }
    });
    // Global targets (proposers must not propose these — already renamed).
    const globalTokens = new Set(renameEntries.map((e) => e.token));
    const declByNameC = new Map();
    for (const d of decls) {
      if (!declByNameC.has(d.name)) declByNameC.set(d.name, []);
      declByNameC.get(d.name).push(d);
    }
    const globalTargetScopes = new Set();
    for (const t of globalTokens) {
      const ds = declByNameC.get(t) || [];
      let best = null, tied = false;
      for (const d of ds) {
        if (!best || d.scope.depth < best.depth) { best = d.scope; tied = false; }
        else if (d.scope !== best && d.scope.depth === best.depth) tied = true;
      }
      if (best && !tied) globalTargetScopes.add(best);
    }
    const moduleOf = new Map(units.map((u) => [u.id, u.module]));
    const out = Object.create(null);
    let nDecl = 0, nParam = 0;
    for (const [key, list] of [...localIndex.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const [uid, token] = [key.slice(0, key.indexOf('|')), key.slice(key.indexOf('|') + 1)];
      if (!out[uid]) out[uid] = { module: moduleOf.get(uid), tokens: Object.create(null) };
      // Same-scope redeclarations share one binding: only the first index is
      // proposable; the rest carry redeclOf (merger refuses them as targets).
      const firstByScope = new Map();
      out[uid].tokens[token] = list.map((d, index) => {
        const { idx, inner } = locate(d.node.start);
        const raw = ordered[idx].raw;
        const kind = d.kind || d.scope.bindings.get(d.name)?.kind || 'unknown';
        if (kind === 'param' || kind === 'catch-param') nParam++; else nDecl++;
        let redeclOf = -1;
        if (firstByScope.has(d.scope)) redeclOf = firstByScope.get(d.scope);
        else firstByScope.set(d.scope, index);
        return {
          index, kind, depth: d.scope.depth,
          refCount: (bindingRefCounts.get(d.scope) || new Map()).get(d.name) || 0,
          declInner: inner,
          globalTarget: globalTokens.has(d.name) && globalTargetScopes.has(d.scope),
          redeclOf,
          hasShorthand: (bindingShorthand.get(d.scope) || new Set()).has(d.name),
          snippet: raw.slice(Math.max(0, inner - 100), inner + 60).replace(/\s+/g, ' '),
        };
      });
    }
    const census = { meta: { generatedBy: 'client-deob/tools/rename.mjs --census', corpus: C.name, units: units.length, declBindings: nDecl, paramBindings: nParam }, units: out };
    const CENSUS_OUT = path.join(BUILD_DIR, 'local-bindings.json');
    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.writeFileSync(CENSUS_OUT, JSON.stringify(census, null, 1) + '\n');
    console.log(`rename(${C.name},census): declBindings=${nDecl} paramBindings=${nParam} -> ${path.relative(ROOT, CENSUS_OUT)}`);
    return census;
  }

  const report = { entries: {}, totals: { renamed: 0, skippedShadowed: 0, files: 0, deferred: 0, renamedLocal: 0, deferredLocal: 0 } };
  const fileEdits = new Map(); // absPath -> [{ innerStart, innerEnd, newText, unitId }]
  // Resolution-equivalence simulation inputs (locals backstop; see helper).
  const renamesByScope = new Map(); // Scope -> Map<oldName, newName>
  const implicitRenames = new Map(); // token -> newName (global entries with no decl)
  const scopeNameClaims = new Map(); // Scope -> Map<newName, entryId> (same-scope merge guard)
  const claimName = (scope, name, id) => {
    let m = scopeNameClaims.get(scope);
    if (!m) { m = new Map(); scopeNameClaims.set(scope, m); }
    if (m.has(name)) throw new Error(`rename: same-scope new-name collision: ${name} claimed by ${m.get(name)} and ${id}`);
    m.set(name, id);
  };
  const recordScopeRename = (scope, token, name, id) => {
    let m = renamesByScope.get(scope);
    if (!m) { m = new Map(); renamesByScope.set(scope, m); }
    m.set(token, name);
    claimName(scope, name, id);
  };

  for (const e of renameEntries) {
    const ds = (declByName.get(e.token) || []);
    // Outermost declaring scope (shallowest depth). A tie at the minimal depth
    // in disjoint scopes (e.g. `a3D`: UI button class vs THREE KHR loader class
    // vs 132 vec3 temporaries) cannot be resolved mechanically here: defer to
    // M3 with diagnostics instead of guessing.
    let targetScope = null;
    let tied = false;
    const tiedScopes = new Set();
    for (const d of ds) {
      if (!targetScope || d.scope.depth < targetScope.depth) {
        targetScope = d.scope;
        tied = false;
        tiedScopes.clear();
        tiedScopes.add(d.scope);
      } else if (d.scope === targetScope) {
        // same-scope redeclaration (var) — fine, same target.
      } else if (d.scope.depth === targetScope.depth) {
        tied = true;
        tiedScopes.add(d.scope);
      }
    }
    if (tied) {
      const refByScope = new Map();
      refs.forEach((r, i) => {
        if (r.name !== e.token) return;
        const t = refTarget.get(i);
        const key = t ? `depth${t.depth}` : 'implicit-global';
        refByScope.set(key, (refByScope.get(key) || 0) + 1);
      });
      report.entries[e.token] = {
        name: e.name,
        scope: e.scope,
        status: 'deferred-ambiguous',
        renamed: 0,
        skippedShadowed: 0,
        declFound: true,
        tiedScopes: tiedScopes.size,
        tiedDepth: targetScope.depth,
        declCount: ds.length,
        refCount: [...refByScope.values()].reduce((a, b) => a + b, 0),
        refsByResolvedScope: Object.fromEntries(refByScope),
        note: 'same-depth declarations in disjoint scopes; needs curated binding selection (M3)',
      };
      report.totals.deferred++;
      continue;
    }
    // Same-scope merge check: target scope must not already bind the new name.
    if (targetScope && targetScope.bindings.has(e.name)) {
      throw new Error(`rename: target scope already binds ${e.name} — merging ${e.token} would corrupt it`);
    }
    // Collect positions: declaration spans + references resolving to target
    // (or implicit-global references when the token is never declared).
    const spans = [];
    let skippedShadowed = 0;
    let declCount = 0;
    let refCount = 0;
    if (targetScope) {
      for (const d of ds) {
        declCount++;
        if (d.scope === targetScope) spans.push({ start: d.node.start, end: d.node.end, kind: 'decl' });
        else skippedShadowed++;
      }
      refs.forEach((r, i) => {
        if (r.name !== e.token) return;
        refCount++;
        const t = refTarget.get(i);
        if (t === targetScope) spans.push({ start: r.node.start, end: r.node.end, kind: 'ref' });
        else skippedShadowed++;
      });
    } else {
      refs.forEach((r, i) => {
        if (r.name !== e.token) return;
        refCount++;
        if (refTarget.get(i) === null) spans.push({ start: r.node.start, end: r.node.end, kind: 'ref' });
        else skippedShadowed++;
      });
    }
    // Nearer-scope capture check: no scope between any renamed ref and the
    // target may bind the NEW name (else the renamed ref would resolve there).
    for (const s of spans) {
      const ri = refBySpan.get(`${s.start}:${s.end}:${e.token}`);
      if (ri === undefined) continue; // declaration span
      let sc = refs[ri].scope;
      while (sc && sc !== targetScope) {
        if (sc.bindings.has(e.name)) {
          throw new Error(`rename: capture hazard renaming ${e.token}->${e.name} at offset ${s.start} (scope binds ${e.name})`);
        }
        sc = sc.parent;
      }
      if (!targetScope && sc) {
        // implicit-global target: whole chain must be free of the new name.
        while (sc) {
          if (sc.bindings.has(e.name)) {
            throw new Error(`rename: capture hazard renaming ${e.token}->${e.name} at offset ${s.start}`);
          }
          sc = sc.parent;
        }
      }
    }
    // Deprecation guard: declaration spans must actually read the old token.
    for (const s of spans) {
      if (concat.slice(s.start, s.end) !== e.token) {
        throw new Error(`rename: span text mismatch for ${e.token} at ${s.start} (AST/text skew)`);
      }
    }
    // Record edits mapped back to (file, unit).
    let applied = 0;
    for (const s of spans) {
      const { idx, inner } = locate(s.start);
      const o = ordered[idx];
      const len = s.end - s.start;
      if (o.raw.slice(inner, inner + len) !== e.token) {
        throw new Error(`rename: unit mapping skew for ${e.token} in ${o.unit.id}`);
      }
      if (!fileEdits.has(o.file)) fileEdits.set(o.file, []);
      fileEdits.get(o.file).push({ innerStart: inner, innerEnd: inner + len, newText: e.name, oldText: e.token, unitId: o.unit.id });
      applied++;
    }
    report.entries[e.token] = {
      name: e.name,
      scope: e.scope,
      status: 'applied',
      renamed: applied,
      declCount,
      refCount,
      declFound: !!targetScope,
      bindingDepth: targetScope ? targetScope.depth : null,
      bindingKind: !targetScope ? (refCount > 0 ? 'implicit-global' : 'absent (string-only or foreign)')
        : (targetScope.bindings.get(e.token) ? targetScope.bindings.get(e.token).kind : 'unknown'),
    };
    report.totals.renamed += applied;
    report.totals.skippedShadowed += skippedShadowed;
    if (targetScope) recordScopeRename(targetScope, e.token, e.name, e.token);
    else implicitRenames.set(e.token, e.name);
  }

  // ---- Local entries: per-binding resolution via (unit, token, index) ----
  if (localEntries.length > 0) {
    const localIndex = indexLocalDecls([...decls, ...paramDecls], locate, ordered);
    const bindingRefCounts = new Map(); // Scope -> Map<name, n>
    refs.forEach((r, i) => {
      const t = refTarget.get(i);
      if (!t) return;
      let m = bindingRefCounts.get(t);
      if (!m) { m = new Map(); bindingRefCounts.set(t, m); }
      m.set(r.name, (m.get(r.name) || 0) + 1);
    });
    const snippetOf = (unitRaw, inner) =>
      unitRaw.slice(Math.max(0, inner - 100), inner + 60).replace(/\s+/g, ' ');
    for (const e of localEntries) {
      // Diverged-fallback entries (LD waves) carry per-lineage binding
      // fingerprints; assert against the active lineage's record. Agree-only
      // entries have no bindingServed and behave exactly as before.
      const exp = (C.name === 'served' && e.bindingServed) ? e.bindingServed : e.binding;
      const key = `${exp.unit}|${e.token}`;
      const list = localIndex.get(key) || [];
      const d = list[exp.index];
      let mismatch = null;
      if (!d) mismatch = `no decl #${exp.index} of ${e.token} in ${exp.unit} (has ${list.length})`;
      let refCount = 0;
      let snippet = '';
      if (d) {
        refCount = (bindingRefCounts.get(d.scope) || new Map()).get(e.token) || 0;
        const { idx, inner } = locate(d.node.start);
        snippet = snippetOf(ordered[idx].raw, inner);
        // NOTE: depth is NOT asserted — nesting differs by lineage (vm9's
        // outer wrapper adds 2 levels vs served flat). (unit,index) + refCount
        // + 160-char context fingerprint identifies the binding.
        if (refCount !== exp.refCount) mismatch = `refCount ${refCount} != proposal ${exp.refCount}`;
        else if (snippet !== exp.snippet) mismatch = `context fingerprint mismatch`;
      }
      if (mismatch) {
        if (C.name === 'served') {
          report.entries[e.id] = { token: e.token, name: e.name, scope: 'local', status: 'deferred-lineage', renamed: 0, note: mismatch };
          report.totals.deferredLocal++;
          continue;
        }
        throw new Error(`rename: locals ${e.id} does not resolve: ${mismatch}`);
      }
      const targetScope = d.scope;
      if (renamesByScope.get(targetScope)?.has(e.token)) {
        throw new Error(`rename: locals ${e.id} binding already renamed by another entry`);
      }
      if (targetScope.bindings.has(e.name)) {
        throw new Error(`rename: locals ${e.id} target scope already binds ${e.name} — merging would corrupt it`);
      }
      // (Cross-entry same-scope claim happens in recordScopeRename below; a
      // throw there aborts before any file is written, so no partial state.)
      // ALL declarators of the target binding (same-scope `var` redecls share
      // one binding; renaming only one would split it and change behavior).
      const spans = [];
      for (const dd of list) {
        if (dd.scope === targetScope) spans.push({ start: dd.node.start, end: dd.node.end, kind: 'decl' });
      }
      let skippedLocal = 0;
      refs.forEach((r, i) => {
        if (r.name !== e.token) return;
        if (refTarget.get(i) === targetScope) spans.push({ start: r.node.start, end: r.node.end, kind: 'ref' });
        else skippedLocal++;
      });
      for (const s of spans) {
        const ri = refBySpan.get(`${s.start}:${s.end}:${e.token}`);
        if (ri === undefined) continue;
        let sc = refs[ri].scope;
        while (sc && sc !== targetScope) {
          if (sc.bindings.has(e.name)) {
            throw new Error(`rename: capture hazard renaming locals ${e.id} at offset ${s.start} (scope binds ${e.name})`);
          }
          sc = sc.parent;
        }
      }
      for (const s of spans) {
        if (concat.slice(s.start, s.end) !== e.token) {
          throw new Error(`rename: span text mismatch for locals ${e.id} at ${s.start} (AST/text skew)`);
        }
      }
      let applied = 0;
      for (const s of spans) {
        const { idx, inner } = locate(s.start);
        const o = ordered[idx];
        const len = s.end - s.start;
        if (o.raw.slice(inner, inner + len) !== e.token) {
          throw new Error(`rename: unit mapping skew for locals ${e.id} in ${o.unit.id}`);
        }
        if (!fileEdits.has(o.file)) fileEdits.set(o.file, []);
        fileEdits.get(o.file).push({ innerStart: inner, innerEnd: inner + len, newText: e.name, oldText: e.token, unitId: o.unit.id });
        applied++;
      }
      recordScopeRename(targetScope, e.token, e.name, e.id);
      report.entries[e.id] = {
        token: e.token, name: e.name, scope: 'local', status: 'applied', renamed: applied,
        declFound: true, bindingDepth: targetScope.depth,
        bindingKind: targetScope.bindings.get(e.token)?.kind || 'unknown',
        skippedLocal, unit: e.binding.unit, index: e.binding.index,
      };
      report.totals.renamedLocal += applied;
    }
  }

  // Whole-tree resolution equivalence (backstop over global + local renames).
  assertResolutionEquivalence(refs, refTarget, renamesByScope, implicitRenames);

  // ---- Apply per file (descending offsets), refresh marker len= ----
  const filesWritten = [];
  for (const [file, edits] of fileEdits) {
    if (edits.length === 0) continue;
    const rel = path.relative(SRC_DIR, file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    // Re-scan marker spans in file coordinates.
    const re = new RegExp(MARKER_RE_SRC, 'gm');
    const markers = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      markers.push({ id: m[1], start: Number(m[2]), end: Number(m[3]), len: Number(m[6]), markerStart: m.index, markerEnd: m.index + m[0].length, rawLine: m[0] });
    }
    // Group new bodies by unit id.
    const bodyByUnit = new Map();
    for (const u of parseFragmentFile(text, rel)) bodyByUnit.set(u.id, u.raw);
    // Apply edits: need unit id per edit — edits carry unitId.
    const editsByUnit = new Map();
    for (const ed of edits) {
      if (!editsByUnit.has(ed.unitId)) editsByUnit.set(ed.unitId, []);
      editsByUnit.get(ed.unitId).push(ed);
    }
    for (const [uid, list] of editsByUnit) {
      list.sort((a, b) => b.innerStart - a.innerStart);
      // Map unitId -> concat idx to find the raw string.
      const oi = ordered.findIndex((o) => o.unit.id === uid);
      let body = ordered[oi].raw;
      for (const ed of list) {
        if (body.slice(ed.innerStart, ed.innerEnd) !== ed.oldText) {
          throw new Error(`rename: body skew applying ${ed.oldText} in unit ${uid}`);
        }
        body = body.slice(0, ed.innerStart) + ed.newText + body.slice(ed.innerEnd);
      }
      bodyByUnit.set(uid, body);
    }
    // Rebuild file: header + per-unit marker (updated len) + body.
    const firstMarker = markers[0];
    const header = text.slice(0, firstMarker.markerStart);
    let out = header;
    for (const mk of markers) {
      const body = bodyByUnit.get(mk.id);
      const oldLine = mk.rawLine;
      const newLine = oldLine.replace(/ len=\d+$/, ` len=${body.length}`);
      out += newLine + '\n' + body + '\n';
    }
    if (!dryRun) {
      fs.writeFileSync(file, out);
      filesWritten.push(rel);
    }
  }

  report.totals.files = filesWritten.length;
  report.preExistingNewNames = stale;
  report.keepEntries = keepEntries.map((e) => e.token);
  report.keepLocals = localKeepEntries.map((e) => e.id);
  if (!dryRun) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.writeFileSync(REPORT_OUT, JSON.stringify({ meta: { generatedBy: 'client-deob/tools/rename.mjs (M2)', mode: 'apply', units: units.length }, entries: report.entries, totals: report.totals, preExistingNewNames: report.preExistingNewNames, keepEntries: report.keepEntries, keepLocals: report.keepLocals }, null, 2) + '\n');
  }
  console.log(`rename(${C.name},${dryRun ? 'dry-run' : 'apply'}): entries=${renameEntries.length} renamed=${report.totals.renamed} skippedShadowed=${report.totals.skippedShadowed} locals=${localEntries.length} renamedLocal=${report.totals.renamedLocal} deferredLocal=${report.totals.deferredLocal} files=${filesWritten.length}${dryRun ? '' : ' -> ' + path.relative(ROOT, REPORT_OUT)}`);
  if (stale.length > 0) {
    console.log(`rename(${C.name}): note: ${stale.length} new name(s) pre-exist in source (vendor/disjoint scopes, left intact): ${stale.map((s) => `${s.name}(${s.vm9Words}x)`).join(', ')}`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const census = argv.includes('--census');
  rename({ dryRun, census }).catch((err) => {
    console.error(`rename.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

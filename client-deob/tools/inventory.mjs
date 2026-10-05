// client-deob/tools/inventory.mjs — M3 full identifier + string-key inventory
//
// Reads:  ../../raw/bundles/VM9.deob.txt (source of truth, never modified)
//         ../data/units.json (emission order, for per-unit token attribution)
//         ../data/rename-map.json (M2 seed, for coverage cross-check)
//         ../data/manifest.json (656 wire symbols, for string-key classification)
// Writes: ../data/inventory.json
//         { meta, names: { <ident>: { count, isTopDecl, inRenameMap } },
//           topDecls: [...], bracketStrings: { <key>: count }, summary: {...} }
//
// Method: acorn tokenizer for identifier tokens (variable + property positions
//         combined — rename.mjs scope pass separates them; this inventory is the
//         raw token census that coverage.json then disposes 100%).
//         acorn parse for top-level (inner-statement) declared globals.
//         Regex scan for bracket string keys `['key']` / `["key"]`.
//
// Deterministic: sorted keys, no timestamps. Fail loudly on parse errors.
//
// Usage: node tools/inventory.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { corpus, readSourceText } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function inventory() {
  const C = corpus();
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const MAP_PATH = C.renameMapPath;
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  const OUT_PATH = path.join(C.dataDir, 'inventory.json');
  const vm9 = readSourceText();
  const { units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  // ---- 1. Identifier token census via acorn tokenizer ----
  const counts = new Map();
  let totalNameTokens = 0;
  {
    const tz = acorn.tokenizer(vm9, { ecmaVersion: 'latest' });
    for (;;) {
      const t = tz.getToken();
      if (t.type === acorn.tokTypes.eof) break;
      if (t.type === acorn.tokTypes.name) {
        totalNameTokens++;
        const w = vm9.slice(t.start, t.end);
        counts.set(w, (counts.get(w) || 0) + 1);
      }
    }
  }

  // ---- 2. Top-level declared globals (inner-statement direct children) ----
  // vm9: single outer (function(){...}) wrapper, big IIFE last inside it;
  // served: flat top-level statements, big IIFE last. Same traversal either way.
  const prog = acorn.parse(vm9, { ecmaVersion: 'latest' });
  let inner;
  let outerStmts;
  if (prog.body.length === 1 && prog.body[0].type === 'ExpressionStatement' && prog.body[0].expression.type === 'FunctionExpression') {
    const outer = prog.body[0].expression;
    const outerBody = outer.body.body;
    inner = outerBody[outerBody.length - 1].expression.callee.body.body;
    outerStmts = outerBody.slice(0, -1);
  } else {
    const big = prog.body[prog.body.length - 1];
    if (big.type !== 'ExpressionStatement' || big.expression.type !== 'CallExpression' || big.expression.callee.type !== 'FunctionExpression') {
      throw new Error('inventory: unexpected source shape (no trailing big IIFE)');
    }
    inner = big.expression.callee.body.body;
    outerStmts = prog.body.slice(0, -1);
  }
  const topDeclSet = new Set();
  const topDeclKind = new Map(); // name -> 'var'|'function'|'class'|'outer'
  for (const st of inner) {
    if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) {
        const grab = (n) => {
          if (!n) return;
          if (n.type === 'Identifier') {
            topDeclSet.add(n.name);
            if (!topDeclKind.has(n.name)) topDeclKind.set(n.name, st.kind);
          } else if (n.type === 'ObjectPattern') n.properties.forEach((p) => grab(p.type === 'RestElement' ? p.argument : p.value));
          else if (n.type === 'ArrayPattern') n.elements.forEach(grab);
          else if (n.type === 'RestElement') grab(n.argument);
          else if (n.type === 'AssignmentPattern') grab(n.left);
        };
        grab(d.id);
      }
    } else if ((st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') && st.id) {
      topDeclSet.add(st.id.name);
      topDeclKind.set(st.id.name, st.type === 'FunctionDeclaration' ? 'function' : 'class');
    }
  }
  for (const st of outerStmts) {
    if (st.type === 'VariableDeclaration') {
      for (const d of st.declarations) {
        if (d.id && d.id.type === 'Identifier') {
          topDeclSet.add(d.id.name);
          if (!topDeclKind.has(d.id.name)) topDeclKind.set(d.id.name, 'outer-' + st.kind);
        }
      }
    } else if ((st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') && st.id) {
      topDeclSet.add(st.id.name);
      if (!topDeclKind.has(st.id.name)) topDeclKind.set(st.id.name, 'outer-function');
    }
  }

  // ---- 3. Bracket string keys `['k']` / `["k"]` ----
  const bracketCounts = new Map();
  {
    const re = /\[('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\]/g;
    let m;
    while ((m = re.exec(vm9)) !== null) {
      const raw = m[1];
      // Unescape minimal: strip quotes, unescape \' \" \\ \x.. \u..
      // For inventory identity we keep the decoded key text via eval-safe parse:
      let key;
      try {
        key = JSON.parse(raw.startsWith("'") ? '"' + raw.slice(1, -1).replace(/"/g, '\\"') + '"' : raw);
      } catch {
        key = raw.slice(1, -1);
      }
      bracketCounts.set(key, (bracketCounts.get(key) || 0) + 1);
    }
  }

  // ---- 4. Cross-checks ----
  const renameTokens = new Set(map.order.filter((t) => !t.includes('.')));
  const dottedBases = new Set(map.order.filter((t) => t.includes('.')).map((t) => t.split('.')[0]));
  const manifestNames = new Set(manifest.order);

  // NOTE: null-prototype objects — VM9 contains `__proto__` (4 occurrences)
  // as a real identifier/string key; plain `{}` assignment would silently
  // drop it via the prototype setter. Object.create(null) keeps it as data.
  const names = Object.create(null);
  const sorted = [...counts.keys()].sort();
  for (const n of sorted) {
    names[n] = {
      count: counts.get(n),
      isTopDecl: topDeclSet.has(n),
      topKind: topDeclKind.get(n) || null,
      inRenameMap: renameTokens.has(n) || map.order.includes(n),
    };
  }

  const brackets = Object.create(null);
  for (const k of [...bracketCounts.keys()].sort()) {
    brackets[k] = bracketCounts.get(k);
  }

  const topDecls = [...topDeclSet].sort();
  const uncoveredTop = topDecls.filter((d) => !renameTokens.has(d));

  const meta = {
    generatedBy: `client-deob/tools/inventory.mjs (M3${C.name === 'served' ? '/M6 served' : ''})`,
    source: C.sourceLabel,
    lengthChars: vm9.length,
    totalNameTokens,
    distinctNames: sorted.length,
    topDeclCount: topDecls.length,
    topDeclCoveredByRenameMap: topDecls.length - uncoveredTop.length,
    topDeclUncovered: uncoveredTop.length,
    bracketDistinct: Object.keys(brackets).length,
    bracketTotal: [...bracketCounts.values()].reduce((a, b) => a + b, 0),
    manifestNames: manifest.order.length,
    units: units.length,
  };

  const out = {
    meta,
    topDecls,
    topDeclKind: Object.fromEntries([...topDeclKind.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))),
    names,
    bracketStrings: brackets,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`inventory: names=${meta.distinctNames} tokens=${meta.totalNameTokens} topDecls=${meta.topDeclCount} (covered=${meta.topDeclCoveredByRenameMap} uncovered=${meta.topDeclUncovered}) brackets=${meta.bracketDistinct}/${meta.bracketTotal} -> ${path.relative(ROOT, OUT_PATH)}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  inventory().catch((err) => {
    console.error(`inventory.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

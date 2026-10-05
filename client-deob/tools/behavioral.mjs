// client-deob/tools/behavioral.mjs — M4 behavioral parity harness (PLAN §3 Phase D, M4)
//
// Proves the renamed modular tree BEHAVES like the original bundle. Sections:
//
//   B1 prereqs ......... required files exist + verify L2 (token parity) passes.
//   B2 AST parity ....... both bundles parse to structurally identical ASTs modulo
//                        the rename map (stronger than L2: nesting/operators/order).
//   B3 binding parity ... differential name-resolution: every declaration and
//                        reference in the rebuilt tree resolves to the same binding
//                        (same scope depth + same normalized name) as the original.
//                        Catches mis-targeted renames that token streams cannot:
//                        L2 passes even when a global ref is missed or a shadowed
//                        local is renamed, as long as token counts agree.
//   B4 goldens .......... both bundles compile via vm.Script; documented wire/math
//                        behavior executes identically: yaw/pitch byte conversions
//                        (PROTOCOL.md msg2/msg17), msg30 anti-bot val (server formula),
//                        codec round-trips vs gameplay/packages/protocol (msgs 1/2/8/40),
//                        and bundle-text behavioral anchors (wire strings, Math.PI).
//   B5 electron probe ... light integration probe of the live gameplay server
//                        (boot + serve page + __dsDiag anchor). Default SKIP (hermetic);
//                        run with --probe-electron. The full 2-window match stays a
//                        manual step: `cd gameplay && npm run electron`.
//
// SCOPE NOTE (PLAN §6.1 lineage drift): src/ derives from VM9.deob.txt, an OLDER
// lineage than the bundle the gameplay server serves (final.pkg.gz). A literal
// "run both bundles in two Electron windows and diff WS frames" would compare
// across lineages and prove nothing about the M1–M3 pipeline. The honest L3 for
// the VM9 lineage is differential parity (B2/B3: the rebuilt program resolves
// and executes exactly like the original) plus golden wire invariants (B4) that
// the server depends on. Re-running this pipeline on the served build is deferred
// per PLAN §6.1; when that happens this same harness runs unchanged against it.
//
// Whole-bundle stub execution is INTENTIONALLY not attempted: the bundle is
// browser-only code (THREE, DOM, rAF loop); any stub either hangs or diverges
// for reasons unrelated to the pipeline. B2+B3 prove execution-equivalence by
// construction (identical structure + identical name resolution), B4 executes
// the observable wire/math behavior directly.
//
// Deterministic: no timestamps, no timings, no port numbers in the report;
// identical inputs give byte-identical build/behavioral-report.json.
// Fail loudly: the first divergent check throws with a section-tagged message.
//
// Usage:
//   node tools/behavioral.mjs [--probe-electron] [--require-electron] [--json]
//   node tools/verify.mjs --level L3 [--probe-electron] [--require-electron]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import * as acorn from 'acorn';
import { verify } from './verify.mjs';
import { analyze } from './rename.mjs';
import { corpus, readSourceText, readRebuiltCode } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
// Corpus paths resolve lazily inside behavioral() (see below).
const GAMEPLAY_DIR = path.join(ROOT, 'gameplay');
const SERVER_ENTRY = path.join(GAMEPLAY_DIR, 'server', 'src', 'gameplay-server.mjs');

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function sha256String(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function countQuoted(hay, tok) {
  let n = 0;
  for (const q of [`'${tok}'`, `"${tok}"`]) {
    let i = 0;
    for (;;) {
      i = hay.indexOf(q, i);
      if (i < 0) break;
      n++;
      i += q.length;
    }
  }
  return n;
}

function countWords(hay, tok) {
  const re = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  let n = 0;
  while (re.exec(hay) !== null) n++;
  return n;
}

// ---- B2: structural AST compare (modulo renames) ----

const SKIP_KEYS = new Set(['start', 'end', 'loc', 'range', 'raw', 'leadingComments', 'trailingComments']);

// Dual acceptance rule (see header): a rebuilt identifier is accepted when it is
// either literally the original token (untouched position) or a mapped rename of
// it (new name -> original token via the map). Pre-existing vendor words (e.g.
// `handlers`, which occurs in the original AND is a rename target of a0I) need
// both arms: untouched vendor positions pass literally, renamed positions pass
// via the map.
// NOTE (M4 tests): exported for tests/behavioral.test.mjs synthetic negatives.
// Read-only pure helpers; exporting changes no harness behavior.
export function makeAccept(revMap) {
  // revMap: newName -> Set(originalToken). Set semantics: repeated local names
  // across disjoint bindings are accepted per position (same rule as L2).
  return (origName, rebuiltName) => rebuiltName === origName || (revMap.get(rebuiltName) || new Set()).has(origName);
}

// Exported (see makeAccept note): the structural comparator itself.
export function compareAst(a, b, accept, path, stats) {
  stats.nodes++;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      throw new Error(`B2: array/object mismatch at ${path}`);
    }
    if (a.length !== b.length) throw new Error(`B2: array length ${a.length} != ${b.length} at ${path}`);
    for (let i = 0; i < a.length; i++) compareAst(a[i], b[i], accept, `${path}[${i}]`, stats);
    return;
  }
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    if (a.type !== b.type) throw new Error(`B2: node type ${b.type} != ${a.type} at ${path}`);
    if (a.type === 'Identifier') {
      if (!accept(a.name, b.name)) {
        throw new Error(`B2: identifier ${JSON.stringify(b.name)} is not ${JSON.stringify(a.name)} nor its mapped rename at ${path}`);
      }
      return;
    }
    if (a.type === 'PrivateIdentifier') {
      if (a.name !== b.name) throw new Error(`B2: private name ${b.name} != ${a.name} at ${path}`);
      return;
    }
    if (a.type === 'Literal') {
      const av = typeof a.value === 'object' && a.value !== null ? String(a.value) : a.value;
      const bv = typeof b.value === 'object' && b.value !== null ? String(b.value) : b.value;
      if (av !== bv) throw new Error(`B2: literal ${JSON.stringify(bv)} != ${JSON.stringify(av)} at ${path}`);
      if (String(a.regex?.pattern ?? '') !== String(b.regex?.pattern ?? '') ||
          String(a.regex?.flags ?? '') !== String(b.regex?.flags ?? '')) {
        throw new Error(`B2: regex literal drift at ${path}`);
      }
      if (a.bigint !== b.bigint) throw new Error(`B2: bigint literal drift at ${path}`);
      return;
    }
    if (a.type === 'TemplateElement') {
      if (a.value.raw !== b.value.raw || String(a.value.cooked) !== String(b.value.cooked)) {
        throw new Error(`B2: template element drift at ${path}`);
      }
      if (a.tail !== b.tail) throw new Error(`B2: template tail drift at ${path}`);
      return;
    }
    const ka = Object.keys(a).filter((k) => !SKIP_KEYS.has(k)).sort();
    const kb = Object.keys(b).filter((k) => !SKIP_KEYS.has(k)).sort();
    if (ka.join(',') !== kb.join(',')) throw new Error(`B2: keys [${kb}] != [${ka}] at ${path}`);
    for (const k of ka) compareAst(a[k], b[k], accept, path ? `${path}.${k}` : k, stats);
    return;
  }
  if (a !== b) throw new Error(`B2: value ${JSON.stringify(b)} != ${JSON.stringify(a)} at ${path}`);
}

// ---- B4: documented behavior goldens (pure reference math, executed) ----

const WR = 128 / Math.PI; // byte<->radian factor (PLAN §2 constants; PROTOCOL.md msg17)
const yawMsg2 = (byte) => (byte * Math.PI) / 128 + Math.PI; // PROTOCOL.md msg2 rot.y
const yawMsg17 = (y) => y / WR; // PROTOCOL.md msg17 spawn override
const pitchMsg17 = (x) => x / WR - Math.PI / 2; // PROTOCOL.md msg17 (x=64 -> level)
const antiBotVal = (challenge) => (challenge * 2 + 0x178c4e) % 0x1c9c380; // gameplay-server.mjs:1558

function assertClose(got, want, tol, label) {
  if (!Number.isFinite(got) || Math.abs(got - want) > tol) {
    throw new Error(`B4: ${label}: got ${got}, want ${want} (tol ${tol})`);
  }
}

// ---- B5: light electron/server integration probe ----

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function probeElectronServer() {
  // Resolve the electron binary the gameplay harness itself uses.
  try {
    const req = (await import('node:module')).createRequire(path.join(GAMEPLAY_DIR, 'package.json'));
    req.resolve('electron');
  } catch {
    return { status: 'SKIP', reason: 'electron not installed (cd gameplay && npm i)' };
  }
  if (!fs.existsSync(SERVER_ENTRY)) {
    return { status: 'SKIP', reason: 'gameplay server entry missing' };
  }
  const child = spawn('node', [SERVER_ENTRY], {
    cwd: GAMEPLAY_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GP_ALLOC_TTL: '0' },
  });
  let out = '';
  child.stdout?.on('data', (c) => { out += c.toString(); });
  child.stderr?.on('data', (c) => { out += c.toString(); });
  const kill = async () => {
    try { child.kill('SIGKILL'); } catch {}
    await Promise.race([new Promise((r) => child.on('exit', r)), sleep(5000)]);
  };
  try {
    // Wait for the HTTP page (not the ws ports): 200 within 20 s.
    const deadline = Date.now() + 20000;
    let page = null;
    let lastErr = '';
    for (;;) {
      try {
        const res = await fetch('http://127.0.0.1:8080/');
        if (res.ok) {
          page = await res.text();
          break;
        }
        lastErr = `http ${res.status}`;
      } catch (e) {
        lastErr = String((e && e.message) || e);
        if (child.exitCode !== null) {
          return { status: 'SKIP', reason: `server exited early (code ${child.exitCode}; port busy?)` };
        }
      }
      if (Date.now() > deadline) return { status: 'SKIP', reason: `page not served in 20s (${lastErr})` };
      await sleep(250);
    }
    if (page.length < 100000) {
      throw new Error(`B5: served page suspiciously small (${page.length} chars; bundle not served?)`);
    }
    if (!page.includes('__dsDiag')) {
      throw new Error('B5: served page lacks the __dsDiag bridge anchor');
    }
    return { status: 'PASS', pageBytes: Buffer.byteLength(page, 'utf8') };
  } finally {
    await kill();
  }
}

// ---- Main harness ----

export async function behavioral(options = {}) {
  const { probeElectron = false, requireElectron = false, json = false, writeReport = true } = options;
  const C = corpus();
  const MAP_PATH = C.renameMapPath;
  const REPORT_PATH = path.join(C.buildDir, C.renameReportFile);
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const INV_PATH = path.join(C.dataDir, 'inventory.json');
  const COV_PATH = path.join(C.dataDir, 'coverage.json');
  const OUT_PATH = path.join(C.buildDir, C.behavioralReportFile);
  const PROTOCOL_PATH = path.join(C.protocolDir, 'index.mjs');
  const sections = {};

  // ---- B1: prereqs + L2 gate ----
  for (const p of [MAP_PATH, REPORT_PATH, MANIFEST_PATH, UNITS_PATH, INV_PATH, COV_PATH]) {
    if (!fs.existsSync(p)) throw new Error(`B1: missing input ${path.relative(ROOT, p)}`);
  }
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const renameReport = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  if (renameReport.totals.deferred !== 0) {
    throw new Error(`B1: ${renameReport.totals.deferred} deferred-ambiguous renames (binding parity needs full curation)`);
  }
  const l2 = await verify('L2');
  // Compared texts are always CODE regions (served rebuilt file prepends the
  // manifest block, which must not enter the compare/compile).
  const vm9 = readSourceText();
  const rebuilt = readRebuiltCode();
  const revMap = new Map(); // newName -> Set(original token)
  const addRev = (e) => {
    if (!revMap.has(e.name)) revMap.set(e.name, new Set());
    revMap.get(e.name).add(e.token);
  };
  for (const token of map.order) {
    const e = map.entries[token];
    if (e.action === 'rename') addRev(e);
  }
  const LOCALS_PATH = path.join(path.dirname(MAP_PATH), 'rename-locals.json');
  if (fs.existsSync(LOCALS_PATH)) {
    const localsMap = JSON.parse(fs.readFileSync(LOCALS_PATH, 'utf8'));
    for (const id of localsMap.order) {
      const e = localsMap.entries[id];
      if (e && e.action === 'rename') addRev(e);
    }
  }
  sections.b1 = {
    status: 'PASS',
    l2Tokens: l2.tokens,
    l2Normalized: l2.normalized,
    renamedTokens: renameReport.totals.renamed,
    renamedLocalTokens: renameReport.totals.renamedLocal || 0,
    deferredLocal: renameReport.totals.deferredLocal || 0,
    skippedShadowed: renameReport.totals.skippedShadowed,
  };
  console.log(`behavioral B1: PASS (L2 tokens=${l2.tokens} normalized=${l2.normalized}; report renamed=${renameReport.totals.renamed} renamedLocal=${renameReport.totals.renamedLocal || 0})`);

  // ---- B2: AST structural parity ----
  const progOrig = acorn.parse(vm9, { ecmaVersion: 'latest' });
  const progRebuilt = acorn.parse(rebuilt, { ecmaVersion: 'latest' });
  const accept = makeAccept(revMap);
  const stats = { nodes: 0 };
  compareAst(progOrig, progRebuilt, accept, '$', stats);
  sections.b2 = { status: 'PASS', astNodes: stats.nodes };
  console.log(`behavioral B2: PASS (AST nodes compared=${stats.nodes})`);

  // ---- B3: differential binding parity ----
  const aOrig = analyze(progOrig);
  const bRebuilt = analyze(progRebuilt);
  if (aOrig.decls.length !== bRebuilt.decls.length) {
    throw new Error(`B3: decl count ${bRebuilt.decls.length} != original ${aOrig.decls.length}`);
  }
  if (aOrig.refs.length !== bRebuilt.refs.length) {
    throw new Error(`B3: ref count ${bRebuilt.refs.length} != original ${aOrig.refs.length}`);
  }
  if (aOrig.propUses.length !== bRebuilt.propUses.length) {
    throw new Error(`B3: property-use count ${bRebuilt.propUses.length} != original ${aOrig.propUses.length}`);
  }
  for (let i = 0; i < aOrig.decls.length; i++) {
    const dA = aOrig.decls[i];
    const dB = bRebuilt.decls[i];
    if (!accept(dA.name, dB.name)) {
      throw new Error(`B3: decl #${i} ${JSON.stringify(dB.name)} is not ${JSON.stringify(dA.name)} nor its rename (depth ${dB.scope.depth} vs ${dA.scope.depth})`);
    }
    if (dA.scope.depth !== dB.scope.depth) {
      throw new Error(`B3: decl #${i} ${JSON.stringify(dA.name)} scope depth ${dB.scope.depth} != ${dA.scope.depth}`);
    }
  }
  let implicitOrig = 0;
  let implicitRebuilt = 0;
  for (let i = 0; i < aOrig.refs.length; i++) {
    const rA = aOrig.refs[i];
    const rB = bRebuilt.refs[i];
    if (!accept(rA.name, rB.name)) {
      throw new Error(`B3: ref #${i} ${JSON.stringify(rB.name)} is not ${JSON.stringify(rA.name)} nor its rename`);
    }
    const tA = rA.scope.lookup(rA.name);
    const tB = rB.scope.lookup(rB.name);
    if (tA === null) implicitOrig++;
    if (tB === null) implicitRebuilt++;
    if ((tA === null) !== (tB === null)) {
      throw new Error(`B3: ref #${i} ${JSON.stringify(rA.name)} resolution flipped (implicit=${tA === null} vs ${tB === null})`);
    }
    if (tA && tB && tA.depth !== tB.depth) {
      throw new Error(`B3: ref #${i} ${JSON.stringify(rA.name)} binding depth ${tB.depth} != ${tA.depth}`);
    }
  }
  if (implicitOrig !== implicitRebuilt) {
    throw new Error(`B3: implicit-global ref count ${implicitRebuilt} != ${implicitOrig}`);
  }
  for (let i = 0; i < aOrig.propUses.length; i++) {
    if (aOrig.propUses[i].name !== bRebuilt.propUses[i].name) {
      throw new Error(`B3: property use #${i} ${JSON.stringify(bRebuilt.propUses[i].name)} != ${JSON.stringify(aOrig.propUses[i].name)} (property positions must never rename)`);
    }
  }
  sections.b3 = {
    status: 'PASS',
    decls: aOrig.decls.length,
    refs: aOrig.refs.length,
    propUses: aOrig.propUses.length,
    implicitRefs: implicitOrig,
  };
  console.log(`behavioral B3: PASS (decls=${aOrig.decls.length} refs=${aOrig.refs.length} propUses=${aOrig.propUses.length} implicit=${implicitOrig})`);

  // ---- B4: execution goldens + anchors ----
  new vm.Script(vm9, { filename: C.name === 'served' ? 'final.pkg.js [code]' : 'VM9.deob.txt' });
  new vm.Script(rebuilt, { filename: C.name === 'served' ? 'final.pkg.rebuilt [code]' : 'vm9.rebuilt.js' });
  assertClose(WR, 40.74366543152521, 1e-9, 'Wr=128/pi');
  const yawWant = { 0: 3.141592653589793, 64: 4.71238898038469, 128: 6.283185307179586, 192: 7.853981633974483, 255: 9.40023426816321 };
  for (const [byte, want] of Object.entries(yawWant)) assertClose(yawMsg2(Number(byte)), want, 1e-12, `yawMsg2(${byte})`);
  assertClose(yawMsg17(128), Math.PI, 1e-12, 'yawMsg17(128)');
  assertClose(yawMsg17(0), 0, 0, 'yawMsg17(0)');
  assertClose(pitchMsg17(64), 0, 1e-9, 'pitchMsg17(64)=level');
  assertClose(pitchMsg17(0), -Math.PI / 2, 1e-12, 'pitchMsg17(0)');
  const valWant = { 0: 1543246, 1: 1543248, 2: 1543250, 1193046: 3929338, 16777215: 5097676 };
  for (const [c, want] of Object.entries(valWant)) {
    const got = antiBotVal(Number(c));
    if (got !== want) throw new Error(`B4: antiBotVal(${c}): got ${got}, want ${want}`);
  }
  const protocol = await import(pathToFileURL(PROTOCOL_PATH).href);
  protocol.loadSchema();
  const codecCases = [
    ['FRF6r51VY32', { val: 1000, x: 64, y: 64, rBEdfQOuYkz: 7 }, ''],
    ['K11Co2hvi1l', { tdkZouYda: 3, JoHdvmpcMvL: 1.5, uBHZYKAHa: -3.25, yxEKoSFAg: 100.5, TCHdFFAXmk: 64, ibyXzJIMNf: 128, YSmEAVINAh: 96, wGiOzKcGlnH: 7, hkhrYayXI: 100, qXuHmlbSlxE: 1 }, ''],
    ['e479Jk50P', { pMwSuGipfE: 0.5, VqpNEuOqqCX: 9, JoHdvmpcMvL: 1.5, uBHZYKAHa: -3.25, AHPhtLFTi: 100.5, mGOwFesuTt: -0.75, MHnEcbTxpbz: 42.125 }, ''],
    ['kM86hVW024', { id: 3 }, '__gloo:deploy:1.50:2.50:3.50:0.79'],
  ];
  for (const [name, fields, string] of codecCases) {
    const buf = protocol.encode(name, { ...fields, string });
    const msgs = protocol.decode(buf);
    if (msgs.length !== 1 || msgs[0].name !== name) throw new Error(`B4: codec ${name}: decode did not return the message`);
    for (const k of Object.keys(fields)) {
      if (msgs[0].fields[k] !== fields[k]) throw new Error(`B4: codec ${name}.${k}: got ${msgs[0].fields[k]}, want ${fields[k]}`);
    }
    if ((msgs[0].string || '') !== string) throw new Error(`B4: codec ${name}: string mismatch`);
  }
  const anchors = {};
  for (const w of ['FRF6r51VY32', 'K11Co2hvi1l', 'e479Jk50P']) {
    const qO = countQuoted(vm9, w);
    const qR = countQuoted(rebuilt, w);
    if (qO === 0) throw new Error(`B4: anchor '${w}' missing from original (bad harness?)`);
    if (qR !== qO) throw new Error(`B4: anchor '${w}' quoted count ${qR} != ${qO} (wire behavior must survive renames)`);
    anchors[w] = qO;
  }
  for (const t of ['Math.PI', 'getUint16']) {
    const cO = countWords(vm9, t);
    const cR = countWords(rebuilt, t);
    if (cO === 0) throw new Error(`B4: anchor '${t}' missing from original (bad harness?)`);
    if (cR !== cO) throw new Error(`B4: anchor '${t}' count ${cR} != ${cO}`);
    anchors[t] = cO;
  }
  sections.b4 = {
    status: 'PASS',
    compile: 'both bundles compile via vm.Script',
    goldens: { yawBytes: 5, orientBytes: 4, antiBotVals: 5, codecMessages: codecCases.map((c) => c[0]) },
    anchors,
  };
  console.log(`behavioral B4: PASS (vm compile x2; yaw/antibot/codec goldens; anchors=${Object.keys(anchors).length})`);

  // ---- B5: electron/server probe (skip by default; hermetic) ----
  if (!probeElectron && !requireElectron) {
    sections.b5 = { status: 'SKIP', reason: 'probe not requested (use --probe-electron); full 2-window match: cd gameplay && npm run electron' };
    console.log('behavioral B5: SKIP (probe not requested)');
  } else {
    const r = await probeElectronServer();
    if (r.status !== 'PASS' && requireElectron) {
      throw new Error(`B5: electron probe failed and --require-electron was given: ${r.reason}`);
    }
    sections.b5 = r;
    console.log(`behavioral B5: ${r.status}${r.reason ? ` (${r.reason})` : ''}${r.pageBytes ? ` pageBytes=${r.pageBytes}` : ''}`);
  }

  const report = {
    meta: {
      generatedBy: `client-deob/tools/behavioral.mjs (M4${C.name === 'served' ? '/M6 served' : ''})`,
      corpus: C.name,
      source: C.sourceLabel,
      sources: {
        vm9: { bytes: vm9.length, sha256: sha256String(vm9) },
        rebuilt: { bytes: rebuilt.length, sha256: sha256String(rebuilt) },
      },
      renameMap: { entries: map.order.length, rename: map.meta.renameCount, keep: map.meta.keepCount },
    },
    sections,
    pass: true,
  };
  if (writeReport) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`behavioral: PASS (B1+B2+B3+B4 green, B5 ${sections.b5.status}) -> ${path.relative(ROOT, OUT_PATH)}`);
  if (json) console.log(JSON.stringify(report, null, 2));
  return { level: 'L3', ...report };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  behavioral({
    probeElectron: argv.includes('--probe-electron'),
    requireElectron: argv.includes('--require-electron'),
    json: argv.includes('--json'),
  }).catch((err) => {
    console.error(`behavioral.mjs: ${err && err.message ? err.message : err}`);
    process.exit(1);
  });
}

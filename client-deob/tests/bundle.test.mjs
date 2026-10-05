import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragmentFile } from '../tools/emit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'src');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const DATA_DIR = path.join(__dirname, '..', 'data');
const VM9_PATH = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.deob.txt');

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

function allFragmentUnits() {
  const out = [];
  for (const f of collectJsFiles(SRC_DIR)) {
    const rel = path.relative(SRC_DIR, f).split(path.sep).join('/');
    for (const u of parseFragmentFile(fs.readFileSync(f, 'utf8'), rel)) {
      out.push({ ...u, file: rel });
    }
  }
  return out;
}

test('m1: src tree carries every unit exactly once', () => {
  const { units } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));
  const frags = allFragmentUnits();
  assert.equal(frags.length, units.length);
  assert.equal(new Set(frags.map((u) => u.id)).size, units.length);
  const want = new Set(units.map((u) => u.id));
  for (const u of frags) assert.ok(want.has(u.id), `unknown unit ${u.id} in ${u.file}`);
  // placement matches units.json
  const modOf = new Map(units.map((u) => [u.id, u.module]));
  for (const u of frags) assert.equal(u.file, modOf.get(u.id), `misplaced ${u.id}`);
});

test('m1/m2: spot-check bodies stable where map has no tokens, renamed where it does', () => {
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');
  const map = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rename-map.json'), 'utf8'));
  const olds = new Set(map.order.map((t) => map.entries[t]).filter((e) => e.action === 'rename').map((e) => e.token));
  const hasOld = (s) => {
    for (const t of olds) {
      if (s.includes(t)) {
        // word-boundary check without regex blowup on huge strings
        let i = -1;
        while ((i = s.indexOf(t, i + 1)) >= 0) {
          const before = i === 0 ? '' : s[i - 1];
          const after = s[i + t.length] || '';
          const isWord = (c) => /[A-Za-z0-9_$]/.test(c);
          if (!isWord(before) && !isWord(after)) return true;
        }
      }
    }
    return false;
  };
  const frags = allFragmentUnits();
  const byId = new Map(frags.map((u) => [u.id, u]));
  // Units without mapped tokens are byte-stable across renames.
  let stable = 0;
  for (const u of frags) {
    if (stable >= 3) break;
    const origSlice = vm9.slice(u.start, u.end);
    if (!hasOld(origSlice)) {
      assert.equal(u.raw, origSlice, `${u.id} should be byte-stable`);
      stable++;
    }
  }
  assert.equal(stable, 3);
  // The localPlayer declaration unit tracks rename state.
  const swOff = vm9.indexOf('var SW=new SV()');
  assert.ok(swOff >= 0);
  const swUnit = frags.find((u) => u.start <= swOff && swOff < u.end);
  assert.ok(swUnit, 'SW declaration unit missing');
  const repPath = path.join(BUILD_DIR, 'rename-report.json');
  const renamedTree = fs.existsSync(repPath) && JSON.parse(fs.readFileSync(repPath, 'utf8')).totals.renamed > 0;
  assert.equal(swUnit.raw.includes('localPlayer'), renamedTree);
  assert.equal(swUnit.raw.includes('var SW='), !renamedTree);
  // handler entries + vendor unit present
  const handlers = frags.filter((u) => u.file === 'network/handlers.js');
  assert.equal(handlers.filter((u) => u.kind === 'handler-entry').length, 49);
  const vendor = frags.filter((u) => u.file === 'vendor/browserify-lib.js');
  assert.equal(vendor.length, 1);
  assert.equal(vendor[0].kind, 'vendor-lib');
});

test('m1: src/index.js order manifest is consistent', async () => {
  const { units } = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'units.json'), 'utf8'));
  const idx = await import('../src/index.js');
  assert.equal(idx.UNIT_COUNT, units.length);
  assert.deepEqual(idx.EMISSION_ORDER, units.map((u) => u.id));
  assert.equal(idx.EMISSION_ORDER[0], 'u0000');
});

test('m1/m2: rebuilt bundle coherence with tree state (L1 iff unrenamed)', () => {
  // L1 byte-exactness holds only on the unrenamed M1 tree; on the renamed M2
  // tree the bundle must differ (exactly by the mapped renames — see L2 test).
  const orig = fs.readFileSync(VM9_PATH);
  const rebuilt = fs.readFileSync(path.join(BUILD_DIR, 'vm9.rebuilt.js'));
  const repPath = path.join(BUILD_DIR, 'rename-report.json');
  const renamedTree = fs.existsSync(repPath) && JSON.parse(fs.readFileSync(repPath, 'utf8')).totals.renamed > 0;
  assert.equal(rebuilt.equals(orig), !renamedTree);
  if (renamedTree) {
    assert.ok(rebuilt.includes('localPlayer'), 'renamed tree missing expected identifier');
    assert.ok(rebuilt.length !== orig.length, 'renamed bundle unexpectedly same length');
  } else {
    assert.equal(rebuilt.length, 2878427);
  }
});

test('m1: regenerated manifest is self-consistent', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'));
  const regen = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.regen.json'), 'utf8'));
  const rep = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'rename-report.json'), 'utf8'));
  assert.deepEqual(regen.order, manifest.order);
  // Regen scans rebuilt code for OLD manifest names, so every renamed
  // occurrence of a manifest name drops out of the total. Renamed manifest
  // names: YdshJUELZK (111, b1) + lrRnpundBY (15) + ktLerTRTAa (3) (b3)
  // + cgKhuMbVj (3, b4) + zYkfnulmBd (2, b17) + L1P locals (klYMxzxpTL 4 +
  // aKmLbYuMC 6 + BhSKyEIxpfR 5 = 15) + LA1 locals (fkXbORMTcl 28 +
  // loPNdwjKE 4 + pkghYgdlX 491 + qIySEZgti 54 + QtjDeukbWl 9 +
  // URKVNwauOZ 287 + AyXbLxaib 13 + AUbXpMajF 19 = 905) + LA2 locals
  // (MAthzYJPxG 3 + wJMEOTpgSvP 5 + RNQDluasaN 9 + gURkzCzeY 5 +
  // vFgdYWoMXeQ 7 + zBgadyCVYk 73 + tDrlYTeenN 12 + vpVUSCGWK 2 = 116,
  // plus loPNdwjKE +16 and AyXbLxaib +6 from more LA1-token bindings
  // = 138) + LA3 locals (RNQDluasaN +217 from 25 geometry bindings,
  // tDrlYTeenN +8, new mNZeiqoUotp 54 + SNhEfvovpa 4 + usvzFuAsEB 29
  // = 312) + LA4 locals (AUbXpMajF +135 from 16 vertices bindings,
  // qIySEZgti +9, RNQDluasaN +4 from #1 only (#0 reverted: shorthand;
  // no new manifest tokens = 148) + LA5 locals (qIySEZgti +16, RNQDluasaN
  // +4, new dhHAhrXfI 5 = 25) + LA6 locals (klYMxzxpTL +11, aKmLbYuMC +4,
  // qIySEZgti +15, AyXbLxaib +10, RNQDluasaN +2, new eKOAfUGdqM 11 +
  // CNFryyAhIm 4 + CcjHTJKsGIh 16 + IUTkaCQgos 3 = 34; total 76) + LA7
  // locals (RNQDluasaN +187 from 30 geometry bindings #41-#70, klYMxzxpTL
  // +6, new KSqqDBREn 7 + KibzRdopc 13 + KkduOCYTPQ 1 = 21; total 214) +
  // LA7 locals done = 1967; LA8 locals (new UDYrzIiOP 10 + pLBXqJSbPlZ 3 +
  // UZFffGBjyhk 1 = 14) = 1981; LA9 locals (vFgdYWoMXeQ +113 from 2
  // Vector2 bindings) = 2094; LA10 locals (new QTOKQmNlEY 60 +
  // QwysDsAqBdy 8 + iNMXuHIoAx 4 + QTyIRIwcUl 2 = 74) = 2168; LA11
  // locals (aKmLbYuMC +152 from 26 camera bindings, klYMxzxpTL +17,
  // new jlJzDivrAmm 2 = 171) = 2168 + 171 = 2339; LA12 locals
  // (qIySEZgti +107 from 17 renderer bindings u0020#0-#16, no new
  // manifest tokens) = 2339 + 107 = 2446; LA13 locals (0 merged) =
  // 2446; LA14 locals (AUbXpMajF +46 from 11 vertices bindings
  // #29-#39, URKVNwauOZ +26 from 6 canvas-ctx bindings, BhSKyEIxpfR
  // +31 from 2 intersection bindings, dhHAhrXfI +7, new GdTYEgIav 1
  // = 111) = 2446 + 111 = 2557; LA15 locals (AUbXpMajF +140 from
  // 29 vertices bindings #0-#28, new SKCzNEjzurZ 11 + FBFOTIucqfz 8
  // = 159) = 2557 + 159 = 2716; LA16 locals (0 merged) = 2716; LA17
  // locals (new ulyscvmPM 6; bits/bj non-manifest) = 2716 + 6 = 2722;
  // LA18 locals (new bLuhQxfFGDS 3 + DgJwEtWhIm 41, dhHAhrXfI +15,
  // pLBXqJSbPlZ +30 = 89) = 2722 + 89 = 2811; LA19 locals (new
  // JoIkrtRxhZ 5) = 2811 + 5 = 2816; LA20 locals (new jWFyoTPALsS
  // 22 + jWTjxRTVr 1 + jhtmwYcJfq 21; join non-manifest) = 2816 + 44
  // = 2860; LA21 locals (new oEdpQEULkn 10 + avLenDzTQ 1; a4d/a4e/
  // a4f/a4g/a4h/a4i/a4j/a4k/o0/o1/o2/o3/o4/oN/oP/npts non-manifest)
  // = 2860 + 11 = 2871; LA22 locals (all 11 non-manifest:
  // a3K/a3L/f3/f4/_il4/_il5/_il6/_il7/_il8/_il9) = 2871; LA23
  // locals (RNQDluasaN +38 from 10 geometry bindings #25-#34;
  // a3p/a3z/a47/a49/a4A/a4a/a4b/a4c/a4d non-manifest) = 2871 +
  // 38 = 2909; LA24 locals (new wPChizNknM 16, wJMEOTpgSvP +14
  // from 5 intersect bindings, new dcItcWVWb 4; vlen
  // non-manifest) = 2909 + 34 = 2943; LA25 locals (new
  // kwrjVVjSgIH 55 + lUtmuvURyPI 7 + TLgJbfmniE 1, klYMxzxpTL
  // +20 from 8 direction bindings, GdTYEgIav +11 from 11
  // applyMatrix4 bindings; be/bd/bf/bp/bs/lGlobal
  // non-manifest) = 2943 + 94 = 3037; LA26 locals (new
  // ooGSYjPde 24; _b/_b2/_b3/sho non-manifest) = 3037 + 24
  // = 3061; LA27 locals (pLBXqJSbPlZ +26 from 10 distance
  // bindings, new afCJVYrCGK 4; ae/af/aj/an non-manifest)
  // = 3061 + 30 = 3091; LA28 locals (0, all-keep wave) =
  // 3091; LA29 locals (new kDCTWhoSiT 8 + OpiuFvBcQd 6 +
  // kAnjdtJLio 1) = 3091 + 15 = 3106; LA30 locals
  // (gURkzCzeY +298 from 2 Vector3 bindings, loPNdwjKE +37
  // from 11 intersects bindings; cs/cu/fvA/fvB/fvC
  // non-manifest) = 3106 + 335 = 3441; LA31 locals
  // (RNQDluasaN +43 from 12 geometry bindings, new
  // RalTGIIEA 4 + ReDNKHkwk 4 + RSNmJyewpGe 1; _e
  // non-manifest) = 3441 + 52 = 3493; LA32 locals (new
  // xdgCWeCpd 4 + xlUBzfMxe 1 + zuYSmsDYXXy 1; a4*/_i3/
  // _il* family non-manifest) = 3493 + 6 = 3499; LA33
  // locals (new YbYyrgWGnfQ 3 + XcYeSlLtjr 2 +
  // XOVWraMIAg 1; cf non-manifest) = 3499 + 6 = 3505;
  // LA34 locals (all 7 non-manifest: ml/ho/ce/hl/ol)
  // = 3505; LA35 locals (new equzRsyKrD 2) = 3505 + 2
  // = 3507; LA36 locals (all 30 non-manifest:
  // _jl/_l/_k/_key/_start$1 families) = 3507; LA37
  // locals (all 6 non-manifest: fl/flen) = 3507;
  // LA38 locals (new mPDLPePIID 2; aX/aY/aStartAngle/
  // aRotation/a_x/a_y/m_uniforms non-manifest) = 3507 + 2
  // = 3509; LA39 locals (new aKmLbYuMC 15; aCP*/aClockwise/
  // aEndAngle/aRotation/ab/ac/ad/mx/pars non-manifest) =
  // 3509 + 15 = 3524; LA40 locals (0, all-keep wave)
  // = 3524; LA41 locals (0, all-keep wave) = 3524;
  // LA42 locals (0, all-keep wave) = 3524; LA43 locals
  // (0, all-keep wave) = 3524; LA44 locals (0, all-keep
  // wave) = 3524; LD1 locals (all 175 non-manifest,
  // diverged snippet-only) = 3524; LD2 locals (all 163
  // non-manifest, diverged snippet-only) = 3524; LD3 locals
  // (all 179 non-manifest, diverged snippet-only) = 3524;
  // LD4 locals (all 167 non-manifest, diverged snippet-only)
  // = 3524; LD5 locals (all 181 non-manifest, diverged
  // snippet-only) = 3524; LD6 locals (all 185 non-manifest,
  // diverged snippet-only) = 3524; LD7 locals (all 180
  // non-manifest, diverged snippet-only) = 3524; LD8 locals
  // (all 191 non-manifest, diverged snippet-only) = 3524;
  // LD9 locals (all 190 non-manifest, diverged snippet-only)
  // = 3524; LD10 locals (all 198 non-manifest, diverged
  // snippet-only) = 3524; LD11 locals (all 177 non-manifest,
  // diverged snippet-only) = 3524; LD12 locals (all 237
  // non-manifest, diverged snippet-only) = 3524; LD13 locals
  // (all 166 non-manifest, diverged snippet-only) = 3524;
  // LD14 locals (all 177 non-manifest, diverged
  // snippet-only) = 3524; LD15 locals (all 199
  // non-manifest, diverged snippet-only) = 3524;
  // LD16 locals (all 195 non-manifest, diverged
  // snippet-only) = 3524; LD17 locals (all 195
  // non-manifest, diverged snippet-only) = 3524;
  // LD18 locals (all 181 non-manifest, diverged
  // snippet-only) = 3524; LD19 locals (all 190
  // non-manifest, diverged snippet-only) = 3524;
  // LD20 locals (new rwWvECiaAns 13 from 3 ownTeamId
  // bindings; rest non-manifest) = 3524 + 13 = 3537;
  // LD21 locals (all 224 non-manifest, diverged
  // snippet-only) = 3537;
  // LD22 locals (all 176 non-manifest, diverged
  // snippet-only) = 3537;
  // LD23 locals (all 197 non-manifest, diverged
  // snippet-only) = 3537;
  // LD24 locals (all 219 non-manifest, diverged
  // snippet-only) = 3537;
  // computed from the report.
  const manNames = new Set(manifest.order);
  const renamedAway = Object.entries(rep.entries)
    .filter(([t, r]) => manNames.has(t) || manNames.has(r.token))
    .reduce((n, [, r]) => n + (r.renamed || 0), 0);
  assert.equal(renamedAway, 3537);
  assert.equal(regen.meta.total, manifest.meta.measuredVm9Total - renamedAway);
  assert.equal(regen.meta.total, 12650);
});

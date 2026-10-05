// client-deob/tools/server-anchors.mjs — M5 server-hook decision record (PLAN §3 Phase E).
//
// Decision: E1 — keep serving the original final.pkg.gz untouched. The modular
// src/ tree (VM9 lineage) is a reference/analysis artifact + testing surface.
//
// Evidence (measured by this tool, not assumed):
// * src/ derives from raw/bundles/VM9.deob.txt, an OLDER lineage than the served
//   raw/bundles/final.pkg.js (== gunzip of final.pkg.gz, asserted below):
//   7 bundle anchors the live server patches into the served build are ABSENT
//   from VM9 (reload, autoreload, ray, kick, xhair-p1/p5/p6 — decoder-index
//   drift such as ai1(0x3a2)/aDW(0xba3)/arY(0xbbd)). Serving a VM9-derived
//   rebuild (E2) would silently drop those live gameplay patches plus ~55k of
//   newer content and the loader manifest seam. E2 is therefore rejected until
//   the pipeline is re-run on the served build (PLAN §6.1 deferred work).
// * Conversely 5 UI-cleanup anchors match VM9 but MISS the served build
//   (ui-ch1/ch3/discord/terms/nav — served uses arY()/atB() decoder forms such
//   as Kq[arY(0xaf4)] where VM9 has Kq["eglp"]). Those patches silently skip in
//   production today; E1 changes nothing about that (pre-existing condition,
//   server code untouched).
// * E3 (string splicing -> real edits) depends on E2 and is deferred with it.
//
// Reads:  raw/bundles/VM9.deob.txt + raw/bundles/final.pkg.js +
//         raw/bundles/final.pkg.gz + gameplay/client/index.html +
//         gameplay/server/src/gameplay-server.mjs (transcription guard) +
//         data/rename-map.json + data/units.json
// Writes: build/server-anchors.json — per-anchor presence in both lineages,
//         rename-map lookup per identifier token, VM9 offset -> src/ module,
//         and the E1 summary. Deterministic (table order, sorted tokens/modules,
//         sha256 provenance, no timestamps).
//
// Rules: fail loudly if any anchor literal is found in NEITHER corpus
// (transcription error), if any serverParts entry is missing from the server
// source (tool/server drift), or if gunzip(final.pkg.gz) !== final.pkg.js
// (E1 serves that exact file). Lineage misses are the FINDING, not a failure.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { corpus } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
// Corpus paths resolve lazily inside serverAnchors(); presence checks always
// cover the served file + VM9 file (lineage facts are corpus-independent);
// only the module mapping + report location follow the active corpus. In
// served mode, served file offsets shift by codeStart to code-relative units.

const BS = String.fromCharCode(92); // backslash: server builds these via _BS
const DQ = String.fromCharCode(34); // double quote: server builds these via _Q
const SRV = 'gameplay/server/src/gameplay-server.mjs:';

// kind 'bundle': searched in VM9 + served final.pkg.js.
// kind 'page':   searched in gameplay/client/index.html (loader seams).
// serverParts: substrings that must ALL occur verbatim in gameplay-server.mjs
// (for _BS/_Q-constructed anchors the literal is split in server source).
const ANCHORS = [
  { id: 'gq-a1e', kind: 'bundle', serverRef: SRV + 'L33+L154',
    literal: ';function a1E(){', serverParts: [';function a1E(){'] },
  { id: 'pospatch', kind: 'bundle', serverRef: SRV + 'L159',
    literal: 'a27[a26]=J3[', serverParts: ['a27[a26]=J3['] },
  { id: 'joinparty', kind: 'bundle', serverRef: SRV + 'L177',
    literal: "a3o['length']>0x6&&(a3o=a3o['substr'](a3o['length']-0x6));if(a3o['length']<0x6){",
    serverParts: ["a3o['length']>0x6&&(a3o=a3o['substr'](a3o['length']-0x6));if(a3o['length']<0x6){"] },
  { id: 'phys', kind: 'bundle', serverRef: SRV + 'L183',
    literal: "G4=EN(QP,SW,W2),SW['PhbhpxFxPP']=KN,EX(SW,V3);",
    serverParts: ["G4=EN(QP,SW,W2),SW['PhbhpxFxPP']=KN,EX(SW,V3);"] },
  { id: 'reload', kind: 'bundle', serverRef: SRV + 'L190',
    literal: "var Hx=Object['keys'](Hs);for(var tf=0x0;tf<Hx[ai1(0x3a2)];tf++){",
    serverParts: ["var Hx=Object['keys'](Hs);for(var tf=0x0;tf<Hx[ai1(0x3a2)];tf++){"] },
  { id: 'autoreload', kind: 'bundle', serverRef: SRV + 'L197',
    literal: "if((a5b[aqH(0x703)]||a56['xqItLdaOH']==0x0)&&!a56['krtmjJROjX']&&a56['xqItLdaOH']<a56[aqH(0x2d5)]['xqItLdaOH']){",
    serverParts: ["if((a5b[aqH(0x703)]||a56['xqItLdaOH']==0x0)&&!a56['krtmjJROjX']"] },
  { id: 'ray', kind: 'bundle', serverRef: SRV + 'L205',
    literal: "var a3I=a3F*Math[aDW(0xba3)](a3G),a3J=a3H*0x2*Math['PI'];a08[aDW(0xe25)](a3I*Math[aDW(0xb69)](a3J)*0x9/0x10,a3I*Math['sin'](a3J),Td),",
    serverParts: ["var a3I=a3F*Math[aDW(0xba3)](a3G),a3J=a3H*0x2*Math['PI']"] },
  { id: 'kick', kind: 'bundle', serverRef: SRV + 'L212',
    literal: "YdshJUELZK[aDW(0x58a)]=Math['random']()-0.5,YdshJUELZK[aDW(0x50a)]=Math[aDW(0x4bd)]()-0.5;",
    serverParts: ["YdshJUELZK[aDW(0x58a)]=Math['random']()-0.5"] },
  { id: 'a3k', kind: 'bundle', serverRef: SRV + 'L219',
    literal: "var a3K=ER(QP,Ff,a08),a3L,a3M,a3N=lrRnpundBY('T1P0J19B02U');",
    serverParts: ["var a3K=ER(QP,Ff,a08),a3L,a3M,a3N=lrRnpundBY('T1P0J19B02U');"] },
  { id: 'wx', kind: 'bundle', serverRef: SRV + 'L226',
    literal: "T2['add'](WX),WV['add'](Td);",
    serverParts: ["T2['add'](WX),WV['add'](Td);"] },
  { id: 'wm', kind: 'bundle', serverRef: SRV + 'L232',
    literal: 'function WM(a3o,a3p){', serverParts: ['function WM(a3o,a3p){'] },
  { id: 'chat', kind: 'bundle', serverRef: SRV + 'L239',
    literal: "'kM86hVW024':function(a3o){var aCw=ai1;",
    serverParts: ["'kM86hVW024':function(a3o){var aCw=ai1;"] },
  { id: 'ui-latest', kind: 'bundle', serverRef: SRV + 'L248',
    literal: "if(!Gj){a8z['add'](Mj(a3k,'Latest" + BS + "x20Update:'",
    serverParts: ["if(!Gj){a8z['add'](Mj(a3k,'Latest", "x20Update:'"] },
  { id: 'ui-login', kind: 'bundle', serverRef: SRV + 'L254',
    literal: "var a8b=new a3D('Log" + BS + "x20In',0x69,0x32,0x14);",
    serverParts: ["var a8b=new a3D('Log", "x20In',0x69,0x32,0x14);"] },
  { id: 'ui-google', kind: 'bundle', serverRef: SRV + 'L259',
    literal: "var a8h=new a3D('Sign" + BS + "x20in" + BS + "x20with" + BS + "x20Google',0x122,0x32,0x14);",
    serverParts: ["var a8h=new a3D('Sign", "x20in", "x20with", "x20Google',0x122,0x32,0x14);"] },
  { id: 'ui-ch1', kind: 'bundle', serverRef: SRV + 'L265',
    literal: "a6h['add'](a6g),Mm['add'](a6h),Kq[" + DQ + "eglp" + DQ + "]=a6h;",
    serverParts: ["a6h['add'](a6g),Mm['add'](a6h),Kq[", "eglp", "]=a6h;"] },
  { id: 'ui-ch2', kind: 'bundle', serverRef: SRV + 'L270',
    literal: ",Kq['nwxurZsxI']['add'](a6D);",
    serverParts: [",Kq['nwxurZsxI']['add'](a6D);"] },
  { id: 'ui-ch3', kind: 'bundle', serverRef: SRV + 'L275',
    literal: "a6B[" + DQ + "ReDNKHkwk" + DQ + "]=!![];ah4==undefined",
    serverParts: ["a6B[", "ReDNKHkwk", "]=!![];ah4==undefined"] },
  { id: 'ui-discord', kind: 'bundle', serverRef: SRV + 'L281',
    literal: "!Gj&&a6O['add'](a72);a6O[" + DQ + "add" + DQ + "](a6Z[" + DQ + "r23ZS3L2g" + DQ + "]),Mu['fAdWFGQLqES'](a6Z);",
    serverParts: ["!Gj&&a6O['add'](a72);a6O[", "](a6Z[", "r23ZS3L2g", "]),Mu['fAdWFGQLqES'](a6Z);"] },
  { id: 'ui-terms', kind: 'bundle', serverRef: SRV + 'L287',
    literal: "a7g['Terms']='terms.html',a7g['Privacy']=" + DQ + "privacy.html" + DQ + ",a7g[" + DQ + "Partners" + DQ + "]='partners.html',a7g['Contact']=" + DQ + "contact.html" + DQ + ";",
    serverParts: ["a7g['Terms']='terms.html',a7g['Privacy']=", "privacy.html", ",a7g[", "Partners", "]='partners.html',a7g['Contact']=", "contact.html"] },
  { id: 'ui-nav', kind: 'bundle', serverRef: SRV + 'L293',
    literal: "var a8E=['PLAY" + BS + "x20GAME'," + DQ + "SETTINGS" + DQ + ",'SHOP'," + DQ + "LOCKER" + DQ + ",'LEADERBOARD'," + DQ + "ACCOUNT" + DQ + "];Gj&&(a8E=['PLAY" + BS + "x20GAME'," + DQ + "SETTINGS" + DQ + ",'SHOP'," + DQ + "LOCKER" + DQ + ",'ACCOUNT'," + DQ + "LEADERBOARD" + DQ + "]);var a8F=0x5;",
    serverParts: ["var a8E=['PLAY", "x20GAME',", "SETTINGS", ",'SHOP',", "LOCKER", ",'LEADERBOARD',", "ACCOUNT", "]);var a8F=0x5;"] },
  { id: 'gloo-btn', kind: 'bundle', serverRef: SRV + 'L299',
    literal: "var a4S=a4Q,a4Q=new a3G('pause.png',",
    serverParts: ["var a4S=a4Q,a4Q=new a3G('pause.png',"] },
  { id: 'gloo-layout', kind: 'bundle', serverRef: SRV + 'L305',
    literal: "Nc[" + DQ + "r23ZS3L2g" + DQ + "]['position']['x']=Kq['qIySEZgti']['siccypZlKyH']+0xc8*a4O,Nc['xhOdNSwMWQd'](!![]);",
    serverParts: ["Nc[", "r23ZS3L2g", "]['position']['x']=Kq['qIySEZgti']['siccypZlKyH']+0xc8*a4O,Nc['xhOdNSwMWQd'](!![]);"] },
  { id: 'xhair-p1', kind: 'bundle', serverRef: SRV + 'L313',
    literal: "Kq[arY(0xbbd)]=function(){var au5=arY;a8P&&a8Z!=undefined&&a8Z['preview']!=undefined&&a8Z['preview'][au5(0x402)]();};",
    serverParts: ["Kq[arY(0xbbd)]=function(){var au5=arY;a8P&&a8Z!=undefined&&a8Z['preview']!=undefined&&a8Z['preview'][au5(0x402)]();};"] },
  { id: 'xhair-p2', kind: 'bundle', serverRef: SRV + 'L318',
    literal: "Kq['renderCrosshairPreview']!=undefined&&Kq['renderCrosshairPreview']();",
    serverParts: ["Kq['renderCrosshairPreview']!=undefined&&Kq['renderCrosshairPreview']();"] },
  { id: 'xhair-p3', kind: 'bundle', serverRef: SRV + 'L323',
    literal: "function agb(){var awR=arY;a8Q(),",
    serverParts: ["function agb(){var awR=arY;a8Q(),"] },
  { id: 'xhair-p4', kind: 'bundle', serverRef: SRV + 'L328',
    literal: "function a9h(){var auq=arY;a8Q(),",
    serverParts: ["function a9h(){var auq=arY;a8Q(),"] },
  { id: 'xhair-p5', kind: 'bundle', serverRef: SRV + 'L333',
    literal: "agb();a8K['dom']['s']['visibility']!=awP(0x5c5)&&a8Q();",
    serverParts: ["agb();a8K['dom']['s']['visibility']!=awP(0x5c5)&&a8Q();"] },
  { id: 'xhair-p6', kind: 'bundle', serverRef: SRV + 'L338',
    literal: "let ah8=a8K[atU(0x9e6)];ah8[atU(0x774)][atU(0x944)](),a8K['dom']['s'][atU(0x40e)]=0x0,",
    serverParts: ["let ah8=a8K[atU(0x9e6)];ah8[atU(0x774)][atU(0x944)](),a8K['dom']['s'][atU(0x40e)]=0x0,"] },
  { id: 'gyro-settings', kind: 'bundle', serverRef: SRV + 'L344',
    literal: "Ru,Rv,{'type':0x1,'id':'sensitivity'",
    serverParts: ["Ru,Rv,{'type':0x1,'id':'sensitivity'"] },
  { id: 'gyro-look', kind: 'bundle', serverRef: SRV + 'L350',
    literal: "SW['nVQNEtZqJ']=WY,SW['XROrmxcpbW']=WV;while(WY[RY]['y']>=Qz){",
    serverParts: ["SW['nVQNEtZqJ']=WY,SW['XROrmxcpbW']=WV;while(WY[RY]['y']>=Qz){"] },
  { id: 'loader-acbiuzw', kind: 'page', serverRef: SRV + 'L25',
    literal: 'async function aCbiuzw(zmjVzd_,AeaySZ){var DwUkqS1;',
    serverParts: ['async function aCbiuzw(zmjVzd_,AeaySZ){var DwUkqS1;'] },
  { id: 'loader-seam', kind: 'page', serverRef: SRV + 'L40',
    literal: 'EnJV2g=await gJLONEI(YQVRvZV,zmjVzd_,q7pZFi)',
    serverParts: ['EnJV2g=await gJLONEI(YQVRvZV,zmjVzd_,q7pZFi)'] },
];

const JS_KEYWORDS = new Set([
  'var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'do',
  'return', 'new', 'typeof', 'in', 'of', 'true', 'false', 'undefined', 'null',
  'this', 'try', 'catch', 'switch', 'case', 'break', 'continue', 'void', 'delete',
]);

function sha256Bytes(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function locate(hay, needle) {
  // count + first offset with a literal (non-regex) search.
  if (!needle) return { present: false, count: 0, first: -1 };
  const count = hay.split(needle).length - 1;
  return { present: count > 0, count, first: count > 0 ? hay.indexOf(needle) : -1 };
}

function tokensOf(literal) {
  const out = new Set();
  for (const m of literal.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    if (!JS_KEYWORDS.has(m[0])) out.add(m[0]);
  }
  return [...out].sort();
}

export function serverAnchors({ writeReport = true } = {}) {
  const C = corpus();
  const VM9_PATH = path.join(ROOT, 'raw', 'bundles', 'VM9.deob.txt');
  const PKG_PATH = path.join(ROOT, 'raw', 'bundles', 'final.pkg.js');
  const GZ_PATH = path.join(ROOT, 'raw', 'bundles', 'final.pkg.gz');
  const PAGE_PATH = path.join(ROOT, 'gameplay', 'client', 'index.html');
  const SERVER_PATH = path.join(ROOT, 'gameplay', 'server', 'src', 'gameplay-server.mjs');
  const MAP_PATH = C.renameMapPath;
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const MANIFEST_PATH = path.join(C.dataDir, 'manifest.json');
  const OUT_PATH = path.join(C.buildDir, C.serverAnchorsReportFile);
  for (const p of [VM9_PATH, PKG_PATH, GZ_PATH, PAGE_PATH, SERVER_PATH, MAP_PATH, UNITS_PATH]) {
    if (!fs.existsSync(p)) throw new Error(`server-anchors: missing input ${path.relative(ROOT, p)}`);
  }
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');
  const pkg = fs.readFileSync(PKG_PATH, 'utf8');
  const gz = fs.readFileSync(GZ_PATH);
  const page = fs.readFileSync(PAGE_PATH, 'utf8');
  const server = fs.readFileSync(SERVER_PATH, 'utf8');
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const { units } = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));

  // E1 premise: the file the server sends IS final.pkg.js (decrypted on disk).
  const gunzipped = zlib.gunzipSync(gz).toString('utf8');
  if (gunzipped !== pkg) {
    throw new Error('server-anchors: gunzip(raw/bundles/final.pkg.gz) !== raw/bundles/final.pkg.js');
  }

  const mapByToken = new Map(map.order.map((t) => [t, map.entries[t]]));
  const sortedUnits = [...units].sort((a, b) => a.start - b.start);
  // Served units are code-relative; served file offsets shift by codeStart.
  // (vm9 mode: vm9 units are file-absolute, vm9 offsets map directly.)
  const servedCodeStart = C.name === 'served'
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')).meta.codeStart
    : 0;
  const moduleAt = (off) => {
    let lo = 0, hi = sortedUnits.length - 1, hit = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sortedUnits[mid].start <= off) { hit = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    if (hit >= 0 && off < sortedUnits[hit].end) return sortedUnits[hit].module;
    return null;
  };

  const anchors = ANCHORS.map((a) => {
    for (const part of a.serverParts) {
      if (!server.includes(part)) {
        throw new Error(`server-anchors: ${a.id} serverParts missing from server source: ${JSON.stringify(part.slice(0, 60))}`);
      }
    }
    const entry = {
      id: a.id, kind: a.kind, serverRef: a.serverRef,
      literalLen: a.literal.length, serverParts: a.serverParts.length,
    };
    if (a.kind === 'bundle') {
      const s = locate(pkg, a.literal);
      const v = locate(vm9, a.literal);
      entry.served = s;
      entry.vm9 = v;
      if (!s.present && !v.present) {
        throw new Error(`server-anchors: ${a.id} literal in NEITHER corpus (transcription error?)`);
      }
      // Module mapping follows the active corpus: vm9 file offsets into vm9
      // units, served file offsets (shifted to code-relative) into served units.
      const mapOff = C.name === 'served' ? s.present ? s.first - servedCodeStart : -1 : v.present ? v.first : -1;
      const mapPresent = C.name === 'served' ? s.present : v.present;
      entry.modules = mapPresent ? [moduleAt(mapOff)].filter(Boolean) : [];
      if (mapPresent && entry.modules.length === 0) {
        throw new Error(`server-anchors: ${a.id} offset ${mapOff} maps to no unit (${C.name})`);
      }
    } else {
      const p = locate(page, a.literal);
      entry.page = p;
      if (!p.present) throw new Error(`server-anchors: ${a.id} missing from gameplay/client/index.html`);
      entry.modules = [];
    }
    entry.tokens = tokensOf(a.literal).map((t) => {
      const e = mapByToken.get(t);
      if (!e) return { token: t, map: null };
      return {
        token: t,
        map: {
          action: e.action,
          ...(e.action === 'rename' ? { name: e.name } : {}),
          scope: e.scope,
        },
      };
    });
    return entry;
  });

  const bundle = anchors.filter((a) => a.kind === 'bundle');
  const pages = anchors.filter((a) => a.kind === 'page');
  const summary = {
    bundleTotal: bundle.length,
    servedPresent: bundle.filter((a) => a.served.present).length,
    servedMissing: bundle.filter((a) => !a.served.present).map((a) => a.id).sort(),
    vm9Present: bundle.filter((a) => a.vm9.present).length,
    vm9Missing: bundle.filter((a) => !a.vm9.present).map((a) => a.id).sort(),
    pageTotal: pages.length,
    pagePresent: pages.filter((a) => a.page.present).length,
    pageMissing: pages.filter((a) => !a.page.present).map((a) => a.id).sort(),
    renamedTokens: [...new Set(anchors.flatMap((a) =>
      a.tokens.filter((t) => t.map && t.map.action === 'rename').map((t) => `${t.token}->${t.map.name}`),
    ))].sort(),
    modules: [...new Set(anchors.flatMap((a) => a.modules))].sort(),
  };

  const report = {
    meta: {
      generatedBy: `client-deob/tools/server-anchors.mjs (M5${C.name === 'served' ? '/M6 served' : ''})`,
      corpus: C.name,
      decision: 'E1',
      decisionNote: 'serve raw/bundles/final.pkg.gz untouched; src/ (VM9 lineage) stays a reference/analysis artifact. '
        + 'E2 rejected: 7 served gameplay anchors are absent from VM9 (decoder-index drift) + ~55k newer content + loader manifest seam. '
        + 'E3 deferred with E2.',
      sources: {
        vm9: { bytes: Buffer.byteLength(vm9, 'utf8'), sha256: sha256Bytes(Buffer.from(vm9, 'utf8')) },
        served: { bytes: Buffer.byteLength(pkg, 'utf8'), sha256: sha256Bytes(Buffer.from(pkg, 'utf8')), gunzipOf: 'raw/bundles/final.pkg.gz' },
        gz: { bytes: gz.length, sha256: sha256Bytes(gz) },
        page: { bytes: Buffer.byteLength(page, 'utf8'), sha256: sha256Bytes(Buffer.from(page, 'utf8')) },
        server: { bytes: Buffer.byteLength(server, 'utf8'), sha256: sha256Bytes(Buffer.from(server, 'utf8')) },
      },
      renameMap: { entries: map.order.length, rename: map.meta.renameCount, keep: map.meta.keepCount },
      counts: { bundle: summary.bundleTotal, page: summary.pageTotal },
    },
    anchors,
    summary,
  };
  if (writeReport) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`server-anchors: E1 recorded — bundle ${summary.bundleTotal} anchors: `
    + `served ${summary.servedPresent}/${summary.bundleTotal} (missing ${summary.servedMissing.length}), `
    + `vm9 ${summary.vm9Present}/${summary.bundleTotal} (missing ${summary.vm9Missing.length}); `
    + `page ${summary.pagePresent}/${summary.pageTotal} -> ${path.relative(ROOT, OUT_PATH)}`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    serverAnchors();
  } catch (err) {
    console.error(`server-anchors.mjs: ${err && err.message ? err.message : err}`);
    process.exit(1);
  }
}

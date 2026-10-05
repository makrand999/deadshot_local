// client-deob/tools/seed-rename-map.mjs — Phase B seeding (M2)
//
// Reads:  ../../docs/client/symbol-map.md (133 table rows; primary glossary)
//         hardcoded Was→Now codec table from ../../docs/client/network.md
//         ../../raw/bundles/VM9.deob.txt (occurrence stats for evidence only)
// Writes: ../data/rename-map.json
//         { meta, order, entries: { token: { token,name,scope,action,evidence,docs,alternates } } }
//
// Scopes: "global" (variable/function binding, rename applies to identifier
//         positions resolving to the outermost binding), "property:<base>"
//         (string-held `base['key']` — never renamed, strings are protected),
//         "string-key" (bone keys occurring only as string literals — keep),
//         "loader" (game.deob.js symbols absent from the VM9 tree — keep).
// Actions: "rename" | "keep". Only action=rename entries are applied by
//         tools/rename.mjs; keep entries document meaning without touching bytes.
//
// Naming conflicts resolved here (never invented; rationale recorded per entry):
// - J2/J3 share doc name "messageTemplates" but are distinct bindings
//   (`var J3=J2` alias): J2→templatesByName (network.md), J3→templatesLive
//   (PLAN Phase B example; Jg mutates J3[name] in place).
// - a11→dispatchLoop (symbol-map + dual-buffer drain-loop body + PLAN
//   network/dispatch.js), alternate onSocketMessage (network.md).
// - a0Y→streamCipher (symbol-map + PLAN), alternate decryptFrame (network.md).
// - a0F/a0G→xorKey/subKey (cipher math `b-=a0G; b^=a0F`), alternate addKey.
// - a0Z/a10 and a6B/a6q share one doc name but are swapped/rotated distinct
//   bindings (merge would corrupt the swap): A/B suffixes.
// - L9/La/Lb and a8p/a8r/a8q get Daily/Weekly/Event roles from their descriptions.
// - Kq.eglp/a6h share "challengesRootPanel" across namespaces (property vs
//   variable — no collision): eglp keeps (string-held), a6h renames.
//
// Deterministic: document order, no timestamps. Fail loudly on unparseable rows.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SYMBOL_MAP_PATH = path.join(ROOT, 'docs', 'client', 'symbol-map.md');
const VM9_PATH = path.join(ROOT, 'raw', 'bundles', 'VM9.deob.txt');
const OUT_PATH = path.join(__dirname, '..', 'data', 'rename-map.json');

// network.md §Renamed codec Was→Now table (primary for these tokens).
const NETWORK_CODEC = {
  J3: 'templates',
  J2: 'templatesByName',
  J9: 'templateOrder',
  Je: 'encodeMessage',
  Jg: 'decodeMessage',
  Jd: 'writeString',
  Jf: 'readString',
  a0I: 'handlers',
};

// network.md names recorded only as alternates (symbol-map wins; see OVERRIDES).
const NETWORK_ALTERNATES = {
  a11: 'onSocketMessage (network.md)',
  a0Y: 'decryptFrame (network.md)',
  a0G: 'addKey (network.md)',
};
// Final seed decisions overriding the raw doc text (rationale in entry evidence).
const OVERRIDES = {
  J3: { name: 'templatesLive', why: 'PLAN Phase B example; Jg mutates J3[name] templates in place (shared mutable singletons)' },
  a11: { name: 'dispatchLoop', why: 'dual-buffer drain-loop body + PLAN network/dispatch.js "a11 receive loop" (network.md alternate: onSocketMessage)' },
  a0Y: { name: 'streamCipher', why: 'PLAN network/dispatch.js "a0Y stream cipher" (network.md alternate: decryptFrame)' },
  a0G: { name: 'subKey', why: 'cipher math is subtraction then xor: b-=a0G; b^=a0F (network.md alternate: addKey)' },
  a0Z: { name: 'packetBufferQueueA', why: 'doc plural "packetBufferQueues" covers a swap pair (let t=a0Z;a0Z=a10,a10=t): merging names would corrupt the swap; A/B preserves distinct bindings' },
  a10: { name: 'packetBufferQueueB', why: 'swap pair mate of a0Z (see a0Z evidence)' },
  a6B: { name: 'hudMiniTrackerA', why: 'doc singular "hudMiniTracker" covers rotated distinct bindings (a6q=a6r; a6r=new; a6B=a6r; a6r=a6q): A/B preserves distinct bindings' },
  a6q: { name: 'hudMiniTrackerB', why: 'rotation mate of a6B (see a6B evidence)' },
  L9: { name: 'dailyChallengeData', why: 'doc roles: Daily (L9), Weekly (La), Event (Lb) challenge JSON payloads' },
  La: { name: 'weeklyChallengeData', why: 'doc roles: Daily (L9), Weekly (La), Event (Lb)' },
  Lb: { name: 'eventChallengeData', why: 'doc roles: Daily (L9), Weekly (La), Event (Lb)' },
  a8p: { name: 'dailyChallengeList', why: 'doc roles: parsed list of daily (a8p), weekly (a8r), event (a8q) challenge items' },
  a8r: { name: 'weeklyChallengeList', why: 'doc roles: daily (a8p), weekly (a8r), event (a8q)' },
  a8q: { name: 'eventChallengeList', why: 'doc roles: daily (a8p), weekly (a8r), event (a8q)' },
};

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function countWords(hay, tok) {
  const re = new RegExp(`\\b${escRe(tok)}\\b`, 'g');
  let n = 0;
  while (re.exec(hay) !== null) n++;
  return n;
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

export async function seedRenameMap() {
  const md = fs.readFileSync(SYMBOL_MAP_PATH, 'utf8');
  const vm9 = fs.readFileSync(VM9_PATH, 'utf8');
  const entries = {};
  const order = [];
  let section = '';
  let rows = 0;

  const add = (token, e) => {
    if (entries[token]) throw new Error(`seed: duplicate token ${token}`);
    entries[token] = { token, ...e };
    order.push(token);
  };

  for (const line of md.split('\n')) {
    const h = line.match(/^#{2,3}\s+\d+\.\s+(.*)$/);
    if (h) {
      section = h[1].trim();
      continue;
    }
    if (!line.startsWith('| `')) continue;
    rows++;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const tokCell = cells[0] || '';
    const nameCell = cells[2] || '';
    const descCell = cells[cells.length - 1] || '';
    const toks = [...tokCell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    let names = [...nameCell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (toks.length === 0) throw new Error(`seed: row without token: ${line.slice(0, 120)}`);
    // Single span holding "A / B" (a0F/a0G, Jd/Jf rows): split positionally.
    if (names.length === 1 && names[0].includes('/') && toks.length > 1) {
      names = names[0].split('/').map((s) => s.trim());
    }
    const desc = descCell.replace(/`/g, '').trim().slice(0, 300);

    if (section.startsWith('Loader')) {
      for (const t of toks) {
        const nm = names.length === toks.length ? names[toks.indexOf(t)] : names[0];
        add(t, {
          name: nm || null,
          scope: 'loader',
          action: 'keep',
          evidence: `symbol-map §Loader: loader-only symbol (game.deob.js), absent from VM9 tree (word-occurrences=${countWords(vm9, t)})`,
          docs: 'docs/client/symbol-map.md §11',
          alternates: [],
        });
      }
      continue;
    }
    if (section.startsWith('Anatomical') || (toks.length === 1 && names.length === 0)) {
      // §6.1 bone keys: columns are Key | Bone Name (plain text) | Relative Y | Role.
      const boneCell = (cells[1] || '').replace(/`/g, '').trim();
      const plain = boneCell || descCell.replace(/`/g, '').trim();
      for (const t of toks) {
        add(t, {
          name: plain.split('(')[0].trim().slice(0, 60) || null,
          scope: 'string-key',
          action: 'keep',
          evidence: `bone key occurs only as string literal in VM9 (total=${countWords(vm9, t)}, quoted=${countQuoted(vm9, t)}); strings are never renamed`,
          docs: 'docs/client/symbol-map.md §6.1',
          alternates: [],
        });
      }
      continue;
    }
    if (names.length !== 1 && names.length !== toks.length) {
      throw new Error(`seed: cannot pair tokens/names: toks=${JSON.stringify(toks)} names=${JSON.stringify(names)}`);
    }
    toks.forEach((t, i) => {
      const docName = names.length === 1 ? names[0] : names[i];
      const dotted = t.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/);
      if (dotted) {
        const [, base, attr] = dotted;
        add(t, {
          name: docName,
          scope: `property:${base}`,
          action: 'keep',
          evidence: `property held only as computed string ${base}['${attr}'] in VM9 (dotted=${countWords(vm9, t)}, computed-string=${countQuoted(vm9, attr)} on ${base}); strings are never renamed`,
          docs: 'docs/client/symbol-map.md',
          alternates: [],
        });
        return;
      }
      const ov = OVERRIDES[t];
      const net = NETWORK_CODEC[t];
      const netAlt = NETWORK_ALTERNATES[t];
      let name = docName;
      const alternates = [];
      if (ov) {
        if (docName && docName !== ov.name) alternates.push(docName);
        if (net && net !== ov.name && net !== docName) alternates.push(`${net} (network.md)`);
        if (netAlt && !alternates.includes(netAlt)) alternates.push(netAlt);
        name = ov.name;
      } else if (net) {
        if (docName && docName !== net) alternates.push(docName);
        name = net;
      }
      add(t, {
        name,
        scope: 'global',
        action: 'rename',
        evidence: `${ov ? ov.why + '. ' : ''}symbol-map §${section} ("${desc.slice(0, 140)}"); VM9 word-occurrences=${countWords(vm9, t)}`,
        docs: ov || net ? 'docs/client/symbol-map.md + docs/client/network.md' : 'docs/client/symbol-map.md',
        alternates,
      });
    });
  }

  // Sanity: every rename-action name valid + unique (single shared name across
  // namespaces is allowed only for the documented Kq.eglp(keep)/a6h pair).
  const seenNames = new Map();
  for (const t of order) {
    const e = entries[t];
    if (e.action !== 'rename') continue;
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e.name)) throw new Error(`seed: invalid name ${e.name} for ${t}`);
    if (seenNames.has(e.name)) throw new Error(`seed: duplicate new name ${e.name} (${seenNames.get(e.name)}, ${t})`);
    seenNames.set(e.name, t);
  }

  const meta = {
    sources: ['docs/client/symbol-map.md', 'docs/client/network.md (codec Was→Now table)', 'PLAN Phase B examples (J3→templatesLive)'],
    generatedBy: 'client-deob/tools/seed-rename-map.mjs (M2)',
    rows,
    entryCount: order.length,
    renameCount: order.filter((t) => entries[t].action === 'rename').length,
    keepCount: order.filter((t) => entries[t].action === 'keep').length,
    protectedStringsNote: 'all 656 manifest symbol names are string-held keys; no string literal is ever renamed (enforced by verify L2 token-stream compare + tests/protected.test.mjs)',
    protectedIdentifiers: ['Gq', 'EnJV2g'],
    protectedIdentifiersNote: 'server patch anchors (gameplay/server patchBundle); must keep their names — enforced by tests/protected.test.mjs',
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ meta, order, entries }, null, 2) + '\n');
  console.log(`seed-rename-map: rows=${rows} entries=${meta.entryCount} rename=${meta.renameCount} keep=${meta.keepCount} -> ${path.relative(ROOT, OUT_PATH)}`);
  return { meta, order, entries };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedRenameMap().catch((err) => {
    console.error(`seed-rename-map.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

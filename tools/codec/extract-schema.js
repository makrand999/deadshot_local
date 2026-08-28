// Extracts the deadshot.io message schema from the deobfuscated game bundle
// (raw/VM9.deob.txt) and writes packages/protocol/schema.json.
//
// Sources in the bundle:
//   var I2=[0x1,0x1,0x2,0x2,0x4,0x4,0x8]  - byte size per type code
//   var GI=[...]                          - getter-name suffix per type code
//   var Ic={};Ic['val']=I5,...;var Id={};... - field-definition objects
//   var J2={};J2['msgName']=Obj,...       - message table, msgId = index+1
//
// The client reorders/renames the stats schema (yEE39Vc650) at load time
// (J5 rename table), which changes the wire layout; that is replicated here.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'raw', 'bundles', 'VM9.deob.txt');
const OUT = path.join(ROOT, 'packages', 'protocol', 'schema.json');

const bundle = fs.readFileSync(SRC, 'utf8');

function extractArrayLiteral(name) {
  const i = bundle.indexOf('var ' + name + '=[');
  if (i < 0) throw new Error('cannot find var ' + name + '=[ in bundle');
  let j = i + ('var ' + name).length;
  let depth = 0;
  let start = -1;
  for (; j < bundle.length; j++) {
    const ch = bundle[j];
    if (ch === '[') { if (depth === 0) start = j + 1; depth++; }
    else if (ch === ']') { depth--; if (depth === 0) break; }
  }
  if (start < 0) throw new Error('cannot parse var ' + name + ' literal');
  return bundle.slice(start, j).split(',').map((t) => {
    const s = t.trim();
    return s.length >= 2 && (s[0] === "'" || s[0] === '"') ? s.slice(1, -1) : s;
  });
}

const TYPE_SIZES = extractArrayLiteral('I2').map((t) => parseInt(t, 16));
const TYPE_NAMES = extractArrayLiteral('GI');
if (TYPE_NAMES.length !== 7) throw new Error('unexpected GI length ' + TYPE_NAMES.length);

const sIc = bundle.indexOf('var Ic={}');
const sJ2 = bundle.indexOf('var J2={}');
if (sIc < 0 || sJ2 < 0) throw new Error('cannot locate schema block in bundle');
const block = bundle.slice(sIc, sJ2);

// Parse the field-definition objects:  var X={};X['f1']=I5,X["f2"]=I7,...;var Y={};...
// Values may be type-code constants (I3..I9) or the empty-string string marker.
const objects = new Map();
const objRe = /var ([A-Za-z0-9_$]+)=\{\};(.*?)(?=;var [A-Za-z0-9_$]+=\{\};|$)/g;
let m;
while ((m = objRe.exec(block)) !== null) {
  const name = m[1];
  const body = m[2];
  const fields = [];
  const assignRe = /([A-Za-z0-9_$]+)\[(["'])(.*?)\2\]=([^,;]+)/g;
  let a;
  while ((a = assignRe.exec(body)) !== null) {
    const fieldName = a[3];
    const raw = a[4].trim();
    if (raw === "''" || raw === '""') {
      fields.push({ name: fieldName, type: null });
      continue;
    }
    if (!/^I[3-9]$/.test(raw)) {
      throw new Error('unexpected field value ' + raw + ' in object ' + name);
    }
    const code = parseInt(raw.slice(1), 16) - 3; // I3=0x0..I9=0x6
    if (code < 0 || code > 6) throw new Error('bad type code ' + raw + ' in ' + name);
    fields.push({ name: fieldName, type: code });
  }
  if (objects.has(name)) throw new Error('duplicate object ' + name);
  objects.set(name, fields);
}

// Parse the message table:  J2['name']=X or J2['name']={} in textual order.
const j2block = bundle.slice(sJ2);
const entryRe = /J2\[(["'])(.*?)\1\]=(\{[A-Za-z0-9_$]*\}|[A-Za-z0-9_$]+)/g;
const messages = [];
let e;
while ((e = entryRe.exec(j2block)) !== null) {
  const msgName = e[2];
  const ref = e[3];
  const isInline = ref === '{}';
  if (isInline) {
    messages.push({ msgId: messages.length + 1, name: msgName, rawFields: [] });
  } else {
    const fields = objects.get(ref);
    if (!fields) throw new Error('unknown schema ref ' + ref + ' for ' + msgName);
    messages.push({ msgId: messages.length + 1, name: msgName, rawFields: fields });
  }
  if (messages.length > 200) break;
}
if (messages.length !== 62) {
  console.error('WARNING: expected 62 messages, parsed ' + messages.length);
}

// Replicate the client's load-time rename/reorder of the stats schema:
//   J4={YlyjPgZsW:'kills',headshots:'headshots'}  applied to yEE39Vc650.
const J5 = { YlyjPgZsW: 'kills', headshots: 'headshots' };
function applyStatsReorder(msg) {
  const list = msg.rawFields;
  const orig = list.slice();
  for (const key of orig) {
    if (J5[key.name] === undefined) {
      list.splice(list.indexOf(key), 1);
      list.push(key);
      continue;
    }
    if (key.name === J5[key.name]) continue;
    key.name = J5[key.name];
    list.splice(list.indexOf(key), 1);
    list.push(key);
  }
}

const TYPE_CODE_TO_NAME = TYPE_NAMES;
for (const msg of messages) {
  if (msg.name === 'yEE39Vc650') applyStatsReorder(msg);
}

const out = {
  version: 1,
  messages: messages.map((msg) => {
    const fields = [];
    let hasString = false;
    for (const f of msg.rawFields) {
      if (f.type === null) {
        if (f.name === 'string') { hasString = true; continue; }
        throw new Error('string marker on unexpected field ' + f.name + ' in ' + msg.name);
      }
      fields.push({ name: f.name, type: TYPE_CODE_TO_NAME[f.type] });
    }
    return { msgId: msg.msgId, name: msg.name, fields, hasString };
  }),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('wrote ' + OUT);
console.log('messages: ' + out.messages.length);

// ---- sanity checks ----
const byId = new Map(out.messages.map((m) => [m.msgId, m]));
function checkId(id, name) {
  const m = byId.get(id);
  const ok = m && m.name === name;
  console.log((ok ? 'OK  ' : 'FAIL') + ' msgId ' + id + ' -> ' + (m ? m.name : 'MISSING') + (ok ? '' : ' (expected ' + name + ')'));
  return ok;
}
let ok = true;
ok &= checkId(36, 'N3OM6i9r83');
ok &= checkId(2, 'K11Co2hvi1l');
ok &= checkId(60, 'F79la8l54');
ok &= checkId(59, 'yEE39Vc650');

const ent = byId.get(2);
const wantTypes = [
  ['tdkZouYda', 'Uint8'], ['JoHdvmpcMvL', 'Float32'], ['uBHZYKAHa', 'Float32'],
  ['yxEKoSFAg', 'Float32'], ['TCHdFFAXmk', 'Uint8'], ['ibyXzJIMNf', 'Uint8'],
  ['YSmEAVINAh', 'Uint16'], ['wGiOzKcGlnH', 'Uint8'], ['hkhrYayXI', 'Uint8'],
  ['qXuHmlbSlxE', 'Uint8'],
];
const got = ent.fields.map((f) => [f.name, f.type]);
const typesOk = JSON.stringify(got) === JSON.stringify(wantTypes);
console.log((typesOk ? 'OK  ' : 'FAIL') + ' msgId 2 field types ' + JSON.stringify(got));
ok &= typesOk;

const empties = [11, 14, 15, 28, 29, 38, 41, 53, 58, 62].map((id) => byId.get(id));
const emptiesOk = empties.every((m) => m && m.fields.length === 0 && !m.hasString);
console.log((emptiesOk ? 'OK  ' : 'FAIL') + ' empty-schema messages present');

const stats = byId.get(59);
console.log('msgId 59 stats layout (after client reorder): ' +
  JSON.stringify(stats.fields.map((f) => f.name + ':' + f.type).join(',')));
console.log('msgId 60 join: fields=' + JSON.stringify(byId.get(60).fields) + ' hasString=' + byId.get(60).hasString);

if (!ok || out.messages.length !== 62) {
  console.error('SANITY CHECK FAILED');
  process.exit(1);
}
console.log('ALL SANITY CHECKS PASSED');

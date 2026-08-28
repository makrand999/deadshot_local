// v2 frame decoder: reads raw/live-capture2.json, decodes every WebSocket
// frame (base64 ASCII -> binary -> schema decode) and writes a readable dump
// to raw/frames-decoded.txt, plus prints anomaly + histogram analysis.
//
// Usage: node tools/decode-frames.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, decode, fromWireB64, transform, MESSAGES } from '../../packages/protocol/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const capture = JSON.parse(fs.readFileSync(path.join(ROOT, 'raw', 'captures', 'live-capture2.json'), 'utf8'));
const frames = capture.websockets;

loadSchema();

function fmtFields(fields) {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    const n = Number.isInteger(v) ? v : parseFloat(v.toFixed(6));
    parts.push(k + '=' + n);
  }
  return '{' + parts.join(',') + '}';
}

function fmtStr(s) {
  if (s === undefined) return '';
  return ' string="' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\x00-\x1f]/g, (c) => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')) + '"';
}

const lines = [];
const histogram = new Map(); // key: msgId|dir -> count
const anomalies = {
  truncated: 0,      // capture hex was cut at 160 chars
  leftover: 0,       // binary bytes not consumed by any message
  unknownMsgId: 0,   // decode stopped on an unknown msgId
  terminator: 0,     // frame contained a 0x0000 terminator
  noParse: 0,        // no message parsed at all
};
const noParseList = [];
const leftoverList = [];
const unknownList = [];
const msg62Frames = [];
const msg59Frames = [];

const TRUNC_CAP = 160; // capture-live.js sliced hex to 160 chars

for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  const wireText = Buffer.from(f.hex, 'hex').toString('latin1');
  const isTruncated = f.hex.length === TRUNC_CAP && f.len > TRUNC_CAP / 2;
  if (isTruncated) anomalies.truncated++;

  const bin = transform(fromWireB64(wireText), 0, 0);
  const msgs = decode(bin);

  const keys = new Set(msgs.map((m) => m.msgId));
  const histKey = (id) => id + '|' + f.dir;
  for (const m of msgs) histogram.set(histKey(m.msgId), (histogram.get(histKey(m.msgId)) || 0) + 1);

  let status = '';
  if (msgs.length === 0) {
    anomalies.noParse++;
    noParseList.push({ i, dir: f.dir, len: f.len, binlen: bin.length, wire: wireText.slice(0, 32), head: bin.toString('hex').slice(0, 40) });
    status = '  <no messages parsed>';
  } else {
    const lastOff = msgs[msgs.length - 1].offset;
    const leftover = bin.length - lastOff;
    if (leftover > 0) {
      anomalies.leftover++;
      leftoverList.push({ i, dir: f.dir, binlen: bin.length, lastOff, leftover, head: bin.slice(lastOff, bin.length).toString('hex') });
      status = '  <leftover ' + leftover + ' bytes: ' + bin.slice(lastOff).toString('hex') + '>';
    }
    if (msgs.some((m) => m.msgId === 0)) { anomalies.terminator++; status += '  <terminator>'; }
  }

  if (msgs.some((m) => m.msgId === 62)) msg62Frames.push({ i, dir: f.dir, len: f.len, binlen: bin.length, bin: bin, wire: wireText });
  if (msgs.some((m) => m.msgId === 59)) msg59Frames.push({ i, dir: f.dir, len: f.len, binlen: bin.length, bin: bin });

  const msgText = msgs.map((m) =>
    'msgId=' + String(m.msgId).padStart(2, '0') + ' name=' + m.name +
    ' fields=' + fmtFields(m.fields) + fmtStr(m.string)).join(' | ');

  lines.push((f.dir === 'S' ? 'S' : 'R') + ' b64len=' + String(f.len).padStart(5, ' ') +
    ' binlen=' + String(bin.length).padStart(4, ' ') +
    (isTruncated ? ' [capture-truncated]' : '') +
    (msgs.length === 0 ? '' : ' msgs=' + msgs.length) + ' :: ' + msgText + status);
}

fs.writeFileSync(path.join(ROOT, 'raw', 'analysis', 'frames-decoded.txt'), lines.join('\n') + '\n');
console.log('wrote raw/frames-decoded.txt (' + lines.length + ' frames)');

// ---------------- anomaly report ----------------
console.log('\n=========== ANOMALY REPORT ===========');
console.log('frames total          : ' + frames.length);
console.log('capture-truncated     : ' + anomalies.truncated);
console.log('no message parsed     : ' + anomalies.noParse);
console.log('leftover bytes        : ' + anomalies.leftover);
console.log('terminator (0x0000)   : ' + anomalies.terminator);

if (noParseList.length) {
  console.log('\n-- frames with no parseable messages (matchmaking/msgpack frames):');
  for (const n of noParseList) console.log('  #' + n.i + ' ' + n.dir + ' b64=' + n.len + ' bin=' + n.binlen + ' wire="' + n.wire + '" hex=' + n.head);
}
if (leftoverList.length) {
  console.log('\n-- frames with leftover bytes:');
  for (const l of leftoverList) console.log('  #' + l.i + ' ' + l.dir + ' bin=' + l.binlen + ' consumed=' + l.lastOff + ' leftover=' + l.leftover + ' tail=' + l.head + (l.leftover >= 2 ? ' (as u16: ' + parseInt(l.head.slice(0, 4), 16) + ')' : ''));
}

console.log('\n-- msgId 62 frames (Ns010DV33, empty schema):');
for (const m of msg62Frames) {
  const tail = m.bin.slice(2);
  console.log('  #' + m.i + ' ' + m.dir + ' b64len=' + m.len + ' binlen=' + m.binlen);
  console.log('    raw binary : ' + m.bin.toString('hex'));
  console.log('    msgId=62 + ' + tail.length + ' bytes tail: ' + tail.toString('hex'));
  const dv = new DataView(m.bin.buffer, m.bin.byteOffset, m.bin.byteLength);
  console.log('    tail as u32 BE: ' + Array.from({ length: 8 }, (_, k) => '0x' + dv.getUint32(2 + k * 4, false).toString(16)).join(', '));
  console.log('    tail as f32 BE: ' + Array.from({ length: 8 }, (_, k) => dv.getFloat32(2 + k * 4, false).toFixed(6)).join(', '));
  const b64 = m.bin.toString('base64');
  console.log('    re-base64     : ' + b64 + (b64 === m.wire ? '  (matches capture)' : '  (DIFFERS from capture wire!)'));
}

console.log('\n-- msgId 59 frames (yEE39Vc650, stats): ' + msg59Frames.length);
for (const m of msg59Frames) {
  const msgs = decode(m.bin);
  const offs = msgs.map((x) => x.msgId);
  console.log('  #' + m.i + ' ' + m.dir + ' b64len=' + m.len + ' binlen=' + m.binlen + ' truncated=' + (m.len > 80) +
    ' -> messages parsed from available bytes: ' + offs.join(','));
}

// ---------------- histogram ----------------
console.log('\n=========== HISTOGRAM (msgId|dir count) ===========');
const byId = {};
for (const [k, v] of histogram) {
  const [id, dir] = k.split('|');
  byId[id] = byId[id] || { R: 0, S: 0 };
  byId[id][dir] += v;
}
const sorted = Object.entries(byId).sort((a, b) => (b[1].R + b[1].S) - (a[1].R + a[1].S));
const nameOf = (id) => {
  const m = MESSAGES.byId.get(parseInt(id, 10));
  return m ? m.name : '???';
};
for (const [id, c] of sorted) {
  const pad = String(id).padStart(3);
  console.log('  msgId ' + pad + ' ' + nameOf(id).padEnd(14) + ' R=' + String(c.R).padStart(5) + '  S=' + String(c.S).padStart(3) + '  total=' + (c.R + c.S));
}
const totals = frames.reduce((a, f) => { a[f.dir]++; return a; }, { R: 0, S: 0 });
console.log('frames by dir: R=' + totals.R + ' S=' + totals.S + ' (messages decoded: ' + [...histogram.values()].reduce((a, b) => a + b, 0) + ')');

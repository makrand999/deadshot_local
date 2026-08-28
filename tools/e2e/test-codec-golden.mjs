// Golden test: for every frame in raw/live-capture2.json, base64-decode the
// wire ASCII text, decode() the binary, re-encode() every message and compare
// the concatenation byte-for-byte against the original binary (which carries
// no 0x0000 terminator).
//
// The capture tool sliced frame hex at 160 chars (80 ASCII chars = 60 binary
// bytes), so frames longer than 80 ASCII chars are truncated and cannot be
// verified; they are reported separately from true codec failures.
//
// Usage: node tools/test-codec-golden.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, decode, encode, fromWireB64, transform } from '../../packages/protocol/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const capture = JSON.parse(fs.readFileSync(path.join(ROOT, 'raw', 'captures', 'live-capture2.json'), 'utf8'));
const frames = capture.websockets;

loadSchema();

let pass = 0;
const failures = [];
let truncated = 0;
let noParse = 0;
const noParseList = [];

for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  const wireText = Buffer.from(f.hex, 'hex').toString('latin1');
  const truncatedCapture = f.hex.length === 160 && f.len > 80;
  if (truncatedCapture) { truncated++; continue; }

  const bin = transform(fromWireB64(wireText), 0, 0);
  const msgs = decode(bin);
  if (msgs.length === 0) {
    noParse++;
    noParseList.push({ i, dir: f.dir, len: f.len, binlen: bin.length, wire: wireText.slice(0, 24), head: bin.toString('hex').slice(0, 24) });
    continue;
  }

  let reenc;
  try {
    reenc = Buffer.concat(msgs.map((m) => encode(m.name, m)));
  } catch (err) {
    failures.push({ i, dir: f.dir, reason: 'encode threw: ' + err.message, detail: msgs.map((m) => m.msgId + ':' + m.name).join(',') });
    continue;
  }

  if (bin.length === reenc.length && bin.equals(reenc)) {
    pass++;
  } else {
    let reason = 'bytes differ';
    if (bin.length !== reenc.length) reason = 'length differ orig=' + bin.length + ' reenc=' + reenc.length;
    else {
      let first = -1;
      for (let k = 0; k < bin.length; k++) if (bin[k] !== reenc[k]) { first = k; break; }
      reason = 'first diff at byte ' + first;
    }
    failures.push({
      i, dir: f.dir, len: f.len, binlen: bin.length, reason,
      msgs: msgs.map((m) => m.msgId + ':' + m.name + (m.string !== undefined ? ':str' : '')),
      wire: wireText.slice(0, 24),
    });
  }
}

console.log('total frames        : ' + frames.length);
console.log('capture-truncated   : ' + truncated + '   (cannot verify — hex cut at 80 ASCII chars)');
console.log('no parse (other prot): ' + noParse + '   (matchmaking/msgpack frames, not game socket)');
console.log('GOLDEN PASS         : ' + pass);
console.log('GOLDEN FAIL         : ' + failures.length);

if (noParseList.length) {
  console.log('\nno-parse frames:');
  for (const n of noParseList) console.log('  #' + n.i + ' ' + n.dir + ' len=' + n.len + ' bin=' + n.binlen + ' wire="' + n.wire + '" head=' + n.head);
}
if (failures.length) {
  console.log('\nfailed frames:');
  for (const fr of failures) {
    console.log('  #' + fr.i + ' ' + fr.dir + ' len=' + fr.len + ' bin=' + fr.binlen + ' ' + fr.reason +
      ' msgs=' + JSON.stringify(fr.msgs) + ' wire="' + fr.wire + '"');
    if (fr.detail) console.log('    ' + fr.detail);
  }
}
console.log('\nverification: original frames carry no 0x0000 terminator; re-encode concatenates messages only.');

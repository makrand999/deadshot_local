// Decode raw/real-spawn.json (real deadshot.io capture) into a readable dump.
// Frames are base64-ASCII text; the game-socket message sequence may be
// transformed with the keys from msg 36 (N3OM6i9r83).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, decode, transform } from '../../packages/protocol/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const capture = JSON.parse(fs.readFileSync(path.join(ROOT, 'raw', 'captures', 'real-spawn.json'), 'utf8'));
loadSchema();

const frames = capture.websockets;

function decodeMsgSeq(bin) {
  try { return decode(bin); } catch (e) { return [{ msgId: -1, name: 'err:' + e.message }]; }
}

let xorKey = 0;
let subKey = 0;
let keysKnown = false;
const hist = new Map();
const lines = [];
const fmtFields = (f) => Object.entries(f).map(([k, v]) => k + '=' + v).join(',');
let state = 'handshake';
const events = { msg21: 0, msg29: 0, msg20: 0, msg36: null, firstSpawnBatch: null };

for (let i = 0; i < frames.length; i++) {
  const f = frames[i];
  let bin;
  try { bin = Buffer.from(f.hex, 'hex').toString('utf8'); } catch { continue; }
  bin = Buffer.from(bin.trim(), 'base64');
  const out = transform(Buffer.from(bin), xorKey, subKey);
  try {
    const msgs = decodeMsgSeq(out);
    const parts = [];
    for (const m of msgs) {
      const key = m.msgId + '|' + f.dir;
      hist.set(key, (hist.get(key) || 0) + 1);
      let s = 'msgId=' + m.msgId + ' name=' + m.name;
      if (Object.keys(m.fields || {}).length) s += ' {' + fmtFields(m.fields) + '}';
      if (m.string !== undefined) s += ' str=' + JSON.stringify(m.string).slice(0, 60);
      parts.push(s);
      if (m.msgId === 36 && f.dir === 'R') {
        xorKey = m.fields.fXfKmXLLuf || 0;
        subKey = m.fields.DVhVGRcxjKL || 0;
        keysKnown = true;
        events.msg36 = { xorKey, subKey };
      }
      if (m.msgId === 21 && f.dir === 'S') events.msg21++;
      if (m.msgId === 29 && f.dir === 'R') events.msg29++;
      if (m.msgId === 20 && f.dir === 'R') events.msg20++;
      if (m.msgId === 33 && !events.firstSpawnBatch) events.firstSpawnBatch = i;
    }
    if (msgs.length) lines.push(i + ' ' + f.dir + ' len=' + f.len + (keysKnown ? ' [T]' : '    ') + ' :: ' + parts.join(' | '));
    else lines.push(i + ' ' + f.dir + ' len=' + f.len + ' :: <no messages>');
  } catch (e) {
    lines.push(i + ' ' + f.dir + ' len=' + f.len + ' :: <err ' + e.message + '>');
  }
}

fs.writeFileSync(path.join(ROOT, 'raw', 'analysis', 'real-spawn-decoded.txt'), lines.join('\n'));
console.log('frames:', frames.length, '| keys from msg36:', events.msg36, '| msg21 sent:', events.msg21, '| msg29 recv:', events.msg29, '| msg20 recv:', events.msg20);
console.log('histogram:');
for (const [k, v] of [...hist.entries()].sort((a, b) => b[1] - a[1])) console.log('  ' + k + ' = ' + v);
const i21 = frames.findIndex((f, i) => f.dir === 'S' && String(f.hex).includes(''));

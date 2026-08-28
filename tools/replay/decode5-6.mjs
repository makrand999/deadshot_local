import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn-clientA.json', 'utf8'));
const vals = { 5: [], 6: [], 23: [] };
let n = 0;
for (const f of d.websockets) {
  if (f.dir !== 'R') continue;
  let b;
  try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
  try {
    for (const m of decode(b)) {
      if (vals[m.msgId]) {
        vals[m.msgId].push(m.fields);
        if (n++ > 200) break;
      }
    }
  } catch {}
}
for (const k of [5, 6, 23]) {
  console.log('msg' + k + ' samples:', JSON.stringify(vals[k].slice(0, 12)));
}

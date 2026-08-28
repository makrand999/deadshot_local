import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn-clientA.json', 'utf8'));
const seq = [];
for (const f of d.websockets) {
  if (f.dir !== 'R') continue;
  let b;
  try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
  try { for (const m of decode(b)) if ([18, 20, 17, 29, 47, 25, 22, 7, 2].includes(m.msgId)) seq.push(m.msgId + (m.msgId === 18 ? ':' + (m.fields.JoHdvmpcMvL?.toFixed(1)) + ',' + (m.fields.uBHZYKAHa?.toFixed(1)) + ',' + (m.fields.yxEKoSFAg?.toFixed(1)) : (m.msgId === 7 ? ':id=' + m.fields.tdkZouYda : ''))); } catch {}
}
console.log(seq.join(' '));

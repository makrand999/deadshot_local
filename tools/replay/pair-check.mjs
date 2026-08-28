import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn.json', 'utf8'));
const seq = [];
for (const f of d.websockets) {
  if (f.dir !== 'R') continue;
  let b;
  try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
  try { for (const m of decode(b)) if (m.msgId === 22 || m.msgId === 44 || m.msgId === 3) seq.push(m.msgId); } catch {}
}
console.log('22/44/3 sequence:', seq.join(','));

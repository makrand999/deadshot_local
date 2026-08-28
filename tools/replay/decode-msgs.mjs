import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn.json', 'utf8'));
for (const f of d.websockets) {
  let bin;
  try { bin = Buffer.from(f.hex, 'hex'); bin = bin[0] <= 1 ? bin : fromWireB64(bin.toString('utf8')); } catch { continue; }
  try {
    const msgs = decode(bin);
    for (const m of msgs) {
      if (m.msgId === 42 || m.msgId === 7 || m.msgId === 32) {
        console.log(f.dir, 'msgId', m.msgId, JSON.stringify(m.fields));
      }
    }
  } catch {}
}

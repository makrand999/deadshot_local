import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn-clientA.json', 'utf8'));
const log = [];
let sawDeath = false;
let after = 0;
for (const f of d.websockets) {
  if (f.dir !== 'R') continue;
  let b;
  try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
  try {
    for (const m of decode(b)) {
      if (m.msgId === 2) {
        log.push(`2 id=${m.fields.tdkZouYda} anim=0x${m.fields.YSmEAVINAh.toString(16).padStart(4,'0')} hp=${m.fields.hkhrYAYXI} y=${m.fields.uBHZYKAHa.toFixed(2)}`);
      } else if (m.msgId === 20) {
        log.push(`MSG20 death id=${m.fields.id}`);
        sawDeath = true; after = 0;
      } else if (m.msgId === 7) {
        log.push(`MSG7 despawn id=${m.fields.tdkZouYda}`);
      } else if (m.msgId === 18) {
        log.push(`18 FULLSTATE y=${m.fields.uBHZYKAHa?.toFixed?.(2)}`);
      } else if (m.msgId === 25) {
        log.push('25 killfeed');
      } else if (m.msgId === 29) {
        log.push('29 spawn-trigger');
      }
    }
  } catch {}
}
// print the 60 lines around the first MSG20
const idx = log.findIndex((l) => l.startsWith('MSG20'));
for (let i = Math.max(0, idx - 25); i < Math.min(log.length, idx + 35); i++) console.log(log[i]);

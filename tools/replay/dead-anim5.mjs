import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn-clientA.json', 'utf8'));
// victim = the id of msg20's killer (msg20 id = killer id)
const events = [];
for (const f of d.websockets) {
  if (f.dir !== 'R') continue;
  let b;
  try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
  try {
    for (const m of decode(b)) {
      if (m.msgId === 20) events.push(['msg20', m.fields.id]);
      else if (m.msgId === 2) events.push(['s2', m.fields.tdkZouYda, m.fields.YSmEAVINAh]);
      else if (m.msgId === 18) events.push(['s18', m.fields.uBHZYKAHa]);
    }
  } catch {}
}
const deathIdx = events.findIndex((e) => e[0] === 'msg20');
console.log('events around the death:');
for (let i = Math.max(0, deathIdx - 6); i < Math.min(events.length, deathIdx + 40); i++) {
  const e = events[i];
  console.log(e[0] === 's2' ? `  id=${e[1]} anim=0x${e[2].toString(16).padStart(4, '0')}` : `  ${e.join(' ')}`);
}

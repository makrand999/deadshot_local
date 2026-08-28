import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-spawn-clientA.json', 'utf8'));
const seq = [];  // flat list of {id, anim, hp} for all msg2
const events = [];
for (const f of d.websockets) {
  if (f.dir !== 'R') continue;
  let b;
  try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
  try {
    for (const m of decode(b)) {
      if (m.msgId === 2) seq.push({ id: m.fields.tdkZouYda, anim: m.fields.YSmEAVINAh, hp: m.fields.hkhrYAYXI });
      else if (m.msgId === 20) events.push(['msg20', m.fields.id]);
      else if (m.msgId === 7) events.push(['msg7', m.fields.tdkZouYda]);
    }
  } catch {}
}
// per-id death windows
const byId = {};
for (const s of seq) {
  (byId[s.id] = byId[s.id] || []).push(s);
}
for (const [id, list] of Object.entries(byId)) {
  for (let i = 1; i < list.length; i++) {
    if (list[i - 1].hp > 0 && list[i].hp === 0) {
      console.log(`DEATH id=${id}:`);
      for (let j = Math.max(0, i - 5); j < Math.min(list.length, i + 10); j++) {
        console.log(`  anim=0x${list[j].anim.toString(16).padStart(4, '0')} hp=${list[j].hp}`);
      }
      console.log('  ---');
    }
  }
}
console.log('events:', events.map((e) => e.join(':')).join(' | '));

import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const schema = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/gameplay/packages/protocol/schema.json', 'utf8'));
const byId = {};
for (const m of schema.messages) byId[m.msgId] = m.name;
const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/real-duo.json', 'utf8'));
const cnt = {};
const seq = [];
for (const [name, c] of Object.entries(d.clients)) {
  for (const f of c.frames || []) {
    let b;
    try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
    try {
      for (const m of decode(b)) {
        const key = (f.dir || 'R') + ':' + m.msgId;
        cnt[key] = (cnt[key] || 0) + 1;
        if (!seq.includes(m.msgId)) seq.push(m.msgId);
      }
    } catch {}
  }
}
console.log('message types seen:', seq.sort((a,b)=>a-b).join(','));
for (const k of Object.keys(cnt).sort((a, b) => a.localeCompare(b))) {
  const [dir, mid] = k.split(':');
  const label = dir === 'R' ? 'S->C' : 'C->S';
  console.log(label + '  msgId ' + mid.padStart(3) + ' ' + (byId[mid] || '?').padEnd(15) + ' x' + cnt[k]);
}

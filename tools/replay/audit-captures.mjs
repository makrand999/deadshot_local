import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const schema = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/gameplay/packages/protocol/schema.json', 'utf8'));
const byId = {};
for (const m of schema.messages) byId[m.msgId] = m.name;
const files = process.argv.slice(2);
const cnt = {};
for (const file of files) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const frames = d.websockets || d;
  for (const f of frames) {
    if (!f || typeof f.hex !== 'string') continue;
    let first;
    try { first = Buffer.from(f.hex, 'hex'); first = first[0] <= 1 ? first : fromWireB64(first.toString('utf8')); }
    catch { continue; }
    try {
      const msgs = decode(first);
      for (const m of msgs) {
        const key = (f.dir || 'R') + ':' + m.msgId;
        cnt[key] = (cnt[key] || 0) + 1;
      }
    } catch {}
  }
}
for (const k of Object.keys(cnt).sort((a,b) => a.localeCompare(b))) {
  const [dir, mid] = k.split(':');
  const label = dir === 'R' ? 'S->C' : 'C->S';
  console.log(label + '  msgId ' + mid.padStart(3) + ' ' + (byId[mid] || '?').padEnd(15) + ' x' + cnt[k]);
}

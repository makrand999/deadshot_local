import fs from 'node:fs';
import { decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
for (const file of ['real-spawn-clientA.json', 'real-spawn-clientB.json']) {
  const d = JSON.parse(fs.readFileSync('/home/max/Projects/deadshot/raw/captures/' + file, 'utf8'));
  const out = [];
  for (const f of d.websockets) {
    if (f.dir !== 'R') continue;
    let b;
    try { b = Buffer.from(f.hex, 'hex'); b = b[0] <= 1 ? b : fromWireB64(b.toString('utf8')); } catch { continue; }
    try {
      for (const m of decode(b)) {
        if (m.msgId === 42) out.push(JSON.stringify(m.fields));
        if (m.msgId === 32) out.push('mode h=' + m.fields.h);
      }
    } catch {}
  }
  console.log(file + ':', out.join(' | '));
}

import WebSocket from '/home/max/Projects/deadshot/gameplay/node_modules/ws/index.js';
import { encode, decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';

const ws = new WebSocket('ws://127.0.0.1:8080/ws');
await new Promise((r) => ws.on('open', r));
const wire = (b) => { const x = Buffer.from(b); return x[0] <= 1 ? x : fromWireB64(x.toString('utf8')); };
const times = { 2: [], 4: [], 24: [] };
let sent = 0;
const done = () => sent === 4;
ws.on('message', (d) => {
  try {
    for (const m of decode(wire(d))) {
      if (times[m.msgId]) {
        times[m.msgId].push(Date.now());
        if (m.msgId === 2) { sent++; if (sent <= 4) ws.send(encode('FRF6r51VY32', { val: 0, x: 64, y: 254, rBEdfQOuYkz: sent })); }
      }
    }
  } catch {}
});
setTimeout(() => {
  const avg = (arr) => arr.length > 1 ? Math.round((arr[arr.length-1] - arr[0]) / (arr.length - 1)) : -1;
  console.log('state msg2 count:', times[2].length, 'avg interval(ms):', avg(times[2]));
  console.log('clock msg4 count:', times[4].length, 'avg interval(ms):', avg(times[4]));
  console.log('score msg24 count:', times[24].length, 'avg interval(ms):', avg(times[24]));
  process.exit(0);
}, 3000);

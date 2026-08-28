import WebSocket from '/home/max/Projects/deadshot/gameplay/node_modules/ws/index.js';
import { encode, decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';

const URL = 'ws://127.0.0.1:8080/ws';

function wire(buf) {
  const b = Buffer.from(buf);
  return b[0] <= 1 ? b : fromWireB64(b.toString('utf8'));
}
function recvUntil(ws, pred, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const msgs = [];
    const t = setTimeout(() => { cleanup(); reject(new Error('timeout; saw ' + JSON.stringify(msgs.map(m => m.msgId)))); }, timeoutMs);
    const cleanup = () => { ws.off('message', onMsg); clearTimeout(t); };
    const onMsg = (data) => {
      try {
        for (const m of decode(wire(data))) {
          msgs.push(m);
          if (pred(m)) { cleanup(); resolve(msgs); return; }
        }
      } catch {}
    };
    ws.on('message', onMsg);
    ws.on('close', (code, reason) => { cleanup(); reject(new Error('closed ' + code + ' ' + reason + '; saw ' + JSON.stringify(msgs.map(m => m.msgId)))); });
  });
}

async function run(label, makeVal, expectClose) {
  const ws = new WebSocket(URL);
  const saw = [];
  ws.on('close', (c, r) => saw.push(['close', c, String(r)]));
  ws.on('message', (d) => {
    try { for (const m of decode(wire(d))) saw.push(['msg', m.msgId]); } catch {}
  });
  await new Promise((r) => ws.on('open', r));
  const got37 = await recvUntil(ws, (m) => m.msgId === 37, 5000);
  const challenge = got37.find(m => m.msgId === 37).fields.val;
  const val = makeVal(challenge);
  ws.send(encode('F79la8l54', { string: 'AAAA' }));
  ws.send(encode('o746s7cvb9', { val, lpm: -1, priv: 0, pmap: -1, ituyDAEpKW: 1, PSPGZlgWAcZ: 0, YsgdCDVtFmu: 0, zqEWySNDO: 1, string: 'test' }));
  if (expectClose) {
    await new Promise((r) => setTimeout(r, 1500));
    const closed = saw.some((x) => x[0] === 'close' && x[1] === 4400);
    console.log(`[${label}] challenge=${challenge} val=${val} -> ${closed ? 'CLOSED 4400 OK' : 'NOT CLOSED (FAIL): ' + JSON.stringify(saw)}`);
  } else {
    ws.send(encode('O4s303G144', { sgr: 0.3, rank: 0.3, ranksgr: 0.3 }));
    try {
      await recvUntil(ws, (m) => m.msgId === 61, 6000);
      ws.send(Buffer.from([0x00, 0x3e, ...Buffer.alloc(32, 7)]));
      await new Promise((r) => setTimeout(r, 700));
      const flow = saw.filter(x => x[0] === 'msg').map(x => x[1]);
      const ok = flow.includes(36) || flow.includes(3);
      console.log(`[${label}] challenge=${challenge} val=${val} -> msg61=YES flow=[${flow.join(',')}] ${ok ? 'AUTH+SPAWN OK' : 'MISSING SPAWN'}`);
    } catch (e) {
      console.log(`[${label}] FAIL: ${e.message}`);
    }
  }
  ws.close();
  await new Promise((r) => setTimeout(r, 300));
}

const wrong = Math.floor(Math.random() * 0x1C9C380);
await run('wrong-val', () => wrong, true);
await run('right-val', (c) => (c * 2 + 0x178C4E) % 0x1C9C380, false);
process.exit(0);

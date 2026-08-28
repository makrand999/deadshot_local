import WebSocket from '/home/max/Projects/deadshot/gameplay/node_modules/ws/index.js';
import { pack, unpack } from '/home/max/Projects/deadshot/gameplay/server/src/msgpack.mjs';
import { encode, decode, fromWireB64 } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
const MM = 'ws://127.0.0.1:8081/ws';
const wire = (b) => { const x = Buffer.from(b); return x[0] <= 1 ? x : fromWireB64(x.toString('utf8')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function mmConnect() {
  const ws = new WebSocket(MM);
  await new Promise((r) => ws.on('open', r));
  await new Promise((r) => ws.once('message', r));
  ws.recv = () => new Promise((r) => ws.once('message', (d) => r(unpack(Buffer.from(d)).value)));
  ws.sendP = (o) => ws.send(Buffer.from(pack([o])));
  return ws;
}
async function gsConnect(url) {
  const ws = new WebSocket(url);
  await new Promise((r) => ws.on('open', r));
  const seen = [];
  ws.on('message', (d) => { try { for (const m of decode(wire(d))) seen.push(m); } catch {} });
  await sleep(100);
  return { ws, seen };
}
async function gsHandshake(g) {
  for (let i = 0; i < 50 && !g.seen.some((m) => m.msgId === 37); i++) await sleep(100);
  const ch = g.seen.find((m) => m.msgId === 37).fields.val;
  g.ws.send(encode('F79la8l54', { string: 'AAAA' }));
  g.ws.send(encode('o746s7cvb9', { val: (ch * 2 + 0x178C4E) % 0x1C9C380, lpm: -1, priv: 0, pmap: -1, ituyDAEpKW: 1, PSPGZlgWAcZ: 0, YsgdCDVtFmu: 0, zqEWySNDO: 1, string: '' }));
  g.ws.send(encode('O4s303G144', { sgr: 0.3, rank: 0.3, ranksgr: 0.3 }));
  for (let i = 0; i < 80 && !g.seen.some((m) => m.msgId === 61); i++) await sleep(100);
  g.ws.send(Buffer.from([0x00, 0x3e, ...Buffer.alloc(32, 7)]));
  for (let i = 0; i < 80 && !g.seen.some((m) => m.msgId === 36); i++) await sleep(100);
}
async function classSelect(g, cls) {
  g.ws.send(encode('B20L372s8', { v: 100, eXABYtRfN: cls }));
  for (let i = 0; i < 50 && !g.seen.some((m) => m.msgId === 18); i++) await sleep(100);
  g.ws.send(encode('bWEt7LWg79Z', { loEhMkBVEme: 0 }));
  for (let i = 0; i < 50 && !g.seen.some((m) => m.msgId === 29); i++) await sleep(100);
}
const mmA = await mmConnect();
mmA.sendP({ type: 'create' });
const createResp = await mmA.recv();
const code = createResp.find((p) => p.t === 'prtyid').id;
const mmB = await mmConnect();
mmB.sendP({ type: 'join', id: code });
await mmB.recv();
mmA.sendP({ type: 'ready' });
mmB.sendP({ type: 'ready' });
let connectA = null, connectB = null;
for (let i = 0; i < 50; i++) {
  const pa = await mmA.recv(); const pb = await mmB.recv();
  if (pa.find((p) => p.t === 'connect')) connectA = pa.find((p) => p.t === 'connect');
  if (pb.find((p) => p.t === 'connect')) connectB = pb.find((p) => p.t === 'connect');
  if (connectA && connectB) break;
}
const tok = connectA.r;
const url = 'ws://127.0.0.1:8080/ws?r=' + tok;
const gA = await gsConnect(url);
const gB = await gsConnect(url);
await gsHandshake(gA); await gsHandshake(gB);
await classSelect(gA, 0); await classSelect(gB, 0);
const idA = gA.seen.find((m) => m.msgId === 3).fields.tdkZouYda;
const idB = gB.seen.find((m) => m.msgId === 3).fields.tdkZouYda;
gA.ws.send(encode('BVaxA5RXAZ', { x: 0, y: 2.4, z: 0 }));
gB.ws.send(encode('BVaxA5RXAZ', { x: 10, y: 2.4, z: 0 }));
await sleep(400);
// kill B with 5 headshots
for (let i = 0; i < 5; i++) {
  gA.ws.send(encode('e479Jk50P', { pMwSuGipfE: 1, VqpNEuOqqCX: i, JoHdvmpcMvL: 0, uBHZYKAHa: Math.PI, AHPhtLFTi: 10, mGOwFesuTt: 2.1, MHnEcbTxpbz: 0 }));
  await sleep(250);
}
await sleep(300);
// count the victim's (B's) msg2 states as seen by A over the next 2s
const t0 = Date.now();
let count60 = 0, countAfter = 0;
const victimStates = [];
while (Date.now() - t0 < 2000) {
  await sleep(100);
  const newStates = gA.seen.filter((m) => m.msgId === 2 && m.fields.tdkZouYda === idB);
  victimStates.length = 0;
  victimStates.push(...newStates.slice(-10).map((m) => '0x' + m.fields.YSmEAVINAh.toString(16).padStart(4, '0')));
}
const all = gA.seen.filter((m) => m.msgId === 2 && m.fields.tdkZouYda === idB);
const firstDead = all.findIndex((m) => m.fields.YSmEAVINAh === 0x60);
const statesAfterDead = all.length - firstDead - 1;
console.log('victim anim states seen after death (first 0x60 at idx ' + firstDead + '):');
for (let i = firstDead; i < Math.min(all.length, firstDead + 14); i++) console.log('  0x' + all[i].fields.YSmEAVINAh.toString(16).padStart(4, '0'));
console.log('total victim states after the death anim:', statesAfterDead);
console.log(statesAfterDead <= 12 ? 'DEAD-STATE CUTOFF OK (corpse states stop ~1s)' : 'CUTOFF FAILED (corpse keeps broadcasting)');
process.exit(0);

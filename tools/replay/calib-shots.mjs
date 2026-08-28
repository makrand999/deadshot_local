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
  ws.on('message', (d) => {
    try { for (const m of decode(wire(d))) seen.push(m); } catch {}
  });
  await sleep(100);
  return { ws, seen };
}
async function gsHandshake(g, challengeI0) {
  // wait msg37
  for (let i = 0; i < 50 && !g.seen.some((m) => m.msgId === 37); i++) await sleep(100);
  const ch = g.seen.find((m) => m.msgId === 37).fields.val;
  g.ws.send(encode('F79la8l54', { string: 'AAAA' }));
  g.ws.send(encode('o746s7cvb9', { val: (ch * 2 + 0x178C4E) % 0x1C9C380, lpm: -1, priv: 0, pmap: -1, ituyDAEpKW: 1, PSPGZlgWAcZ: 0, YsgdCDVtFmu: 0, zqEWySNDO: 1, string: '' }));
  g.ws.send(encode('O4s303G144', { sgr: 0.3, rank: 0.3, ranksgr: 0.3 }));
  for (let i = 0; i < 80 && !g.seen.some((m) => m.msgId === 61); i++) await sleep(100);
  g.ws.send(Buffer.from([0x00, 0x3e, ...Buffer.alloc(32, 7)]));
  for (let i = 0; i < 80 && !g.seen.some((m) => m.msgId === 36); i++) await sleep(100);
}
async function classSelect(g, cls = 0) {
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
await gsHandshake(gA);
await gsHandshake(gB);
await classSelect(gA, 0);
await classSelect(gB, 0);
const idA = gA.seen.find((m) => m.msgId === 3).fields.tdkZouYda;
const idB = gB.seen.find((m) => m.msgId === 3).fields.tdkZouYda;
console.log('ids:', idA, idB);

// positions: reported y = the EYE (~2.4 above the floor)
gA.ws.send(encode('BVaxA5RXAZ', { x: 0, y: 2.4, z: 0 }));
gB.ws.send(encode('BVaxA5RXAZ', { x: 10, y: 2.4, z: 0 }));
await sleep(400);

function shoot(rayX, rayY, rayZ) {
  const before = gB.seen.length;
  gA.ws.send(encode('e479Jk50P', { pMwSuGipfE: 1, VqpNEuOqqCX: 1, JoHdvmpcMvL: 0, uBHZYKAHa: Math.PI, AHPhtLFTi: rayX, mGOwFesuTt: rayY, MHnEcbTxpbz: rayZ }));
  return before;
}
const cases = [
  ['chest  (eye-0.75=1.65)', 10, 1.65, 0],
  ['head   (eye-0.3=2.1)', 10, 2.1, 0],
  ['head   (eye-0.3=2.1) x2', 10, 2.1, 0],
  ['head   (eye-0.3=2.1) x3', 10, 2.1, 0],
  ['head   (eye-0.3=2.1) x4', 10, 2.1, 0],
  ['head   (eye-0.3=2.1) x5', 10, 2.1, 0],
  ['chest  x2', 10, 1.65, 0],
  ['chest  x3', 10, 1.65, 0],
  ['legs   (eye-1.7=0.7)', 10, 0.7, 0],
  ['legs   (eye-2.05=0.35)', 10, 0.35, 0],
  ['above-head (2.6)', 10, 2.6, 0],
  ['side 0.5m @chest', 10, 1.65, 0.5],
];
for (const [name, x, y, z] of cases) {
  if (gB.seen.some((m) => m.msgId === 25)) {
    const n29 = gB.seen.filter((m) => m.msgId === 29).length;
    const n7 = gB.seen.filter((m) => m.msgId === 7).length;
    for (let i = 0; i < 60 && gB.seen.filter((m) => m.msgId === 29).length <= n29; i++) await sleep(100);
    const got7 = gB.seen.filter((m) => m.msgId === 7).length > n7;
    console.log('despawn-before-respawn:', got7 ? 'OK (msg7 received)' : 'FAIL (no msg7)');
    gB.ws.send(encode('BVaxA5RXAZ', { x: 10, y: 2.4, z: 0 })); // re-report position
    await sleep(400);
  }
  const before = shoot(x, y, z);
  await sleep(250);
  const newMsgs = gB.seen.slice(before);
  const hit = newMsgs.some((m) => m.msgId === 13) || newMsgs.some((m) => m.msgId === 10);
  const killBanner = gA.seen.filter((m) => m.msgId === 23).length;
  console.log(`${hit ? 'HIT ' : 'MISS'} ${name}  (kill-banners so far: ${killBanner})`);
}
process.exit(0);

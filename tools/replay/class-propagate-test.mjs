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
// both spawn with default type 0
await classSelect(gA, 0); await classSelect(gB, 0);
// clear seen, then A picks class 1 (AR)
gA.seen.length = 0; gB.seen.length = 0;
await classSelect(gA, 1);
await sleep(300);
const a22toB = gB.seen.filter((m) => m.msgId === 22);
const a44toB = gB.seen.filter((m) => m.msgId === 44);
console.log('B received msg22:', a22toB.length, 'msg44:', a44toB.length);
for (const m of a22toB) console.log('  B saw msg22:', JSON.stringify(m.fields), '(expect id=1, type=1 = AR/male)');
for (const m of a44toB) console.log('  B saw msg44:', JSON.stringify(m.fields), '(expect id=1, skins JSON)');
const m42 = gB.seen.filter((m) => m.msgId === 42).map((m) => m.fields);
const m24 = gB.seen.filter((m) => m.msgId === 24);
const pings = m24.slice(-3).map((m) => m.fields.p);
console.log('B saw msg42 samples:', JSON.stringify(m42.slice(0, 3)));
console.log('B saw msg24 p (ping*2) samples:', JSON.stringify(pings));
const ok = a22toB.some((m) => m.fields.id === 1 && m.fields.type === 1)
  && a44toB.some((m) => m.fields.id === 1 && typeof m.string === 'string' && m.string.includes('default'))
  && m42.length > 0
  && pings.some((p) => p > 0);
console.log(ok ? 'CLASS + SKIN + HEADER + PING OK' : 'PROPAGATION FAILED');
process.exit(ok ? 0 : 1);

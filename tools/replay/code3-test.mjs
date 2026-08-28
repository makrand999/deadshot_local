import WebSocket from '/home/max/Projects/deadshot/gameplay/node_modules/ws/index.js';
import { pack, unpack } from '/home/max/Projects/deadshot/gameplay/server/src/msgpack.mjs';

const URL = 'ws://127.0.0.1:8081/ws';

async function connect() {
  const ws = new WebSocket(URL);
  await new Promise((r) => ws.on('open', r));
  const hello = await new Promise((r) => ws.once('message', r));
  console.log('hello:', unpack(Buffer.from(hello)).value.map(p => p.t));
  ws.recv = () => new Promise((r) => ws.once('message', (d) => r(unpack(Buffer.from(d)).value)));
  return ws;
}

const ws = await connect();
ws.send(Buffer.from(pack([{ type: 'create' }])));
const createResp = await ws.recv();
console.log('create resp:', createResp.map(p => p.t));
const id = createResp.find(p => p.t === 'prtyid').id;
console.log('party code:', id, '(len', id.length + ')');

const ws2 = await connect();
ws2.send(Buffer.from(pack([{ type: 'join', id: 'Party ID: ' + id }])));
const joinResp = await ws2.recv();
console.log('join resp:', joinResp.map(p => p.t));
console.log(joinResp.some(p => p.t === 'joinsuccess') ? '3-CHAR JOIN OK' : 'JOIN FAILED');
process.exit(0);

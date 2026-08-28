// Verify create -> join -> all members ready -> allocations.
// Run with the LAN server already listening on 8080/8081/8082:
//   node tools/test-private-room.mjs

import assert from 'node:assert/strict';
import { pack, unpack } from '../../server/src/msgpack.mjs';
import { decode, encode } from '../../packages/protocol/index.mjs';

const MM_URL = process.env.DS_MM_URL || 'ws://127.0.0.1:8081/ws';

async function decodePackets(data) {
  const raw = data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : data;
  return unpack(typeof raw === 'string' ? Buffer.from(raw, 'base64') : Buffer.from(raw)).value;
}

function connect(label) {
  const ws = new WebSocket(MM_URL + '?name=' + label);
  const packets = [];
  const waiters = [];
  ws.onmessage = async (event) => {
    const message = await decodePackets(event.data);
    packets.push(...message);
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (message.some(waiters[i].test)) {
        const waiter = waiters.splice(i, 1)[0];
        waiter.resolve(message);
      }
    }
  };
  const open = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error(label + ' websocket error'));
  });
  return {
    ws,
    packets,
    open,
    send(value) { ws.send(pack([value])); },
    wait(test, timeout = 3000) {
      if (packets.some(test)) return Promise.resolve(packets);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(label + ' wait timed out')), timeout);
        waiters.push({
          test,
          resolve(value) { clearTimeout(timer); resolve(value); },
        });
      });
    },
  };
}

const has = (type) => (packet) => packet?.t === type;

function connectGame(token, label) {
  const ws = new WebSocket('ws://127.0.0.1:8080/ws?name=' + label + '&r=' + token);
  const messages = [];
  const waiters = [];
  ws.onmessage = async (event) => {
    const raw = event.data instanceof Blob ? Buffer.from(await event.data.arrayBuffer()) : Buffer.from(event.data);
    const frame = typeof event.data === 'string' ? Buffer.from(event.data, 'base64') : raw;
    const parsed = decode(frame);
    messages.push(...parsed);
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (parsed.some(waiters[i].test)) {
        const waiter = waiters.splice(i, 1)[0];
        waiter.resolve(parsed);
      }
    }
    if (parsed.some((message) => message.msgId === 37)) {
      const handshake = Buffer.concat([
        encode('F79la8l54', { string: '' }),
        encode('o746s7cvb9', {
          val: 1,
          lpm: -1,
          priv: 3,
          pmap: -1,
          ituyDAEpKW: 0,
          PSPGZlgWAcZ: 0,
          YsgdCDVtFmu: 0,
          zqEWySNDO: 1,
          string: '',
        }),
        encode('O4s303G144', { sgr: 0.3, rank: 0.3, ranksgr: 0.3 }),
      ]);
      ws.send(handshake);
    }
    if (parsed.some((message) => message.msgId === 61)) {
      ws.send(Buffer.concat([
        encode('Ns010DV33', {}),
        Buffer.alloc(32, 0xab),
      ]));
    }
  };
  const open = new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error(label + ' game websocket error'));
  });
  return {
    ws,
    messages,
    open,
    wait(test, timeout = 5000) {
      if (messages.some(test)) return Promise.resolve(messages);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(label + ' game wait timed out')), timeout);
        waiters.push({
          test,
          resolve(value) { clearTimeout(timer); resolve(value); },
        });
      });
    },
  };
}

const host = connect('host');
const guest = connect('guest');
await Promise.all([host.open, guest.open]);

host.send({ type: 'create' });
const createPackets = await host.wait(has('prtyid'));
const roomId = createPackets.find((packet) => packet.t === 'prtyid').id;
assert.match(roomId, /^[A-Z2-9]{6}$/);

guest.send({ type: 'join', id: roomId });
await guest.wait(has('joinsuccess'));
await host.wait((packet) => packet.t === 'pu' && packet.m.length === 2);

host.send({ type: 'ready' });
await host.wait((packet) => packet.t === 'pu' && packet.m.length === 2 && packet.m[0][2] === true);
await new Promise((resolve) => setTimeout(resolve, 250));
assert.equal(host.packets.some(has('connect')), false, 'one ready member must not start the game');
assert.equal(guest.packets.some(has('connect')), false, 'one ready member must not start the game');

guest.send({ type: 'ready' });
const hostAllocation = (await host.wait(has('connect'))).find(has('connect'));
const guestAllocation = (await guest.wait(has('connect'))).find(has('connect'));

const hostGame = connectGame(hostAllocation.r, 'host');
const guestGame = connectGame(guestAllocation.r, 'guest');
await Promise.all([hostGame.open, guestGame.open]);
await Promise.all([
  hostGame.wait((message) => message.msgId === 3),
  guestGame.wait((message) => message.msgId === 3),
]);
await Promise.all([
  hostGame.wait((message) => message.msgId === 2),
  guestGame.wait((message) => message.msgId === 2),
]);

const hostSelf = hostGame.messages.find((message) => message.msgId === 3).fields.tdkZouYda;
const guestSelf = guestGame.messages.find((message) => message.msgId === 3).fields.tdkZouYda;
assert.notEqual(hostSelf, guestSelf, 'private members need different player IDs');

// Unspawned players (still in class-select) must NOT appear as entities: the
// client keeps their model disabled/invisible. Verify cross-visibility only
// after each player spawns.
assert(
  !hostGame.messages.some((message) => message.msgId === 2 && message.fields.tdkZouYda === guestSelf),
  'host must NOT see guest state before guest spawns',
);
assert(
  !guestGame.messages.some((message) => message.msgId === 2 && message.fields.tdkZouYda === hostSelf),
  'guest must NOT see host state before host spawns',
);

async function spawn(label, game, name) {
  game.ws.send(encode('B20L372s8', { v: 100, eXABYtRfN: 0 }));
  await game.wait((message) => message.msgId === 18);
  game.ws.send(encode('bWEt7LWg79Z', { identifier: 0 }));
  await game.wait((message) => message.msgId === 29);
}
const beforeClassSelect = hostGame.messages.length;
await spawn('host', hostGame, hostSelf);
const classReply = hostGame.messages.slice(beforeClassSelect);
const classIds = classReply.map((message) => message.msgId);
const fullStateIndex = classIds.indexOf(18);
const yawIndex = classIds.indexOf(17);
const triggerIndex = classIds.indexOf(29);
assert(fullStateIndex >= 0, 'class select must return full state');
assert(yawIndex > fullStateIndex, 'class select must return yaw after full state');
assert(triggerIndex > yawIndex, 'class select must return spawn trigger after yaw');
const fullState = classReply[fullStateIndex].fields;
assert.equal(fullState.BMflnUjRv, fullState.JoHdvmpcMvL);
assert.equal(fullState.pTWaJQCQIlk, fullState.uBHZYKAHa);
assert.equal(fullState.KUkUYkavzt, fullState.yxEKoSFAg);
assert.equal(fullState.gPEUHGwIpHk, -1);
assert(Number.isNaN(fullState.ja));
assert.equal(fullState.AUBAkIWQqEk, 16);

// host is spawned now -> guest must receive host state-2 and create the entity
await guestGame.wait((message) => message.msgId === 2 && message.fields.tdkZouYda === hostSelf);
const initialGuestView = guestGame.messages.find((message) => message.msgId === 2 && message.fields.tdkZouYda === hostSelf).fields;
assert.equal(initialGuestView.YSmEAVINAh, 32, 'player state must use the idle animation bitset');
assert.equal(initialGuestView.qXuHmlbSlxE, 0, 'player state status must match real server (0)');

// spawn the guest too so both see each other
await spawn('guest', guestGame, guestSelf);
await hostGame.wait((message) => message.msgId === 2 && message.fields.tdkZouYda === guestSelf);
assert(
  hostGame.messages.some((message) => message.msgId === 2 && message.fields.tdkZouYda === guestSelf),
  'host must see guest state after guest spawns',
);

hostGame.ws.send(encode('FRF6r51VY32', { val: 1, x: 64, y: 64, rBEdfQOuYkz: 1 })); // yawByte 64 => W moves north (+z)
await new Promise((resolve) => setTimeout(resolve, 250));
const movedGuestView = [...guestGame.messages]
  .reverse()
  .find((message) => message.msgId === 2 && message.fields.tdkZouYda === hostSelf).fields;
assert.notEqual(movedGuestView.yxEKoSFAg, initialGuestView.yxEKoSFAg, 'movement must be visible to other members');

console.log('private room test passed:', roomId);
host.ws.close();
guest.ws.close();
hostGame.ws.close();
guestGame.ws.close();

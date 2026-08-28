import assert from 'node:assert/strict';
import { decode, encode } from '../../packages/protocol/index.mjs';
import { MatchRoom } from '../../server/src/match.mjs';

function fakeServer() {
  return {
    phase: 'playing',
    frames: [],
    sendBatch(parts, what) {
      this.frames.push({ messages: parts.flatMap((part) => decode(part)), what });
    },
  };
}

const room = new MatchRoom({ id: 'combat-test', encode });
const shooterServer = fakeServer();
const victimServer = fakeServer();
const shooter = room.add(shooterServer, { name: 'Shooter' });
const victim = room.add(victimServer, { name: 'Victim' });

shooter.x = -22.4;
shooter.z = -40;
shooter.y = 0.8;
shooter.groundY = 0.8;
shooter.heading = 0; // north
victim.x = -22.4;
victim.z = -35;
victim.y = 0.8;
victim.groundY = 0.8;

for (let i = 0; i < 4; i++) room.handleShot(shooterServer, { fields: {} });
assert.equal(victim.health, 16);

room.handleShot(shooterServer, { fields: {} });
assert.equal(victim.health, 0);
assert.equal(shooter.kills, 1);
assert.equal(shooter.points, 150);

const shooterMessages = shooterServer.frames.flatMap((frame) => frame.messages);
const victimMessages = victimServer.frames.flatMap((frame) => frame.messages);
assert(shooterMessages.some((message) => message.msgId === 13), 'shooter needs hitmarker');
assert(shooterMessages.some((message) => message.msgId === 25), 'shooter needs killfeed');
assert(victimMessages.some((message) => message.msgId === 31), 'victim needs damage arrow');
assert(victimMessages.some((message) => message.msgId === 20), 'victim needs death message');

room.time = 1;
room.secondTick();
assert(shooterServer.frames.flatMap((frame) => frame.messages).some((message) => message.msgId === 28), 'room needs match-end message');

console.log('combat test passed');
room.stop();

// gameplay/tests/party-lobby-config.test.mjs
// Party lobby match configuration: the host's time/mode/map selection syncs
// to every member in real time, invalid or unrunnable choices are rejected,
// and the selected options govern the launched match (HUD timer init +
// 1-second countdown, map/mode setup, team assignment, match end).
//
// Run:  cd gameplay && node --test tests/party-lobby-config.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import {
  startGameplayServer, makeAlloc, GameSocket,
  LOBBY_MAPS, LOBBY_MODES, LOBBY_TIMES,
  SAFE_MAP, DEFAULT_REGION,
  scanVerifiedMaps, resolveLobbyMap, mapNameToIndex, modeNameToIndex,
  isTeamModeIndex, resolveRegion, balanceLobbyTeams,
} from '../server/src/gameplay-server.mjs';
import { pack, unpack } from '../server/src/msgpack.mjs';
import { decode, encode } from '../packages/protocol/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const openSockets = new Set();

// ---------- pure lobby-config unit tests (no server) ----------

test('lobby option tables match the client protocol', () => {
  assert.deepEqual(LOBBY_MAPS, ['tf', 'industry', 'winter', 'newmlab', 'manor', 'neon']); // FO
  assert.deepEqual(LOBBY_MODES, ['FFA', 'TDM', 'Point', 'Confirm', 'Team KC', 'Dom']); // FP
  assert.deepEqual(LOBBY_TIMES, [5, 10, 20]); // FQ (minutes)
  assert.equal(mapNameToIndex('newmlab'), 11);
  assert.equal(mapNameToIndex('tf'), 0);
  assert.equal(mapNameToIndex('bogus'), 11); // unknown -> safe map index
  assert.equal(modeNameToIndex('FFA'), 0);
  assert.equal(modeNameToIndex('TDM'), 1);
  assert.equal(modeNameToIndex('Dom'), 8);
  assert.equal(modeNameToIndex('bogus'), 0);
  assert.equal(isTeamModeIndex(0), false);
  assert.equal(isTeamModeIndex(1), true);
  assert.equal(resolveRegion('9'), '9');
  assert.equal(resolveRegion('XX'), DEFAULT_REGION);
  assert.equal(resolveRegion(undefined), DEFAULT_REGION);
});

test('only maps with geometry on disk are routable', () => {
  const verified = scanVerifiedMaps(CLIENT_DIR);
  for (const m of LOBBY_MAPS) {
    const hasDrc = existsSync(path.join(CLIENT_DIR, 'maps', m, 'out', 'out.drc'));
    assert.equal(verified.has(m), hasDrc, m);
  }
  assert.ok(verified.has(SAFE_MAP), 'safe map must have geometry on disk');
  assert.equal(resolveLobbyMap('bogus-map', verified), SAFE_MAP);
  for (const m of verified) assert.equal(resolveLobbyMap(m, verified), m);
});

test('balanceLobbyTeams keeps picks and balances the rest', () => {
  assert.deepEqual(balanceLobbyTeams([{ team: 0 }, { team: 0 }]), [1, 2]);
  assert.deepEqual(balanceLobbyTeams([{ team: 0 }, { team: 0 }, { team: 0 }, { team: 0 }]), [1, 2, 1, 2]);
  assert.deepEqual(balanceLobbyTeams([{ team: 2 }, { team: 0 }]), [2, 1]);
  assert.deepEqual(balanceLobbyTeams([{ team: 1 }, { team: 1 }, { team: 0 }]), [1, 1, 2]);
});

test('makeAlloc adopts the lobby match length, mode and teams', () => {
  const a = makeAlloc(
    [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 2 }],
    { mapIndex: 11, modeIndex: 0, matchSeconds: 300, scoreLimit: 0 });
  try {
    assert.equal(a.time, 300);
    assert.equal(a.matchLength, 300);
    assert.equal(a.teamMode, false);
    assert.equal(a.players[0].team, 1);
    assert.equal(a.players[1].team, 2);
  } finally { a.stop(); }
  const t = makeAlloc([{ id: 0, name: 'A', skins: [] }], { mapIndex: 11, modeIndex: 1, matchSeconds: 600 });
  try {
    assert.equal(t.teamMode, true);
    assert.equal(t.time, 600);
    assert.ok(t.players[0].team === 1 || t.players[0].team === 2);
  } finally { t.stop(); }
});

test('team modes have no friendly fire; enemies take damage', () => {
  const a = makeAlloc(
    [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 1 }, { id: 2, name: 'C', skins: [], team: 2 }],
    { mapIndex: 11, modeIndex: 1, matchSeconds: 600 });
  try {
    const [shooter, mate, foe] = a.players;
    for (const p of a.players) { p.spawned = true; p.alive = true; }
    shooter.reported = { x: 0, y: 2, z: 0, tick: 0 };
    mate.reported = { x: 0, y: 2, z: 5, tick: 0 };
    foe.reported = { x: 0, y: 2, z: 10, tick: 0 };
    // Aimed at the teammate: no damage to anyone (teammate skipped, the
    // enemy beyond is occluded by the client's own hit point).
    a.handleShot(shooter, { uBHZYKAHa: 0, JoHdvmpcMvL: 0, AHPhtLFTi: 0, mGOwFesuTt: 1, MHnEcbTxpbz: 5 });
    assert.equal(mate.hp, 100);
    assert.equal(foe.hp, 100);
    // Aimed at the enemy: SMG body hit for 11.
    a.handleShot(shooter, { uBHZYKAHa: 0, JoHdvmpcMvL: 0, AHPhtLFTi: 0, mGOwFesuTt: 1, MHnEcbTxpbz: 10 });
    assert.equal(foe.hp, 89);
    assert.equal(mate.hp, 100);
    assert.equal(shooter.ammo, 38); // both shots processed (no early return)
    // State + scoreboard carry the real team.
    assert.equal(decode(a.stateMessage(foe))[0].fields.qXuHmlbSlxE, 2);
  } finally { a.stop(); }
});

test('match ends at 0:00 with final scoreboard and match-end trigger', async () => {
  process.env.GP_SPEED = '50';
  try {
    const a = makeAlloc(
      [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 2 }],
      { mapIndex: 11, modeIndex: 0, matchSeconds: 2 });
    const seen = [];
    const fake = {
      closed: false, ws: { readyState: 1 }, clockLeft: 0, clockResetLeft: 0, clockCycle: 0, clockRand: 1,
      send(parts) { for (const p of parts) for (const m of decode(p)) seen.push(m); },
    };
    a.sockets.add(fake);
    let endCalls = 0;
    a.onEnd = () => { endCalls++; };
    try {
      a.startSecondTick();
      const t0 = Date.now();
      while (!a.ended && Date.now() - t0 < 5000) await sleep(20);
      assert.equal(a.ended, true);
      assert.equal(endCalls, 1);
      const timers = seen.filter((m) => m.msgId === 19).map((m) => m.fields.time);
      assert.ok(timers.includes(2), 'HUD initializes to full limit, got ' + timers);
      assert.ok(timers.includes(0), 'timer reaches 0:00, got ' + timers);
      assert.ok(seen.some((m) => m.msgId === 28), 'match-end trigger sent');
      assert.ok(seen.filter((m) => m.msgId === 24).length >= 2, 'final scoreboard sent');
      const n = seen.length;
      await sleep(150); // several would-be ticks at 50x speed
      assert.equal(seen.length, n, 'timer/scoreboard loops stop after the end');
    } finally { a.stop(); }
  } finally { process.env.GP_SPEED = '1'; }
});

test('winning score limit ends the match (FFA + team totals)', () => {
  const a = makeAlloc(
    [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 2 }],
    { mapIndex: 11, modeIndex: 0, matchSeconds: 300, scoreLimit: 100 });
  try {
    const seen = [];
    a.sockets.add({ closed: false, ws: { readyState: 1 }, send(parts) { for (const p of parts) for (const m of decode(p)) seen.push(m); } });
    a.onKill(a.players[0], a.players[1], false); // +100 body kill
    assert.equal(a.ended, true);
    assert.ok(seen.some((m) => m.msgId === 28));
  } finally { a.stop(); }

  const t = makeAlloc(
    [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 1 }, { id: 2, name: 'C', skins: [], team: 2 }],
    { mapIndex: 11, modeIndex: 1, matchSeconds: 300, scoreLimit: 150 });
  try {
    t.sockets.add({ closed: false, ws: { readyState: 1 }, send() {} });
    t.onKill(t.players[0], t.players[2], false); // team1 = 100 < 150
    assert.equal(t.ended, false);
    t.players[2].alive = true;
    t.onKill(t.players[1], t.players[2], false); // team1 = 200 >= 150
    assert.equal(t.ended, true);
    assert.deepEqual(t.teamScores(), { a: 200, b: 0 });
  } finally { t.stop(); }
});

// ---------- integration tests through the real matchmaker + game sockets ----------

let SRV = null;
before(async () => {
  process.env.GP_ALLOC_TTL = '0'; // no allocation expiry timer to outlive the tests
  process.env.GP_SPEED = '1';
  const s = await startGameplayServer({ httpPort: 0, mmPort: 0 });
  SRV = { ...s, httpPort: s.httpServer.address().port, mmPort: s.mm.address().port };
});
after(async () => {
  for (const ws of [...openSockets]) { try { ws.terminate(); } catch {} }
  openSockets.clear();
  if (SRV) {
    await new Promise((r) => SRV.mm.close(r));
    await new Promise((r) => SRV.httpServer.close(r));
    SRV = null;
  }
});

async function connectMM(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  openSockets.add(ws);
  ws.once('close', () => openSockets.delete(ws));
  const c = { ws, queue: [] };
  // Attach before open: the server's first packet can arrive with the handshake.
  ws.on('message', (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const v = unpack(buf).value;
    if (Array.isArray(v)) c.queue.push(...v);
  });
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });
  return c;
}
function sendMM(c, pkts) { c.ws.send(pack(pkts)); }
async function waitMM(c, pred, timeoutMs = 8000) {
  const t0 = Date.now();
  for (;;) {
    const i = c.queue.findIndex(pred);
    if (i !== -1) return c.queue.splice(i, 1)[0];
    if (Date.now() - t0 > timeoutMs) throw new Error('timeout waiting for matchmaker packet; queue=' + JSON.stringify(c.queue));
    await sleep(20);
  }
}
const isPU = (p) => p && p.t === 'pu';

async function connectGame(httpPort, token) {
  const ws = new WebSocket(`ws://127.0.0.1:${httpPort}/ws?r=${token}`);
  openSockets.add(ws);
  ws.once('close', () => openSockets.delete(ws));
  const c = { ws, queue: [] };
  // Attach before open: the server's challenge can arrive with the handshake.
  ws.on('message', (data) => {
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
    for (const m of decode(raw)) c.queue.push(m);
  });
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });
  return c;
}
function sendGame(c, bufs) { c.ws.send(Buffer.concat(bufs)); }
async function waitGame(c, msgId, timeoutMs = 8000) {
  const t0 = Date.now();
  for (;;) {
    const i = c.queue.findIndex((m) => m.msgId === msgId);
    if (i !== -1) return c.queue.splice(i, 1)[0];
    if (Date.now() - t0 > timeoutMs) {
      throw new Error(`timeout waiting for game msg ${msgId}; got [${c.queue.map((m) => m.msgId)}]`);
    }
    await sleep(20);
  }
}
async function waitGameFields(c, msgId, pred, timeoutMs = 8000) {
  const t0 = Date.now();
  for (;;) {
    const i = c.queue.findIndex((m) => m.msgId === msgId && pred(m.fields));
    if (i !== -1) return c.queue.splice(i, 1)[0];
    if (Date.now() - t0 > timeoutMs) {
      throw new Error(`timeout waiting for game msg ${msgId} matching predicate`);
    }
    await sleep(20);
  }
}
// Full handshake through the real anti-bot check (msg30 val is computed, not
// bypassed). Lobby echo indices keep the server's sync check quiet.
async function handshake(c, { mapIdx = 3, modeIdx = 0, timeIdx = 0 } = {}) {
  const challenge = (await waitGame(c, 37)).fields.val;
  const val = (challenge * 2 + 0x178C4E) % 0x1C9C380;
  sendGame(c, [
    encode('F79la8l54', { string: 'test-token' }),
    encode('o746s7cvb9', {
      val, lpm: 11, priv: 3, pmap: mapIdx, ituyDAEpKW: modeIdx,
      PSPGZlgWAcZ: timeIdx, YsgdCDVtFmu: 0, zqEWySNDO: 1, string: '',
    }),
    encode('O4s303G144', { sgr: 0, rank: 0, ranksgr: 0 }),
  ]);
  await waitGame(c, 61);
  sendGame(c, [encode('Ns010DV33', {})]);
  return waitGame(c, 36);
}
async function spawn(c) {
  sendGame(c, [encode('B20L372s8', { v: 100, eXABYtRfN: 0 })]);
  await waitGame(c, 18);
  sendGame(c, [encode('bWEt7LWg79Z', { identifier: 0 })]);
  await waitGame(c, 29);
}
// Create a room, apply host settings, join a second member, ready up both.
async function startRoomMatch({ time, mode } = {}) {
  const A = await connectMM(SRV.mmPort);
  sendMM(A, [{ type: 'create', region: '52', b: 0 }]);
  const prty = await waitMM(A, (p) => p.t === 'prtyid');
  await waitMM(A, isPU);
  if (time !== undefined) {
    // No-op updates produce no broadcast by design, so force-verify.
    sendMM(A, [{ type: 'updatePartyInfo', obj: { time } }]);
    sendMM(A, [{ type: 'updatePlayerInfo', name: 'Host', skins: [] }]);
    await waitMM(A, (p) => isPU(p) && p.m[0][0] === 'Host' && p.inf.time === time);
  }
  if (mode !== undefined) {
    sendMM(A, [{ type: 'updatePartyInfo', obj: { mode } }]);
    sendMM(A, [{ type: 'updatePlayerInfo', name: 'Host', skins: [] }]);
    await waitMM(A, (p) => isPU(p) && p.m[0][0] === 'Host' && p.inf.mode === mode);
  }
  const B = await connectMM(SRV.mmPort);
  sendMM(B, [{ type: 'join', id: prty.id, b: 0 }]);
  await waitMM(B, (p) => p.t === 'joinsuccess');
  sendMM(A, [{ type: 'ready' }]);
  sendMM(B, [{ type: 'ready' }]);
  const cA = await waitMM(A, (p) => p.t === 'connect');
  const cB = await waitMM(B, (p) => p.t === 'connect');
  assert.equal(cA.r, cB.r);
  return { A, B, token: cA.r };
}

test('host time-limit change syncs to every member; invalid values ignored', async () => {
  const A = await connectMM(SRV.mmPort);
  sendMM(A, [{ type: 'create', region: '9', b: 0 }]);
  const prty = await waitMM(A, (p) => p.t === 'prtyid');
  const def = await waitMM(A, isPU);
  assert.deepEqual(def.inf, { map: 'newmlab', mode: 'FFA', time: 5, region: '9' });
  sendMM(A, [{ type: 'updatePartyInfo', obj: { time: 10 } }]);
  const upd = await waitMM(A, (p) => isPU(p) && p.inf.time === 10);
  assert.equal(upd.inf.time, 10);
  const B = await connectMM(SRV.mmPort);
  sendMM(B, [{ type: 'join', id: prty.id, b: 0 }]);
  await waitMM(B, (p) => p.t === 'joinsuccess');
  const puB = await waitMM(B, (p) => isPU(p) && p.m.length === 2);
  assert.equal(puB.inf.time, 10); // late joiner sees the host's choice
  sendMM(A, [{ type: 'updatePartyInfo', obj: { time: 99 } }]);
  sendMM(A, [{ type: 'updatePlayerInfo', name: 'Host', skins: [] }]); // force re-broadcast
  const still = await waitMM(A, (p) => isPU(p) && p.m[0][0] === 'Host');
  assert.equal(still.inf.time, 10);
});

test('all 6 lobby maps are verified and selectable by the host', async () => {
  const verified = scanVerifiedMaps(CLIENT_DIR);
  assert.equal(verified.size, 6);
  for (const m of LOBBY_MAPS) {
    assert.ok(verified.has(m), `lobby map ${m} must be verified on disk`);
  }
  const A = await connectMM(SRV.mmPort);
  sendMM(A, [{ type: 'create', region: '52', b: 0 }]);
  await waitMM(A, (p) => p.t === 'prtyid');
  await waitMM(A, isPU);

  // Switch to each lobby map in turn and verify lobby syncs
  for (const mapName of ['industry', 'winter', 'neon', 'manor', 'tf', 'newmlab']) {
    sendMM(A, [{ type: 'updatePartyInfo', obj: { map: mapName } }]);
    const pu = await waitMM(A, (p) => isPU(p) && p.inf.map === mapName);
    assert.equal(pu.inf.map, mapName);
  }
});

test('map without on-disk geometry is rejected; lobby keeps the safe map', async () => {
  // Start a server where 'winter' is excluded from verifiedMaps to test rejection
  const partialVerified = new Set(['newmlab', 'industry', 'tf', 'manor', 'neon']);
  const s = await startGameplayServer({ httpPort: 0, mmPort: 0, verifiedMaps: partialVerified });
  const mmPort = s.mm.address().port;
  let A = null;
  try {
    A = await connectMM(mmPort);
    sendMM(A, [{ type: 'create', region: '52', b: 0 }]);
    await waitMM(A, (p) => p.t === 'prtyid');
    await waitMM(A, isPU);
    sendMM(A, [{ type: 'updatePartyInfo', obj: { map: 'winter' } }]);
    const reverted = await waitMM(A, isPU);
    assert.equal(reverted.inf.map, 'newmlab');
  } finally {
    if (A) { try { A.ws.terminate(); } catch {} }
    await new Promise((r) => s.mm.close(r));
    await new Promise((r) => s.httpServer.close(r));
  }
});

test('host mode change applies; non-host changes ignored; swap toggles team', async () => {
  const A = await connectMM(SRV.mmPort);
  sendMM(A, [{ type: 'create', region: '52', b: 0 }]);
  const prty = await waitMM(A, (p) => p.t === 'prtyid');
  await waitMM(A, isPU);
  const B = await connectMM(SRV.mmPort);
  sendMM(B, [{ type: 'join', id: prty.id, b: 0 }]);
  await waitMM(B, (p) => p.t === 'joinsuccess');
  await waitMM(B, isPU);
  sendMM(A, [{ type: 'updatePartyInfo', obj: { mode: 'TDM' } }]);
  const tdm = await waitMM(A, (p) => isPU(p) && p.inf.mode === 'TDM');
  assert.equal(tdm.inf.mode, 'TDM');
  sendMM(B, [{ type: 'updatePartyInfo', obj: { mode: 'FFA' } }]); // not the host
  sendMM(B, [{ type: 'updatePlayerInfo', name: 'Guest2', skins: [] }]); // force re-broadcast
  const still = await waitMM(B, (p) => isPU(p) && p.m[1][0] === 'Guest2');
  assert.equal(still.inf.mode, 'TDM');
  sendMM(B, [{ type: 'updatePartyInfo', obj: { swap: true } }]);
  const s1 = await waitMM(B, (p) => isPU(p) && p.m[1][3] === 1);
  assert.equal(s1.m[1][3], 1);
  sendMM(B, [{ type: 'updatePartyInfo', obj: { swap: true } }]);
  const s2 = await waitMM(B, (p) => isPU(p) && p.m[1][3] === 2);
  assert.equal(s2.m[1][3], 2);
});

test('unknown region falls back to a valid lobby region', async () => {
  const C = await connectMM(SRV.mmPort);
  sendMM(C, [{ type: 'create', region: 'XX', b: 0 }]);
  await waitMM(C, (p) => p.t === 'prtyid');
  const pu = await waitMM(C, isPU);
  assert.equal(pu.inf.region, DEFAULT_REGION);
});

test('5-min lobby launches a 5:00 match that counts down every second', async () => {
  const { token } = await startRoomMatch({ time: 5 });
  const g = await connectGame(SRV.httpPort, token);
  try {
    const m36 = await handshake(g, { mapIdx: 3, modeIdx: 0, timeIdx: 0 });
    assert.equal(m36.fields.id, 0); // FFA: no team
    assert.equal((await waitGame(g, 33)).fields.h, 11); // newmlab
    assert.equal((await waitGame(g, 32)).fields.h, 0); // FFA
    await spawn(g);
    assert.equal((await waitGame(g, 19)).fields.time, 300); // 5:00 HUD init
    const t0 = Date.now();
    assert.equal((await waitGame(g, 19)).fields.time, 299);
    const dt = Date.now() - t0;
    assert.ok(dt >= 800 && dt <= 2500, `one-second cadence, got ${dt}ms`);
  } finally { g.ws.close(); }
});

test('lobby time limit wins over the server GP_MATCH_TIME preset', async () => {
  process.env.GP_MATCH_TIME = '3600'; // the manual-session preset from the bug report
  try {
    const { token } = await startRoomMatch({ time: 5 });
    const g = await connectGame(SRV.httpPort, token);
    try {
      await handshake(g, { mapIdx: 3, modeIdx: 0, timeIdx: 0 });
      await spawn(g);
      assert.equal((await waitGame(g, 19)).fields.time, 300);
    } finally { g.ws.close(); }
  } finally { delete process.env.GP_MATCH_TIME; }
});

test('10-min and 20-min lobbies launch 10:00 and 20:00 timers', async () => {
  for (const [mins, secs] of [[10, 600], [20, 1200]]) {
    const { token } = await startRoomMatch({ time: mins });
    const g = await connectGame(SRV.httpPort, token);
    try {
      await handshake(g, { mapIdx: 3, modeIdx: 0, timeIdx: LOBBY_TIMES.indexOf(mins) });
      await spawn(g);
      assert.equal((await waitGame(g, 19)).fields.time, secs);
    } finally { g.ws.close(); }
  }
});

test('TDM lobby launches team mode with balanced teams', async () => {
  const { token } = await startRoomMatch({ time: 5, mode: 'TDM' });
  const g = await connectGame(SRV.httpPort, token);
  try {
    const m36 = await handshake(g, { mapIdx: 3, modeIdx: 1, timeIdx: 0 });
    assert.equal(m36.fields.id, 1); // first member -> team 1
    assert.equal((await waitGame(g, 32)).fields.h, 1); // TDM
    await spawn(g);
    assert.equal((await waitGame(g, 19)).fields.time, 300);
  } finally { g.ws.close(); }
});

test('mid-match reconnect reclaims the same slot with score preserved', async () => {
  // Three-member room, but only A and B open game sockets: C's never-claimed
  // slot is what a stale link would misroute the reconnect into.
  const A = await connectMM(SRV.mmPort);
  sendMM(A, [{ type: 'create', region: '52', b: 0 }]);
  const prty = await waitMM(A, (p) => p.t === 'prtyid');
  await waitMM(A, isPU);
  const B = await connectMM(SRV.mmPort);
  sendMM(B, [{ type: 'join', id: prty.id, b: 0 }]);
  await waitMM(B, (p) => p.t === 'joinsuccess');
  const C = await connectMM(SRV.mmPort);
  sendMM(C, [{ type: 'join', id: prty.id, b: 0 }]);
  await waitMM(C, (p) => p.t === 'joinsuccess');
  sendMM(A, [{ type: 'ready' }]);
  sendMM(B, [{ type: 'ready' }]);
  sendMM(C, [{ type: 'ready' }]);
  const token = (await waitMM(A, (p) => p.t === 'connect')).r;
  await waitMM(B, (p) => p.t === 'connect');
  await waitMM(C, (p) => p.t === 'connect');
  const gA = await connectGame(SRV.httpPort, token);
  const gB = await connectGame(SRV.httpPort, token);
  try {
    await handshake(gA, { mapIdx: 3, modeIdx: 0, timeIdx: 0 });
    await handshake(gB, { mapIdx: 3, modeIdx: 0, timeIdx: 0 });
    assert.equal((await waitGame(gA, 3)).fields.tdkZouYda, 0);
    assert.equal((await waitGame(gB, 3)).fields.tdkZouYda, 1);
    await spawn(gA);
    await spawn(gB);
    // A guns B down over the wire (10x SMG body) for a real recorded kill.
    const ap = { x: 48.9, y: 4.6, z: -22 }; // newmlab[0]
    const bp = { x: 67.3, y: 4.8, z: -10.5 }; // newmlab[1]
    sendGame(gB, [encode('BVaxA5RXAZ', { x: bp.x, y: bp.y, z: bp.z })]);
    sendGame(gA, [encode('BVaxA5RXAZ', { x: ap.x, y: ap.y, z: ap.z })]);
    for (let i = 0; i < 10; i++) {
      sendGame(gA, [encode('e479Jk50P', {
        uBHZYKAHa: 0, JoHdvmpcMvL: 0, AHPhtLFTi: bp.x, mGOwFesuTt: 4.1,
        MHnEcbTxpbz: bp.z, pMwSuGipfE: 0, VqpNEuOqqCX: i,
      })]);
    }
    const kill = await waitGameFields(gA, 24, (f) => f.id === 0 && f.points === 100);
    assert.equal(kill.fields.k, 1);
    // A drops; B sees the despawn, proving the server ran the close handler.
    gA.ws.close();
    await waitGameFields(gB, 7, (f) => f.tdkZouYda === 0);
    // A comes back on the same token: same slot, same score, no ghost.
    const gA2 = await connectGame(SRV.httpPort, token);
    try {
      await handshake(gA2, { mapIdx: 3, modeIdx: 0, timeIdx: 0 });
      assert.equal((await waitGame(gA2, 3)).fields.tdkZouYda, 0);
      const sb = await waitGameFields(gA2, 24, (f) => f.id === 0);
      assert.equal(sb.fields.points, 100);
      assert.equal(sb.fields.k, 1);
      await sleep(150);
      const ids = gA2.queue.filter((m) => m.msgId === 43).map((m) => m.fields.id).sort();
      assert.deepEqual(ids, [0, 1, 2]);
      // Re-pick + ack puts A back in the game via respawn rotation.
      await spawn(gA2);
      gB.queue.length = 0; // drain stale state
      const back = await waitGameFields(gB, 2, (f) => f.tdkZouYda === 0);
      assert.equal(back.fields.tdkZouYda, 0);
    } finally { gA2.ws.close(); }
  } finally { gA.ws.close(); gB.ws.close(); }
});

test('closing a duplicate connection does not free the live slot', () => {
  const a = makeAlloc([{ id: 0, name: 'A', skins: [], team: 1 }], { mapIndex: 11, modeIndex: 0, matchSeconds: 300 });
  const mkws = () => ({
    handlers: {},
    on(e, f) { this.handlers[e] = f; },
    send() {}, ping() {}, close() {}, readyState: 1,
  });
  const w1 = mkws(), w2 = mkws();
  const noop = () => {};
  const s1 = new GameSocket(w1, { alloc: a, me: a.players[0], log: noop });
  a.players[0].srv = s1; a.sockets.add(s1); s1.start();
  const s2 = new GameSocket(w2, { alloc: a, me: a.players[0], log: noop });
  a.players[0].srv = s2; a.sockets.add(s2); s2.start(); // duplicate tab steals the slot
  w1.handlers.close(); // stale socket closes first
  assert.equal(a.players[0].srv, s2); // live link preserved
  assert.equal(a.players.find((p) => !p.srv), undefined); // slot still owned
  w2.handlers.close(); // last close frees it
  assert.equal(a.players[0].srv, null);
  assert.equal(a.players.find((p) => !p.srv), a.players[0]); // reclaimable
  a.stop();
});

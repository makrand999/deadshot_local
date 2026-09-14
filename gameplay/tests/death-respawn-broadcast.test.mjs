// gameplay/tests/death-respawn-broadcast.test.mjs
// Death/respawn entity continuity (match.mjs parity): a dead player stays in
// the world's tick broadcast (anim 0x60, hp 0) with NO time cutoff, so the
// client's entity/model state survives until the respawn; the respawn then
// resumes living states seamlessly. A cutoff that drops the corpse from the
// broadcast (e.g. 1000ms after death) breaks the client model state on
// respawn.
//
// Run:  cd gameplay && node --test tests/death-respawn-broadcast.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAlloc } from '../server/src/gameplay-server.mjs';
import { decode } from '../packages/protocol/index.mjs';

function viewer(alloc, me) {
  const seen = [];
  const s = {
    closed: false,
    ws: { readyState: 1 },
    me,
    clockCycle: 0,
    clockLeft: 0,
    clockResetLeft: 0,
    clockRand: 1,
    send(parts) { for (const p of parts) for (const m of decode(p)) seen.push(m); },
  };
  alloc.sockets.add(s);
  return { socket: s, seen };
}

function statesFor(seen, id) {
  return seen.filter((m) => m.msgId === 2 && m.fields.tdkZouYda === id);
}

function twoPlayerAlloc() {
  const a = makeAlloc(
    [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 2 }],
    { mapIndex: 11, modeIndex: 0, matchSeconds: 300 });
  for (const p of a.players) { p.spawned = true; p.alive = true; }
  return a;
}

test('death keeps the player spawned and broadcasting (no time cutoff)', () => {
  const a = twoPlayerAlloc();
  const realNow = Date.now;
  try {
    const [shooter, victim] = a.players;
    const viewA = viewer(a, shooter);
    const viewB = viewer(a, victim);

    a.onKill(shooter, victim, false);
    assert.equal(victim.alive, false);
    assert.equal(victim.hp, 0);
    assert.equal(victim.spawned, true, 'dead players stay in the world (match.mjs parity)');

    // Immediate ticks after death: every viewer still gets the corpse state.
    a.tick();
    for (const v of [viewA, viewB]) {
      const states = statesFor(v.seen, victim.id);
      assert.equal(states.length, 1, 'corpse state broadcast right after death');
      assert.equal(states[0].fields.hkhrYayXI, 0);
      assert.equal(states[0].fields.YSmEAVINAh, 0x60);
    }

    // Long after death the corpse states must STILL arrive every tick —
    // dropping them breaks the client model state on respawn.
    const t0 = realNow();
    Date.now = () => t0 + 30000;
    try {
      for (let i = 0; i < 5; i++) {
        viewA.seen.length = 0;
        a.tick();
        const states = statesFor(viewA.seen, victim.id);
        assert.equal(states.length, 1, `corpse state broadcast 30s after death (tick ${i})`);
        assert.equal(states[0].fields.hkhrYayXI, 0);
        assert.equal(states[0].fields.YSmEAVINAh, 0x60);
      }
    } finally {
      Date.now = realNow;
    }
  } finally {
    a.stop();
  }
});

test('respawn resumes living states in every viewer with no broadcast gap', () => {
  const a = twoPlayerAlloc();
  try {
    const [shooter, victim] = a.players;
    const viewA = viewer(a, shooter);
    const viewB = viewer(a, victim);

    a.onKill(shooter, victim, false);
    a.respawn(victim);
    assert.equal(victim.alive, true);
    assert.equal(victim.hp, 100);
    assert.equal(victim.spawned, true, 'respawn does not wait on an ack to rejoin the broadcast');

    viewA.seen.length = 0;
    viewB.seen.length = 0;
    a.tick();
    for (const v of [viewA, viewB]) {
      const states = statesFor(v.seen, victim.id);
      assert.equal(states.length, 1, 'living state resumes immediately after respawn');
      assert.equal(states[0].fields.hkhrYayXI, 100);
      assert.equal(states[0].fields.YSmEAVINAh & 0x40, 0, 'death bit cleared on respawn');
    }
  } finally {
    a.stop();
  }
});

test('unspawned players stay hidden except to themselves (class select)', () => {
  const a = makeAlloc(
    [{ id: 0, name: 'A', skins: [], team: 1 }, { id: 1, name: 'B', skins: [], team: 2 }],
    { mapIndex: 11, modeIndex: 0, matchSeconds: 300 });
  try {
    const [spawnedP, selectingP] = a.players;
    spawnedP.spawned = true;
    spawnedP.alive = true;
    // selectingP is still in class select: spawned=false.
    const viewSpawned = viewer(a, spawnedP);
    const viewSelecting = viewer(a, selectingP);

    a.tick();
    assert.equal(statesFor(viewSpawned.seen, selectingP.id).length, 0,
      'class-selecting player hidden from others');
    assert.equal(statesFor(viewSpawned.seen, spawnedP.id).length, 1,
      'spawned player visible to others');
    assert.equal(statesFor(viewSelecting.seen, selectingP.id).length, 1,
      'self state always included for the self-state check');
  } finally {
    a.stop();
  }
});

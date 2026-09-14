// gameplay/tests/map-spawns.test.mjs
// Per-map respawn tables: every map in the client's map database has a
// dedicated server-side spawn list (coordinates + facing bytes), matches use
// the active map's list for initial placement and respawns, and respawn
// rotation cycles through that map's points.
//
// Run:  cd gameplay && node --test tests/map-spawns.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeAlloc, MAP_SPAWNS, SAFE_MAP,
  spawnsForMap, spawnsForMapIndex, mapNameToIndex,
} from '../server/src/gameplay-server.mjs';

// Bundle-extracted census: map key -> FT index -> spawn count.
const CENSUS = [
  ['tf', 0, 9], ['industry', 1, 5], ['winter', 2, 8], ['mlab', 3, 12],
  ['manor', 4, 8], ['militia', 5, 7], ['shoothouse', 6, 10], ['dust2', 7, 1],
  ['neon', 8, 11], ['sandstorm', 9, 6], ['sandstorm2', 10, 1], ['newmlab', 11, 10],
];

test('every map has a dedicated non-empty spawn list of the bundle count', () => {
  assert.equal(Object.keys(MAP_SPAWNS).length, 12);
  for (const [name, idx, count] of CENSUS) {
    assert.equal(mapNameToIndex(name), idx, name);
    assert.ok(Array.isArray(MAP_SPAWNS[name]), name);
    assert.equal(MAP_SPAWNS[name].length, count, name);
  }
});

test('every spawn has finite coordinates and valid facing bytes', () => {
  for (const [name, ,] of CENSUS) {
    for (const [i, sp] of MAP_SPAWNS[name].entries()) {
      assert.ok(Number.isFinite(sp.x) && Number.isFinite(sp.y) && Number.isFinite(sp.z), `${name}[${i}]`);
      assert.ok(Number.isInteger(sp.pitch) && sp.pitch >= 0 && sp.pitch <= 255, `${name}[${i}].pitch`);
      assert.ok(Number.isInteger(sp.yaw) && sp.yaw >= 0 && sp.yaw <= 255, `${name}[${i}].yaw`);
    }
  }
});

test('exact bundle coordinates, pitch and yaw per map', () => {
  const spot = {
    tf: { x: -4.1, y: 2.5, z: -0.2, pitch: 64, yaw: 128 },
    industry: { x: -13, y: 6.5, z: -37, pitch: 64, yaw: 192 },
    winter: { x: -9.7, y: 6.2, z: 29.3, pitch: 62, yaw: 6 },
    mlab: { x: 0, y: 9.3, z: 0, pitch: 62, yaw: 249 },
    manor: { x: -17.7, y: -9.3, z: -36.8, pitch: 64, yaw: 126 },
    militia: { x: -19, y: 2, z: 8.3, pitch: 63, yaw: 226 },
    shoothouse: { x: 18.8, y: 5.3, z: 3.6, pitch: 64, yaw: 126 },
    dust2: { x: 0, y: 100, z: 0, pitch: 64, yaw: 0 }, // coords-only placeholder; level/0 facing
    neon: { x: 3, y: 2.4, z: 0.6, pitch: 63, yaw: 177 },
    sandstorm: { x: -11, y: -6.8, z: 18.9, pitch: 60, yaw: 30 },
    sandstorm2: { x: -31.6, y: 10.6, z: -60.2, pitch: 62, yaw: 193 },
    newmlab: { x: 48.9, y: 4.6, z: -22, pitch: 60, yaw: 254 },
  };
  for (const [name, want] of Object.entries(spot)) {
    const got = MAP_SPAWNS[name][0];
    assert.deepEqual({ x: got.x, y: got.y, z: got.z, pitch: got.pitch, yaw: got.yaw }, want, name);
  }
  // A last-row check guards against truncation/column mix-ups.
  const neonLast = MAP_SPAWNS.neon[10];
  assert.deepEqual(
    { x: neonLast.x, y: neonLast.y, z: neonLast.z, pitch: neonLast.pitch, yaw: neonLast.yaw },
    { x: 24, y: 4.7, z: -8.5, pitch: 63, yaw: 254 });
});

test('lookup resolves by name and index, unknown maps fall back safely', () => {
  for (const [name, idx,] of CENSUS) {
    assert.equal(spawnsForMap(name), MAP_SPAWNS[name], name);
    assert.equal(spawnsForMapIndex(idx), MAP_SPAWNS[name], `${name}/${idx}`);
  }
  assert.equal(spawnsForMap('bogus'), MAP_SPAWNS[SAFE_MAP]);
  assert.equal(spawnsForMapIndex(99), MAP_SPAWNS[SAFE_MAP]);
  assert.equal(spawnsForMapIndex(-1), MAP_SPAWNS[SAFE_MAP]);
});

test('match launch places players on the active map spawn points', () => {
  for (const [name, idx,] of CENSUS) {
    const list = MAP_SPAWNS[name];
    const roster = list.map((_, i) => ({ id: i, name: `P${i}`, skins: [] }));
    const a = makeAlloc(roster, { mapIndex: idx, modeIndex: 0, matchSeconds: 300 });
    try {
      assert.equal(a.spawns, list, `${name}: alloc uses its own list`);
      for (const p of a.players) {
        const want = list[p.id % list.length];
        assert.deepEqual({ x: p.x, y: p.y, z: p.z }, { x: want.x, y: want.y, z: want.z }, `${name} p${p.id}`);
        assert.equal(p.yawByte, want.yaw, `${name} p${p.id} yaw`);
        assert.equal(p.spawnYaw, want.yaw, `${name} p${p.id} spawnYaw`);
        assert.equal(p.aimByte, want.pitch || 63, `${name} p${p.id} pitch`);
      }
    } finally { a.stop(); }
  }
});

test('respawn rotates through the active map list (anti-camping)', () => {
  for (const [name, idx,] of CENSUS) {
    const list = MAP_SPAWNS[name];
    const a = makeAlloc([{ id: 0, name: 'P0', skins: [] }], { mapIndex: idx, modeIndex: 0, matchSeconds: 300 });
    try {
      const p = a.players[0];
      const seen = new Set();
      for (let k = 0; k < list.length; k++) {
        a.tickCount = k;
        a.respawn(p); // index (tickCount + id + 1) % len
        seen.add(`${p.x},${p.y},${p.z}`);
        const want = list[(k + 1) % list.length];
        assert.deepEqual({ x: p.x, y: p.y, z: p.z }, { x: want.x, y: want.y, z: want.z }, `${name} tick ${k}`);
        assert.equal(p.yawByte, want.yaw, `${name} tick ${k} yaw`);
        assert.equal(p.aimByte, want.pitch || 63, `${name} tick ${k} pitch`);
        assert.equal(p.hp, 100);
        assert.equal(p.alive, true);
      }
      assert.equal(seen.size, list.length, `${name}: rotation covers every spawn point`);
    } finally { a.stop(); }
  }
});

test('respawn stays on single-spawn maps without errors', () => {
  for (const [name, idx] of [['dust2', 7], ['sandstorm2', 10]]) {
    const a = makeAlloc([{ id: 0, name: 'P0', skins: [] }], { mapIndex: idx, modeIndex: 0, matchSeconds: 300 });
    try {
      const p = a.players[0];
      a.tickCount = 12345;
      a.respawn(p);
      const want = MAP_SPAWNS[name][0];
      assert.deepEqual({ x: p.x, y: p.y, z: p.z }, { x: want.x, y: want.y, z: want.z }, name);
      assert.equal(p.yawByte, want.yaw, name);
    } finally { a.stop(); }
  }
});

// gameplay/tests/gloo-cross-match.test.mjs
// Verifies that Gloo Walls from previous matches are completely purged when entering a new match.

import test from 'node:test';
import assert from 'node:assert/strict';
import { GlooWallManager } from '../server/src/gloo-wall-manager.mjs';

test('Cross-Match Gloo Wall Lifecycle & Server Clean Reset', () => {
  const room1Mgr = new GlooWallManager();
  const w1 = room1Mgr.spawnWall(0, 10, 0, 10, 0);
  const w2 = room1Mgr.spawnWall(1, -5, 0, 15, Math.PI / 2);

  assert.equal(room1Mgr.walls.size, 2);
  assert.ok(room1Mgr.raycast(10, 1.0, 0, 0, 0, 1, 50), 'Bullet hits wall 1 in Room 1');

  // Room 1 ends -> stop() cleans up
  room1Mgr.clear();
  assert.equal(room1Mgr.walls.size, 0, 'Room 1 manager cleared on stop');

  // Room 2 begins fresh
  const room2Mgr = new GlooWallManager();
  assert.equal(room2Mgr.walls.size, 0, 'Room 2 starts with 0 active walls');
  assert.equal(room2Mgr.raycast(10, 1.0, 0, 0, 0, 1, 50), null, 'Old wall 1 has NO collision in Room 2');

  // Room 2 spawns fresh wall
  const w3 = room2Mgr.spawnWall(0, 20, 0, 20, 0);
  assert.equal(room2Mgr.walls.size, 1);
  assert.equal(w3.wall.id, 1, 'Room 2 allocates its own wall IDs cleanly');
});

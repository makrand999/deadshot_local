// gameplay/tests/gloo-wall.test.mjs
// Unit tests for the Gloo Wall manager, raycasting math, durability, and shielding.

import test from 'node:test';
import assert from 'node:assert/strict';
import { GlooWallManager } from '../server/src/gloo-wall-manager.mjs';

test('GlooWallManager - Spawn, Limit & Expiry', () => {
  const mgr = new GlooWallManager({ baseHp: 400, maxPerPlayer: 3, lifetimeMs: 1000 });

  // Spawn 3 walls for player 0
  const w1 = mgr.spawnWall(0, 10, 0, 10, 0);
  const w2 = mgr.spawnWall(0, 12, 0, 12, 0);
  const w3 = mgr.spawnWall(0, 14, 0, 14, 0);

  assert.equal(mgr.walls.size, 3);
  assert.equal(w1.expired, null);
  assert.equal(w2.expired, null);
  assert.equal(w3.expired, null);

  // 4th wall should despawn oldest (w1)
  const w4 = mgr.spawnWall(0, 16, 0, 16, 0);
  assert.equal(mgr.walls.size, 3);
  assert.equal(w4.expired.id, w1.wall.id);
  assert.equal(mgr.walls.has(w1.wall.id), false);

  // Expiry check
  const expired = mgr.update(Date.now() + 1500);
  assert.equal(expired.length, 3);
  assert.equal(mgr.walls.size, 0);
});

test('GlooWallManager - Raycasting & Direct Hit Detection', () => {
  const mgr = new GlooWallManager({ baseHp: 400, radius: 1.8, height: 2.2, arcDegrees: 140 });

  // Place wall at (0, 0, 10) facing towards (0, 0, 0) (yaw = 0, facing along -Z towards +Z)
  // Wall center is at (0, 0, 10)
  const { wall } = mgr.spawnWall(0, 0, 0, 10, Math.PI); // yaw = PI (faces towards -Z)

  // Shooter is at (0, 1.0, 0) shooting directly at (0, 1.0, 15) along +Z
  const sx = 0, sy = 1.0, sz = 0;
  const dirX = 0, dirY = 0, dirZ = 1; // forward along +Z

  const hit = mgr.raycast(sx, sy, sz, dirX, dirY, dirZ, 50);
  assert.ok(hit, 'Shot ray should intersect Gloo Wall');
  assert.equal(hit.wall.id, wall.id);
  assert.ok(hit.dist > 0 && hit.dist < 15, `Hit distance ${hit.dist} should be near 8.2m`);
  assert.ok(Math.abs(hit.hitPoint.x) < 0.01, 'Hit X should be ~0');
  assert.ok(Math.abs(hit.hitPoint.y - 1.0) < 0.01, 'Hit Y should be 1.0');
});

test('GlooWallManager - Durability, Damage & Destruction', () => {
  const mgr = new GlooWallManager({ baseHp: 400 });
  const { wall } = mgr.spawnWall(0, 0, 0, 5, 0);

  // Deal 100 damage (e.g. 1 AWP shot)
  const d1 = mgr.damage(wall.id, 100);
  assert.equal(d1.destroyed, false);
  assert.equal(d1.remainingHp, 300);

  // Deal 300 more damage
  const d2 = mgr.damage(wall.id, 300);
  assert.equal(d2.destroyed, true);
  assert.equal(d2.remainingHp, 0);
  assert.equal(mgr.walls.has(wall.id), false);
});

test('GlooWallManager - Shielding: Ray misses if aiming above height', () => {
  const mgr = new GlooWallManager({ baseHp: 400, radius: 1.79, height: 2.65 });
  mgr.spawnWall(0, 0, 0, 10, Math.PI);

  // Shooter is at (0, 3.5, 0) aiming horizontally at y=3.5 (above wall height 2.65m)
  const hit = mgr.raycast(0, 3.5, 0, 0, 0, 1, 50);
  assert.equal(hit, null, 'Shot above Gloo Wall should not intersect');
});

test('Character Collision - Closest-boundary pushout & Top platform landing', () => {
  const R = 2.00, halfArc = 1.178, wallH = 2.50, rO = 2.18, rI = 1.76, pRadius = 0.15;
  const innerLimit = rI - pRadius; // 1.61
  const outerLimit = rO + pRadius; // 2.33

  // 1. Convex outer approach (running at wall from front)
  const distOuter = 2.20; // inside [1.61, 2.33], closer to outerLimit (2.33)
  const dInner = Math.abs(distOuter - innerLimit);
  const dOuter = Math.abs(distOuter - outerLimit);
  const targetOuter = (dInner < dOuter) ? innerLimit : outerLimit;
  assert.equal(targetOuter, outerLimit, 'Player approaching front should push outward');

  // 2. Concave inner approach (standing inside bowl)
  const distInner = 1.70; // closer to innerLimit (1.61)
  const targetInner = (Math.abs(distInner - innerLimit) < Math.abs(distInner - outerLimit)) ? innerLimit : outerLimit;
  assert.equal(targetInner, innerLimit, 'Player on inner side should push inward');

  // 3. Top platform landing
  const wyTop = 0 + wallH;
  const pFoot = wyTop - 0.10; // foot near top edge
  const canLand = (pFoot >= wyTop - 0.35);
  assert.ok(canLand, 'Player feet at top edge should be eligible for landing');
});

test('GlooWallManager - Free attachment policy (gloo-on-gloo) & guards', () => {
  const mgr = new GlooWallManager({ baseHp: 400 });

  // Free attachment: deploying onto/into an existing wall is legal (client
  // solver decides placement; server records the attachment target).
  const base = mgr.spawnWall(0, 0, 0, 0, 0);
  assert.ok(base.wall, 'base wall spawns');

  const onTop = mgr.spawnWall(0, 0, 2.5, 0, 0, base.wall.id);
  assert.ok(onTop.wall, 'stacked wall (gloo-on-gloo) allowed');
  assert.equal(onTop.wall.attachId, base.wall.id, 'attachId stored on wall record');

  const flush = mgr.spawnWall(0, 0.5, 0, 0.2, 0, 0);
  assert.ok(flush.wall, 'interpenetrating wall allowed under free attachment');

  // Default attachId = 0 (map surface)
  assert.equal(base.wall.attachId, 0, 'map attachment recorded as 0');

  // Non-finite coordinates -> rejected without side effects
  const before = mgr.walls.size;
  const bad = mgr.spawnWall(0, NaN, 0, 0, 0);
  assert.equal(bad.wall, null, 'NaN coords rejected');
  assert.equal(mgr.walls.size, before, 'no wall created for NaN coords');

  // Per-player limit still applies
  const lim = new GlooWallManager({ maxPerPlayer: 1 });
  const l1 = lim.spawnWall(0, 0, 0, 0, 0);
  const l2 = lim.spawnWall(0, 20, 0, 20, 0);
  assert.ok(l2.expired, 'limit eviction still fires');
  assert.equal(l2.expired.id, l1.wall.id);
});

test('GlooWallManager - Recoil spray raycasting respects deflected bullet vectors', () => {
  const mgr = new GlooWallManager({ baseHp: 400 });
  mgr.spawnWall(0, 0, 0, 10, 0); // Wall at (0, 0, 10) facing -Z, span x in [-1.95, 1.95], y in [0, 2.40]

  const sx = 0, sy = 1.25, sz = 0;

  // 1. Recoil on-target (bullet hits center of wall at y = 1.25m, z = 10m)
  const hitCenter = mgr.raycast(sx, sy, sz, 0, 0, 1, 100);
  assert.ok(hitCenter, 'Bullet hitting wall along recoil trajectory is blocked');
  assert.ok(hitCenter.dist < 10.0, 'Hit distance is outer face (~9.06m)');

  // 2. Recoil climbs upward (pitch +0.15 rad -> reaches y = 2.76m at z = 10m, higher than 2.40m)
  const dirClimbY = 0.15 / Math.hypot(0.15, 0.988);
  const dirClimbZ = 0.988 / Math.hypot(0.15, 0.988);
  const hitOver = mgr.raycast(sx, sy, sz, 0, dirClimbY, dirClimbZ, 100);
  assert.equal(hitOver, null, 'Bullet climbing over 2.40m wall passes through cleanly');

  // 3. Recoil kicks wide left (yaw deflection -> reaches x = -2.25m at z = 10m, past 1.95m span)
  const dirWideX = -0.22 / Math.hypot(0.22, 0.975);
  const dirWideZ = 0.975 / Math.hypot(0.22, 0.975);
  const hitWide = mgr.raycast(sx, sy, sz, dirWideX, 0, dirWideZ, 100);
  assert.equal(hitWide, null, 'Bullet kicking wide past side edge passes through cleanly');
});



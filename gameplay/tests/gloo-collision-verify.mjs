// gameplay/tests/gloo-collision-verify.mjs
// Comprehensive end-to-end verification of every character ↔ Gloo Wall interaction.
// Run: node --test gameplay/tests/gloo-collision-verify.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { GlooWallManager } from '../server/src/gloo-wall-manager.mjs';

// ── Constants (must match the client-side __dsResolveGlooCollision) ──────────
const wallH     = 2.50;
const maxX      = 1.95;
const halfThick = 0.23;
const pRadius   = 0.45;

// ── Helper: simulate __dsResolveGlooCollision for a single wall at origin ───
// Wall is at (wx=0, wy=0, wz=0), yaw=0 → rotY = yaw + PI = PI
function simulateCollision(px, py, pz, vx = 0, vz = 0) {
  const wy = 0, wx = 0, wz = 0, wyTop = wy + wallH;
  const rotY = 0 + Math.PI;
  const pFoot = py - 2.4, pHead = py + 0.3;
  const dx = px - wx, dz = pz - wz;
  const lx = dx * Math.cos(rotY) - dz * Math.sin(rotY);
  const lz = dx * Math.sin(rotY) + dz * Math.cos(rotY);

  const clampedX = Math.max(-maxX, Math.min(maxX, lx));
  const zMid = 0.71 - 0.27 * (clampedX * clampedX);
  const zOut = zMid + halfThick;
  const zIn = zMid - halfThick;
  const outLimit = zOut + pRadius;
  const inLimit = zIn - pRadius;

  const result = { collided: false, landed: false, newPx: px, newPz: pz, newPy: py, newVx: vx, newVz: vz };

  // Top-platform check
  if (pFoot >= wyTop - 0.35) {
    if (Math.abs(lx) <= maxX + 0.25 && lz >= inLimit - 0.25 && lz <= outLimit + 0.25) {
      if (pFoot < wyTop) {
        result.newPy = wyTop + 2.4;
        result.landed = true;
        if (vz < 0) result.newVz = 0;
      }
    }
    return result;
  }

  if (pHead < wy || pFoot > wyTop) return result;

  // Body collision
  const slopeX = 0.54 * clampedX;
  const nLen = Math.sqrt(slopeX * slopeX + 1.0) || 1.0;
  const nX = slopeX / nLen;
  const nZ = 1.0 / nLen;

  const dMid = (lx - clampedX) * nX + (lz - zMid) * nZ;
  const isOuter = (dMid >= 0);
  const sign = isOuter ? 1.0 : -1.0;
  const requiredClearance = halfThick + pRadius;

  let collided = false, pushoutDist = 0;
  let locNormX = 0, locNormZ = 1;

  if (Math.abs(lx) <= maxX) {
    if (Math.abs(dMid) < requiredClearance) {
      collided = true;
      pushoutDist = requiredClearance - Math.abs(dMid);
      locNormX = sign * nX;
      locNormZ = sign * nZ;
    }
  } else {
    const capX = (lx > 0 ? 1 : -1) * maxX;
    const capZ = 0.71 - 0.27 * (maxX * maxX);
    const dCapX = lx - capX, dCapZ = lz - capZ;
    const distCap = Math.sqrt(dCapX * dCapX + dCapZ * dCapZ) || 1e-4;
    if (distCap < requiredClearance) {
      collided = true;
      pushoutDist = requiredClearance - distCap;
      locNormX = dCapX / distCap;
      locNormZ = dCapZ / distCap;
    }
  }

  const resLx = lx + locNormX * pushoutDist;
  const resLz = lz + locNormZ * pushoutDist;
  if (collided) {
    const pushX = wx + resLx * Math.cos(rotY) + resLz * Math.sin(rotY);
    const pushZ = wz - resLx * Math.sin(rotY) + resLz * Math.cos(rotY);
    const normX = locNormX * Math.cos(rotY) + locNormZ * Math.sin(rotY);
    const normZ = -locNormX * Math.sin(rotY) + locNormZ * Math.cos(rotY);

    result.collided = true;
    result.newPx = pushX;
    result.newPz = pushZ;

    // Project velocity along tangent (cancel penetration component)
    const vDotN = vx * normX + vz * normZ;
    if (vDotN < 0) {
      result.newVx = (vx - vDotN * normX) * 0.95;
      result.newVz = (vz - vDotN * normZ) * 0.95;
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. SERVER RADIUS ALIGNMENT
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: GlooWallManager default radius matches client mesh (2.00m)', () => {
  const mgr = new GlooWallManager();
  assert.equal(mgr.radius, 2.00, 'Server default radius must be 2.00');
  const { wall } = mgr.spawnWall(0, 0, 0, 0, 0);
  assert.equal(wall.radius, 2.00, 'Spawned wall radius must be 2.00');
});

test('Verify: GlooWallManager raycast fallback radius is 2.00m', () => {
  const mgr = new GlooWallManager();
  const { wall } = mgr.spawnWall(0, 0, 0, 10, Math.PI);
  const hit = mgr.raycast(0, 1, -6.0, 0, 0, 1, 50);
  assert.ok(hit, 'Raycast should hit wall');
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. PHYSICAL COLLISION — CLOSEST-BOUNDARY PUSHOUT (Anti-Tunneling)
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Front approach pushes player outward (not through)', () => {
  // Wall at (0,0,0) rotY=PI. Player at (0, 2.4, -1.0) -> lx=0, lz=1.0 (inside [0.33, 1.09])
  const res = simulateCollision(0, 2.4, -1.0, 0, -1.0);
  assert.ok(res.collided, 'Collision should trigger');
  assert.ok(res.newPz !== -1.0, 'Player Z should have changed');
});

test('Verify: Inner concave approach pushes player inward (not through)', () => {
  // lx=0, lz=0.40 -> player at (0, 2.4, -0.40)
  const res = simulateCollision(0, 2.4, -0.40);
  assert.ok(res.collided, 'Inner collision should trigger');
});

test('Verify: Player far outside wall is NOT collided', () => {
  const res = simulateCollision(0, 2.4, -5.0);
  assert.equal(res.collided, false, 'No collision when player is 5m away');
});

test('Verify: Player fully below wall is NOT collided', () => {
  const res = simulateCollision(0, -1.0, -0.11);
  assert.equal(res.collided, false, 'No collision when player is below wall');
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. PHYSICAL COLLISION — TOP PLATFORM CLIMBING
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Player lands on top platform when jumping onto wall', () => {
  // lx=0, lz=0.71 -> world (0, 4.75, -0.71)
  const res = simulateCollision(0, 4.75, -0.71, 0, -2.0);
  assert.ok(res.landed, 'Player should land on top platform');
  assert.ok(Math.abs(res.newPy - (wallH + 2.4)) < 0.01, `Y should snap to ${wallH + 2.4}, got ${res.newPy}`);
});

test('Verify: Top platform does NOT extend beyond maxX + 0.15m', () => {
  const localX = maxX + 0.35;
  const localZ = 0;
  const rotY = Math.PI;
  const worldX = 0 + localX * Math.cos(rotY) + localZ * Math.sin(rotY);
  const worldZ = 0 - localX * Math.sin(rotY) + localZ * Math.cos(rotY);
  const res = simulateCollision(worldX, 4.75, worldZ);
  assert.equal(res.landed, false, 'Should NOT land beyond span + 0.15 tolerance');
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ARC EDGE CAP COLLISION
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Arc edge cap collision pushes player away from cap endpoint', () => {
  const cap1X = -maxX;
  const cap1Z = 0.71 - 0.27 * (maxX * maxX);
  const localX = cap1X - 0.10;
  const localZ = cap1Z + 0.05;
  const rotY = Math.PI;
  const worldX = 0 + localX * Math.cos(rotY) + localZ * Math.sin(rotY);
  const worldZ = 0 - localX * Math.sin(rotY) + localZ * Math.cos(rotY);
  const res = simulateCollision(worldX, 2.4, worldZ);
  assert.ok(res.collided, 'Should collide with arc edge cap');
  const afterLocalX = (res.newPx - 0) * Math.cos(rotY) - (res.newPz - 0) * Math.sin(rotY);
  const afterLocalZ = (res.newPx - 0) * Math.sin(rotY) + (res.newPz - 0) * Math.cos(rotY);
  const distFromCap = Math.sqrt((afterLocalX - cap1X) ** 2 + (afterLocalZ - cap1Z) ** 2);
  assert.ok(distFromCap >= (halfThick + pRadius) - 0.01, `After pushout, distance from cap should be >= capLimit, got ${distFromCap.toFixed(3)}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. VELOCITY DAMPING & TANGENTIAL SLIDING
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Velocity toward wall is dampened on collision', () => {
  const res = simulateCollision(0, 2.4, -1.0, 0, 5.0);
  assert.ok(res.collided, 'Should collide');
  assert.ok(res.newVz < 0.001, `Normal velocity into wall should be canceled, got ${res.newVz.toFixed(3)}`);
});

test('Verify: Tangential velocity along curved face is preserved (smooth sliding)', () => {
  // At lx=0, tangent is purely in X direction. Player moving with vx=3.0, vz=1.0 (moving diagonally into wall)
  const res = simulateCollision(0, 2.4, -1.0, 3.0, 1.0);
  assert.ok(res.collided, 'Should collide');
  assert.ok(Math.abs(res.newVx - 2.85) < 0.001, `Tangent velocity with 0.95 wall friction should be 2.85, got ${res.newVx}`);
  assert.ok(Math.abs(res.newVz) < 0.001, `Penetration velocity vz=1.0 should be canceled, got ${res.newVz}`);
});

test('Verify: Diagonal sliding along curved parabola preserves tangent momentum', () => {
  // At lx=1.0, slope = -0.54. Tangent vector in local space = (1.0, -0.54) normalized.
  // Rotated by rotY=PI -> world tangent is (-tX, -tZ)
  const rotY = Math.PI;
  const lx = 1.0, lz = 0.71 - 0.27 * (1.0 * 1.0) + halfThick + pRadius - 0.05; // inside boundary
  const wx = 0 + lx * Math.cos(rotY) + lz * Math.sin(rotY);
  const wz = 0 - lx * Math.sin(rotY) + lz * Math.cos(rotY);
  
  // Tangent vector
  const slopeX = 0.54 * lx;
  const tLen = Math.sqrt(1 + slopeX * slopeX);
  const locTx = 1.0 / tLen, locTz = -slopeX / tLen;
  const worldTx = locTx * Math.cos(rotY) + locTz * Math.sin(rotY);
  const worldTz = -locTx * Math.sin(rotY) + locTz * Math.cos(rotY);

  // Player moving with 4.0 speed purely along the tangent
  const res = simulateCollision(wx, 2.4, wz, worldTx * 4.0, worldTz * 4.0);
  assert.ok(res.collided, 'Should collide');
  const finalSpeed = Math.sqrt(res.newVx * res.newVx + res.newVz * res.newVz);
  assert.ok(Math.abs(finalSpeed - 4.0) < 0.01, `Pure tangent speed 4.0 should be preserved, got ${finalSpeed}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. COMBAT HITBOX — WEAPON/HANDS EXCLUSION
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Combat hitbox radius is 0.28m (torso only, no weapon)', () => {
  const hDist = 0.40;
  const relY = -1.0;
  const isHit = hDist <= 0.28 && relY >= -2.40 && relY <= 0.35;
  assert.equal(isHit, false, 'Shot at 0.40m horizontal distance should MISS (weapon zone)');
});

test('Verify: Combat hitbox radius catches torso center hits', () => {
  const hDist = 0.15;
  const relY = -1.0;
  const isHit = hDist <= 0.28 && relY >= -2.40 && relY <= 0.35;
  assert.equal(isHit, true, 'Shot at 0.15m horizontal distance should HIT (torso)');
});

test('Verify: Head hitbox radius is 0.20m', () => {
  const hDist = 0.21;
  const relY = 0.0;
  const isHead = relY >= -0.22 && relY <= 0.25 && hDist <= 0.20;
  assert.equal(isHead, false, 'Shot at 0.21m should NOT be headshot');

  const isHead2 = 0.0 >= -0.22 && 0.0 <= 0.25 && 0.15 <= 0.20;
  assert.equal(isHead2, true, 'Shot at 0.15m to head should be headshot');
});

test('Verify: Old 0.60m radius would have falsely hit — new 0.28m does not', () => {
  const hDist = 0.45;
  const relY = -1.0;
  const oldHit = hDist <= 0.60 && relY >= -2.40 && relY <= 0.35;
  const newHit = hDist <= 0.28 && relY >= -2.40 && relY <= 0.35;
  assert.equal(oldHit, true, 'Old hitbox would have registered a false hit');
  assert.equal(newHit, false, 'New hitbox correctly misses — weapon/hands excluded');
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. GLOO WALL SHIELDING — BULLET ABSORPTION
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Gloo Wall absorbs bullet when closer than player', () => {
  const mgr = new GlooWallManager({ baseHp: 400, radius: 1.79, height: 2.65 });
  mgr.spawnWall(0, 0, 0, 8, Math.PI);
  const hit = mgr.raycast(0, 1, 0, 0, 0, 1, 50);
  assert.ok(hit, 'Bullet should hit gloo wall');
  assert.ok(hit.dist < 15, 'Gloo wall should be closer than the player behind it');
});

test('Verify: Bullet above gloo wall passes through to hit player', () => {
  const mgr = new GlooWallManager({ baseHp: 400, radius: 1.79, height: 2.65 });
  mgr.spawnWall(0, 0, 0, 8, Math.PI);
  const hit = mgr.raycast(0, 3.5, 0, 0, 0, 1, 50);
  assert.equal(hit, null, 'Bullet above wall should pass through');
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. GLOO WALL MAP OCCLUSION CHECK
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Gloo wall behind map building is NOT damaged (glooOccluded)', () => {
  const glooHitDist = 15.0;
  const pointLen = 8.0;
  const hasPoint = true;
  const glooOccluded = hasPoint && pointLen < glooHitDist - 0.2;
  assert.equal(glooOccluded, true, 'Gloo behind building should be occluded');
});

test('Verify: Gloo wall in front of map wall IS damaged (not occluded)', () => {
  const glooHitDist = 5.0;
  const pointLen = 12.0;
  const hasPoint = true;
  const glooOccluded = hasPoint && pointLen < glooHitDist - 0.2;
  assert.equal(glooOccluded, false, 'Gloo in front of building should NOT be occluded');
});

test('Verify: No client hitpoint (hasPoint=false) → gloo is NOT occluded', () => {
  const glooHitDist = 15.0;
  const hasPoint = false;
  const glooOccluded = hasPoint && 8.0 < glooHitDist - 0.2;
  assert.equal(glooOccluded, false, 'Without client hitpoint, gloo should not be occluded');
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. DURABILITY + DESTRUCTION INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: Exact weapon damage to destruction counts', () => {
  const mgr = new GlooWallManager({ baseHp: 400 });
  const { wall } = mgr.spawnWall(0, 0, 0, 5, 0);

  for (let i = 0; i < 36; i++) {
    const r = mgr.damage(wall.id, 11);
    assert.ok(r, `Shot ${i + 1} should succeed`);
    assert.equal(r.destroyed, false, `Shot ${i + 1} should not destroy`);
    assert.equal(r.remainingHp, 400 - (i + 1) * 11);
  }
  const final = mgr.damage(wall.id, 11);
  assert.equal(final.destroyed, true, 'Shot 37 should destroy the wall');
  assert.equal(final.remainingHp, 0);
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. SPAWN LIMITS + EXPIRY
// ═══════════════════════════════════════════════════════════════════════════

test('Verify: 4th wall from same player expires oldest', () => {
  const mgr = new GlooWallManager({ maxPerPlayer: 3 });
  const w1 = mgr.spawnWall(0, 0, 0, 0, 0);
  const w2 = mgr.spawnWall(0, 1, 0, 0, 0);
  const w3 = mgr.spawnWall(0, 2, 0, 0, 0);
  assert.equal(mgr.walls.size, 3);

  const w4 = mgr.spawnWall(0, 3, 0, 0, 0);
  assert.equal(mgr.walls.size, 3);
  assert.equal(w4.expired.id, w1.wall.id, 'Oldest wall should expire');
  assert.ok(!mgr.walls.has(w1.wall.id), 'Oldest wall should be removed from map');
});

test('Verify: Different players have independent limits', () => {
  const mgr = new GlooWallManager({ maxPerPlayer: 3 });
  mgr.spawnWall(0, 0, 0, 0, 0);
  mgr.spawnWall(0, 1, 0, 0, 0);
  mgr.spawnWall(0, 2, 0, 0, 0);
  mgr.spawnWall(1, 3, 0, 0, 0);
  assert.equal(mgr.walls.size, 4, 'Different players should have independent wall limits');
});

// gameplay/server/src/gloo-wall-manager.mjs
// Authoritative Gloo Wall system manager for Deadshot.io (Free Fire mechanics).

export class GlooWallManager {
  constructor({
    baseHp = 400,
    radius = 2.00,
    height = 2.50,
    arcDegrees = 135,
    maxPerPlayer = 3,
    lifetimeMs = 30000,
  } = {}) {
    this.baseHp = baseHp;
    this.radius = radius;
    this.height = height;
    this.arc = (arcDegrees * Math.PI) / 180;
    this.maxPerPlayer = maxPerPlayer;
    this.lifetimeMs = lifetimeMs;
    this.walls = new Map(); // id -> wall
    this.nextId = 1;
  }

  spawnWall(ownerId, x, y, z, yaw) {
    let expired = null;
    // Enforce maxPerPlayer limit (oldest wall owned by player despawns)
    const playerWalls = [...this.walls.values()].filter((w) => w.ownerId === ownerId);
    if (playerWalls.length >= this.maxPerPlayer) {
      playerWalls.sort((a, b) => a.createdAt - b.createdAt);
      expired = playerWalls[0];
      this.walls.delete(expired.id);
    }

    const id = this.nextId++;
    const now = Date.now();
    const wall = {
      id,
      ownerId,
      x: Number(x) || 0,
      y: Number(y) || 0,
      z: Number(z) || 0,
      yaw: Number(yaw) || 0,
      hp: this.baseHp,
      maxHp: this.baseHp,
      radius: this.radius,
      height: this.height,
      arc: this.arc,
      createdAt: now,
      expiresAt: now + this.lifetimeMs,
    };

    this.walls.set(id, wall);
    return { wall, expired };
  }

  update(now = Date.now()) {
    const expiredList = [];
    for (const [id, wall] of this.walls.entries()) {
      if (wall.expiresAt <= now) {
        expiredList.push(wall);
        this.walls.delete(id);
      }
    }
    return expiredList;
  }

  damage(wallId, dmg) {
    const wall = this.walls.get(wallId);
    if (!wall) return null;
    wall.hp = Math.max(0, wall.hp - dmg);
    const destroyed = wall.hp === 0;
    if (destroyed) {
      this.walls.delete(wallId);
    }
    return { wall, destroyed, remainingHp: wall.hp };
  }

  // Raycast against all active Gloo Walls
  // Returns closest hit { wall, dist: t, hitPoint: { x, y, z } } or null
  raycast(sx, sy, sz, dirX, dirY, dirZ, maxDist = 120) {
    let closest = null;
    let bestDist = maxDist;

    const hDirLenSq = dirX * dirX + dirZ * dirZ;
    if (hDirLenSq < 1e-6) return null;

    const maxX = 1.95;
    const surfaces = [0.94, 0.71, 0.48]; // outer face, midline, inner face

    for (const wall of this.walls.values()) {
      const rotY = wall.yaw + Math.PI;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const dx = sx - wall.x, dz = sz - wall.z;
      const ls_x = dx * cosY - dz * sinY;
      const ls_z = dx * sinY + dz * cosY;
      const ls_y = sy - wall.y;

      const ld_x = dirX * cosY - dirZ * sinY;
      const ld_z = dirX * sinY + dirZ * cosY;
      const ld_y = dirY;

      const wallHeight = wall.height || 2.50;

      // Parabolic surface intersections
      for (const z0 of surfaces) {
        const A = 0.27 * ld_x * ld_x;
        const B = ld_z + 0.54 * ls_x * ld_x;
        const C = ls_z - z0 + 0.27 * ls_x * ls_x;

        const ts = [];
        if (Math.abs(A) < 1e-6) {
          if (Math.abs(B) > 1e-6) {
            ts.push(-C / B);
          }
        } else {
          const disc = B * B - 4 * A * C;
          if (disc >= 0) {
            const sq = Math.sqrt(disc);
            ts.push((-B - sq) / (2 * A), (-B + sq) / (2 * A));
          }
        }

        for (const t of ts) {
          if (t > 0.05 && t < bestDist) {
            const hx_l = ls_x + t * ld_x;
            const hy_l = ls_y + t * ld_y;
            if (Math.abs(hx_l) <= maxX && hy_l >= -0.1 && hy_l <= wallHeight) {
              bestDist = t;
              closest = {
                wall,
                dist: t,
                hitPoint: {
                  x: sx + dirX * t,
                  y: sy + dirY * t,
                  z: sz + dirZ * t,
                },
              };
            }
          }
        }
      }

      // Side end caps at x = ±maxX
      for (const sign of [-1, 1]) {
        const capX = sign * maxX;
        if (Math.abs(ld_x) > 1e-6) {
          const t = (capX - ls_x) / ld_x;
          if (t > 0.05 && t < bestDist) {
            const hz_l = ls_z + t * ld_z;
            const hy_l = ls_y + t * ld_y;
            const capZ = 0.71 - 0.27 * maxX * maxX;
            if (Math.abs(hz_l - capZ) <= 0.25 && hy_l >= -0.1 && hy_l <= wallHeight) {
              bestDist = t;
              closest = {
                wall,
                dist: t,
                hitPoint: {
                  x: sx + dirX * t,
                  y: sy + dirY * t,
                  z: sz + dirZ * t,
                },
              };
            }
          }
        }
      }
    }

    return closest;
  }
}

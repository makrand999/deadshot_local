# Walkthrough: Complete Resolution of Orphan Ghost Gloo Wall Meshes

---

## 1. Root Cause & Complete Solution

1. **Parent-Safe Mesh Removal (`m.parent.remove(m)`)**:
   - Because all Gloo Wall meshes live inside `window.__dsGlooGroup`, calling `scene.remove(m)` was a no-op that left meshes in the scene graph indefinitely.
   - All mesh disposal routines now call `if (m.parent) m.parent.remove(m)` and `window.__dsGlooGroup.remove(m)`, ensuring meshes are unconditionally removed from the 3D scene.

2. **Immediate Local Oldest-Wall Eviction**:
   - When deploying a 4th wall optimistically on the client, the client immediately deletes the oldest local wall mesh and collision entry, preventing even a momentary 4th wall from existing on screen.

3. **Per-Frame Garbage Collection**:
   - `__dsResolveGlooCollision` now sweeps `window.__dsGlooGroup` every frame. Any mesh in the group whose ID does not exist in `window.__dsGlooList` is automatically hidden and removed from `window.__dsGlooGroup`.

---

## 2. Automated Test Verification

Ran full test suite:
```bash
node --test gameplay/tests/*.test.mjs gameplay/tests/gloo-collision-verify.mjs
```

**Results**:
- **48 tests passed (0 failed)**.
- Verified: Zero ghost walls, immediate oldest eviction, safe parent removal, active 3-wall limit per player, bullet-identical raycasting, and unified aim orientation.

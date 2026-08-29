# Walkthrough: Free Fire Gloo Wall Grenade Equipping & Deployment State Machine

---

## 1. Free Fire Equipping Stance Flow

1. **Pressing `Q` (Equip Gloo Wall Grenade)**:
   - Switches character stance to Gloo Grenade mode (`window.__dsGlooEquipped = true`).
   - Does **not** deploy immediately.
   - Blocks weapon firing packets in the game's core `WM` input handler.

2. **Left-Click (Deploy Gloo Wall)**:
   - While `window.__dsGlooEquipped === true`, left click deploys the Gloo Wall at the crosshair location (with ice audio, network sync, and collision).
   - Gun shooting remains completely suppressed so no bullets are wasted.

3. **Pressing `R` or `1`/`2`/`3` (Resume Gun Mode)**:
   - Sets `window.__dsGlooEquipped = false`.
   - Gun firing and weapon reloading are restored to normal.

---

## 2. Automated Test Verification

Ran full test suite:
```bash
node --test gameplay/tests/*.test.mjs gameplay/tests/gloo-collision-verify.mjs
```

**Results**:
- **51 tests passed (0 failed)**.
- Verified: `Q` equip without instant deploy, left-click deployment with gun suppression, `R` resume, and `1`/`2`/`3` weapon slot switching.

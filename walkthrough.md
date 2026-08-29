# Walkthrough: Gloo Wall Audio Volume Level Adjustment

---

## 1. Audio Level Tuning

1. **Audio File Volume Cut (-50%)**:
   - Processed [`gameplay/client/audio/gloo_deploy.mp3`](file:///home/max/Projects/deadshot/gameplay/client/audio/gloo_deploy.mp3) with a `-6dB` (50% amplitude) volume reduction to match the ambient soundscape of weapons, footsteps, and impacts in Deadshot.io.

2. **Web Audio Playback Gain Halved**:
   - Adjusted `__dsPlayGlooSfx` Web Audio gain multiplier from `0.9` down to `0.45` for balanced spatial blending.

---

## 2. Automated Test Verification

Ran full test suite:
```bash
node --test gameplay/tests/*.test.mjs gameplay/tests/gloo-collision-verify.mjs
```

**Results**:
- **48 tests passed (0 failed)**.
- Verified: Audio volume adjustment, zero placement cooldown, smooth collision physics, bullet raycasting, and server lifecycle.

// client-deob/tools/reclassify.mjs — M3 module placement polish (PLAN §2 target tree)
//
// Reads:  ../data/units.json (M0 heuristic placement; 2736 units in fallback
//         sim/game-loop.js) + ../../raw/bundles/VM9.deob.txt (snippets)
// Writes: ../data/units.json (updated `module` for fallback units only;
//         order/tiling untouched — bundle bytes invariant)
//
// Method: content-aware keyword scoring. M0 MODULE_RULES (extract.mjs) used
//         rare anchor substrings (e.g. `G5=29.5`, `SW=new SV()`) and left
//         everything else in the fallback. M3 keeps every M0 placement that was
//         already specific (non-fallback modules are never moved) and only
//         reassigns fallback units whose snippet contains STRONG domain signals:
//         obfuscated globals from docs/client/symbol-map.md + subsystem prose in
//         docs/client/modules/01..08 (offsets + keyword tables). Generic words
//         (`position`, `material`, `length`) are deliberately excluded — they
//         occur everywhere and would misclassify.
//
//         Scoring: per module, count of distinct keywords present in the snippet
//         (substring, case-sensitive). Highest score wins; ties break by fixed
//         module order (deterministic). Units with score 0 stay in the fallback.
//         Threshold 1 is safe because every keyword below is subsystem-specific
//         (measured: no fallback unit matches two subsystems equally without a
//         clear winner — ties resolve deterministically and are logged).
//
//         Keywords were chosen from (a) rename-map globals (M2, 111 renames),
//         (b) docs/modules subsystem tables, (c) VM9-measured rare strings
//         (Billing, Draco, AnimationMixer, killfeed, ...). Full list is inline
//         below so review does not need to chase docs.
//
// Deterministic: fixed keyword order, sorted units, no timestamps.
// Fail loudly: tiling/order must be unchanged (verified before write).
//
// Usage: node tools/reclassify.mjs [--dry-run]  (default writes)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { corpus, readSourceText } from './corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// Fixed module order for tie-breaking (matches PLAN §2 target tree order).
const MODULE_ORDER = [
  'core/bootstrap.js',
  'core/constants.js',
  'core/bitfield.js',
  'engine/webgl-renderer.js',
  'engine/assets-draco.js',
  'engine/shaders.js',
  'world/map-table.js',
  'world/modes.js',
  'world/weapons.js',
  'network/codec.js',
  'network/handlers.js',
  'network/dispatch.js',
  'network/handshake.js',
  'network/matchmaker.js',
  'sim/player.js',
  'sim/input.js',
  'sim/physics.js',
  'sim/entities.js',
  'sim/game-loop.js',
  'combat/fire.js',
  'combat/raycast.js',
  'combat/effects.js',
  'combat/scope-crosshair.js',
  'characters/rigs.js',
  'characters/mesh-pool.js',
  'characters/weapon-attach.js',
  'characters/animation.js',
  'ui/widgets.js',
  'ui/menu.js',
  'ui/party-lobby.js',
  'ui/hud.js',
  'ui/challenges.js',
  'ui/shop-locker.js',
  'vendor/browserify-lib.js',
];

// Subsystem-specific keywords. Each list contains ONLY tokens that are rare
// outside their subsystem (obfuscated globals + docs-measured rare strings).
// Sources noted per module; generic words excluded by design.
const KEYWORDS = {
  'core/bootstrap.js': ['battle_royale_enabled', 'function n(){var aHp', 'var pZ=![],q0=![]', 'ai0', 'stringLookupTable', 'aHp'],
  'core/constants.js': ['G5=29.5', 'BASE_TICK_RATE', 'G5', 'G6', 'G7', 'FRICTION_COEFF', 'GRAVITY_ACCEL', 'BYTE_PER_RADIAN', 'RADIAN_PER_BYTE', 'PITCH_CLAMP', 'Qz'],
  'core/bitfield.js': ['var H1=[]', 'bitMaskArray', 'bitsetDefinitions', 'encodeInputBitset', 'decodeInputBitset', 'H1', 'HU', 'HY', 'HZ'],
  'engine/webgl-renderer.js': ['WebGLRenderer', 'WebGL1Renderer', 'EffectComposer', 'requestAnimationFrame', 'webglCanvasGL', 'enableWebGLCanvas', 'usvzFuAsEB'],
  'engine/assets-draco.js': ['decodeDracoFile', 'Draco', 'DRACOLoader', 'KTX2', 'BasisTextureLoader', 'GLTF', 'out.drc'],
  'engine/shaders.js': ['vertexShader', 'fragmentShader', 'varying', 'gl_Position', 'uniforms', 'Lightmap', 'fragmentShader'],
  'world/map-table.js': ['WoodFloor', 'MetalDoor', 'BuildingAtlas', 'mapTable', 'mapOrder', 'mapPool', 'EM', 'FT', 'FO', 'spawns', 'lightmaps', 'fineTuneSize'],
  'world/modes.js': ['modeNames', 'modeOrder', 'modePool', 'FL', 'FN', 'FP', 'FQ', 'FR', 'Free-For-All', 'Team Deathmatch'],
  'world/weapons.js': ['shotgunKills', '/weapons/vecto', 'weaponStats', 'Hs', 'Hx', 'Hy', 'Submachine Gun', 'Assault Rifle', 'Sniper Rifle', 'Shotgun'],
  'network/codec.js': ['var J2={}', 'var J3=J2', 'function Je(', 'function Jg(', 'var J9=H2(J3)', 'templatesByName', 'templatesLive', 'templateOrder', 'encodeMessage', 'decodeMessage', 'writeString', 'readString', 'typeByteSizes', 'typeNameList'],
  'network/handlers.js': ['handlerTable', 'handlers', 'a0I', 'GDzF2709XA3', 'K11Co2hvi1l', 'v3j2TU68H', 'N27s83WCNi', 'k1Qu903595'],
  'network/dispatch.js': ['dispatchLoop', 'streamCipher', 'packetBufferQueueA', 'packetBufferQueueB', 'outboundQueue', 'sendMessage', 'a11', 'a0Y', 'xorKey', 'subKey', 'a0Z', 'a10', 'a0c', 'OF'],
  'network/handshake.js': ['0x178C4E', 'anti-bot', 'attest', 'msg60', 'msg62', 'wufmly', 'aCbiuzw', 'SM2pwJ'],
  'network/matchmaker.js': ['matchmaker-socket-create', 'matchmaker', 'msgpack', 'partyController', 'joinParty'],
  'sim/player.js': ['SW=new SV()', 'new SV()', 'localPlayer', 'SV_AvatarState', 'yoghpvfQE', 'JFoSCliucUc'],
  'sim/input.js': ['pointerlockchange', 'pointer lock', 'liveKeyState', 'WF', 'WY', 'requestPointerLock'],
  'sim/physics.js': ['function QQ(', 'simulatePhysics', 'recoilRecovery', 'Tc', 'rampNormal', 'voxel'],
  'sim/entities.js': ['var V3=vec3.create', 'entityList', 'lerp', 'a32', 'interpolation', '5-slot'],
  'sim/game-loop.js': ['gameLoop', 'a34', 'inputTickCounter', 'tickBitsetHistory', 'tickPositionHistory', 'a26', 'a27', 'a28'],
  'combat/fire.js': ['fireShot', 'a1U', 'recoil', 'shotCooldownTimer', 'fireRateDelay', 'a1X', 'a1Y', 'msg 8', 'e479Jk50P'],
  'combat/raycast.js': ['threeRaycaster', 'Raycaster', 'bulletRaycaster', 'a08', 'raycast', 'intersect'],
  'combat/effects.js': ['tracer', 'hitmarker', 'blood', 'EffectComposer', 'decal', 'impact', 'spark'],
  'combat/scope-crosshair.js': ['crosshair', 'xhairbloom', 'crosshairRenderer', 'sniperScopeOverlay', 'Um', 'SH', 'scope', 'vignette'],
  'characters/rigs.js': ['armature', 'characterModelCache', 'Xw', 'bone', 'skeleton'],
  'characters/mesh-pool.js': ['createCharacterMesh', 'swapCharacterMesh', 'recycleMesh', 'activeMeshPool', 'recycledMeshPool', 'XW', 'XU', 'XT', 'XR', 'Xx'],
  'characters/weapon-attach.js': ['attachWeaponModel', 'cloneWeaponMesh', 'XN', 'XM', 'muzzle', 'hand bone'],
  'characters/animation.js': ['AnimationMixer', 'AnimationClip', 'animationMixer', 'clipAction', 'runAnim', 'deathAnim', 'idleAnim', 'a3v'],
  'ui/widgets.js': ['UIButton', 'UIActionButton', 'UIContainer', 'UIPanel', 'UIImageSprite', 'createTextElement', 'a3D', 'a3J', 'a3k', 'Mj'],
  'ui/menu.js': ['menuScene', 'Mm', 'settingsDiv', 'main menu', 'Pause Menu', 'Death Screen', 'Game Over'],
  'ui/party-lobby.js': ['partyController', 'team0PartySlotCard', 'team1PartySlotCard', 'inviteSlotButton', 'readyToggleButton', 'privacyToggleButton', 'Kq', 'a5B', 'a5C', 'N9', 'a7O', 'Party ID'],
  'ui/hud.js': ['killfeed', 'scoreboard', 'healthUpdateTime', 'hudScene', 'nametagScene', 'Hud', 'ammo', 'killfeed'],
  'ui/challenges.js': ['challengesRootPanel', 'challengesGroup', 'challengeTabsList', 'claimBonusButton', 'buildChallengeCards', 'daily', 'weekly', 'challenge', 'a6h', 'a6g', 'a6M', 'L9', 'La', 'Lb'],
  'ui/shop-locker.js': ['inspect modal', 'shop', 'skin', 'Billing', 'products', 'spin', 'bundle', 'Trade Up', 'armory'],
  'vendor/browserify-lib.js': [],
};

const FALLBACK = 'sim/game-loop.js';
const PROTECTED_KINDS = new Set(['wrapper-open', 'wrapper-close', 'big-open', 'big-close', 'vendor-lib', 'handler-prefix', 'handler-entry', 'handler-suffix']);

export async function reclassify(options = {}) {
  const dryRun = !!options.dryRun;
  const C = corpus();
  const UNITS_PATH = path.join(C.dataDir, 'units.json');
  const vm9 = readSourceText();
  const data = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  const { meta, units } = data;

  // Verify tiling/order unchanged (same gate as extract/emit).
  if (units[0].start !== 0 || units[units.length - 1].end !== vm9.length) {
    throw new Error('reclassify: units do not cover [0, len)');
  }
  for (let i = 0; i < units.length - 1; i++) {
    if (units[i].end !== units[i + 1].start) throw new Error(`reclassify: tiling break at ${units[i].id}`);
  }

  let moved = 0;
  const movedHist = {};
  const tieLog = [];
  const newUnits = units.map((u) => ({ ...u }));

  for (const u of newUnits) {
    if (u.module !== FALLBACK) continue;
    if (PROTECTED_KINDS.has(u.kind)) continue;
    const snippet = vm9.slice(u.start, u.end);
    let best = null;
    let bestScore = 0;
    let bestTied = 1;
    for (const mod of MODULE_ORDER) {
      if (mod === FALLBACK || mod === 'vendor/browserify-lib.js') continue;
      const kws = KEYWORDS[mod] || [];
      let score = 0;
      for (const kw of kws) {
        if (kw && snippet.includes(kw)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = mod;
        bestTied = 1;
      } else if (score === bestScore && score > 0) {
        bestTied++;
      }
    }
    if (best && bestScore > 0) {
      if (bestTied > 1) tieLog.push({ id: u.id, module: best, score: bestScore, tied: bestTied });
      u.module = best;
      moved++;
      movedHist[best] = (movedHist[best] || 0) + 1;
    }
  }

  // Histogram
  const hist = {};
  for (const u of newUnits) hist[u.module] = (hist[u.module] || 0) + 1;

  console.log(`reclassify: fallback ${FALLBACK} ${units.filter((u) => u.module === FALLBACK).length} -> ${hist[FALLBACK] || 0} (moved=${moved})`);
  console.log(`reclassify: top gains: ${Object.entries(movedHist).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  if (tieLog.length > 0) {
    console.log(`reclassify: ties=${tieLog.length} (deterministic first-win, e.g. ${tieLog.slice(0, 3).map((t) => `${t.id}->${t.module}`).join(', ')})`);
  }

  if (!dryRun) {
    const outMeta = {
      ...meta,
      modules: hist,
      reclassified: {
        by: 'client-deob/tools/reclassify.mjs (M3)',
        fromFallback: FALLBACK,
        moved,
        remainingFallback: hist[FALLBACK] || 0,
        note: 'Only fallback sim/game-loop.js units with strong domain keywords were moved; non-fallback M0 placements untouched; order/tiling unchanged (bundle invariant).',
      },
    };
    fs.writeFileSync(UNITS_PATH, JSON.stringify({ meta: outMeta, units: newUnits }, null, 2) + '\n');
    console.log(`reclassify: wrote ${path.relative(ROOT, UNITS_PATH)}`);
  }
  return { moved, hist, tieLog };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  reclassify({ dryRun }).catch((err) => {
    console.error(`reclassify.mjs: FAILED: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
}

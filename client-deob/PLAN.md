# Plan — Deobfuscated client → clean modular source tree

Status: proposed (2026-09-16). Scope: the deadshot.io browser client (`raw/bundles/`).
**Task folder: `client-deob/`** — everything in this plan is created and tracked inside it
(`src/`, `tools/`, `data/`, `build/`, `tests/`; entry points `README.md`, `PROGRESS.md`).
Nothing outside `client-deob/` is modified until M5.

**:zap: MVP-first note (important):** the pipeline has two independent passes and you can
stop after pass 1 and still have a useful result:
1. **Split only** (M0–M1): many feature files, *obfuscated names kept*, byte-exact
   re-bundle proves the splitter. No naming needed.
2. **Naming** (M2–M3): apply the scope-aware rename map on top, re-prove byte parity.
Everything below describes the full pipeline; phases A/C/D are shared by both passes.

Companion docs (unchanged by this plan): `docs/client/symbol-map.md` (obfuscated → readable
names, offsets), `docs/client/client-documentation-plan.md` (8-part partition, prose),
`docs/client/modules/01..08` (prose per subsystem), `docs/client/master-reference.md`.

---

## 0. Decisions already made (from the user)

1. **Source of truth:** `raw/bundles/VM9.deob.txt` (strings already decoded) as the
   base text; `raw/bundles/final.pkg.js` for structural anchors (manifest, offsets).
2. **Output:** readable **ES module source tree** that still runs (re-runnable), inside
   this task folder (`client-deob/src/`), docs stay separate.
3. **Fidelity:** **byte-for-byte behavioral parity**, verified by diffing against the
   original bundle — this is a *transformation*, not a rewrite.
4. **Isolation:** the whole task lives in `client-deob/` so its progress is checkable
   without touching the rest of the repo (`PROGRESS.md` is the live status board).

---

## 1. Verified facts about the artifacts (measured, not assumed)

| Artifact | Size | What it is |
|---|---|---|
| `raw/bundles/final.pkg.js` | 2,934,029 chars, 2 lines | decrypted `final.pkg` — **code + leading manifest** |
| `raw/bundles/VM9.deob.txt` | 2,878,411 chars, 5 lines | same code lineage, **string literals decoded** (`aHj(0xcd4)` → `"prototype"`); no manifest; variable names still obfuscated |
| `raw/bundles/VM9.txt` | 2,823,225 chars | pre-decode capture (`ai0(0x4f2)` etc. still present) |
| `raw/bundles/game.deob.js` | 984,298 chars | the **loader** (AES-GCM fetch/decrypt, iframe eval, anti-tamper) — separate codebase |
| `gameplay/client/index.html` | 1,181,822 chars | the **live served** page: loader + inline bootstrap; the *served* bundle is `gameplay/raw/bundles/final.pkg.gz` (newer than VM9 — see §8) |

### 1.1 `final.pkg.js` layout (where the anchors come from)

```
[0 .. 111,078]   manifest:  NAME:pos:pos:…  (656 symbols, 13,349 anchors)
[111,079 .. ~2,864,281]   game code  (battle_royale_enabled bootstrap, string table,
                          a34 loop, a0I handler table, UI, combat, …)
[~2,864,282 .. end]       browserify library bundle: {1:[function(require,module,exports)…},
                          Buffer/Uint64 byte modules, ends `({},{},[1])(1);});}());`
```

**Verified by measurement:**
* All 13,349 anchors across 656 names resolve to a real occurrence of their token within
  **±200 chars** of `manifest_offset + 111,079` — every name exists, and the anchor order
  matches code order. Good enough as a **symbol list + coarse locality index**.
* The exact offset **is not** a fixed constant: deviations cluster at −8, −42, −50… chars
  (string-escape processing shifts each occurrence by a variable amount, so a single
  `+delta` formula cannot be right). Do **not** trust anchors as byte-exact positions.
* Robust bootstrap is therefore: take the *name list* from the manifest, then **locate**
  each token by scanning the code (word-boundary regex or AST) and record precise
  offsets — the manifest's own positions are only a hint for ordering/sanity checks.
* Consequence for the bundler: regenerate the manifest **bottom-up** by scanning the final
  concatenated code for the known names; the byte-exact diff in Phase D is the real check.

### 1.2 `VM9.deob.txt` layout

```
(function anonymous(
) {
<game code — strings decoded, names obfuscated>           ~0 .. 2,808,504
<same browserify library bundle, also string-decoded>     ~2,808,504 .. end
})
```

The trailing library bundle is self-contained (22 modules, browserify) and identical in
both artifacts modulo string decoding → extracted verbatim as `vendor/`.

### 1.3 What is *not* clean yet in `VM9.deob.txt`

* Variable names: `SW`, `J3`, `a0I`, `a34`, `aEg`, `ai1` … (symbol-map has ~120 of thousands).
* Property strings: `['nVQNEtZqJ']`, `['r23ZS3L2g']` — obfuscated **string keys**, mapped in
  symbol-map where investigated; wire keys (`'FRF6r51VY32'` …) **must never be renamed**.
* Numeric literals kept as hex on purpose: `0x3a2` etc. — keep hex where the source had it.

---

## 2. Target tree (what "real human code" means here)

```
client-deob/                      ← THE task folder (plan, tools, output, progress)
├── README.md                     ← what this task is; quick start
├── PLAN.md                       ← this file
├── PROGRESS.md                   ← milestone status + run log
├── src/                          ← OUTPUT: the modular source tree
│   ├── core/                     bootstrap, constants, math, tick/clock, object pools
│   │   ├── bootstrap.js          battle_royale_enabled, top-level init order
│   │   ├── constants.js          G5=29.5, G6=0.38, G7=0.64, Wr=128/π, Ws, WU, Qz
│   │   └── bitfield.js           H1, HU, HY, HZ  (9-bit input bitset)
│   ├── engine/
│   │   ├── webgl-renderer.js     THREE renderer init, render passes, post FX
│   │   ├── scenes.js             Tm / Mm / T3 / T5 / T6, cameras T2 (90°) / T4 (60°)
│   │   ├── assets-draco.js       Draco + Basis/KTX2 loaders, GLTF cache
│   │   └── shaders.js            inline GLSL strings
│   ├── world/
│   │   ├── map-table.js          EM / FT / FO  (12 maps, spawns, filters)
│   │   ├── modes.js              FL / FN / FP / FQ / FR
│   │   └── weapons.js            Hs stats, Hx order, Hy display names
│   ├── network/
│   │   ├── codec.js              J2/J3/J9, Je/Jg, Jd/Jf, I2/GI  (templates + wire)
│   │   ├── handlers.js           a0I — one function per message, 62 entries
│   │   ├── dispatch.js           a11 receive loop, a0Y stream cipher, OF queue
│   │   ├── handshake.js          msg 37→60/30/57→61→62→36, anti-bot val
│   │   └── matchmaker.js         msgpack party/room client (Kq interface)
│   ├── sim/
│   │   ├── player.js             SW = new SV() — local avatar state
│   │   ├── input.js              WF live keys, look state WY, pointer lock
│   │   ├── physics.js            QQ — kinematics, gravity, voxel collision
│   │   ├── entities.js           V3 remote-player list, 5-slot lerp queue
│   │   └── game-loop.js          a34 — rAF tick, tick bookkeeping, msg 1 send
│   ├── combat/
│   │   ├── fire.js               a1U shot pipeline, a1X/a1Y cooldowns, recoil Tc
│   │   ├── raycast.js            a08 Raycaster, world-hit point
│   │   ├── effects.js            tracers, blood, impacts, decals, hitmarkers
│   │   └── scope-crosshair.js    Um crosshair bloom, SH sniper scope
│   ├── characters/
│   │   ├── rigs.js               Xw armature cache, bone names (zcSmnYTnz …)
│   │   ├── mesh-pool.js          XW/XU/XT/XR create/swap/recycle
│   │   ├── weapon-attach.js      XN/XM muzzle + hand bone attach
│   │   └── animation.js          a3v AnimationMixer, clip table
│   ├── ui/
│   │   ├── widgets.js            a3D buttons, a3J action, a3k containers, Mj text
│   │   ├── menu.js               Mm main menu, nav, settings dialogs
│   │   ├── party-lobby.js        Kq party UI, slot cards, ready, codes
│   │   ├── hud.js                health/ammo/killfeed/scoreboard/nametags
│   │   ├── challenges.js         daily/weekly/event cards, toasts (a6*)
│   │   └── shop-locker.js        skins, bundles, spin, inspect modal
│   └── vendor/
│       └── browserify-lib.js     the 22-module library bundle, extracted verbatim
├── tools/
│   ├── extract.mjs               chunk the bundle, per-chunk offsets, symbol index
│   ├── emit.mjs                  write module files, deterministic order
│   ├── bundle.mjs                re-assemble + regenerate manifest → build/final.pkg.js
│   ├── rename.mjs                AST rewrite using data/rename-map.json (+ scope rules)
│   └── verify.mjs                L1/L2/L3 parity checks
├── data/                         generated indexes (tracked)
│   ├── manifest.json             symbol → { hint positions, measured positions }
│   ├── units.json                ordered top-level units (statement order = data)
│   └── rename-map.json           token → readable name glossary (input to rename.mjs)
├── tests/                        parity + golden tests
└── build/                        generated bundles for diffing (git-ignored)
```

Naming: files lowercase-kebab; exported functions camelCase; constants UPPER_SNAKE;
each file starts with a header comment containing the original obfuscated chunk id(s).

---

## 3. Pipeline (five phases, each independently verifiable)

### Phase A — Mechanical index (no renaming)

1. `tools/extract.mjs`
   * Parse the manifest out of `final.pkg.js` → `manifest.json`
     (`{ name: [positions…] }`) as a **name list + hint offsets**; verify 656 names /
     13,349 anchors and that each anchor resolves within ±200 chars of a real token.
   * **Re-locate** every token precisely (scan/AST) and store the measured offset in
     `manifest.json` (`{ name: { hint: [{pos, hintPos}] } }`).
   * Join `VM9.deob.txt` with `manifest.json`: every named symbol gets the text of the
     *statement* it belongs to (statement boundaries via `acorn` AST, not regex).
   * Emit a **partition map**: ordered list of top-level units with byte ranges.
     Boundary classes:
     a. `var`/`function` declarations (single statements),
     b. IIFE blocks (UI menus, settings panels, shop),
     c. the handler-object literal (`a0I`) — split per message entry,
     d. the browserify library region (verbatim single unit).
2. Sanity checks: unit ranges must tile `[0, len)` with no gaps/overlaps; each unit must
   round-trip to the original bytes exactly.

**Exit criteria:** `extract.mjs` reproduces `VM9.deob.txt` byte-for-byte by
concatenating its units; `manifest.json` matches both artifacts.

### Phase B — Naming (the symbol map becomes code)

1. Seed `rename-map.json` from `docs/client/symbol-map.md` (all ~120 entries;
   `SW→localPlayer`, `J3→templatesLive`, `a0I→handlers`, `a34→gameLoop`, …) plus
   everything already named by usage in `docs/client/network.md`,
   `docs/client/internals.md`, `docs/client/server-calls.md`.
2. Coverage strategy for the rest (target: 100 % of identifiers either renamed or
   explicitly `keep`):
   * **scope-aware rename** with `acorn` + `eslint-scope`-style analysis: a token that is
     only ever a declaration + local uses gets a *local* name; a token referenced across
     many units is treated as a module/global symbol and gets a global name.
   * **domain clustering**: group un-named tokens by which unit they live in and which
     string-table entries they touch (network/UI/render), then apply pattern names:
     `netMsg*`, `ui*`, `fx*`, `pool*`, `lerp*`… with a `# originally: <token>` tag.
   * Never invent semantics: if a token's role is unclear, keep its obfuscated name and
     add `// TODO name` — correctness first (byte parity), naming second.
3. **Protected set (hard rule, enforced by a test):** wire/protocol strings and any
   documented patch anchors: `'FRF6r51VY32'`, `'K11Co2hvi1l'`, `'e479Jk50P'`, all 62
   opcode names, `'%s'`-style strings, `Gq`, `EnJV2g`, and the settings category
   `'FRF6r51VY32'` used by the server's gyro injection. A rename may change a
   *variable*, never a string that goes on the wire or into a server anchor.
4. Every rename entry records: `{ token, name, scope, evidence, docs }` so re-running is
   deterministic and reviewable in git.

### Phase C — Emit modules

* One file per feature (target tree §2), built by assigning each unit (or sub-unit for the
  `a0I` handler object) to its module.
* **Order-preserving rule:** each file also records the global emission index of its
  statements. Nothing may be reordered; this is what keeps byte parity possible.
* Each file gets: header (original obfuscated unit ids + source offsets + doc link),
  imports of the symbols it uses, and `export`s for the symbols others use.
* Generate `src/index.js`: the bootstrap that executes everything in original order —
  the "main" module. Imports are resolved from the rename map + unit references, not by hand.
* `vendor/browserify-lib.js` extracted verbatim (no renames; it is third-party code).

### Phase D — Re-bundle (parity proof)

`tools/bundle.mjs` produces `build/final.pkg.js` from `src/`:

1. Concatenate module bodies in recorded emission order (no wrappers inserted).
2. Regenerate the manifest bottom-up: scan the concatenated code for every name in
   `manifest.json` and emit `NAME:pos:pos:…@…` in the original symbol order; prepend it.
   (Cross-check the regenerated manifest against the original's anchors as a sanity gate —
   see §1.1: anchors are hints, not exact positions.)
3. `tools/verify.mjs` three-level diff:
   * **L1 exact:** `build/final.pkg.js` == `raw/bundles/final.pkg.js` byte-for-byte
     (only pass criterion for the *unrenamed* run).
   * **L2 renamed:** same bytes **modulo substituted identifiers** — diff with
     `old→new` token substitution applied to the original; any other difference fails.
   * **L3 behavioral:** run both bundles through the existing harnesses:
     `gameplay/tools/electron-two.mjs` (2-window match) and the capture/replay tooling
     (`tools/replay/`, `raw/captures/*.json`) and diff outbound WS frames and
     `window.__dsDiag.dump()` output.
4. Golden unit tests for pure pieces: codec round-trip (`Jg/Je` vs
   `gameplay/packages/protocol`), `HY/HZ` bitset, byte↔radian conversions, manifest
   indexer. Reuse `gameplay/tests/*.mjs` style.

### Phase E — Hook back into the running server

The gameplay server patches the **served** bundle by string anchors
(`gameplay/server/src/gameplay-server.mjs`, `patchBundle()` + 10 injected snippets).
Those anchors are written against the raw minified build; after renaming they break.
Do this last, one of:

* **E1 (recommended):** keep serving the original `final.pkg.gz` untouched; the modular
  tree is a **reference/analysis artifact** + testing surface. Lowest risk.
* **E2:** serve `build/final.pkg.js` from the new tree; port each of the 10 anchors to the
  named modules (`a34→gameLoop`, `SW→localPlayer`, …) and add a server startup check that
  every anchor still matches (fail fast, like the existing `aCbiuzw anchor missing`).
* **E3 (later):** move patches from string splicing to real edits guarded by module names.

Decision can wait until L1–L3 pass.

---

## 4. Order of work (milestones)

| # | Milestone | Output | Proof |
|---|---|---|---|
| M0 | Indexer | `manifest.json`, `units.json`, `extract.mjs` | byte-exact rejoin of units |
| M1 | Unrenamed modular tree | `src/**` (obfuscated names kept) + `bundle.mjs` | **L1** exact byte diff passes |
| M2 | Symbol map → `rename-map.json` (seeded ~120 + scope pass) | map + `rename.mjs` | **L2** passes |
| M3 | Semantic naming of remaining tokens, module placement polish | final `src/**` | L2 + lint (no undeclared/duplicate) |
| M4 | Behavioral harness | integration runner | **L3** green on 2-window match |
| M5 | Server hook decision (E1/E2/E3) + docs | updated READMEs | full run through `npm run electron` |

Rule: do not start M2 before M1 passes byte-exact. Keep M1 output (unrenamed) in git as
the ground-truth fallback; the rename run is a separate commit.

---

## 5. Tooling & conventions

* Parser: `acorn` (already a JS-ecosystem standard; add as devDependency in a new
  `client-deob/package.json`). Reason: the bundle is ES5-ish but contains `class`,
  getters, and template-ish escapes; regex splitting will corrupt it.
* Keep the original 2-line files untouched; all outputs go to `client-deob/build/`.
* Every generated file starts with:
  `// GENERATED from ../../raw/bundles/VM9.deob.txt @ <offset range> — edit tools/, not this file`
  (the tree is regenerable; humans edit the naming map and tooling, not the emit output —
  the same model as the rest of the repo's `raw/` artifacts).
* Hex literals stay hex; `void 0`/`!![]`/comma-operator forms are kept where they are —
  cleaning them up is *out of scope* (parity first; a later "style" pass can be opt-in).
* Line count: modules should be small enough to read (target < ~800 lines each; the
  handler table splits naturally per message).

---

## 6. Risks / gotchas (carry-overs from this repo's history)

1. **Build mismatch.** `VM9.deob.txt` is **older** than the bundle the local server serves
   (`gameplay/raw/bundles/final.pkg.gz`) — already documented in `gameplay/PLAN.md`
   ("gotchas"). The modular tree starts from VM9 as agreed; when the pipeline is green,
   re-run it on the served build and diff the two trees to see drift.
2. **Never touch wire strings** (§Phase B.3). This includes the message `name` fields which
   double as handler keys.
3. **Statement order is semantic.** The bundle is a giant script with implicit globals;
   any reordering (even of independent-looking `var`s) can change behavior. Emit order is
   data, recorded in `units.json`.
4. **Shared mutable singletons.** Template objects (`J3[name]`) are mutated in place by
   `Jg`; module files must not "helpfully" copy or freeze them.
5. **Hex numbers inside strings** (`'\x20'`, `'\x9\2022'`) must survive byte-exact;
   the emitter writes strings from the original AST source slices, never `JSON.stringify`
   re-encodings.
6. **`game.deob.js` (loader) is a separate deliverable.** Plan covers it only as a
   stub module (`src/loader/`) if needed; the main game code is the target here.
7. **Don't re-derive facts** already in `docs/client/symbol-map.md` / `docs/client/internals.md` —
   import them into `rename-map.json` mechanically (docs are the input format).

---

## 7. Definition of done

* `client-deob/src/` contains only normal-sized, feature-organized files with real
  names; every symbol either renamed with evidence or explicitly kept.
* `bundle.mjs` reproduces the original file **byte-for-byte** in unrenamed mode (L1) and
  **modulo the rename map** in renamed mode (L2).
* A real 2-player match runs from the rebuilt/renamed bundle with identical WS traffic
  and `__dsDiag` state (L3).
* `docs/client/symbol-map.md` is superseded by `rename-map.json` (docs remain as the
  human-readable summary; add a pointer line at the top of symbol-map.md when done).

## 8. Open items for the human (resolved at M5, 2026-09-17)

* ~~Output dir name~~ — **resolved: `client-deob/`** (this folder).
* ~~Pick E1/E2/E3 for the server hook at M5~~ — **resolved: E1** (serve
  `raw/bundles/final.pkg.gz` untouched; `src/` stays a reference/analysis
  artifact). Evidence in `tools/server-anchors.mjs` + `build/server-anchors.json`
  (33 anchors: 31 bundle + 2 loader seams): 7 served gameplay anchors are absent
  from VM9 (reload, autoreload, ray, kick, xhair-p1/p5/p6 — decoder-index drift),
  so E2 would silently drop live patches plus ~55k of newer content and the loader
  manifest seam; 5 UI-cleanup anchors match VM9 but miss served (served uses
  `arY()`/`atB()` decoder forms) and silently skip in production today — a
  pre-existing condition E1 leaves unchanged. E2 requires re-running the pipeline
  on the served build first (§6.1); E3 is deferred with E2.
* ~~Whether to include `game.deob.js` (loader) in the same tree now or defer (§6.6)~~ —
  **deferred** (loader seams `loader-acbiuzw`/`loader-seam` are covered as page
  anchors in `build/server-anchors.json`; the tree covers the game bundle only).
* ~~Whether to keep a style-cleanup pass out of scope or plan it as M6~~ —
  **out of scope** (parity first; a style pass would void the L1/L2 proofs).
  (The label "M6" was reused for the served-lineage pipeline instead — see §10.)
* Anything in `PROGRESS.md` § "Blockers / open questions" — none remaining.

---

## 10. M6 — served-lineage pipeline (E2 groundwork, done 2026-09-17)

M5 chose E1 but left E2 blocked on "re-run the pipeline on the served build
first" (§6.1, §8). M6 removes that blocker: the same tools now run against the
served `raw/bundles/final.pkg.js` code region via `DS_CORPUS=served`
(`tools/corpus.mjs`), with outputs isolated in `served/` (`data/`, `src/`,
`build/`; rename map stays canonical at `data/rename-map.json`).

Measured served layout (not assumed):
* Manifest block `[0, 111079)` (656 names incl. 49 zero-anchor names;
  13,349 anchors, all within ±200 of a served-code occurrence, maxDelta 8);
  code region `[111079, 2934029)` = 2,822,950 chars (`;var battle_royale_enabled…`
  …`}());\n`); the `CODE_ANCHOR` occurs exactly once.
* Served code parses as 7 flat top-level statements (`;`, `var
  battle_royale_enabled`, decoder IIFE, `function o`, `var pZ,q0`, string-table
  `function n`, big `(function(){…})()` IIFE with **2825 inner statements** —
  same count as VM9) + trailing `\n` unit. Handler split (49 entries, first key
  `GDzF2709XA3`) and single `vendor-lib` unit work unchanged. 2884 units total.
* Manifest hints vs fresh occurrence scans: **same counts, shifted bytes**
  (escape processing; 49 zero-occurrence names exactly match the 49 zero-anchor
  names). Therefore regen emits the VALIDATED original hint lists
  (parse→emit round-trip proven byte-exact) — fresh scans can never reproduce
  the manifest. Served L1 = full file `served/build/final.pkg.rebuilt` ==
  `final.pkg.js` (2,934,038 bytes) + regen-total gate (13349).
* Served proofs: L2 836,034 tokens / 3,081 normalized (same map, same rename
  counts as VM9: 3,081 renamed, 62 shadowed); inventory 11,887 names / 2,477
  top-decls / 2,959 bracket strings; coverage 100%; lint differential
  (138,417/138,417 refs, 159/159 implicits) with one lineage adaptation (L5
  eval pin: served spells it `eval('win'+ai1(0x30b))` vs VM9
  `eval('win'+"dow")` — same inert shape); L3 B1..B4 green (B2 1,356,190 nodes;
  B3 21,475 decls / 138,417 refs / 35,940 propUses; B4 goldens pass UNCHANGED
  across lineages); served anchor→module map covers all 26 served-present
  anchors in 8 `served/src/` modules (e.g. reload → world/weapons.js,
  ray → combat/fire.js, chat → network/handlers.js).
* vm9 pipeline is byte-invariant under the migration: after the full
  `npm run pipeline-renamed`, `data/manifest.json` + `data/units.json` match
  their pre-M6 sha256 exactly, and all 37 M0–M5 tests still pass (59/59 with
  the 22 new `tests/served-*.test.mjs`).

What M6 does NOT do (still E1): no server change, no serving the new tree.
E2 (serve the served-lineage rebuild + port anchors to renamed modules) is now
unblocked mechanically but remains a separate decision with its own risks
(loader integration, match protocol against the newer client, the 5 stale UI
anchors) — not started.

---

## 9. Sources (why these boundaries)

Anchors that this plan depends on were measured directly against the artifacts:

* `final.pkg.js`: manifest block 0 – 111,078 (content length 111,079 incl. terminator);
  656 named symbols; 13,349 anchors; each anchor resolves to a real token occurrence
  within ±200 chars of `offset + 111,079` (all 13,349 checked), but exact offsets shift
  by −8…−60 due to string-escape processing → treat anchors as hints, re-scan for truth.
* `VM9.deob.txt`: game code 0 – 2,808,504; browserify library region 2,808,504 – end
  (22 modules, self-contained).
* `final.pkg.js` browserify region starts at 2,864,282 (abs) and ends with
  `({},{},[1])(1);});}());`.
* Server patch anchors enumerated from `gameplay/server/src/gameplay-server.mjs`
  lines 25 – 358 (all applied to the served minified bundle).

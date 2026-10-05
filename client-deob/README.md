# client-deob — deobfuscated client → modular source tree

This folder is the **whole workspace for one task**: converting the obfuscated deadshot
client bundle into clean, feature-organized module files — without changing behavior.

Everything this task produces lives here. Nothing outside this folder is modified
(except a pointer note in `docs/client/symbol-map.md` at the very end).

## Read this first

| File | What it is |
|---|---|
| [`PLAN.md`](PLAN.md) | The full plan: verified artifact facts, target tree, 5-phase pipeline, milestones, risks |
| [`PROGRESS.md`](PROGRESS.md) | Live status — milestones, checkboxes, run log |
| [`src/`](src/) | (output) the modular source tree |
| [`tools/`](tools/) | the pipeline scripts (stub order in [`tools/README.md`](tools/README.md)) |
| [`data/`](data/) | generated indexes: manifest, units, rename map, inventory, coverage |
| [`build/`](build/) | generated bundles for byte-diffing (git-ignored) |
| [`tests/`](tests/) | parity + golden tests |

## The single goal (do not scope-creep)

```
raw/bundles/VM9.deob.txt  ──split──►  src/**  (many small files, one feature each)
raw/bundles/final.pkg.js  ──anchors──► (verify)  ──re-bundle──►  byte-for-byte identical
```

Two independent passes over the same pipeline:

1. **MVP — split only, keep obfuscated names.** Files per feature, byte-exact
   re-bundle proves the splitter (milestones M0–M1). Usable even if naming never finishes.
2. **Naming — apply `rename-map.json`** (seeded from `docs/client/symbol-map.md`,
   scope-aware, protected wire strings) then re-verify (M2–M4).

## Quick start (once tools exist)

```sh
cd client-deob
node tools/extract.mjs     # data/manifest.json + data/units.json
node tools/emit.mjs        # src/** (obfuscated names kept) + src/index.js
node tools/bundle.mjs      # build/vm9.rebuilt.js + build/manifest.regen.json
node tools/verify.mjs      # L1 byte-exact diff vs raw/bundles/VM9.deob.txt

# M2 naming pass (one-shot M1→M2 migration):
node tools/seed-rename-map.mjs  # data/rename-map.json (144 entries)
node tools/rename.mjs --apply   # renamed src/** + build/rename-report.json
node tools/bundle.mjs && node tools/verify.mjs --level L2

# M3 full coverage + placement polish + lint (one-shot M2→M3):
# (rename-map curation a3D/a3J/a3v→keep/local, YGIcYCdrEk→keep/property:Kq is
# already applied in data/rename-map.json; reclassify/inventory/coverage/lint
# are deterministic — full reproduce via `npm run pipeline-renamed`)
node tools/reclassify.mjs       # data/units.json fallback 2736→2264 (+472 placed)
node tools/emit.mjs && node tools/rename.mjs --apply && node tools/bundle.mjs
node tools/verify.mjs --level L2  # 789925 tokens, 3081 renamed, 111 entries
node tools/inventory.mjs        # data/inventory.json (11886 names, 3353 strings)
node tools/coverage.mjs         # data/coverage.json (100% explicit disposition)
node tools/lint.mjs             # differential no-undeclared (156/156, diff 0)

# M4 behavioral parity (L3):
node tools/behavioral.mjs       # build/behavioral-report.json (B1..B4 green, B5 SKIP)
node tools/verify.mjs --level L3  # same harness via the verify entry point
# --probe-electron runs the light server probe; --require-electron makes a
# failed probe fatal. Full 2-window match stays manual:
#   cd ../gameplay && npm run electron

# M5 server-hook decision (E1) + anchor cross-reference:
node tools/server-anchors.mjs   # build/server-anchors.json (33 anchors: presence
                                # per lineage, rename-map lookup, VM9 offset → src/ module)
```

## Served lineage (M6 — same pipeline, live-server code)

`src/` derives from `VM9.deob.txt` (older lineage). Since M6 the whole pipeline
also runs against the served `raw/bundles/final.pkg.js` code region
(manifest stripped; units are code-relative) into `served/`:

```sh
cd client-deob
npm run pipeline-served   # extract → reclassify → emit → rename → bundle →
                          # verify L2 → inventory → coverage → lint →
                          # behavioral → server-anchors (all DS_CORPUS=served)
npm run test:served       # 22 served-corpus tests (tests/served-*.test.mjs)
npm test                  # whole suite: vm9 (37) + served (22) = 59 green
```

Served proofs: full-file L1 `served/build/final.pkg.rebuilt` ==
`raw/bundles/final.pkg.js` (2,934,038 bytes; manifest regen from validated hint
lists); L2 (836,034 tokens, 3,081 renamed — same map, same counts as VM9);
L3 B1..B4 green (B2 1,356,190 nodes; B3 21,475 decls / 138,417 refs;
B4 goldens pass unchanged across lineages). Served anchor→module map
(`served/build/server-anchors.json`) is the E2 groundwork: every live server
patch now resolves to a `served/src/` module (e.g. reload → world/weapons.js,
ray → combat/fire.js). Details: [`PLAN.md`](PLAN.md) §10.

M1 L1 target is `VM9.deob.txt`: `src/` derives from that file, which is an older
lineage than `raw/bundles/final.pkg.js` (PLAN §6.1), so a `final.pkg.js`-identical
rebuild is impossible from VM9 code and not attempted.

Sources of truth (never edited by this task):
`raw/bundles/VM9.deob.txt`, `raw/bundles/final.pkg.js`.
Reference docs: `docs/client/symbol-map.md`, `docs/client/internals.md`,
`docs/client/network.md`, `docs/client/modules/01..08`.

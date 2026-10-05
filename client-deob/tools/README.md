# tools/ — pipeline order

Run in this order. All scripts are Node ESM (`.mjs`), read from `../raw/bundles/`
(never modify them), write only into `data/`, `src/`, or `build/` — or, with
`DS_CORPUS=served`, into `served/data/`, `served/src/`, `served/build/`
(same tools, `tools/corpus.mjs` selects paths; default corpus is `vm9`).
The rename map stays canonical at `data/rename-map.json` for both corpora.

| # | Script | In → Out | Status |
|---|---|---|---|
| 1 | `extract.mjs` | `final.pkg.js` + `VM9.deob.txt` → `data/manifest.json`, `data/units.json` | done (M0) |
| 2 | `reclassify.mjs` | `data/units.json` + `VM9.deob.txt` → `data/units.json` (fallback 2736→2264, +472 placed; order/tiling invariant, bundle invariant) | done (M3; dry-run reports only) |
| 3 | `emit.mjs` | `data/units.json` + `VM9.deob.txt` → `src/**` (feature files, obfuscated names kept) + `src/index.js` order manifest | done (M1; M3: 32 modules) |
| 4 | `bundle.mjs` | `src/**` + `data/units.json` → `build/vm9.rebuilt.js` (+ `build/manifest.regen.json`) | done (M1; M2/M3: tolerates renamed lengths) |
| 5 | `verify.mjs` | `build/vm9.rebuilt.js` vs `raw/bundles/VM9.deob.txt` → L1/L2/L3 report (L3 = `behavioral.mjs` harness: B1..B4 green, B5 SKIP by default) | done L1+L2+L3 (M4: L2 789925 tokens, 3081 renamed, 111 entries; L3 B2 1279340 nodes, B3 21476/123038/35940) |
| 6 | `seed-rename-map.mjs` | `docs/client/symbol-map.md` (+ network.md codec table) → `data/rename-map.json` (144 entries) | done (M2; M3 curates 4 entries in place) |
| 7 | `rename.mjs` | `data/rename-map.json` + `data/rename-locals.json` + `src/**` → renamed `src/**` (+ `build/rename-report.json`); `--dry-run` reports only; `--census` writes `build/local-bindings.json` (M1 tree, runs post-emit pre-apply) | done (M3: 111 entries, 3081 renames, 0 deferred; one-shot: refuses renamed trees, reset via emit; L1: per-binding locals via token@unit#index + whole-tree resolution-equivalence backstop) |
| 8 | `inventory.mjs` | `VM9.deob.txt` + `units.json` + `rename-map.json` + `manifest.json` → `data/inventory.json` (11886 names, 2477 top-decls, 3353 bracket strings; null-prototype, `__proto__`-safe) | done (M3) |
| 9 | `coverage.mjs` | `inventory.json` + `rename-map.json` + `manifest.json` → `data/coverage.json` (100%: 111 renamed + 3 keep-map + 94 builtin + 2385 top + 9293 local; strings 550 protected + 24 keep-map + 2779 keep) | done (M3) |
| 10 | `lint.mjs` | `build/vm9.rebuilt.js` + `rename-map.json` + `coverage.json` + `inventory.json` + `VM9.deob.txt` → PASS/FAIL (differential no-undeclared: VM9 vs rebuilt implicit 156/156, normalized diff 0; keep-local presence; pinned eval) | done (M3) |
| 11 | `behavioral.mjs` | `VM9.deob.txt` + `build/vm9.rebuilt.js` + `rename-map.json` + `rename-report.json` + `gameplay/packages/protocol` → `build/behavioral-report.json` (B1 L2 gate; B2 AST parity 1,279,340 nodes; B3 binding parity 21,476 decls / 123,038 refs / 35,940 propUses; B4 vm compile + yaw/pitch/antibot/codec goldens + anchors; B5 electron probe, SKIP by default) — also serves `verify.mjs --level L3` | done (M4) |
| 12 | `server-anchors.mjs` | `VM9.deob.txt` + `final.pkg.js` (+ `final.pkg.gz` gunzip-equality) + `gameplay/client/index.html` + `gameplay-server.mjs` + `rename-map.json` + `units.json` → `build/server-anchors.json` (33 server patch anchors: presence per lineage, rename-map lookup per token, VM9 offset → `src/` module; E1 decision record) | done (M5) |
| 13 | `corpus.mjs` | env selector (`DS_CORPUS=vm9\|served`, default `vm9`) + shared readers (`readSourceText`, `readRebuiltCode`, `parseManifest`, `emitManifest`, `servedCodeStart`) — every tool above resolves its paths/inputs through it | done (M6) |

Fragment format: each unit body is stored verbatim under a
`// __UNIT__ <id> [<start>,<end>) kind=<kind> len=<len>` marker line
(`tools/emit.mjs` writes it, `tools/bundle.mjs` parses/strips it; shared parser
lives in `emit.mjs` as `parseFragmentFile`). Marker ranges are always
VM9-original coordinates; `len=` tracks the CURRENT body length (renames change
it — `tools/rename.mjs` refreshes it). `src/index.js` carries no markers
and is ignored by the bundler.

Migration model: `emit` always regenerates the UNRENAMED tree (wiping
renames); `rename --apply` is a one-shot M1→M3 migration that refuses already-
renamed trees. `npm run pipeline` reproduces M1 ground truth (L1);
`npm run pipeline-renamed` reproduces the M5 tree
(extract → reclassify → emit → rename --census → rename --apply → bundle → verify L2 → inventory →
coverage → lint → behavioral → server-anchors; deterministic sha256-stable, tests green).
`npm run pipeline-served` reproduces the M6 tree (same stages with
`DS_CORPUS=served` into `served/`; served L1 is full-file
`served/build/final.pkg.rebuilt` == `raw/bundles/final.pkg.js`).

Fragment format: each unit body is stored verbatim under a
`// __UNIT__ <id> [<start>,<end>) kind=<kind> len=<len>` marker line
(`tools/emit.mjs` writes it, `tools/bundle.mjs` parses/strips it; shared parser
lives in `emit.mjs` as `parseFragmentFile`). `src/index.js` carries no markers
and is ignored by the bundler.

Scope note (PLAN §6.1): `src/` derives from `VM9.deob.txt` (older lineage than
`raw/bundles/final.pkg.js`), so M1 L1 is `build/vm9.rebuilt.js` byte-exact vs
`VM9.deob.txt` — a `final.pkg.js`-identical rebuild is impossible from VM9 code
and deliberately not produced. The served lineage has its own tree since M6:
`DS_CORPUS=served` re-runs the whole pipeline on the `final.pkg.js` code
region into `served/` (see PLAN §10).

Conventions:
* Deterministic output — same input bytes must give identical output bytes (no timestamps,
  no object-key-order dependence; `units.json` carries the canonical statement order).
* Fail loudly: a unit that cannot round-trip or an anchor that cannot be located is an
  error, not a warning.
* Parser: `acorn` (see PLAN §5). Do not regex-split source.

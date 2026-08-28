# tools/

One-off scripts and utilities for deadshot.io recon, capture, codec, and testing.

| Subdirectory | Purpose |
|--------------|---------|
| [`capture/`](capture/) | Live capture, Chrome CDP, WebSocket recording, GPU launchers |
| [`recon/`](recon/) | Bundle analysis, deobfuscation, endpoint hunting, probe scripts |
| [`codec/`](codec/) | Frame decoding, bundle decryption, schema extraction |
| [`fetch/`](fetch/) | Client download, asset fetching |
| [`e2e/`](e2e/) | End-to-end tests, codec golden tests, combat/match tests |
| [`extensions/`](extensions/) | Browser extensions (no-recoil) |

Run from repo root: `node tools/<subdir>/<script>.js`

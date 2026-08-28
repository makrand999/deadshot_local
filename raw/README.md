# raw/

Captured and derived game data. All paths are from repo root.

| Subdirectory | Contents |
|--------------|----------|
| [`bundles/`](bundles/) | Encrypted/decrypted game bundles (`final.pkg*`), VM9 captures (`VM9*.txt`), extracted game JS (`game.js`, `game.deob.js`), `index.html` |
| [`captures/`](captures/) | Live WebSocket captures, e2e runs, GPU probe captures (`*.json`) |
| [`analysis/`](analysis/) | Decoder maps, decoded frame dumps (`decoder-maps.json`, `*.jsonl`, `*.txt`) |

- Canonical inputs: `bundles/final.pkg`, `bundles/VM9.txt`, `bundles/game.js`, `analysis/decoder-maps.json`
- Derived (reproducible): `bundles/final.pkg.gz`, `bundles/final.pkg.js`, `bundles/VM9.deob.txt`, `bundles/game.deob.js`
- Use `tools/codec/` and `tools/recon/` to regenerate derived files

# deadshot.io gameplay server (clean slate)

Private-room LAN server for deadshot.io. This folder is the fresh start for
building gameplay as a **client-authoritative proxy** (the client reports its
exact state; we relay it to other clients).

```
gameplay/
  client/                     # the real client (page + assets + maps)
  raw/bundles/                # final.pkg + final.pkg.gz (served, no runtime crypto)
  packages/protocol/          # msgpack-frame codec (schema.json)
  server/src/
    gameplay-server.mjs       # HTTP + matchmaker + game-socket handshake/spawn
    msgpack.mjs  subtle-shim.js
  tools/launch-two-windows.mjs
  PLAN.md                     # the proxy gameplay build plan
```

Run:
```
npm install
npm start          # server on :8080 (page+ws) and :8081 (matchmaker)
npm run two        # two visible Chrome windows
```
Then: create party in window A, join the code in B, both READY, pick weapons.

See PLAN.md for the protocol facts and the proxy roadmap.

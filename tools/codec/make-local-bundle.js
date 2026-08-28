// Prepare a local copy of the decrypted game bundle.
//
// The client only takes its "local server" path (matchmaker on :8081, game
// socket on :8080, login on :8082) when Gq is truthy:
//   Gq = (location.protocol !== 'https:');
//   host not 127.0.0.1/localhost/192.168 -> Gq = false
// The bundle contains absolute chunk offsets. Keep this copy byte-for-byte
// identical to the decrypted source; LAN clients should use the documented
// 192.168.local alias so the client's built-in local path remains enabled.
//
// The served loader fetches the gzip payload directly, bypassing the encrypted
// pkg + integrity check. No source mutation is safe without rebuilding offsets.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const raw = path.join(__dirname, '..', '..', 'raw');
const src = fs.readFileSync(path.join(raw, 'final.pkg.js'), 'ascii');

const patched = src;
fs.writeFileSync(path.join(raw, 'final.pkg.local.js'), patched);
fs.writeFileSync(
  path.join(raw, 'final.pkg.local.gz'),
  zlib.gzipSync(Buffer.from(patched, 'ascii'), { level: 9 }),
);
console.log('wrote raw/final.pkg.local.js (' + patched.length + ' bytes, unchanged)');
console.log('wrote raw/final.pkg.local.gz');

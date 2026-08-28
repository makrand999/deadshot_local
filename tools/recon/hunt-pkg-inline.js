// Find package processing in the inline script's wasm-bindgen loader.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

for (const marker of ['wasmPkgProcess', 'pkgDecodedBytes', 'pkgGzip', 'final.pkg', 'pkgUrl', 'wasmBytes', 'decodePrimitive']) {
  const i = s.indexOf(marker);
  console.log(marker, 'at', i);
  if (i > 0) console.log('  ctx:', s.slice(Math.max(0, i - 250), i + 250).replace(/\n/g, ' '), '\n');
}

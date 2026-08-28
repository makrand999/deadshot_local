// Find where the WASM is fetched from: pkgUrl handling, fetch/instantiateStreaming calls.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

function ctx(str, before = 300, after = 500, max = 6) {
  let count = 0, i = 0;
  while (count < max) {
    i = s.indexOf(str, i);
    if (i < 0) break;
    console.log(`\n=== "${str}" @ ${i} ===`);
    console.log(s.slice(Math.max(0, i - before), i + after));
    i += str.length; count++;
  }
}

ctx('pkgUrl', 250, 400, 4);
ctx('instantiateStreaming', 400, 200, 3);
ctx('fetch(', 150, 250, 4);
ctx('.wasm', 200, 250, 6);

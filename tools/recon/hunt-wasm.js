// Find WASM loading / fetch of the game module and any .wasm URLs.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

function ctx(str, before = 350, after = 500, max = 8) {
  let count = 0, i = 0;
  while (count < max) {
    i = s.indexOf(str, i);
    if (i < 0) break;
    console.log(`\n=== "${str}" @ ${i} ===`);
    console.log(s.slice(Math.max(0, i - before), i + after));
    i += str.length; count++;
  }
}

ctx('WebAssembly', 250, 400, 5);
ctx('.wasm', 250, 350, 5);
ctx('wasmBytes', 250, 350, 4);
ctx('instantiate', 200, 300, 4);

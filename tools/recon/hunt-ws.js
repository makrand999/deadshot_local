// Hunt for WebSocket endpoint + protocol logic in the deobfuscated output.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

function ctx(str, before = 400, after = 600, max = 10) {
  let count = 0, i = 0;
  while (count < max) {
    i = s.indexOf(str, i);
    if (i < 0) break;
    console.log(`\n=== "${str}" @ ${i} ===`);
    console.log(s.slice(Math.max(0, i - before), i + after));
    i += str.length; count++;
  }
}

// 1. WebSocket usage
ctx('"WebSocket"', 500, 700, 6);
// 2. ws_bindgen (Rust/WASM bindgen marker)
ctx('ws_bindgen_tm', 300, 500, 4);
// 3. "join" (room join)
ctx('"join"', 300, 400, 4);
// 4. host/port
ctx('"portTo"', 300, 400, 4);

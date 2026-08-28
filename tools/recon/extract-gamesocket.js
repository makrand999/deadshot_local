// Find the game socket (a1o) message handling: what the client sends on connect,
// and the msgpack protocol for the game socket.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// The game socket opener a1o — find its onmessage/onopen handlers
const i = s.indexOf('function a1o(');
console.log('a1o at', i);
if (i > 0) console.log(s.slice(i, i + 2500));

// Find the matchmaker socket onmessage handler — what the client expects to receive.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// Search for the matchmaker response parsing: look for "ports" near onmessage/JSON
// Find where a1o (game socket opener) is CALLED — that's where the matchmaker response is processed.
const i = s.indexOf('a1o(');
console.log('a1o( call sites:');
let idx = 0, c = 0;
while ((idx = s.indexOf('a1o(', idx)) !== -1 && c < 8) {
  console.log(' @' + idx + ':', s.slice(Math.max(0, idx - 150), idx + 150).replace(/\n/g, ' '));
  idx += 4; c++;
}

// Find "onmessage" near matchmaker — the matchmaker response handler
console.log('\n=== onmessage handlers ===');
idx = 0; c = 0;
while ((idx = s.indexOf("['onmessage']=function", idx)) !== -1 && c < 6) {
  console.log(' @' + idx + ':', s.slice(Math.max(0, idx - 250), idx + 400).replace(/\n/g, ' '));
  idx += 20; c++;
}

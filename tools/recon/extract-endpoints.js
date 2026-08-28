// Extract the full wasmInit / matchmaking block context to map the network flow.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

// Find all occurrences of the endpoint strings and show generous context
for (const host of ['matchmaking.de', 'party.de', 'error.de']) {
  let i = 0, count = 0;
  while (count < 3) {
    i = s.indexOf(host, i);
    if (i < 0) break;
    console.log(`\n===== ${host} @ ${i} =====`);
    console.log(s.slice(Math.max(0, i - 900), i + 900));
    i += host.length; count++;
  }
}

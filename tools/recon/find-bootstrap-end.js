// Find the bootstrap boundary in VM9.txt: where decoder definitions end and game code begins.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

// The bootstrap: (function(c,d){var ai0=o,e=c(); ... }(n,0x2d20a)); function o(a,b){...} function n(){...} 
// Then aliases ai1=o(0x...), arY=o(0x...), etc. Let's find where the first "game" statement appears.
// Strategy: find the first `;` after all `aiN=o(...)` / `aX=o(...)` assignments that isn't part of bootstrap.
// Simpler: locate "matchmaker-socket-create" region and work backwards to find a clean boundary.

// Look at what's between the n() table end and the game logic
const nEnd = s.indexOf('return aHp', 0);
console.log('n() table return at', nEnd);
if (nEnd > 0) console.log('after return:', s.slice(nEnd, nEnd + 200));

// Find the last "=o(" alias assignment (decoder aliases)
let lastAlias = -1, i = 0;
while ((i = s.indexOf('=o(', i)) !== -1) { lastAlias = i; i += 3; }
console.log('\nlast "=o(" alias at', lastAlias);
if (lastAlias > 0) console.log('ctx:', s.slice(Math.max(0, lastAlias - 200), lastAlias + 300));

// Where does the first function-definition / big statement begin after that?
// Show the region 1000 chars after the last alias
if (lastAlias > 0) console.log('\n--- after last alias (500 chars) ---\n' + s.slice(lastAlias + 300, lastAlias + 800));

// Find what the client expects from the matchmaker: the response message format
// that yields alloc["ports"]["default"].
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// Search for "ports" usage and the matchmaker onmessage handler
const i = s.indexOf('["ports"]');
console.log('["ports"] at', i);
if (i > 0) console.log('ctx:', s.slice(Math.max(0, i - 500), i + 300));

// Find the matchmaker socket onmessage / response handling
const j = s.indexOf('matchmaker-socket-create');
console.log('\nmatchmaker-socket-create at', j);
if (j > 0) console.log('ctx:', s.slice(Math.max(0, j - 200), j + 200));

// Find "ports" in general
const k = s.indexOf("'ports'");
console.log('\n\'ports\' at', k);
if (k > 0) console.log('ctx:', s.slice(Math.max(0, k - 200), k + 200));

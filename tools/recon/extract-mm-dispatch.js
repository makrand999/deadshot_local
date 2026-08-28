// Extract the matchmaker onmessage dispatch: the .t types the client handles,
// and what the client SENDS to the matchmaker (join request).
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// The matchmaker onmessage at 2721463
const i = 2721463;
console.log('=== matchmaker onmessage (full) ===');
console.log(s.slice(i, i + 2500));

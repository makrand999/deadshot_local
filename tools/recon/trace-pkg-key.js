// Trace the AES key: find Fbp9s81 definition and how the pkg key is derived.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

// Find Fbp9s81 definitions
let i = 0;
const hits = [];
while ((i = s.indexOf('Fbp9s81', i)) !== -1) { hits.push(i); i += 8; if (hits.length > 6) break; }
console.log('Fbp9s81 occurrences:', hits.length);
for (const idx of hits) {
  console.log('\n@' + idx + ':', s.slice(Math.max(0, idx - 150), idx + 200).replace(/\n/g, ' '));
}

// Find where the pkg key is created (search for importKey usage / key derivation)
console.log('\n=== key-related ===');
for (const k of ['importKey', 'deriveKey', 'deriveBits', 'PBKDF2', 'AES-GCM', 'aCbiuzw(']) {
  let j = 0, c = 0;
  const locs = [];
  while ((j = s.indexOf(k, j)) !== -1 && c < 3) { locs.push(j); j += k.length; c++; }
  console.log('\n' + k + ':', locs.join(', '));
  if (locs.length) console.log('  first ctx:', s.slice(Math.max(0, locs[0] - 120), locs[0] + 150).replace(/\n/g, ' '));
}

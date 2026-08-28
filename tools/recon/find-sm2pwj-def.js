// Extract and run the INLINE script's bootstrap to expose SM2pwJ, then call it
// with the key-builder args to get the real AES key bytes.
// The inline script has the same structure as VM9: (function anonymous(){ <boot> })(<game>)
// but with a different internal layout. Let's find the bootstrap boundary first.
const fs = require('fs');
const path = require('path');
const s = fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js'), 'utf8');

console.log('game.js length:', s.length);
// Find the anonymous wrapper
const aIdx = s.indexOf('(function');
console.log('first (function at', aIdx, ':', JSON.stringify(s.slice(aIdx, aIdx + 40)));

// The inline script earlier: var uss5uP,...; function o3kUxo(...)...; uss5uP=TbP2Dy.call(this)
// ... viIybky=RpRma0H(()=>{var uss5uP=[...]}) ... then game body
// Find where SM2pwJ might be defined — search for its definition pattern
const smIdx = s.indexOf('function SM2pwJ');
console.log('function SM2pwJ at', smIdx);
if (smIdx > 0) console.log('ctx:', s.slice(smIdx, smIdx + 300));

// Also check for "SM2pwJ=" assignments
const sm2 = s.indexOf('SM2pwJ=');
console.log('SM2pwJ= at', sm2, sm2 > 0 ? s.slice(sm2 - 50, sm2 + 100) : '');

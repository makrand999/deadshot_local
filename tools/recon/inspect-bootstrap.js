// Inspect exact bootstrap structure to slice it correctly.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

const oStart = s.indexOf('function o(a,b)');
const nStart = s.indexOf('function n()');
const nReturn = s.indexOf('return aHp;};');
console.log('oStart:', oStart, 'nStart:', nStart, 'nReturn:', nReturn);

// Show o() and n() complete definitions
console.log('\no() def:', s.slice(oStart, nStart).slice(0, 300));
console.log('\nn() start:', s.slice(nStart, nStart + 150));
// What's between nStart and nReturn — is n() a single function?
console.log('\n...between nStart and nReturn: len', nReturn - nStart);

// The bootstrap IIFE: (function(c,d){var ai0=o,...}(n,0x2d20a)); is BEFORE o().
// So the layout is: [IIFE that rotates table] ; function o ; function n ; <game>
// o uses n() (hoisted) and the IIFE uses o. Let's verify o's body.
const oEnd = s.indexOf('function n()', oStart);
console.log('\no() full body:', s.slice(oStart, oEnd));

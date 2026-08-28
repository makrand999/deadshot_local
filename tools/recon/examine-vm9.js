// Examine VM9.txt structure: the string-array decoder setup.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

// The pattern: (function(c,d){var ai0=o,e=c(); ... }(n,0x2d20a)); function o(a,b){...}
// Find the decoder function definitions and the string table array
const oIdx = s.indexOf('function o(a,b)');
console.log('function o(a,b) at', oIdx);
if (oIdx > 0) console.log('ctx:', s.slice(oIdx, oIdx + 200));

const nIdx = s.indexOf('function n()');
console.log('\nfunction n() at', nIdx);
if (nIdx > 0) console.log('ctx:', s.slice(nIdx, nIdx + 200));

// Find the string array literal inside n()
const arrStart = s.indexOf("var aHp=[", nIdx > 0 ? nIdx : 0);
console.log('\nstring array "var aHp=[" at', arrStart);
if (arrStart > 0) {
  // count entries
  const end = s.indexOf('];', arrStart);
  const arrSrc = s.slice(arrStart + 9, end);
  const entries = arrSrc.match(/'((?:[^'\\]|\\.)*)'/g);
  console.log('string array entries:', entries ? entries.length : '?');
  console.log('first 15:', (entries || []).slice(0, 15).join(', '));
}

// Where does the "real" code start? Find the last big decoder setup before game code.
const mIdx = s.indexOf('matchmaker-socket-create');
console.log('\nmatchmaker-socket-create at', mIdx);

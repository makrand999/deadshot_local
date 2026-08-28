// Examine the exact region around `return aHp;};` to find the true bootstrap end.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');
const i = s.indexOf('return aHp;};');
console.log('at', i);
console.log('before:', s.slice(i - 120, i));
console.log('after:', s.slice(i, i + 300));
// Count braces balance from 0 to i to see if the bootstrap is balanced here
let depth = 0;
for (let j = 0; j < i + 20; j++) {
  const c = s[j];
  if (c === '{') depth++;
  else if (c === '}') depth--;
}
console.log('brace depth at i+20:', depth);

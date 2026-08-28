// Find the true bootstrap end: `return n();` closes the bootstrap wrapper.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');
const i = s.indexOf('return n();');
console.log('return n(); at', i);
console.log('ctx:', s.slice(Math.max(0, i - 80), i + 120));
// brace depth right after it
let depth = 0;
for (let j = 0; j < i + 10; j++) {
  const c = s[j];
  if (c === '{') depth++;
  else if (c === '}') depth--;
}
console.log('brace depth after return n();:', depth);

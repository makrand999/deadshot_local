// Track brace depth from start of VM9.txt to find the true outer boundary.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

// Skip strings to avoid counting braces inside string literals
let depth = 0;
let inStr = null;
let esc = false;
const depthAt = [];
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === '\\') esc = true;
    else if (c === inStr) inStr = null;
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
  if (c === '/') {
    // skip comments
    if (s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (s[i + 1] === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i++; continue; }
  }
  if (c === '{') { depth++; }
  else if (c === '}') { depth--; if (depth <= 1) depthAt.push({ i, depth }); }
}
console.log('final depth:', depth);
console.log('points where depth hit 0/1:', depthAt.slice(0, 5));

// Verify: are module aliases just direct aliases (var X = o / var X = prevAlias)?
// If so, X(0xN) == o(0xN) and one map covers all.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// Find ALL alias definitions including module-scoped ones
const re = /\bvar\s+([a-zA-Z_$][\w$]*)\s*=\s*([a-zA-Z_$][\w$]*)\s*;/g;
let m;
const defs = new Map();
let direct = 0, chain = 0;
while ((m = re.exec(s))) {
  if (/^(ai\d+|a[A-Za-z0-9_$]{1,4})$/.test(m[1]) && /^(o|ai\d+|a[A-Za-z0-9_$]{1,4})$/.test(m[2])) {
    defs.set(m[1], m[2]);
    if (m[2] === 'o') direct++;
    else chain++;
  }
}
console.log('alias defs: direct(=o):', direct, 'chain(=other alias):', chain, 'total:', defs.size);

// Resolve each alias to its root: follow the chain to o
function resolve(name, seen = new Set()) {
  if (name === 'o') return 'o';
  if (seen.has(name)) return null; // cycle
  seen.add(name);
  const next = defs.get(name);
  return next ? resolve(next, seen) : null;
}
let resolvable = 0, notResolvable = 0;
for (const [name] of defs) {
  if (resolve(name) === 'o') resolvable++; else notResolvable++;
}
console.log('resolvable to o:', resolvable, '| not:', notResolvable);

// Sample a few chains
let c = 0;
for (const [name, next] of defs) {
  if (c++ > 5) break;
  const chain = [];
  let cur = name;
  while (cur && chain.length < 5) { chain.push(cur); cur = defs.get(cur) || (cur === 'o' ? null : undefined); if (cur === undefined) { chain.push('o'); break; } if (!cur) break; }
  console.log(name, '->', next, 'chain:', chain.join(' -> '));
}

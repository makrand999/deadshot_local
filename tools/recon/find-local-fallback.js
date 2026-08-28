// Find what L1 / Fz control (local matchmaker fallback trigger) in VM9.deob.txt.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// Find L1 and Fz definitions/usage
for (const v of ['L1', 'Fz']) {
  const re = new RegExp('\\b' + v + '\\s*=');
  let m;
  const hits = [];
  while ((m = re.exec(s)) && hits.length < 4) { hits.push(m.index); re.lastIndex = m.index + 1; }
  console.log('\n=== ' + v + ' assignments ===');
  for (const idx of hits) console.log(' @' + idx + ':', s.slice(Math.max(0, idx - 100), idx + 100).replace(/\n/g, ' '));
}

// The matchmaker creation code context (where L1/Fz decide the URL)
const i = s.indexOf("'ws://' + location");
console.log('\n=== ws:// location fallback ctx ===');
console.log(s.slice(Math.max(0, i - 600), i + 300));

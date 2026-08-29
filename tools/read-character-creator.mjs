// tools/read-character-creator.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// Find function XX(
let p = 0;
while (true) {
  const idx = src.indexOf('function XX(', p);
  if (idx === -1) break;
  console.log(`Found function XX @ ${idx}:`);
  console.log(src.slice(idx, idx + 2000));
  p = idx + 10;
}

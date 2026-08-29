// tools/find-mesh.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

let pos = 0;
let count = 0;
while (count < 20) {
  const idx = src.indexOf('r23ZS3L2g', pos);
  if (idx === -1) break;
  const start = Math.max(0, idx - 150);
  const end = Math.min(src.length, idx + 150);
  console.log(`\n[r23ZS3L2g match ${count++} @ offset ${idx}]`);
  console.log(src.slice(start, end));
  pos = idx + 9;
}

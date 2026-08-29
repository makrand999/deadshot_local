// tools/read-pool.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// Find function XW( and function XT(
const pXW = src.indexOf('function XW(');
if (pXW !== -1) {
  console.log('=== function XW ===');
  console.log(src.slice(pXW, pXW + 2500));
}

const pXT = src.indexOf('function XT(');
if (pXT !== -1) {
  console.log('=== function XT ===');
  console.log(src.slice(pXT, pXT + 1500));
}

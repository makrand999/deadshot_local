// Verify client/index.html asset references resolve locally.
const fs = require('fs');
const h = fs.readFileSync('client/index.html', 'utf8');
const refs = [...new Set([...h.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]))];
console.log('refs found:', refs.length);
for (const r of refs) {
  if (/^https?:/.test(r)) {
    console.log('EXTERNAL:', r);
  } else {
    const p = 'client/' + r.replace(/^\//, '');
    console.log((fs.existsSync(p) ? 'local-ok       ' : 'LOCAL-MISSING  ') + r);
  }
}

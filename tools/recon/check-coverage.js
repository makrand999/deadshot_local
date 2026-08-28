// Count remaining decoder calls in game.deob.js and test lookup coverage.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');
const maps = JSON.parse(fs.readFileSync('raw/analysis/decoder-maps.json', 'utf8'));

for (const n of ['pvXRsd', 'o3kUxo', 'vpUcA1', 'KUDZqIu', 'znb5HN']) {
  const re = new RegExp('\\b' + n + '\\s*\\(', 'g');
  console.log(n, 'remaining calls:', (s.match(re) || []).length);
}

// Coverage: how many call-site args does each map cover?
for (const n of ['pvXRsd', 'o3kUxo', 'KUDZqIu']) {
  const re = new RegExp('\\b' + n + '\\((0x[0-9a-fA-F]+|\\d+)\\)', 'g');
  const args = new Set();
  let m;
  while ((m = re.exec(s))) args.add(Number(m[1]));
  const map = maps[n] || {};
  let covered = 0;
  for (const a of args) if (String(a) in map) covered++;
  console.log(n, 'call-site args:', args.size, 'covered by map:', covered, 'map size:', Object.keys(map).length);
}

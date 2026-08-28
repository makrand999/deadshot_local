// Count remaining decoder calls BEFORE vs AFTER the body marker, and sample decoded network strings.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');
const marker = "typeof(IRiPNJ=IRiPNJ,function(){'use strict';";
const bodyIdx = s.indexOf(marker);
console.log('body marker at', bodyIdx);
const pre = s.slice(0, bodyIdx);
const post = s.slice(bodyIdx);

for (const n of ['o3kUxo', 'pvXRsd', 'vpUcA1', 'KUDZqIu']) {
  const reP = new RegExp('\\b' + n + '\\s*\\(', 'g');
  const reQ = new RegExp('\\b' + n + '\\s*\\(', 'g');
  console.log(n, '| pre:', (pre.match(reP) || []).length, 'post:', (post.match(reQ) || []).length);
}

// Sample decoded strings in the game body (post-marker) that look network-y
const strs = post.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g) || [];
const net = [...new Set(strs.filter((x) => /wss?|socket|connect|join|room|player|server|host|port|spawn|http/i.test(x)))];
console.log('\n--- network-ish strings in GAME BODY (first 50) ---');
console.log(net.slice(0, 50).join('\n'));

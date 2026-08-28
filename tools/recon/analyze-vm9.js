// Analyze the deobfuscated VM9: remaining calls + network strings.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// remaining decoder-ish calls
const re = /\b(ai\d+|arY|a[A-Za-z0-9_$]{1,4})\(0x[0-9a-fA-F]+\)/g;
const m = s.match(re);
console.log('remaining hex-decoder calls:', m ? m.length : 0);

// Network/protocol strings now readable
const markers = ['wss://', 'ws://', 'matchmaking', 'party.de', 'socket', 'WebSocket', 'send(', 'onmessage', 'protocol', 'reconnect', 'auth', 'token', 'spawn', 'join(', 'room', 'player', 'health', 'ammo', 'weapon', 'damage'];
console.log('\nmarker counts in deobfuscated:');
for (const mk of markers) {
  const re2 = new RegExp(mk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  console.log(String((s.match(re2) || []).length).padStart(5), mk);
}

// Show any literal wss:// strings with context
const wss = s.indexOf('wss://');
if (wss > 0) {
  console.log('\nwss:// ctx:', s.slice(Math.max(0, wss - 200), wss + 200));
}

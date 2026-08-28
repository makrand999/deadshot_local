// Scan VM9.txt for network/protocol markers.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

const markers = [
  'WebSocket', 'wss://', 'ws://', 'matchmaking', 'party', 'connect', 'socket',
  'send(', 'onmessage', 'message', 'protocol', 'join', 'spawn', 'player',
  'matchmaker', 'reconnect', 'server', 'host', 'port', 'auth', 'token',
  'battle_royale', 'class', 'weapon', 'damage', 'health', 'ammo', 'reload',
  'map', 'wasm', 'ArrayBuffer', 'Uint8Array', 'DataView', 'JSON.parse',
];
const counts = {};
for (const m of markers) {
  const re = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  counts[m] = (s.match(re) || []).length;
}
console.log('marker counts:');
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(String(v).padStart(6), k);
}

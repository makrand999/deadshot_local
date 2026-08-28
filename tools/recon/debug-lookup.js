// Debug: why isn't the rewrite resolving with the maps?
const fs = require('fs');
const maps = JSON.parse(fs.readFileSync('raw/analysis/decoder-maps.json', 'utf8'));
console.log('pvXRsd map size:', Object.keys(maps.pvXRsd).length);
console.log('pvXRsd sample keys:', Object.keys(maps.pvXRsd).slice(0, 8));
console.log('pvXRsd["108"]:', JSON.stringify(maps.pvXRsd['108']));
console.log('pvXRsd["-63"]:', JSON.stringify(maps.pvXRsd['-63']));
console.log('pvXRsd["45"]:', JSON.stringify(maps.pvXRsd['45']));

// Check a call site in the source
const src = fs.readFileSync('raw/bundles/game.js', 'utf8');
const i = src.indexOf('pvXRsd(0x6f)');
console.log('\npvXRsd(0x6f) at', i, '-> map[111]:', JSON.stringify(maps.pvXRsd['111']));

// Does lookup work for -0x3f (63)?
console.log('\no3kUxo(-0x3f) -> map["-63"]:', JSON.stringify(maps.o3kUxo['-63']));
console.log('pvXRsd(o3kUxo(-0x3f)) chain: o3kUxo[-63] =', JSON.stringify(maps.o3kUxo['-63']), 'then pvXRsd[that]:', typeof maps.o3kUxo['-63'] === 'number' ? JSON.stringify(maps.pvXRsd[String(maps.o3kUxo['-63'])]) : 'n/a');

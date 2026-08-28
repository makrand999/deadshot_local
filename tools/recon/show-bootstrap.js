// Show the exact start and end of the bootstrap region to replicate its shape.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

console.log('=== chars 0-500 ===');
console.log(s.slice(0, 500));
console.log('\n=== chars 129840-129900 ===');
console.log(s.slice(129840, 129900));

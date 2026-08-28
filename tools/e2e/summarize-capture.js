// Summarize captured responses from the CDP run.
const fs = require('fs');
const r = JSON.parse(fs.readFileSync('raw/capture/responses.json', 'utf8'));
console.log('total responses:', r.length);
const types = {};
for (const x of r) types[x.type] = (types[x.type] || 0) + 1;
console.log('types:', types);
console.log('\nfirst 30 urls:');
r.slice(0, 30).forEach((x) => console.log(' ', x.status, x.type, x.url));
console.log('\ninteresting (wasm/ws/deadshot/de):');
r.filter((x) => /wasm|deadshot|\.de\/|matchmak|party/i.test(x.url)).forEach((x) => console.log(' ', x.status, x.type, x.url));

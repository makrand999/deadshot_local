// Probe deadshot backend hosts.
const https = require('https');

function probe(url, cb) {
  const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
    let len = 0;
    res.on('data', (c) => (len += c.length));
    res.on('end', () => cb(url + ' -> ' + res.statusCode + ' len ' + len + ' type ' + (res.headers['content-type'] || '')));
    res.on('error', () => cb(url + ' -> ERR'));
  });
  req.on('error', (e) => cb(url + ' -> ERR ' + (e.code || e.message)));
  req.setTimeout(10000, () => { req.destroy(); cb(url + ' -> TIMEOUT'); });
}

const list = [
  'https://deadshot.io/',
  'https://matchmaking.de/',
  'https://party.de/',
  'https://error.de/',
  'https://deadshot.io/favicon.png',
];
let i = 0;
function next() {
  if (i >= list.length) { console.log('DONE'); process.exit(0); }
  probe(list[i++], (r) => { console.log(r); next(); });
}
next();

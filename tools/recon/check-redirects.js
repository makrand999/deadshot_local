// Check party.de redirect target and matchmaking attest endpoint.
const https = require('https');

function head(url, cb) {
  const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
    console.log(url, '->', res.statusCode, '| location:', res.headers.location || '(none)', '| type:', res.headers['content-type'] || '');
    res.resume();
    res.on('end', cb);
  });
  req.on('error', (e) => { console.log(url, '-> ERR', e.code); cb(); });
  req.setTimeout(10000, () => { req.destroy(); cb(); });
}

head('https://party.de/', () => {
  head('https://matchmaking.de/adshot.io/attest', () => {
    process.exit(0);
  });
});

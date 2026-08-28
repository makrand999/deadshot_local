// Two visible Chrome windows against the gameplay server for manual testing.
// Server on 8080/8081. Create party in A, join in B, ready, pick weapons.
import { spawn } from 'child_process';
import os from 'node:os';
const ROOT = new URL('..', import.meta.url).pathname;
const CHROME = '/usr/bin/google-chrome';
const pids = [];
const server = spawn('node', ['server/src/gameplay-server.mjs'], { cwd: ROOT, stdio: ['ignore','pipe','pipe'] });
server.stderr.on('data', d => console.error('[server!]', String(d)));
pids.push(server);
for (const port of [9249, 9250]) {
  const c = spawn(CHROME, ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
    '--remote-debugging-port='+port,'--no-first-run','--ignore-gpu-blocklist','--enable-gpu-rasterization',
    '--host-resolver-rules=MAP 192.168.local 127.0.0.1','--window-size=1280,800',
    '--user-data-dir='+os.tmpdir()+'/gp-'+port+'-'+Date.now(),'http://192.168.local:8080/'],
    { stdio: ['ignore','ignore','ignore'] });
  pids.push(c);
}
console.log('windows A(9249) B(9250) + server up. Stop: Ctrl-C.');
process.on('SIGINT', () => { for (const p of pids) try { p.kill(); } catch {} process.exit(0); });

// Quick test: connect to the local WS /ws endpoint.
const ws = new WebSocket('ws://127.0.0.1:8080/ws?name=test');
ws.onopen = () => { console.log('WS OPEN'); ws.send('hello'); };
ws.onmessage = (e) => console.log('WS MSG:', String(e.data));
ws.onerror = (e) => console.log('WS ERR:', e.message || 'err');
ws.onclose = () => { console.log('WS CLOSE'); process.exit(0); };
setTimeout(() => { console.log('timeout'); process.exit(0); }, 3000);

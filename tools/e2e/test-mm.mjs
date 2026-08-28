// Test the matchmaker WS on 8081.
const ws = new WebSocket('ws://127.0.0.1:8081/ws?name=test');
ws.onopen = () => { console.log('MM OPEN'); ws.send('ping'); };
ws.onmessage = (e) => console.log('MM MSG:', String(e.data));
ws.onerror = (e) => console.log('MM ERR:', e.message || 'err');
ws.onclose = () => { console.log('MM CLOSE'); process.exit(0); };
setTimeout(() => { console.log('timeout'); process.exit(0); }, 3000);

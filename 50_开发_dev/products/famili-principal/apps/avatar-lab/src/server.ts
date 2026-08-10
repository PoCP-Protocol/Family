import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    const message = data.toString();
    socket.send(JSON.stringify({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' }, timestamp_ms: Date.now() }));
    if (message.includes('TEXT_INPUT')) {
      socket.send(JSON.stringify({ kind: 'PRINCIPAL_RESPONSE', payload: { output: { response_text: '今晚先别解决手机。' } } }));
    }
  });
});

httpServer.listen(8765, () => {
  console.log('Avatar Lab mock server listening on ws://127.0.0.1:8765');
});

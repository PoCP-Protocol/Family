import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { RealtimeSessionMachine } from '../../../../../packages/realtime-session/src/sessionMachine';
import { FakeSpeechToTextGateway, FakeTextToSpeechGateway } from '../../../../../packages/speech-gateway/src';
import { FakeAvatarGateway } from '../../../../../packages/avatar-gateway/src';
import { PrincipalPerformancePlanner } from '../../../../../packages/fpai-performance-planner/src/performancePlanner';
import type { PrincipalAiOutput, RealtimeClientCommand, RealtimeServerEvent } from '../../../../../packages/fpai-multimodal-contracts/src';

const server = createServer();
const wss = new WebSocketServer({ server });
const sessionMachine = new RealtimeSessionMachine();
const stt = new FakeSpeechToTextGateway();
const tts = new FakeTextToSpeechGateway();
const avatar = new FakeAvatarGateway();
const planner = new PrincipalPerformancePlanner();

const clients = new Set<any>();

stt.onEvent((event) => {
  const payload = event as unknown as RealtimeServerEvent;
  broadcast({ kind: 'PARTIAL_TRANSCRIPT', payload: { event } });
  if (payload.kind === 'ERROR') {
    broadcast({ kind: 'ERROR', payload: { reason: payload.payload?.reason } });
  }
});

tts.onEvent((event) => {
  broadcast({ kind: 'TTS_EVENT', payload: { event } });
});

avatar.onEvent((event) => {
  broadcast({ kind: 'AVATAR_EVENT', payload: { event } });
});

wss.on('connection', (socket) => {
  clients.add(socket);
  socket.on('message', (raw) => {
    const message = raw.toString();
    const command = JSON.parse(message) as RealtimeClientCommand;

    if (command.kind === 'SESSION_START') {
      sessionMachine.applyEvent({ type: 'STATE_CHANGED', state: 'LISTENING', timestamp_ms: Date.now() });
      broadcast({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' } });
      return;
    }

    if (command.kind === 'TEXT_INPUT') {
      sessionMachine.applyEvent({ type: 'STATE_CHANGED', state: 'THINKING', timestamp_ms: Date.now() });
      broadcast({ kind: 'STATE_CHANGED', payload: { state: 'THINKING' } });

      const output: PrincipalAiOutput = {
        turn_id: command.turn_id ?? 'turn-1',
        response_text: '今晚先别解决手机。',
        risk_route: 'NORMAL',
        scenario_id: 'INTERACTIVE_CHAT',
        method_refs: ['method://coaching/one-small-step'],
        safety_status: 'SAFE',
        soul_version: 'soul-v1',
        model_provider: 'fake',
      };
      const plan = planner.plan(output, 'INTERACTIVE_CHAT', 'NORMAL');
      broadcast({ kind: 'PRINCIPAL_RESPONSE', payload: { output } });
      broadcast({ kind: 'PERFORMANCE_PLAN', payload: { plan } });
      stt.startSession(output.turn_id);
      stt.pushAudioChunk(output.turn_id, new Uint8Array([1]));
      stt.finishInput(output.turn_id);
      tts.synthesizeStream(output.turn_id, output.response_text);
      avatar.startPerformance(output.turn_id, plan.avatar);
      sessionMachine.applyEvent({ type: 'STATE_CHANGED', state: 'SPEAKING', timestamp_ms: Date.now() });
      broadcast({ kind: 'STATE_CHANGED', payload: { state: 'SPEAKING' } });
      return;
    }

    if (command.kind === 'INTERRUPT') {
      sessionMachine.interrupt();
      broadcast({ kind: 'STATE_CHANGED', payload: { state: 'INTERRUPTED' } });
      tts.cancel(command.turn_id ?? 'turn-1');
      avatar.cancel(command.turn_id ?? 'turn-1');
      sessionMachine.applyEvent({ type: 'STATE_CHANGED', state: 'LISTENING', timestamp_ms: Date.now() });
      broadcast({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' } });
      return;
    }
  });
});

function broadcast(event: RealtimeServerEvent): void {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    client.send(payload);
  }
}

server.listen(8765, '127.0.0.1', () => {
  console.log('avatar lab websocket listening on ws://127.0.0.1:8765');
});

server.on('error', (error) => {
  console.error('avatar lab websocket error', error);
  process.exit(1);
});

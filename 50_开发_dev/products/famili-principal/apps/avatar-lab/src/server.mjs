import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const server = createServer();
const wss = new WebSocketServer({ server });
const clients = new Set();
const sessionId = 'session-1';
let activeTurnId = null;
let activeSeq = 0;

function classifyRiskRoute(text) {
  const normalized = (text ?? '').toLowerCase();
  if (normalized.includes('伤害') || normalized.includes('自杀') || normalized.includes('威胁')) {
    return 'HIGH_RISK';
  }
  if (normalized.includes('家暴') || normalized.includes('暴力')) {
    return 'REVIEW';
  }
  return 'NORMAL';
}

function isActiveTurn(turnId, seq) {
  return activeTurnId === turnId && activeSeq === seq;
}

function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    client.send(payload);
  }
}

wss.on('connection', (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' } }));
  socket.on('message', (raw) => {
    try {
      const command = JSON.parse(raw.toString());
      if (command.kind === 'SESSION_START') {
        broadcast({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' } });
        return;
      }

      if (command.kind === 'TEXT_INPUT') {
        const turnId = command.turn_id ?? `turn-${Date.now()}`;
        activeSeq += 1;
        activeTurnId = turnId;
        const seq = activeSeq;
        const text = command.text ?? '';
        const riskRoute = classifyRiskRoute(text);

        broadcast({ kind: 'STATE_CHANGED', payload: { state: 'TRANSCRIBING' } });
        setTimeout(() => {
          if (!isActiveTurn(turnId, seq)) {
            return;
          }
          broadcast({ kind: 'PARTIAL_TRANSCRIPT', payload: { turn_id: turnId, session_id: sessionId, text: `我听到你说：${text}` } });
        }, 180);

        setTimeout(() => {
          if (!isActiveTurn(turnId, seq)) {
            return;
          }
          broadcast({ kind: 'FINAL_TRANSCRIPT', payload: { turn_id: turnId, session_id: sessionId, text } });
          broadcast({ kind: 'STATE_CHANGED', payload: { state: 'THINKING' } });
          const output = {
            turn_id: turnId,
            request_id: `${turnId}-request`,
            session_id: sessionId,
            entry_point: 'ASK_FAMILI_PRINCIPAL',
            response_text: riskRoute === 'HIGH_RISK' ? '我先把这个情况先转给专业支持和家长一起处理。' : '今晚先别解决手机。我们可以先从一个小步骤开始。',
            risk_route: riskRoute,
            scenario_id: 'INTERACTIVE_CHAT',
            method_refs: ['method://coaching/one-small-step'],
            source_refs: ['source://avatar-lab/fake-runtime'],
            safety_status: riskRoute === 'HIGH_RISK' ? 'HIGH_RISK' : riskRoute === 'REVIEW' ? 'REVIEW' : 'SAFE',
            soul_version: 'soul-v1',
            model_provider: 'fake-runtime',
            schema_validation: 'PASS',
            family_context_read_allowed: false,
            consent_context: { consented: true, purpose: 'LAB', subjectType: 'HOUSEHOLD' },
          };
          broadcast({ kind: 'PRINCIPAL_RESPONSE', payload: { output } });
          broadcast({ kind: 'SAFETY_ROUTE', payload: { route: riskRoute, turn_id: turnId, session_id: sessionId } });
          broadcast({ kind: 'PERFORMANCE_PLAN', payload: { plan: { speech: { tone: riskRoute === 'HIGH_RISK' ? 'CALM_SERIOUS' : 'CALM_WARM', pace: 'MEDIUM' }, avatar: { expression: riskRoute === 'HIGH_RISK' ? 'CALM_SERIOUS' : 'ATTENTIVE', gesture: 'SMALL_OPEN_HAND' } } } });
          if (riskRoute === 'HIGH_RISK') {
            broadcast({ kind: 'STATE_CHANGED', payload: { state: 'HUMAN_GATE' } });
          }
        }, 420);

        setTimeout(() => {
          if (!isActiveTurn(turnId, seq)) {
            return;
          }
          broadcast({ kind: 'TTS_EVENT', payload: { event: { type: 'TTS_STARTED', turn_id: turnId } } });
          broadcast({ kind: 'AVATAR_EVENT', payload: { event: { type: 'PERFORMANCE_STARTED', turn_id: turnId, expression: 'ATTENTIVE', gesture: 'SMALL_OPEN_HAND' } } });
          broadcast({ kind: 'STATE_CHANGED', payload: { state: 'SPEAKING' } });
        }, 620);

        setTimeout(() => {
          if (!isActiveTurn(turnId, seq)) {
            return;
          }
          broadcast({ kind: 'TTS_EVENT', payload: { event: { type: 'AUDIO_CHUNK', turn_id: turnId, text: '今晚先别解决手机。' } } });
          broadcast({ kind: 'AVATAR_EVENT', payload: { event: { type: 'VISEME_CHANGED', turn_id: turnId, viseme: 'open' } } });
        }, 780);

        setTimeout(() => {
          if (!isActiveTurn(turnId, seq)) {
            return;
          }
          broadcast({ kind: 'TTS_EVENT', payload: { event: { type: 'TTS_COMPLETE', turn_id: turnId } } });
          broadcast({ kind: 'AVATAR_EVENT', payload: { event: { type: 'PERFORMANCE_COMPLETE', turn_id: turnId } } });
          broadcast({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' } });
        }, 1000);
        return;
      }

      if (command.kind === 'INTERRUPT') {
        activeSeq += 1;
        activeTurnId = null;
        broadcast({ kind: 'INTERRUPTED', payload: { turn_id: command.turn_id, session_id: sessionId } });
        broadcast({ kind: 'STATE_CHANGED', payload: { state: 'INTERRUPTED' } });
        setTimeout(() => {
          broadcast({ kind: 'STATE_CHANGED', payload: { state: 'LISTENING' } });
        }, 180);
        return;
      }
    } catch (error) {
      broadcast({ kind: 'ERROR', payload: { reason: error.message } });
    }
  });
  socket.on('close', () => clients.delete(socket));
});

server.listen(8765, '127.0.0.1', () => {
  console.log('avatar lab websocket listening on ws://127.0.0.1:8765');
});

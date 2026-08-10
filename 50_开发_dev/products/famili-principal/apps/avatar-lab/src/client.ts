import type { RealtimeServerEvent } from '../../../../../packages/fpai-multimodal-contracts/src';

const socket = new WebSocket('ws://127.0.0.1:8765');
const stateEl = document.getElementById('state') as HTMLDivElement;
const subtitlesEl = document.getElementById('subtitles') as HTMLDivElement;
const devPanelEl = document.getElementById('devPanel') as HTMLDivElement;
const avatarEl = document.getElementById('avatar') as HTMLDivElement;
const inputEl = document.getElementById('input') as HTMLTextAreaElement;

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({ kind: 'SESSION_START' }));
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data as string) as RealtimeServerEvent;
  const payload = message.payload ?? {};

  if (message.kind === 'STATE_CHANGED') {
    const state = payload.state as string;
    stateEl.textContent = `状态: ${state}`;
    updateAvatar(state);
  }

  if (message.kind === 'PARTIAL_TRANSCRIPT' || message.kind === 'FINAL_TRANSCRIPT') {
    const text = (payload.text as string | undefined) ?? '';
    subtitlesEl.textContent = `实时字幕: ${text}`;
  }

  if (message.kind === 'PRINCIPAL_RESPONSE') {
    const output = payload.output as { response_text?: string };
    subtitlesEl.textContent = `实时字幕: ${output.response_text ?? ''}`;
  }

  if (message.kind === 'SAFETY_ROUTE') {
    const route = payload.route as string | undefined;
    devPanelEl.innerHTML = `<strong>Safety</strong><br/>route=${route ?? ''}`;
  }

  if (message.kind === 'PERFORMANCE_PLAN') {
    const plan = payload.plan as { speech?: { tone?: string; pace?: string }; avatar?: { expression?: string; gesture?: string } };
    devPanelEl.innerHTML += `<br/><strong>Performance</strong><br/>tone=${plan.speech?.tone ?? ''}<br/>gesture=${plan.avatar?.gesture ?? ''}`;
  }

  if (message.kind === 'TTS_EVENT') {
    const event = payload.event as { type?: string };
    devPanelEl.innerHTML += `<br/>tts=${event.type ?? ''}`;
  }

  if (message.kind === 'AVATAR_EVENT') {
    const event = payload.event as { type?: string; expression?: string; gesture?: string };
    devPanelEl.innerHTML += `<br/>avatar=${event.type ?? ''} ${event.expression ?? ''} ${event.gesture ?? ''}`;
  }

  if (message.kind === 'INTERRUPTED') {
    subtitlesEl.textContent = '实时字幕: 已被打断';
  }
});

function updateAvatar(state: string): void {
  const map: Record<string, string> = {
    LISTENING: '◉',
    THINKING: '◌',
    SPEAKING: '◐',
    INTERRUPTED: '◎',
    HUMAN_GATE: '◍',
  };
  avatarEl.textContent = map[state] ?? '◉';
}

document.getElementById('sendBtn')?.addEventListener('click', () => {
  const turnId = `turn-${Date.now()}`;
  socket.send(JSON.stringify({ kind: 'TEXT_INPUT', turn_id: turnId, session_id: 'session-1', text: inputEl.value }));
});

document.getElementById('interruptBtn')?.addEventListener('click', () => {
  socket.send(JSON.stringify({ kind: 'INTERRUPT', turn_id: `interrupt-${Date.now()}`, session_id: 'session-1' }));
});

/**
 * Avatar Lab Browser Client — Authoritative Principal payload consumer
 *
 * MM1-A3 §22 客户端契约:
 *   - 只消费服务器权威 output.*  字段,禁止在浏览器端重组 Principal 语义
 *   - session_id / turn_id 由服务器分配,客户端不再伪造
 *   - INTERRUPT / TELEMETRY_REQUEST 命令必须原样透传
 *   - DEV 面板只显示白名单遥测,禁止显示 prompt / CoT / apiKey / secret
 */
import type { RealtimeServerEvent } from '@family/fpai-multimodal-contracts';

/* ---------- authoritative Principal 输出 (与 @family/principal-ai 契约一致) ---------- */

interface AuthoritativePrincipalOutput {
  opening: string;
  what_i_hear: string;
  possible_pattern: string;
  not_the_label: string;
  say_it_tonight: string;
  one_small_action: string;
  look_for: string;
  boundary: string;
  risk_route: 'NORMAL' | 'REVIEW' | 'HIGH_RISK';
  method_refs: string[];
  source_refs?: string[];
}

interface AuthoritativeModelRun {
  model_provider: string;
  model_name: string;
  schema_validation: 'PASS' | 'FAIL_CLOSED';
  soul_version: string;
  scenario_id: string;
  risk_route: 'NORMAL' | 'REVIEW' | 'HIGH_RISK';
  latency_ms: number;
}

/* ---------- 客户端会话状态(server-authoritative) ---------- */

interface ClientState {
  session_id: string | null;
  connection_id: string | null;
  active_turn_id: string | null;
  generation_id: number | null;
  realtime_state: string;
  scenario_id: string | null;
  risk_route: string | null;
  method_refs: string[];
  source_refs: string[];
  soul_version: string | null;
  model_provider: string | null;
  schema_validation: string | null;
  principal_latency_ms: number | null;
  tts_status: string;
  avatar_status: string;
  last_cancelled_turn: string | null;
  stale_event_drop_count: number;
  barge_in_cancel_ms: number | null;
  console_errors: number;
}

const state: ClientState = {
  session_id: null,
  connection_id: null,
  active_turn_id: null,
  generation_id: null,
  realtime_state: 'CONNECTING',
  scenario_id: null,
  risk_route: null,
  method_refs: [],
  source_refs: [],
  soul_version: null,
  model_provider: null,
  schema_validation: null,
  principal_latency_ms: null,
  tts_status: 'idle',
  avatar_status: 'idle',
  last_cancelled_turn: null,
  stale_event_drop_count: 0,
  barge_in_cancel_ms: null,
  console_errors: 0,
};

/* ---------- console 错误计数(供 Browser Gate 使用) ---------- */
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  state.console_errors += 1;
  originalError(...args);
  renderDevPanel();
};

/* ---------- DOM contract guard ---------- */

/**
 * DOM contract 强约束:
 *   - 缺失即抛,不允许静默返回 null 进入渲染路径
 *   - 类型断言由调用方声明,helper 只验证存在性 + 类型 tag
 */
function requiredElement<T extends HTMLElement>(id: string, tag: string): T {
  const el = document.getElementById(id);
  if (!el) {
    const msg = `Avatar Lab DOM contract missing: #${id}`;
    console.error(msg);
    throw new Error(msg);
  }
  if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) {
    const msg = `Avatar Lab DOM contract type mismatch: #${id} expected <${tag}>, got <${el.tagName.toLowerCase()}>`;
    console.error(msg);
    throw new Error(msg);
  }
  return el as T;
}

/* ---------- DOM ---------- */

const stateEl = requiredElement<HTMLDivElement>('state', 'div');
const partialEl = requiredElement<HTMLDivElement>('partial', 'div');
const finalTranscriptEl = requiredElement<HTMLDivElement>('finalTranscript', 'div');
const principalPanelEl = requiredElement<HTMLDivElement>('principalPanel', 'div');
const performancePanelEl = requiredElement<HTMLDivElement>('performancePanel', 'div');
const devPanelEl = requiredElement<HTMLDivElement>('devPanel', 'div');
const eventLogEl = requiredElement<HTMLDivElement>('eventLog', 'div');
const avatarEl = requiredElement<HTMLDivElement>('avatar', 'div');
const inputEl = requiredElement<HTMLTextAreaElement>('input', 'textarea');
const sendBtnEl = requiredElement<HTMLButtonElement>('sendBtn', 'button');
const interruptBtnEl = requiredElement<HTMLButtonElement>('interruptBtn', 'button');
const telemetryBtnEl = requiredElement<HTMLButtonElement>('telemetryBtn', 'button');

/* ---------- WebSocket ---------- */

const wsUrl = (window as { AVATAR_LAB_WS_URL?: string }).AVATAR_LAB_WS_URL ?? 'ws://127.0.0.1:8765';
const socket = new WebSocket(wsUrl);

socket.addEventListener('open', () => {
  logEvent('[ws] open');
  socket.send(JSON.stringify({ kind: 'SESSION_START' }));
});

socket.addEventListener('close', () => {
  logEvent('[ws] close');
  state.realtime_state = 'DISCONNECTED';
  renderState();
});

socket.addEventListener('error', () => {
  state.console_errors += 1;
  logEvent('[ws] error');
  renderDevPanel();
});

socket.addEventListener('message', (event) => {
  let message: RealtimeServerEvent;
  try {
    message = JSON.parse(event.data as string) as RealtimeServerEvent;
  } catch (err) {
    state.console_errors += 1;
    logEvent('[parse-error] ' + (err as Error).message);
    return;
  }

  const payload = (message.payload ?? {}) as Record<string, unknown>;

  // 记录事件到 log(简化视图,只留 kind + turn_id)
  logEvent(`${message.kind}${(message.turn_id ? ' turn=' + message.turn_id : '')}`);

  switch (message.kind) {
    case 'STATE_CHANGED': {
      const s = String(payload.state ?? '');
      state.realtime_state = s;
      // 首次 STATE_CHANGED 会带 session_id / connection_id
      if (typeof payload.session_id === 'string' && !state.session_id) state.session_id = payload.session_id;
      if (typeof payload.connection_id === 'string' && !state.connection_id) state.connection_id = payload.connection_id;
      updateAvatarGlyph(s);
      // HUMAN_GATE 时后端会附上 subtitle + boundary,直接显示为权威文本
      if (s === 'HUMAN_GATE' && typeof payload.subtitle === 'string') {
        renderPrincipalHumanGate(String(payload.subtitle), String(payload.boundary ?? ''));
      }
      break;
    }
    case 'PARTIAL_TRANSCRIPT': {
      partialEl.textContent = '实时字幕(听中): ' + (payload.text as string ?? '');
      break;
    }
    case 'FINAL_TRANSCRIPT': {
      finalTranscriptEl.textContent = '最终转写: ' + (payload.text as string ?? '');
      break;
    }
    case 'PRINCIPAL_RESPONSE': {
      const output = payload.output as AuthoritativePrincipalOutput;
      const modelRun = payload.model_run as AuthoritativeModelRun | undefined;
      if (message.turn_id) state.active_turn_id = message.turn_id;
      if (modelRun) {
        state.scenario_id = modelRun.scenario_id;
        state.risk_route = modelRun.risk_route;
        state.soul_version = modelRun.soul_version;
        state.model_provider = modelRun.model_provider;
        state.schema_validation = modelRun.schema_validation;
        state.principal_latency_ms = modelRun.latency_ms;
      }
      if (output) {
        state.method_refs = output.method_refs ?? [];
        state.source_refs = output.source_refs ?? [];
        renderPrincipal(output);
      }
      break;
    }
    case 'SAFETY_ROUTE': {
      state.risk_route = String(payload.route ?? '');
      if (typeof payload.scenario_id === 'string') state.scenario_id = payload.scenario_id;
      break;
    }
    case 'PERFORMANCE_PLAN': {
      renderPerformance(payload.plan as Record<string, unknown>);
      break;
    }
    case 'TTS_EVENT': {
      const evt = payload.event as { type?: string } | undefined;
      state.tts_status = evt?.type ?? state.tts_status;
      break;
    }
    case 'AVATAR_EVENT': {
      const evt = payload.event as { type?: string } | undefined;
      state.avatar_status = evt?.type ?? state.avatar_status;
      break;
    }
    case 'INTERRUPTED': {
      state.last_cancelled_turn = (payload.cancelled_turn_id as string | null) ?? state.last_cancelled_turn;
      state.tts_status = 'cancelled';
      state.avatar_status = 'cancelled';
      // 触发一次 TELEMETRY_REQUEST 以刷新 barge_in_cancel_ms / stale_event_drop_count
      socket.send(JSON.stringify({ kind: 'TELEMETRY_REQUEST' }));
      break;
    }
    case 'TELEMETRY': {
      const t = payload as Record<string, unknown>;
      // 严格白名单,任何 prompt/CoT/apiKey/secret 键都拒绝写入
      const FORBIDDEN = ['prompt', 'cot', 'apikey', 'secret', 'raw_transcript', 'system_prompt', 'chain'];
      for (const key of Object.keys(t)) {
        const low = key.toLowerCase();
        if (FORBIDDEN.some((f) => low.includes(f))) {
          state.console_errors += 1;
          logEvent('[telemetry-forbidden-key] ' + key);
          continue;
        }
      }
      if (typeof t.stale_event_drop_count === 'number') state.stale_event_drop_count = t.stale_event_drop_count;
      if (typeof t.barge_in_cancel_ms === 'number') state.barge_in_cancel_ms = t.barge_in_cancel_ms;
      if (typeof t.principal_latency_ms === 'number') state.principal_latency_ms = t.principal_latency_ms;
      if (typeof t.generation_id === 'number') state.generation_id = t.generation_id;
      if (typeof t.active_turn_id === 'string') state.active_turn_id = t.active_turn_id;
      if (typeof t.realtime_state === 'string') state.realtime_state = t.realtime_state;
      break;
    }
    case 'ERROR': {
      state.console_errors += 1;
      logEvent('[server-error] ' + String((payload as { reason?: string }).reason ?? ''));
      break;
    }
    default:
      break;
  }

  renderState();
  renderDevPanel();
});

/* ---------- 渲染 ---------- */

function updateAvatarGlyph(realtime: string): void {
  const map: Record<string, string> = {
    LISTENING: '◉',
    TRANSCRIBING: '◔',
    THINKING: '◌',
    SPEAKING: '◐',
    INTERRUPTED: '◎',
    HUMAN_GATE: '⛔',
    CLOSED: '·',
    DISCONNECTED: '·',
    CONNECTING: '·',
  };
  avatarEl.textContent = map[realtime] ?? '◉';
}

function renderState(): void {
  stateEl.textContent = `状态: ${state.realtime_state}${state.risk_route ? '  |  route=' + state.risk_route : ''}${state.scenario_id ? '  |  scenario=' + state.scenario_id : ''}`;
}

function renderPrincipal(output: AuthoritativePrincipalOutput): void {
  principalPanelEl.innerHTML = '';
  const fields: Array<[string, string]> = [
    ['opening', output.opening],
    ['what_i_hear', output.what_i_hear],
    ['possible_pattern', output.possible_pattern],
    ['not_the_label', output.not_the_label],
    ['say_it_tonight', output.say_it_tonight],
    ['one_small_action', output.one_small_action],
    ['look_for', output.look_for],
    ['boundary', output.boundary],
  ];
  for (const [k, v] of fields) {
    const row = document.createElement('div');
    row.className = 'p-row';
    row.setAttribute('data-field', k);
    row.innerHTML = `<span class="p-key">${k}</span><span class="p-val">${escapeHtml(v ?? '')}</span>`;
    principalPanelEl.appendChild(row);
  }
}

function renderPrincipalHumanGate(subtitle: string, boundary: string): void {
  principalPanelEl.innerHTML = '';
  const banner = document.createElement('div');
  banner.className = 'p-humangate';
  banner.setAttribute('data-humangate', 'true');
  banner.innerHTML = `<strong>⛔ HUMAN GATE</strong><br/><span class="p-val">${escapeHtml(subtitle)}</span><br/><em>${escapeHtml(boundary)}</em>`;
  principalPanelEl.appendChild(banner);
}

function renderPerformance(plan: Record<string, unknown>): void {
  const speech = (plan.speech ?? {}) as { tone?: string; pace?: string };
  const avatar = (plan.avatar ?? {}) as { expression?: string; gesture?: string };
  const subtitle = (plan.subtitle ?? {}) as { style?: string };
  performancePanelEl.innerHTML = `
    <div><strong>performance_plan</strong></div>
    <div>speech.tone = ${escapeHtml(speech.tone ?? '')}</div>
    <div>speech.pace = ${escapeHtml(speech.pace ?? '')}</div>
    <div>avatar.expression = ${escapeHtml(avatar.expression ?? '')}</div>
    <div>avatar.gesture = ${escapeHtml(avatar.gesture ?? '')}</div>
    <div>subtitle.style = ${escapeHtml(subtitle.style ?? '')}</div>
  `;
}

function renderDevPanel(): void {
  const rows: Array<[string, unknown]> = [
    ['session_id', state.session_id],
    ['connection_id', state.connection_id],
    ['active_turn_id', state.active_turn_id],
    ['generation_id', state.generation_id],
    ['realtime_state', state.realtime_state],
    ['scenario_id', state.scenario_id],
    ['risk_route', state.risk_route],
    ['method_refs', JSON.stringify(state.method_refs)],
    ['source_refs', JSON.stringify(state.source_refs)],
    ['soul_version', state.soul_version],
    ['model_provider', state.model_provider],
    ['schema_validation', state.schema_validation],
    ['principal_latency_ms', state.principal_latency_ms],
    ['tts_status', state.tts_status],
    ['avatar_status', state.avatar_status],
    ['last_cancelled_turn', state.last_cancelled_turn],
    ['stale_event_drop_count', state.stale_event_drop_count],
    ['barge_in_cancel_ms', state.barge_in_cancel_ms],
    ['console_errors', state.console_errors],
  ];
  devPanelEl.innerHTML = rows.map(([k, v]) => `<div data-tel="${k}"><span class="d-key">${k}</span> = <span class="d-val">${escapeHtml(String(v ?? ''))}</span></div>`).join('');
}

function logEvent(line: string): void {
  const div = document.createElement('div');
  div.className = 'log-line';
  div.textContent = `[${new Date().toISOString().slice(11, 23)}] ${line}`;
  eventLogEl.appendChild(div);
  // 只保留最近 50 行
  while (eventLogEl.childElementCount > 50) eventLogEl.removeChild(eventLogEl.firstChild!);
  eventLogEl.scrollTop = eventLogEl.scrollHeight;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/* ---------- 按钮 ---------- */

sendBtnEl.addEventListener('click', () => {
  const text = inputEl.value.trim();
  if (!text) return;
  // §22 权威 turn_id / session_id 由服务器分配;客户端不再伪造
  socket.send(JSON.stringify({ kind: 'TEXT_INPUT', text }));
});

interruptBtnEl.addEventListener('click', () => {
  // §7 barge-in 只在存在 active_turn_id 时有效
  // 不生成 `interrupt-${Date.now()}` 之类客户端伪造 id
  if (!state.active_turn_id) {
    logEvent('[interrupt-ignored] no-active-turn');
    return;
  }
  // 携带 server-authoritative active_turn_id 作为客户端 hint(服务器权威记账仍在 orchestrator)
  socket.send(JSON.stringify({ kind: 'INTERRUPT', turn_id: state.active_turn_id }));
});

telemetryBtnEl.addEventListener('click', () => {
  socket.send(JSON.stringify({ kind: 'TELEMETRY_REQUEST' }));
});

renderState();
renderDevPanel();

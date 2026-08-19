/**
 * RealtimePrincipalOrchestrator + RealtimeSessionContext
 *
 * §11 Session context 是 per-WebSocket-connection 的; 服务器绝不 broadcast 业务事件。
 * §17 Orchestrator 负责:
 *   LISTENING → TRANSCRIBING → THINKING → SPEAKING → LISTENING
 *   + INTERRUPTED / HUMAN_GATE 分支
 *   业务动作(Principal AI 判定 / risk_route / method_refs / say_it_tonight / one_small_action)
 *   全部由 @family/principal-ai#runPrincipalTextMvp 提供,不在此推断。
 *
 * §10 orchestrator 内不允许有任何本地 risk classifier / 本地 principal 输出构造。
 */
import type { AiGateway } from '@family/ai-gateway';
import { FakeAvatarGateway } from '@family/avatar-gateway';
import { FakeSpeechToTextGateway, FakeTextToSpeechGateway } from '@family/speech-gateway';
import { PrincipalPerformancePlanner } from '@family/fpai-performance-planner';
import {
  runPrincipalTextMvp,
  PRINCIPAL_AI_PROMPT_VERSION,
  PRINCIPAL_AI_SCHEMA_VERSION,
  PRINCIPAL_SOUL_VERSION,
  type PrincipalAiOutput,
  type PrincipalAiRunResult,
  type PrincipalRiskRoute,
} from '@family/principal-ai';
import {
  derivePerformanceIntent,
  type PerformanceIntent,
} from '@family/fpai-multimodal-contracts';
import type {
  AvatarEvent,
  MediaConsentContext,
  PrincipalPerformancePlan,
  PrincipalSceneMode,
  RealtimeServerEvent,
  RealtimeSessionState,
  SpeechChunkEvent,
  TranscriptEvent,
} from '@family/fpai-multimodal-contracts';

/* ------------------------------------------------------------- *
 *  §11 RealtimeSessionContext
 * ------------------------------------------------------------- */

export interface RealtimeSessionContext {
  session_id: string;
  connection_id: string;
  state: RealtimeSessionState;
  active_turn_id: string | null;
  /** 每次 THINKING 前 +1,用于放弃 stale 事件。 */
  active_generation: number;
  active_tts_turn_id: string | null;
  active_avatar_turn_id: string | null;
  created_at: number;
  last_activity_at: number;
  closed: boolean;

  /* Telemetry (dev-only, 白名单字段) */
  stale_event_drop_count: number;
  last_cancelled_turn_id: string | null;
  last_principal_latency_ms: number | null;
  last_tts_first_event_ms: number | null;
  last_avatar_first_motion_ms: number | null;
  last_barge_in_cancel_ms: number | null;
}

export function createSessionContext(sessionId: string, connectionId: string): RealtimeSessionContext {
  const now = Date.now();
  return {
    session_id: sessionId,
    connection_id: connectionId,
    state: 'LISTENING',
    active_turn_id: null,
    active_generation: 0,
    active_tts_turn_id: null,
    active_avatar_turn_id: null,
    created_at: now,
    last_activity_at: now,
    closed: false,
    stale_event_drop_count: 0,
    last_cancelled_turn_id: null,
    last_principal_latency_ms: null,
    last_tts_first_event_ms: null,
    last_avatar_first_motion_ms: null,
    last_barge_in_cancel_ms: null,
  };
}

/* ------------------------------------------------------------- *
 *  §12/§13 Server-authoritative turn 标识
 * ------------------------------------------------------------- */

let __turnCounter = 0;
export function newServerTurnId(sessionId: string): string {
  __turnCounter += 1;
  return `${sessionId}-t${Date.now()}-${__turnCounter}`;
}

/* ------------------------------------------------------------- *
 *  §17 RealtimePrincipalOrchestrator
 *
 *  暴露:
 *    - onServerEvent(cb): 单连接的事件流(server → client)
 *    - handleTextInput(text): 一整个"用户输入 -> Principal -> Plan -> TTS/Avatar"闭环
 *    - handleInterrupt(clientTurnId): §18/§21 true barge-in
 *    - close(): 释放资源
 * ------------------------------------------------------------- */

export interface OrchestratorOptions {
  /** 允许注入 gateway 便于单测。默认使用 Fake 实现。 */
  aiGateway?: AiGateway;
  stt?: FakeSpeechToTextGateway;
  tts?: FakeTextToSpeechGateway;
  avatar?: FakeAvatarGateway;
  planner?: PrincipalPerformancePlanner;
  /** 生成 principal_ai input 时使用。 */
  consent?: MediaConsentContext;
}

export interface OrchestratorTelemetry {
  session_id: string;
  connection_id: string;
  active_turn_id: string | null;
  generation_id: number;
  realtime_state: RealtimeSessionState;
  scenario_id: string | null;
  risk_route: PrincipalRiskRoute | null;
  method_refs: string[];
  source_refs: string[];
  soul_version: string;
  model_provider: string;
  model_name: string;
  schema_validation: 'PASS' | 'FAIL' | null;
  principal_latency_ms: number | null;
  tts_first_event_ms: number | null;
  avatar_first_motion_ms: number | null;
  last_cancelled_turn: string | null;
  stale_event_drop_count: number;
  barge_in_cancel_ms: number | null;
  prompt_version: string;
  schema_version: string;
}

const DEFAULT_CONSENT: MediaConsentContext = {
  consented: true,
  purpose: 'LAB',
  subjectType: 'HOUSEHOLD',
};

export class RealtimePrincipalOrchestrator {
  private readonly ctx: RealtimeSessionContext;
  /**
   * 显式外部 gateway。undefined 时 runPrincipalTextMvp 走内建 deterministic fallback,
   * 而不是接一个总是返回 `{}` 的 FakeAiGateway (会让 principal-ai 的 spread + validate 崩掉)。
   */
  private readonly ai: AiGateway | undefined;
  private readonly stt: FakeSpeechToTextGateway;
  private readonly tts: FakeTextToSpeechGateway;
  private readonly avatar: FakeAvatarGateway;
  private readonly planner: PrincipalPerformancePlanner;
  private readonly consent: MediaConsentContext;

  private lastRun: PrincipalAiRunResult | null = null;
  private lastPlan: PrincipalPerformancePlan | null = null;

  private serverEventListeners: Array<(evt: RealtimeServerEvent) => void> = [];

  constructor(sessionId: string, connectionId: string, opts: OrchestratorOptions = {}) {
    this.ctx = createSessionContext(sessionId, connectionId);
    this.ai = opts.aiGateway;
    this.stt = opts.stt ?? new FakeSpeechToTextGateway();
    this.tts = opts.tts ?? new FakeTextToSpeechGateway();
    this.avatar = opts.avatar ?? new FakeAvatarGateway();
    this.planner = opts.planner ?? new PrincipalPerformancePlanner();
    this.consent = opts.consent ?? DEFAULT_CONSENT;

    // Gateway → orchestrator: 过滤 stale + 转成 RealtimeServerEvent
    this.stt.onEvent((evt) => this.onSttEvent(evt));
    this.tts.onEvent((evt) => this.onTtsEvent(evt));
    this.avatar.onEvent((evt) => this.onAvatarEvent(evt));
  }

  /* ---------- 外部 API ---------- */

  public onServerEvent(cb: (evt: RealtimeServerEvent) => void): void {
    this.serverEventListeners.push(cb);
  }

  public snapshot(): RealtimeSessionContext {
    return { ...this.ctx };
  }

  public telemetry(): OrchestratorTelemetry {
    const output = this.lastRun?.output ?? null;
    const modelRun = this.lastRun?.model_run ?? null;
    const retrieval = this.lastRun?.retrieval ?? null;
    return {
      session_id: this.ctx.session_id,
      connection_id: this.ctx.connection_id,
      active_turn_id: this.ctx.active_turn_id,
      generation_id: this.ctx.active_generation,
      realtime_state: this.ctx.state,
      scenario_id: retrieval?.scenario_id ?? null,
      risk_route: output?.risk_route ?? null,
      method_refs: output?.method_refs ?? [],
      source_refs: output?.source_refs ?? [],
      soul_version: modelRun?.soul_version ?? PRINCIPAL_SOUL_VERSION,
      model_provider: modelRun?.model_provider ?? 'unknown',
      model_name: modelRun?.model_name ?? 'unknown',
      schema_validation: modelRun ? (modelRun.schema_validation === 'PASS' ? 'PASS' : 'FAIL') : null,
      principal_latency_ms: this.ctx.last_principal_latency_ms,
      tts_first_event_ms: this.ctx.last_tts_first_event_ms,
      avatar_first_motion_ms: this.ctx.last_avatar_first_motion_ms,
      last_cancelled_turn: this.ctx.last_cancelled_turn_id,
      stale_event_drop_count: this.ctx.stale_event_drop_count,
      barge_in_cancel_ms: this.ctx.last_barge_in_cancel_ms,
      prompt_version: PRINCIPAL_AI_PROMPT_VERSION,
      schema_version: PRINCIPAL_AI_SCHEMA_VERSION,
    };
  }

  public async handleSessionStart(): Promise<void> {
    this.transitionState('LISTENING');
  }

  /**
   * §17/§18 完整闭环:
   *   1) 服务器生成 turn_id + generation
   *   2) STT 流(注入用户文本)
   *   3) runPrincipalTextMvp → 权威 output(HIGH_RISK 会返回 boundary/one_small_action=专业支持)
   *   4) Performance Planner
   *   5) TTS + Avatar 启动
   *   6) HIGH_RISK 直接进入 HUMAN_GATE,不启动普通 TTS/Avatar 表演
   */
  public async handleTextInput(userText: string, sceneHint: PrincipalSceneMode = 'INTERACTIVE_CHAT'): Promise<void> {
    // 若上一轮仍在 SPEAKING,视作 barge-in 隐式取消。
    if (this.ctx.state === 'SPEAKING' || this.ctx.state === 'THINKING') {
      this.doBargeIn('implicit-barge-in');
    }

    const turnId = newServerTurnId(this.ctx.session_id);
    this.ctx.active_generation += 1;
    this.ctx.active_turn_id = turnId;
    this.ctx.last_activity_at = Date.now();

    // §12 STATE_CHANGED TRANSCRIBING
    this.transitionState('TRANSCRIBING');

    // 注入真实用户文本,让 Fake STT 流回来
    this.stt.setPendingTranscript(turnId, userText);
    this.stt.startSession(turnId);
    this.stt.pushAudioChunk(turnId, new Uint8Array([0]));
    this.stt.pushAudioChunk(turnId, new Uint8Array([0]));
    this.stt.pushAudioChunk(turnId, new Uint8Array([0]));
    this.stt.pushAudioChunk(turnId, new Uint8Array([0]));
    this.stt.finishInput(turnId);

    // §17 THINKING → 权威 Principal
    this.transitionState('THINKING');
    const requestStartMs = Date.now();

    const run = await runPrincipalTextMvp(
      {
        request_id: `${turnId}-req`,
        session_id: this.ctx.session_id,
        entry_point: 'ASK_FAMILI_PRINCIPAL',
        user_message: userText,
        scene_hint: sceneHint,
        consent_context: {
          fpai_lab_consent: this.consent.consented,
          family_context_read_allowed: false,
        },
      },
      this.ai,
    );

    this.ctx.last_principal_latency_ms = Date.now() - requestStartMs;
    this.lastRun = run;
    const output = run.output;
    const risk = output.risk_route;

    // §22 PRINCIPAL_RESPONSE 发送权威 output 全字段 (opening/what_i_hear/…) — 不合成新文本
    this.emitServer({
      kind: 'PRINCIPAL_RESPONSE',
      session_id: this.ctx.session_id,
      turn_id: turnId,
      payload: {
        output,
        model_run: {
          model_provider: run.model_run.model_provider,
          model_name: run.model_run.model_name,
          schema_validation: run.model_run.schema_validation,
          soul_version: run.model_run.soul_version,
          scenario_id: run.model_run.scenario_id,
          risk_route: run.model_run.risk_route,
          latency_ms: run.model_run.latency_ms,
        },
      },
    });

    this.emitServer({
      kind: 'SAFETY_ROUTE',
      session_id: this.ctx.session_id,
      turn_id: turnId,
      payload: { route: risk, scenario_id: run.retrieval.scenario_id },
    });

    // §19 HIGH_RISK → HUMAN_GATE, 不启动普通 TTS/Avatar 表演,只显示 Principal 的 boundary/say_it_tonight
    if (risk === 'HIGH_RISK') {
      this.transitionState('HUMAN_GATE');
      // 仍然给客户端 human-gate 提示所需的字幕内容(权威文本):
      this.emitServer({
        kind: 'STATE_CHANGED',
        session_id: this.ctx.session_id,
        turn_id: turnId,
        payload: { state: 'HUMAN_GATE', subtitle: output.say_it_tonight, boundary: output.boundary },
      });
      return;
    }

    // §14/§15 Performance Planner + TTS/Avatar 并行启动
    // MM3-PATCH-001: Derive semantic intent, then plan performance frame
    const intent: PerformanceIntent = derivePerformanceIntent({
      risk_route: risk,
      boundary: output.boundary,
      one_small_action: output.one_small_action,
    });
    const plan = this.planner.plan(intent, risk);
    this.lastPlan = plan;
    this.emitServer({
      kind: 'PERFORMANCE_PLAN',
      session_id: this.ctx.session_id,
      turn_id: turnId,
      payload: { plan },
    });

    // 由 orchestrator 记账当前 tts / avatar handle
    this.ctx.active_tts_turn_id = turnId;
    this.ctx.active_avatar_turn_id = turnId;

    this.transitionState('SPEAKING');

    // Avatar 立刻起姿态,TTS 流式合成
    this.avatar.startPerformance(turnId, plan.avatar);
    this.tts.synthesizeStream(turnId, output.say_it_tonight);
  }

  /**
   * §18/§21 true barge-in:
   *   - 只允许打断 active 生成
   *   - 使旧 generation 立即失效
   *   - 真调 tts.cancel + avatar.cancel
   *   - 发 INTERRUPTED,回到 LISTENING
   */
  public handleInterrupt(_clientHintTurnId?: string): void {
    if (this.ctx.state !== 'SPEAKING' && this.ctx.state !== 'THINKING') {
      // 空 barge-in 直接忽略,不制造事件
      return;
    }
    void _clientHintTurnId; // client hint 仅供 log; 权威 turn_id 由 server 记账
    this.doBargeIn('explicit-barge-in');
  }

  public handleSessionClose(): void {
    this.ctx.closed = true;
    // 若在讲,先取消
    if (this.ctx.active_tts_turn_id) this.tts.cancel(this.ctx.active_tts_turn_id);
    if (this.ctx.active_avatar_turn_id) this.avatar.cancel(this.ctx.active_avatar_turn_id);
    this.ctx.state = 'CLOSED';
  }

  /* ---------- 内部: barge-in / 状态过渡 ---------- */

  private doBargeIn(reason: string): void {
    const startMs = Date.now();
    const cancelledTurn = this.ctx.active_turn_id;
    // §21 使旧 generation 失效
    this.ctx.active_generation += 1;

    if (this.ctx.active_tts_turn_id) {
      this.tts.cancel(this.ctx.active_tts_turn_id);
    }
    if (this.ctx.active_avatar_turn_id) {
      this.avatar.cancel(this.ctx.active_avatar_turn_id);
    }
    this.ctx.active_tts_turn_id = null;
    this.ctx.active_avatar_turn_id = null;
    this.ctx.last_cancelled_turn_id = cancelledTurn;
    this.ctx.last_barge_in_cancel_ms = Date.now() - startMs;

    this.emitServer({
      kind: 'INTERRUPTED',
      session_id: this.ctx.session_id,
      turn_id: cancelledTurn ?? undefined,
      payload: { reason, cancelled_turn_id: cancelledTurn },
    });

    this.transitionState('INTERRUPTED');
    this.transitionState('LISTENING');
  }

  private transitionState(state: RealtimeSessionState): void {
    this.ctx.state = state;
    this.ctx.last_activity_at = Date.now();
    this.emitServer({
      kind: 'STATE_CHANGED',
      session_id: this.ctx.session_id,
      turn_id: this.ctx.active_turn_id ?? undefined,
      payload: { state },
    });
  }

  private emitServer(evt: RealtimeServerEvent): void {
    for (const cb of this.serverEventListeners) cb(evt);
  }

  /* ---------- Gateway 事件桥接(带 stale 过滤 §21) ---------- */

  private isCurrentTurn(evtTurnId: string | undefined): boolean {
    if (!evtTurnId) return true; // 无 turn 的元事件放行
    return evtTurnId === this.ctx.active_turn_id;
  }

  private onSttEvent(evt: RealtimeServerEvent | TranscriptEvent): void {
    // stale 过滤
    const anyEvt = evt as { turn_id?: string };
    if (!this.isCurrentTurn(anyEvt.turn_id)) {
      this.ctx.stale_event_drop_count += 1;
      return;
    }
    if ((evt as TranscriptEvent).type === 'TRANSCRIPT_PARTIAL') {
      this.emitServer({
        kind: 'PARTIAL_TRANSCRIPT',
        session_id: this.ctx.session_id,
        turn_id: (evt as TranscriptEvent).turn_id,
        payload: { text: (evt as TranscriptEvent).text },
      });
      return;
    }
    if ((evt as TranscriptEvent).type === 'TRANSCRIPT_FINAL') {
      this.emitServer({
        kind: 'FINAL_TRANSCRIPT',
        session_id: this.ctx.session_id,
        turn_id: (evt as TranscriptEvent).turn_id,
        payload: { text: (evt as TranscriptEvent).text },
      });
      return;
    }
    // ERROR / STATE_CHANGED 之类的转发
    if ((evt as RealtimeServerEvent).kind === 'ERROR') {
      this.emitServer(evt as RealtimeServerEvent);
    }
  }

  private onTtsEvent(evt: RealtimeServerEvent | SpeechChunkEvent): void {
    const anyEvt = evt as { turn_id?: string; type?: string };
    if (!this.isCurrentTurn(anyEvt.turn_id) && this.ctx.active_tts_turn_id !== anyEvt.turn_id) {
      this.ctx.stale_event_drop_count += 1;
      return;
    }
    if (anyEvt.type === 'TTS_STARTED' && this.ctx.last_tts_first_event_ms === null) {
      this.ctx.last_tts_first_event_ms = Date.now() - this.ctx.last_activity_at;
    }
    this.emitServer({
      kind: 'TTS_EVENT',
      session_id: this.ctx.session_id,
      turn_id: anyEvt.turn_id,
      payload: { event: evt },
    });
    if (anyEvt.type === 'TTS_COMPLETE') {
      // 让 Avatar 触发 PERFORMANCE_COMPLETE, 然后回到 LISTENING
      const t = this.ctx.active_avatar_turn_id ?? this.ctx.active_tts_turn_id;
      if (t) this.avatar.complete(t);
      this.ctx.active_tts_turn_id = null;
      // 回到 LISTENING
      this.transitionState('LISTENING');
    }
  }

  private onAvatarEvent(evt: AvatarEvent): void {
    if (!this.isCurrentTurn(evt.turn_id) && this.ctx.active_avatar_turn_id !== evt.turn_id) {
      this.ctx.stale_event_drop_count += 1;
      return;
    }
    if (evt.type === 'PERFORMANCE_STARTED' && this.ctx.last_avatar_first_motion_ms === null) {
      this.ctx.last_avatar_first_motion_ms = Date.now() - this.ctx.last_activity_at;
    }
    this.emitServer({
      kind: 'AVATAR_EVENT',
      session_id: this.ctx.session_id,
      turn_id: evt.turn_id,
      payload: { event: evt },
    });
    if (evt.type === 'PERFORMANCE_COMPLETE') {
      this.ctx.active_avatar_turn_id = null;
    }
  }
}

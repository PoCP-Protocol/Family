export type PrincipalSceneMode = 'INTERACTIVE_CHAT' | 'MICRO_LESSON' | 'FAMILY_DIALOGUE';

export type PrincipalSafetyRoute = 'NORMAL' | 'REVIEW' | 'HIGH_RISK';

export type RealtimeSessionState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'HUMAN_GATE'
  | 'CLOSED';

export interface MediaConsentContext {
  consented: boolean;
  purpose: 'SERVICE' | 'LAB' | 'DEMO';
  subjectType: 'USER' | 'CHILD' | 'HOUSEHOLD';
}

export interface PrincipalRuntimeInput {
  request_id: string;
  session_id: string;
  entry_point: 'ASK_FAMILI_PRINCIPAL';
  user_message: string;
  scene_hint?: PrincipalSceneMode;
  consent_context: MediaConsentContext;
  family_context_read_allowed?: boolean;
}

// 传输层 envelope：只用于把权威 PrincipalAiOutput 打包给客户端展示/telemetry。
// 领域权威 output 请从 @family/principal-ai 引入,不要在这里重定义业务字段。
// 注意:此 envelope 不承载核心业务字段(opening/what_i_hear/say_it_tonight/one_small_action/…),
// 那些必须来自 @family/principal-ai#PrincipalAiOutput。
export interface PrincipalRealtimeOutputEnvelope {
  turn_id: string;
  request_id: string;
  session_id: string;
  generation_id: string;
  entry_point: 'ASK_FAMILI_PRINCIPAL';
  risk_route: PrincipalSafetyRoute;
  scenario_id: string;
  method_refs: string[];
  source_refs: string[];
  safety_status: 'SAFE' | 'REVIEW' | 'HIGH_RISK';
  soul_version: string;
  model_provider: string;
  model_name: string;
  schema_validation: 'PASS' | 'FAIL';
  principal_latency_ms: number;
  consent_context: MediaConsentContext;
  // 权威 output 的 JSON 快照,仅供 UI 呈现:
  authoritative_output_ref: {
    prompt_version: string;
    schema_version: string;
  };
}

/**
 * @deprecated 传输层遗留 envelope,仅供 MM1-A3 前的旧 avatar-lab runtime.ts / main.ts / server.spec.ts
 * 保持编译通过。**不得**在新代码中使用。领域权威 PrincipalAiOutput 请从 `@family/principal-ai` 引入。
 * SAFE_TO_REMOVE 时会随旧文件一并清除。
 */
export interface PrincipalAiOutput {
  turn_id: string;
  request_id: string;
  session_id: string;
  entry_point: 'ASK_FAMILI_PRINCIPAL';
  response_text: string;
  risk_route: PrincipalSafetyRoute;
  scenario_id: string;
  method_refs: string[];
  source_refs: string[];
  safety_status: 'SAFE' | 'REVIEW' | 'HIGH_RISK';
  soul_version: string;
  model_provider: string;
  schema_validation: 'PASS' | 'FAIL';
  family_context_read_allowed: boolean;
  consent_context: MediaConsentContext;
}

export interface PrincipalRuntimeTelemetry {
  turn_id: string;
  request_id: string;
  scenario_id: string;
  risk_route: PrincipalSafetyRoute;
  method_refs: string[];
  source_refs: string[];
  soul_version: string;
  model_provider: string;
  schema_validation: 'PASS' | 'FAIL';
}

export interface PrincipalMultimodalTurn {
  turn_id: string;
  session_id: string;
  input: {
    text?: string;
    audio_ref?: string;
    image_refs?: string[];
  };
  normalized: {
    transcript?: string;
    visual_observations?: VisualObservation[];
  };
  consent_context: MediaConsentContext;
  source_surface: PrincipalSceneMode;
}

export interface TranscriptEvent {
  type: 'TRANSCRIPT_PARTIAL' | 'TRANSCRIPT_FINAL';
  turn_id: string;
  text: string;
  timestamp_ms: number;
}

export interface VisualObservation {
  kind: 'TEXT' | 'IMAGE' | 'SCENE';
  content: string;
  confidence: number;
}

export interface SpeechPlan {
  pace: 'SLOW' | 'MEDIUM' | 'FAST';
  tone: 'CALM_WARM' | 'WARM_FIRM' | 'CLEAR_TEACHING' | 'CALM_SERIOUS' | 'CALM_CAUTIOUS';
  pauses_ms: number[];
  emphasis: string[];
}

export interface AvatarPerformancePlan {
  expression: string;
  gesture: string;
  gaze: 'USER' | 'SOFT_DOWN_THINKING' | 'RETURN_USER' | 'AWAY' | 'STABLE';
  posture: 'RELAXED' | 'STEADY' | 'FORWARD';
}

export interface VisualAidPlan {
  subtitle_mode: 'NORMAL' | 'SERIOUS' | 'HIGHLIGHT';
  action_card?: string;
}

export interface PrincipalPerformancePlan {
  speech: SpeechPlan;
  avatar: AvatarPerformancePlan;
  visual?: VisualAidPlan;
}

export interface SpeechChunkEvent {
  type: 'TTS_STARTED' | 'AUDIO_CHUNK' | 'VISEME' | 'TTS_COMPLETE' | 'TTS_ERROR';
  turn_id: string;
  chunk_id?: string;
  text?: string;
  viseme?: string;
  timestamp_ms: number;
}

export interface VisemeEvent {
  type: 'VISEME';
  turn_id: string;
  viseme: string;
  timestamp_ms: number;
}

export interface AvatarEvent {
  type:
    | 'AVATAR_READY'
    | 'PERFORMANCE_STARTED'
    | 'EXPRESSION_CHANGED'
    | 'GESTURE_CHANGED'
    | 'VISEME_CHANGED'
    | 'PERFORMANCE_CANCELLED'
    | 'PERFORMANCE_COMPLETE';
  turn_id: string;
  expression?: string;
  gesture?: string;
  viseme?: string;
  timestamp_ms: number;
}

export interface RealtimeSessionEvent {
  type: 'STATE_CHANGED' | 'TRANSCRIPT' | 'SPEECH' | 'AVATAR' | 'INTERRUPTED' | 'HUMAN_GATE';
  state?: RealtimeSessionState;
  payload?: Record<string, unknown>;
  timestamp_ms: number;
}

export interface RealtimeClientCommand {
  kind:
    | 'SESSION_START'
    | 'AUDIO_CHUNK'
    | 'TEXT_INPUT'
    | 'SIMULATED_VOICE'
    | 'INPUT_END'
    | 'INTERRUPT'
    | 'SESSION_CLOSE'
    | 'TELEMETRY_REQUEST';
  turn_id?: string;
  session_id?: string;
  text?: string;
  payload?: Record<string, unknown>;
}

export interface RealtimeServerEvent {
  kind:
    | 'STATE_CHANGED'
    | 'PARTIAL_TRANSCRIPT'
    | 'FINAL_TRANSCRIPT'
    | 'PRINCIPAL_RESPONSE'
    | 'PERFORMANCE_PLAN'
    | 'TTS_EVENT'
    | 'AVATAR_EVENT'
    | 'SAFETY_ROUTE'
    | 'ERROR'
    | 'INTERRUPTED'
    | 'TELEMETRY';
  session_id?: string;
  turn_id?: string;
  payload?: Record<string, unknown>;
}

export interface BargeInEvent extends RealtimeServerEvent {
  kind: 'INTERRUPTED';
  turn_id: string;
}

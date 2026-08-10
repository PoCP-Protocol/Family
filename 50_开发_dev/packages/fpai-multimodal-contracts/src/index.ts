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
  kind: 'SESSION_START' | 'AUDIO_CHUNK' | 'TEXT_INPUT' | 'INPUT_END' | 'INTERRUPT' | 'SESSION_CLOSE';
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
    | 'INTERRUPTED';
  session_id?: string;
  turn_id?: string;
  payload?: Record<string, unknown>;
}

export interface BargeInEvent extends RealtimeServerEvent {
  kind: 'INTERRUPTED';
  turn_id: string;
}

/**
 * MM1-B0 · Benchmark Metrics
 *
 * 定义测量点、派生指标、分位数计算,与
 * products/famili-principal/multimodal/FPAI_MM1B_BENCHMARK_SPEC_V1.md §3-4 对齐。
 */

/** 时钟来源。跨机比较必须先记录时钟。 */
export type ClockSource = 'client_performance_now' | 'server_date_now' | 'harness_hrtime';

export interface TurnTimeMarks {
  T0_user_speech_starts?: number;
  T1_asr_first_partial?: number;
  T2_asr_final?: number;
  T3_principal_start?: number;
  T4_principal_result?: number;
  T5_tts_request?: number;
  T6_tts_first_audio?: number;
  T7_avatar_first_motion?: number;
  T8_speech_complete?: number;
  INTERRUPT_T0_user_interrupts?: number;
  INTERRUPT_T1_tts_stopped?: number;
  INTERRUPT_T2_avatar_stopped?: number;
}

export interface TurnMetrics {
  asr_partial_ms?: number;
  asr_final_ms?: number;
  principal_ms?: number;
  tts_first_audio_ms?: number;
  avatar_first_motion_ms?: number;
  turn_first_response_ms?: number;
  tts_cancel_ms?: number;
  avatar_cancel_ms?: number;
  overall_barge_in_ms?: number;
}

export function deriveTurnMetrics(marks: TurnTimeMarks): TurnMetrics {
  const m: TurnMetrics = {};
  if (marks.T0_user_speech_starts != null && marks.T1_asr_first_partial != null) {
    m.asr_partial_ms = marks.T1_asr_first_partial - marks.T0_user_speech_starts;
  }
  if (marks.T0_user_speech_starts != null && marks.T2_asr_final != null) {
    m.asr_final_ms = marks.T2_asr_final - marks.T0_user_speech_starts;
  }
  if (marks.T3_principal_start != null && marks.T4_principal_result != null) {
    m.principal_ms = marks.T4_principal_result - marks.T3_principal_start;
  }
  if (marks.T5_tts_request != null && marks.T6_tts_first_audio != null) {
    m.tts_first_audio_ms = marks.T6_tts_first_audio - marks.T5_tts_request;
  }
  if (marks.T5_tts_request != null && marks.T7_avatar_first_motion != null) {
    m.avatar_first_motion_ms = marks.T7_avatar_first_motion - marks.T5_tts_request;
  }
  if (marks.T0_user_speech_starts != null && marks.T6_tts_first_audio != null) {
    m.turn_first_response_ms = marks.T6_tts_first_audio - marks.T0_user_speech_starts;
  }
  if (marks.INTERRUPT_T0_user_interrupts != null && marks.INTERRUPT_T1_tts_stopped != null) {
    m.tts_cancel_ms = marks.INTERRUPT_T1_tts_stopped - marks.INTERRUPT_T0_user_interrupts;
  }
  if (marks.INTERRUPT_T0_user_interrupts != null && marks.INTERRUPT_T2_avatar_stopped != null) {
    m.avatar_cancel_ms = marks.INTERRUPT_T2_avatar_stopped - marks.INTERRUPT_T0_user_interrupts;
  }
  if (m.tts_cancel_ms != null || m.avatar_cancel_ms != null) {
    m.overall_barge_in_ms = Math.max(m.tts_cancel_ms ?? 0, m.avatar_cancel_ms ?? 0);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Quantile helpers
// ---------------------------------------------------------------------------

export interface QuantileSummary {
  n: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  stddev: number;
  min: number;
  max: number;
}

/** 简单的百分位数(线性插值)。忽略 undefined。空数组返回 0 分布,便于 harness 输出 schema 完整。 */
export function summarize(values: Array<number | undefined>): QuantileSummary {
  const nums = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (nums.length === 0) {
    return { n: 0, p50: 0, p95: 0, p99: 0, mean: 0, stddev: 0, min: 0, max: 0 };
  }
  const sorted = [...nums].sort((a, b) => a - b);
  const q = (p: number): number => {
    if (sorted.length === 1) return sorted[0];
    const rank = p * (sorted.length - 1);
    const lo = Math.floor(rank);
    const hi = Math.ceil(rank);
    if (lo === hi) return sorted[lo];
    const frac = rank - lo;
    return sorted[lo] + (sorted[hi] - sorted[lo]) * frac;
  };
  const mean = nums.reduce((s, v) => s + v, 0) / nums.length;
  const variance = nums.reduce((s, v) => s + (v - mean) * (v - mean), 0) / nums.length;
  return {
    n: nums.length,
    p50: q(0.5),
    p95: q(0.95),
    p99: q(0.99),
    mean,
    stddev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

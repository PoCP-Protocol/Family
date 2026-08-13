import { describe, expect, it } from 'vitest';

import { deriveTurnMetrics, summarize } from './metrics';

describe('benchmark · metrics derivation', () => {
  it('BM-MET-01 · derives full turn metrics from complete time marks', () => {
    const m = deriveTurnMetrics({
      T0_user_speech_starts: 1000,
      T1_asr_first_partial: 1120,
      T2_asr_final: 1450,
      T3_principal_start: 1460,
      T4_principal_result: 1560,
      T5_tts_request: 1565,
      T6_tts_first_audio: 1620,
      T7_avatar_first_motion: 1580,
      T8_speech_complete: 3000,
      INTERRUPT_T0_user_interrupts: 2000,
      INTERRUPT_T1_tts_stopped: 2050,
      INTERRUPT_T2_avatar_stopped: 2020,
    });
    expect(m.asr_partial_ms).toBe(120);
    expect(m.asr_final_ms).toBe(450);
    expect(m.principal_ms).toBe(100);
    expect(m.tts_first_audio_ms).toBe(55);
    expect(m.avatar_first_motion_ms).toBe(15);
    expect(m.turn_first_response_ms).toBe(620);
    expect(m.tts_cancel_ms).toBe(50);
    expect(m.avatar_cancel_ms).toBe(20);
    expect(m.overall_barge_in_ms).toBe(50);
  });

  it('BM-MET-02 · missing marks → metric undefined (does not fabricate)', () => {
    const m = deriveTurnMetrics({ T0_user_speech_starts: 100 });
    expect(m.asr_partial_ms).toBeUndefined();
    expect(m.turn_first_response_ms).toBeUndefined();
  });
});

describe('benchmark · summarize', () => {
  it('BM-SUM-01 · empty array → zero-filled distribution', () => {
    const s = summarize([]);
    expect(s.n).toBe(0);
    expect(s.p50).toBe(0);
    expect(s.p95).toBe(0);
    expect(s.mean).toBe(0);
    expect(s.stddev).toBe(0);
  });

  it('BM-SUM-02 · single value → all quantiles equal that value', () => {
    const s = summarize([42]);
    expect(s.n).toBe(1);
    expect(s.p50).toBe(42);
    expect(s.p95).toBe(42);
    expect(s.min).toBe(42);
    expect(s.max).toBe(42);
    expect(s.stddev).toBe(0);
  });

  it('BM-SUM-03 · monotonic small set → correct quantiles', () => {
    const s = summarize([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(s.n).toBe(10);
    expect(s.min).toBe(10);
    expect(s.max).toBe(100);
    expect(s.mean).toBe(55);
    // p50 linear interp: index 4.5 → (50+60)/2 = 55
    expect(s.p50).toBe(55);
  });

  it('BM-SUM-04 · ignores undefined and NaN', () => {
    const s = summarize([1, undefined, 2, Number.NaN, 3]);
    expect(s.n).toBe(3);
    expect(s.mean).toBe(2);
  });
});

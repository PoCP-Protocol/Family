/**
 * MM1-B0 · Benchmark Runner
 *
 * 组合 STT / TTS / Avatar provider,对 utterance suite 逐条测量。
 * MM1-B0 only supports Fake baseline;真实 provider 由 MM1-B1 通过
 * registry.lookupXxx 注入,runner 逻辑不变。
 */

import {
  FakeSpeechToTextGateway,
  FakeTextToSpeechGateway,
} from '@family/speech-gateway';
import { FakeAvatarGateway } from '@family/avatar-gateway';
import type { AvatarGateway } from '@family/avatar-gateway';
import type {
  SpeechToTextGateway,
  TextToSpeechGateway,
} from '@family/speech-gateway';

import {
  UTTERANCE_SEED,
  type UtteranceFixture,
} from './fixtures';
import {
  deriveTurnMetrics,
  summarize,
  type QuantileSummary,
  type TurnMetrics,
  type TurnTimeMarks,
} from './metrics';

// ---------------------------------------------------------------------------
// Result shape (machine-readable, aligns with FPAI_MM1B_BENCHMARK_SPEC_V1.md §8.1)
// ---------------------------------------------------------------------------

export type ProviderClassLabel = 'FAKE_BASELINE' | 'REAL';

export interface BenchmarkProviderRef {
  provider_id: string;
  provider_class: ProviderClassLabel;
}

export interface BenchmarkResult {
  harness_version: string;
  run_id: string;
  provider_class: ProviderClassLabel;
  clock_source: 'harness_hrtime';
  stt: {
    provider: BenchmarkProviderRef;
    metrics: {
      asr_partial_ms: QuantileSummary;
      asr_final_ms: QuantileSummary;
    };
  };
  tts: {
    provider: BenchmarkProviderRef;
    metrics: {
      tts_first_audio_ms: QuantileSummary;
      chunk_count_p50: number;
      viseme_provided: boolean;
      timing_provided: boolean;
    };
  };
  avatar: {
    provider: BenchmarkProviderRef;
    metrics: {
      avatar_first_motion_ms: QuantileSummary;
      avatar_cancel_ms: QuantileSummary;
    };
  };
  e2e: {
    metrics: {
      turn_first_response_ms: QuantileSummary;
      overall_barge_in_ms: QuantileSummary;
    };
  };
  utterance_count: number;
  per_utterance: Array<{
    utterance_id: string;
    metrics: TurnMetrics;
  }>;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface BenchmarkRunOptions {
  stt: {
    provider_id: string;
    provider_class: ProviderClassLabel;
    factory: () => SpeechToTextGateway;
  };
  tts: {
    provider_id: string;
    provider_class: ProviderClassLabel;
    factory: () => TextToSpeechGateway;
  };
  avatar: {
    provider_id: string;
    provider_class: ProviderClassLabel;
    factory: () => AvatarGateway;
  };
  utterances?: readonly UtteranceFixture[];
  /** 每条 utterance 中在 tts_first_audio 到达后触发的模拟打断延迟(ms)。 */
  interrupt_at_ms?: number;
  harness_version?: string;
  run_id?: string;
  clock?: () => number;
}

export async function runBenchmark(opts: BenchmarkRunOptions): Promise<BenchmarkResult> {
  const clock = opts.clock ?? (() => Number(process.hrtime.bigint() / 1_000_000n));
  const utterances = opts.utterances ?? UTTERANCE_SEED;
  const interruptAfter = opts.interrupt_at_ms ?? 20;

  // 统一为 FAKE_BASELINE 若三方都是 fake,否则 REAL(混合视为 REAL)。
  const providerClass: ProviderClassLabel =
    opts.stt.provider_class === 'FAKE_BASELINE' &&
    opts.tts.provider_class === 'FAKE_BASELINE' &&
    opts.avatar.provider_class === 'FAKE_BASELINE'
      ? 'FAKE_BASELINE'
      : 'REAL';

  const notes: string[] = [];
  if (providerClass === 'FAKE_BASELINE') {
    notes.push(
      'PROVIDER_CLASS=FAKE_BASELINE — 结果不得与真实 provider 横向比较得出商业结论。',
    );
  }

  const perUtterance: Array<{ utterance_id: string; metrics: TurnMetrics }> = [];
  const asrPartials: number[] = [];
  const asrFinals: number[] = [];
  const ttsFirstAudios: number[] = [];
  const avatarFirstMotions: number[] = [];
  const turnFirstResponses: number[] = [];
  const avatarCancels: number[] = [];
  const bargeInAlls: number[] = [];
  const chunkCounts: number[] = [];
  let visemeProvided = false;
  let timingProvided = false;

  for (const utt of utterances) {
    const marks: TurnTimeMarks = {};
    const turnId = `bench-${utt.id}-${Math.random().toString(36).slice(2, 8)}`;

    // 每 utterance fresh gateway,避免 state 泄漏。
    const stt = opts.stt.factory();
    const tts = opts.tts.factory();
    const avatar = opts.avatar.factory();

    // ---- STT phase (Fake 用 setPendingTranscript 注入文本) ----
    let firstPartialSeen = false;
    stt.onEvent((ev) => {
      if ('type' in ev && ev.type === 'TRANSCRIPT_PARTIAL' && !firstPartialSeen) {
        marks.T1_asr_first_partial = clock();
        firstPartialSeen = true;
      }
      if ('type' in ev && ev.type === 'TRANSCRIPT_FINAL') {
        marks.T2_asr_final = clock();
      }
    });

    if (stt instanceof FakeSpeechToTextGateway) {
      stt.setPendingTranscript(turnId, utt.text);
    }

    marks.T0_user_speech_starts = clock();
    stt.startSession(turnId);
    stt.pushAudioChunk(turnId, new Uint8Array(1)); // 第 1 块 → PARTIAL
    stt.pushAudioChunk(turnId, new Uint8Array(1));
    stt.finishInput(turnId); // → FINAL

    // ---- Principal phase (harness 里 mock,不引入真实 principal) ----
    marks.T3_principal_start = clock();
    // 让 event loop 走一圈,近似真实异步
    await new Promise((r) => setTimeout(r, 0));
    marks.T4_principal_result = clock();

    // ---- TTS phase ----
    let firstAudioSeen = false;
    let chunkCount = 0;
    await new Promise<void>((resolve) => {
      tts.onEvent((ev) => {
        const t = 'type' in ev ? ev.type : ev.kind;
        if (t === 'AUDIO_CHUNK') {
          if (!firstAudioSeen) {
            marks.T6_tts_first_audio = clock();
            firstAudioSeen = true;
          }
          chunkCount += 1;
        }
        if (t === 'VISEME') {
          visemeProvided = true;
        }
        if (t === 'TTS_COMPLETE') {
          marks.T8_speech_complete = clock();
          resolve();
        }
        if (t === 'TTS_ERROR') {
          // interrupt path;不 resolve 这里,由 interrupt handler 分别结算
          resolve();
        }
      });
      marks.T5_tts_request = clock();
      // 概略仿 principal 回复:回显同文本作为 TTS 输入
      tts.synthesizeStream(turnId, utt.text);
    });

    chunkCounts.push(chunkCount);
    // Fake TTS 目前不提供 word/phoneme timing → timingProvided 保持 false;
    // 若未来某 provider 通过 event 携带 timing,需在这里检测。
    if (!timingProvided && false) timingProvided = true; // 显式占位,禁止误报

    // ---- Avatar phase (在 T5 之后立刻启动;由 orchestrator 实际驱动 viseme) ----
    let avatarFirstMotionSeen = false;
    let avatarCancelSeen = false;
    avatar.onEvent((ev) => {
      if (
        !avatarFirstMotionSeen &&
        (ev.type === 'EXPRESSION_CHANGED' || ev.type === 'GESTURE_CHANGED' || ev.type === 'VISEME_CHANGED')
      ) {
        marks.T7_avatar_first_motion = clock();
        avatarFirstMotionSeen = true;
      }
      if (!avatarCancelSeen && ev.type === 'PERFORMANCE_CANCELLED') {
        marks.INTERRUPT_T2_avatar_stopped = clock();
        avatarCancelSeen = true;
      }
    });
    avatar.startPerformance(turnId, {
      expression: 'ATTENTIVE',
      gesture: 'SMALL_OPEN_HAND',
      gaze: 'USER',
      posture: 'RELAXED',
    });

    // ---- Interrupt simulation (opt-in, 每条 utterance 都试一次 barge-in) ----
    await new Promise((r) => setTimeout(r, interruptAfter));
    marks.INTERRUPT_T0_user_interrupts = clock();
    marks.INTERRUPT_T1_tts_stopped = clock();
    tts.cancel(turnId);
    avatar.cancel(turnId);
    // 给 event loop 一次机会,让 PERFORMANCE_CANCELLED 冒出
    await new Promise((r) => setTimeout(r, 0));

    const m = deriveTurnMetrics(marks);
    perUtterance.push({ utterance_id: utt.id, metrics: m });

    if (m.asr_partial_ms != null) asrPartials.push(m.asr_partial_ms);
    if (m.asr_final_ms != null) asrFinals.push(m.asr_final_ms);
    if (m.tts_first_audio_ms != null) ttsFirstAudios.push(m.tts_first_audio_ms);
    if (m.avatar_first_motion_ms != null) avatarFirstMotions.push(m.avatar_first_motion_ms);
    if (m.turn_first_response_ms != null) turnFirstResponses.push(m.turn_first_response_ms);
    if (m.avatar_cancel_ms != null) avatarCancels.push(m.avatar_cancel_ms);
    if (m.overall_barge_in_ms != null) bargeInAlls.push(m.overall_barge_in_ms);
  }

  const p50Chunks = chunkCounts.length ? [...chunkCounts].sort((a, b) => a - b)[Math.floor(chunkCounts.length / 2)] : 0;

  return {
    harness_version: opts.harness_version ?? '0.1.0',
    run_id: opts.run_id ?? `run-${new Date().toISOString()}`,
    provider_class: providerClass,
    clock_source: 'harness_hrtime',
    stt: {
      provider: { provider_id: opts.stt.provider_id, provider_class: opts.stt.provider_class },
      metrics: {
        asr_partial_ms: summarize(asrPartials),
        asr_final_ms: summarize(asrFinals),
      },
    },
    tts: {
      provider: { provider_id: opts.tts.provider_id, provider_class: opts.tts.provider_class },
      metrics: {
        tts_first_audio_ms: summarize(ttsFirstAudios),
        chunk_count_p50: p50Chunks,
        viseme_provided: visemeProvided,
        timing_provided: timingProvided,
      },
    },
    avatar: {
      provider: { provider_id: opts.avatar.provider_id, provider_class: opts.avatar.provider_class },
      metrics: {
        avatar_first_motion_ms: summarize(avatarFirstMotions),
        avatar_cancel_ms: summarize(avatarCancels),
      },
    },
    e2e: {
      metrics: {
        turn_first_response_ms: summarize(turnFirstResponses),
        overall_barge_in_ms: summarize(bargeInAlls),
      },
    },
    utterance_count: utterances.length,
    per_utterance: perUtterance,
    notes,
  };
}

/** 快捷:用三个 Fake baseline 跑一次。测试用。 */
export function runFakeBaseline(overrides?: Partial<BenchmarkRunOptions>): Promise<BenchmarkResult> {
  return runBenchmark({
    stt: {
      provider_id: 'stt.fake_baseline',
      provider_class: 'FAKE_BASELINE',
      factory: () => new FakeSpeechToTextGateway(),
    },
    tts: {
      provider_id: 'tts.fake_baseline',
      provider_class: 'FAKE_BASELINE',
      factory: () => new FakeTextToSpeechGateway(),
    },
    avatar: {
      provider_id: 'avatar.fake_baseline',
      provider_class: 'FAKE_BASELINE',
      factory: () => new FakeAvatarGateway(),
    },
    ...overrides,
  });
}

/**
 * MM1-B0 · Benchmark Reporters
 * - toJSON: machine-readable
 * - toMarkdown: human-readable
 */

import type { BenchmarkResult } from './runner';
import type { QuantileSummary } from './metrics';

export function toJSON(result: BenchmarkResult): string {
  return JSON.stringify(result, null, 2);
}

function fmt(q: QuantileSummary): string {
  return `n=${q.n} · p50=${q.p50.toFixed(2)} · p95=${q.p95.toFixed(2)} · p99=${q.p99.toFixed(2)} · mean=${q.mean.toFixed(2)} ± ${q.stddev.toFixed(2)} · [${q.min.toFixed(2)}, ${q.max.toFixed(2)}]`;
}

export function toMarkdown(result: BenchmarkResult): string {
  const lines: string[] = [];
  lines.push(`# FPAI-MM Benchmark Result · ${result.run_id}`);
  lines.push('');
  lines.push(`**provider_class**: \`${result.provider_class}\``);
  lines.push(`**harness_version**: ${result.harness_version}`);
  lines.push(`**clock_source**: ${result.clock_source}`);
  lines.push(`**utterance_count**: ${result.utterance_count}`);
  lines.push('');
  lines.push('## STT');
  lines.push(`- provider: \`${result.stt.provider.provider_id}\` (${result.stt.provider.provider_class})`);
  lines.push(`- asr_partial_ms: ${fmt(result.stt.metrics.asr_partial_ms)}`);
  lines.push(`- asr_final_ms: ${fmt(result.stt.metrics.asr_final_ms)}`);
  lines.push('');
  lines.push('## TTS');
  lines.push(`- provider: \`${result.tts.provider.provider_id}\` (${result.tts.provider.provider_class})`);
  lines.push(`- tts_first_audio_ms: ${fmt(result.tts.metrics.tts_first_audio_ms)}`);
  lines.push(`- chunk_count_p50: ${result.tts.metrics.chunk_count_p50}`);
  lines.push(`- viseme_provided: ${result.tts.metrics.viseme_provided}`);
  lines.push(`- timing_provided: ${result.tts.metrics.timing_provided}`);
  lines.push('');
  lines.push('## Avatar');
  lines.push(`- provider: \`${result.avatar.provider.provider_id}\` (${result.avatar.provider.provider_class})`);
  lines.push(`- avatar_first_motion_ms: ${fmt(result.avatar.metrics.avatar_first_motion_ms)}`);
  lines.push(`- avatar_cancel_ms: ${fmt(result.avatar.metrics.avatar_cancel_ms)}`);
  lines.push('');
  lines.push('## E2E');
  lines.push(`- turn_first_response_ms: ${fmt(result.e2e.metrics.turn_first_response_ms)}`);
  lines.push(`- overall_barge_in_ms: ${fmt(result.e2e.metrics.overall_barge_in_ms)}`);
  lines.push('');
  if (result.notes.length > 0) {
    lines.push('## Notes');
    for (const n of result.notes) lines.push(`- ${n}`);
    lines.push('');
  }
  return lines.join('\n');
}

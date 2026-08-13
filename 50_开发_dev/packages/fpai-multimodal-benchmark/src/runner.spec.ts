import { describe, expect, it } from 'vitest';

import { runFakeBaseline } from './runner';
import { toJSON, toMarkdown } from './reporters';
import { UTTERANCE_SEED } from './fixtures';

describe('benchmark · fake baseline run', () => {
  it('BM-RUN-01 · fake baseline runs without throwing and covers all utterances', async () => {
    const result = await runFakeBaseline();
    expect(result.provider_class).toBe('FAKE_BASELINE');
    expect(result.utterance_count).toBe(UTTERANCE_SEED.length);
    expect(result.per_utterance).toHaveLength(UTTERANCE_SEED.length);
  });

  it('BM-RUN-02 · every derived metric is finite non-negative in fake baseline', async () => {
    const result = await runFakeBaseline();
    for (const rec of result.per_utterance) {
      for (const [name, value] of Object.entries(rec.metrics)) {
        if (value === undefined) continue;
        expect(Number.isFinite(value), `${rec.utterance_id}.${name} finite`).toBe(true);
        expect(value, `${rec.utterance_id}.${name} >=0`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('BM-RUN-03 · TTS chunk_count_p50 > 0 in fake baseline (fake TTS 分块必发)', async () => {
    const result = await runFakeBaseline();
    expect(result.tts.metrics.chunk_count_p50).toBeGreaterThan(0);
    expect(result.tts.metrics.viseme_provided).toBe(true);
  });

  it('BM-RUN-04 · notes contains FAKE_BASELINE warning', async () => {
    const result = await runFakeBaseline();
    expect(result.notes.some((n) => n.includes('FAKE_BASELINE'))).toBe(true);
  });
});

describe('benchmark · reporters', () => {
  it('BM-RPT-01 · toJSON is parseable and has expected top-level keys', async () => {
    const result = await runFakeBaseline();
    const parsed = JSON.parse(toJSON(result));
    for (const key of [
      'harness_version',
      'run_id',
      'provider_class',
      'stt',
      'tts',
      'avatar',
      'e2e',
      'utterance_count',
      'per_utterance',
      'notes',
    ]) {
      expect(parsed).toHaveProperty(key);
    }
  });

  it('BM-RPT-02 · toMarkdown includes all sections', async () => {
    const result = await runFakeBaseline();
    const md = toMarkdown(result);
    expect(md).toContain('# FPAI-MM Benchmark Result');
    expect(md).toContain('## STT');
    expect(md).toContain('## TTS');
    expect(md).toContain('## Avatar');
    expect(md).toContain('## E2E');
    expect(md).toContain('FAKE_BASELINE');
  });
});

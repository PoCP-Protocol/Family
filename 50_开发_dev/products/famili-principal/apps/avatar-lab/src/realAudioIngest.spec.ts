/**
 * MM1-B1 · RealAudioIngest tests
 */
import { describe, expect, it } from 'vitest';
import { RealAudioIngest } from './realAudioIngest';
import type { SpeechToTextGateway } from '@family/speech-gateway';

function makeFakeStt() {
  const started: string[] = [];
  const chunks: Array<{ turnId: string; bytes: Uint8Array }> = [];
  const finished: string[] = [];
  const cancelled: string[] = [];
  const stt: SpeechToTextGateway = {
    startSession(t) {
      started.push(t);
    },
    pushAudioChunk(t, b) {
      chunks.push({ turnId: t, bytes: b });
    },
    finishInput(t) {
      finished.push(t);
    },
    cancel(t) {
      cancelled.push(t);
    },
    onEvent() {},
  };
  return { stt, started, chunks, finished, cancelled };
}

function pcmBytes(sampleCount: number): Uint8Array {
  return new Uint8Array(sampleCount * 2);
}

describe('mm1-b1 · RealAudioIngest', () => {
  it('RAI-01 · start 转发到 stt.startSession', () => {
    const f = makeFakeStt();
    const ingest = new RealAudioIngest({ turnId: 't1', stt: f.stt });
    ingest.start();
    expect(f.started).toEqual(['t1']);
  });

  it('RAI-02 · pushBinaryFrame 前必须 start', () => {
    const f = makeFakeStt();
    const ingest = new RealAudioIngest({ turnId: 't1', stt: f.stt });
    expect(() => ingest.pushBinaryFrame(pcmBytes(100))).toThrow();
  });

  it('RAI-03 · pushBinaryFrame 转发 normalizer 输出到 stt', () => {
    const f = makeFakeStt();
    const ingest = new RealAudioIngest({ turnId: 't1', stt: f.stt });
    ingest.start();
    ingest.pushBinaryFrame(pcmBytes(160)); // 10ms @16k
    ingest.pushBinaryFrame(pcmBytes(320));
    expect(f.chunks).toHaveLength(2);
    expect(f.chunks[0].turnId).toBe('t1');
    expect(f.chunks[0].bytes.byteLength).toBe(320);
    expect(f.chunks[1].bytes.byteLength).toBe(640);
  });

  it('RAI-04 · onFrame 只暴露 sequence + sample_count, 不暴露 payload', () => {
    const f = makeFakeStt();
    const infos: Array<{ sequence: number; sample_count: number }> = [];
    const ingest = new RealAudioIngest({
      turnId: 't1',
      stt: f.stt,
      onFrame: (info) => infos.push(info),
    });
    ingest.start();
    ingest.pushBinaryFrame(pcmBytes(160));
    ingest.pushBinaryFrame(pcmBytes(160));
    expect(infos).toEqual([
      { sequence: 0, sample_count: 160 },
      { sequence: 1, sample_count: 160 },
    ]);
  });

  it('RAI-05 · finish 转发 stt.finishInput, 二次调用无副作用', () => {
    const f = makeFakeStt();
    const ingest = new RealAudioIngest({ turnId: 't1', stt: f.stt });
    ingest.start();
    ingest.finish();
    ingest.finish();
    expect(f.finished).toEqual(['t1']);
  });

  it('RAI-06 · cancel 转发 stt.cancel, 之后 pushBinaryFrame 静默丢弃', () => {
    const f = makeFakeStt();
    const ingest = new RealAudioIngest({ turnId: 't1', stt: f.stt });
    ingest.start();
    ingest.cancel();
    expect(f.cancelled).toEqual(['t1']);
    ingest.pushBinaryFrame(pcmBytes(160));
    // pushBinaryFrame after cancel: closed=true → early return, 无新 chunk
    expect(f.chunks).toHaveLength(0);
  });
});

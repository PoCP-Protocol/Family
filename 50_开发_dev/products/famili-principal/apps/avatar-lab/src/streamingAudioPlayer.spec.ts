/**
 * MM1-B1.1 · StreamingAudioPlayer tests (§D)
 * 使用 fake AudioContext, 完全离线。
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import { StreamingAudioPlayer } from './streamingAudioPlayer';

function makeFakeContext(sampleRate: number) {
  let currentTime = 0;
  const started: any[] = [];
  const stopped: any[] = [];
  const ctx: any = {
    get currentTime() { return currentTime; },
    sampleRate,
    destination: { __d: true },
    createBuffer(_ch: number, length: number, sr: number) {
      const data = new Float32Array(length);
      return {
        duration: length / sr,
        length,
        sampleRate: sr,
        numberOfChannels: 1,
        getChannelData: (_i: number) => data,
      };
    },
    createBufferSource() {
      const source: any = {
        buffer: null,
        onended: null,
        _started: false,
        _stopped: false,
        connect: (_dst: any) => {},
        start: (_when?: number) => {
          source._started = true;
          started.push(source);
        },
        stop: (_when?: number) => {
          source._stopped = true;
          stopped.push(source);
        },
        disconnect: () => {},
      };
      return source;
    },
    close: () => {},
    __advance(sec: number) { currentTime += sec; },
    __started: started,
    __stopped: stopped,
  };
  return ctx;
}

function pcm(nSamples: number, value = 100): Uint8Array {
  const out = new Uint8Array(nSamples * 2);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < nSamples; i++) dv.setInt16(i * 2, value, true);
  return out;
}

describe('mm1-b1.1 · StreamingAudioPlayer (§D)', () => {
  it('PLAYER-01 · beginTurn + enqueue → PLAYING, first_audio_ms set', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    const r = p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 0, pcmBytes: pcm(1600), sampleRate: 16000 });
    expect(r).toBe('PLAYED');
    expect(p.getState()).toBe('PLAYING');
    expect(p.getMetrics().chunks_queued).toBe(1);
    expect(p.getMetrics().first_audio_ms).toBeTypeOf('number');
    expect(fake.__started.length).toBe(1);
  });

  it('PLAYER-02 · multiple chunks queued in order', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    for (let i = 0; i < 4; i++) {
      p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: i, pcmBytes: pcm(1600), sampleRate: 16000 });
    }
    expect(p.getMetrics().chunks_queued).toBe(4);
    expect(fake.__started.length).toBe(4);
  });

  it('PLAYER-03 · flush stops all active sources immediately', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 0, pcmBytes: pcm(3200), sampleRate: 16000 });
    p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 1, pcmBytes: pcm(3200), sampleRate: 16000 });
    p.flush('interrupt');
    expect(p.getState()).toBe('FLUSHED');
    expect(fake.__stopped.length).toBe(2);
    // 后续 chunk 直到 beginTurn 之前应被丢弃
    const r = p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 2, pcmBytes: pcm(1600), sampleRate: 16000 });
    expect(r).toBe('DROPPED_INTERRUPT');
    expect(p.getMetrics().chunks_dropped_interrupt).toBe(1);
  });

  it('PLAYER-04 · stale generation dropped, does not disturb active turn', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 0, pcmBytes: pcm(1600), sampleRate: 16000 });
    const stale = p.enqueueChunk({ turn_id: 't1', generation_id: 'g0-old', chunkIndex: 0, pcmBytes: pcm(1600), sampleRate: 16000 });
    expect(stale).toBe('DROPPED_STALE');
    expect(p.getMetrics().chunks_dropped_stale).toBe(1);
    expect(fake.__started.length).toBe(1);
  });

  it('PLAYER-05 · beginTurn 切换到新 turn → flush 旧 turn', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 0, pcmBytes: pcm(1600), sampleRate: 16000 });
    p.beginTurn('t2', 'g1');
    expect(fake.__stopped.length).toBe(1);
    // 旧 turn 的 chunk 现在 stale
    const r = p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 1, pcmBytes: pcm(1600), sampleRate: 16000 });
    expect(r).toBe('DROPPED_STALE');
  });

  it('PLAYER-06 · getPlaybackPositionMs 随 currentTime 增长', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 0, pcmBytes: pcm(1600), sampleRate: 16000 });
    expect(p.getPlaybackPositionMs()).toBe(0);
    fake.__advance(0.5); // +500ms
    expect(p.getPlaybackPositionMs()).toBeCloseTo(500, 0);
  });

  it('PLAYER-07 · dispose → 后续 enqueue DROPPED_DISPOSED', () => {
    const fake = makeFakeContext(16000);
    const p = new StreamingAudioPlayer({ contextFactory: () => fake });
    p.beginTurn('t1', 'g1');
    p.dispose();
    const r = p.enqueueChunk({ turn_id: 't1', generation_id: 'g1', chunkIndex: 0, pcmBytes: pcm(1600), sampleRate: 16000 });
    expect(r).toBe('DROPPED_DISPOSED');
    expect(p.getState()).toBe('DISPOSED');
  });
});

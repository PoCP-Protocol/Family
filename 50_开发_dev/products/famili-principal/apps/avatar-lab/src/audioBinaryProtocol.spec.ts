/**
 * MM1-B1.1 · audioBinaryProtocol tests (§15)
 */
import { describe, it, expect } from 'vitest';
import {
  encodeAudioFrame,
  decodeAudioFrame,
  isAudioFrameBytes,
  AUDIO_PROTOCOL_VERSION,
} from './audioBinaryProtocol';

function makeEnv(overrides: Partial<Parameters<typeof encodeAudioFrame>[0]> = {}) {
  return {
    session_id: 's-1',
    turn_id: 't-42',
    generation_id: 'g-3',
    sequence: 0,
    timestamp_ms: 1_700_000_000_000.25,
    sample_rate: 16000,
    channels: 1 as const,
    encoding: 'INT16_LE' as const,
    payload: new Uint8Array([1, 2, 3, 4, 5, 6]),
    ...overrides,
  };
}

describe('mm1-b1.1 · audioBinaryProtocol (§15)', () => {
  it('AUDIO-PROTO-01 · encode + decode roundtrip', () => {
    const env = makeEnv();
    const bytes = encodeAudioFrame(env);
    const back = decodeAudioFrame(bytes);
    expect(back.session_id).toBe('s-1');
    expect(back.turn_id).toBe('t-42');
    expect(back.generation_id).toBe('g-3');
    expect(back.sequence).toBe(0);
    expect(back.sample_rate).toBe(16000);
    expect(back.encoding).toBe('INT16_LE');
    expect(Array.from(back.payload)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('AUDIO-PROTO-02 · flags roundtrip', () => {
    const bytes = encodeAudioFrame(makeEnv({ flags: { end_of_turn: true, interrupt: true } }));
    const back = decodeAudioFrame(bytes);
    expect(back.flags?.end_of_turn).toBe(true);
    expect(back.flags?.interrupt).toBe(true);
  });

  it('AUDIO-PROTO-03 · sequence increments preserved', () => {
    for (let i = 0; i < 5; i++) {
      const bytes = encodeAudioFrame(makeEnv({ sequence: i }));
      expect(decodeAudioFrame(bytes).sequence).toBe(i);
    }
  });

  it('AUDIO-PROTO-04 · isAudioFrameBytes filters non-audio bytes', () => {
    const bytes = encodeAudioFrame(makeEnv());
    expect(isAudioFrameBytes(bytes)).toBe(true);
    expect(isAudioFrameBytes(new Uint8Array([0x00, 0x11, 0x22, 0x33]))).toBe(false);
    expect(isAudioFrameBytes(new Uint8Array([0x00]))).toBe(false);
  });

  it('AUDIO-PROTO-05 · corrupted magic rejected', () => {
    const bytes = encodeAudioFrame(makeEnv());
    const bad = new Uint8Array(bytes);
    bad[0] = 0; bad[1] = 0; bad[2] = 0; bad[3] = 0;
    expect(() => decodeAudioFrame(bad)).toThrow(/bad magic/);
  });

  it('AUDIO-PROTO-06 · truncated frame rejected', () => {
    const bytes = encodeAudioFrame(makeEnv());
    expect(() => decodeAudioFrame(bytes.subarray(0, 20))).toThrow();
  });

  it('AUDIO-PROTO-07 · zero payload allowed (END_OF_TURN marker)', () => {
    const bytes = encodeAudioFrame(makeEnv({ payload: new Uint8Array(0), flags: { end_of_turn: true } }));
    const back = decodeAudioFrame(bytes);
    expect(back.payload.byteLength).toBe(0);
    expect(back.flags?.end_of_turn).toBe(true);
  });

  it('AUDIO-PROTO-08 · version field is 1', () => {
    expect(AUDIO_PROTOCOL_VERSION).toBe(1);
    const bytes = encodeAudioFrame(makeEnv());
    // byte offset 4 is version
    expect(bytes[4]).toBe(1);
  });

  it('AUDIO-PROTO-09 · rejects channels != 1', () => {
    expect(() => encodeAudioFrame(makeEnv({ channels: 2 as any }))).toThrow();
  });

  it('AUDIO-PROTO-10 · rejects invalid sample_rate', () => {
    expect(() => encodeAudioFrame(makeEnv({ sample_rate: 0 }))).toThrow();
    expect(() => encodeAudioFrame(makeEnv({ sample_rate: 200000 }))).toThrow();
  });
});

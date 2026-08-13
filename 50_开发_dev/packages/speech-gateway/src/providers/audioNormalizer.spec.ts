/**
 * MM1-B1 · AudioInputNormalizer tests (§8)
 */
import { describe, expect, it } from 'vitest';
import { AudioInputNormalizer } from './audioNormalizer';

describe('mm1-b1 · AudioInputNormalizer', () => {
  it('AN-01 · Float32 → Int16 correctness (0 / 1 / -1 / mid)', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 1000 });
    const samples = new Float32Array([0, 1, -1, 0.5, -0.5]);
    const frame = n.fromFloat32(samples, 1050);

    expect(frame.sample_rate_hz).toBe(16000);
    expect(frame.channels).toBe(1);
    expect(frame.format).toBe('INT16_LE');
    expect(frame.sample_count).toBe(5);
    expect(frame.payload.byteLength).toBe(10);

    const view = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
    expect(view.getInt16(0, true)).toBe(0);
    expect(view.getInt16(2, true)).toBe(32767);
    expect(view.getInt16(4, true)).toBe(-32767);
    expect(view.getInt16(6, true)).toBe(Math.round(0.5 * 32767));
    expect(view.getInt16(8, true)).toBe(Math.round(-0.5 * 32767));
  });

  it('AN-02 · sequence monotonic, timestamp_ms 相对 turn_start_ms', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 500 });
    const s = new Float32Array([0]);
    const a = n.fromFloat32(s, 500);
    const b = n.fromFloat32(s, 620);
    const c = n.fromFloat32(s, 780);

    expect(a.sequence).toBe(0);
    expect(b.sequence).toBe(1);
    expect(c.sequence).toBe(2);
    expect(a.timestamp_ms).toBe(0);
    expect(b.timestamp_ms).toBe(120);
    expect(c.timestamp_ms).toBe(280);
    expect(a.turn_id).toBe('t1');
  });

  it('AN-03 · clamp out-of-range values', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 0 });
    const s = new Float32Array([2, -2, 1.5, -1.5]);
    const f = n.fromFloat32(s, 0);
    const v = new DataView(f.payload.buffer, f.payload.byteOffset, f.payload.byteLength);
    expect(v.getInt16(0, true)).toBe(32767);
    expect(v.getInt16(2, true)).toBe(-32767);
    expect(v.getInt16(4, true)).toBe(32767);
    expect(v.getInt16(6, true)).toBe(-32767);
  });

  it('AN-04 · fromPcm16LE 保持 payload 不变但拿到 sequence/timestamp', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 100 });
    const bytes = new Uint8Array([0x00, 0x00, 0xff, 0x7f]); // 0, 32767
    const f = n.fromPcm16LE(bytes, 200);
    expect(f.payload).toEqual(bytes);
    expect(f.sample_count).toBe(2);
    expect(f.sequence).toBe(0);
    expect(f.timestamp_ms).toBe(100);
  });

  it('AN-05 · empty input throws', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 0 });
    expect(() => n.fromFloat32(new Float32Array([]), 0)).toThrow();
    expect(() => n.fromPcm16LE(new Uint8Array([]), 0)).toThrow();
  });

  it('AN-06 · odd byteLength PCM rejected', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 0 });
    expect(() => n.fromPcm16LE(new Uint8Array([1, 2, 3]), 0)).toThrow();
  });

  it('AN-07 · turn_id required', () => {
    expect(() => new AudioInputNormalizer({ turn_id: '', turn_start_ms: 0 })).toThrow();
  });

  it('AN-08 · frame 是 provider-neutral: 不含 azure/tencent/qwen 字段', () => {
    const n = new AudioInputNormalizer({ turn_id: 't1', turn_start_ms: 0 });
    const f = n.fromFloat32(new Float32Array([0.1, 0.2]), 0);
    const keys = Object.keys(f);
    for (const k of keys) {
      expect(k.toLowerCase()).not.toMatch(/azure|tencent|qwen|deepgram|xfyun|iflytek/);
    }
  });
});

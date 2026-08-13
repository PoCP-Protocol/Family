/**
 * MM1-B1 · RealMicClient 纯函数部分测试 (非浏览器)
 */
import { describe, expect, it } from 'vitest';
import { createFrameSlicer, floatToInt16LE } from './realMicClient';

describe('mm1-b1 · realMicClient utilities', () => {
  it('RMC-01 · floatToInt16LE 正确 clamp + little-endian', () => {
    const bytes = floatToInt16LE(new Float32Array([1, -1, 0, 0.5]));
    expect(bytes.byteLength).toBe(8);
    const dv = new DataView(bytes.buffer);
    expect(dv.getInt16(0, true)).toBe(32767);
    expect(dv.getInt16(2, true)).toBe(-32768);
    expect(dv.getInt16(4, true)).toBe(0);
    // 0.5 → 16383 (round 0.5 * 32767)
    expect(dv.getInt16(6, true)).toBeGreaterThanOrEqual(16383);
    expect(dv.getInt16(6, true)).toBeLessThanOrEqual(16384);
  });

  it('RMC-02 · createFrameSlicer 按帧粒度切分', () => {
    const slicer = createFrameSlicer(4); // 4 samples/frame
    const frames = slicer.push(new Float32Array([0, 0, 0, 0, 0, 0]));
    expect(frames).toHaveLength(1);
    expect(frames[0].byteLength).toBe(8);
    // 剩余 2 sample stash
    const frames2 = slicer.push(new Float32Array([0, 0]));
    expect(frames2).toHaveLength(1);
    expect(frames2[0].byteLength).toBe(8);
  });

  it('RMC-03 · flush 输出剩余不足一帧样本', () => {
    const slicer = createFrameSlicer(4);
    slicer.push(new Float32Array([0, 0]));
    const tail = slicer.flush();
    expect(tail).not.toBeNull();
    expect(tail!.byteLength).toBe(4); // 2 samples × 2 bytes
    expect(slicer.flush()).toBeNull();
  });

  it('RMC-04 · clamp 超范围输入', () => {
    const bytes = floatToInt16LE(new Float32Array([2, -2]));
    const dv = new DataView(bytes.buffer);
    expect(dv.getInt16(0, true)).toBe(32767);
    expect(dv.getInt16(2, true)).toBe(-32768);
  });
});

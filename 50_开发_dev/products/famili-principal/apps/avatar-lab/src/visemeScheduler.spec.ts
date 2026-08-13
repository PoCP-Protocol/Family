/**
 * MM1-B1.1 · VisemeScheduler tests (§F)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { VisemeScheduler } from './visemeScheduler';
import { SpeechPlaybackClock } from './speechPlaybackClock';

function makeProvider() {
  let pos = 0;
  let turn: string | null = 't1';
  let gen: string | null = 'g1';
  return {
    setPos(p: number) { pos = p; },
    setTurn(t: string | null, g: string | null) { turn = t; gen = g; },
    getPlaybackPositionMs: () => pos,
    getActiveTurn: () => turn,
    getActiveGeneration: () => gen,
    getState: () => 'PLAYING',
  };
}

describe('mm1-b1.1 · VisemeScheduler (§F)', () => {
  it('VIS-01 · 未来 viseme → SCHEDULED, 到达后 APPLIED', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    const s = new VisemeScheduler({ clock: c, setTimeoutFn: (fn: any) => { fn(); return null; } });
    const applied: string[] = [];
    s.onApply((shape) => applied.push(shape));
    p.setPos(50); // 未到 100
    // 因为 scheduleAt 内部会自旋(setTimeout=同步), 若一直未到 target 会栈溢出;这里我们改成让 setTimeoutFn 在 fn 之前推进 pos
    // 用一个更真实的自定义: 每次 setTimeout, 推进 pos 到 target
    const s2 = new VisemeScheduler({
      clock: c,
      setTimeoutFn: (fn: any, ms: number) => {
        p.setPos(p.getPlaybackPositionMs() + ms);
        fn();
        return null;
      },
    });
    s2.onApply((shape) => applied.push(shape));
    p.setPos(50);
    const r = s2.schedule({ turn_id: 't1', generation_id: 'g1', mouth_shape: 'OPEN_MEDIUM', audio_offset_ms: 100 });
    expect(['SCHEDULED', 'APPLIED_IMMEDIATE']).toContain(r);
    expect(applied).toContain('OPEN_MEDIUM');
    expect(s2.getMetrics().viseme_applied_count).toBe(1);
    // 避免未使用告警
    void s;
  });

  it('VIS-02 · 已过 audio_offset 但在阈值内 → APPLIED_IMMEDIATE', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    const s = new VisemeScheduler({ clock: c });
    const applied: any[] = [];
    s.onApply((shape, meta) => applied.push({ shape, meta }));
    p.setPos(150);
    const r = s.schedule({ turn_id: 't1', generation_id: 'g1', mouth_shape: 'ROUND', audio_offset_ms: 100 });
    expect(r).toBe('APPLIED_IMMEDIATE');
    expect(applied[0].meta.lip_sync_offset_ms).toBe(50);
  });

  it('VIS-03 · 超过阈值 → DROPPED_LATE, 不 fire', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    const s = new VisemeScheduler({ clock: c, lateThresholdMs: 100 });
    let fired = 0;
    s.onApply(() => { fired += 1; });
    p.setPos(500);
    const r = s.schedule({ turn_id: 't1', generation_id: 'g1', mouth_shape: 'SMILE_SPEECH', audio_offset_ms: 100 });
    expect(r).toBe('DROPPED_LATE');
    expect(fired).toBe(0);
    expect(s.getMetrics().viseme_late_drop_count).toBe(1);
  });

  it('VIS-04 · turn 不匹配 → DROPPED_STALE', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    const s = new VisemeScheduler({ clock: c });
    let fired = 0;
    s.onApply(() => { fired += 1; });
    const r = s.schedule({ turn_id: 't0-old', generation_id: 'g1', mouth_shape: 'OPEN_WIDE', audio_offset_ms: 100 });
    expect(r).toBe('DROPPED_STALE');
    expect(fired).toBe(0);
  });

  it('VIS-05 · flushAll 后 pending scheduler cancel', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    let cancelledCount = 0;
    let handle = 0;
    const s = new VisemeScheduler({
      clock: c,
      setTimeoutFn: () => { handle += 1; return handle; },
      clearTimeoutFn: () => { cancelledCount += 1; },
    });
    p.setPos(0);
    s.schedule({ turn_id: 't1', generation_id: 'g1', mouth_shape: 'CLOSED', audio_offset_ms: 100 });
    s.schedule({ turn_id: 't1', generation_id: 'g1', mouth_shape: 'CLOSED', audio_offset_ms: 200 });
    s.flushAll();
    expect(cancelledCount).toBeGreaterThanOrEqual(2);
  });
});

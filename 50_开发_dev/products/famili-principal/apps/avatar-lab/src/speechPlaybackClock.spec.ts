/**
 * MM1-B1.1 · SpeechPlaybackClock tests (§E)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { SpeechPlaybackClock } from './speechPlaybackClock';

function makeProvider() {
  let pos = 0;
  return {
    setPos(p: number) { pos = p; },
    getPlaybackPositionMs: () => pos,
    getActiveTurn: () => 't1',
    getActiveGeneration: () => 'g1',
    getState: () => 'PLAYING',
  };
}

describe('mm1-b1.1 · SpeechPlaybackClock (§E)', () => {
  it('CLOCK-01 · beginTurn + now 反映 provider position', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    p.setPos(120);
    expect(c.now()).toBe(120);
    expect(c.getTurnId()).toBe('t1');
    expect(c.getGenerationId()).toBe('g1');
    expect(c.getState()).toBe('PLAYING');
  });

  it('CLOCK-02 · snapshot 反映 turn 上下文', () => {
    const p = makeProvider();
    const wc = () => 10_000;
    const c = new SpeechPlaybackClock({ provider: p, wallClock: wc });
    c.beginTurn('t1', 'g1');
    p.setPos(200);
    const s = c.snapshot();
    expect(s.turn_id).toBe('t1');
    expect(s.generation_id).toBe('g1');
    expect(s.playback_position_ms).toBe(200);
    expect(s.started_at_ms).toBe(10_000);
    expect(s.state).toBe('PLAYING');
  });

  it('CLOCK-03 · scheduleAt 目标已到 → 立即 fire', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    p.setPos(500);
    let fired = false;
    c.scheduleAt(200, () => { fired = true; }, {
      setTimeoutFn: (fn: any) => { fn(); return null; },
      clearTimeoutFn: () => {},
    });
    expect(fired).toBe(true);
  });

  it('CLOCK-04 · scheduleAt cancel 阻止 fire', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    p.setPos(0);
    let fired = false;
    let handle: any = null;
    const cancel = c.scheduleAt(300, () => { fired = true; }, {
      setTimeoutFn: (_fn: any, _ms: number) => { handle = 'H'; return 'H'; },
      clearTimeoutFn: (h: any) => { if (h === 'H') handle = null; },
    });
    cancel();
    expect(handle).toBeNull();
    expect(fired).toBe(false);
  });

  it('CLOCK-05 · endTurn 后 state=IDLE, turn 清空', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    c.endTurn();
    expect(c.getTurnId()).toBeNull();
    expect(c.getState()).toBe('IDLE');
  });

  it('CLOCK-06 · flush / stop 切换 state', () => {
    const p = makeProvider();
    const c = new SpeechPlaybackClock({ provider: p });
    c.beginTurn('t1', 'g1');
    c.flush();
    expect(c.getState()).toBe('FLUSHED');
    c.stop();
    expect(c.getState()).toBe('STOPPED');
    expect(c.getTurnId()).toBeNull();
  });
});

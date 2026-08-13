/**
 * MM1-B1.1 · RealMicUi tests (§I)
 */
import { describe, it, expect, vi } from 'vitest';
import { RealMicUi } from './realMicUi';

describe('mm1-b1.1 · RealMicUi (§I)', () => {
  it('MIC-UI-01 · 默认 flag=NO → MIC_DISABLED, requestStart 不启动', async () => {
    const start = vi.fn(async () => {});
    const stop = vi.fn(async () => {});
    const ui = new RealMicUi({ featureFlag: 'NO', startFn: start, stopFn: stop });
    expect(ui.getState()).toBe('MIC_DISABLED');
    await ui.requestStart();
    expect(start).not.toHaveBeenCalled();
    expect(ui.getState()).toBe('MIC_DISABLED');
  });

  it('MIC-UI-02 · flag=YES + start ok → MIC_STREAMING', async () => {
    const start = vi.fn(async () => {});
    const stop = vi.fn(async () => {});
    const ui = new RealMicUi({ featureFlag: 'YES', startFn: start, stopFn: stop });
    expect(ui.getState()).toBe('MIC_READY');
    const events: string[] = [];
    ui.onStateChange((s) => events.push(s));
    await ui.requestStart();
    expect(events).toEqual(['MIC_REQUESTING', 'MIC_STREAMING']);
    expect(ui.getState()).toBe('MIC_STREAMING');
    expect(start).toHaveBeenCalled();
  });

  it('MIC-UI-03 · startFn throw → MIC_ERROR', async () => {
    const start = vi.fn(async () => { throw new Error('permission denied'); });
    const stop = vi.fn(async () => {});
    const ui = new RealMicUi({ featureFlag: 'YES', startFn: start, stopFn: stop });
    await ui.requestStart();
    expect(ui.getState()).toBe('MIC_ERROR');
  });

  it('MIC-UI-04 · requestStop from STREAMING → MIC_READY', async () => {
    const start = vi.fn(async () => {});
    const stop = vi.fn(async () => {});
    const ui = new RealMicUi({ featureFlag: 'YES', startFn: start, stopFn: stop });
    await ui.requestStart();
    await ui.requestStop();
    expect(stop).toHaveBeenCalled();
    expect(ui.getState()).toBe('MIC_READY');
  });

  it('MIC-UI-05 · requestStop 非 STREAMING → 无副作用', async () => {
    const start = vi.fn(async () => {});
    const stop = vi.fn(async () => {});
    const ui = new RealMicUi({ featureFlag: 'YES', startFn: start, stopFn: stop });
    await ui.requestStop();
    expect(stop).not.toHaveBeenCalled();
    expect(ui.getState()).toBe('MIC_READY');
  });
});

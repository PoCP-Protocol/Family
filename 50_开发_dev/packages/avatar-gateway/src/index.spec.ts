import { describe, expect, it } from 'vitest';
import { FakeAvatarGateway } from './index';

describe('fake avatar gateway', () => {
  it('U07 emits PERFORMANCE_STARTED / EXPRESSION_CHANGED / GESTURE_CHANGED / PERFORMANCE_COMPLETE', () => {
    const avatar = new FakeAvatarGateway();
    const events: Array<{ type?: string }> = [];
    avatar.onEvent((event) => events.push(event));

    avatar.startPerformance('turn-3', { expression: 'ATTENTIVE', gesture: 'SMALL_NOD', gaze: 'USER', posture: 'RELAXED' });
    avatar.complete('turn-3');

    expect(events.some((event) => event.type === 'PERFORMANCE_STARTED')).toBe(true);
    expect(events.some((event) => event.type === 'EXPRESSION_CHANGED')).toBe(true);
    expect(events.some((event) => event.type === 'GESTURE_CHANGED')).toBe(true);
    expect(events.some((event) => event.type === 'PERFORMANCE_COMPLETE')).toBe(true);
  });

  it('U08 cancel emits PERFORMANCE_CANCELLED and stops after cancel', () => {
    const avatar = new FakeAvatarGateway();
    const events: Array<{ type?: string }> = [];
    avatar.onEvent((event) => events.push(event));

    avatar.startPerformance('turn-4', { expression: 'ATTENTIVE', gesture: 'SMALL_NOD', gaze: 'USER', posture: 'RELAXED' });
    avatar.cancel('turn-4');

    expect(events.some((event) => event.type === 'PERFORMANCE_CANCELLED')).toBe(true);
    expect(events.some((event) => event.type === 'PERFORMANCE_COMPLETE')).toBe(false);
  });
});

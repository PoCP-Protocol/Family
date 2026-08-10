import { describe, expect, it } from 'vitest';
import { FakeAvatarGateway } from './index';

describe('fake avatar gateway', () => {
  it('emits performance progression and cancellation events', () => {
    const avatar = new FakeAvatarGateway();
    const events: Array<{ type?: string }> = [];
    avatar.onEvent((event) => events.push(event));

    avatar.startPerformance('turn-3', { expression: 'ATTENTIVE', gesture: 'SMALL_NOD', gaze: 'USER', posture: 'RELAXED' });
    avatar.cancel('turn-3');

    expect(events.some((event) => event.type === 'PERFORMANCE_STARTED')).toBe(true);
    expect(events.some((event) => event.type === 'PERFORMANCE_CANCELLED')).toBe(true);
  });
});

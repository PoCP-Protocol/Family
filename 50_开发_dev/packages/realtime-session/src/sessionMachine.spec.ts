import { describe, expect, it } from 'vitest';
import { RealtimeSessionMachine } from './sessionMachine';

describe('RealtimeSessionMachine', () => {
  it('transitions from idle to listening on transcript', () => {
    const machine = new RealtimeSessionMachine();
    const events = machine.applyEvent({ type: 'TRANSCRIPT', timestamp_ms: 10, payload: { text: 'hello' } });

    expect(events[0].state).toBe('LISTENING');
    expect(machine.getSnapshot().state).toBe('LISTENING');
  });

  it('supports interruption and human gate transitions', () => {
    const machine = new RealtimeSessionMachine();
    machine.applyEvent({ type: 'STATE_CHANGED', state: 'SPEAKING', timestamp_ms: 20 });
    machine.interrupt();
    const gateEvents = machine.enterHumanGate();

    expect(machine.getSnapshot().state).toBe('HUMAN_GATE');
    expect(gateEvents[0].state).toBe('HUMAN_GATE');
  });
});

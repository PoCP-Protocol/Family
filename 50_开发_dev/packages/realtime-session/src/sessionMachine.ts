import type { RealtimeSessionEvent, RealtimeSessionState } from '@family/fpai-multimodal-contracts';

export interface SessionMachineSnapshot {
  state: RealtimeSessionState;
  history: RealtimeSessionState[];
}

export class RealtimeSessionMachine {
  private state: RealtimeSessionState = 'IDLE';
  private history: RealtimeSessionState[] = ['IDLE'];

  public getSnapshot(): SessionMachineSnapshot {
    return { state: this.state, history: [...this.history] };
  }

  public applyEvent(event: RealtimeSessionEvent): RealtimeSessionEvent[] {
    const prevState = this.state;

    switch (event.type) {
      case 'STATE_CHANGED':
        this.state = (event.state ?? this.state) as RealtimeSessionState;
        break;
      case 'INTERRUPTED':
        this.state = 'INTERRUPTED';
        break;
      case 'HUMAN_GATE':
        this.state = 'HUMAN_GATE';
        break;
      default:
        if (prevState === 'IDLE' && event.type === 'TRANSCRIPT') {
          this.state = 'LISTENING';
        }
    }

    this.history = [...this.history, this.state];
    return [{ type: 'STATE_CHANGED', state: this.state, timestamp_ms: event.timestamp_ms }];
  }

  public interrupt(): RealtimeSessionEvent[] {
    this.state = 'INTERRUPTED';
    this.history = [...this.history, this.state];
    return [{ type: 'INTERRUPTED', state: 'INTERRUPTED', timestamp_ms: Date.now() }];
  }

  public enterHumanGate(): RealtimeSessionEvent[] {
    this.state = 'HUMAN_GATE';
    this.history = [...this.history, this.state];
    return [{ type: 'HUMAN_GATE', state: 'HUMAN_GATE', timestamp_ms: Date.now() }];
  }
}

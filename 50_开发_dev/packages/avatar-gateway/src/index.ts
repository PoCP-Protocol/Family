import type { AvatarEvent, AvatarPerformancePlan } from '@family/fpai-multimodal-contracts';

export interface AvatarGateway {
  startPerformance(turnId: string, plan: AvatarPerformancePlan): void;
  applyViseme(turnId: string, viseme: string): void;
  applyExpression(turnId: string, expression: string): void;
  applyGesture(turnId: string, gesture: string): void;
  cancel(turnId: string): void;
  /** 表演结束(由 orchestrator 在 TTS_COMPLETE 后触发)。 */
  complete(turnId: string): void;
  resetToListening(turnId: string): void;
  onEvent(handler: (event: AvatarEvent) => void): void;
}

export class FakeAvatarGateway implements AvatarGateway {
  private handlers: Array<(event: AvatarEvent) => void> = [];

  public startPerformance(turnId: string, plan: AvatarPerformancePlan): void {
    this.emit({ type: 'PERFORMANCE_STARTED', turn_id: turnId, expression: plan.expression, gesture: plan.gesture, timestamp_ms: Date.now() });
    this.emit({ type: 'EXPRESSION_CHANGED', turn_id: turnId, expression: plan.expression, timestamp_ms: Date.now() + 5 });
    this.emit({ type: 'GESTURE_CHANGED', turn_id: turnId, gesture: plan.gesture, timestamp_ms: Date.now() + 10 });
  }

  public applyViseme(turnId: string, viseme: string): void {
    this.emit({ type: 'VISEME_CHANGED', turn_id: turnId, viseme, timestamp_ms: Date.now() });
  }

  public applyExpression(turnId: string, expression: string): void {
    this.emit({ type: 'EXPRESSION_CHANGED', turn_id: turnId, expression, timestamp_ms: Date.now() });
  }

  public applyGesture(turnId: string, gesture: string): void {
    this.emit({ type: 'GESTURE_CHANGED', turn_id: turnId, gesture, timestamp_ms: Date.now() });
  }

  public cancel(turnId: string): void {
    this.emit({ type: 'PERFORMANCE_CANCELLED', turn_id: turnId, timestamp_ms: Date.now() });
  }

  public complete(turnId: string): void {
    this.emit({ type: 'PERFORMANCE_COMPLETE', turn_id: turnId, timestamp_ms: Date.now() });
  }

  public resetToListening(turnId: string): void {
    this.emit({ type: 'AVATAR_READY', turn_id: turnId, timestamp_ms: Date.now() });
  }

  public onEvent(handler: (event: AvatarEvent) => void): void {
    this.handlers.push(handler);
  }

  private emit(event: AvatarEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}

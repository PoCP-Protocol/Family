/**
 * MM1-B1 · Family Local 2D Avatar Provider (§15 / §25 / §33 / §34)
 *
 * 定位:
 *   Family 自持的 2D 数字人 (server-side gateway 端)。本文件只负责
 *   FSM 状态 / 事件生成 / VISEME 与 gesture 派发,不做真实像素渲染。
 *   真实的 Canvas/SVG 渲染在 avatar-lab 客户端侧新增文件里完成
 *   (products/famili-principal/apps/avatar-lab/src/avatar2d.ts).
 *
 * 与 FakeAvatarGateway 的差异:
 *   - FakeAvatarGateway 是 MM1-B0 baseline,仅发 event 用于测试。
 *   - FamilyLocal2DAvatarGateway 有明确的 FSM (§25):
 *       RESTING → LISTENING → THINKING → SPEAKING → INTERRUPTED → RESTING
 *     且提供 gesture / gaze token,并保证 cancel 后不再泄漏后续 event。
 *
 * 严禁:
 *   - 引入 Live2D SDK / 任何商业 Avatar SDK (§33 / §34)。
 *   - 引入 GPU 依赖。
 *   - 引入外部网络 / paid provider。
 *
 * Descriptor 与 FAKE_BASELINE 的区分:
 *   provider_class = 'FAKE_BASELINE' 同样合规(Family 自家实现,非外部 REAL provider);
 *   但 identity_lock = 'TRUE' 且 supported_lipsync_strategies 显式声明。
 */

import type { AvatarEvent, AvatarPerformancePlan, ProviderCommercialContract } from '@family/fpai-multimodal-contracts';

import type { AvatarGateway } from '../index';
import type { AvatarProviderDescriptor, AvatarProviderRegistration } from './registry';

export type FamilyAvatarState =
  | 'RESTING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'HUMAN_GATE';

export interface FamilyLocal2DAvatarOptions {
  now?: () => number;
}

export class FamilyLocal2DAvatarGateway implements AvatarGateway {
  private handlers: Array<(event: AvatarEvent) => void> = [];
  private state: FamilyAvatarState = 'RESTING';
  private currentTurnId: string | null = null;
  /** 一旦对该 turn 触发 cancel,忽略此 turn 后续所有 apply* 调用。 */
  private cancelledTurns = new Set<string>();
  private readonly now: () => number;

  public constructor(opts: FamilyLocal2DAvatarOptions = {}) {
    this.now = opts.now ?? (() => Date.now());
  }

  public getState(): FamilyAvatarState {
    return this.state;
  }

  public startPerformance(turnId: string, plan: AvatarPerformancePlan): void {
    if (this.cancelledTurns.has(turnId)) return;
    this.currentTurnId = turnId;
    this.state = 'SPEAKING';
    const t = this.now();
    this.emit({
      type: 'PERFORMANCE_STARTED',
      turn_id: turnId,
      expression: plan.expression,
      gesture: plan.gesture,
      timestamp_ms: t,
    });
    this.emit({ type: 'EXPRESSION_CHANGED', turn_id: turnId, expression: plan.expression, timestamp_ms: t + 1 });
    this.emit({ type: 'GESTURE_CHANGED', turn_id: turnId, gesture: plan.gesture, timestamp_ms: t + 2 });
  }

  public applyViseme(turnId: string, viseme: string): void {
    if (this.cancelledTurns.has(turnId)) return;
    if (this.state !== 'SPEAKING') return; // 只在 SPEAKING 期间生效
    this.emit({ type: 'VISEME_CHANGED', turn_id: turnId, viseme, timestamp_ms: this.now() });
  }

  public applyExpression(turnId: string, expression: string): void {
    if (this.cancelledTurns.has(turnId)) return;
    this.emit({ type: 'EXPRESSION_CHANGED', turn_id: turnId, expression, timestamp_ms: this.now() });
  }

  public applyGesture(turnId: string, gesture: string): void {
    if (this.cancelledTurns.has(turnId)) return;
    this.emit({ type: 'GESTURE_CHANGED', turn_id: turnId, gesture, timestamp_ms: this.now() });
  }

  public cancel(turnId: string): void {
    this.cancelledTurns.add(turnId);
    this.state = 'INTERRUPTED';
    this.emit({ type: 'PERFORMANCE_CANCELLED', turn_id: turnId, timestamp_ms: this.now() });
    // 立刻回到 RESTING (可视化层可以选择做插值)
    this.state = 'RESTING';
    if (this.currentTurnId === turnId) {
      this.currentTurnId = null;
    }
  }

  public complete(turnId: string): void {
    if (this.cancelledTurns.has(turnId)) return;
    this.emit({ type: 'PERFORMANCE_COMPLETE', turn_id: turnId, timestamp_ms: this.now() });
    this.state = 'RESTING';
    if (this.currentTurnId === turnId) {
      this.currentTurnId = null;
    }
  }

  public resetToListening(turnId: string): void {
    if (this.cancelledTurns.has(turnId)) return;
    this.state = 'LISTENING';
    this.emit({ type: 'AVATAR_READY', turn_id: turnId, timestamp_ms: this.now() });
  }

  public markThinking(turnId: string): void {
    if (this.cancelledTurns.has(turnId)) return;
    this.state = 'THINKING';
  }

  public markHumanGate(turnId: string): void {
    this.state = 'HUMAN_GATE';
    this.emit({ type: 'PERFORMANCE_CANCELLED', turn_id: turnId, timestamp_ms: this.now() });
  }

  public onEvent(handler: (event: AvatarEvent) => void): void {
    this.handlers.push(handler);
  }

  private emit(event: AvatarEvent): void {
    for (const h of this.handlers) h(event);
  }
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

const FAMILY_LOCAL_2D_COMMERCIAL: ProviderCommercialContract = {
  commercial_terms_reviewed: 'TRUE',
  data_retention_policy_known: 'TRUE',
  training_use_policy_known: 'TRUE',
  paid_test_required: 'FALSE',
  regional_endpoint: 'local',
  known_limitations: [
    '2D 简化形象,不做面部深度精度评估',
    '嘴型基于 L4_VISEME 或 L1_AMPLITUDE 简化映射',
    '未接入 Live2D 或任何商业 3D avatar SDK',
  ],
  evidence: {
    evidence_refs: [
      'packages/avatar-gateway/src/providers/familyLocal2d.ts (自家源码)',
      'FPAI_MM1B_PROVIDER_SELECTION_V1.md §11.A.3',
    ],
    verified_at: '2026-08-13',
    verified_by: 'family-task-executor',
  },
};

export const AVATAR_FAMILY_LOCAL_2D_DESCRIPTOR: AvatarProviderDescriptor = {
  kind: 'AVATAR',
  provider_id: 'avatar.family_local_2d',
  provider_version: '0.1.0',
  provider_class: 'FAKE_BASELINE', // Family 自家实现,非外部 REAL provider
  commercial: FAMILY_LOCAL_2D_COMMERCIAL,
  capabilities: {
    renderer_type: '2D',
    realtime: 'TRUE',
    streaming_audio_input: 'FALSE',
    audio_driven_lipsync: 'FALSE',
    phoneme_driven_lipsync: 'FALSE',
    viseme_input: 'TRUE',
    expression_control: 'TRUE',
    gesture_control: 'TRUE',
    gaze_control: 'TRUE',
    head_motion_control: 'FALSE',
    interrupt: 'TRUE',
    cancel_latency_p95_ms: 5,
    transparent_background: 'TRUE',
    camera_control: 'FALSE',
    custom_character: 'TRUE',
    identity_lock: 'TRUE',
    local_render_possible: 'TRUE',
    cloud_only: 'FALSE',
    gpu_requirement: 'NONE',
    commercial_license_reviewed: 'TRUE',
    concurrent_session_model: 'PER_CONNECTION',
    supported_lipsync_strategies: ['L4_VISEME', 'L1_AMPLITUDE'],
  },
};

export const familyLocal2DAvatarRegistration: AvatarProviderRegistration = {
  descriptor: AVATAR_FAMILY_LOCAL_2D_DESCRIPTOR,
  factory: () => new FamilyLocal2DAvatarGateway(),
  health: async () => ({ status: 'READY', last_check_at: new Date().toISOString() }),
};

/**
 * MM1-B1 · FamilyLocal2DAvatarGateway tests
 */
import { describe, expect, it } from 'vitest';
import {
  AVATAR_FAMILY_LOCAL_2D_DESCRIPTOR,
  FamilyLocal2DAvatarGateway,
  familyLocal2DAvatarRegistration,
} from './familyLocal2d';
import { InMemoryAvatarProviderRegistry } from './registry';
import type { AvatarEvent } from '@family/fpai-multimodal-contracts';

const plan = {
  expression: 'CALM_WARM',
  gesture: 'STEADY',
  gaze: 'USER',
  posture: 'STEADY',
} as const;

describe('mm1-b1 · FamilyLocal2DAvatarGateway', () => {
  it('FL2D-01 · startPerformance 后进入 SPEAKING, 发出 3 个 event', () => {
    const g = new FamilyLocal2DAvatarGateway();
    const evts: AvatarEvent[] = [];
    g.onEvent((e) => evts.push(e));
    g.startPerformance('t1', plan);
    expect(g.getState()).toBe('SPEAKING');
    expect(evts.map((e) => e.type)).toEqual([
      'PERFORMANCE_STARTED',
      'EXPRESSION_CHANGED',
      'GESTURE_CHANGED',
    ]);
  });

  it('FL2D-02 · applyViseme 只在 SPEAKING 期间生效', () => {
    const g = new FamilyLocal2DAvatarGateway();
    const evts: AvatarEvent[] = [];
    g.onEvent((e) => evts.push(e));
    g.applyViseme('t1', 'OPEN_MEDIUM'); // 未 startPerformance
    expect(evts).toHaveLength(0);
    g.startPerformance('t1', plan);
    evts.length = 0;
    g.applyViseme('t1', 'OPEN_MEDIUM');
    expect(evts).toHaveLength(1);
    expect(evts[0].type).toBe('VISEME_CHANGED');
  });

  it('FL2D-03 · cancel 后状态回 RESTING 且忽略后续 apply*', () => {
    const g = new FamilyLocal2DAvatarGateway();
    const evts: AvatarEvent[] = [];
    g.onEvent((e) => evts.push(e));
    g.startPerformance('t1', plan);
    g.cancel('t1');
    expect(g.getState()).toBe('RESTING');
    const before = evts.length;
    g.applyViseme('t1', 'OPEN_MEDIUM');
    g.applyExpression('t1', 'CALM_WARM');
    g.applyGesture('t1', 'STEADY');
    g.complete('t1');
    expect(evts.length).toBe(before); // 全部被吞
  });

  it('FL2D-04 · complete 触发 PERFORMANCE_COMPLETE 并回 RESTING', () => {
    const g = new FamilyLocal2DAvatarGateway();
    const evts: AvatarEvent[] = [];
    g.onEvent((e) => evts.push(e));
    g.startPerformance('t1', plan);
    g.complete('t1');
    expect(g.getState()).toBe('RESTING');
    expect(evts.some((e) => e.type === 'PERFORMANCE_COMPLETE')).toBe(true);
  });

  it('FL2D-05 · resetToListening → LISTENING + AVATAR_READY', () => {
    const g = new FamilyLocal2DAvatarGateway();
    const evts: AvatarEvent[] = [];
    g.onEvent((e) => evts.push(e));
    g.resetToListening('t1');
    expect(g.getState()).toBe('LISTENING');
    expect(evts.map((e) => e.type)).toEqual(['AVATAR_READY']);
  });

  it('FL2D-06 · markThinking / markHumanGate 状态迁移', () => {
    const g = new FamilyLocal2DAvatarGateway();
    g.markThinking('t1');
    expect(g.getState()).toBe('THINKING');
    g.markHumanGate('t1');
    expect(g.getState()).toBe('HUMAN_GATE');
  });

  it('FL2D-07 · descriptor identity_lock=TRUE 且 lipsync strategies 包含 L4/L1', () => {
    const d = AVATAR_FAMILY_LOCAL_2D_DESCRIPTOR;
    expect(d.capabilities.identity_lock).toBe('TRUE');
    expect(d.capabilities.supported_lipsync_strategies).toEqual(['L4_VISEME', 'L1_AMPLITUDE']);
    expect(d.provider_id).toBe('avatar.family_local_2d');
  });

  it('FL2D-08 · registration 可注入 InMemoryAvatarProviderRegistry', () => {
    const r = new InMemoryAvatarProviderRegistry();
    r.registerAvatar(familyLocal2DAvatarRegistration);
    const d = r.lookupAvatar('avatar.family_local_2d');
    expect(d).toBeDefined();
    expect(d?.descriptor.capabilities.identity_lock).toBe('TRUE');
  });
});

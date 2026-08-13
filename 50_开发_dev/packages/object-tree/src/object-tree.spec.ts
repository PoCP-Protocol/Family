import { describe, expect, it } from 'vitest';
import {
  createSeededRegistry, assertNamedActionWrite, assertWriteWithRegistry, WriteGuardError,
  projectObject, readAttr, isCanonicalTruth,
  CHILD_SKILL, GROWTH_ACTION_SKILL, INTERVENTION_EPISODE_SKILL,
  type ObjectTreeSkill, type TreeAttributeDecl,
} from './index';

describe('WriteGuard — mutability 声明式强制(替代零散 CHECK + 代码纪律)', () => {
  it('named_action_only FACT:在 allowed_named_actions 内 → 放行', () => {
    expect(() => assertNamedActionWrite(INTERVENTION_EPISODE_SKILL, { attribute: 'status', namedAction: 'StartIntervention' })).not.toThrow();
    expect(() => assertNamedActionWrite(GROWTH_ACTION_SKILL, { attribute: 'status', namedAction: 'CompleteGrowthAction' })).not.toThrow();
  });

  it('named_action_only FACT:AI/直写(无 Named Action)→ 拒绝', () => {
    expect(() => assertNamedActionWrite(GROWTH_ACTION_SKILL, { attribute: 'status', namedAction: null }))
      .toThrow(WriteGuardError);
  });

  it('named_action_only FACT:错误的 Named Action → 拒绝', () => {
    expect(() => assertNamedActionWrite(INTERVENTION_EPISODE_SKILL, { attribute: 'status', namedAction: 'CompleteGrowthAction' }))
      .toThrow(/not allowed to write/);
  });

  it('AI_INFERENCE / PROPOSAL 视图属性 → 永不可写 canonical', () => {
    // Child.recent_understanding = AI_INFERENCE
    expect(() => assertNamedActionWrite(CHILD_SKILL, { attribute: 'recent_understanding', namedAction: 'AddChild' }))
      .toThrow(/view; cannot write canonical/);
  });

  it('未声明属性 → 拒绝(不认识不放行)', () => {
    expect(() => assertNamedActionWrite(CHILD_SKILL, { attribute: 'iq_score', namedAction: 'AddChild' }))
      .toThrow(/unknown attribute/);
  });

  it('registry 版:未注册对象 → FAIL CLOSED', () => {
    const reg = createSeededRegistry();
    expect(() => assertWriteWithRegistry((id) => reg.getObject(id), 'NoSuchObject', { attribute: 'x', namedAction: 'Y' }))
      .toThrow(/not registered/);
  });

  it('演示:模拟 AI 直写 Child.life_stage(FACT)→ 被运行时拒绝', () => {
    // life_stage 只能经 AssignLifeStage;AI 无 Named Action 上下文 → 拒绝
    expect(() => assertNamedActionWrite(CHILD_SKILL, { attribute: 'life_stage', namedAction: null }))
      .toThrow(WriteGuardError);
    // 即便冒用错误 Named Action 也拒绝
    expect(() => assertNamedActionWrite(CHILD_SKILL, { attribute: 'life_stage', namedAction: 'CompleteGrowthAction' }))
      .toThrow(/not allowed to write/);
  });
});

describe('AttributeTree 投影 — 多源聚合 + 分区 + canonical 标注', () => {
  it('按 partition 聚合,视图型 truth_type 标记 canonical=false', () => {
    const values: Record<string, unknown> = {
      person_id: 'p1', display_name: '小明', life_stage: 'EARLY_ADOLESCENCE_12_15',
      confirmed_priority: ['R03'], active_intervention: ['LISTEN_BEFORE_RESPOND'],
      recent_action_state: ['COMPLETED'], recent_understanding: { primary_scenario: 'HOMEWORK' },
      consent: { AI_PERSONALIZATION: 'GRANTED' },
    };
    const view = projectObject(CHILD_SKILL, (a) => values[a.name]);
    expect(view.object_id).toBe('Child');
    // 多源:Identity(persons) + Growth(GrowthOS) + Principal(AI) 同现一棵树
    expect(view.partitions.Identity?.[0].name).toBe('person_id');
    expect(view.partitions.Growth?.map((a) => a.name)).toContain('active_intervention');
    // 视图分区非 canonical
    expect(view.nonCanonicalPartitions).toContain('Principal');
    const understanding = readAttr(view, 'recent_understanding');
    expect(understanding?.canonical).toBe(false);
    expect(understanding?.truth_type).toBe('AI_INFERENCE');
    // FACT 属性 canonical=true
    expect(readAttr(view, 'life_stage')?.canonical).toBe(true);
  });

  it('isCanonicalTruth:FACT/OBSERVATION=true;AI_INFERENCE/PROPOSAL=false', () => {
    expect(isCanonicalTruth('FACT')).toBe(true);
    expect(isCanonicalTruth('OBSERVATION')).toBe(true);
    expect(isCanonicalTruth('AI_INFERENCE')).toBe(false);
    expect(isCanonicalTruth('PROPOSAL')).toBe(false);
  });
});

describe('Registry — 声明期治理校验(FAIL CLOSED)', () => {
  it('seed 全部对象合法注册', () => {
    const reg = createSeededRegistry();
    expect(reg.listObjects()).toContain('Child');
    expect(reg.listObjects()).toContain('GrowthAction');
  });

  it('非法声明:FACT 非 named_action_only → 注册即抛', () => {
    const bad: ObjectTreeSkill = {
      kind: 'object_skill', object_id: 'Bad', owner: 'GrowthOS', allowed_named_actions: [],
      attributes: [{ name: 'x', type: 's', truth_type: 'FACT', owner: 'GrowthOS', mutability: 'system', partition: 'Core', source: 't' } as TreeAttributeDecl],
    };
    expect(() => createSeededRegistry([bad])).toThrow(/must be mutability=named_action_only/);
  });
});

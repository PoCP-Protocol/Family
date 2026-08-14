import { describe, expect, it } from 'vitest';
import {
  SkillRegistry, SkillRuntime, SkillValidationError, validateSkill,
  type ObjectSkill, type CapabilitySkill,
} from './skill';

// M3-RB-003 最小真实 Skill 运行时:证明它【真跑 + 被治理】,不是死文档。

const childObjectSkill: ObjectSkill = {
  kind: 'object_skill', object_id: 'Child', owner: 'FamilyCore',
  attributes: [
    { name: 'birth_date', type: 'date', truth_type: 'FACT', owner: 'FamilyCore', mutability: 'named_action_only' },
    { name: 'recent_understanding', type: 'PrincipalUnderstandingV1', truth_type: 'AI_INFERENCE', owner: 'Principal', mutability: 'ai_view_readonly' },
  ],
  allowed_named_actions: ['AddChild', 'AssignLifeStage'],
};

const hardSafetySkill: CapabilitySkill = { kind: 'capability_skill', capability_id: 'hard_safety_tripwire', true_class: 'DETERMINISTIC_GUARDRAIL', guardrail: true };
const realModelSkill: CapabilitySkill = { kind: 'capability_skill', capability_id: 'principal_understanding', true_class: 'REAL_MODEL_INTELLIGENCE', authorization_ref: 'AUTHORIZATION_REGISTRY#M3_101B_REAL_EXTERNAL_TEXT' };

describe('RB-003 Skill runtime — governance validation', () => {
  it('rejects canonical FACT that is not named_action_only (AI/直写不得)', () => {
    const bad: ObjectSkill = { kind: 'object_skill', object_id: 'X', owner: 'FamilyCore', attributes: [{ name: 'f', type: 'string', truth_type: 'FACT', owner: 'FamilyCore', mutability: 'ai_view_readonly' }] };
    expect(() => validateSkill(bad)).toThrow(SkillValidationError);
  });
  it('rejects AI_INFERENCE declared as named_action canonical', () => {
    const bad: ObjectSkill = { kind: 'object_skill', object_id: 'X', owner: 'P', attributes: [{ name: 'g', type: 'string', truth_type: 'AI_INFERENCE', owner: 'Principal', mutability: 'named_action_only' }] };
    expect(() => validateSkill(bad)).toThrow(/view/);
  });
  it('rejects REAL_MODEL capability without authorization_ref (no self-authorization)', () => {
    expect(() => validateSkill({ kind: 'capability_skill', capability_id: 'x', true_class: 'REAL_MODEL_INTELLIGENCE' })).toThrow(/authorization_ref/);
  });
  it('accepts valid object + guardrail + authorized real-model skills', () => {
    expect(() => { validateSkill(childObjectSkill); validateSkill(hardSafetySkill); validateSkill(realModelSkill); }).not.toThrow();
  });
});

describe('RB-003 Skill runtime — real execution + fail-closed', () => {
  const reg = () => { const r = new SkillRegistry(); r.register(childObjectSkill); r.register(hardSafetySkill); r.register(realModelSkill); return r; };

  it('resolveObjectView returns a semantic view with truth_type per attribute', () => {
    const rt = new SkillRuntime(reg(), () => false);
    const view = rt.resolveObjectView('Child', (a) => (a.name === 'birth_date' ? '2013-05-01' : { primary_scenario: 'HOMEWORK' }));
    expect(view.object_id).toBe('Child');
    expect(view.attributes.find((x) => x.name === 'birth_date')).toMatchObject({ truth_type: 'FACT', owner: 'FamilyCore', value: '2013-05-01' });
    expect(view.attributes.find((x) => x.name === 'recent_understanding')?.truth_type).toBe('AI_INFERENCE');
  });

  it('guardrail capability ALWAYS runs (cannot be disabled), even when nothing is authorized', async () => {
    const rt = new SkillRuntime(reg(), () => false, new Map([['hard_safety_tripwire', (i: any) => (String(i).includes('不想活') ? 'HIGH_RISK' : 'NORMAL')]]));
    expect(await rt.dispatchCapability('hard_safety_tripwire', '孩子说不想活了')).toBe('HIGH_RISK');
  });

  it('real-model capability is FAIL CLOSED when not runtime-authorized', async () => {
    const rt = new SkillRuntime(reg(), () => false, new Map([['principal_understanding', () => ({ ok: true })]]));
    await expect(rt.dispatchCapability('principal_understanding', {})).rejects.toThrow(/not runtime-authorized/);
  });

  it('real-model capability runs only when authorization says yes', async () => {
    const authorized = (ref?: string) => ref === 'AUTHORIZATION_REGISTRY#M3_101B_REAL_EXTERNAL_TEXT';
    const rt = new SkillRuntime(reg(), authorized, new Map([['principal_understanding', () => ({ understanding: 'real' })]]));
    expect(await rt.dispatchCapability('principal_understanding', {})).toEqual({ understanding: 'real' });
  });

  it('unregistered / handler-less capability -> error (no silent fake)', async () => {
    const rt = new SkillRuntime(reg(), () => true);
    await expect(rt.dispatchCapability('nope', {})).rejects.toThrow(/not registered/);
    await expect(rt.dispatchCapability('principal_understanding', {})).rejects.toThrow(/no handler/);
  });
});

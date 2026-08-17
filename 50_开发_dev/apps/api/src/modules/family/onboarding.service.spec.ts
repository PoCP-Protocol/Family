import { describe, expect, it } from 'vitest';
import type { FamilyAggregateResponse } from '@family/contracts';
import { OnboardingService } from './onboarding.service';

/** FAMILY-ONBOARDING-001 · 步骤推导读模型单测(从聚合推导可恢复步骤;0 canonical)。 */
function agg(partial: Partial<FamilyAggregateResponse>): FamilyAggregateResponse {
  return { family: { family_id: 'fam-1' } as any, members: [], relationships: [], lifeStages: [], consents: [], ...partial };
}
function svc(aggregate: FamilyAggregateResponse) {
  const fake = { getFamilyAggregate: async () => aggregate } as any;
  return new OnboardingService(fake);
}
const child = { person_id: 'child-1', family_id: 'fam-1', person_type: 'CHILD', parent_role: null, display_name: '娃', birth_date: null, account_id: null, created_at: '', updated_at: '' } as any;
const consentGranted = { consent_id: 'c1', family_id: 'fam-1', subject_person_id: 'child-1', guardian_person_id: 'g1', purpose: 'AI_PERSONALIZATION', status: 'GRANTED', policy_version: 'v1', granted_at: '' } as any;

describe('OnboardingService.getStatus 步骤推导', () => {
  it('仅有家庭 → current=add_child', async () => {
    const s = await svc(agg({})).getStatus('fam-1', 'creator');
    expect(s.current_step).toBe('add_child');
    expect(s.child_id).toBeNull();
    expect(s.complete).toBe(false);
    expect(s.steps.find((x) => x.key === 'create_family')?.status).toBe('DONE');
  });

  it('有孩子 → current=assign_life_stage;暴露 child_id(系统提供)', async () => {
    const s = await svc(agg({ members: [child] })).getStatus('fam-1', 'creator');
    expect(s.current_step).toBe('assign_life_stage');
    expect(s.child_id).toBe('child-1');
  });

  it('有孩子+lifeStage → current=grant_consent', async () => {
    const s = await svc(agg({ members: [child], lifeStages: [{ } as any] })).getStatus('fam-1', 'creator');
    expect(s.current_step).toBe('grant_consent');
  });

  it('consent GRANTED 后 → current=growth_onboarding(交 growth 流程驱动)', async () => {
    const s = await svc(agg({ members: [child], lifeStages: [{} as any], consents: [consentGranted] })).getStatus('fam-1', 'creator');
    expect(s.current_step).toBe('growth_onboarding');
    expect(s.steps.find((x) => x.key === 'grant_consent')?.status).toBe('DONE');
  });

  it('consent 存在但非 GRANTED → 仍停在 grant_consent', async () => {
    const pending = { ...consentGranted, status: 'REQUESTED' };
    const s = await svc(agg({ members: [child], lifeStages: [{} as any], consents: [pending] })).getStatus('fam-1', 'creator');
    expect(s.current_step).toBe('grant_consent');
  });
});

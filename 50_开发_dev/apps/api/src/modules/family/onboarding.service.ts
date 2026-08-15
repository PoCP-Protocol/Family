import { Inject, Injectable } from '@nestjs/common';
import type { FamilyAggregateResponse } from '@family/contracts';
import { FamilyService } from './family.service';

/**
 * FAMILY-ONBOARDING-001 · 可恢复 onboarding 状态读模型(READ-ONLY,0 canonical 写)。
 * 从既有 FamilyAggregate 推导当前步骤,使 Web 能在刷新/重登后从正确步骤继续——
 * 用户不必知道 onboarding_id/child_id 等内部 id(由本读模型提供给客户端驱动下一步)。
 */
export type OnboardingStepKey =
  | 'create_family' | 'add_child' | 'assign_life_stage' | 'grant_consent'
  | 'growth_onboarding' | 'confirm_priority' | 'enter_today';
export type OnboardingStepStatus = 'DONE' | 'CURRENT' | 'PENDING';

export interface OnboardingStatusView {
  family_id: string;
  complete: boolean;
  current_step: OnboardingStepKey;
  steps: Array<{ key: OnboardingStepKey; status: OnboardingStepStatus }>;
  child_id: string | null;      // 系统提供,非用户输入
}

const ORDER: OnboardingStepKey[] = [
  'create_family', 'add_child', 'assign_life_stage', 'grant_consent',
  'growth_onboarding', 'confirm_priority', 'enter_today',
];

@Injectable()
export class OnboardingService {
  constructor(@Inject(FamilyService) private readonly familyService: FamilyService) {}

  async getStatus(familyId: string, actorId: string): Promise<OnboardingStatusView> {
    const agg: FamilyAggregateResponse = await this.familyService.getFamilyAggregate(familyId, actorId);
    const child = agg.members.find((m) => m.person_type === 'CHILD') ?? null;
    const done: Record<OnboardingStepKey, boolean> = {
      create_family: !!agg.family,
      add_child: !!child,
      assign_life_stage: (agg.lifeStages?.length ?? 0) > 0,
      grant_consent: (agg.consents ?? []).some((c) => c.purpose === 'AI_PERSONALIZATION' && c.status === 'GRANTED'),
      // 以下 growth 步由既有 growth 端点驱动;本读模型仅到 consent 可从聚合确证,其后置 PENDING(Web 依 growth 状态推进)。
      growth_onboarding: false,
      confirm_priority: false,
      enter_today: false,
    };
    const firstPending = ORDER.find((k) => !done[k]) ?? 'enter_today';
    const steps = ORDER.map((key) => ({
      key,
      status: (done[key] ? 'DONE' : key === firstPending ? 'CURRENT' : 'PENDING') as OnboardingStepStatus,
    }));
    return {
      family_id: familyId,
      complete: firstPending === 'enter_today' && done.grant_consent,
      current_step: firstPending,
      steps,
      child_id: child?.person_id ?? null,
    };
  }
}

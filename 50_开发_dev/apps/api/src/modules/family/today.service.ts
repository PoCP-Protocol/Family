import { Inject, Injectable } from '@nestjs/common';
import type { FamilyTodayProjection } from '@family/contracts';
import { projectFamilyToday } from '@family/contracts';
import { GrowthActionService } from './growth-action.service';

/** TODAY-001 · Today 首页输入(只读投影;view-model 由 web 侧 buildTodayView 消费)。 */
export interface TodayInputsView {
  todaysAction: string | null;      // 今天的 One Small Action(来自 Growth OS)
  pendingCheckin: boolean;          // 该行动未完成 → 待 Check-in
  currentFocus: string | null;      // 后续:确认成长重点(需 onboarding 上下文)
  principalFollowup: string | null; // 后续:Principal 最近跟进
  expertReplyPending: boolean;      // 后续:专家(Human Gate)释放待查看
}

/**
 * UI-01/UI-09 first-slice Today read projection.
 * It intentionally adapts the existing, policy-scoped GrowthAction read model
 * instead of creating new canonical family, child, plan, evidence, or outcome
 * records. Check-in consent/safety is revalidated by CompleteGrowthAction at
 * write time; the read projection never claims a consent grant by itself.
 */
@Injectable()
export class TodayService {
  constructor(@Inject(GrowthActionService) private readonly growthActionService: GrowthActionService) {}

  async getToday(familyId: string, actorId: string): Promise<TodayInputsView> {
    const action = await this.growthActionService.getTodayAction(familyId, actorId);
    return {
      todaysAction: action?.assignment_text ?? null,
      pendingCheckin: !!action && action.completed_at == null,
      currentFocus: null,
      principalFollowup: null,
      expertReplyPending: false,
    };
  }

  async getFamilyTodayProjection(familyId: string, actorId: string): Promise<FamilyTodayProjection> {
    const action = await this.growthActionService.getTodayAction(familyId, actorId);
    return projectFamilyToday(familyId, action, new Date().toISOString());
  }
}

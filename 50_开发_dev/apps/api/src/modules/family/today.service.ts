import { Inject, Injectable } from '@nestjs/common';
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
 * TODAY-001 · Today 只读聚合。首版用 Growth OS 的 getTodayAction 得到今天行动 + 待 Check-in;
 * currentFocus/principal/expert 待「成员角色→领域权限」桥接后再从各只读源聚合(不新增 canonical)。
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
}

/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 编排 REST(薄、家长面向)。
 * 严格鉴权:OrchestrationAuthGuard(cookie/Bearer→membership;无 x-actor-id 降级)+ 显式 NamedAction。
 * 对象/真相边界不因 API 形状改变。
 */
import { BadRequestException, Body, Controller, Get, Headers, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { FamilyDecisionType } from '@family/contracts';
import { OrchestrationAuthGuard, OrchestrationActor, RequireOrchestrationAction } from './orchestration-auth.guard';
import { OrchestrationService } from './orchestration.service';

type Actor = { personId: string; familyId: string; familyRole: string };
function corr(c?: string): string { return c && c.trim() ? c : randomUUID(); }

@Controller('families/:familyId')
@UseGuards(OrchestrationAuthGuard)
export class OrchestrationController {
  constructor(@Inject(OrchestrationService) private readonly svc: OrchestrationService) {}

  /** 首页:现在有什么需要 Family 帮忙的吗?(读模型;不要求 GrowthPriority) */
  @Get('home')
  @RequireOrchestrationAction('ReadFamily')
  async home(@Param('familyId') familyId: string, @OrchestrationActor() actor: Actor): Promise<{ prompt: string; family_id: string; actor_role: string }> {
    return { prompt: '现在有什么需要 Family 帮忙的吗?', family_id: familyId, actor_role: actor.familyRole };
  }

  /** ① 表达需求 → NeedSignal + 需确认的 Intent 提案。 */
  @Post('orchestration/needs')
  @RequireOrchestrationAction('RequestGrowthHelp')
  async requestHelp(
    @Param('familyId') familyId: string,
    @Body() body: { subject_person_id?: string; raw_text?: string },
    @OrchestrationActor() _actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    if (!body?.subject_person_id) throw new BadRequestException('subject_person_id required');
    if (!body?.raw_text) throw new BadRequestException('raw_text required');
    return this.svc.requestHelp(familyId, body.subject_person_id, body.raw_text, 'MANUAL', corr(correlationId));
  }

  /** ② 显式确认 → GrowthIntent(OPEN)。 */
  @Post('orchestration/intents')
  @RequireOrchestrationAction('ConfirmGrowthIntent')
  async confirmIntent(
    @Param('familyId') familyId: string,
    @Body() body: { subject_person_id?: string; signal_id?: string; goal_text?: string },
    @OrchestrationActor() actor: Actor,
  ) {
    if (!body?.subject_person_id || !body?.signal_id || !body?.goal_text) throw new BadRequestException('subject_person_id, signal_id, goal_text required');
    return this.svc.confirmIntent(familyId, body.subject_person_id, actor.personId, body.signal_id, body.goal_text);
  }

  /** ③ 生成推荐(T1 eligibility + 确定性排序)。 */
  @Post('orchestration/intents/:intentId/recommendations')
  @RequireOrchestrationAction('RequestGrowthHelp')
  async recommend(
    @Param('familyId') familyId: string,
    @Param('intentId') intentId: string,
    @Body() body: { subject_person_id?: string },
  ) {
    if (!body?.subject_person_id) throw new BadRequestException('subject_person_id required');
    return this.svc.recommend(familyId, body.subject_person_id, intentId);
  }

  /** ④ 家庭决定 → 完整性 → Plan → T2 复验 → ServiceCase + AI_COACH。 */
  @Post('orchestration/decisions')
  @RequireOrchestrationAction('DecideGrowthService')
  async decide(
    @Param('familyId') familyId: string,
    @Body() body: {
      subject_person_id?: string; intent_id?: string; recommendation_id?: string; recommendation_version?: number;
      decision_type?: FamilyDecisionType; selected_offer_refs?: string[]; goal_message?: string;
    },
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    if (!body?.subject_person_id || !body?.intent_id || !body?.recommendation_id || typeof body?.recommendation_version !== 'number' || !body?.decision_type) {
      throw new BadRequestException('subject_person_id, intent_id, recommendation_id, recommendation_version, decision_type required');
    }
    return this.svc.decide({
      familyId, subjectPersonId: body.subject_person_id, actorPersonId: actor.personId, intentId: body.intent_id,
      recommendationId: body.recommendation_id, recommendationVersion: body.recommendation_version,
      decisionType: body.decision_type, selectedOfferRefs: body.selected_offer_refs ?? [],
      goalMessage: body.goal_message ?? '孩子刚摔门,我今晚不知道怎么重新开口。', correlationId: corr(correlationId),
    });
  }

  @Get('orchestration/cases/:caseId')
  @RequireOrchestrationAction('ReadFamily')
  async getCase(@Param('familyId') familyId: string, @Param('caseId') caseId: string) {
    const c = await this.svc.getCase(familyId, caseId);
    return c ?? { case_id: caseId, found: false };
  }

  /** ⑤ 回访 helpfulness(非 Observation)。 */
  @Post('orchestration/cases/:caseId/followups')
  @RequireOrchestrationAction('SubmitServiceFollowUp')
  async followUp(
    @Param('familyId') familyId: string,
    @Param('caseId') caseId: string,
    @Body() body: { helpfulness?: string; text?: string },
  ) {
    if (!body?.helpfulness) throw new BadRequestException('helpfulness required');
    return this.svc.submitFollowUp(familyId, caseId, body.helpfulness, body.text ?? null);
  }

  /** ⑥ Context Reuse 投影(只读;禁因果)。 */
  @Get('orchestration/context-reuse')
  @RequireOrchestrationAction('ReadFamily')
  async contextReuse(@Param('familyId') familyId: string, @Query('subject_person_id') subject?: string) {
    if (!subject) throw new BadRequestException('subject_person_id required');
    return this.svc.contextReuse(familyId, subject);
  }
}

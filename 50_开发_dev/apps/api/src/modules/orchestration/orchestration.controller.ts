/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 编排 REST(薄、家长面向)。
 * 严格鉴权:OrchestrationAuthGuard(cookie/Bearer→membership;无 x-actor-id 降级)+ 显式 NamedAction。
 * subject 仅在 requestHelp 由客户端提供并校验;之后由服务端从已存对象派生(不重复信任)。
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

  @Get('home')
  @RequireOrchestrationAction('ReadFamily')
  async home(@Param('familyId') familyId: string, @OrchestrationActor() actor: Actor): Promise<{ prompt: string; family_id: string; actor_role: string }> {
    return { prompt: '现在有什么需要 Family 帮忙的吗?', family_id: familyId, actor_role: actor.familyRole };
  }

  @Post('orchestration/needs')
  @RequireOrchestrationAction('RequestGrowthHelp')
  async requestHelp(
    @Param('familyId') familyId: string,
    @Body() body: { subject_person_id?: string; raw_text?: string },
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    if (!body?.subject_person_id) throw new BadRequestException('subject_person_id required');
    if (!body?.raw_text) throw new BadRequestException('raw_text required');
    return this.svc.requestHelp(familyId, body.subject_person_id, actor.personId, body.raw_text, 'MANUAL', corr(correlationId));
  }

  @Post('orchestration/intents')
  @RequireOrchestrationAction('ConfirmGrowthIntent')
  async confirmIntent(
    @Param('familyId') familyId: string,
    @Body() body: { signal_id?: string; goal_text?: string },
    @OrchestrationActor() actor: Actor,
  ) {
    if (!body?.signal_id || !body?.goal_text) throw new BadRequestException('signal_id, goal_text required');
    return this.svc.confirmIntent(familyId, actor.personId, body.signal_id, body.goal_text);
  }

  @Post('orchestration/intents/:intentId/recommendations')
  @RequireOrchestrationAction('RequestGrowthHelp')
  async recommend(@Param('familyId') familyId: string, @Param('intentId') intentId: string) {
    return this.svc.recommend(familyId, intentId);
  }

  @Post('orchestration/decisions')
  @RequireOrchestrationAction('DecideGrowthService')
  async decide(
    @Param('familyId') familyId: string,
    @Body() body: { intent_id?: string; recommendation_id?: string; recommendation_version?: number; decision_type?: FamilyDecisionType; selected_offer_refs?: string[] },
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    if (!body?.intent_id || !body?.recommendation_id || typeof body?.recommendation_version !== 'number' || !body?.decision_type) {
      throw new BadRequestException('intent_id, recommendation_id, recommendation_version, decision_type required');
    }
    return this.svc.decide({
      familyId, actorPersonId: actor.personId, intentId: body.intent_id, recommendationId: body.recommendation_id,
      recommendationVersion: body.recommendation_version, decisionType: body.decision_type,
      selectedOfferRefs: body.selected_offer_refs ?? [], correlationId: corr(correlationId),
    });
  }

  @Get('orchestration/cases/:caseId')
  @RequireOrchestrationAction('ReadFamily')
  async getCase(@Param('familyId') familyId: string, @Param('caseId') caseId: string) {
    const c = await this.svc.getCase(familyId, caseId);
    return c ?? { case_id: caseId, found: false };
  }

  @Post('orchestration/cases/:caseId/followups')
  @RequireOrchestrationAction('SubmitServiceFollowUp')
  async followUp(
    @Param('familyId') familyId: string,
    @Param('caseId') caseId: string,
    @Body() body: { helpfulness?: string; text?: string },
    @OrchestrationActor() actor: Actor,
  ) {
    if (!body?.helpfulness) throw new BadRequestException('helpfulness required');
    return this.svc.submitFollowUp(familyId, actor.personId, caseId, body.helpfulness, body.text ?? null);
  }

  @Get('orchestration/context-reuse')
  @RequireOrchestrationAction('ReadFamily')
  async contextReuse(@Param('familyId') familyId: string, @Query('subject_person_id') subject?: string) {
    if (!subject) throw new BadRequestException('subject_person_id required');
    return this.svc.contextReuse(familyId, subject);
  }
}

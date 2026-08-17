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
import type { ConfirmSyntheticIntentDto, RecordSyntheticDecisionDto, StartSyntheticNeedDto } from './l0-l1-test-loop.dto';
import { assessmentIntakeStub, gatewayStub, humanGatePlaceholder } from './stubs/test-loop-governance-stubs';

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
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!body?.subject_person_id) throw new BadRequestException('subject_person_id required');
    if (!body?.raw_text) throw new BadRequestException('raw_text required');
    return this.svc.requestHelp(familyId, body.subject_person_id, actor.personId, body.raw_text, 'MANUAL', corr(correlationId), idempotencyKey && idempotencyKey.trim() ? idempotencyKey.trim() : undefined);
  }

  @Post('orchestration/intents')
  @RequireOrchestrationAction('ConfirmGrowthIntent')
  async confirmIntent(
    @Param('familyId') familyId: string,
    @Body() body: { signal_id?: string; goal_text?: string },
    @OrchestrationActor() actor: Actor,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!body?.signal_id || !body?.goal_text) throw new BadRequestException('signal_id, goal_text required');
    return this.svc.confirmIntent(familyId, actor.personId, body.signal_id, body.goal_text, idempotencyKey && idempotencyKey.trim() ? idempotencyKey.trim() : undefined);
  }

  @Post('orchestration/intents/:intentId/recommendations')
  @RequireOrchestrationAction('RequestGrowthHelp')
  async recommend(@Param('familyId') familyId: string, @Param('intentId') intentId: string, @Headers('idempotency-key') idempotencyKey?: string) {
    return this.svc.recommend(familyId, intentId, idempotencyKey && idempotencyKey.trim() ? idempotencyKey.trim() : undefined);
  }

  @Post('orchestration/decisions')
  @RequireOrchestrationAction('DecideGrowthService')
  async decide(
    @Param('familyId') familyId: string,
    @Body() body: { intent_id?: string; recommendation_id?: string; recommendation_version?: number; decision_type?: FamilyDecisionType; selected_offer_refs?: string[] },
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!body?.intent_id || !body?.recommendation_id || typeof body?.recommendation_version !== 'number' || !body?.decision_type) {
      throw new BadRequestException('intent_id, recommendation_id, recommendation_version, decision_type required');
    }
    return this.svc.decide({
      familyId, actorPersonId: actor.personId, intentId: body.intent_id, recommendationId: body.recommendation_id,
      recommendationVersion: body.recommendation_version, decisionType: body.decision_type,
      selectedOfferRefs: body.selected_offer_refs ?? [], correlationId: corr(correlationId),
      idempotencyKey: idempotencyKey && idempotencyKey.trim() ? idempotencyKey.trim() : undefined,
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
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!body?.helpfulness) throw new BadRequestException('helpfulness required');
    return this.svc.submitFollowUp(familyId, actor.personId, caseId, body.helpfulness, body.text ?? null, idempotencyKey && idempotencyKey.trim() ? idempotencyKey.trim() : undefined);
  }

  // ===== ARCH-GO-TEST-FULL-FUNCTION-001: DEV-only synthetic full-loop =====
  // These endpoints are capability-gated in the service. They remain authenticated and derive actor/family server-side.
  @Get('orchestration/test-loop/capability')
  @RequireOrchestrationAction('ReadFamily')
  async testLoopCapability() {
    return this.svc.testLoopCapability();
  }

  @Post('orchestration/test-loop/need')
  @RequireOrchestrationAction('RequestGrowthHelp')
  async startTestLoopNeed(
    @Param('familyId') familyId: string,
    @Body() body: StartSyntheticNeedDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.svc.startSyntheticNeed(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Post('orchestration/test-loop/intent')
  @RequireOrchestrationAction('ConfirmGrowthIntent')
  async confirmTestLoopIntent(
    @Param('familyId') familyId: string,
    @Body() body: ConfirmSyntheticIntentDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.svc.confirmSyntheticIntent(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Get('orchestration/test-loop/intents/:intentId/candidates')
  @RequireOrchestrationAction('ReadFamily')
  async testLoopCandidates(
    @Param('familyId') familyId: string,
    @Param('intentId') intentId: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.svc.getSyntheticAdmittedCandidates(familyId, intentId, corr(correlationId));
  }

  @Post('orchestration/test-loop/decisions')
  @RequireOrchestrationAction('DecideGrowthService')
  async recordTestLoopDecision(
    @Param('familyId') familyId: string,
    @Body() body: RecordSyntheticDecisionDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!body?.intent_id || !body?.fixture_version || !body?.decision_type) throw new BadRequestException('intent_id, fixture_version, decision_type required');
    return this.svc.recordSyntheticDecision(familyId, actor.personId, body, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Get('orchestration/test-loop/audit/:correlationId')
  @RequireOrchestrationAction('ReadFamily')
  async testLoopAudit(@Param('correlationId') correlationId: string) {
    return { entries: this.svc.getSyntheticTestLoopAudit(correlationId) };
  }

  /** Registered Family 34-page LLM capabilities; model, provider and credentials are never client inputs. */
  @Get('orchestration/test-loop/llm/pages')
  @RequireOrchestrationAction('ReadFamily')
  async familyLlmPages() {
    return { pages: this.svc.listFamilyLlmPages() };
  }

  @Post('orchestration/test-loop/llm/draft')
  @RequireOrchestrationAction('ReadFamily')
  async familyLlmDraft(
    @Param('familyId') familyId: string,
    @Body() body: { page_id?: string; journey_id?: string; fixture_version?: string },
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.svc.generateFamilyLlmPageDraft(familyId, actor.personId, body ?? {}, corr(correlationId));
  }

  @Get('orchestration/test-loop/llm/replay/:correlationId')
  @RequireOrchestrationAction('ReadFamily')
  async familyLlmReplay(@Param('familyId') familyId: string, @Param('correlationId') correlationId: string) {
    return { entries: await this.svc.replayFamilyLlm(familyId, correlationId) };
  }

  @Post('orchestration/test-loop/stubs/gateway')
  @RequireOrchestrationAction('ReadFamily')
  async testLoopGatewayStub() {
    await this.svc.testLoopCapability();
    return gatewayStub();
  }

  @Post('orchestration/test-loop/stubs/intake')
  @RequireOrchestrationAction('ReadFamily')
  async testLoopIntakeStub(@Body() body: { category?: 'L2_STANDARDIZED_TOOL' | 'L3_SAFETY_TOOL' | 'ADT_OR_BIOMETRIC' }) {
    await this.svc.testLoopCapability();
    return assessmentIntakeStub(body?.category ?? 'L2_STANDARDIZED_TOOL');
  }

  @Post('orchestration/test-loop/stubs/human-gate')
  @RequireOrchestrationAction('ReadFamily')
  async testLoopHumanGateStub() {
    await this.svc.testLoopCapability();
    return humanGatePlaceholder();
  }

  @Get('orchestration/context-reuse')
  @RequireOrchestrationAction('ReadFamily')
  async contextReuse(@Param('familyId') familyId: string, @Query('subject_person_id') subject?: string) {
    if (!subject) throw new BadRequestException('subject_person_id required');
    return this.svc.contextReuse(familyId, subject);
  }
}

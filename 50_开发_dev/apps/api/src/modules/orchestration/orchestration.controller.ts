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
import { TestExperienceService } from './test-experience.service';
import { FamilyPageObjectsService } from './family-page-objects.service';
import { FamilyCommerceIntentService } from './family-commerce-intent.service';
import { FamilyServiceBookingService } from './family-service-booking.service';
import { FamilyMembershipEntitlementService } from './family-membership-entitlement.service';
import type { ExecuteTestExperienceDto } from './test-experience.contract';
import type { FamilyPageObjectActionDto } from './family-page-objects.contract';
import type { CancelOrderIntentDto, SubmitOrderIntentDto } from './family-commerce-intent.contract';
import type { CancelBookingDto, RequestBookingDto, ServiceSupplyListQueryDto } from './family-service-booking.contract';
import type { ConsumeMembershipBenefitDto, RevokeMembershipBenefitDto, SubscribeMembershipDto } from './family-membership-entitlement.contract';
import type { ConfirmSyntheticIntentDto, RecordSyntheticDecisionDto, StartSyntheticNeedDto } from './l0-l1-test-loop.dto';
import { assessmentIntakeStub, gatewayStub, humanGatePlaceholder } from './stubs/test-loop-governance-stubs';

type Actor = { personId: string; familyId: string; familyRole: string };
function corr(c?: string): string { return c && c.trim() ? c : randomUUID(); }

@Controller('families/:familyId')
@UseGuards(OrchestrationAuthGuard)
export class OrchestrationController {
  constructor(
    @Inject(OrchestrationService) private readonly svc: OrchestrationService,
    @Inject(TestExperienceService) private readonly testExperience: TestExperienceService,
    @Inject(FamilyPageObjectsService) private readonly pageObjects: FamilyPageObjectsService,
    @Inject(FamilyCommerceIntentService) private readonly commerceIntents: FamilyCommerceIntentService,
    @Inject(FamilyServiceBookingService) private readonly serviceBookings: FamilyServiceBookingService,
    @Inject(FamilyMembershipEntitlementService) private readonly membershipEntitlements: FamilyMembershipEntitlementService,
  ) {}

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

  /**
   * 正式 DEV/TEST 体验动作入口。请求只能引用固定 fixture，页面和动作组合由服务端策略复验；
   * 绝不接收金额、联系人、自由文本、provider 参数或任何生产副作用参数。
   */
  @Post('orchestration/test-loop/experience/operations')
  @RequireOrchestrationAction('ExecuteTestExperienceAction')
  async executeTestExperience(
    @Param('familyId') familyId: string,
    @Body() body: ExecuteTestExperienceDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.testExperience.execute(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Post('orchestration/test-loop/experience/operations/:operationId/cancel')
  @RequireOrchestrationAction('ExecuteTestExperienceAction')
  async cancelTestExperience(@Param('familyId') familyId: string, @Param('operationId') operationId: string) {
    return this.testExperience.cancel(familyId, operationId);
  }

  @Get('orchestration/test-loop/experience/customer-projection')
  @RequireOrchestrationAction('ReadFamily')
  async testExperienceCustomerProjection(@Param('familyId') familyId: string) {
    return this.testExperience.customerProjection(familyId);
  }

  @Get('orchestration/test-loop/page-objects')
  @RequireOrchestrationAction('ReadFamily')
  async familyPageObjects(@Param('familyId') familyId: string) {
    return this.pageObjects.projection(familyId);
  }

  @Post('orchestration/test-loop/page-objects/actions')
  @RequireOrchestrationAction('ExecuteFamilyPageObjectAction')
  async familyPageObjectAction(
    @Param('familyId') familyId: string,
    @Body() body: FamilyPageObjectActionDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.pageObjects.act(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  /** Versioned admitted products available to this trusted family's DEV/TEST commerce slice. */
  @Get('orchestration/test-loop/commerce/products')
  @RequireOrchestrationAction('ReadFamily')
  async commerceProducts(@Param('familyId') familyId: string) {
    return this.commerceIntents.products(familyId);
  }

  /** Records a no-payment commercial intent and an internal DEV/TEST entitlement receipt. */
  @Post('orchestration/test-loop/commerce/order-intents')
  @RequireOrchestrationAction('SubmitCommerceIntent')
  async submitCommerceIntent(
    @Param('familyId') familyId: string,
    @Body() body: SubmitOrderIntentDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.commerceIntents.submit(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Post('orchestration/test-loop/commerce/order-intents/cancel')
  @RequireOrchestrationAction('SubmitCommerceIntent')
  async cancelCommerceIntent(
    @Param('familyId') familyId: string,
    @Body() body: CancelOrderIntentDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.commerceIntents.cancel(familyId, actor.personId, body ?? {}, corr(correlationId));
  }

  @Get('orchestration/test-loop/commerce/customer-projection')
  @RequireOrchestrationAction('ReadFamily')
  async commerceCustomerProjection(@Param('familyId') familyId: string) {
    return this.commerceIntents.customerProjection(familyId);
  }

  /** Admitted DEV/TEST service supply, including qualified providers and future no-op availability slots. */
  @Get('orchestration/test-loop/services/offerings')
  @RequireOrchestrationAction('ReadFamily')
  async serviceOfferings(
    @Param('familyId') familyId: string,
    @Query() query: ServiceSupplyListQueryDto,
  ) {
    return this.serviceBookings.offerings(familyId, query ?? {});
  }

  @Get('orchestration/test-loop/services/slots')
  @RequireOrchestrationAction('ReadFamily')
  async serviceSlots(
    @Param('familyId') familyId: string,
    @Query('service_offering_ref') serviceOfferingRef?: string,
    @Query('service_offering_version') serviceOfferingVersion?: string,
  ) {
    const version = Number(serviceOfferingVersion);
    if (!serviceOfferingRef || !Number.isInteger(version) || version <= 0) {
      throw new BadRequestException('service_offering_ref and service_offering_version required');
    }
    return this.serviceBookings.slots(familyId, serviceOfferingRef, version);
  }

  /** Records a family booking request and a no-op DEV/TEST service-record receipt. No calendar or notification is sent. */
  @Post('orchestration/test-loop/services/booking-requests')
  @RequireOrchestrationAction('SubmitServiceBooking')
  async requestServiceBooking(
    @Param('familyId') familyId: string,
    @Body() body: RequestBookingDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.serviceBookings.request(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Post('orchestration/test-loop/services/booking-requests/cancel')
  @RequireOrchestrationAction('SubmitServiceBooking')
  async cancelServiceBooking(
    @Param('familyId') familyId: string,
    @Body() body: CancelBookingDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.serviceBookings.cancel(familyId, actor.personId, body ?? {}, corr(correlationId));
  }

  @Get('orchestration/test-loop/services/customer-projection')
  @RequireOrchestrationAction('ReadFamily')
  async serviceBookingCustomerProjection(@Param('familyId') familyId: string) {
    return this.serviceBookings.customerProjection(familyId);
  }

  /** Versioned fixture-only membership plans; no payment or renewal channel is exposed. */
  @Get('orchestration/test-loop/membership/plans')
  @RequireOrchestrationAction('ReadFamily')
  async membershipPlans(@Param('familyId') familyId: string) {
    return this.membershipEntitlements.plans(familyId);
  }

  /** Creates a DEV/TEST family membership subscription and internal benefit grants only. */
  @Post('orchestration/test-loop/membership/subscriptions')
  @RequireOrchestrationAction('ManageMembershipEntitlement')
  async subscribeMembership(
    @Param('familyId') familyId: string,
    @Body() body: SubscribeMembershipDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.membershipEntitlements.subscribe(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Post('orchestration/test-loop/membership/benefits/consume')
  @RequireOrchestrationAction('ManageMembershipEntitlement')
  async consumeMembershipBenefit(
    @Param('familyId') familyId: string,
    @Body() body: ConsumeMembershipBenefitDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.membershipEntitlements.consume(familyId, actor.personId, body ?? {}, corr(correlationId), idempotencyKey?.trim() || undefined);
  }

  @Post('orchestration/test-loop/membership/benefits/revoke')
  @RequireOrchestrationAction('ManageMembershipEntitlement')
  async revokeMembershipBenefit(
    @Param('familyId') familyId: string,
    @Body() body: RevokeMembershipBenefitDto,
    @OrchestrationActor() actor: Actor,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.membershipEntitlements.revoke(familyId, actor.personId, body ?? {}, corr(correlationId));
  }

  @Get('orchestration/test-loop/membership/customer-projection')
  @RequireOrchestrationAction('ReadFamily')
  async membershipCustomerProjection(@Param('familyId') familyId: string) {
    return this.membershipEntitlements.customerProjection(familyId);
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

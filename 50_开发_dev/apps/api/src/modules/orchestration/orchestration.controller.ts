import { BadRequestException, Body, Controller, Get, Headers, Inject, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ActorId, FamilyPlatformAuthGuard, RequireFamilyAction, RequireTrustedFamilyContext } from '../auth/family-platform-auth.guard';
import { OrchestrationService } from './orchestration.service';
import { assertIdempotencyKey, assertUuid, type CreateIntentInput, type CreatePlanInput, type DecideServiceInput, type OpenCaseInput, type RecordFollowUpInput, type RequestRecommendationInput } from './orchestration.types';

@Controller('families/:familyId/orchestration')
@UseGuards(FamilyPlatformAuthGuard)
@RequireTrustedFamilyContext()
export class OrchestrationController {
  constructor(@Inject(OrchestrationService) private readonly service: OrchestrationService) {}

  @Post('intents')
  @RequireFamilyAction('CreateGrowthIntent')
  async createIntent(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id');
    const input = createIntentInput(familyId, body, idempotencyKey);
    return this.service.createIntent(input, audit(actorId, correlationId, source));
  }

  @Post('recommendations')
  @RequireFamilyAction('RequestResourceRecommendation')
  async requestRecommendation(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id');
    const input = recommendationInput(familyId, body, idempotencyKey);
    return this.service.requestRecommendation(input, audit(actorId, correlationId, source));
  }

  @Post('decisions')
  @RequireFamilyAction('DecideFamilyService')
  async decideService(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id');
    const input = decisionInput(familyId, body, idempotencyKey);
    return this.service.decideService(input, audit(actorId, correlationId, source));
  }

  @Post('plans')
  @RequireFamilyAction('CreateOrchestrationPlan')
  async createPlan(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id');
    const input = planInput(familyId, body, idempotencyKey);
    return this.service.createPlan(input, audit(actorId, correlationId, source));
  }

  @Post('service-cases')
  @RequireFamilyAction('OpenServiceCase')
  async openServiceCase(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id');
    const input = openCaseInput(familyId, body, idempotencyKey);
    return this.service.openServiceCase(input, audit(actorId, correlationId, source));
  }

  @Post('service-cases/:serviceCaseId/follow-up')
  @RequireFamilyAction('RecordServiceFollowUp')
  async recordFollowUp(
    @Param('familyId') familyId: string,
    @Param('serviceCaseId') serviceCaseId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id'); assertUuidSafe(serviceCaseId, 'service_case_id');
    const input = followUpInput(familyId, serviceCaseId, body, idempotencyKey);
    return this.service.recordFollowUp(input, audit(actorId, correlationId, source));
  }

  @Get('context-reuse/:subjectPersonId')
  @RequireFamilyAction('ReadFamily')
  async contextReuse(
    @Param('familyId') familyId: string,
    @Param('subjectPersonId') subjectPersonId: string,
    @ActorId() actorId: string,
  ) {
    assertTrusted(actorId); assertUuidSafe(familyId, 'family_id'); assertUuidSafe(subjectPersonId, 'subject_person_id');
    return this.service.getContextReuse(familyId, subjectPersonId);
  }
}

function audit(actorId: string, correlationId?: string, source?: string) {
  return { actorId, correlationId: correlationId?.trim() || crypto.randomUUID(), source: source?.trim() || 'api', occurredAt: new Date().toISOString() };
}
function assertTrusted(actorId: string): void {
  if (!actorId || actorId.trim().length === 0 || actorId.startsWith('account:')) throw new UnauthorizedException('trusted_family_actor_required');
}
function assertUuidSafe(value: string, name: string): void {
  try { assertUuid(value, name); } catch { throw new BadRequestException(`invalid_${name}`); }
}
function obj(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('invalid_request_body');
  return body as Record<string, unknown>;
}
function text(value: unknown, name: string, min = 1, max = 2000): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new BadRequestException(`invalid_${name}`);
  return value.trim();
}
function id(value: unknown, name: string): string { const result = text(value, name, 36, 36); assertUuidSafe(result, name); return result; }
function key(value?: string): string { try { return assertIdempotencyKey(value); } catch { throw new BadRequestException('invalid_idempotency_key'); } }

function createIntentInput(familyId: string, body: unknown, idempotencyKey?: string): CreateIntentInput {
  const b = obj(body);
  return { familyId, subjectPersonId: id(b.subject_person_id, 'subject_person_id'), signalText: text(b.signal_text, 'signal_text', 3, 2000), goalText: text(b.goal_text, 'goal_text', 3, 1000), idempotencyKey: key(idempotencyKey) };
}
function recommendationInput(familyId: string, body: unknown, idempotencyKey?: string): RequestRecommendationInput {
  const b = obj(body); return { familyId, growthIntentId: id(b.growth_intent_id, 'growth_intent_id'), idempotencyKey: key(idempotencyKey) };
}
function decisionInput(familyId: string, body: unknown, idempotencyKey?: string): DecideServiceInput {
  const b = obj(body); const decisionType = text(b.decision_type, 'decision_type', 2, 32) as DecideServiceInput['decisionType'];
  if (!['ACCEPT','SELECT_ALTERNATIVE','DECLINE','NO_ACTION'].includes(decisionType)) throw new BadRequestException('invalid_decision_type');
  if (!Array.isArray(b.selected_offer_ids) || b.selected_offer_ids.some((v) => typeof v !== 'string')) throw new BadRequestException('invalid_selected_offer_ids');
  const selectedOfferIds = (b.selected_offer_ids as unknown[]).map((v) => id(v, 'selected_offer_id'));
  if (new Set(selectedOfferIds).size !== selectedOfferIds.length) throw new BadRequestException('duplicate_selected_offer_id');
  const rationale = b.rationale === undefined ? undefined : text(b.rationale, 'rationale', 1, 1000);
  return { familyId, recommendationId: id(b.resource_recommendation_id, 'resource_recommendation_id'), decisionType, selectedOfferIds, rationale, idempotencyKey: key(idempotencyKey) };
}
function planInput(familyId: string, body: unknown, idempotencyKey?: string): CreatePlanInput { const b = obj(body); return { familyId, decisionId: id(b.family_service_decision_id, 'family_service_decision_id'), idempotencyKey: key(idempotencyKey) }; }
function openCaseInput(familyId: string, body: unknown, idempotencyKey?: string): OpenCaseInput { const b = obj(body); return { familyId, planId: id(b.orchestration_plan_id, 'orchestration_plan_id'), idempotencyKey: key(idempotencyKey) }; }
function followUpInput(familyId: string, serviceCaseId: string, body: unknown, idempotencyKey?: string): RecordFollowUpInput {
  const b = obj(body); const helpfulness = text(b.helpfulness, 'helpfulness', 2, 32) as RecordFollowUpInput['helpfulness'];
  if (!['HELPFUL','A_LITTLE_HELPFUL','NOT_HELPFUL','NOT_ANSWERED'].includes(helpfulness)) throw new BadRequestException('invalid_helpfulness');
  return { familyId, serviceCaseId, helpfulness, responseText: b.response_text === undefined ? undefined : text(b.response_text, 'response_text', 1, 2000), idempotencyKey: key(idempotencyKey) };
}

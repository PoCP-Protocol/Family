import { BadRequestException, Body, Controller, Get, Headers, Inject, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ActorId, FamilyPlatformAuthGuard } from '../auth/family-platform-auth.guard';
import type { AddChildResponse, AddParentResponse, AssignLifeStageResponse, AuditMeta, BuildGrowthProfileDraftsResponse, CompleteGrowthActionResponse, CompleteGrowthReviewResponse, ConfirmGrowthPriorityResponse, ConfirmGrowthProfileResponse, CreateFamilyRelationshipResponse, CreateFamilyResponse, FamilyAggregateResponse, FamilyTimelineResponse, GrantConsentResponse, GrowthActionDto, GrowthInsightResponse, GrowthPriorityInsightResponse, InterventionCardDto, PerspectiveSummaryResponse, RecordNextStepDecisionResponse, RecordOutcomeObservationResponse, RecordPerspectiveResponse, StartGrowthOnboardingResponse, StartInterventionResponse } from '@family/contracts';
import { validateAddChildRequest } from './add-child.dto';
import { validateAddParentRequest } from './add-parent.dto';
import { validateAssignLifeStageRequest } from './assign-life-stage.dto';
import { validateBuildGrowthProfileDraftsRequest } from './build-growth-profile-drafts.dto';
import { validateCompleteGrowthActionRequest } from './complete-growth-action.dto';
import { validateCompleteGrowthReviewRequest } from './complete-growth-review.dto';
import { validateConfirmGrowthPriorityRequest } from './confirm-growth-priority.dto';
import { validateConfirmGrowthProfileRequest } from './confirm-growth-profile.dto';
import { validateCreateFamilyRelationshipRequest } from './create-family-relationship.dto';
import { validateCreateFamilyRequest } from './create-family.dto';
import { validateGrantConsentRequest } from './grant-consent.dto';
import { validateRecordNextStepDecisionRequest } from './record-next-step-decision.dto';
import { validateRecordOutcomeObservationRequest } from './record-outcome-observation.dto';
import { validateRecordPerspectiveRequest } from './record-perspective.dto';
import { validateStartGrowthOnboardingRequest } from './start-growth-onboarding.dto';
import { validateStartInterventionRequest } from './start-intervention.dto';
import { FamilyService } from './family.service';
import { GrowthActionService } from './growth-action.service';
import { GrowthPriorityService } from './growth-priority.service';
import { GrowthReviewService } from './growth-review.service';
import { InterventionService } from './intervention.service';

@Controller('families')
@UseGuards(FamilyPlatformAuthGuard)   // PLATFORM-IAM-104:统一解析可信 actor;required 模式拒 x-actor-id-only
export class FamilyController {
  constructor(
    @Inject(FamilyService) private readonly familyService: FamilyService,
    @Inject(GrowthPriorityService) private readonly growthPriorityService: GrowthPriorityService,
    @Inject(InterventionService) private readonly interventionService: InterventionService,
    @Inject(GrowthActionService) private readonly growthActionService: GrowthActionService,
    @Inject(GrowthReviewService) private readonly growthReviewService: GrowthReviewService,
  ) {}

  @Get(':familyId')
  async getFamilyAggregate(
    @Param('familyId') familyId: string,
    @ActorId() actorId: string,
  ): Promise<FamilyAggregateResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    if (!isUuid(familyId)) {
      throw new BadRequestException('Invalid family_id');
    }

    return this.familyService.getFamilyAggregate(familyId, actorId);
  }

  @Post()
  async create(
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ): Promise<CreateFamilyResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateCreateFamilyRequest(body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.createFamily(request, meta);
  }

  @Post(':familyId/parents')
  async addParent(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ): Promise<AddParentResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateAddParentRequest(familyId, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.addParent(request, meta);
  }

  @Post(':familyId/children')
  async addChild(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ): Promise<AddChildResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateAddChildRequest(familyId, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.addChild(request, meta);
  }

  @Post(':familyId/relationships')
  async createRelationship(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ): Promise<CreateFamilyRelationshipResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateCreateFamilyRelationshipRequest(familyId, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.createRelationship(request, meta);
  }

  @Post(':familyId/life-stages')
  async assignLifeStage(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
  ): Promise<AssignLifeStageResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateAssignLifeStageRequest(familyId, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.assignLifeStage(request, meta);
  }

  @Post(':familyId/consents')
  async grantConsent(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<GrantConsentResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateGrantConsentRequest(familyId, idempotencyKey, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.grantConsent(request, meta);
  }

  @Post(':familyId/growth/onboarding')
  async startGrowthOnboarding(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<StartGrowthOnboardingResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateStartGrowthOnboardingRequest(familyId, idempotencyKey, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.startGrowthOnboarding(request, meta);
  }

  @Post(':familyId/growth/onboardings/:onboardingId/perspectives')
  async recordPerspective(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RecordPerspectiveResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateRecordPerspectiveRequest(familyId, onboardingId, idempotencyKey, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.recordPerspective(request, meta);
  }

  @Get(':familyId/growth/onboardings/:onboardingId/perspectives')
  async getPerspectiveSummary(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @ActorId() actorId: string,
  ): Promise<PerspectiveSummaryResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    if (!isUuid(familyId) || !isUuid(onboardingId)) {
      throw new BadRequestException('Invalid schema');
    }

    return this.familyService.getPerspectiveSummary(familyId, onboardingId, actorId);
  }

  @Post(':familyId/growth/onboardings/:onboardingId/profile-drafts')
  async buildGrowthProfileDrafts(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<BuildGrowthProfileDraftsResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateBuildGrowthProfileDraftsRequest(familyId, onboardingId, idempotencyKey, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.buildGrowthProfileDrafts(request, meta);
  }

  @Get(':familyId/growth/onboardings/:onboardingId/insight')
  async getGrowthInsight(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @ActorId() actorId: string,
  ): Promise<GrowthInsightResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    if (!isUuid(familyId) || !isUuid(onboardingId)) {
      throw new BadRequestException('Invalid schema');
    }

    return this.familyService.getGrowthInsight(familyId, onboardingId, actorId);
  }

  @Get(':familyId/growth/onboardings/:onboardingId/priority')
  async getGrowthPriorityInsight(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @ActorId() actorId: string,
  ): Promise<GrowthPriorityInsightResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    if (!isUuid(familyId) || !isUuid(onboardingId)) {
      throw new BadRequestException('Invalid schema');
    }

    return this.growthPriorityService.getGrowthPriorityInsight(familyId, onboardingId, actorId);
  }

  @Post(':familyId/growth/onboardings/:onboardingId/priority/confirm')
  async confirmGrowthPriority(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ConfirmGrowthPriorityResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateConfirmGrowthPriorityRequest(familyId, onboardingId, idempotencyKey, body);
    const meta = buildAuditMeta(actorId, correlationId, source);
    return this.growthPriorityService.confirmGrowthPriority(request, meta);
  }

  @Get(':familyId/growth/interventions/LISTEN_BEFORE_RESPOND')
  async getInterventionCard(
    @Param('familyId') familyId: string,
    @ActorId() actorId: string,
  ): Promise<InterventionCardDto> {
    assertReadContext(familyId, actorId);
    return this.interventionService.getInterventionCard(familyId, actorId!);
  }

  @Post(':familyId/growth/onboardings/:onboardingId/interventions/start')
  async startIntervention(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<StartInterventionResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateStartInterventionRequest(familyId, onboardingId, idempotencyKey, body);
    const meta = buildAuditMeta(actorId, correlationId, source);
    return this.interventionService.startIntervention(request, meta);
  }

  @Get(':familyId/growth/onboardings/:onboardingId/interventions/active')
  async getActiveIntervention(
    @Param('familyId') familyId: string,
    @Param('onboardingId') onboardingId: string,
    @ActorId() actorId: string,
  ): Promise<StartInterventionResponse | null> {
    assertReadContext(familyId, actorId, onboardingId);
    return this.interventionService.getActiveIntervention(familyId, onboardingId, actorId!);
  }

  @Get(':familyId/growth/actions/today')
  async getTodayGrowthAction(
    @Param('familyId') familyId: string,
    @ActorId() actorId: string,
  ): Promise<GrowthActionDto | null> {
    assertReadContext(familyId, actorId);
    return this.growthActionService.getTodayAction(familyId, actorId!);
  }

  @Post(':familyId/growth/actions/:actionId/complete')
  async completeGrowthAction(
    @Param('familyId') familyId: string,
    @Param('actionId') actionId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CompleteGrowthActionResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateCompleteGrowthActionRequest(familyId, actionId, idempotencyKey, body);
    const meta = buildAuditMeta(actorId, correlationId, source);
    return this.growthActionService.completeGrowthAction(request, meta);
  }

  @Post(':familyId/growth/outcome-observations')
  async recordOutcomeObservation(
    @Param('familyId') familyId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RecordOutcomeObservationResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateRecordOutcomeObservationRequest(familyId, idempotencyKey, body);
    const meta = buildAuditMeta(actorId, correlationId, source);
    return this.growthReviewService.recordOutcomeObservation(request, meta);
  }

  @Post(':familyId/growth/intervention-episodes/:episodeId/review/complete')
  async completeGrowthReview(
    @Param('familyId') familyId: string,
    @Param('episodeId') episodeId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CompleteGrowthReviewResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateCompleteGrowthReviewRequest(familyId, episodeId, idempotencyKey, body);
    const meta = buildAuditMeta(actorId, correlationId, source);
    return this.growthReviewService.completeGrowthReview(request, meta);
  }

  @Post(':familyId/growth/reviews/:reviewId/next-step')
  async recordNextStepDecision(
    @Param('familyId') familyId: string,
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<RecordNextStepDecisionResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateRecordNextStepDecisionRequest(familyId, reviewId, idempotencyKey, body);
    const meta = buildAuditMeta(actorId, correlationId, source);
    return this.growthReviewService.recordNextStepDecision(request, meta);
  }

  @Get(':familyId/growth/intervention-episodes/:episodeId/timeline')
  async getGrowthTimeline(
    @Param('familyId') familyId: string,
    @Param('episodeId') episodeId: string,
    @ActorId() actorId: string,
  ): Promise<FamilyTimelineResponse> {
    assertReadContext(familyId, actorId, episodeId);
    return this.growthReviewService.getTimeline(familyId, episodeId, actorId!);
  }

  @Post(':familyId/growth/profile-drafts/:draftId/confirm')
  async confirmGrowthProfile(
    @Param('familyId') familyId: string,
    @Param('draftId') draftId: string,
    @Body() body: unknown,
    @ActorId() actorId: string,
    @Headers('x-correlation-id') correlationId?: string,
    @Headers('x-source') source?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ConfirmGrowthProfileResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    const request = validateConfirmGrowthProfileRequest(familyId, draftId, idempotencyKey, body);
    const meta: AuditMeta = {
      actor: actorId,
      correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
      source: source && source.trim().length > 0 ? source : 'api',
      occurredAt: new Date().toISOString(),
    };

    return this.familyService.confirmGrowthProfile(request, meta);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildAuditMeta(actorId: string, correlationId?: string, source?: string): AuditMeta {
  return {
    actor: actorId,
    correlationId: correlationId && correlationId.trim().length > 0 ? correlationId : crypto.randomUUID(),
    source: source && source.trim().length > 0 ? source : 'api',
    occurredAt: new Date().toISOString(),
  };
}

function assertReadContext(familyId: string, actorId?: string, onboardingId?: string): void {
  if (!actorId || actorId.trim().length === 0) {
    throw new UnauthorizedException('actor_is_authenticated');
  }
  if (!isUuid(familyId) || (onboardingId !== undefined && !isUuid(onboardingId))) {
    throw new BadRequestException('Invalid schema');
  }
}

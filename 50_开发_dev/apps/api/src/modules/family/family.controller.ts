import { BadRequestException, Body, Controller, Get, Headers, Inject, Param, Post, UnauthorizedException } from '@nestjs/common';
import type { AddChildResponse, AddParentResponse, AssignLifeStageResponse, AuditMeta, BuildGrowthProfileDraftsResponse, ConfirmGrowthProfileResponse, CreateFamilyRelationshipResponse, CreateFamilyResponse, FamilyAggregateResponse, GrantConsentResponse, GrowthInsightResponse, PerspectiveSummaryResponse, RecordPerspectiveResponse, StartGrowthOnboardingResponse } from '@family/contracts';
import { validateAddChildRequest } from './add-child.dto';
import { validateAddParentRequest } from './add-parent.dto';
import { validateAssignLifeStageRequest } from './assign-life-stage.dto';
import { validateBuildGrowthProfileDraftsRequest } from './build-growth-profile-drafts.dto';
import { validateConfirmGrowthProfileRequest } from './confirm-growth-profile.dto';
import { validateCreateFamilyRelationshipRequest } from './create-family-relationship.dto';
import { validateCreateFamilyRequest } from './create-family.dto';
import { validateGrantConsentRequest } from './grant-consent.dto';
import { validateRecordPerspectiveRequest } from './record-perspective.dto';
import { validateStartGrowthOnboardingRequest } from './start-growth-onboarding.dto';
import { FamilyService } from './family.service';

@Controller('families')
export class FamilyController {
  constructor(@Inject(FamilyService) private readonly familyService: FamilyService) {}

  @Get(':familyId')
  async getFamilyAggregate(
    @Param('familyId') familyId: string,
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
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
    @Headers('x-actor-id') actorId?: string,
  ): Promise<GrowthInsightResponse> {
    if (!actorId || actorId.trim().length === 0) {
      throw new UnauthorizedException('actor_is_authenticated');
    }

    if (!isUuid(familyId) || !isUuid(onboardingId)) {
      throw new BadRequestException('Invalid schema');
    }

    return this.familyService.getGrowthInsight(familyId, onboardingId, actorId);
  }

  @Post(':familyId/growth/profile-drafts/:draftId/confirm')
  async confirmGrowthProfile(
    @Param('familyId') familyId: string,
    @Param('draftId') draftId: string,
    @Body() body: unknown,
    @Headers('x-actor-id') actorId?: string,
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
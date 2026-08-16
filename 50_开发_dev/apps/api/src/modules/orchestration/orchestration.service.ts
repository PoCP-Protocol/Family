import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { buildCandidates, evaluateExecutionEligibility, evaluateRecommendationEligibility } from './orchestration.policy';
import { OrchestrationRepository } from './orchestration.repository';
import type { AuditInput, CreateIntentInput, CreatePlanInput, DecideServiceInput, CreateStewardHandoffDraftInput, FamilyProgressProjection, FamilyServiceMetrics, OpenCaseInput, RecordFollowUpInput, RequestRecommendationInput, StewardHandoffDraft, StewardQueueItem, UpdateStewardHandoffDraftInput } from './orchestration.types';

@Injectable()
export class OrchestrationService {
  constructor(private readonly repo: OrchestrationRepository) {}

  async createIntent(input: CreateIntentInput, audit: AuditInput) {
    try {
      const result = await this.repo.createIntent(input, audit);
      return {
        ...result,
        need_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
        truth_boundary: 'NEED_SIGNAL_AND_FAMILY_CONFIRMED_INTENT_NOT_CHILD_DIAGNOSIS',
      };
    } catch (error) { throw domainError(error); }
  }

  async requestRecommendation(input: RequestRecommendationInput, audit: AuditInput) {
    try {
      const created = await this.repo.withTransaction(async (client) => {
        const replay = await this.repo.findRecommendationByKey(client, input.familyId, input.idempotencyKey);
        if (replay) return replay;
        const intent = await this.repo.getIntentForRecommendation(client, input.familyId, input.growthIntentId);
        const serviceConsent = await this.repo.activeServiceConsent(client, input.familyId, intent.subject_person_id);
        const offers = await this.repo.getActiveOffers(client, intent.growth_intent_id);
        const evaluations = offers.map((offer) => evaluateRecommendationEligibility(offer, serviceConsent));
        const candidates = buildCandidates(offers, evaluations);
        if (!candidates.length) throw new Error('no_eligible_resource_offer');
        return this.repo.createRecommendation(client, input, audit.actorId, candidates, evaluations);
      });
      const view = await this.repo.recommendationView(input.familyId, created.resource_recommendation_id);
      return {
        ...view,
        policy_version: 'FAMILY-GROWTH-VERTICAL-SLICE-001',
        ranking_boundary: 'ELIGIBILITY_FIRST_NO_REVENUE_OR_ENGAGEMENT_SIGNAL',
      };
    } catch (error) { throw domainError(error); }
  }

  async decideService(input: DecideServiceInput, audit: AuditInput) {
    try {
      const result = await this.repo.createDecision(input, audit);
      return {
        ...result,
        truth_boundary: 'FAMILY_SERVICE_DECISION_IS_SEPARATE_FROM_RECOMMENDATION_AND_EXECUTION',
      };
    } catch (error) { throw domainError(error); }
  }

  async createPlan(input: CreatePlanInput, audit: AuditInput) {
    try {
      const result = await this.repo.createPlan(input, audit);
      return {
        ...result,
        plan_boundary: 'DECLARATIVE_PLAN_ONLY_NOT_EXECUTION_OR_COMPLETION_TRUTH',
      };
    } catch (error) { throw domainError(error); }
  }

  async openServiceCase(input: OpenCaseInput, audit: AuditInput) {
    try {
      const result = await this.repo.createServiceCase(input, audit, async (client) => {
        const offer = await this.repo.firstPlanOfferForExecution(client, input.familyId, input.planId);
        const serviceConsent = await this.repo.activeServiceConsentForPlan(client, input.familyId, input.planId);
        const e = evaluateExecutionEligibility(offer, serviceConsent);
        return { result: e.result, reasonCode: e.reasonCode, detail: e.detail, offerId: offer.resource_offer_id };
      });
      return {
        ...result,
        execution_boundary: 'SERVICE_CASE_RECORDS_SERVICE_EXECUTION_NOT_CHILD_OR_FAMILY_GROWTH_OUTCOME',
      };
    } catch (error) { throw domainError(error); }
  }

  async recordFollowUp(input: RecordFollowUpInput, audit: AuditInput) {
    try {
      const result = await this.repo.recordFollowUp(input, audit);
      return {
        ...result,
        helpfulness_boundary: 'USER_PERCEIVED_HELPFULNESS_NOT_GROWTH_OUTCOME_OR_CAUSAL_PROOF',
      };
    } catch (error) { throw domainError(error); }
  }

  async getProgressProjection(familyId: string, subjectPersonId: string): Promise<FamilyProgressProjection> {
    try { return await this.repo.progressProjection(familyId, subjectPersonId); } catch (error) { throw domainError(error); }
  }

  async getStewardQueue(familyId: string): Promise<StewardQueueItem[]> {
    try { return await this.repo.stewardQueue(familyId); } catch (error) { throw domainError(error); }
  }

  async getServiceMetrics(familyId: string, subjectPersonId: string): Promise<FamilyServiceMetrics> {
    try { return await this.repo.serviceMetrics(familyId, subjectPersonId); } catch (error) { throw domainError(error); }
  }

  async createStewardHandoffDraft(input: CreateStewardHandoffDraftInput, audit: AuditInput): Promise<StewardHandoffDraft> {
    try { return await this.repo.createStewardHandoffDraft(input, audit); } catch (error) { throw domainError(error); }
  }

  async updateStewardHandoffDraft(input: UpdateStewardHandoffDraftInput, audit: AuditInput): Promise<StewardHandoffDraft> {
    try { return await this.repo.updateStewardHandoffDraft(input, audit); } catch (error) { throw domainError(error); }
  }

  async getContextReuse(familyId: string, subjectPersonId: string) {
    try {
      const items = await this.repo.contextReuse(familyId, subjectPersonId);
      return {
        family_id: familyId,
        subject_person_id: subjectPersonId,
        items: items.map((item) => ({ ...item, note: 'USER_PERCEIVED_HELPFULNESS_NOT_GROWTH_OUTCOME' })),
        boundary: 'MINIMAL_FAMILY_SCOPED_CONTEXT_REUSE_NO_CROSS_FAMILY_LEARNING_OR_CAUSAL_CLAIM',
      };
    } catch (error) { throw domainError(error); }
  }
}

function domainError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'orchestration_operation_failed';
  if (message.includes('not_found')) return new NotFoundException(message);
  if (message.includes('not_in_family') || message.includes('not_eligible') || message.includes('must_be_parent')) return new BadRequestException(message);
  if (message.startsWith('invalid_') || message.includes('requires') || message.includes('not_open') || message.includes('not_ready') || message.includes('no_eligible') || message.includes('ineligible') || message.includes('cannot_select')) return new BadRequestException(message);
  return new BadRequestException(message);
}

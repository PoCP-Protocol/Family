import { BadRequestException } from '@nestjs/common';
import type {
  ConfirmJourneyPlanRequest,
  CreateJourneyPlanRequest,
  JourneyPhaseReviewDecision,
  PauseJourneyPlanRequest,
  ReviewJourneyPhaseRequest,
} from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REVIEW_DECISIONS = new Set<JourneyPhaseReviewDecision>(['CONTINUE', 'ADJUST', 'PAUSE', 'HUMAN_REVIEW_REQUIRED']);
type JsonObject = Record<string, unknown>;

export function validateCreateJourneyPlanRequest(
  familyId: string,
  onboardingId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): CreateJourneyPlanRequest {
  validateIdsAndIdempotency(familyId, onboardingId, idempotencyKey);
  const input = asObject(body, ['priority_id']);
  if (typeof input.priority_id !== 'string' || !UUID_PATTERN.test(input.priority_id)) throw new BadRequestException('Invalid schema');
  return { family_id: familyId, onboarding_id: onboardingId, priority_id: input.priority_id, idempotency_key: idempotencyKey! };
}

export function validateConfirmJourneyPlanRequest(
  familyId: string,
  planId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): ConfirmJourneyPlanRequest {
  validateIdsAndIdempotency(familyId, planId, idempotencyKey);
  asObject(body, []);
  return { family_id: familyId, plan_id: planId, idempotency_key: idempotencyKey! };
}

export function validatePauseJourneyPlanRequest(
  familyId: string,
  planId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): PauseJourneyPlanRequest {
  validateIdsAndIdempotency(familyId, planId, idempotencyKey);
  asObject(body, []);
  return { family_id: familyId, plan_id: planId, idempotency_key: idempotencyKey! };
}

export function validateReviewJourneyPhaseRequest(
  familyId: string,
  planId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): ReviewJourneyPhaseRequest {
  validateIdsAndIdempotency(familyId, planId, idempotencyKey);
  const input = asObject(body, ['decision']);
  if (typeof input.decision !== 'string' || !REVIEW_DECISIONS.has(input.decision as JourneyPhaseReviewDecision)) {
    throw new BadRequestException('Invalid schema');
  }
  return { family_id: familyId, plan_id: planId, decision: input.decision as JourneyPhaseReviewDecision, idempotency_key: idempotencyKey! };
}

function validateIdsAndIdempotency(familyId: string, resourceId: string, idempotencyKey: string | undefined): void {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(resourceId)) throw new BadRequestException('Invalid schema');
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) throw new BadRequestException('Invalid schema');
}

function asObject(body: unknown, allowedFields: string[]): JsonObject {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new BadRequestException('Invalid schema');
  const value = body as JsonObject;
  if (Object.keys(value).some((key) => !allowedFields.includes(key))) throw new BadRequestException('Invalid schema');
  return value;
}

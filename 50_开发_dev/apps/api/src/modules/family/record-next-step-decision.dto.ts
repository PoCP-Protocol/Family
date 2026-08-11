import { BadRequestException } from '@nestjs/common';
import type { RecordNextStepDecisionRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(['CONTINUE', 'ADJUST', 'PAUSE', 'REVIEW_REQUIRED']);
const ALLOWED_FIELDS = new Set(['decision', 'rationale']);

type JsonObject = Record<string, unknown>;

export function validateRecordNextStepDecisionRequest(
  familyId: string,
  reviewId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): RecordNextStepDecisionRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(reviewId)) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  for (const field of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }
  if (typeof input.decision !== 'string' || !DECISIONS.has(input.decision)) {
    throw new BadRequestException('Invalid schema');
  }
  if (input.rationale !== undefined && (typeof input.rationale !== 'string' || input.rationale.trim().length > 2000)) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    review_id: reviewId,
    decision: input.decision as RecordNextStepDecisionRequest['decision'],
    ...(typeof input.rationale === 'string' && input.rationale.trim().length > 0 ? { rationale: input.rationale.trim() } : {}),
    idempotency_key: idempotencyKey,
  };
}
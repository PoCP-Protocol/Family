import { BadRequestException } from '@nestjs/common';
import type { RecordFamilyDataLifecycleHumanDecisionRequest, SubmitFamilyDataLifecycleReviewRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(['APPROVED_FOR_SYNTHETIC_VALIDATION', 'REJECTED']);
const REASONS = new Set(['SYNTHETIC_ONLY_POLICY_PASS', 'INSUFFICIENT_SCOPE_OR_CONSENT', 'FAMILY_REQUEST_WITHDRAWN', 'POLICY_NOT_SATISFIED']);

function assertPath(familyId: string, requestId: string, idempotencyKey: string | undefined): void {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(requestId)) throw new BadRequestException('Invalid schema');
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 8 || idempotencyKey.length > 128) throw new BadRequestException('Invalid schema');
}

export function validateSubmitFamilyDataLifecycleReview(
  familyId: string,
  requestId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): SubmitFamilyDataLifecycleReviewRequest {
  assertPath(familyId, requestId, idempotencyKey);
  if (body !== undefined && body !== null && (typeof body !== 'object' || Array.isArray(body) || Object.keys(body as Record<string, unknown>).length !== 0)) {
    throw new BadRequestException('Invalid schema');
  }
  return { family_id: familyId, request_id: requestId, idempotency_key: idempotencyKey! };
}

export function validateRecordFamilyDataLifecycleHumanDecision(
  familyId: string,
  requestId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): RecordFamilyDataLifecycleHumanDecisionRequest {
  assertPath(familyId, requestId, idempotencyKey);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Invalid schema');
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !['decision', 'reasonCode'].includes(key))) throw new BadRequestException('Invalid schema');
  if (typeof input.decision !== 'string' || !DECISIONS.has(input.decision)) throw new BadRequestException('Invalid schema');
  if (typeof input.reasonCode !== 'string' || !REASONS.has(input.reasonCode)) throw new BadRequestException('Invalid schema');
  return {
    family_id: familyId,
    request_id: requestId,
    decision: input.decision as RecordFamilyDataLifecycleHumanDecisionRequest['decision'],
    reason_code: input.reasonCode as RecordFamilyDataLifecycleHumanDecisionRequest['reason_code'],
    idempotency_key: idempotencyKey!,
  };
}

import { BadRequestException } from '@nestjs/common';
import type { ConfirmGrowthPriorityRequest, GrowthPriorityDecision } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_DECISIONS = new Set<GrowthPriorityDecision>(['P03', 'R03', 'R04', 'R05', 'NO_PRIORITY_YET']);
const ALLOWED_FIELDS = new Set(['draft_id', 'decision']);

type JsonObject = Record<string, unknown>;

export function validateConfirmGrowthPriorityRequest(
  familyId: string,
  onboardingId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): ConfirmGrowthPriorityRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(onboardingId)) {
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

  const decision = input.decision;
  const draftId = input.draft_id;

  if (typeof draftId !== 'string' || !UUID_PATTERN.test(draftId)
    || typeof decision !== 'string' || !ALLOWED_DECISIONS.has(decision as GrowthPriorityDecision)) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    onboarding_id: onboardingId,
    draft_id: draftId,
    decision: decision as GrowthPriorityDecision,
    idempotency_key: idempotencyKey,
  };
}

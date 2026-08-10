import { BadRequestException } from '@nestjs/common';
import type { StartInterventionRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_FIELDS = new Set(['priority_id', 'intervention_code']);

type JsonObject = Record<string, unknown>;

export function validateStartInterventionRequest(
  familyId: string,
  onboardingId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): StartInterventionRequest {
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

  if (typeof input.priority_id !== 'string' || !UUID_PATTERN.test(input.priority_id)
    || input.intervention_code !== 'LISTEN_BEFORE_RESPOND') {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    onboarding_id: onboardingId,
    priority_id: input.priority_id,
    intervention_code: 'LISTEN_BEFORE_RESPOND',
    idempotency_key: idempotencyKey,
  };
}

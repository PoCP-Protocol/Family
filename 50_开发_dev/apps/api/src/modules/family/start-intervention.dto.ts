import { BadRequestException } from '@nestjs/common';
import type { StartInterventionRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

export function validateStartInterventionRequest(
  familyId: string,
  onboardingId: string,
  priorityId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): StartInterventionRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(onboardingId) || !UUID_PATTERN.test(priorityId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  if (input.intervention_code !== 'LISTEN_BEFORE_RESPOND') {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    onboarding_id: onboardingId,
    priority_id: priorityId,
    intervention_code: 'LISTEN_BEFORE_RESPOND',
    idempotency_key: idempotencyKey,
  };
}
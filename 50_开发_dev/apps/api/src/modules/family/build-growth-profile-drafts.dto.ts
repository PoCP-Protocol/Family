import { BadRequestException } from '@nestjs/common';
import type { BuildGrowthProfileDraftsRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

export function validateBuildGrowthProfileDraftsRequest(
  familyId: string,
  onboardingId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): BuildGrowthProfileDraftsRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(onboardingId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (body !== undefined && body !== null) {
    if (typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid schema');
    }
    const input = body as JsonObject;
    if (Object.keys(input).length > 0) {
      throw new BadRequestException('Invalid schema');
    }
  }

  return {
    family_id: familyId,
    onboarding_id: onboardingId,
    idempotency_key: idempotencyKey,
  };
}

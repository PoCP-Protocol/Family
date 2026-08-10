import { BadRequestException } from '@nestjs/common';
import type { CompleteGrowthReviewRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_FIELDS = new Set<string>();

export function validateCompleteGrowthReviewRequest(
  familyId: string,
  interventionEpisodeId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): CompleteGrowthReviewRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(interventionEpisodeId)) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }
  if (body !== undefined && body !== null) {
    if (typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid schema');
    }
    for (const field of Object.keys(body as Record<string, unknown>)) {
      if (!ALLOWED_FIELDS.has(field)) {
        throw new BadRequestException('Invalid schema');
      }
    }
  }

  return {
    family_id: familyId,
    intervention_episode_id: interventionEpisodeId,
    idempotency_key: idempotencyKey,
  };
}
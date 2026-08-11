import { BadRequestException } from '@nestjs/common';
import type { CompleteGrowthActionRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMPLETION_STATUSES = new Set(['COMPLETED', 'PARTIAL', 'NOT_COMPLETED']);
const ALLOWED_FIELDS = new Set(['completion_status', 'reflection', 'occurred_at']);

type JsonObject = Record<string, unknown>;

export function validateCompleteGrowthActionRequest(
  familyId: string,
  actionId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): CompleteGrowthActionRequest {
  if (!UUID_PATTERN.test(familyId) || !UUID_PATTERN.test(actionId)) {
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

  if (typeof input.completion_status !== 'string' || !COMPLETION_STATUSES.has(input.completion_status)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.reflection !== 'string' || input.reflection.trim().length > 2000) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.occurred_at !== 'string' || Number.isNaN(Date.parse(input.occurred_at))) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    action_id: actionId,
    completion_status: input.completion_status as CompleteGrowthActionRequest['completion_status'],
    reflection: input.reflection.trim(),
    occurred_at: input.occurred_at,
    idempotency_key: idempotencyKey,
  };
}
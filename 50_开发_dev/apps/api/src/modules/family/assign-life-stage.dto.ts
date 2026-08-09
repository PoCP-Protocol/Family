import { BadRequestException } from '@nestjs/common';
import type { AssignLifeStageRequest, LifeStageCode } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const LIFE_STAGE_CODES = new Set<LifeStageCode>(['EARLY_ADOLESCENCE_12_15']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateAssignLifeStageRequest(familyId: string, body: unknown): AssignLifeStageRequest {
  if (!UUID_PATTERN.test(familyId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  const allowedFields = new Set(['child_id', 'life_stage_code', 'effective_from', 'idempotency_key']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.child_id !== 'string' || !UUID_PATTERN.test(input.child_id)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.life_stage_code !== 'string' || !LIFE_STAGE_CODES.has(input.life_stage_code as LifeStageCode)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.effective_from !== 'string' || Number.isNaN(Date.parse(input.effective_from))) {
    throw new BadRequestException('Invalid schema');
  }

  const parsed = new Date(input.effective_from);
  if (parsed.toISOString() !== input.effective_from) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.idempotency_key !== 'string' || input.idempotency_key.trim().length < 1 || input.idempotency_key.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    child_id: input.child_id,
    life_stage_code: input.life_stage_code as LifeStageCode,
    effective_from: input.effective_from,
    idempotency_key: input.idempotency_key,
  };
}
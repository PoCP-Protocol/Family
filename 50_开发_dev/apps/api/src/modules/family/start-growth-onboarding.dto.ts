import { BadRequestException } from '@nestjs/common';
import type { SafetyScreeningResult, StartGrowthOnboardingRequest } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const SAFETY_SCREENING_RESULTS = new Set<SafetyScreeningResult>(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateStartGrowthOnboardingRequest(familyId: string, idempotencyKey: string | undefined, body: unknown): StartGrowthOnboardingRequest {
  if (!UUID_PATTERN.test(familyId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 1 || idempotencyKey.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  const allowedFields = new Set(['childId', 'guardianPersonId', 'safetyScreeningResult']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.childId !== 'string' || !UUID_PATTERN.test(input.childId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.guardianPersonId !== 'string' || !UUID_PATTERN.test(input.guardianPersonId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.safetyScreeningResult !== 'string' || !SAFETY_SCREENING_RESULTS.has(input.safetyScreeningResult as SafetyScreeningResult)) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    child_id: input.childId,
    guardian_person_id: input.guardianPersonId,
    safety_screening_result: input.safetyScreeningResult as SafetyScreeningResult,
    idempotency_key: idempotencyKey,
  };
}
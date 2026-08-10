import { BadRequestException } from '@nestjs/common';
import type { StartGrowthOnboardingRequest, StructuredSafetySignal } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const SAFETY_SIGNALS = new Set<StructuredSafetySignal>(['NONE', 'SELF_HARM', 'HARM_TO_OTHERS', 'ABUSE', 'VIOLENCE', 'SEVERE_CRISIS']);
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
  const allowedFields = new Set(['childId', 'guardianPersonId', 'structuredSafetySignals']);
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

  const structuredSafetySignals = parseSafetySignals(input.structuredSafetySignals);

  return {
    family_id: familyId,
    child_id: input.childId,
    guardian_person_id: input.guardianPersonId,
    structured_safety_signals: structuredSafetySignals,
    idempotency_key: idempotencyKey,
  };
}

function parseSafetySignals(value: unknown): StructuredSafetySignal[] {
  if (!Array.isArray(value) || value.length < 1) {
    throw new BadRequestException('Invalid schema');
  }
  return value.map((item) => {
    if (typeof item !== 'string' || !SAFETY_SIGNALS.has(item as StructuredSafetySignal)) {
      throw new BadRequestException('Invalid schema');
    }
    return item as StructuredSafetySignal;
  });
}
import { BadRequestException } from '@nestjs/common';
import type { ConsentPurpose, GrantConsentRequest } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const CONSENT_PURPOSES = new Set<ConsentPurpose>([
  'SERVICE',
  'ASSESSMENT',
  'AI_PERSONALIZATION',
  'GROWTH_TRACKING',
  'EXPERT_SERVICE',
  'RESEARCH',
  'MODEL_IMPROVEMENT',
  'CONTENT_PUBLICATION',
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateGrantConsentRequest(familyId: string, idempotencyKey: string | undefined, body: unknown): GrantConsentRequest {
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
  const allowedFields = new Set(['subjectPersonId', 'guardianPersonId', 'purpose', 'policyVersion']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.subjectPersonId !== 'string' || !UUID_PATTERN.test(input.subjectPersonId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.guardianPersonId !== 'string' || !UUID_PATTERN.test(input.guardianPersonId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.purpose !== 'string' || !CONSENT_PURPOSES.has(input.purpose as ConsentPurpose)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.policyVersion !== 'string' || input.policyVersion.trim().length < 1 || input.policyVersion.length > 64) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    subject_person_id: input.subjectPersonId,
    guardian_person_id: input.guardianPersonId,
    purpose: input.purpose as ConsentPurpose,
    policy_version: input.policyVersion,
    idempotency_key: idempotencyKey,
  };
}
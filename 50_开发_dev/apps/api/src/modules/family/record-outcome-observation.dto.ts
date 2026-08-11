import { BadRequestException } from '@nestjs/common';
import type { RecordOutcomeObservationRequest } from '@family/contracts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERSPECTIVE_TYPES = new Set(['PARENT_OBSERVATION', 'CHILD_OBSERVATION']);
const ALLOWED_FIELDS = new Set(['subject_person_id', 'observer_person_id', 'intervention_episode_id', 'perspective_type', 'observation_text', 'action_refs', 'reflection_refs', 'evidence_refs', 'limitations', 'observed_at']);

type JsonObject = Record<string, unknown>;

export function validateRecordOutcomeObservationRequest(
  familyId: string,
  idempotencyKey: string | undefined,
  body: unknown,
): RecordOutcomeObservationRequest {
  if (!UUID_PATTERN.test(familyId)) {
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

  if (typeof input.subject_person_id !== 'string' || !UUID_PATTERN.test(input.subject_person_id)) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof input.observer_person_id !== 'string' || !UUID_PATTERN.test(input.observer_person_id)) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof input.intervention_episode_id !== 'string' || !UUID_PATTERN.test(input.intervention_episode_id)) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof input.perspective_type !== 'string' || !PERSPECTIVE_TYPES.has(input.perspective_type)) {
    throw new BadRequestException('Invalid schema');
  }
  if (typeof input.observation_text !== 'string' || input.observation_text.trim().length < 1 || input.observation_text.trim().length > 2000) {
    throw new BadRequestException('Invalid schema');
  }
  const actionRefs = validateStringArray(input.action_refs, 'action_refs');
  const reflectionRefs = validateStringArray(input.reflection_refs, 'reflection_refs');
  const evidenceRefs = validateStringArray(input.evidence_refs, 'evidence_refs');
  const limitations = validateStringArray(input.limitations, 'limitations');
  if (typeof input.observed_at !== 'string' || Number.isNaN(Date.parse(input.observed_at))) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    subject_person_id: input.subject_person_id,
    observer_person_id: input.observer_person_id,
    intervention_episode_id: input.intervention_episode_id,
    perspective_type: input.perspective_type as RecordOutcomeObservationRequest['perspective_type'],
    observation_text: input.observation_text.trim(),
    action_refs: actionRefs,
    reflection_refs: reflectionRefs,
    evidence_refs: evidenceRefs,
    limitations,
    observed_at: input.observed_at,
    idempotency_key: idempotencyKey,
  };
}

function validateStringArray(value: unknown, fieldName: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) {
    throw new BadRequestException('Invalid schema');
  }
  return value.map((item) => {
    if (typeof item !== 'string') throw new BadRequestException('Invalid schema');
    const trimmed = item.trim();
    if (trimmed.length < 1 || trimmed.length > 160) throw new BadRequestException('Invalid schema');
    if (fieldName.endsWith('_refs') && !UUID_PATTERN.test(trimmed)) throw new BadRequestException('Invalid schema');
    return trimmed;
  });
}
import { BadRequestException } from '@nestjs/common';
import type { CreateFamilyRelationshipRequest, RelationshipType } from '@family/contracts';

type JsonObject = Record<string, unknown>;

const RELATIONSHIP_TYPES = new Set<RelationshipType>(['PARENT_CHILD', 'SPOUSE', 'SIBLING', 'GUARDIAN_CHILD', 'OTHER']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateFamilyRelationshipRequest(familyId: string, body: unknown): CreateFamilyRelationshipRequest {
  if (!UUID_PATTERN.test(familyId)) {
    throw new BadRequestException('Invalid schema');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Invalid schema');
  }

  const input = body as JsonObject;
  const allowedFields = new Set(['person_a_id', 'person_b_id', 'relationship_type', 'idempotency_key']);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException('Invalid schema');
    }
  }

  if (typeof input.person_a_id !== 'string' || !UUID_PATTERN.test(input.person_a_id)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.person_b_id !== 'string' || !UUID_PATTERN.test(input.person_b_id)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.relationship_type !== 'string' || !RELATIONSHIP_TYPES.has(input.relationship_type as RelationshipType)) {
    throw new BadRequestException('Invalid schema');
  }

  if (typeof input.idempotency_key !== 'string' || input.idempotency_key.trim().length < 1 || input.idempotency_key.length > 128) {
    throw new BadRequestException('Invalid schema');
  }

  return {
    family_id: familyId,
    person_a_id: input.person_a_id,
    person_b_id: input.person_b_id,
    relationship_type: input.relationship_type as RelationshipType,
    idempotency_key: input.idempotency_key,
  };
}
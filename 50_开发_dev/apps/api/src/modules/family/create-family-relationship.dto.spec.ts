import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateCreateFamilyRelationshipRequest } from './create-family-relationship.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const parentId = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';

describe('validateCreateFamilyRelationshipRequest', () => {
  it('accepts a valid PARENT_CHILD relationship request', () => {
    expect(validateCreateFamilyRelationshipRequest(familyId, {
      person_a_id: parentId,
      person_b_id: childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-relationship-1',
    })).toEqual({
      family_id: familyId,
      person_a_id: parentId,
      person_b_id: childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-relationship-1',
    });
  });

  it('rejects invalid relationship type', () => {
    expect(() => validateCreateFamilyRelationshipRequest(familyId, {
      person_a_id: parentId,
      person_b_id: childId,
      relationship_type: 'COUSIN',
      idempotency_key: 'idem-relationship-2',
    })).toThrow(BadRequestException);
  });

  it('accepts syntactically valid self relationship payload for service-level invariant validation', () => {
    expect(() => validateCreateFamilyRelationshipRequest(familyId, {
      person_a_id: parentId,
      person_b_id: parentId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-relationship-3',
    })).not.toThrow();
  });

  it('rejects unknown fields', () => {
    expect(() => validateCreateFamilyRelationshipRequest(familyId, {
      person_a_id: parentId,
      person_b_id: childId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-relationship-4',
      consent_granted: true,
    })).toThrow(BadRequestException);
  });
});
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateStartGrowthOnboardingRequest } from './start-growth-onboarding.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const guardianPersonId = '33333333-3333-4333-8333-333333333333';

describe('validateStartGrowthOnboardingRequest', () => {
  it('accepts the approved M2-101 onboarding request shape', () => {
    expect(validateStartGrowthOnboardingRequest(familyId, 'idem-onboarding-1', {
      childId,
      guardianPersonId,
      safetyScreeningResult: 'LOW',
    })).toEqual({
      family_id: familyId,
      child_id: childId,
      guardian_person_id: guardianPersonId,
      safety_screening_result: 'LOW',
      idempotency_key: 'idem-onboarding-1',
    });
  });

  it('rejects missing Idempotency-Key header', () => {
    expect(() => validateStartGrowthOnboardingRequest(familyId, undefined, {
      childId,
      guardianPersonId,
      safetyScreeningResult: 'LOW',
    })).toThrow(BadRequestException);
  });

  it('rejects unknown fields that imply later M2 behavior', () => {
    expect(() => validateStartGrowthOnboardingRequest(familyId, 'idem-onboarding-2', {
      childId,
      guardianPersonId,
      safetyScreeningResult: 'LOW',
      aiPersonalization: true,
    })).toThrow(BadRequestException);
  });

  it('rejects invalid safety screening results', () => {
    expect(() => validateStartGrowthOnboardingRequest(familyId, 'idem-onboarding-3', {
      childId,
      guardianPersonId,
      safetyScreeningResult: 'NONE',
    })).toThrow(BadRequestException);
  });
});
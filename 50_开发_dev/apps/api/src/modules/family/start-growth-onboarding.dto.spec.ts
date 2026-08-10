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
      structuredSafetySignals: ['NONE'],
    })).toEqual({
      family_id: familyId,
      child_id: childId,
      guardian_person_id: guardianPersonId,
      structured_safety_signals: ['NONE'],
      idempotency_key: 'idem-onboarding-1',
    });
  });

  it('rejects missing Idempotency-Key header', () => {
    expect(() => validateStartGrowthOnboardingRequest(familyId, undefined, {
      childId,
      guardianPersonId,
      structuredSafetySignals: ['NONE'],
    })).toThrow(BadRequestException);
  });

  it('rejects unknown fields including client-derived safety severity', () => {
    expect(() => validateStartGrowthOnboardingRequest(familyId, 'idem-onboarding-2', {
      childId,
      guardianPersonId,
      structuredSafetySignals: ['NONE'],
      safetyScreeningResult: 'LOW',
      aiPersonalization: true,
    })).toThrow(BadRequestException);
  });

  it('rejects invalid structured safety signals', () => {
    expect(() => validateStartGrowthOnboardingRequest(familyId, 'idem-onboarding-3', {
      childId,
      guardianPersonId,
      structuredSafetySignals: ['LOW'],
    })).toThrow(BadRequestException);
  });
});
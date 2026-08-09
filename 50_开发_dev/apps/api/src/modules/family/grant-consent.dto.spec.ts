import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateGrantConsentRequest } from './grant-consent.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const subjectPersonId = '22222222-2222-4222-8222-222222222222';
const guardianPersonId = '33333333-3333-4333-8333-333333333333';

describe('validateGrantConsentRequest', () => {
  it('accepts valid SERVICE consent request', () => {
    expect(validateGrantConsentRequest(familyId, 'idem-consent-1', {
      subjectPersonId,
      guardianPersonId,
      purpose: 'SERVICE',
      policyVersion: 'family-consent-v1',
    })).toEqual({
      family_id: familyId,
      subject_person_id: subjectPersonId,
      guardian_person_id: guardianPersonId,
      purpose: 'SERVICE',
      policy_version: 'family-consent-v1',
      idempotency_key: 'idem-consent-1',
    });
  });

  it('rejects invalid purpose', () => {
    expect(() => validateGrantConsentRequest(familyId, 'idem-consent-2', {
      subjectPersonId,
      guardianPersonId,
      purpose: 'GENERAL',
      policyVersion: 'family-consent-v1',
    })).toThrow(BadRequestException);
  });

  it('rejects missing policyVersion', () => {
    expect(() => validateGrantConsentRequest(familyId, 'idem-consent-3', {
      subjectPersonId,
      guardianPersonId,
      purpose: 'SERVICE',
    })).toThrow(BadRequestException);
  });

  it('rejects blank policyVersion', () => {
    expect(() => validateGrantConsentRequest(familyId, 'idem-consent-4', {
      subjectPersonId,
      guardianPersonId,
      purpose: 'SERVICE',
      policyVersion: ' ',
    })).toThrow(BadRequestException);
  });

  it('rejects missing Idempotency-Key header', () => {
    expect(() => validateGrantConsentRequest(familyId, undefined, {
      subjectPersonId,
      guardianPersonId,
      purpose: 'SERVICE',
      policyVersion: 'family-consent-v1',
    })).toThrow(BadRequestException);
  });

  it('rejects unknown fields that could imply broad consent or side effects', () => {
    expect(() => validateGrantConsentRequest(familyId, 'idem-consent-5', {
      subjectPersonId,
      guardianPersonId,
      purpose: 'SERVICE',
      policyVersion: 'family-consent-v1',
      alsoGrantModelImprovement: true,
    })).toThrow(BadRequestException);
  });
});
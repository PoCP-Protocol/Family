import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateStartInterventionRequest } from './start-intervention.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const priorityId = '33333333-3333-4333-8333-333333333333';

describe('validateStartInterventionRequest', () => {
  it('accepts the approved M2-105 request shape', () => {
    expect(validateStartInterventionRequest(familyId, onboardingId, 'idem-start-intervention-1', {
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
    })).toEqual({
      family_id: familyId,
      onboarding_id: onboardingId,
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      idempotency_key: 'idem-start-intervention-1',
    });
  });

  it('rejects unknown client fields', () => {
    expect(() => validateStartInterventionRequest(familyId, onboardingId, 'idem-start-intervention-2', {
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      clientOverride: true,
    })).toThrow(BadRequestException);
  });

  it('rejects forbidden governance fields from the client', () => {
    expect(() => validateStartInterventionRequest(familyId, onboardingId, 'idem-start-intervention-3', {
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      safetyDisposition: 'NORMAL',
    })).toThrow(BadRequestException);
  });
});

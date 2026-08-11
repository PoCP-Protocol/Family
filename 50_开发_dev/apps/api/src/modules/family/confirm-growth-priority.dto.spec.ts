import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateConfirmGrowthPriorityRequest } from './confirm-growth-priority.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const draftId = '33333333-3333-4333-8333-333333333333';

describe('validateConfirmGrowthPriorityRequest', () => {
  it('accepts the approved M2-104 request shape', () => {
    expect(validateConfirmGrowthPriorityRequest(familyId, onboardingId, 'idem-confirm-priority-1', {
      draft_id: draftId,
      decision: 'R03',
    })).toEqual({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: draftId,
      decision: 'R03',
      idempotency_key: 'idem-confirm-priority-1',
    });
  });

  it('rejects unknown client fields', () => {
    expect(() => validateConfirmGrowthPriorityRequest(familyId, onboardingId, 'idem-confirm-priority-2', {
      draft_id: draftId,
      decision: 'R03',
      clientNote: 'not in contract',
    })).toThrow(BadRequestException);
  });

  it('rejects forbidden governance fields from the client', () => {
    expect(() => validateConfirmGrowthPriorityRequest(familyId, onboardingId, 'idem-confirm-priority-3', {
      draft_id: draftId,
      decision: 'R03',
      safetySeverity: 'LOW',
    })).toThrow(BadRequestException);
  });
});

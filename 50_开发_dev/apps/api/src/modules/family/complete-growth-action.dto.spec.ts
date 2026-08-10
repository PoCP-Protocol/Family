import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateCompleteGrowthActionRequest } from './complete-growth-action.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const actionId = '22222222-2222-4222-8222-222222222222';
const occurredAt = '2026-08-10T00:00:00.000Z';

describe('validateCompleteGrowthActionRequest', () => {
  it('accepts the approved M2-105 completion request shape', () => {
    expect(validateCompleteGrowthActionRequest(familyId, actionId, 'idem-complete-action-1', {
      completion_status: 'PARTIAL',
      reflection: '今天先听完了。',
      occurred_at: occurredAt,
    })).toEqual({
      family_id: familyId,
      action_id: actionId,
      completion_status: 'PARTIAL',
      reflection: '今天先听完了。',
      occurred_at: occurredAt,
      idempotency_key: 'idem-complete-action-1',
    });
  });

  it('rejects unknown client fields', () => {
    expect(() => validateCompleteGrowthActionRequest(familyId, actionId, 'idem-complete-action-2', {
      completion_status: 'COMPLETED',
      reflection: '完成。',
      occurred_at: occurredAt,
      clientOverride: true,
    })).toThrow(BadRequestException);
  });

  it('rejects forbidden governance fields from the client', () => {
    expect(() => validateCompleteGrowthActionRequest(familyId, actionId, 'idem-complete-action-3', {
      completion_status: 'COMPLETED',
      reflection: '完成。',
      occurred_at: occurredAt,
      safetySeverity: 'LOW',
    })).toThrow(BadRequestException);
  });
});
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateAssignLifeStageRequest } from './assign-life-stage.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';

describe('validateAssignLifeStageRequest', () => {
  it('accepts valid EARLY_ADOLESCENCE_12_15 assignment request', () => {
    expect(validateAssignLifeStageRequest(familyId, {
      child_id: childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-1',
    })).toEqual({
      family_id: familyId,
      child_id: childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-1',
    });
  });

  it('rejects unsupported life stage codes', () => {
    expect(() => validateAssignLifeStageRequest(familyId, {
      child_id: childId,
      life_stage_code: 'MIDDLE_CHILDHOOD_6_11',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-2',
    })).toThrow(BadRequestException);
  });

  it('rejects non-canonical date-time strings', () => {
    expect(() => validateAssignLifeStageRequest(familyId, {
      child_id: childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01',
      idempotency_key: 'idem-life-stage-3',
    })).toThrow(BadRequestException);
  });

  it('rejects unknown fields that would imply inference or consent side effects', () => {
    expect(() => validateAssignLifeStageRequest(familyId, {
      child_id: childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-life-stage-4',
      inferred_from_birth_date: true,
    })).toThrow(BadRequestException);
  });
});
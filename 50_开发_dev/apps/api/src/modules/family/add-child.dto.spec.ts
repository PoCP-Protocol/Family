import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateAddChildRequest } from './add-child.dto';

const familyId = '11111111-1111-4111-8111-111111111111';

describe('validateAddChildRequest', () => {
  it('accepts birth_date as an optional fact', () => {
    expect(validateAddChildRequest(familyId, {
      display_name: '孩子',
      birth_date: '2012-05-06',
      idempotency_key: 'idem-child-1',
    })).toEqual({
      family_id: familyId,
      display_name: '孩子',
      birth_date: '2012-05-06',
      idempotency_key: 'idem-child-1',
    });
  });

  it('accepts missing birth_date', () => {
    expect(validateAddChildRequest(familyId, {
      display_name: '孩子',
      idempotency_key: 'idem-child-2',
    })).toEqual({
      family_id: familyId,
      display_name: '孩子',
      idempotency_key: 'idem-child-2',
    });
  });

  it('rejects invalid birth_date', () => {
    expect(() => validateAddChildRequest(familyId, {
      display_name: '孩子',
      birth_date: '2012-02-31',
      idempotency_key: 'idem-child-3',
    })).toThrow(BadRequestException);
  });

  it('rejects parent_role injection', () => {
    expect(() => validateAddChildRequest(familyId, {
      display_name: '孩子',
      parent_role: 'MOTHER',
      idempotency_key: 'idem-child-4',
    })).toThrow(BadRequestException);
  });
});
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateAddParentRequest } from './add-parent.dto';

const familyId = '11111111-1111-4111-8111-111111111111';

describe('validateAddParentRequest', () => {
  it('accepts the approved AddParent input shape', () => {
    expect(validateAddParentRequest(familyId, {
      role: 'MOTHER',
      display_name: '妈妈',
      account_id: 'acct-1',
      idempotency_key: 'idem-parent-1',
    })).toEqual({
      family_id: familyId,
      role: 'MOTHER',
      display_name: '妈妈',
      account_id: 'acct-1',
      idempotency_key: 'idem-parent-1',
    });
  });

  it('rejects invalid parent role', () => {
    expect(() => validateAddParentRequest(familyId, {
      role: 'CHILD',
      display_name: '妈妈',
      idempotency_key: 'idem-parent-2',
    })).toThrow(BadRequestException);
  });

  it('rejects invalid display_name', () => {
    expect(() => validateAddParentRequest(familyId, {
      role: 'MOTHER',
      display_name: '',
      idempotency_key: 'idem-parent-3',
    })).toThrow(BadRequestException);
  });
});
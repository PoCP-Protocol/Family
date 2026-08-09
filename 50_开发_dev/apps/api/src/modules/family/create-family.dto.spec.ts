import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { validateCreateFamilyRequest } from './create-family.dto';

describe('validateCreateFamilyRequest', () => {
  it('accepts the approved CreateFamily input shape', () => {
    expect(validateCreateFamilyRequest({ display_name: '王家', idempotency_key: 'idem-1' })).toEqual({
      display_name: '王家',
      idempotency_key: 'idem-1',
    });
  });

  it('rejects client supplied family_id', () => {
    expect(() => validateCreateFamilyRequest({
      family_id: '11111111-1111-1111-1111-111111111111',
      display_name: '王家',
      idempotency_key: 'idem-1',
    })).toThrow(BadRequestException);
  });
});
import { describe, expect, it } from 'vitest';
import { validateWithdrawConsentRequest } from './withdraw-consent.dto';

const familyId = '11111111-1111-4111-8111-111111111111';
const consentId = '22222222-2222-4222-8222-222222222222';

 describe('validateWithdrawConsentRequest', () => {
  it('accepts an empty body with a valid family, consent, and idempotency key', () => {
    expect(validateWithdrawConsentRequest(familyId, consentId, 'idem-withdraw', {})).toEqual({
      family_id: familyId,
      consent_id: consentId,
      idempotency_key: 'idem-withdraw',
    });
  });

  it('rejects client-supplied actor, subject, purpose, or family fields', () => {
    expect(() => validateWithdrawConsentRequest(familyId, consentId, 'idem-withdraw', { actorId: 'x' })).toThrow('Invalid schema');
    expect(() => validateWithdrawConsentRequest(familyId, consentId, 'idem-withdraw', { subjectPersonId: consentId })).toThrow('Invalid schema');
    expect(() => validateWithdrawConsentRequest(familyId, consentId, 'idem-withdraw', { familyId })).toThrow('Invalid schema');
  });

  it('rejects invalid identifiers and missing/oversized idempotency keys', () => {
    expect(() => validateWithdrawConsentRequest('not-a-uuid', consentId, 'idem', {})).toThrow('Invalid schema');
    expect(() => validateWithdrawConsentRequest(familyId, 'not-a-uuid', 'idem', {})).toThrow('Invalid schema');
    expect(() => validateWithdrawConsentRequest(familyId, consentId, undefined, {})).toThrow('Invalid schema');
    expect(() => validateWithdrawConsentRequest(familyId, consentId, 'x'.repeat(129), {})).toThrow('Invalid schema');
  });
});

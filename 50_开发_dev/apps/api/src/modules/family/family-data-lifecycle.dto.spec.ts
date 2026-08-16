import { describe, expect, it } from 'vitest';
import { validateCreateFamilyDataLifecycleRequest } from './family-data-lifecycle.dto';

const familyId = '11111111-1111-4111-8111-111111111111';

describe('validateCreateFamilyDataLifecycleRequest', () => {
  it('accepts an explicit request type and optional family-visible reason', () => {
    expect(validateCreateFamilyDataLifecycleRequest(familyId, 'idem-lifecycle-001', {
      requestType: 'DELETE_REQUEST',
      reasonText: '希望先记录家庭私有数据删除请求。',
    })).toEqual({
      family_id: familyId,
      request_type: 'DELETE_REQUEST',
      reason_text: '希望先记录家庭私有数据删除请求。',
      idempotency_key: 'idem-lifecycle-001',
    });
  });

  it('accepts all three non-executing request types', () => {
    for (const requestType of ['EXPORT_REQUEST', 'RETENTION_REVIEW', 'DELETE_REQUEST']) {
      expect(validateCreateFamilyDataLifecycleRequest(familyId, `idem-${requestType}`, { requestType }).request_type).toBe(requestType);
    }
  });

  it('rejects execution controls, external recipients, data selectors, invalid keys, and invalid payloads', () => {
    expect(() => validateCreateFamilyDataLifecycleRequest(familyId, 'idem-lifecycle-002', { requestType: 'DELETE_REQUEST', executeNow: true })).toThrow('Invalid schema');
    expect(() => validateCreateFamilyDataLifecycleRequest(familyId, 'idem-lifecycle-003', { requestType: 'EXPORT_REQUEST', destination: 'mail@example.com' })).toThrow('Invalid schema');
    expect(() => validateCreateFamilyDataLifecycleRequest(familyId, 'idem-lifecycle-004', { requestType: 'DELETE_REQUEST', tables: ['persons'] })).toThrow('Invalid schema');
    expect(() => validateCreateFamilyDataLifecycleRequest(familyId, 'short', { requestType: 'DELETE_REQUEST' })).toThrow('Invalid schema');
    expect(() => validateCreateFamilyDataLifecycleRequest('bad', 'idem-lifecycle-005', { requestType: 'DELETE_REQUEST' })).toThrow('Invalid schema');
    expect(() => validateCreateFamilyDataLifecycleRequest(familyId, 'idem-lifecycle-006', { requestType: 'ANYTHING' })).toThrow('Invalid schema');
  });
});

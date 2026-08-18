import { describe, expect, it, vi } from 'vitest';
import { TeacherSupplyProjectionError, loadTeacherSupply } from './teacher-supply-client.js';

const projection = {
  tenant_id: 'tenant-test',
  family_id: 'family-test',
  source_page_id: 'UI-19',
  projection_version: 1,
  as_of: '2026-08-18T00:00:00.000Z',
  source_refs: ['family_service_providers', 'family_service_offerings', 'family_service_availability_slots'],
  policy_version: 'test-policy',
  visibility: 'FAMILY_SCOPED_ADMITTED_SUPPLY',
  expires_at: null,
  external_effect: false,
  filters: { provider_kind: 'TEACHER', service_type: '亲子沟通', age_band: '小学阶段', available_only: true },
  offerings: [{
    service_offering_id: 'offering-1', service_offering_ref: 'SERVICE_COMMUNICATION', version_no: 1,
    title: '亲子沟通服务', provider_ref: 'PROVIDER_TEACHER', provider_display_name: '法咪莉校长',
    provider_kind: 'TEACHER', qualification_status: 'ACTIVE', admission_status: 'ADMITTED', offering_status: 'ACTIVE',
    service_type: '亲子沟通', age_band: '小学阶段', next_available_at: '2026-08-20T10:00:00.000Z',
    next_available_channel: 'VIDEO', availability_status: 'AVAILABLE', fixture_only: true, attributes_schema_version: 1,
  }],
  text_equivalent: '以下显示当前家庭可见、已准入的教师服务供给。列表只读，不会预约、占座、通知或联系服务者。',
};

describe('UI-19 teacher supply client', () => {
  it('reads only the scoped teacher-supply projection with declared filters and no write semantics', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    const result = await loadTeacherSupply({
      apiBaseUrl: 'http://family-api.test', familyId: 'family-test',
      filters: { serviceType: '亲子沟通', ageBand: '小学阶段', availableOnly: true }, fetchImpl,
    });

    expect(result.offerings[0]?.provider_kind).toBe('TEACHER');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, request] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe('http://family-api.test/families/family-test/orchestration/test-loop/services/offerings?page_id=UI-19&service_type=%E4%BA%B2%E5%AD%90%E6%B2%9F%E9%80%9A&age_band=%E5%B0%8F%E5%AD%A6%E9%98%B6%E6%AE%B5&available_only=true');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(request.body).toBeUndefined();
    expect(request.headers).not.toHaveProperty('idempotency-key');
  });

  it('fails closed when the server response is not a family-scoped admitted teacher projection', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...projection, family_id: 'other-family' }) });
    await expect(loadTeacherSupply({ apiBaseUrl: 'http://family-api.test', familyId: 'family-test', fetchImpl }))
      .rejects.toBeInstanceOf(TeacherSupplyProjectionError);
  });
});

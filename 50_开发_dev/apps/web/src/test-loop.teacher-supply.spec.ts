import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestLoopApp } from './test-loop.js';

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const projection = {
  tenant_id: 'tenant-test',
  family_id: 'family-test-scope',
  source_page_id: 'UI-19',
  projection_version: 1,
  as_of: '2026-08-18T00:00:00.000Z',
  source_refs: ['family_service_providers', 'family_service_offerings', 'family_service_availability_slots'],
  policy_version: 'test-policy',
  visibility: 'FAMILY_SCOPED_ADMITTED_SUPPLY',
  expires_at: null,
  external_effect: false,
  filters: { provider_kind: 'TEACHER', service_type: null, age_band: null, available_only: true },
  offerings: [{
    service_offering_id: 'offering-1', service_offering_ref: 'SERVICE_COMMUNICATION', version_no: 1,
    title: '亲子沟通服务', provider_ref: 'PROVIDER_TEACHER', provider_display_name: '法咪莉校长',
    provider_kind: 'TEACHER', qualification_status: 'ACTIVE', admission_status: 'ADMITTED', offering_status: 'ACTIVE',
    service_type: '亲子沟通', age_band: '小学阶段', next_available_at: '2026-08-20T10:00:00.000Z',
    next_available_channel: 'VIDEO', availability_status: 'AVAILABLE', fixture_only: true, attributes_schema_version: 1,
  }],
  live_session: { session_ref: 'EXPERT_LIVE_SESSION_FAMILY_GUIDANCE', title: '家庭沟通主题直播', topic: '在日常互动里先听见彼此', starts_at: '2026-08-20T12:00:00.000Z', status: 'SCHEDULED', host_display_name: '家庭成长顾问', fixture_only: true, external_effect: false },
  text_equivalent: '以下显示当前家庭可见、已准入的教师服务供给。列表只读，不会预约、占座、通知或联系服务者。',
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('UI-19 teacher supply route', () => {
  it('keeps the supplied reference image and renders family support topics through a single protected GET', async () => {
    const fetchMock = vi.fn(async (url, request = {}) => {
      if (String(url).includes('/services/slots')) {
        return { ok: true, json: async () => ({ slots: [{ availability_slot_ref: 'SLOT_COMMUNICATION', status: 'AVAILABLE', channel: 'VIDEO' }] }) };
      }
      if (request.method === 'POST' && String(url).includes('/services/booking-requests')) {
        return { ok: true, json: async () => ({ booking: { booking_request_id: 'need-1', status: 'REQUESTED', external_effect: false } }) };
      }
      if (String(url).includes('/services/customer-projection')) {
        return { ok: true, json: async () => ({ tenant_id: 'tenant-test', family_id: 'family-test-scope', projection_version: 1, visibility: 'FAMILY_PRIVATE', bookings: [{ booking_request_id: 'need-1', status: 'REQUESTED', service_offering_ref: 'SERVICE_COMMUNICATION' }], service_records: [{ service_record_id: 'record-1', source_booking_request_id: 'need-1', status: 'PENDING' }] }) };
      }
      if (String(url).includes('/orchestration/test-loop/page-objects')) {
        return { ok: true, json: async () => ({ family_id: 'family-test-scope', visibility: 'FAMILY_PRIVATE', service_records: [{ service_record_id: 'record-live-1', record_kind: 'EXPERT_LIVE_INTEREST', operation_ref: 'operation-live-1', status: 'RECORDED', external_effect: false }] }) };
      }
      return { ok: true, json: async () => projection };
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'teacher-zone', serviceRecordsApiMode: 'synthetic-api' });
    await tick();

    expect(root.querySelector('[data-ui-id="UI-19"] img')?.getAttribute('src')).toBe('/public/bangyang-reference/teacher-zone-reference-458x1008.png');
    expect(root.textContent).toContain('家庭支持主题');
    expect(root.textContent).toContain('亲子沟通服务');
    expect(root.textContent).toContain('支持主题：亲子沟通');
    expect(root.textContent).toContain('家庭沟通主题直播');
    expect(root.textContent).toContain('专家直播 · 即将开始');
    expect(root.textContent).not.toMatch(/法咪莉校长|推荐|排名|准入|资格|预约|联系|支付|DEV|SYNTHETIC|contract/i);
    expect(root.dataset.ui19SupplyStatus).toBe('READ_ONLY_READY');
    expect(root.dataset.ui19SupplyExternalEffect).toBe('false');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/services/offerings?page_id=UI-19&available_only=true');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(String(url)).not.toMatch(/booking|notification|payment|message|contact/i);

    root.querySelector<HTMLButtonElement>('[data-ui19-service-type="亲子沟通"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('page_id=UI-19&service_type=');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('available_only=true');

    root.querySelector<HTMLButtonElement>('[data-ui19-open-topic="SERVICE_COMMUNICATION"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const explanation = root.querySelector('[data-ui20-support-explanation="READY"]');
    expect(explanation?.textContent).toContain('亲子沟通服务');
    expect(explanation?.textContent).toContain('支持主题：亲子沟通');
    expect(explanation?.textContent).toContain('可以了解的方式：线上交流');
    expect(explanation?.textContent).not.toMatch(/法咪莉校长|推荐|排名|准入|资格|评价|预约|联系|支付|DEV|SYNTHETIC|contract/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui20-open-consultation-need"]')?.click();
    await tick();
    const need = root.querySelector('[data-ui21-consultation-need-state="READY"]');
    expect(need?.textContent).toContain('亲子沟通服务');
    expect(need?.textContent).toContain('可以先把想了解的方向记下来');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    root.querySelector<HTMLButtonElement>('[data-by="ui21-save-consultation-need"]')?.click();
    await tick();
    await tick();
    expect(root.dataset.familyConsultationNeedStatus).toBe('REQUESTED');
    expect(root.querySelector('[data-ui21-consultation-need-state="SAVED"]')?.textContent).toContain('咨询需求已记下');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain('/services/slots?service_offering_ref=SERVICE_COMMUNICATION&service_offering_version=1');
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(String(fetchMock.mock.calls[3]?.[0])).toContain('/services/booking-requests');
    expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(fetchMock.mock.calls[3]?.[1]?.body || '{}')).toMatchObject({ page_id: 'UI-21', service_offering_ref: 'SERVICE_COMMUNICATION', availability_slot_ref: 'SLOT_COMMUNICATION' });
    expect(need?.textContent).not.toMatch(/提供者|资格|评价|价格|权益|通知|支付|DEV|SYNTHETIC|contract/i);

    root.querySelector<HTMLButtonElement>('[data-by="ui21-open-support-records"]')?.click();
    await tick();
    await tick();
    const records = root.querySelector('[data-ui24-support-records-state="READY"]');
    expect(records?.textContent).toContain('已经记下的支持需求');
    expect(records?.textContent).toContain('亲子沟通支持');
    expect(records?.textContent).toContain('需求已记下');
    expect(records?.textContent).not.toMatch(/提供者|资格|评价|价格|权益|时间|通知|支付|DEV|SYNTHETIC|contract/i);
    expect(root.dataset.ui24SupportRecordsStatus).toBe('READ_ONLY_READY');
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(String(fetchMock.mock.calls[4]?.[0])).toContain('/services/customer-projection');
    expect(fetchMock.mock.calls[4]?.[1]).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(String(fetchMock.mock.calls[5]?.[0])).toContain('/orchestration/test-loop/page-objects');
    expect(fetchMock.mock.calls[5]?.[1]).toMatchObject({ method: 'GET', credentials: 'include' });

    root.querySelector<HTMLButtonElement>('[data-by="ui24-open-support-topics"]')?.click();
    await tick();
    expect(root.querySelector('[data-ui-id="UI-19"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it('renders a normal boundary message without posting when consent or authorization blocks the projection', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'service_consent_required' }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'teacher-zone' });
    await tick();

    expect(root.dataset.ui19SupplyStatus).toBe('BOUNDARY_BLOCKED');
    expect(root.querySelector('[data-ui19-boundary="blocked"]')?.textContent).toContain('家庭支持主题暂时无法加载，请稍后再试。');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
  });
});


describe('UI-19 authenticated teacher supply projection', () => {
  it('uses the account bearer without an inherited cookie when reading admitted family-scoped support topics', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-test-scope',
      authToken: 'family-ui19-auth-bearer',
      initialPage: 'teacher-zone',
    });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/services/offerings?page_id=UI-19&available_only=true');
    expect(request).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-ui19-auth-bearer');
    expect(root.dataset.ui19SupplyStatus).toBe('READ_ONLY_READY');
    expect(root.dataset.ui19SupplyExternalEffect).toBe('false');
    expect(root.textContent).toContain('家庭支持主题');
    expect(root.textContent).not.toMatch(/预约已确认|真人已联系|外部通知已发送|支付成功/);
  });
});

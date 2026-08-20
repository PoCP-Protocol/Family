import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAMILY_UI_34_ROUTE_MANIFEST, createTestLoopApp } from './test-loop.js';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Family 34-page visual experience and real Gateway entry', () => {
  it('maps UI-01 through UI-34 once without renaming historical asset routes', () => {
    expect(FAMILY_UI_34_ROUTE_MANIFEST).toHaveLength(34);
    expect(new Set(FAMILY_UI_34_ROUTE_MANIFEST.map(([pageId]) => pageId)).size).toBe(34);
    expect(FAMILY_UI_34_ROUTE_MANIFEST.map(([pageId]) => pageId)).toEqual(
      Array.from({ length: 34 }, (_, index) => `UI-${String(index + 1).padStart(2, '0')}`),
    );
  });

  it('renders every manifest route through the same controlled test-loop application shell', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'home' });
    for (const [, route] of FAMILY_UI_34_ROUTE_MANIFEST) {
      app.navigate(route);
      expect(root.querySelector('.by-app')).not.toBeNull();
      expect(root.querySelector('[role="img"], .by-screen')).not.toBeNull();
    }
  });

  it('calls only the Family server Gateway from an existing assessment entry and exposes blocked text-equivalent accessibly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        decision: 'BLOCK_CONFIGURATION',
        stop_code: 'LLM_DISABLED',
        draft: null,
        text_equivalent: '当前说明暂不可用。你可以返回、暂停或现在先不继续。',
        audit: { trace_id: 'trace-fixture-only' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope' });
    const action = root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]');
    expect(action).not.toBeNull();
    if (!action) throw new Error('assessment entry is required');
    action.click();
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]')?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/llm/draft');
    expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(request.body)).toEqual({ page_id: 'UI-02' });
    expect(root.dataset.familyLlmDecision).toBe('BLOCK_CONFIGURATION');
    expect(root.dataset.familyLlmTrace).toBe('trace-fixture-only');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('返回、暂停或现在先不继续');
    expect(root.querySelector('[aria-label*="AI成长诊断报告"]')).not.toBeNull();
    expect(root.textContent).not.toMatch(/DEV|stub|Gate|policy|contract/i);
  });

  it('preserves the original visual path when the Gateway cannot be reached and still supplies a text-equivalent fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope' });
    root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]')?.click();
    root.querySelector<HTMLButtonElement>('[aria-label="立即开始测评"]')?.click();
    await tick();

    expect(root.dataset.familyLlmDecision).toBe('CLIENT_FAILURE');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('返回、暂停或现在先不继续');
    expect(root.querySelector('[aria-label*="AI成长诊断报告"]')).not.toBeNull();
  });
});


describe('Family formal experience workflow entrypoints', () => {
  it('sends the remaining registered page actions only to the protected Test Experience endpoint with fixed fixtures', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, request: RequestInit) => {
      if (url.endsWith('/customer-projection')) {
        return { json: async () => ({ source: 'TEST_FIXTURE', operations: [], text_equivalent: '以下显示当前家庭的体验回执。' }) };
      }
      const body = JSON.parse(String(request.body));
      return {
        json: async () => ({
          operation_id: `operation-${body.action}`,
          status: 'CONFIRMED',
          source: 'TEST_FIXTURE',
          external_effect: false,
          text_equivalent: '已生成本次体验回执。',
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const cases = [
      ['commerce-invite', '记下邀请说明', 'CREATE_INVITE', 'CAMPAIGN_FAMILY_MOMENTS'],
      ['commerce-group', '记下共学想法', 'CREATE_GROUP', 'GROUP_PARENT_CHILD_CAMP'],
      ['publish-dynamic', '记下分享草稿', 'PUBLISH_TEMPLATE', 'POST_TEMPLATE_GROWTH_CARD'],
    ] as const;

    for (const [initialPage, label, action, fixtureRef] of cases) {
      const root = document.createElement('div');
      document.body.append(root);
      createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage });
      const button = root.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
      expect(button).not.toBeNull();
      button?.click();
      await tick();
      const call = fetchMock.mock.calls.at(-1);
      if (!call) throw new Error('experience request is required');
      const [url, request] = call;
      expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/experience/operations');
      expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
      expect(JSON.parse(String(request.body))).toMatchObject({
        page_id: action === 'CREATE_INVITE' ? 'UI-15' : action === 'CREATE_GROUP' ? 'UI-16' : 'UI-26',
        action,
        fixture_ref: fixtureRef,
        fixture_version: 'family-34-page-test-experience.v1',
      });
      expect(root.dataset.familyExperienceAction).toBe(action);
      expect(root.dataset.familyExperienceStatus).toBe('CONFIRMED');
      expect(root.dataset.familyExperienceOperation).toBe(`operation-${action}`);
      expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain(action === 'CREATE_GROUP' ? '共学想法已记下' : action === 'CREATE_INVITE' ? '邀请说明已记下' : '家庭分享草稿已记下');
      root.remove();
    }
  });

  it('records a family consultation need only through protected slot and request endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ slots: [{ availability_slot_ref: 'SLOT_PRIMARY', status: 'AVAILABLE', channel: 'VIDEO' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        booking: { booking_request_id: 'booking-fixture', status: 'REQUESTED', external_effect: false },
        service_record: { service_record_id: 'record-fixture', status: 'PENDING', external_effect: false },
      }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'consultation-booking' });
    root.querySelector<HTMLButtonElement>('[aria-label="记下咨询需求"]')?.click();
    await tick();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [slotsUrl, slotsRequest] = fetchMock.mock.calls[0];
    expect(slotsUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/services/slots?service_offering_ref=TEST_PARENT_CHILD_DIALOGUE&service_offering_version=1');
    expect(slotsRequest).toMatchObject({ method: 'GET', credentials: 'include' });
    const [url, request] = fetchMock.mock.calls[1];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/services/booking-requests');
    expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(request.body))).toEqual({ page_id: 'UI-21', service_offering_ref: 'TEST_PARENT_CHILD_DIALOGUE', service_offering_version: 1, availability_slot_ref: 'SLOT_PRIMARY', attributes: { entry: 'family_support_explanation' } });
    expect(root.dataset.familyConsultationNeedStatus).toBe('REQUESTED');
    expect(root.dataset.familyConsultationNeedRequest).toBe('booking-fixture');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('咨询需求已记下');
  });

  it('loads service records through the protected read-only booking projection', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ bookings: [], service_records: [], text_equivalent: '以下显示当前家庭已选择的咨询与活动服务记录。' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'service-mine' });
    root.querySelector<HTMLButtonElement>('[aria-label="查看我的预约和服务记录"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/services/customer-projection');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.familyServiceBookingAction).toBe('READ_SERVICE_BOOKING_PROJECTION');
    expect(root.dataset.familyServiceBookingStatus).toBe('READ_ONLY');
    expect(root.textContent).not.toMatch(/DEV|stub|Gate|policy|contract/i);
  });

  it('submits an admitted product selection only to the protected commerce intent endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        intent: { order_intent_id: 'intent-fixture', status: 'SUBMITTED', external_effect: false, text_equivalent: '已记录你的选择。不会扣款。' },
        entitlement: { entitlement_id: 'entitlement-fixture', status: 'AVAILABLE', external_effect: false },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'commerce-product' });
    root.querySelector<HTMLButtonElement>('[aria-label="立即购买"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/commerce/order-intents');
    expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(request.body))).toEqual({ page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1 });
    expect(root.dataset.familyCommerceAction).toBe('SUBMIT_ORDER_INTENT');
    expect(root.dataset.familyCommerceStatus).toBe('SUBMITTED');
    expect(root.dataset.familyCommerceOrderIntent).toBe('intent-fixture');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('不会扣款');
  });

  it('loads customer assets through a read-only protected commerce projection without leaking internal UI terms', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ entitlements: [], order_intents: [], text_equivalent: '以下显示当前家庭的商品选择与服务权益回执。' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'orders-assets' });
    root.querySelector<HTMLButtonElement>('[aria-label="查看订单与资产"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/commerce/customer-projection');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.familyCommerceAction).toBe('READ_CUSTOMER_COMMERCE_PROJECTION');
    expect(root.dataset.familyCommerceStatus).toBe('READ_ONLY');
    expect(root.textContent).not.toMatch(/DEV|stub|Gate|policy|contract/i);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestLoopApp } from './test-loop.js';

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('Family commerce and service booking slice entrypoints', () => {
  it('records a family consultation need through the protected slot and request endpoints', async () => {
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
  });

  it('reads the UI-13 family content directory from UI-01 without creating commerce state', async () => {
    const catalog = { products: [
      { product_id: 'product-a', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1, title: '亲子沟通小练习', admission_status: 'ADMITTED', source_ref: 'fixture:catalog-a', fixture_only: true, attributes_schema_version: 1 },
      { product_id: 'product-b', product_ref: 'PRODUCT_FAMILY_READING', product_version: 1, title: '家庭阅读工具', admission_status: 'ADMITTED', source_ref: 'fixture:catalog-b', fixture_only: true, attributes_schema_version: 1 },
    ] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => catalog })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ intent: { order_intent_id: 'interest-fixture', status: 'SUBMITTED', external_effect: false, text_equivalent: '已记录你的了解意向。' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ operation_id: 'group-draft-fixture', status: 'CREATED', external_effect: false, text_equivalent: '已记下共学想法。' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ operation_id: 'invitation-draft-fixture', status: 'CREATED', external_effect: false, text_equivalent: '已记下邀请说明。' }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', commerceCatalogApiMode: 'synthetic-api', initialPage: 'home' });
    root.querySelector<HTMLButtonElement>('[data-ui01-feature="recommended_card_1"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/commerce/products');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.familyCommerceCatalogStatus).toBe('READY');
    const directory = root.querySelector('[data-ui13-catalog-state="READY"]');
    expect(directory?.textContent).toContain('从这些内容慢慢了解');
    expect(directory?.textContent).toContain('亲子沟通小练习');
    expect(directory?.textContent).not.toMatch(/DEV|SYNTHETIC|价格|销量|购买|支付|订单|权益|分享|下载|发布/);
    expect(root.querySelector('.by-assistive-status')?.textContent).toContain('内容目录已准备好');

    root.querySelector<HTMLButtonElement>('[data-by="ui13-open-catalog-item"]')?.click();
    expect(root.querySelector('[aria-label^="商品详情：21天亲子沟通挑战营"]')).not.toBeNull();
    const detail = root.querySelector('[data-ui14-detail-state="READY"]');
    expect(detail?.getAttribute('data-ui14-product-ref')).toBe('PRODUCT_PARENT_CHILD_CAMP');
    expect(detail?.textContent).toContain('亲子沟通小练习');
    expect(detail?.textContent).not.toMatch(/价格|销量|购买|支付|订单|权益|DEV|SYNTHETIC|contract/i);

    root.querySelector<HTMLButtonElement>('[data-by="ui14-save-interest"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [interestUrl, interestRequest] = fetchMock.mock.calls[1];
    expect(interestUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/commerce/order-intents');
    expect(interestRequest).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(interestRequest.body))).toEqual({ page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1 });
    expect(root.querySelector('[data-ui14-detail-state="SAVED"]')?.textContent).toContain('你的了解意向已记下');
    expect(root.dataset.familyCommerceStatus).toBe('SUBMITTED');

    root.querySelector<HTMLButtonElement>('[data-by="ui14-open-group-draft"]')?.click();
    const groupDraft = root.querySelector('[data-ui16-group-draft-state="READY"]');
    expect(groupDraft?.getAttribute('data-ui16-product-ref')).toBe('PRODUCT_PARENT_CHILD_CAMP');
    expect(groupDraft?.textContent).toContain('亲子沟通小练习');
    expect(groupDraft?.textContent).not.toMatch(/成员|价格|优惠|订单|支付|库存|DEV|SYNTHETIC|contract/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui16-save-study-group-draft"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [groupUrl, groupRequest] = fetchMock.mock.calls[2];
    expect(groupUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/experience/operations');
    expect(groupRequest).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(groupRequest.body))).toMatchObject({ page_id: 'UI-16', action: 'CREATE_GROUP' });
    expect(root.querySelector('[data-ui16-group-draft-state="SAVED"]')?.textContent).toContain('共学想法已记下');
    expect(root.dataset.familyExperienceStatus).toBe('CREATED');
    expect(root.dataset.familyExperienceAction).toBe('CREATE_GROUP');

    root.querySelector<HTMLButtonElement>('[data-by="ui16-return-content-detail"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-by="ui14-open-invitation-draft"]')?.click();
    const invitationDraft = root.querySelector('[data-ui15-invitation-draft-state="READY"]');
    expect(invitationDraft?.getAttribute('data-ui15-product-ref')).toBe('PRODUCT_PARENT_CHILD_CAMP');
    expect(invitationDraft?.textContent).toContain('亲子沟通小练习');
    expect(invitationDraft?.textContent).not.toMatch(/联系人|邀请码|二维码|奖励|价格|优惠|订单|支付|外发|通知|分享|DEV|SYNTHETIC|contract/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui15-save-invitation-draft"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [inviteUrl, inviteRequest] = fetchMock.mock.calls[3];
    expect(inviteUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/experience/operations');
    expect(inviteRequest).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(inviteRequest.body))).toMatchObject({ page_id: 'UI-15', action: 'CREATE_INVITE' });
    expect(root.querySelector('[data-ui15-invitation-draft-state="SAVED"]')?.textContent).toContain('邀请说明已记下');
    expect(root.dataset.familyExperienceStatus).toBe('CREATED');
    expect(root.dataset.familyExperienceAction).toBe('CREATE_INVITE');
    app.navigate('commerce-mall');
  });

  it('submits an admitted product selection and reads customer assets only through protected commerce endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({
          intent: { order_intent_id: 'intent-fixture', status: 'SUBMITTED', external_effect: false, text_equivalent: '已记录你的选择。不会扣款。' },
          entitlement: { entitlement_id: 'entitlement-fixture', status: 'AVAILABLE', external_effect: false },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ entitlements: [], order_intents: [], text_equivalent: '以下显示当前家庭的商品选择与服务权益回执。' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'commerce-product' });
    root.querySelector<HTMLButtonElement>('[aria-label="立即购买"]')?.click();
    await tick();
    const [intentUrl, intentRequest] = fetchMock.mock.calls[0];
    expect(intentUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/commerce/order-intents');
    expect(intentRequest).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(intentRequest.body))).toEqual({ page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1 });
    expect(root.dataset.familyCommerceAction).toBe('SUBMIT_ORDER_INTENT');
    expect(root.dataset.familyCommerceStatus).toBe('SUBMITTED');

    app.navigate('orders-assets');
    root.querySelector<HTMLButtonElement>('[aria-label="查看订单与资产"]')?.click();
    await tick();
    const [projectionUrl, projectionRequest] = fetchMock.mock.calls[1];
    expect(projectionUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/commerce/customer-projection');
    expect(projectionRequest).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.familyCommerceAction).toBe('READ_CUSTOMER_COMMERCE_PROJECTION');
    expect(root.dataset.familyCommerceStatus).toBe('READ_ONLY');
    expect(root.textContent).not.toMatch(/DEV|stub|Gate|policy|contract/i);
  });

  it('reads a family-private UI-18 service scope without renewing, refunding, granting, or consuming benefits', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        subscriptions: [{ membership_subscription_id: 'subscription-fixture', subscription_ref: 'membership-fixture', plan_ref: 'PLAN_FAMILY_GROWTH', plan_version: 1, status: 'ACTIVE', row_version: 1 }],
        benefits: [
          { benefit_grant_id: 'benefit-consult', benefit_ref: 'BENEFIT_CONSULT', status: 'AVAILABLE', allocated_units: 2, remaining_units: 2, row_version: 1 },
          { benefit_grant_id: 'benefit-content', benefit_ref: 'BENEFIT_CONTENT', status: 'AVAILABLE', allocated_units: 1, remaining_units: 1, row_version: 1 },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', membershipProjectionApiMode: 'synthetic-api', initialPage: 'commerce-mine' });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/membership/customer-projection');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.familyMembershipProjectionStatus).toBe('READY');
    const scope = root.querySelector('[data-ui18-service-scope-state="READY"]');
    expect(scope?.textContent).toContain('家庭交流支持');
    expect(scope?.textContent).toContain('成长内容支持');
    expect(scope?.textContent).not.toMatch(/等级|积分|额度|到期|续费|退款|支付|订单|DEV|SYNTHETIC|contract/i);
    expect(root.querySelector('.by-assistive-status')?.textContent).toContain('家庭服务说明已准备好');

    root.querySelector<HTMLButtonElement>('[data-by="ui18-open-growth-plan"]')?.click();
    expect(root.querySelector('[aria-label^="90天成长方案"]')).not.toBeNull();
    app.navigate('commerce-mine');
    root.querySelector<HTMLButtonElement>('[data-by="ui18-open-growth-profile"]')?.click();
    expect(root.querySelector('[aria-label^="我的会员中心"]')).not.toBeNull();
  });

  it('reads the same family-private service scope on UI-30 and routes only to my services or the growth plan', async () => {
    const membershipProjection = {
      subscriptions: [{ membership_subscription_id: 'subscription-fixture', subscription_ref: 'membership-fixture', plan_ref: 'PLAN_FAMILY_GROWTH', plan_version: 1, status: 'ACTIVE', row_version: 1 }],
      benefits: [
        { benefit_grant_id: 'benefit-consult', benefit_ref: 'BENEFIT_CONSULT', status: 'AVAILABLE', allocated_units: 1, remaining_units: 1, row_version: 1 },
        { benefit_grant_id: 'benefit-content', benefit_ref: 'BENEFIT_CONTENT', status: 'AVAILABLE', allocated_units: 1, remaining_units: 1, row_version: 1 },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => membershipProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', membershipProjectionApiMode: 'synthetic-api', initialPage: 'annual-member-mine' });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/membership/customer-projection');
    expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
    const overview = root.querySelector('[data-ui30-service-overview-state="READY"]');
    expect(overview?.textContent).toContain('家庭交流支持');
    expect(overview?.textContent).toContain('成长内容支持');
    expect(overview?.textContent).not.toMatch(/支付|订单|DEV|SYNTHETIC|contract/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui30-open-my-services"]')?.click();
    await tick();
    expect(root.querySelector('[aria-label^="我的服务"]')).not.toBeNull();
    app.navigate('annual-member-mine');
    root.querySelector<HTMLButtonElement>('[data-by="ui30-open-growth-plan"]')?.click();
    await tick();
    expect(root.querySelector('[aria-label^="90天成长方案"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps UI-30 as a non-commercial empty read view when the family has no readable services', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subscriptions: [], benefits: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', membershipProjectionApiMode: 'synthetic-api', initialPage: 'annual-member-mine' });
    await tick(); await tick();
    const overview = root.querySelector('[data-ui30-service-overview-state="EMPTY"]');
    expect(overview?.textContent).toContain('先从家庭成长计划开始');
    expect(overview?.textContent).not.toMatch(/支付|订单|DEV|SYNTHETIC|contract/i);
    expect(fetchMock.mock.calls.every(([, request]) => !request || String((request as RequestInit).method || 'GET') === 'GET')).toBe(true);
  });

  it('runs the UI-30 Dev points, invitation, and renewal-interest journey without payment or external effects', async () => {
    const membershipProjection = {
      subscriptions: [{ membership_subscription_id: 'subscription-fixture', subscription_ref: 'membership-fixture', plan_ref: 'PLAN_FAMILY_GROWTH', plan_version: 1, status: 'ACTIVE', row_version: 1 }],
      benefits: [{ benefit_grant_id: 'benefit-consult', benefit_ref: 'BENEFIT_CONSULT', status: 'AVAILABLE', allocated_units: 1, remaining_units: 1, row_version: 1 }],
      dev_points: { balance: 1280, source: 'DEV_FIXTURE', redeemable: false },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => membershipProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ operation_id: 'renewal-fixture', page_id: 'UI-30', action: 'CREATE_RENEWAL_INTEREST', status: 'CONFIRMED', external_effect: false }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', membershipProjectionApiMode: 'synthetic-api', initialPage: 'annual-member-mine' });
    await tick(); await tick();

    root.querySelector<HTMLButtonElement>('[data-by="ui30-open-points"]')?.click();
    await tick(); await tick();
    expect(root.querySelector('[data-ui30-points-state="READY"]')?.textContent).toContain('1280');
    expect(root.textContent).not.toMatch(/DEV|SYNTHETIC|contract/i);
    app.navigate('annual-member-mine');
    root.querySelector<HTMLButtonElement>('[data-by="ui30-open-invite"]')?.click();
    expect(root.querySelector('[aria-label^="邀请有礼"]')).not.toBeNull();
    app.navigate('annual-member-mine');
    root.querySelector<HTMLButtonElement>('[data-by="ui30-create-renewal-interest"]')?.click();
    await tick(); await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [renewalUrl, renewalRequest] = fetchMock.mock.calls[1];
    expect(renewalUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/experience/operations');
    expect(renewalRequest).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(renewalRequest.body))).toMatchObject({ page_id: 'UI-30', action: 'CREATE_RENEWAL_INTEREST', fixture_ref: 'RENEWAL_INTENT_FAMILY_GROWTH' });
    expect(root.querySelector('[data-ui30-service-overview-state="READY"]')?.textContent).toContain('续费了解意向已记下');
  });

  it('reads UI-31 family plan progress and routes to growth plan, daily action, or support records without writes', async () => {
    const coreProjection = {
      family_id: 'family-test-scope',
      data_source: 'SYNTHETIC_DEV_ONLY',
      cards: [
        { surface: 'UI-05', plan_preview: { state: 'DRAFT', headline: '和孩子一起选一件小事', next_action: '今天可以先试试一次完整倾听。', stages: [{ label: '今天可以先试试', weeks: '第 1-3 周' }] } },
        { surface: 'UI-06', companion_progress: { state: 'ACTION_RECORDED', confirmation: '今天的家庭行动已记录。' } },
      ],
      recent_flow_events: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => coreProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', coreGrowthApiMode: 'synthetic-api', initialPage: 'my-services' });
    await tick(); await tick();
    const panel = root.querySelector('[data-ui31-services-state="READY"]');
    expect(panel?.textContent).toContain('今天已经留下一次家庭行动');
    expect(root.textContent).not.toMatch(/DEV|SYNTHETIC|Model Gateway|回执|审计|诊断|排名|总分/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui31-open-growth-plan"]')?.click();
    expect(root.querySelector('[aria-label^="90天成长方案"]')).not.toBeNull();
    app.navigate('my-services');
    root.querySelector<HTMLButtonElement>('[data-by="ui31-open-daily-action"]')?.click();
    expect(root.querySelector('[aria-label^="今日成长任务"]')).not.toBeNull();
    app.navigate('my-services');
    root.querySelector<HTMLButtonElement>('[data-by="ui31-open-support-records"]')?.click();
    expect(root.querySelector('[aria-label^="我的咨询和活动"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([, request]) => !request || String((request as RequestInit).method || 'GET') === 'GET')).toBe(true);
  });

  it('reads UI-32 family orders and assets and keeps all follow-up routes read-only', async () => {
    const membershipProjection = {
      subscriptions: [{ membership_subscription_id: 'subscription-fixture', status: 'ACTIVE' }],
      benefits: [{ benefit_grant_id: 'benefit-consult', benefit_ref: 'BENEFIT_CONSULT', status: 'AVAILABLE' }],
      dev_points: { balance: 1280, source: 'DEV_FIXTURE', redeemable: false },
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => membershipProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', membershipProjectionApiMode: 'synthetic-api', initialPage: 'orders-assets' });
    await tick(); await tick();
    const panel = root.querySelector('[data-ui32-assets-state="READY"]');
    expect(panel?.textContent).toContain('家庭已有 1 项服务记录可回看');
    expect(panel?.textContent).toContain('家庭积分回看：1280');
    expect(root.textContent).not.toMatch(/支付|退款|提现|兑换|下载|分享|DEV|SYNTHETIC|Model Gateway|回执|审计/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui32-open-my-services"]')?.click();
    expect(root.querySelector('[aria-label^="我的服务"]')).not.toBeNull();
    app.navigate('orders-assets');
    root.querySelector<HTMLButtonElement>('[data-by="ui32-open-annual-member"]')?.click();
    expect(root.querySelector('[aria-label^="我的年度会员服务"]')).not.toBeNull();
    app.navigate('orders-assets');
    root.querySelector<HTMLButtonElement>('[data-by="ui32-open-growth-plan"]')?.click();
    expect(root.querySelector('[aria-label^="90天成长方案"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([, request]) => !request || String((request as RequestInit).method || 'GET') === 'GET')).toBe(true);
  });

  it('moves from UI-18 family service scope to the UI-19 topic directory through read-only family-scoped projections', async () => {
    const membershipProjection = {
      subscriptions: [{ membership_subscription_id: 'subscription-fixture', subscription_ref: 'membership-fixture', plan_ref: 'PLAN_FAMILY_GROWTH', plan_version: 1, status: 'ACTIVE', row_version: 1 }],
      benefits: [{ benefit_grant_id: 'benefit-consult', benefit_ref: 'BENEFIT_CONSULT', status: 'AVAILABLE', allocated_units: 1, remaining_units: 1, row_version: 1 }],
    };
    const supplyProjection = {
      tenant_id: 'tenant-test', family_id: 'family-test-scope', source_page_id: 'UI-19', projection_version: 1, as_of: '2026-08-19T00:00:00.000Z', source_refs: ['fixture:ui19'], policy_version: 'test', visibility: 'FAMILY_SCOPED_ADMITTED_SUPPLY', expires_at: null, external_effect: false,
      filters: { provider_kind: 'TEACHER', service_type: null, age_band: null, available_only: true },
      offerings: [{ service_offering_id: 'offering-fixture', service_offering_ref: 'OFFERING_FAMILY_DIALOGUE', version_no: 1, title: '亲子沟通支持', provider_ref: 'provider-fixture', provider_display_name: '不应显示的提供者姓名', provider_kind: 'TEACHER', qualification_status: 'ACTIVE', admission_status: 'ADMITTED', offering_status: 'ACTIVE', service_type: '亲子沟通', age_band: '6-12岁', next_available_at: '2026-08-21T09:00:00.000Z', next_available_channel: 'VIDEO', availability_status: 'AVAILABLE', fixture_only: true, attributes_schema_version: 1 }],
      live_session: { session_ref: 'EXPERT_LIVE_SESSION_FAMILY_GUIDANCE', title: '家庭沟通主题直播', topic: '在日常互动里先听见彼此', starts_at: '2026-08-20T12:00:00.000Z', status: 'SCHEDULED', host_display_name: '家庭成长顾问', fixture_only: true, external_effect: false },
      text_equivalent: 'internal supply text should not be rendered',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => membershipProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => supplyProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', membershipProjectionApiMode: 'synthetic-api', initialPage: 'commerce-mine' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui18-open-support-topics"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/membership/customer-projection');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/families/family-test-scope/orchestration/test-loop/services/offerings?page_id=UI-19&available_only=true');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.ui19SupplyStatus).toBe('READ_ONLY_READY');
    expect(root.dataset.ui19SupplyExternalEffect).toBe('false');
    const directory = root.querySelector('[aria-label="家庭支持主题列表"]');
    expect(directory?.textContent).toContain('亲子沟通支持');
    expect(directory?.textContent).toContain('支持主题：亲子沟通');
    expect(directory?.textContent).not.toMatch(/推荐|排名|准入|资格|提供者姓名|预约|联系|支付|DEV|SYNTHETIC|contract/i);
    expect(root.querySelector('.by-assistive-status')?.textContent).toContain('家庭支持主题已准备好');
  });
});


describe('UI-21 authenticated consultation need draft', () => {
  it('uses the account bearer without an inherited cookie for the slot read and no-op consultation request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ slots: [{ availability_slot_ref: 'SLOT_AUTH', status: 'AVAILABLE', channel: 'VIDEO' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        booking: { booking_request_id: 'booking-auth-fixture', status: 'REQUESTED', external_effect: false },
        service_record: { service_record_id: 'record-auth-fixture', status: 'PENDING', external_effect: false },
      }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-consultation-auth-scope',
      authToken: 'family-consultation-auth-bearer',
      initialPage: 'consultation-booking',
    });
    root.querySelector<HTMLButtonElement>('[aria-label="记下咨询需求"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [slotsUrl, slotsRequest] = fetchMock.mock.calls[0];
    expect(slotsUrl).toBe('http://family-api.test/families/family-consultation-auth-scope/orchestration/test-loop/services/slots?service_offering_ref=TEST_PARENT_CHILD_DIALOGUE&service_offering_version=1');
    expect(slotsRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((slotsRequest.headers as Record<string, string>).authorization).toBe('Bearer family-consultation-auth-bearer');

    const [requestUrl, request] = fetchMock.mock.calls[1];
    expect(requestUrl).toBe('http://family-api.test/families/family-consultation-auth-scope/orchestration/test-loop/services/booking-requests');
    expect(request).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-consultation-auth-bearer');
    expect((request.headers as Record<string, string>)['idempotency-key']).toBeTruthy();
    expect(JSON.parse(String(request.body))).toMatchObject({ page_id: 'UI-21', availability_slot_ref: 'SLOT_AUTH' });
    expect(root.dataset.familyConsultationNeedStatus).toBe('REQUESTED');
    expect(root.textContent).not.toMatch(/预约已确认|真人已联系|外部通知已发送|支付成功/);
  });
});

import { createTestLoopApp } from './test-loop.js';

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('UI-15 to UI-16 authenticated shared-learning draft', () => {
  it('uses the account bearer without an inherited cookie and records only a no-op family-private group idea', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [{
            product_id: 'product-camp', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1,
            title: '亲子沟通小练习', admission_status: 'ADMITTED', source_ref: 'fixture:catalog',
            fixture_only: true, attributes_schema_version: 1,
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          operation_id: 'group-auth-fixture',
          page_id: 'UI-16',
          action: 'CREATE_GROUP',
          operation_kind: 'COMMERCE_GROUP',
          fixture_ref: 'GROUP_PARENT_CHILD_CAMP',
          fixture_version: 'family-34-page-test-experience.v1',
          status: 'CONFIRMED',
          environment: 'DEV',
          source: 'TEST_FIXTURE',
          external_effect: false,
          text_equivalent: '已生成拼团回执。本次不会扣款、占用库存、通知他人或生成外部订单。',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-auth-scope',
      authToken: 'family-auth-bearer',
      commerceCatalogApiMode: 'synthetic-api',
      initialPage: 'commerce-mall',
    });

    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui13-open-catalog-item"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-by="ui14-open-group-draft"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-by="ui16-save-study-group-draft"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [catalogUrl, catalogRequest] = fetchMock.mock.calls[0];
    expect(catalogUrl).toBe('http://family-api.test/families/family-auth-scope/orchestration/test-loop/commerce/products');
    expect(catalogRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((catalogRequest.headers as Record<string, string>).authorization).toBe('Bearer family-auth-bearer');

    const [url, request] = fetchMock.mock.calls[1];
    expect(url).toBe('http://family-api.test/families/family-auth-scope/orchestration/test-loop/experience/operations');
    expect(request).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-auth-bearer');
    expect(JSON.parse(String(request.body))).toMatchObject({
      page_id: 'UI-16',
      action: 'CREATE_GROUP',
      fixture_ref: 'GROUP_PARENT_CHILD_CAMP',
      fixture_version: 'family-34-page-test-experience.v1',
    });
    expect(root.dataset.familyExperienceStatus).toBe('CONFIRMED');
    expect(root.textContent).toContain('共学想法已记下。');
    expect(root.textContent).toContain('现在不会发起拼团、扣款或通知他人');
    expect(root.textContent).not.toMatch(/支付成功|外部订单已生成|库存已占用/);
  });
});

describe('UI-30 authenticated annual companion readback', () => {
  it('reads family-private points with the account bearer and records a renewal interest without payment or notification', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscriptions: [],
          benefits: [],
          dev_points: { balance: 320, redeemable: false },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          operation_id: 'renewal-auth-fixture',
          page_id: 'UI-30',
          action: 'CREATE_RENEWAL_INTEREST',
          operation_kind: 'MEMBERSHIP_RENEWAL_DRAFT',
          fixture_ref: 'RENEWAL_INTENT_FAMILY_GROWTH',
          fixture_version: 'family-34-page-test-experience.v1',
          status: 'CONFIRMED',
          environment: 'DEV',
          source: 'TEST_FIXTURE',
          external_effect: false,
          text_equivalent: '已记下续费了解意向。本次不会扣款、续费、通知他人或改变权益。',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-membership-auth-scope',
      authToken: 'family-membership-auth-bearer',
      membershipProjectionApiMode: 'synthetic-api',
      initialPage: 'annual-member-mine',
    });

    await tick(); await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [projectionUrl, projectionRequest] = fetchMock.mock.calls[0];
    expect(projectionUrl).toBe('http://family-api.test/families/family-membership-auth-scope/orchestration/test-loop/membership/customer-projection');
    expect(projectionRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((projectionRequest.headers as Record<string, string>).authorization).toBe('Bearer family-membership-auth-bearer');
    expect(root.querySelector('[data-ui30-service-overview-state="EMPTY"]')?.textContent).toContain('家庭过程积分：320');
    expect(root.querySelector<HTMLButtonElement>('[data-by="ui30-open-invite"]')).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>('[data-by="ui30-create-renewal-interest"]')).not.toBeNull();

    root.querySelector<HTMLButtonElement>('[data-by="ui30-create-renewal-interest"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [operationUrl, operationRequest] = fetchMock.mock.calls[1];
    expect(operationUrl).toBe('http://family-api.test/families/family-membership-auth-scope/orchestration/test-loop/experience/operations');
    expect(operationRequest).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((operationRequest.headers as Record<string, string>).authorization).toBe('Bearer family-membership-auth-bearer');
    expect(JSON.parse(String(operationRequest.body))).toMatchObject({
      page_id: 'UI-30',
      action: 'CREATE_RENEWAL_INTEREST',
      fixture_ref: 'RENEWAL_INTENT_FAMILY_GROWTH',
      fixture_version: 'family-34-page-test-experience.v1',
    });
    expect(root.dataset.familyExperienceStatus).toBe('CONFIRMED');
    expect(root.textContent).toContain('续费了解意向已记下。之后是否继续，由家庭自己决定。');
    expect(root.textContent).not.toMatch(/支付成功|已扣款|续费已生效|外部通知已发送/);
  });
});

describe('UI-17 to UI-18 authenticated family-private platform projections', () => {
  it('reads the family self-record and records a generic choice with the account bearer only', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          family_id: 'family-platform-auth-scope',
          data_source: 'SYNTHETIC_DEV_ONLY',
          external_effect_adapter: 'NOOP_NOT_INVOKED',
          cards: [{
            surface: 'UI-18',
            state: 'READY',
            title: '家庭服务说明',
            loop: 'CUSTOMER_BACKEND_LOOP',
            business_capability: 'family_service_scope',
            primary_objects: ['Family'],
            command: { name: 'RECORD_SERVICE_SCOPE_INTEREST' },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          event_state: 'DEV_CONFIRMED',
          external_effect: false,
          data_source: 'SYNTHETIC_DEV_ONLY',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-platform-auth-scope',
      authToken: 'family-platform-auth-bearer',
      platformSurfacesApiMode: 'synthetic-api',
      initialPage: 'commerce-mine',
    });

    await tick(); await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [projectionUrl, projectionRequest] = fetchMock.mock.calls[0];
    expect(projectionUrl).toBe('http://family-api.test/families/family-platform-auth-scope/dev/platform-surfaces');
    expect(projectionRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((projectionRequest.headers as Record<string, string>).authorization).toBe('Bearer family-platform-auth-bearer');
    expect(root.querySelector('[data-platform-surface="UI-18"]')?.textContent).toContain('我的服务');

    root.querySelector<HTMLButtonElement>('[data-by="platform-surface-noop"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [eventUrl, eventRequest] = fetchMock.mock.calls[1];
    expect(eventUrl).toBe('http://family-api.test/families/family-platform-auth-scope/dev/flow-events');
    expect(eventRequest).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((eventRequest.headers as Record<string, string>).authorization).toBe('Bearer family-platform-auth-bearer');
    expect(JSON.parse(String(eventRequest.body))).toMatchObject({ ui_id: 'UI-18', command: 'RECORD_SERVICE_SCOPE_INTEREST' });
    expect(root.dataset.familyPlatformSurfaceNoop).toBe('DEV_CONFIRMED');
    expect(root.textContent).toContain('本次选择已记录。');
    expect(root.textContent).not.toMatch(/支付成功|订单已生成|预约已确认|外部通知已发送/);
  });
});


describe('UI-23 authenticated activity interest draft', () => {
  it('records only a bearer-authenticated no-op activity interest from the activity detail confirmation entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        operation_id: 'activity-interest-auth-fixture',
        page_id: 'UI-23',
        action: 'CREATE_EVENT',
        operation_kind: 'EVENT_REGISTRATION',
        fixture_ref: 'EVENT_PARENT_CHILD_SALON_2025_05_25',
        fixture_version: 'family-34-page-test-experience.v1',
        status: 'CONFIRMED',
        environment: 'DEV',
        source: 'TEST_FIXTURE',
        external_effect: false,
        text_equivalent: '已记下活动了解意向。本次不会收费、保留外部席位或发送活动通知。',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-activity-auth-scope',
      authToken: 'family-activity-auth-bearer',
      initialPage: 'activity-detail',
    });
    root.querySelector<HTMLButtonElement>('[aria-label="记下活动想法"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-activity-auth-scope/orchestration/test-loop/experience/operations');
    expect(request).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-activity-auth-bearer');
    expect(JSON.parse(String(request.body))).toMatchObject({
      page_id: 'UI-23',
      action: 'CREATE_EVENT',
      fixture_ref: 'EVENT_PARENT_CHILD_SALON_2025_05_25',
      fixture_version: 'family-34-page-test-experience.v1',
    });
    expect(root.dataset.familyExperienceStatus).toBe('CONFIRMED');
    expect(root.textContent).not.toMatch(/报名已确认|已占位|支付成功|活动通知已发送/);
  });
});


describe('UI-25 to UI-26 authenticated private sharing draft', () => {
  it('reads the family exchange feed and records a bearer-only private draft without public publication or notification', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          family_id: 'family-sharing-auth-scope',
          data_source: 'SYNTHETIC_DEV_ONLY',
          external_effect_adapter: 'NOOP_NOT_INVOKED',
          cards: [{
            surface: 'UI-25',
            state: 'READY',
            title: '家庭成长交流',
            loop: 'COMMUNITY_CONTENT_LOOP',
            business_capability: 'family_learning_exchange_feed',
            primary_objects: ['Family'],
            command: { name: 'READ_PRIVATE_EXCHANGE_FEED' },
            family_learning_exchange_feed: {
              state: 'READY',
              headline: '慢慢读一读家庭经验',
              introduction: '这些内容只供家庭参考。',
              entries: [{ exchange_ref: 'EXCHANGE_DIALOGUE', title: '给一次对话留一点停顿', summary: '先听一听。', topic: '亲子沟通' }],
            },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          operation_id: 'sharing-auth-fixture',
          page_id: 'UI-26',
          action: 'PUBLISH_TEMPLATE',
          operation_kind: 'COMMUNITY_TEMPLATE_PUBLICATION',
          fixture_ref: 'POST_TEMPLATE_GROWTH_CARD',
          fixture_version: 'family-34-page-test-experience.v1',
          status: 'CONFIRMED',
          environment: 'DEV',
          source: 'TEST_FIXTURE',
          external_effect: false,
          text_equivalent: '已记录发布回执。本次不会向任何家庭、社区或外部服务发布内容。',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-sharing-auth-scope',
      authToken: 'family-sharing-auth-bearer',
      platformSurfacesApiMode: 'synthetic-api',
      initialPage: 'parent-community',
    });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [projectionUrl, projectionRequest] = fetchMock.mock.calls[0];
    expect(projectionUrl).toBe('http://family-api.test/families/family-sharing-auth-scope/dev/platform-surfaces');
    expect(projectionRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((projectionRequest.headers as Record<string, string>).authorization).toBe('Bearer family-sharing-auth-bearer');
    root.querySelector<HTMLButtonElement>('[data-by="ui25-open-sharing-draft"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-by="ui26-save-sharing-draft"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [operationUrl, operationRequest] = fetchMock.mock.calls[1];
    expect(operationUrl).toBe('http://family-api.test/families/family-sharing-auth-scope/orchestration/test-loop/experience/operations');
    expect(operationRequest).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((operationRequest.headers as Record<string, string>).authorization).toBe('Bearer family-sharing-auth-bearer');
    expect(JSON.parse(String(operationRequest.body))).toMatchObject({
      page_id: 'UI-26', action: 'PUBLISH_TEMPLATE', fixture_ref: 'POST_TEMPLATE_GROWTH_CARD', fixture_version: 'family-34-page-test-experience.v1',
    });
    expect(root.querySelector('[data-ui26-sharing-draft-state="SAVED"]')?.textContent).toContain('家庭想法已记下');
    expect(root.textContent).not.toMatch(/已公开发布|评论已开启|外部通知已发送|支付成功/);
  });
});


describe('UI-28 authenticated private expression readback', () => {
  it('restores a persisted UI-26 private draft from family-scoped bearer projections without treating it as public content or an outcome', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ family_id: 'family-expression-auth-scope', data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED', cards: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          environment: 'DEV', source: 'TEST_FIXTURE',
          operations: [{
            operation_id: 'private-draft-readback',
            operation_kind: 'COMMUNITY_TEMPLATE_PUBLICATION',
            fixture_ref: 'POST_TEMPLATE_GROWTH_CARD',
            status: 'CONFIRMED',
          }],
          text_equivalent: '家庭的体验回执只供回看。',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-expression-auth-scope',
      authToken: 'family-expression-auth-bearer',
      platformSurfacesApiMode: 'synthetic-api',
      initialPage: 'my-community',
    });
    await tick(); await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [platformUrl, platformRequest] = fetchMock.mock.calls[0];
    expect(platformUrl).toBe('http://family-api.test/families/family-expression-auth-scope/dev/platform-surfaces');
    expect(platformRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((platformRequest.headers as Record<string, string>).authorization).toBe('Bearer family-expression-auth-bearer');
    const [readbackUrl, readbackRequest] = fetchMock.mock.calls[1];
    expect(readbackUrl).toBe('http://family-api.test/families/family-expression-auth-scope/orchestration/test-loop/experience/customer-projection');
    expect(readbackRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((readbackRequest.headers as Record<string, string>).authorization).toBe('Bearer family-expression-auth-bearer');
    expect(root.querySelector('[data-ui28-expression-notes-state="SAVED"]')?.textContent).toContain('只留给家庭');
    expect(root.textContent).not.toMatch(/公开发布|成长结果|效果已证实|外部通知已发送/);
  });
});


describe('UI-32 authenticated family assets readback', () => {
  it('reads family-private subscriptions, benefits and process points with the account bearer only and exposes no payment or entitlement mutation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        subscriptions: [{ subscription_id: 'subscription-private', status: 'ACTIVE', external_effect: false }],
        benefits: [{ benefit_id: 'benefit-private', status: 'AVAILABLE', external_effect: false }],
        dev_points: { balance: 640, redeemable: false },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId: 'family-assets-auth-scope',
      authToken: 'family-assets-auth-bearer',
      membershipProjectionApiMode: 'synthetic-api',
      initialPage: 'orders-assets',
    });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [projectionUrl, projectionRequest] = fetchMock.mock.calls[0];
    expect(projectionUrl).toBe('http://family-api.test/families/family-assets-auth-scope/orchestration/test-loop/membership/customer-projection');
    expect(projectionRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((projectionRequest.headers as Record<string, string>).authorization).toBe('Bearer family-assets-auth-bearer');
    const panel = root.querySelector('[data-ui32-assets-state="READY"]');
    expect(panel?.textContent).toContain('家庭已有 1 项服务记录可回看');
    expect(panel?.textContent).toContain('当前有 1 项家庭支持权益说明');
    expect(panel?.textContent).toContain('家庭积分回看：640');
    expect(root.textContent).toContain('不会在这里改变订单、权益或积分');
    expect(root.textContent).not.toMatch(/支付成功|订单已确认|权益已生效|积分已扣除|外部通知已发送/);
  });
});


describe('UI-33 to UI-34 authenticated family-private records', () => {
  it('reads the family profile with the account bearer only and preserves the non-diagnostic boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        family_id: 'family-profile-auth-scope', data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED',
        cards: [{ surface: 'UI-33', state: 'READY', title: '家庭档案', summary: '仅回看家庭留存资料。', loop: 'PROFILE_RECORDS_LOOP', business_capability: 'family_profile', primary_objects: ['Family'], command: { name: 'READ_FAMILY_PROFILE' } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-profile-auth-scope', authToken: 'family-profile-auth-bearer', platformSurfacesApiMode: 'synthetic-api', initialPage: 'family-profile' });
    await tick(); await tick();

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-profile-auth-scope/dev/platform-surfaces');
    expect(request).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-profile-auth-bearer');
    expect(root.querySelector('[data-ui33-profile-state="READY"]')?.textContent).toContain('成员资料、关注方向和成长记录彼此分开');
    expect(root.textContent).not.toMatch(/修改资料|隐私已变更|诊断已生成|排名|总分/);
  });

  it('reads family service records with the account bearer only without changing bookings or service status', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          family_id: 'family-records-auth-scope', visibility: 'FAMILY_PRIVATE',
          bookings: [{ booking_request_id: 'booking-private', service_offering_ref: 'TEST_PARENT_CHILD_DIALOGUE', status: 'REQUESTED' }],
          service_records: [{ service_record_id: 'record-private', record_kind: 'EVENT_REGISTRATION_INTEREST', status: 'RECORDED', visibility: 'FAMILY_PRIVATE', external_effect: false }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ family_id: 'family-records-auth-scope', service_records: [] }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-records-auth-scope', authToken: 'family-records-auth-bearer', serviceRecordsApiMode: 'synthetic-api', initialPage: 'service-records' });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-records-auth-scope/orchestration/test-loop/services/customer-projection');
    expect(request).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-records-auth-bearer');
    const [pageObjectsUrl, pageObjectsRequest] = fetchMock.mock.calls[1];
    expect(pageObjectsUrl).toBe('http://family-api.test/families/family-records-auth-scope/orchestration/test-loop/page-objects');
    expect(pageObjectsRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((pageObjectsRequest.headers as Record<string, string>).authorization).toBe('Bearer family-records-auth-bearer');
    expect(root.querySelector('[data-ui34-records-state="READY"]')?.textContent).toContain('家庭支持过程记录可回看');
    expect(root.textContent).not.toMatch(/预约已确认|服务已完成|状态已变更|外部通知已发送/);
  });
});


describe('authenticated controlled explanation gateway', () => {
  it('uses the account bearer without an inherited cookie for the UI-02 fallback explanation and only accepts a no-op text equivalent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        decision: 'NO_ACTION',
        text_equivalent: '可以先从一件轻松的小行动开始。',
        audit: { trace_id: 'explanation-noop-trace', model_gateway_status: 'NOOP_NOT_INVOKED' },
        external_effect: false,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-explanation-auth-scope', authToken: 'family-explanation-auth-bearer', initialPage: 'growth-assessment' });
    root.querySelector<HTMLButtonElement>('[data-by="ui02-start-assessment"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-explanation-auth-scope/orchestration/test-loop/llm/draft');
    expect(request).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-explanation-auth-bearer');
    expect(JSON.parse(String(request.body))).toEqual({ page_id: 'UI-02' });
    expect(root.textContent).not.toMatch(/模型已调用|自动诊断|核心状态已写入|外部通知已发送/);
  });
});


describe('UI-11 to UI-12 authenticated private growth readback', () => {
  it('reads a family-private journey and story with the account bearer only without exposing ranking, score, diagnosis or publication', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        family_id: 'family-growth-story-auth-scope', data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED',
        cards: [
          { surface: 'UI-11', state: 'READ_ONLY', title: '我的成长轨迹', loop: 'PERSONAL_HISTORY_LOOP', business_capability: 'personal_history', primary_objects: ['Family'], command: { name: 'READ_PERSONAL_HISTORY' }, personal_growth_journey: { state: 'READY', headline: '已经留下一些家庭过程', entries: [{ event_id: 'journey-private-1', label: '一次家庭行动', detail: '仅作家庭过程回看。' }] } },
          { surface: 'UI-12', state: 'NOOP', title: '成长故事海报', loop: 'EVIDENCE_LOOP', business_capability: 'private_story', primary_objects: ['Family'], command: { name: 'PREVIEW_SYNTHETIC_EVIDENCE_STORY' }, private_growth_story: { state: 'READY', title: '属于我们家的过程片段', summary: '只留给家庭回看。', moments: ['一次愿意慢慢倾听的时刻'] } },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-growth-story-auth-scope', authToken: 'family-growth-story-auth-bearer', platformSurfacesApiMode: 'synthetic-api', initialPage: 'growth-ranking' });
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-growth-story-auth-scope/dev/platform-surfaces');
    expect(request).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((request.headers as Record<string, string>).authorization).toBe('Bearer family-growth-story-auth-bearer');
    expect(root.querySelector('[data-ui11-journey-state="READY"]')?.textContent).toContain('仅作家庭过程回看');
    root.querySelector<HTMLButtonElement>('[data-by="ui11-open-private-story"]')?.click();
    expect(root.querySelector('[data-ui12-story-state="READY"]')?.textContent).toContain('只留给家庭回看');
    expect(root.textContent).not.toMatch(/排名|总分|成长值|诊断|公开发布|外部通知/);
  });
});

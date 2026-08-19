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

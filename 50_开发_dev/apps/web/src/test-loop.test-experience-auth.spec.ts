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

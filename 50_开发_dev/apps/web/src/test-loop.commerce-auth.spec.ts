import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestLoopApp } from './test-loop.js';

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('UI-13 to UI-14 authenticated commerce intent', () => {
  it('uses the account bearer without an inherited cookie for catalog read and no-payment intent draft', async () => {
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
          intent: {
            order_intent_id: 'intent-auth-fixture', status: 'SUBMITTED', external_effect: false,
            text_equivalent: '已记录你的了解意向。不会扣款。',
          },
          entitlement: { entitlement_id: 'entitlement-auth-fixture', status: 'AVAILABLE', external_effect: false },
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
      initialPage: 'home',
    });

    root.querySelector<HTMLButtonElement>('[data-ui01-feature="recommended_card_1"]')?.click();
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui13-open-catalog-item"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-by="ui14-save-interest"]')?.click();
    await tick(); await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [catalogUrl, catalogRequest] = fetchMock.mock.calls[0];
    expect(catalogUrl).toBe('http://family-api.test/families/family-auth-scope/orchestration/test-loop/commerce/products');
    expect(catalogRequest).toMatchObject({ method: 'GET', credentials: 'omit' });
    expect((catalogRequest.headers as Record<string, string>).authorization).toBe('Bearer family-auth-bearer');

    const [intentUrl, intentRequest] = fetchMock.mock.calls[1];
    expect(intentUrl).toBe('http://family-api.test/families/family-auth-scope/orchestration/test-loop/commerce/order-intents');
    expect(intentRequest).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((intentRequest.headers as Record<string, string>).authorization).toBe('Bearer family-auth-bearer');
    expect(JSON.parse(String(intentRequest.body))).toEqual({ page_id: 'UI-14', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1 });
    expect(root.dataset.familyCommerceStatus).toBe('SUBMITTED');
    expect(root.textContent).toContain('你的了解意向已记下');
    expect(root.textContent).toContain('不会扣款');
    expect(root.textContent).not.toMatch(/支付|外部效果|订单完成/);
  });
});


describe('UI-14 to UI-32 authenticated commerce readback', () => {
  it('restores a family-private no-payment product interest in assets without treating it as an order or entitlement', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [{ product_id: 'product-camp', product_ref: 'PRODUCT_PARENT_CHILD_CAMP', product_version: 1, title: '亲子沟通小练习', admission_status: 'ADMITTED', source_ref: 'fixture:catalog', fixture_only: true, attributes_schema_version: 1 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          intent: { order_intent_id: 'intent-private-readback', status: 'SUBMITTED', external_effect: false, text_equivalent: '已记录你的了解意向。不会扣款。' },
          entitlement: null,
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    const app = createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test', familyId: 'family-commerce-readback', authToken: 'family-commerce-readback-bearer', commerceCatalogApiMode: 'synthetic-api', initialPage: 'home',
    });
    root.querySelector<HTMLButtonElement>('[data-ui01-feature="recommended_card_1"]')?.click();
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui13-open-catalog-item"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-by="ui14-save-interest"]')?.click();
    await tick(); await tick();
    app.navigate('orders-assets');
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, intentRequest] = fetchMock.mock.calls[1];
    expect(intentRequest).toMatchObject({ method: 'POST', credentials: 'omit' });
    expect((intentRequest.headers as Record<string, string>).authorization).toBe('Bearer family-commerce-readback-bearer');
    expect(root.querySelector('[data-ui32-commerce-intents="1"]')?.textContent).toContain('已记下 1 项商品了解意向');
    expect(root.textContent).toContain('这不是订单，也不会发起支付');
    expect(root.textContent).not.toMatch(/支付成功|订单完成|权益已变更|扣款成功/);
  });
});

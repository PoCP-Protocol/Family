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
  it('submits a qualified service booking only to the protected service booking endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        booking: { booking_request_id: 'booking-fixture', status: 'REQUESTED', external_effect: false, text_equivalent: '已记录本次预约。不会发送通知或确认真人服务。' },
        service_record: { service_record_id: 'record-fixture', status: 'PENDING', external_effect: false },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);

    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'consultation-booking' });
    root.querySelector<HTMLButtonElement>('[aria-label="确认预约"]')?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/services/booking-requests');
    expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(request.body))).toEqual({ page_id: 'UI-21', service_offering_ref: 'SERVICE_PARENT_CHILD_PRIMARY', service_offering_version: 1, availability_slot_ref: 'SLOT_PRIMARY' });
    expect(root.dataset.familyServiceBookingAction).toBe('SUBMIT_SERVICE_BOOKING');
    expect(root.dataset.familyServiceBookingStatus).toBe('REQUESTED');
    expect(root.dataset.familyServiceBookingRequest).toBe('booking-fixture');
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
      .mockResolvedValueOnce({ ok: true, json: async () => ({ intent: { order_intent_id: 'interest-fixture', status: 'SUBMITTED', external_effect: false, text_equivalent: '已记录你的了解意向。' } }) });
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
});

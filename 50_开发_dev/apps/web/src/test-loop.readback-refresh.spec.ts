import { createTestLoopApp } from './test-loop.js';

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function response(payload: unknown) {
  return { ok: true, json: async () => payload };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('UI-06 → UI-08 family-private readback refresh', () => {
  it('reloads family-private profile/review readbacks after a private check-in draft without using cookies', async () => {
    const familyId = 'family-readback-refresh';
    const onboardingId = 'onboarding-readback-refresh';
    let privateDraftSaved = false;
    let reviewReads = 0;

    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit = {}) => {
      const endpoint = String(url);
      if (endpoint.endsWith('/dev/core-growth')) {
        return response({ family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', cards: [] });
      }
      if (endpoint.endsWith('/report-explanation')) {
        return response({ state: 'READY', headline: '家庭成长说明', hypotheses: [], recommendations: [], ai_ready: { model_gateway_status: 'NOOP_NOT_INVOKED' } });
      }
      if (endpoint.endsWith('/plan-preview')) {
        return response({ state: 'DRAFT', focus: { label: '亲子沟通', dimension_id: 'PARENT_CHILD_COMMUNICATION' }, structure: { stages: [] }, next_action: { text: '从一个小行动开始' }, model_gateway_status: 'NOOP_NOT_INVOKED' });
      }
      if (endpoint.endsWith('/service-journey')) {
        return response({
          family_id: familyId,
          onboarding_id: onboardingId,
          visibility: 'FAMILY_PRIVATE',
          state: 'READY',
          process_summary: { label: '从本周的一件小行动开始' },
          next_hint: { text: '从本周的一件小行动开始。' },
          service_cards: [],
          private_feed: privateDraftSaved ? [{ entry_id: 'receipt-ui06-1', kind: 'CHECKIN_DRAFT' }] : [],
        });
      }
      if (endpoint.endsWith('/service-journey/checkin-drafts')) {
        expect(init).toMatchObject({ method: 'POST', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer bearer-for-readback-test');
        expect(JSON.parse(String(init.body))).toEqual({ action_ref: 'WEEKLY_ACTION_SEE' });
        privateDraftSaved = true;
        return response({ state: 'CREATED', draft_kind: 'PRIVATE_CHECKIN_DRAFT', external_effect: false, ontology_write: false, receipt_id: 'receipt-ui06-1' });
      }
      if (endpoint.endsWith('/growth-profile-readback')) {
        return response({
          family_id: familyId,
          onboarding_id: onboardingId,
          visibility: 'FAMILY_PRIVATE',
          state: 'READY',
          focus: { label: '亲子沟通' },
          plan_context: { horizon_days: 90 },
          evidence_lineage: [{ evidence_id: 'evidence-1' }],
        });
      }
      if (endpoint.endsWith('/family-review-readback')) {
        reviewReads += 1;
        expect(init).toMatchObject({ credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer bearer-for-readback-test');
        return response({
          family_id: familyId,
          onboarding_id: onboardingId,
          visibility: 'FAMILY_PRIVATE',
          state: privateDraftSaved ? 'ACTION_RECORDED' : 'READY',
          recorded_actions: privateDraftSaved ? [{ receipt_id: 'receipt-ui06-1', source_ui: 'UI-06' }] : [],
          reflection_prompt: '这一次，我注意到了什么？这只是自己的感受和观察。',
          next_hint: { text: '可以按家庭节奏决定下一步。' },
        });
      }
      throw new Error(`unexpected_fetch:${endpoint}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId,
      onboardingId,
      authToken: 'bearer-for-readback-test',
      coreGrowthApiMode: 'synthetic-api',
      initialPage: 'core-community',
    });
    for (let index = 0; index < 8; index += 1) await tick();

    expect(root.querySelector('[data-ui06-service-journey-state="READY"]')).not.toBeNull();
    expect(root.textContent).toContain('这里会慢慢留下属于家庭自己的过程小记。');

    root.querySelector<HTMLButtonElement>('[data-by="ui06-create-private-draft"]')?.click();
    for (let index = 0; index < 8; index += 1) await tick();

    expect(root.querySelector('[data-ui06-private-draft-state="CREATED"]')?.textContent).toContain('家庭小记已留好');
    expect(root.querySelector('[data-ui06-private-entry="receipt-ui06-1"]')?.textContent).toContain('已留下一个家庭小记');
    expect(reviewReads).toBeGreaterThanOrEqual(2);

    root.querySelector<HTMLButtonElement>('[data-by="ui06-open-family-review"]')?.click();
    await tick();

    expect(root.querySelector('[data-ui08-review-state="ACTION_RECORDED"]')).not.toBeNull();
    expect(root.querySelector('[data-ui08-receipt="receipt-ui06-1"]')?.textContent).toContain('已留下家庭私有小记');
    expect(root.textContent).toContain('行动记录和感受不等于成长结果或孩子评价。');
  });
});

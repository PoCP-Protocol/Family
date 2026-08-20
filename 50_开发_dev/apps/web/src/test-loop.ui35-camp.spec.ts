import { createTestLoopApp } from './test-loop.js';

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('UI-01 → UI-35 21-day growth camp lineage', () => {
  it('routes the visible camp entry to UI-35 and records a bounded daily parent action without an external effect', async () => {
    const familyId = 'family-ui35-camp';
    let checkedIn = false;
    const fetchMock = vi.fn().mockImplementation(async (url: string, request: RequestInit = {}) => {
      const endpoint = String(url);
      if (endpoint.endsWith('/dev/core-growth')) {
        return {
          ok: true,
          json: async () => ({
            family_id: familyId,
            data_source: 'SYNTHETIC_DEV_ONLY',
            cards: [{
              surface: 'UI-35',
              state: 'DRAFT',
              command: { name: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', mode: 'CONTROLLED_DRAFT' },
              curriculum_draft: {
                status: 'DRAFT',
                day_count: 21,
                current_day: {
                  day_number: 1,
                  theme: '从一次认真倾听开始',
                  parent_action: '先完整听完孩子的表达，再决定怎样回应。',
                  reflection_prompt: '写下你留意到的一个细节和当下的感受。',
                },
                stages: [{ stage_id: 'CONNECT', label: '阶段一：观察与连接', day_range: 'Day 1-7', intent: '从每天一次温和的陪伴行动开始。' }],
              },
            }],
            recent_flow_events: checkedIn ? [{ ui_id: 'UI-35', event_state: 'DEV_CONFIRMED' }] : [],
          }),
        };
      }
      expect(endpoint).toBe(`http://family-api.test/families/${familyId}/dev/flow-events`);
      expect(request).toMatchObject({ method: 'POST', credentials: 'omit' });
      expect(request.headers).toMatchObject({ 'idempotency-key': expect.any(String), authorization: 'Bearer bearer-ui35-test' });
      expect(JSON.parse(String(request.body))).toEqual({ ui_id: 'UI-35', command: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', selection: 'DAY_1_PARENT_ACTION' });
      checkedIn = true;
      return {
        ok: true,
        json: async () => ({ event_state: 'DEV_CONFIRMED', external_effect: false, data_source: 'SYNTHETIC_DEV_ONLY' }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId,
      authToken: 'bearer-ui35-test',
      coreGrowthApiMode: 'synthetic-api',
      initialPage: 'home',
    });

    root.querySelector<HTMLButtonElement>('[data-ui01-feature="challenge_21"]')?.click();
    for (let index = 0; index < 6; index += 1) await tick();

    expect(root.querySelector('[data-ui35-curriculum-state="DRAFT"]')).not.toBeNull();
    expect(root.textContent).toContain('21天智慧父母成长营');
    expect(root.textContent).toContain('从一次认真倾听开始');
    expect(root.textContent).not.toMatch(/诊断|保证|治疗|排名|总分/);

    root.querySelector<HTMLButtonElement>('[data-by="camp21-checkin"]')?.click();
    for (let index = 0; index < 6; index += 1) await tick();

    expect(root.dataset.familyCoreGrowthNoop).toBe('DEV_CONFIRMED');
    expect(root.querySelector('[data-ui35-receipt="RECORDED"]')?.textContent).toContain('今天的行动已记录');
    expect(fetchMock.mock.calls.filter(([candidateUrl]) => String(candidateUrl).endsWith('/dev/core-growth'))).toHaveLength(2);
  });
});

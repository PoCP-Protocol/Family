import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestLoopApp } from './test-loop.js';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('UI-09 daily task private object action', () => {
  it('keeps the supplied UI-09 image, selects only the first OPEN UI-09 task, and completes it without an external effect', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, request: RequestInit) => {
      if (String(url).endsWith('/page-objects')) {
        return {
          json: async () => ({
            tasks: [
              { task_id: 'task-ui31-open', source_page_id: 'UI-31', status: 'OPEN' },
              { task_id: 'task-ui09-open', source_page_id: 'UI-09', status: 'OPEN' },
              { task_id: 'task-ui09-completed', source_page_id: 'UI-09', status: 'COMPLETED' },
            ],
            text_equivalent: '以下显示当前家庭的私有成长与服务记录。',
          }),
        };
      }
      expect(String(url)).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/page-objects/actions');
      expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
      expect(request.headers).toMatchObject({ 'idempotency-key': expect.any(String) });
      expect(JSON.parse(String(request.body))).toEqual({ page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: 'task-ui09-open' });
      return {
        json: async () => ({
          object_id: 'task-ui09-open',
          action: 'COMPLETE_TASK',
          status: 'COMPLETED',
          external_effect: false,
          text_equivalent: '这项家庭行动已记录。不会发送通知、支付、发布或履约。',
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'growth-daily-task' });

    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    const button = root.querySelector<HTMLButtonElement>('[aria-label="完成今日任务"]');
    expect(button).not.toBeNull();
    button?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [projectionUrl, projectionRequest] = fetchMock.mock.calls[0];
    expect(projectionUrl).toBe('http://family-api.test/families/family-test-scope/orchestration/test-loop/page-objects');
    expect(projectionRequest).toMatchObject({ method: 'GET', credentials: 'include' });
    expect(root.dataset.familyPageObjectsAction).toBe('COMPLETE_TASK');
    expect(root.dataset.familyPageObjectsStatus).toBe('COMPLETED');
    expect(root.dataset.familyPageObjectsObject).toBe('task-ui09-open');
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('不会发送通知、支付、发布或履约');
  });

  it('leaves the UI-09 original image in place and reports NO_ACTION without posting when no OPEN UI-09 task exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        tasks: [{ task_id: 'task-ui31-open', source_page_id: 'UI-31', status: 'OPEN' }],
        text_equivalent: '以下显示当前家庭的私有成长与服务记录。',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope', initialPage: 'growth-daily-task' });
    root.querySelector<HTMLButtonElement>('[aria-label="完成今日任务"]')?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(root.dataset.familyPageObjectsStatus).toBe('NO_ACTION');
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('当前没有可完成的今日任务');
  });

  it('does not issue Page Objects calls when UI-29, UI-33, or UI-34 is rendered', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: 'family-test-scope' });

    for (const page of ['growth-outcomes', 'my-services', 'family-profile', 'service-records']) {
      app.navigate(page);
      expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});


describe('UI-01/UI-09 first real slice synthetic-api contract', () => {
  const familyId = '22222222-2222-4222-8222-222222222222';
  const taskId = '11111111-1111-4111-8111-111111111111';
  const projection = {
    projection_version: 'UI01_UI09_FAMILY_TODAY_V1',
    family_id: familyId,
    entry_state: 'READY',
    today_task: {
      task_id: taskId,
      task_state: 'NOT_STARTED',
      checkin_allowed: true,
      assignment_text: '先听完再回应',
    },
    ai_ready: {
      evidence_boundary: 'ACTION_CHECKIN_IS_NOT_OUTCOME_OR_CAUSAL_EFFECT',
      recommendation_source: 'RULE_BASED_SYNTHETIC_NO_RECOMMENDATION',
      model_gateway_status: 'NOOP_NOT_INVOKED',
    },
  };

  it('loads the same family-scoped projection on UI-01 and submits UI-09 CompleteGrowthAction with no local fake success', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string, request: RequestInit) => {
      if (String(url).endsWith(`/families/${familyId}/today`)) {
        expect(request).toMatchObject({ method: 'GET', credentials: 'include' });
        expect(request.headers).toMatchObject({ authorization: 'Bearer synthetic-dev-token' });
        return { ok: true, json: async () => projection };
      }
      expect(String(url)).toBe(`http://family-api.test/families/${familyId}/tasks/${taskId}/check-in`);
      expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
      expect(request.headers).toMatchObject({
        authorization: 'Bearer synthetic-dev-token',
        'idempotency-key': expect.any(String),
        'x-source': 'ui-01-ui-09-first-slice',
      });
      expect(JSON.parse(String(request.body))).toMatchObject({ completion_status: 'COMPLETED', reflection: '' });
      return {
        ok: true,
        json: async () => ({
          result_state: 'SUCCESS',
          action: { ...projection.today_task, task_state: 'CHECKED_IN', checkin_allowed: false },
          reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME',
          audit_status: 'RECORDED',
          next_hint: { source: 'RULE_BASED_SYNTHETIC_NOOP', text_key: 'REFRESH_TODAY_AFTER_CHECKIN', model_gateway_status: 'NOOP_NOT_INVOKED' },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test', familyId, authToken: 'synthetic-dev-token',
      firstSliceApiMode: 'synthetic-api', initialPage: 'home',
    });
    await tick();
    await tick();

    expect(root.querySelector('.by-reference-home')).not.toBeNull();
    expect(root.querySelectorAll('[data-ui01-feature]').length).toBeGreaterThanOrEqual(16);
    expect(root.querySelector('[data-ui01-feature~="task_reading"]')?.getAttribute('data-by')).toBe('growth-daily-task');
    expect(root.querySelector('[data-ui01-feature~="assessment_cta"]')?.getAttribute('data-by')).toBe('growth-assessment');
    expect(root.querySelector('[data-ui01-live-state="NOT_STARTED"]')?.textContent).toContain('先听完再回应');
    expect(root.dataset.familyTodayProjectionStatus).toBe('READY');
    expect(root.querySelector('[data-first-slice-surface="UI-01"]')?.textContent).toContain('先听完再回应');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('不代表教育效果');

    app.navigate('growth-daily-task');
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    expect(root.querySelector('[data-first-slice-surface="UI-09"]')?.textContent).toContain('先听完再回应');
    root.querySelector<HTMLButtonElement>('[aria-label="完成今日任务"]')?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(root.dataset.familyPageObjectsAction).toBe('CompleteGrowthAction');
    expect(root.dataset.familyPageObjectsStatus).toBe('SUCCESS');
    expect(root.querySelector('[data-first-slice-state="CHECKED_IN"]')?.textContent).toContain('不代表教育效果');
    expect(root.querySelector('[data-first-slice-state="CHECKED_IN"]')?.textContent).toContain('rule-based 系统提示');
  });

  it('shows a blocked state instead of falling back to static local task data when the projection read fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: 'FAMILY_FORBIDDEN' }) }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, firstSliceApiMode: 'synthetic-api', initialPage: 'growth-daily-task' });
    await tick();
    await tick();

    expect(root.dataset.familyTodayProjectionStatus).toBe('ERROR');
    expect(root.querySelector('[data-first-slice-surface="UI-09"]')?.textContent).toContain('未展示任何本地替代数据');
  });
});


describe('UI-02~UI-10 DEV Core Growth projection', () => {
  const familyId = '22222222-2222-4222-8222-222222222222';
  const projection = {
    projection_version: 'DEV_CORE_GROWTH_V1',
    family_id: familyId,
    data_source: 'SYNTHETIC_DEV_ONLY',
    model_gateway: { status: 'NOOP_NOT_INVOKED' },
    cards: [
      {
        surface: 'UI-02', title: '家庭成长测评入口', state: 'READY', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'DEV 演示从家庭场景进入成长 Onboarding。', next_hint: '可进入测评草稿。',
        command: { name: 'START_SYNTHETIC_ASSESSMENT_DRAFT', mode: 'CONTROLLED_DRAFT' },
      },
      {
        surface: 'UI-03', title: '家庭测评草稿', state: 'DRAFT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '关注维度为 DEV 示例。', next_hint: '草稿可被安全读取。',
        command: { name: 'SAVE_SYNTHETIC_ASSESSMENT_DRAFT', mode: 'NOOP_NOT_PERSISTED' },
      },
      {
        surface: 'UI-04', title: '成长说明', state: 'READ_ONLY', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '报告只解释草稿与限制。', next_hint: '下一步受控确认。',
        command: { name: 'READ_SYNTHETIC_REPORT_EXPLANATION', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-05', title: '90 天成长方案', state: 'DRAFT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '四阶段计划结构。', next_hint: '衔接任务链路。',
        command: { name: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', mode: 'CONTROLLED_DRAFT' },
      },
      {
        surface: 'UI-06', title: '90 天陪跑', state: 'READ_ONLY', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '任务节奏与回顾入口。', next_hint: '今日行动由受控 check-in 完成。',
        command: { name: 'READ_SYNTHETIC_COMPANION_PROGRESS', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-07', title: '我的成长服务', state: 'READ_ONLY', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '只读计划与任务入口。', next_hint: '返回计划或任务。',
        command: { name: 'READ_SYNTHETIC_GROWTH_SERVICE', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-08', title: '成长报告', state: 'READ_ONLY', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '解释性报告与限制。', next_hint: '不直接创建 Journey。',
        command: { name: 'READ_SYNTHETIC_GROWTH_REPORT', mode: 'READ_ONLY' },
      },
      {
        surface: 'UI-10', title: '成长小助手', state: 'NOOP', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '规则化任务入口。', next_hint: '后续受控切片实现孩子自主。',
        command: { name: 'READ_SYNTHETIC_CHILD_ASSISTANT', mode: 'READ_ONLY' },
      },
    ],
  };

  it('binds every core growth reference surface to the same DEV projection and keeps baseline containers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test', familyId, authToken: 'synthetic-dev-token',
      coreGrowthApiMode: 'synthetic-api', initialPage: 'growth-assessment',
    });
    await tick(); await tick();
    expect(root.dataset.familyCoreGrowthStatus).toBe('READY');
    expect(root.querySelector('[data-core-growth-surface="UI-02"]')?.textContent).toContain('SYNTHETIC_DEV_ONLY');
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();

    const pages: Array<[string, string]> = [
      ['assessment', 'UI-03'], ['core-report', 'UI-04'], ['core-plan', 'UI-05'],
      ['core-community', 'UI-06'], ['core-mine', 'UI-07'], ['growth-report', 'UI-08'], ['growth-child', 'UI-10'],
    ];
    for (const [page, surface] of pages) {
      app.navigate(page);
      expect(root.querySelector(`[data-core-growth-surface="${surface}"]`)?.textContent).toContain('SYNTHETIC_DEV_ONLY');
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('persists a DEV synthetic flow receipt without external effect', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => projection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'growth-assessment' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="dev-core-noop"]')?.click();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, request] = fetchMock.mock.calls[1];
    expect(url).toBe(`http://family-api.test/families/${familyId}/dev/flow-events`);
    expect(request).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(request.body))).toMatchObject({ ui_id: 'UI-02', command: 'START_SYNTHETIC_ASSESSMENT_DRAFT' });
    expect(root.dataset.familyCoreGrowthNoop).toBe('DEV_CONFIRMED');
    expect(root.querySelector('[data-core-growth-surface="UI-02"]')?.textContent).toContain('DEV 场景回执已记录');
  });

  it('shows a blocked state rather than local synthetic fallback when DEV projection API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: 'FAMILY_FORBIDDEN' }) }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'core-plan' });
    await tick(); await tick();
    expect(root.dataset.familyCoreGrowthStatus).toBe('ERROR');
    expect(root.querySelector('[data-core-growth-surface="UI-05"]')?.textContent).toContain('未展示本地替代数据');
  });
});


describe('UI-11~UI-34 DEV Platform Surfaces projection', () => {
  const familyId = '22222222-2222-4222-8222-222222222222';
  const uiIds = Array.from({ length: 24 }, (_, index) => `UI-${String(index + 11).padStart(2, '0')}`);
  const cards = uiIds.map((surface) => ({
    surface, title: `DEV ${surface}`, state: 'READ_ONLY', data_source: 'SYNTHETIC_DEV_ONLY',
    summary: '共享平台投影。', next_hint: '外部效果保持 no-op。', command: { name: `READ_${surface}`, mode: 'READ_ONLY' },
  }));
  const projection = { projection_version: 'DEV_PLATFORM_SURFACES_V1', family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED', model_gateway: 'NOOP_NOT_INVOKED', cards };

  it('binds every UI-11~UI-34 route to the shared DEV platform projection without replacing baseline containers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'growth-ranking' });
    await tick(); await tick();
    expect(root.dataset.familyPlatformSurfacesStatus).toBe('READY');
    expect(root.querySelector('[data-platform-surface="UI-11"]')?.textContent).toContain('SYNTHETIC_DEV_ONLY');

    const pages = [
      'growth-poster','commerce-mall','commerce-product','commerce-invite','commerce-group','commerce-points','commerce-mine',
      'teacher-detail','consultation-booking','salon-list','activity-detail','service-mine','parent-community','publish-dynamic',
      'dynamic-detail','my-community','growth-outcomes','annual-member-mine','my-services','orders-assets','family-profile','service-records',
    ];
    for (const page of pages) {
      app.navigate(page); const uiId = ({
        'growth-poster':'UI-12','commerce-mall':'UI-13','commerce-product':'UI-14','commerce-invite':'UI-15','commerce-group':'UI-16','commerce-points':'UI-17','commerce-mine':'UI-18',
        'teacher-detail':'UI-20','consultation-booking':'UI-21','salon-list':'UI-22','activity-detail':'UI-23','service-mine':'UI-24','parent-community':'UI-25','publish-dynamic':'UI-26',
        'dynamic-detail':'UI-27','my-community':'UI-28','growth-outcomes':'UI-29','annual-member-mine':'UI-30','my-services':'UI-31','orders-assets':'UI-32','family-profile':'UI-33','service-records':'UI-34',
      } as Record<string, string>)[page];
      expect(root.querySelector(`[data-platform-surface="${uiId}"]`)?.textContent).toContain('SYNTHETIC_DEV_ONLY');
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('persists a DEV synthetic receipt for booking-style interaction without an external effect', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => projection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'consultation-booking' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="platform-surface-noop"]')?.click(); await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(`http://family-api.test/families/${familyId}/dev/flow-events`);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toMatchObject({ ui_id: 'UI-21', command: 'READ_UI-21' });
    expect(root.dataset.familyPlatformSurfaceNoop).toBe('DEV_CONFIRMED');
    expect(root.querySelector('[data-platform-surface="UI-21"]')?.textContent).toContain('DEV 场景回执已记录');
  });

  it('fails closed when platform synthetic projection cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: 'FAMILY_FORBIDDEN' }) }));
    const root = document.createElement('div'); document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'commerce-mall' });
    await tick(); await tick();
    expect(root.dataset.familyPlatformSurfacesStatus).toBe('ERROR');
    expect(root.querySelector('[data-platform-surface="UI-13"]')?.textContent).toContain('未展示本地替代数据');
  });
});


describe('Family 34 UI route coverage', () => {
  it('renders every manifest route in baseline mode without implicit API calls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId: '22222222-2222-4222-8222-222222222222', initialPage: 'home' });
    const routes = [
      'home','growth-assessment','assessment','core-report','core-plan','core-community','core-mine','growth-report','growth-daily-task','growth-child',
      'growth-ranking','growth-poster','commerce-mall','commerce-product','commerce-invite','commerce-group','commerce-points','commerce-mine','teacher-zone','teacher-detail',
      'consultation-booking','salon-list','activity-detail','service-mine','parent-community','publish-dynamic','dynamic-detail','my-community','growth-outcomes','annual-member-mine',
      'my-services','orders-assets','family-profile','service-records',
    ];
    for (const route of routes) {
      app.navigate(route);
      expect(root.children.length).toBeGreaterThan(0);
    }
    // UI-19 is the pre-existing read-only Service Supply slice. Every other default baseline route remains API-silent.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/orchestration/test-loop/services/offerings?page_id=UI-19&available_only=true');
  });
});

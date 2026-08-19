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
    expect(root.querySelector('[data-ui01-feature="ai_diagnostic"]')?.getAttribute('data-by')).toBe('assessment');
    expect(root.querySelector('[data-ui01-live-state="NOT_STARTED"]')?.textContent).toContain('先听完再回应');
    expect(root.dataset.familyTodayProjectionStatus).toBe('READY');
    expect(root.querySelector('[data-first-slice-surface="UI-01"]')?.textContent).toContain('先听完再回应');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('今日任务');

    app.navigate('growth-daily-task');
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    expect(root.querySelector('[data-first-slice-surface="UI-09"]')?.textContent).toContain('先听完再回应');
    root.querySelector<HTMLButtonElement>('[aria-label="完成今日任务"]')?.click();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(root.dataset.familyPageObjectsAction).toBe('CompleteGrowthAction');
    expect(root.dataset.familyPageObjectsStatus).toBe('SUCCESS');
    expect(root.querySelector('[data-first-slice-state="CHECKED_IN"]')?.textContent).toContain('今天的行动已记录，明天继续。');
    expect(root.querySelector('[data-first-slice-state="CHECKED_IN"]')?.textContent).toContain('稍后刷新，即可查看下一步安排。');
  });

  it('shows a blocked state instead of falling back to static local task data when the projection read fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: 'FAMILY_FORBIDDEN' }) }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, firstSliceApiMode: 'synthetic-api', initialPage: 'growth-daily-task' });
    await tick();
    await tick();

    expect(root.dataset.familyTodayProjectionStatus).toBe('ERROR');
    expect(root.querySelector('[data-first-slice-surface="UI-09"]')?.textContent).toContain('今日任务暂时无法加载，请稍后再试。');
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
        surface: 'UI-03', title: 'AI成长解释草稿', state: 'DRAFT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: '仅解释 DEV 家长关注方向与不确定性。', next_hint: '可预览方案草稿，不形成诊断。',
        command: { name: 'PREVIEW_SYNTHETIC_REPORT_EXPLANATION', mode: 'CONTROLLED_DRAFT' },
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
      {
        surface: 'UI-35', title: '21天智慧父母成长营（DEV课程草稿）', state: 'DRAFT', data_source: 'SYNTHETIC_DEV_ONLY',
        summary: 'AI 辅助课程体系草稿；不等同官方课表，须经课程专家审核。', next_hint: '记录参与行动并形成 recommendation-only 的后续计划草稿。',
        command: { name: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', mode: 'CONTROLLED_DRAFT' },
        curriculum_draft: {
          draft_id: 'CURR-UI35-DEV-21D-V1', status: 'SYNTHETIC_RULE_BASED_DRAFT',
          source_boundary: 'E1_PRODUCT_STRUCTURE_PLUS_PUBLIC_DESIGN_RESEARCH', model_gateway_status: 'NOOP_NOT_INVOKED',
          human_review: 'REQUIRED_BEFORE_PUBLISH_OR_ASSIGN', course_boundary: 'NOT_OFFICIAL_SYLLABUS_NOT_OUTCOME_NOT_DIAGNOSIS',
          day_count: 21,
          stages: [
            { stage_id: 'FOUNDATION', label: '阶段一：观察与连接', day_range: 'Day 1-7', intent: '建立家长行动观察。' },
            { stage_id: 'PRACTICE', label: '阶段二：沟通与习惯实践', day_range: 'Day 8-14', intent: '练习可记录的小行动。' },
            { stage_id: 'REVIEW', label: '阶段三：复盘与延续设计', day_range: 'Day 15-21', intent: '形成后续推荐草稿。' },
          ],
          current_day: { day_number: 1, theme: '观察一次完整的亲子互动', parent_action: '先记录听到和看到的内容，再决定是否回应。', reflection_prompt: '记录自己的感受和观察，不对孩子下结论。', evidence_boundary: 'PERSPECTIVE_NOT_FACT' },
          next_transition: 'GROWTH_PLAN_DRAFT_RECOMMENDATION_ONLY',
        },
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
    expect(root.querySelector('[data-core-growth-surface="UI-02"]')?.textContent).toContain('家庭成长测评');
    expect(root.querySelector('[data-core-growth-surface="UI-02"]')?.textContent).not.toContain('SYNTHETIC_DEV_ONLY');
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();

    const pages: Array<[string, string]> = [
      ['assessment', 'UI-03'], ['core-report', 'UI-04'], ['core-plan', 'UI-05'],
      ['core-community', 'UI-06'], ['core-mine', 'UI-07'], ['growth-report', 'UI-08'], ['growth-child', 'UI-10'],
    ];
    for (const [page, surface] of pages) {
      app.navigate(page);
      if (surface === 'UI-04') expect(root.querySelector('[aria-label*="家庭成长说明"]')).not.toBeNull();
      else if (surface === 'UI-05') expect(root.querySelector('[aria-label*="90天成长方案"]')).not.toBeNull();
      else if (surface === 'UI-06') expect(root.querySelector('[aria-label*="陪跑服务"]')).not.toBeNull();
      else if (surface === 'UI-07') expect(root.querySelector('[aria-label*="我的会员中心"]')).not.toBeNull();
      else if (surface === 'UI-08') expect(root.querySelector('[aria-label*="家庭成长报告"]')).not.toBeNull();
      else if (surface === 'UI-10') expect(root.querySelector('[aria-label*="成长小助手"]')).not.toBeNull();
      else expect(root.querySelector(`[data-core-growth-surface="${surface}"]`)?.textContent).not.toContain('SYNTHETIC_DEV_ONLY');
    }
    app.navigate('growth-camp-21');
    expect(root.querySelector('[data-core-growth-surface="UI-35"]')?.textContent).toContain('21 天智慧父母成长营');
    expect(root.querySelector('[data-core-growth-surface="UI-35"]')?.textContent).not.toContain('SYNTHETIC_DEV_ONLY');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('routes UI-01 21-day camp entry to UI-35 and persists a bounded check-in', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => projection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'home' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-ui01-feature~="challenge_21"]')?.click();
    await tick(); await tick();
    expect(root.querySelector('h1')?.textContent).toContain('观察一次完整的亲子互动');
    expect(root.querySelector('[data-ui35-curriculum-state="SYNTHETIC_RULE_BASED_DRAFT"]')?.textContent).toContain('21 天陪伴课程');
    expect(root.querySelector('[data-ui35-curriculum-state="SYNTHETIC_RULE_BASED_DRAFT"]')?.textContent).not.toContain('REQUIRED_BEFORE_PUBLISH_OR_ASSIGN');
    root.querySelector<HTMLButtonElement>('[data-by="camp21-checkin"]')?.click();
    await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toMatchObject({ ui_id: 'UI-35', command: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', selection: 'DAY_1_PARENT_ACTION' });
    expect(root.querySelector('[data-core-growth-surface="UI-35"]')?.textContent).toContain('本次成长行动已记录');
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
    expect(root.querySelector('[data-core-growth-surface="UI-02"]')?.textContent).toContain('本次成长行动已记录');
  });

  it('records a bounded UI-02 focus selection as a synthetic Perspective and hands off to UI-03', async () => {
    const selectedProjection = { ...projection, recent_flow_events: [{ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => projection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, selection: 'EMOTION_REGULATION' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => selectedProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, selection: 'EMOTION_REGULATION' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => selectedProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'growth-assessment' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-ui02-selection="EMOTION_REGULATION"]')?.click();
    await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toMatchObject({ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION' });
    expect(root.querySelector('[data-ui02-selected-dimension="EMOTION_REGULATION"]')?.textContent).toContain('草稿已记录');
    root.querySelector<HTMLButtonElement>('[data-by="ui02-start-assessment"]')?.click();
    await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[3][1].body))).toMatchObject({ ui_id: 'UI-02', command: 'START_SYNTHETIC_ASSESSMENT_DRAFT', selection: 'EMOTION_REGULATION' });
    expect(root.querySelector('.by-ui-reference')).not.toBeNull();
    expect(root.querySelector('[data-ui03-parent-focus="EMOTION_REGULATION"]')?.textContent).toContain('可以结合实际情况慢慢尝试');
  });

  it('records an AI explanation preview as a bounded synthetic receipt and hands off only to the plan-draft view', async () => {
    const selectedProjection = { ...projection, recent_flow_events: [{ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => selectedProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, selection: 'EMOTION_REGULATION' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => selectedProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'assessment' });
    await tick(); await tick();
    expect(root.querySelector('[data-ui03-explanation-state="READY"]')?.textContent).toContain('你当前更关注：EMOTION_REGULATION');
    root.querySelector<HTMLButtonElement>('[data-by="ui03-preview-plan"]')?.click();
    await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toMatchObject({ ui_id: 'UI-03', command: 'PREVIEW_SYNTHETIC_REPORT_EXPLANATION', selection: 'EMOTION_REGULATION' });
    expect(root.querySelector('[aria-label*="家庭成长说明"]')).not.toBeNull();
    expect(root.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执/i);
  });

  it('passes the selected family focus from UI-03 through the UI-04 report and UI-05 plan into a user-readable UI-09 weekly action context', async () => {
    const reportProjection = {
      ...projection,
      recent_flow_events: [
        { ui_id: 'UI-03', command: 'PREVIEW_SYNTHETIC_REPORT_EXPLANATION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' },
        { ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' },
      ],
      cards: projection.cards.map((card) => card.surface === 'UI-04'
        ? { ...card, command: { name: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', mode: 'CONTROLLED_DRAFT' }, report_draft: {
          report_id: 'REPORT-EMOTION-V1', state: 'READY', focus: 'EMOTION_REGULATION', headline: '先看见感受，再决定怎样回应', summary: '给情绪留出被表达的空间，让互动回到更平稳的节奏。',
          observations: [{ label: '你在关注', detail: '情绪出现时彼此是否有被理解的机会。' }, { label: '可以尝试', detail: '先描述看到的状态，再邀请对方说说感受。' }, { label: '慢慢调整', detail: '冲突时可以先停一停，等平静后再继续。' }],
          this_week_action: { when: '本周任选一个轻松的时刻', action: '今天遇到情绪波动时，先说“我看到你现在很不容易”，再停 30 秒。', fallback: '如果当下不适合交谈，就约定稍后再回来继续。' }, plan_link_state: 'READY_TO_VIEW',
        } }
        : card.surface === 'UI-05'
          ? { ...card, plan_preview: { plan_id: 'PLAN-EMOTION-V1', state: 'READY', focus: 'EMOTION_REGULATION', headline: '为情绪留出理解和恢复的空间', stages: [{ stage_id: 'SEE', label: '看见当下', weeks: '第 1-3 周', intent: '找到最适合开始的一件小事。', small_action: '今天遇到情绪波动时，先说“我看到你现在很不容易”，再停 30 秒。' }, { stage_id: 'ADJUST', label: '温和调整', weeks: '第 4-6 周', intent: '根据家庭节奏微调做法。', small_action: '每周留出一次 10 分钟的小回顾。' }, { stage_id: 'CO_CREATE', label: '一起共创', weeks: '第 7-10 周', intent: '让孩子参与选择和安排。', small_action: '一起决定下一周想尝试的一件事。' }, { stage_id: 'STABILIZE', label: '延续习惯', weeks: '第 11-13 周', intent: '保留适合家庭的做法。', small_action: '选出最想延续的一项家庭约定。' }], next_action: '从本周的一件小行动开始。', weekly_action_handoff: { state: 'READY_TO_OPEN', stage_id: 'SEE', label: '今天可以先试试', action: '今天遇到情绪波动时，先说“我看到你现在很不容易”，再停 30 秒。', fallback: '如果当下不适合交谈，就约定稍后再回来继续。', target_route: 'growth-daily-task' } } }
          : card),
    };
    const planProjection = {
      ...reportProjection,
      recent_flow_events: [{ ui_id: 'UI-04', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }, ...reportProjection.recent_flow_events],
      cards: reportProjection.cards.map((card) => card.surface === 'UI-04'
        ? { ...card, report_draft: { ...card.report_draft, state: 'PLAN_PREVIEWED', plan_link_state: 'VIEWED' } }
        : card.surface === 'UI-05'
          ? { ...card, plan_preview: { ...card.plan_preview, state: 'VIEWED_FROM_REPORT' } }
          : card),
    };
    const actionProjection = {
      ...planProjection,
      recent_flow_events: [{ ui_id: 'UI-05', command: 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }, ...planProjection.recent_flow_events],
      cards: planProjection.cards.map((card) => card.surface === 'UI-05'
        ? { ...card, plan_preview: { ...card.plan_preview, weekly_action_handoff: { ...card.plan_preview.weekly_action_handoff, state: 'OPENED' } } }
        : card),
    };
    const todayProjection = {
      projection_version: 'UI01_UI09_FAMILY_TODAY_V1', family_id: familyId, entry_state: 'READY',
      today_task: { task_id: 'action-ui09-focus', assignment_text: '今天和孩子一起做一次 10 分钟倾听练习', task_state: 'NOT_STARTED', checkin_allowed: true },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => reportProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, selection: 'EMOTION_REGULATION' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => reportProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, selection: 'EMOTION_REGULATION' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => planProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, selection: 'EMOTION_REGULATION' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => actionProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => todayProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', firstSliceApiMode: 'synthetic-api', initialPage: 'assessment' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui03-preview-plan"]')?.click();
    await tick(); await tick(); await tick();
    expect(root.querySelector('.by-clear-reference')).not.toBeNull();
    expect(root.querySelector('[data-ui04-focus="EMOTION_REGULATION"]')?.textContent).toContain('先看见感受，再决定怎样回应');
    expect(root.querySelector('[data-ui04-focus="EMOTION_REGULATION"]')?.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui04-plan-handoff"]')?.click();
    await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[3][1].body))).toMatchObject({ ui_id: 'UI-04', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', selection: 'EMOTION_REGULATION' });
    expect(root.querySelector('[data-ui05-plan-state="VIEWED_FROM_REPORT"]')?.textContent).toContain('为情绪留出理解和恢复的空间');
    expect(root.querySelector('[data-ui05-focus="EMOTION_REGULATION"]')?.textContent).toContain('第 11-13 周');
    root.querySelector<HTMLButtonElement>('[data-by="ui05-open-weekly-action"]')?.click();
    await tick(); await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[5][1].body))).toMatchObject({ ui_id: 'UI-05', command: 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', selection: 'EMOTION_REGULATION' });
    expect(root.querySelector('[data-ui05-weekly-action-state="OPENED"]')?.textContent).toContain('我看到你现在很不容易');
    expect(root.querySelector('[data-first-slice-surface="UI-09"]')?.textContent).toContain('今天和孩子一起做一次 10 分钟倾听练习');
    expect(root.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执/i);
  });

  it('opens a non-judgmental UI-08 family review only after UI-09 records its real daily action', async () => {
    const todayTask = { task_id: 'action-ui09-review', assignment_text: '今天和孩子一起做一次 10 分钟倾听练习', task_state: 'NOT_STARTED', checkin_allowed: true };
    const todayProjection = { projection_version: 'UI01_UI09_FAMILY_TODAY_V1', family_id: familyId, entry_state: 'READY', today_task: todayTask };
    const baseCoreProjection = {
      ...projection,
      recent_flow_events: [{ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }],
      cards: projection.cards.map((card) => card.surface === 'UI-08' ? { ...card, action_review: undefined } : card),
    };
    const reviewProjection = {
      ...baseCoreProjection,
      recent_flow_events: [{ ui_id: 'UI-09', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }, ...baseCoreProjection.recent_flow_events],
      cards: baseCoreProjection.cards.map((card) => card.surface === 'UI-08' ? { ...card, action_review: { state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', headline: '把这一次的陪伴留在心里', confirmation: '今天的家庭行动已记录。先不用急着判断效果。', reflection_prompt: '可以想想：在倾听时，你注意到了什么？', next_step: '下次可以再试一次，也可以换一个更轻松的时刻。', plan_route: 'core-plan', fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME' } } : card),
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => todayProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => baseCoreProjection })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result_state: 'SUCCESS', action: { ...todayTask, task_state: 'CHECKED_IN', checkin_allowed: false }, next_hint: { text_key: 'REFRESH_TODAY_AFTER_CHECKIN' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => reviewProjection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, firstSliceApiMode: 'synthetic-api', coreGrowthApiMode: 'synthetic-api', initialPage: 'growth-daily-task' });
    await tick(); await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="page-objects-complete-daily-task"]')?.click();
    await tick(); await tick(); await tick(); await tick();
    expect(JSON.parse(String(fetchMock.mock.calls[3][1].body))).toMatchObject({ ui_id: 'UI-09', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', selection: 'EMOTION_REGULATION' });
    expect(root.querySelector('[data-ui08-action-review-state="ACTION_RECORDED"]')?.textContent).toContain('查看家庭回顾');
    root.querySelector<HTMLButtonElement>('[data-by="ui09-open-family-review"]')?.click();
    await tick();
    expect(root.querySelector('[role="img"][aria-label*="家庭成长报告"]')).not.toBeNull();
    expect(root.querySelector('[data-ui08-review-state="ACTION_RECORDED"]')?.textContent).toContain('先不用急着判断效果');
    expect(root.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执|总分|排名|诊断/i);
  });

  it('shows private UI-06 companion context after a recorded action and routes only to review or today action', async () => {
    const companionProjection = {
      ...projection,
      recent_flow_events: [{ ui_id: 'UI-09', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }],
      cards: projection.cards.map((card) => card.surface === 'UI-06'
        ? { ...card, companion_progress: { state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', headline: '本周，已经留下一次陪伴', confirmation: '今天的家庭行动已记录。每个家庭都可以按自己的节奏继续。', pace_hint: '如果还想再试试，可以从倾听开始；不合适时，先停一停也没关系。', review_route: 'growth-report', action_route: 'growth-daily-task', fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME' } }
        : card.surface === 'UI-08'
          ? { ...card, action_review: { state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', headline: '把这一次的陪伴留在心里', confirmation: '今天的家庭行动已记录。先不用急着判断效果。', reflection_prompt: '可以想想：在倾听时，你注意到了什么？', next_step: '下次可以再试一次。', plan_route: 'core-plan', fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME' } }
          : card),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => companionProjection }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'core-community' });
    await tick(); await tick();
    expect(root.querySelector('[data-ui06-companion-state="ACTION_RECORDED"]')?.textContent).toContain('每个家庭都可以按自己的节奏继续');
    expect(root.querySelector('[data-ui06-companion-state="ACTION_RECORDED"]')?.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执|完成度|评分|排名|诊断/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui06-open-family-review"]')?.click();
    await tick();
    expect(root.querySelector('[data-ui08-review-state="ACTION_RECORDED"]')).not.toBeNull();
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'core-community' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui06-continue-daily-action"]')?.click();
    await tick();
    expect(root.querySelector('[aria-label*="今日成长任务"]')).not.toBeNull();
  });

  it('shows a family UI-10 choice prompt after a recorded action and returns only to today action', async () => {
    const childProjection = {
      ...projection,
      recent_flow_events: [{ ui_id: 'UI-09', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }],
      cards: projection.cards.map((card) => card.surface === 'UI-10'
        ? { ...card, child_action_prompt: { state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', headline: '和孩子一起选一件小事', shared_action: '可以一起试试：先听孩子说完。让孩子选择一个觉得舒服的时刻开始。', pause_hint: '如果今天已经很累，先到这里也可以。下次再选一个轻松的时刻。', action_route: 'growth-daily-task', fact_boundary: 'ACTION_RECORDED_NOT_CHILD_OUTCOME' } }
        : card),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => childProjection }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'growth-child' });
    await tick(); await tick();
    const prompt = root.querySelector('[data-ui10-prompt-state="ACTION_RECORDED"]');
    expect(prompt?.textContent).toContain('和孩子一起选一件小事');
    expect(prompt?.textContent).toContain('先到这里也可以');
    expect(prompt?.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执|完成度|评分|排名|诊断|奖励|能量/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui10-return-daily-action"]')?.click();
    await tick();
    expect(root.querySelector('[aria-label*="今日成长任务"]')).not.toBeNull();
  });

  it('shows a family UI-07 growth profile after a selected focus and routes only to plan or family review', async () => {
    const profileProjection = {
      ...projection,
      recent_flow_events: [{ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION', event_state: 'DEV_CONFIRMED' }],
      cards: projection.cards.map((card) => card.surface === 'UI-07'
        ? { ...card, growth_profile_progress: { state: 'FOCUS_SELECTED', focus: 'EMOTION_REGULATION', headline: '我们的成长档案', summary: '现在关注：为情绪留出理解和恢复的空间。可以回看计划，也可以看看最近的一次家庭回顾。', plan_route: 'core-plan', review_route: 'growth-report', fact_boundary: 'FOCUS_SELECTED_NOT_OUTCOME' } }
        : card.surface === 'UI-08'
          ? { ...card, action_review: { state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', headline: '把这一次的陪伴留在心里', confirmation: '今天的家庭行动已记录。先不用急着判断效果。', reflection_prompt: '可以想想：在倾听时，你注意到了什么？', next_step: '下次可以再试一次。', plan_route: 'core-plan', fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME' } }
          : card),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => profileProjection }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'core-mine' });
    await tick(); await tick();
    const profile = root.querySelector('[data-ui07-profile-state="FOCUS_SELECTED"]');
    expect(profile?.textContent).toContain('现在关注');
    expect(profile?.textContent).not.toMatch(/DEV|synthetic|NOOP|Model Gateway|回执|积分|等级|亲子币|会员|订单|权益|评分|排名|诊断/i);
    root.querySelector<HTMLButtonElement>('[data-by="ui07-open-plan"]')?.click();
    await tick();
    expect(root.querySelector('[aria-label*="90天成长方案"]')).not.toBeNull();
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'core-mine' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui07-open-family-review"]')?.click();
    await tick();
    expect(root.querySelector('[data-ui08-review-state="ACTION_RECORDED"]')).not.toBeNull();
  });

  it('shows a blocked state rather than local synthetic fallback when DEV projection API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: 'FAMILY_FORBIDDEN' }) }));
    const root = document.createElement('div');
    document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, coreGrowthApiMode: 'synthetic-api', initialPage: 'core-plan' });
    await tick(); await tick();
    expect(root.dataset.familyCoreGrowthStatus).toBe('ERROR');
    expect(root.querySelector('[data-ui05-plan-state="ERROR"]')?.textContent).toContain('90 天成长计划暂时无法加载，请稍后再试。');
  });
});


describe('UI-11~UI-34 DEV Platform Surfaces projection', () => {
  const familyId = '22222222-2222-4222-8222-222222222222';
  const uiIds = Array.from({ length: 24 }, (_, index) => `UI-${String(index + 11).padStart(2, '0')}`);
  const cards = uiIds.map((surface) => ({
    surface, title: `DEV ${surface}`, state: 'READ_ONLY', data_source: 'SYNTHETIC_DEV_ONLY',
    summary: '共享平台投影。', next_hint: '外部效果保持 no-op。', command: { name: `READ_${surface}`, mode: 'READ_ONLY' },
    ...(surface === 'UI-11' ? { personal_growth_journey: { state: 'IN_PROGRESS', headline: '我们已经走过的几步', entries: [
      { event_id: 'evt-02', label: '选择了一个家庭关注方向', detail: '从最想照顾的一件事开始。' },
      { event_id: 'evt-09', label: '打开了家庭回顾', detail: '回看一次陪伴，不急着判断效果。' },
    ], plan_route: 'core-plan', review_route: 'growth-report', fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_RANKING' } } : {}),
    ...(surface === 'UI-12' ? { private_growth_story: { state: 'READY', title: '我们一起走过的片段', summary: '这些是我们已经尝试过的过程，不急着下结论，只是留给家庭慢慢回看的片段。', moments: [
      '我们选择了一个想一起关注的方向。', '我们为今天留出了一个小行动。', '我们打开了家庭回顾，愿意再听听彼此的感受。',
    ], journey_route: 'growth-ranking', fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_SHARE' } } : {}),
    ...(surface === 'UI-17' ? { family_self_record: { state: 'READY', headline: '我们已经为今天留下一条小记录', confirmation: '这次行动已经被家庭记下。不急着证明什么，也可以慢慢回看。', pause_hint: '如果今天不想继续，也可以先停在这里；下一次从更容易的一步开始。', review_route: 'growth-report', action_route: 'growth-daily-task', fact_boundary: 'RECORDED_ACTION_NOT_POINTS_REWARD_OR_OUTCOME' } } : {}),
    ...(surface === 'UI-22' ? { family_growth_activity_catalog: { state: 'READY', headline: '可以慢慢了解的家庭成长活动', introduction: '从家庭现在关心的方向出发，先看看活动主题，再决定是否继续关注。', activities: [
      { activity_ref: 'ACTIVITY_FAMILY_DIALOGUE', title: '亲子沟通小练习', summary: '一起练习倾听和表达的日常方法。', age_hint: '适合希望增进亲子交流的家庭', detail_route: 'activity-detail' },
      { activity_ref: 'ACTIVITY_FAMILY_ROUTINE', title: '家庭节奏整理', summary: '看看如何为一周留出更从容的相处时间。', age_hint: '适合想调整日常节奏的家庭', detail_route: 'activity-detail' },
    ], support_topics_route: 'teacher-zone', fact_boundary: 'ACTIVITY_BROWSING_NOT_REGISTRATION_ATTENDANCE_OR_OUTCOME' } } : {}),
  }));
  const projection = { projection_version: 'DEV_PLATFORM_SURFACES_V1', family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED', model_gateway: 'NOOP_NOT_INVOKED', cards };

  it('binds every UI-11~UI-34 route to the shared DEV platform projection without replacing baseline containers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'growth-ranking' });
    await tick(); await tick();
    expect(root.dataset.familyPlatformSurfacesStatus).toBe('READY');
    const ui11 = root.querySelector('[data-platform-surface="UI-11"]');
    expect(ui11?.textContent).toContain('我们的成长旅程');
    expect(ui11?.textContent).not.toMatch(/DEV|SYNTHETIC|排名|积分|名次|称号|奖励/);
    expect(root.querySelector('.by-assistive-status')?.textContent).toContain('成长旅程已更新');
    app.navigate('growth-poster');
    const ui12 = root.querySelector('[data-platform-surface="UI-12"]');
    expect(ui12?.textContent).toContain('家庭私有回看');
    expect(ui12?.textContent).not.toMatch(/DEV|SYNTHETIC|姓名|年龄|学校|分数|勋章|二维码|分享|下载|发布/);
    expect(root.querySelector('.by-assistive-status')?.textContent).toContain('家庭故事已准备好');
    app.navigate('commerce-points');
    const ui17 = root.querySelector('[data-platform-surface="UI-17"]');
    expect(ui17?.textContent).toContain('家庭小记');
    expect(ui17?.textContent).not.toMatch(/DEV|SYNTHETIC|积分|分值|奖励|兑换|权益|订单|支付|总分|排名|诊断/);
    expect(root.querySelector('.by-assistive-status')?.textContent).toContain('家庭小记已准备好');

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
      expect(root.querySelector(`[data-platform-surface="${uiId}"]`)?.textContent).not.toContain('SYNTHETIC_DEV_ONLY');
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('routes the UI-11 private journey to plan, private story, or family review only', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'growth-ranking' });
    await tick(); await tick();
    root.querySelector<HTMLButtonElement>('[data-by="ui11-open-plan"]')?.click();
    expect(root.querySelector('[aria-label^="90天成长方案"]')).not.toBeNull();
    app.navigate('growth-ranking');
    root.querySelector<HTMLButtonElement>('[data-by="ui11-open-private-story"]')?.click();
    expect(root.querySelector('[data-ui12-story-state]')?.textContent).toContain('我们一起走过的片段');
    expect(root.querySelector('[data-ui12-story-state]')?.textContent).not.toMatch(/分享|下载|发布|二维码/);
    root.querySelector<HTMLButtonElement>('[data-by="ui12-return-growth-journey"]')?.click();
    expect(root.querySelector('[data-ui11-journey-state]')).not.toBeNull();
    app.navigate('growth-ranking');
    root.querySelector<HTMLButtonElement>('[data-by="ui11-open-family-review"]')?.click();
    expect(root.querySelector('[aria-label^="家庭成长报告"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('routes the UI-22 family activity catalog to a private explanation and back without a registration write', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'salon-list' });
    await tick(); await tick();
    const catalog = root.querySelector('[data-ui22-activity-catalog-state="READY"]');
    expect(catalog?.textContent).toContain('亲子沟通小练习');
    expect(catalog?.textContent).not.toMatch(/报名|名额|价格|支付|日历|视频|通知|到场|DEV|SYNTHETIC/);
    root.querySelector<HTMLButtonElement>('[data-by="ui22-open-activity-detail"]')?.click();
    await tick();
    const detail = root.querySelector('[data-ui23-activity-detail-state="READY"]');
    expect(detail?.textContent).toContain('亲子沟通小练习');
    expect(detail?.textContent).not.toMatch(/报名|支付|预约|通知|到场/);
    root.querySelector<HTMLButtonElement>('[data-by="ui23-return-activity-catalog"]')?.click();
    await tick();
    expect(root.querySelector('[data-ui22-activity-catalog-state="READY"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[data-by="ui22-return-support-topics"]')?.click();
    await tick();
    expect(root.querySelector('[data-ui-id="UI-19"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(([, init]) => !init || String((init as RequestInit).method || 'GET') === 'GET')).toBe(true);
  });

  it('routes the UI-17 family self-record only to family review or today action', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => projection });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('div'); document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'commerce-points' });
    await tick(); await tick();
    expect(root.querySelector('[data-ui17-self-record-state="READY"]')?.textContent).toContain('这次行动已经被家庭记下');
    root.querySelector<HTMLButtonElement>('[data-by="ui17-open-family-review"]')?.click();
    expect(root.querySelector('[aria-label^="家庭成长报告"]')).not.toBeNull();
    app.navigate('commerce-points');
    root.querySelector<HTMLButtonElement>('[data-by="ui17-continue-daily-action"]')?.click();
    expect(root.querySelector('[aria-label^="今日成长任务"]')).not.toBeNull();
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
    expect(root.querySelector('[data-platform-surface="UI-21"]')?.textContent).toContain('本次选择已记录');
  });

  it('fails closed when platform synthetic projection cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ code: 'FAMILY_FORBIDDEN' }) }));
    const root = document.createElement('div'); document.body.append(root);
    createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, platformSurfacesApiMode: 'synthetic-api', initialPage: 'commerce-mall' });
    await tick(); await tick();
    expect(root.dataset.familyPlatformSurfacesStatus).toBe('ERROR');
    expect(root.querySelector('[data-platform-surface="UI-13"]')?.textContent).toContain('页面内容暂时无法加载，请稍后再试。');
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

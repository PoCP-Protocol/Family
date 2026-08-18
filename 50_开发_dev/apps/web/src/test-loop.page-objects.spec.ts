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

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestLoopApp } from './test-loop.js';

const familyId = 'family-journey-action-web';
const taskId = 'task-journey-action-web';

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

describe('UI-05 to UI-09 90-day Journey action execution', () => {
  it('renders the family-private phase action and completes it through the existing guarded check-in without creating an outcome', async () => {
    const projection = {
      projection_version: 'UI01_UI09_FAMILY_TODAY_V1',
      family_id: familyId,
      entry_state: 'READY',
      today_task: {
        task_id: taskId,
        task_state: 'NOT_STARTED',
        checkin_allowed: true,
        assignment_text: '留出十分钟，先听孩子完整说完再回应。',
        day_index: 1,
        journey_plan_id: 'plan-journey-action-web',
        journey_phase: 'SEE',
        journey_execution_boundary: 'JOURNEY_ACTION_IS_PROCESS_NOT_OUTCOME',
      },
      ai_ready: {
        evidence_boundary: 'ACTION_CHECKIN_IS_NOT_OUTCOME_OR_CAUSAL_EFFECT',
        recommendation_source: 'RULE_BASED_SYNTHETIC_NO_RECOMMENDATION',
        model_gateway_status: 'NOOP_NOT_INVOKED',
      },
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit = {}) => {
      const endpoint = String(url);
      if (endpoint.endsWith(`/families/${familyId}/today`)) {
        expect(init).toMatchObject({ method: 'GET', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-action-web-token');
        return response(projection);
      }
      if (endpoint.endsWith(`/families/${familyId}/tasks/${taskId}/check-in`)) {
        expect(init).toMatchObject({ method: 'POST', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-action-web-token');
        expect((init.headers as Record<string, string>)?.['idempotency-key']).toEqual(expect.any(String));
        expect(JSON.parse(String(init.body))).toMatchObject({ completion_status: 'COMPLETED', reflection: '' });
        return response({
          result_state: 'SUCCESS',
          action: { ...projection.today_task, task_state: 'CHECKED_IN', checkin_allowed: false },
          reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME',
          audit_status: 'RECORDED',
          next_hint: { source: 'RULE_BASED_SYNTHETIC_NOOP', text_key: 'REFRESH_TODAY_AFTER_CHECKIN', model_gateway_status: 'NOOP_NOT_INVOKED' },
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
      authToken: 'journey-action-web-token',
      firstSliceApiMode: 'synthetic-api',
      initialPage: 'growth-daily-task',
    });
    await tick();
    await tick();

    const context = root.querySelector('[data-ui05-journey-action-state="ACTIVE"]');
    expect(context).not.toBeNull();
    expect(context?.getAttribute('data-journey-phase')).toBe('SEE');
    expect(context?.getAttribute('data-journey-day')).toBe('1');
    expect(context?.textContent).toContain('第 1 天｜看见与倾听');
    expect(context?.textContent).toContain('不用于判断成长结果');
    expect(root.textContent).not.toContain('儿童诊断');

    root.querySelector<HTMLButtonElement>('[aria-label="完成今日任务"]')?.click();
    await tick();
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(root.dataset.familyPageObjectsAction).toBe('CompleteGrowthAction');
    expect(root.dataset.familyPageObjectsStatus).toBe('SUCCESS');
    expect(root.querySelector('[data-first-slice-state="CHECKED_IN"]')?.textContent).toContain('今天的行动已记录');
  });
});

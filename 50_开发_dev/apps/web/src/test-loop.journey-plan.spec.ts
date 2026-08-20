import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('UI-05 90-day Journey Plan', () => {
  it('creates and family-confirms a private four-phase plan with Bearer-only requests and no diagnosis/outcome/external effect', async () => {
    const familyId = 'family-journey-plan-web';
    const onboardingId = 'onboarding-journey-plan-web';
    const priorityId = 'priority-journey-plan-web';
    const planId = 'plan-journey-90-web';
    const phases = [
      { phase: 'SEE', start_day: 1, end_day: 14, status: 'PENDING' },
      { phase: 'PARENT_FIRST', start_day: 15, end_day: 35, status: 'PENDING' },
      { phase: 'CO_CREATE', start_day: 36, end_day: 60, status: 'PENDING' },
      { phase: 'STABILIZE', start_day: 61, end_day: 90, status: 'PENDING' },
    ];
    let plan: Record<string, unknown> | null = null;

    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit = {}) => {
      const endpoint = String(url);
      if (endpoint.endsWith('/dev/core-growth')) {
        return response({ family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', cards: [] });
      }
      if (endpoint.endsWith('/growth/journey-plan')) {
        expect(init).toMatchObject({ credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-plan-web-token');
        return response({
          family_id: familyId,
          plan,
          fact_boundary: 'JOURNEY_PROGRESS_IS_SCHEDULE_STATE_NOT_GROWTH_OUTCOME',
          recommendation_boundary: 'NEXT_PHASE_IS_A_FAMILY_DECISION_NOT_AN_AUTOMATIC_RECOMMENDATION',
          model_gateway_status: 'NOOP',
        });
      }
      if (endpoint.endsWith(`/growth/onboardings/${onboardingId}/priority`)) {
        expect(init).toMatchObject({ credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-plan-web-token');
        return response({ active_priority: { priority_id: priorityId } });
      }
      if (endpoint.endsWith(`/growth/onboardings/${onboardingId}/journey-plan`)) {
        expect(init).toMatchObject({ method: 'POST', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-plan-web-token');
        expect(JSON.parse(String(init.body))).toEqual({ priority_id: priorityId });
        plan = {
          plan_id: planId,
          title: '90天家庭共同成长计划',
          status: 'DRAFT',
          current_phase: 'SEE',
          current_day: 1,
          total_days: 90,
          phases,
          boundary: 'PLAN_IS_FAMILY_CONFIRMED_CADENCE_NOT_DIAGNOSIS_OR_OUTCOME',
        };
        return response({ plan, created: true });
      }
      if (endpoint.endsWith(`/growth/journey-plans/${planId}/confirm`)) {
        expect(init).toMatchObject({ method: 'POST', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-plan-web-token');
        plan = { ...plan, status: 'ACTIVE', phases: phases.map((phase) => ({ ...phase, status: phase.phase === 'SEE' ? 'ACTIVE' : 'PENDING' })) };
        return response({ plan });
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
      authToken: 'journey-plan-web-token',
      coreGrowthApiMode: 'synthetic-api',
      initialPage: 'core-plan',
    });
    for (let index = 0; index < 8; index += 1) await tick();

    expect(root.querySelector('[data-ui05-journey-state="EMPTY"]')).not.toBeNull();
    expect(root.textContent).toContain('不会自动创建结果、诊断或外部服务');

    root.querySelector<HTMLButtonElement>('[data-by="ui05-create-journey-plan"]')?.click();
    for (let index = 0; index < 4; index += 1) await tick();

    expect(root.querySelector('[data-ui05-journey-state="DRAFT"]')).not.toBeNull();
    expect(root.querySelectorAll('[data-ui05-journey-phase]').length).toBe(4);
    expect(root.querySelector('[data-ui05-journey-phase="SEE"]')?.textContent).toContain('第 1–14 天');
    expect(root.querySelector('[data-ui05-journey-receipt="DRAFT_CREATED"]')?.textContent).toContain('仍可由家庭决定是否确认');

    root.querySelector<HTMLButtonElement>('[data-by="ui05-confirm-journey-plan"]')?.click();
    for (let index = 0; index < 4; index += 1) await tick();

    expect(root.querySelector('[data-ui05-journey-state="ACTIVE"]')).not.toBeNull();
    expect(root.querySelector('[data-ui05-phase-state="ACTIVE"]')?.getAttribute('data-ui05-journey-phase')).toBe('SEE');
    expect(root.querySelector('[data-ui05-journey-receipt="CONFIRMED"]')?.textContent).toContain('下一阶段需复盘后再决定');
    expect(root.textContent).toContain('不是儿童表现、诊断或教育效果');
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/journey-plan')).length).toBeGreaterThanOrEqual(3);
  });
});


describe('90-day Journey Plan readback across review surfaces', () => {
  it('appends one family-private process summary to UI-08, UI-11 and UI-29 with Bearer-only retrieval', async () => {
    const familyId = 'family-journey-readback-web';
    const onboardingId = 'onboarding-journey-readback-web';
    const plan = {
      plan_id: 'plan-journey-readback-web',
      status: 'ACTIVE',
      current_phase: 'SEE',
      current_day: 1,
      total_days: 90,
      phases: [
        { phase: 'SEE', start_day: 1, end_day: 14, status: 'ACTIVE' },
        { phase: 'PARENT_FIRST', start_day: 15, end_day: 35, status: 'PENDING' },
        { phase: 'CO_CREATE', start_day: 36, end_day: 60, status: 'PENDING' },
        { phase: 'STABILIZE', start_day: 61, end_day: 90, status: 'PENDING' },
      ],
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit = {}) => {
      const endpoint = String(url);
      if (endpoint.endsWith('/dev/core-growth')) return response({ family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', cards: [] });
      if (endpoint.endsWith('/growth/journey-plan')) {
        expect(init).toMatchObject({ credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-readback-web-token');
        return response({
          family_id: familyId,
          plan,
          fact_boundary: 'JOURNEY_PROGRESS_IS_SCHEDULE_STATE_NOT_GROWTH_OUTCOME',
          recommendation_boundary: 'NEXT_PHASE_IS_A_FAMILY_DECISION_NOT_AN_AUTOMATIC_RECOMMENDATION',
          model_gateway_status: 'NOOP',
        });
      }
      if (endpoint.includes('/growth-profile-readback')) return response({ family_id: familyId, visibility: 'FAMILY_PRIVATE', state: 'READY', focus: null, plan_context: null, evidence_lineage: [] });
      if (endpoint.includes('/family-review-readback')) return response({ family_id: familyId, visibility: 'FAMILY_PRIVATE', state: 'EMPTY', recorded_actions: [], reflection_prompt: null, next_hint: null });
      throw new Error(`unexpected_fetch:${endpoint}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, {
      apiBaseUrl: 'http://family-api.test',
      familyId,
      onboardingId,
      authToken: 'journey-readback-web-token',
      coreGrowthApiMode: 'synthetic-api',
      initialPage: 'growth-report',
    });
    for (let index = 0; index < 6; index += 1) await tick();

    expect(root.querySelector('[data-journey-readback-surface="UI-08"]')?.getAttribute('data-journey-current-phase')).toBe('SEE');
    expect(root.textContent).toContain('当前为第 1 天');
    expect(root.textContent).toContain('不对孩子或家庭作评价');

    app.navigate('growth-ranking');
    expect(root.querySelector('[data-journey-readback-surface="UI-11"]')?.getAttribute('data-journey-plan-state')).toBe('ACTIVE');
    expect(root.textContent).toContain('下一阶段需要家庭复盘后再决定');

    app.navigate('growth-outcomes');
    expect(root.querySelector('[data-journey-readback-surface="UI-29"]')?.getAttribute('data-journey-plan-id')).toBe(plan.plan_id);
    expect(root.textContent).not.toContain('儿童诊断');
    expect(root.textContent).not.toContain('总分');
  });
});


describe('90-day Journey Plan family phase review controls', () => {
  it('exposes review due controls on UI-08 and applies explicit continue and pause decisions with Bearer-only requests', async () => {
    const familyId = 'family-journey-phase-review-web';
    const onboardingId = 'onboarding-journey-phase-review-web';
    const planId = 'plan-journey-phase-review-web';
    const plan: Record<string, any> = {
      plan_id: planId,
      title: '90天家庭共同成长计划',
      status: 'ACTIVE',
      current_phase: 'SEE',
      current_day: 14,
      total_days: 90,
      phases: [
        { phase: 'SEE', start_day: 1, end_day: 14, status: 'REVIEW_DUE' },
        { phase: 'PARENT_FIRST', start_day: 15, end_day: 35, status: 'PENDING' },
        { phase: 'CO_CREATE', start_day: 36, end_day: 60, status: 'PENDING' },
        { phase: 'STABILIZE', start_day: 61, end_day: 90, status: 'PENDING' },
      ],
    };
    const fetchMock = vi.fn().mockImplementation(async (url: string, init: RequestInit = {}) => {
      const endpoint = String(url);
      if (endpoint.endsWith('/dev/core-growth')) return response({ family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', cards: [] });
      if (endpoint.endsWith('/growth/journey-plan')) {
        expect(init).toMatchObject({ credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-phase-review-web-token');
        return response({ family_id: familyId, plan, fact_boundary: 'JOURNEY_PROGRESS_IS_SCHEDULE_STATE_NOT_GROWTH_OUTCOME', recommendation_boundary: 'NEXT_PHASE_IS_A_FAMILY_DECISION_NOT_AN_AUTOMATIC_RECOMMENDATION', model_gateway_status: 'NOOP' });
      }
      if (endpoint.endsWith(`/growth/journey-plans/${planId}/phase-review`)) {
        expect(init).toMatchObject({ method: 'POST', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-phase-review-web-token');
        const decision = JSON.parse(String(init.body)).decision;
        if (decision === 'HUMAN_REVIEW_REQUIRED') return response({ plan });
        expect(decision).toBe('CONTINUE');
        plan.current_phase = 'PARENT_FIRST';
        plan.current_day = 15;
        plan.phases = plan.phases.map((phase: any) => ({ ...phase, status: phase.phase === 'SEE' ? 'COMPLETED' : phase.phase === 'PARENT_FIRST' ? 'ACTIVE' : 'PENDING' }));
        return response({ plan });
      }
      if (endpoint.endsWith(`/growth/journey-plans/${planId}/pause`)) {
        expect(init).toMatchObject({ method: 'POST', credentials: 'omit' });
        expect((init.headers as Record<string, string>)?.authorization).toBe('Bearer journey-phase-review-web-token');
        plan.status = 'PAUSED';
        return response({ plan });
      }
      if (endpoint.includes('/growth-profile-readback')) return response({ family_id: familyId, visibility: 'FAMILY_PRIVATE', state: 'READY', focus: null, plan_context: null, evidence_lineage: [] });
      if (endpoint.includes('/family-review-readback')) return response({ family_id: familyId, visibility: 'FAMILY_PRIVATE', state: 'EMPTY', recorded_actions: [], reflection_prompt: null, next_hint: null });
      throw new Error(`unexpected_fetch:${endpoint}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const root = document.createElement('div');
    document.body.append(root);
    const app = createTestLoopApp(root, { apiBaseUrl: 'http://family-api.test', familyId, onboardingId, authToken: 'journey-phase-review-web-token', coreGrowthApiMode: 'synthetic-api', initialPage: 'growth-report' });
    for (let index = 0; index < 6; index += 1) await tick();

    expect(root.querySelector('[data-ui08-journey-review="REVIEW_DUE"]')).not.toBeNull();
    expect(root.textContent).toContain('系统不会自动转段');
    root.querySelector<HTMLButtonElement>('[data-by="ui08-human-review-journey-phase"]')?.click();
    for (let index = 0; index < 4; index += 1) await tick();
    expect(root.querySelector('[data-ui08-journey-review="REVIEW_DUE"]')).not.toBeNull();
    app.navigate('growth-report');
    root.querySelector<HTMLButtonElement>('[data-by="ui08-continue-journey-phase"]')?.click();
    for (let index = 0; index < 4; index += 1) await tick();
    expect(root.querySelector('[data-journey-current-phase="PARENT_FIRST"]')).not.toBeNull();

    plan.current_phase = 'PARENT_FIRST';
    plan.phases = plan.phases.map((phase: any) => ({ ...phase, status: phase.phase === 'PARENT_FIRST' ? 'REVIEW_DUE' : phase.status }));
    app.navigate('core-plan');
    expect(root.querySelector('[data-ui05-journey-review="REVIEW_DUE"]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[data-by="ui05-pause-journey-plan"]')?.click();
    for (let index = 0; index < 4; index += 1) await tick();
    expect(root.querySelector('[data-ui05-journey-state="PAUSED"]')).not.toBeNull();
    expect(root.querySelector('[data-ui05-journey-receipt="PAUSED_FOR_ADJUSTMENT"]')?.textContent).toContain('等待家庭再次决定');
  });
});

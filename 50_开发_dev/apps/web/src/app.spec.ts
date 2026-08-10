import { describe, expect, it, vi } from 'vitest';
import { createGrowthApp, createPerspectiveRequest, submitBuildGrowthProfileDrafts, submitConfirmGrowthProfile, submitRecordPerspective, submitStartGrowthOnboarding } from './app.js';
import { fetchGrowthPriorityInsight, fetchTodayGrowthAction, submitCompleteGrowthAction, submitConfirmGrowthPriority, submitStartIntervention } from './wave2.js';
import { fetchGrowthTimeline, submitCompleteGrowthReview, submitRecordNextStepDecision, submitRecordOutcomeObservation } from './wave3.js';

import type { AppConfig } from './app.js';

const config: AppConfig = {
  apiBaseUrl: 'http://api.test',
  actorPersonId: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  childId: '33333333-3333-4333-8333-333333333333',
  guardianPersonId: '11111111-1111-4111-8111-111111111111',
};

describe('M2-102 Family web perspective capture', () => {
  it('renders Chinese F01/F02 shell before onboarding starts', () => {
    const root = document.createElement('main');

    createGrowthApp(root, config);

    expect(root.textContent).toContain('F01 家庭上下文');
    expect(root.textContent).toContain('F02 成长入口');
    expect(root.textContent).toContain('启动亲子沟通成长旅程');
    expect(root.textContent).toContain('确定性流程');
  });

  it('does not render future Principal AI prototype capabilities in M2 runtime', () => {
    const root = document.createElement('main');

    createGrowthApp(root, config);

    expect(root.textContent).toContain('Family Core · M2-102');
    expect(root.textContent).toContain('确定性流程');
    expect(root.textContent).not.toContain('Principal AI');
    expect(root.textContent).not.toContain('法咪莉校长');
    expect(root.textContent).not.toContain('波波校长 AI');
    expect(root.textContent).not.toContain('AI人');
    expect(root.textContent).not.toContain('AI 对话');
    expect(root.textContent).not.toContain('语音提问');
    expect(root.textContent).not.toContain('数字人');
    expect(root.textContent).not.toContain('讲课模式');
    expect(root.textContent).not.toContain('Soul 蒸馏');
    expect(root.textContent).not.toContain('总分');
    expect(root.textContent).not.toContain('排名');
    expect(root.textContent).not.toContain('保证有效');
  });

  it('submits StartGrowthOnboarding with named-action headers and no AI personalization payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        onboarding: onboardingFixture(),
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await submitStartGrowthOnboarding(config, ['NONE']);

    expect(response.onboarding.status).toBe('ACTIVE');
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/families/${config.familyId}/growth/onboarding`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Actor-Id': config.actorPersonId,
          'Idempotency-Key': `m2-101-${config.familyId}-${config.childId}`,
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      childId: config.childId,
      guardianPersonId: config.guardianPersonId,
      structuredSafetySignals: ['NONE'],
    });
    expect(body).not.toHaveProperty('aiPersonalization');
  });

  it('builds parent and child Perspective requests with separated subject, author, and provenance', () => {
    const parentRequest = createPerspectiveRequest(config, 'onboarding-1', 'parent', '父母视角文本', ['interrupts']);
    const childRequest = createPerspectiveRequest(config, 'onboarding-1', 'child', '孩子视角文本', ['wants-to-be-heard']);

    expect(parentRequest).toMatchObject({
      subject_person_id: config.childId,
      author_person_id: config.guardianPersonId,
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      related_dimension_ids: ['P03', 'R03'],
      structured_safety_signals: ['NONE'],
    });
    expect(childRequest).toMatchObject({
      subject_person_id: config.childId,
      author_person_id: config.childId,
      perspective_type: 'CHILD_PERSPECTIVE',
      capture_mode: 'FACILITATED_ENTRY',
      related_dimension_ids: ['R03', 'R04'],
      structured_safety_signals: ['NONE'],
    });
  });

  it('submits RecordPerspective without client final safety severity fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        perspective: perspectiveFixture('PARENT_PERSPECTIVE'),
        evidence: evidenceFixture('PARENT'),
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const request = createPerspectiveRequest(config, 'onboarding-1', 'parent', '父母视角文本', ['interrupts']);

    await submitRecordPerspective(config, 'onboarding-1', request);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/perspectives`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Actor-Id': config.actorPersonId,
          'Idempotency-Key': `m2-102-parent-${config.familyId}-onboarding-1`,
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      subjectPersonId: config.childId,
      authorPersonId: config.guardianPersonId,
      perspectiveType: 'PARENT_PERSPECTIVE',
      captureMode: 'DIRECT_SELF_REPORT',
      relatedDimensionIds: ['P03', 'R03'],
      structuredSafetySignals: ['NONE'],
    });
    expect(body).not.toHaveProperty('safetySeverity');
    expect(body).not.toHaveProperty('severity');
    expect(body).not.toHaveProperty('finalSeverity');
    expect(body).not.toHaveProperty('safety_screening_result');
    expect(body).not.toHaveProperty('safetyDisposition');
  });

  it('renders Chinese F03/F04 forms and parent-child summary after UI flow', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ onboarding: onboardingFixture() }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspective: perspectiveFixture('PARENT_PERSPECTIVE'), evidence: evidenceFixture('PARENT') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspectives: [perspectiveFixture('PARENT_PERSPECTIVE')], evidence: [evidenceFixture('PARENT')] }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('main');

    createGrowthApp(root, { ...config, wave2ApiMode: 'real-api' });
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();

    expect(root.textContent).toContain('F03 父母视角');
    expect(root.textContent).toContain('F04 孩子视角');

    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();

    expect(root.textContent).toContain('父母 / 孩子视角对照');
    expect(root.textContent).toContain('Perspective != Fact');
    expect(root.textContent).toContain('E1');
  });

  it('submits BuildGrowthProfileDrafts and ConfirmGrowthProfile through named-action HTTP endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ drafts: [growthDraftFixture('R03', 'DRAFT')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ draft: growthDraftFixture('R03', 'CONFIRMED'), profile: growthProfileFixture('R03') }) });
    vi.stubGlobal('fetch', fetchMock);

    await submitBuildGrowthProfileDrafts(config, 'onboarding-1');
    await submitConfirmGrowthProfile(config, 'draft-R03');

    expect(fetchMock).toHaveBeenNthCalledWith(1,
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/profile-drafts`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Actor-Id': config.actorPersonId,
          'Idempotency-Key': `m2-103-drafts-${config.familyId}-onboarding-1-initial`,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      `http://api.test/families/${config.familyId}/growth/profile-drafts/draft-R03/confirm`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Actor-Id': config.actorPersonId,
          'Idempotency-Key': `m2-103-confirm-${config.familyId}-draft-R03`,
        }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({});
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({});
  });

  it('varies BuildGrowthProfileDrafts idempotency by current perspective source fingerprint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ drafts: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    await submitBuildGrowthProfileDrafts(config, 'onboarding-1', 'perspective-parent-perspective-child');

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/profile-drafts`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': `m2-103-drafts-${config.familyId}-onboarding-1-perspective-parent-perspective-child`,
        }),
      }),
    );
  });

  it('renders Chinese F05 growth insight without scores, rankings, or fact claims', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ onboarding: onboardingFixture() }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspective: perspectiveFixture('PARENT_PERSPECTIVE'), evidence: evidenceFixture('PARENT') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspectives: [perspectiveFixture('PARENT_PERSPECTIVE'), perspectiveFixture('CHILD_PERSPECTIVE')], evidence: [evidenceFixture('PARENT'), evidenceFixture('CHILD')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ drafts: [growthDraftFixture('P03', 'DRAFT'), growthDraftFixture('R03', 'DRAFT'), growthDraftFixture('R05', 'REVIEW_REQUIRED')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => growthInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ draft: growthDraftFixture('R03', 'CONFIRMED'), profile: growthProfileFixture('R03') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...growthInsightFixture(), confirmed_profiles: [growthProfileFixture('R03')] }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('main');

    createGrowthApp(root, config);
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();

    expect(root.textContent).toContain('我们目前看到的沟通状态');
    expect(root.textContent).toContain('这是基于目前信息形成的解释性工作画像，不是事实判定。');
    expect(root.textContent).toContain('Evidence 本身不是 Profile');
    expect(root.textContent).not.toContain('总分');
    expect(root.textContent).not.toContain('排名');

    root.querySelector<HTMLButtonElement>('#build-profile-drafts')?.click();
    await flushPromises();

    expect(root.textContent).toContain('P03 父母倾听与回应方式');
    expect(root.textContent).toContain('R03 冲突中被听见的程度');
    expect(root.textContent).toContain('信息不足，暂不确认');
    expect(root.textContent).toContain('这符合我们目前的情况');

    root.querySelector<HTMLButtonElement>('button[data-confirm-draft-id="draft-R03"]')?.click();
    await flushPromises();

    expect(root.textContent).toContain('已确认 1 个工作画像');
    expect(root.textContent).toContain('不会自动生成行动');
  });

  it('renders Wave2 F06-F09 workspace in pre-real-api mode by default', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ onboarding: onboardingFixture() }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspective: perspectiveFixture('PARENT_PERSPECTIVE'), evidence: evidenceFixture('PARENT') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspectives: [perspectiveFixture('PARENT_PERSPECTIVE'), perspectiveFixture('CHILD_PERSPECTIVE')], evidence: [evidenceFixture('PARENT'), evidenceFixture('CHILD')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ drafts: [growthDraftFixture('P03', 'DRAFT'), growthDraftFixture('R03', 'DRAFT'), growthDraftFixture('R05', 'REVIEW_REQUIRED')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => growthInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ draft: growthDraftFixture('R03', 'CONFIRMED'), profile: growthProfileFixture('R03') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...growthInsightFixture(), confirmed_profiles: [growthProfileFixture('R03')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => priorityInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => startInterventionFixture().intervention })
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => priorityConfirmFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => startInterventionFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => growthActionFixture('PENDING') })
      .mockResolvedValueOnce({ ok: true, json: async () => completeActionFixture() });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('main');

    createGrowthApp(root, config);
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('#build-profile-drafts')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-confirm-draft-id="draft-R03"]')?.click();
    await flushPromises();

    expect(root.textContent).toContain('7 天沟通练习工作台');
    expect(root.textContent).toContain('pre-real-api');
    expect(root.textContent).toContain('预备模式');
    expect(root.textContent).toContain('本周练习重点');
    expect(root.textContent).toContain('NO_PRIORITY_YET');
    expect(root.textContent).toContain('先听后回应');
    expect(root.textContent).toContain('当前没有待完成的今日行动');
    expect(root.textContent).toContain('开始练习后可记录行动反思');
    expect(root.textContent).not.toContain('总分');
    expect(root.textContent).not.toContain('排名');
    expect(root.textContent).not.toContain('诊断');
    expect(root.textContent).not.toContain('AI 推荐');

    root.querySelector<HTMLButtonElement>('button[data-wave2-action="confirm-priority"]')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-wave2-action="start-intervention"]')?.click();
    await flushPromises();
    expect(root.textContent).toContain('已生成 7 个每日练习');
    expect(root.textContent).toContain('今天的具体练习');
    expect(root.textContent).toContain('行动后的记录');
    expect(root.textContent).toContain('这是一段行动后的记录，不代表已经产生结果，也不自动改变成长画像。');

    root.querySelector<HTMLFormElement>('#wave2-reflection-form')?.requestSubmit();
    await flushPromises();
    expect(root.textContent).toContain('REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME');
  });

  it('rehydrates Wave2 reads when profile drafts return an already confirmed profile', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ onboarding: onboardingFixture() }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspective: perspectiveFixture('PARENT_PERSPECTIVE'), evidence: evidenceFixture('PARENT') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspectives: [perspectiveFixture('PARENT_PERSPECTIVE'), perspectiveFixture('CHILD_PERSPECTIVE')], evidence: [evidenceFixture('PARENT'), evidenceFixture('CHILD')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ drafts: [growthDraftFixture('R03', 'CONFIRMED')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...growthInsightFixture(), confirmed_profiles: [growthProfileFixture('R03')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => priorityInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => startInterventionFixture().intervention })
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => null });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('main');

    createGrowthApp(root, { ...config, wave2ApiMode: 'real-api' });
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('#build-profile-drafts')?.click();
    await flushPromises();

    expect(root.textContent).toContain('已连接');
    expect(root.textContent).toContain('本周练习重点');
    expect(root.textContent).toContain('先听后回应');
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/priority`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('keeps Day 1 visible when the post-start Today Action refresh fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ onboarding: onboardingFixture() }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspective: perspectiveFixture('PARENT_PERSPECTIVE'), evidence: evidenceFixture('PARENT') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspectives: [perspectiveFixture('PARENT_PERSPECTIVE'), perspectiveFixture('CHILD_PERSPECTIVE')], evidence: [evidenceFixture('PARENT'), evidenceFixture('CHILD')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ drafts: [growthDraftFixture('R03', 'CONFIRMED')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...growthInsightFixture(), confirmed_profiles: [growthProfileFixture('R03')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => priorityInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => startInterventionFixture().intervention })
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => priorityConfirmFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => startInterventionFixture() })
      .mockRejectedValueOnce(new Error('Today Action refresh failed'));
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('main');

    createGrowthApp(root, { ...config, wave2ApiMode: 'real-api' });
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('#build-profile-drafts')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-wave2-action="confirm-priority"]')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-wave2-action="start-intervention"]')?.click();
    await flushPromises();

    expect(root.textContent).toContain('已生成 7 个每日练习');
    expect(root.textContent).toContain('今天的具体练习');
    expect(root.textContent).toContain('行动后的记录');
    expect(root.textContent).toContain('7 天练习已准备，今日行动使用 StartIntervention 返回的 Day 1。');
  });

  it('keeps Wave2 future real API adapters on named-action payload boundaries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => priorityInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => priorityConfirmFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => startInterventionFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => completeActionFixture() });
    vi.stubGlobal('fetch', fetchMock);

    await fetchGrowthPriorityInsight(config, 'onboarding-1');
    await submitConfirmGrowthPriority(config, 'onboarding-1', 'priority-draft-R03', 'R03');
    await submitStartIntervention(config, 'onboarding-1', 'priority-R03');
    await submitCompleteGrowthAction(config, 'action-day-1', 'PARTIAL', '今天先听后回应了一次。');

    expect(fetchMock).toHaveBeenNthCalledWith(1,
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/priority`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/priority/confirm`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(3,
      `http://api.test/families/${config.familyId}/growth/onboardings/onboarding-1/interventions/start`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(4,
      `http://api.test/families/${config.familyId}/growth/actions/action-day-1/complete`,
      expect.objectContaining({ method: 'POST' }),
    );

    const priorityBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const interventionBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    const actionBody = JSON.parse(fetchMock.mock.calls[3][1].body);
    expect(priorityBody).toEqual({
      draft_id: 'priority-draft-R03',
      decision: 'R03',
    });
    expect(interventionBody).toEqual({
      priority_id: 'priority-R03',
      intervention_code: 'LISTEN_BEFORE_RESPOND',
    });
    expect(actionBody).toMatchObject({
      completion_status: 'PARTIAL',
      reflection: '今天先听后回应了一次。',
    });
    expect(priorityBody).not.toHaveProperty('score');
    expect(priorityBody).not.toHaveProperty('ranking');
    expect(interventionBody).not.toHaveProperty('outcome');
    expect(interventionBody).not.toHaveProperty('milestone');
    expect(actionBody).not.toHaveProperty('outcome');
    expect(actionBody).not.toHaveProperty('safetySeverity');
  });

  it('renders Wave3 F10/F11 closure after a Wave2 episode starts in pre-real-api mode', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ onboarding: onboardingFixture() }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspective: perspectiveFixture('PARENT_PERSPECTIVE'), evidence: evidenceFixture('PARENT') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ perspectives: [perspectiveFixture('PARENT_PERSPECTIVE'), perspectiveFixture('CHILD_PERSPECTIVE')], evidence: [evidenceFixture('PARENT'), evidenceFixture('CHILD')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ drafts: [growthDraftFixture('P03', 'DRAFT'), growthDraftFixture('R03', 'DRAFT'), growthDraftFixture('R05', 'REVIEW_REQUIRED')] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => growthInsightFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ draft: growthDraftFixture('R03', 'CONFIRMED'), profile: growthProfileFixture('R03') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...growthInsightFixture(), confirmed_profiles: [growthProfileFixture('R03')] }) });
    vi.stubGlobal('fetch', fetchMock);
    const root = document.createElement('main');

    createGrowthApp(root, config);
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('#build-profile-drafts')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-confirm-draft-id="draft-R03"]')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-wave2-action="confirm-priority"]')?.click();
    await flushPromises();
    root.querySelector<HTMLButtonElement>('button[data-wave2-action="start-intervention"]')?.click();
    await flushPromises();

    expect(root.textContent).toContain('F10 / F11 Wave3');
    expect(root.textContent).toContain('7 天过程时间线');
    expect(root.textContent).toContain('7 天成长复盘');
    expect(root.textContent).toContain('NextStepDecision is not NextAction');

    root.querySelector<HTMLButtonElement>('button[data-wave3-action="record-parent-observation"]')?.click();
    await flushPromises();
    expect(root.textContent).toContain('INTERVENTION_STARTED');
    expect(root.textContent).toContain('GROWTH_ACTION_COMPLETED');

    root.querySelector<HTMLButtonElement>('button[data-wave3-action="complete-review"]')?.click();
    await flushPromises();
    expect(root.textContent).toContain('REVIEW_IS_NOT_PROFILE_MUTATION_OR_DIAGNOSIS');
    expect(root.textContent).toContain('父母观察到自己更容易先听完再回应。');

    root.querySelector<HTMLButtonElement>('button[data-wave3-action="record-next-step"]')?.click();
    await flushPromises();
    expect(root.textContent).toContain('NEXT_STEP_DECISION_IS_NOT_NEXT_ACTION');
    expect(root.textContent).toContain('没有自动创建下一轮行动');
    expect(root.textContent).not.toContain('AI 推荐');
    expect(root.querySelector('[data-wave3-action="record-next-step"]')?.textContent).not.toContain('生成行动');
    expect(root.querySelector('.wave3-grid')?.textContent).not.toContain('成长总分');
    expect(root.querySelector('.wave3-grid')?.textContent).not.toContain('家庭排名');
  });

  it('keeps Wave3 real API adapters on observation, review, timeline, and decision boundaries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ observation: outcomeObservationFixture('PARENT_OBSERVATION') }) })
      .mockResolvedValueOnce({ ok: true, json: async () => completeReviewFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => timelineFixture() })
      .mockResolvedValueOnce({ ok: true, json: async () => nextStepFixture() });
    vi.stubGlobal('fetch', fetchMock);

    await submitRecordOutcomeObservation(config, 'episode-1', 'PARENT_OBSERVATION', 'action-day-1');
    await submitCompleteGrowthReview(config, 'episode-1');
    await fetchGrowthTimeline(config, 'episode-1');
    await submitRecordNextStepDecision(config, 'review-1', 'CONTINUE');

    expect(fetchMock).toHaveBeenNthCalledWith(1,
      `http://api.test/families/${config.familyId}/growth/outcome-observations`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      `http://api.test/families/${config.familyId}/growth/intervention-episodes/episode-1/review/complete`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(3,
      `http://api.test/families/${config.familyId}/growth/intervention-episodes/episode-1/timeline`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(4,
      `http://api.test/families/${config.familyId}/growth/reviews/review-1/next-step`,
      expect.objectContaining({ method: 'POST' }),
    );

    const observationBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const reviewBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const nextStepBody = JSON.parse(fetchMock.mock.calls[3][1].body);
    expect(observationBody).toMatchObject({
      perspective_type: 'PARENT_OBSERVATION',
      action_refs: ['action-day-1'],
      reflection_refs: ['action-day-1'],
      limitations: ['SELF_REPORT_ONLY'],
    });
    expect(reviewBody).toEqual({});
    expect(nextStepBody).toEqual({
      decision: 'CONTINUE',
      rationale: '人工确认：先延续当前练习；这里没有自动创建下一轮行动。',
    });
    expect(observationBody).not.toHaveProperty('fact');
    expect(observationBody).not.toHaveProperty('causalEffect');
    expect(reviewBody).not.toHaveProperty('profileMutation');
    expect(nextStepBody).not.toHaveProperty('action');
    expect(nextStepBody).not.toHaveProperty('nextAction');
  });

  it('treats an empty successful Today Action response as no action for today', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    }));

    await expect(fetchTodayGrowthAction(config)).resolves.toBeNull();
  });
});

function onboardingFixture() {
  return {
    onboarding_id: 'onboarding-1',
    family_id: config.familyId,
    child_id: config.childId,
    guardian_person_id: config.guardianPersonId,
    status: 'ACTIVE',
    phase: 'ONBOARDING',
    life_stage_code: 'EARLY_ADOLESCENCE_12_15',
    journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
    target_dimensions: ['P03', 'R03', 'R04', 'R05'],
    safety_disposition: {
      severity: 'LOW',
      disposition: 'NORMAL',
      policy_version: 'M2_101_DETERMINISTIC_V1',
      signals: ['NONE'],
    },
    ai_personalization_enabled: false,
    started_at: '2026-08-09T00:00:00.000Z',
    created_at: '2026-08-09T00:00:00.000Z',
  };
}

function perspectiveFixture(type: 'PARENT_PERSPECTIVE' | 'CHILD_PERSPECTIVE') {
  return {
    perspective_id: `perspective-${type}`,
    family_id: config.familyId,
    onboarding_id: 'onboarding-1',
    subject_person_id: config.childId,
    author_person_id: type === 'CHILD_PERSPECTIVE' ? config.childId : config.guardianPersonId,
    recorded_by_actor_id: config.actorPersonId,
    perspective_type: type,
    capture_mode: type === 'CHILD_PERSPECTIVE' ? 'FACILITATED_ENTRY' : 'DIRECT_SELF_REPORT',
    related_dimension_ids: type === 'CHILD_PERSPECTIVE' ? ['R03', 'R04'] : ['P03', 'R03'],
    content: {
      prompt_id: 'fixture-v1',
      response_text: type === 'CHILD_PERSPECTIVE' ? '孩子视角文本' : '父母视角文本',
      selected_signals: [],
    },
    fact_boundary: 'PERSPECTIVE_NOT_FACT',
    safety_disposition: {
      severity: 'LOW',
      disposition: 'NORMAL',
      policy_version: 'M2_102_DETERMINISTIC_V1',
      signals: ['NONE'],
    },
    expressed_at: '2026-08-09T00:00:00.000Z',
    created_at: '2026-08-09T00:00:00.000Z',
    version: 1,
  };
}

function evidenceFixture(source: 'PARENT' | 'CHILD') {
  return {
    evidence_id: `evidence-${source}`,
    family_id: config.familyId,
    perspective_id: 'perspective-1',
    evidence_type: 'SELF_REPORT',
    source,
    evidence_level: 'E1',
    payload: {},
    observed_at: '2026-08-09T00:00:00.000Z',
    created_at: '2026-08-09T00:00:00.000Z',
  };
}

function growthDraftFixture(dimensionId: 'P03' | 'R03' | 'R05', status: 'DRAFT' | 'REVIEW_REQUIRED' | 'CONFIRMED') {
  const isParent = dimensionId === 'P03';
  const unresolved = status === 'REVIEW_REQUIRED';
  return {
    draft_id: `draft-${dimensionId}`,
    family_id: config.familyId,
    onboarding_id: 'onboarding-1',
    profile_scope: isParent ? 'PARENT_GROWTH_PROFILE' : 'RELATIONSHIP_GROWTH_PROFILE',
    subject_type: isParent ? 'PARENT' : 'RELATIONSHIP',
    subject_person_id: isParent ? config.guardianPersonId : null,
    subject_relationship_id: isParent ? null : 'relationship-1',
    dimension_id: dimensionId,
    candidate_state: unresolved ? 'UNRESOLVED' : dimensionId === 'R03' ? 'DEVELOPING' : 'EMERGING',
    confidence: dimensionId === 'R03' ? 'MEDIUM' : 'LOW',
    status,
    synthesis: {
      dimension_id: dimensionId,
      fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT',
      profile_scope: isParent ? 'PARENT_GROWTH_PROFILE' : 'RELATIONSHIP_GROWTH_PROFILE',
      subject_type: isParent ? 'PARENT' : 'RELATIONSHIP',
      subject_person_id: isParent ? config.guardianPersonId : null,
      subject_relationship_id: isParent ? null : 'relationship-1',
      supporting_evidence_ids: unresolved ? [] : ['evidence-PARENT', 'evidence-CHILD'],
      contradicting_evidence_ids: [],
      perspective_coverage: { parent_perspective_count: 1, child_perspective_count: dimensionId === 'R03' ? 1 : 0, proxy_child_perspective_count: 0 },
      evidence_grade_coverage: { E1: unresolved ? 0 : 2 },
      agreement_level: unresolved ? 'INSUFFICIENT' : dimensionId === 'R03' ? 'ALIGNED' : 'PARTIAL',
      confidence: dimensionId === 'R03' ? 'MEDIUM' : 'LOW',
      candidate_state: unresolved ? 'UNRESOLVED' : dimensionId === 'R03' ? 'DEVELOPING' : 'EMERGING',
      limitations: unresolved ? ['INSUFFICIENT_EVIDENCE'] : ['SELF_REPORT_ONLY'],
      policy_version: 'M2_103_DETERMINISTIC_V1',
    },
    evidence_snapshot: {
      evidence_ids: unresolved ? [] : ['evidence-PARENT', 'evidence-CHILD'],
      perspective_versions: [],
    },
    policy_version: 'M2_103_DETERMINISTIC_V1',
    created_at: '2026-08-09T00:00:00.000Z',
  };
}

function growthInsightFixture() {
  return {
    onboarding_id: 'onboarding-1',
    family_id: config.familyId,
    parent_profile_drafts: [growthDraftFixture('P03', 'DRAFT')],
    relationship_profile_drafts: [growthDraftFixture('R03', 'DRAFT'), growthDraftFixture('R05', 'REVIEW_REQUIRED')],
    confirmed_profiles: [],
    evidence: [evidenceFixture('PARENT'), evidenceFixture('CHILD')],
    perspectives: [perspectiveFixture('PARENT_PERSPECTIVE'), perspectiveFixture('CHILD_PERSPECTIVE')],
  };
}

function growthProfileFixture(dimensionId: 'R03') {
  return {
    profile_id: 'profile-R03',
    family_id: config.familyId,
    profile_scope: 'RELATIONSHIP_GROWTH_PROFILE',
    subject_type: 'RELATIONSHIP',
    subject_person_id: null,
    subject_relationship_id: 'relationship-1',
    dimension_id: dimensionId,
    state: 'DEVELOPING',
    confidence: 'MEDIUM',
    status: 'WORKING',
    version: 1,
    basis: growthDraftFixture(dimensionId, 'CONFIRMED').synthesis,
    evidence_snapshot: growthDraftFixture(dimensionId, 'CONFIRMED').evidence_snapshot,
    policy_version: 'M2_103_DETERMINISTIC_V1',
    confirmed_by_actor_id: config.actorPersonId,
    confirmed_at: '2026-08-09T00:00:00.000Z',
    effective_from: '2026-08-09T00:00:00.000Z',
    effective_to: null,
    previous_profile_id: null,
    created_at: '2026-08-09T00:00:00.000Z',
  };
}

function priorityConfirmFixture() {
  return {
    draft: {
      draft_id: 'priority-draft-R03',
      family_id: config.familyId,
      onboarding_id: 'onboarding-1',
      decision: 'R03',
      candidate: null,
      profile_refs: [{ profile_id: 'profile-R03', version: 1, dimension_id: 'R03' }],
      evidence_refs: ['evidence-PARENT', 'evidence-CHILD'],
      confidence: 'MEDIUM',
      policy_version: 'M2_104_DETERMINISTIC_V2',
      profile_snapshot: {},
      created_at: '2026-08-10T00:00:00.000Z',
    },
    decision: 'R03',
    priority: {
      priority_id: 'priority-R03',
      family_id: config.familyId,
      onboarding_id: 'onboarding-1',
      dimension_id: 'R03',
      profile_id: 'profile-R03',
      status: 'ACTIVE',
      boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
      confirmed_by_actor_id: config.actorPersonId,
      confirmed_at: '2026-08-10T00:00:00.000Z',
      created_at: '2026-08-10T00:00:00.000Z',
    },
  };
}

function startInterventionFixture() {
  return {
    intervention: {
      intervention_id: 'INTERVENTION-001',
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      name_zh: '先听后回应',
      duration_days: 7,
      why: '把回应放在倾听之后。',
      target: '父母回应方式',
      behavior: '先听完，再回应。',
      applicability: ['R03'],
      contraindications: [],
      safety_notes: [],
      expected_mediator: '父母倾听行为',
      expected_outcome: '不作为结果承诺展示',
      action_template: '先听完，再回应。',
      policy_version: 'M2_105_DETERMINISTIC_V1',
    },
    episode: {
      episode_id: 'episode-1',
      family_id: config.familyId,
      onboarding_id: 'onboarding-1',
      priority_id: 'priority-R03',
      intervention_id: 'INTERVENTION-001',
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      status: 'ACTIVE',
      started_by_actor_id: config.actorPersonId,
      planned_days: 7,
      policy_version: 'M2_105_DETERMINISTIC_V1',
      started_at: '2026-08-10T00:00:00.000Z',
      created_at: '2026-08-10T00:00:00.000Z',
    },
    actions: Array.from({ length: 7 }, (_, index) => ({
      ...growthActionFixture('PENDING'),
      action_id: `action-day-${index + 1}`,
      day_index: index + 1,
    })),
  };
}

function completeActionFixture() {
  return {
    action: growthActionFixture('PARTIAL'),
    reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME',
  };
}

function outcomeObservationFixture(type: 'PARENT_OBSERVATION' | 'CHILD_OBSERVATION') {
  return {
    observation_id: `observation-${type}`,
    family_id: config.familyId,
    subject_person_id: config.childId,
    observer_person_id: type === 'CHILD_OBSERVATION' ? config.childId : config.guardianPersonId,
    intervention_episode_id: 'episode-1',
    perspective_type: type,
    observation_text: type === 'CHILD_OBSERVATION' ? '孩子观察到本周被打断时能更容易说完。' : '父母观察到自己更容易先听完再回应。',
    action_refs: ['action-day-1'],
    reflection_refs: ['action-day-1'],
    evidence_refs: [],
    limitations: ['SELF_REPORT_ONLY'],
    observed_at: '2026-08-10T00:00:00.000Z',
    boundary: 'OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT',
    policy_version: 'M2_106_DETERMINISTIC_V1',
    created_at: '2026-08-10T00:00:00.000Z',
  };
}

function completeReviewFixture() {
  return {
    review: {
      review_id: 'review-1',
      family_id: config.familyId,
      onboarding_id: 'onboarding-1',
      intervention_episode_id: 'episode-1',
      priority_id: 'priority-R03',
      dimension_id: 'R03',
      status: 'COMPLETED',
      action_summary: { total_actions: 7, completed: 1, partial: 0, not_completed: 0, missing: 6 },
      observation_ids: ['observation-PARENT_OBSERVATION'],
      limitations: ['MISSING_CHECK_INS', 'PARENT_OBSERVATION_ONLY'],
      boundary: 'REVIEW_IS_NOT_PROFILE_MUTATION_OR_DIAGNOSIS',
      policy_version: 'M2_106_DETERMINISTIC_V1',
      completed_by_actor_id: config.actorPersonId,
      completed_at: '2026-08-10T00:00:00.000Z',
      created_at: '2026-08-10T00:00:00.000Z',
    },
    observations: [outcomeObservationFixture('PARENT_OBSERVATION')],
  };
}

function timelineFixture() {
  return {
    family_id: config.familyId,
    intervention_episode_id: 'episode-1',
    events: [
      {
        event_id: 'event-1',
        family_id: config.familyId,
        intervention_episode_id: 'episode-1',
        event_type: 'OUTCOME_OBSERVATION_RECORDED',
        occurred_at: '2026-08-10T00:00:00.000Z',
        source: 'OUTCOME_OBSERVATION',
        resource_id: 'observation-PARENT_OBSERVATION',
        title: 'Outcome observation recorded',
        payload: { hidden: true },
        boundary: 'TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING',
      },
    ],
  };
}

function nextStepFixture() {
  return {
    decision: {
      decision_id: 'decision-1',
      family_id: config.familyId,
      review_id: 'review-1',
      intervention_episode_id: 'episode-1',
      decision: 'CONTINUE',
      rationale: '人工确认：先延续当前练习，不自动生成下一轮行动。',
      boundary: 'NEXT_STEP_DECISION_IS_NOT_NEXT_ACTION',
      policy_version: 'M2_106_DETERMINISTIC_V1',
      decided_by_actor_id: config.actorPersonId,
      decided_at: '2026-08-10T00:00:00.000Z',
      created_at: '2026-08-10T00:00:00.000Z',
    },
  };
}

function priorityInsightFixture() {
  return {
    onboarding_id: 'onboarding-1',
    family_id: config.familyId,
    draft: priorityConfirmFixture().draft,
    active_priority: null,
  };
}

function growthActionFixture(status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED') {
  return {
    action_id: 'action-day-1',
    family_id: config.familyId,
    onboarding_id: 'onboarding-1',
    priority_id: 'priority-R03',
    intervention_episode_id: 'episode-1',
    day_index: 1,
    status,
    assignment_text: '今天在一次沟通中，先停顿 3 秒，邀请孩子把话说完，再回应。',
    due_date: '2026-08-10',
    completed_at: status === 'PENDING' ? null : '2026-08-10T00:00:00.000Z',
    completion_status: status === 'PENDING' ? null : status,
    reflection: status === 'PENDING' ? null : '今天先听后回应了一次。',
    reflection_boundary: status === 'PENDING' ? null : '只记录行动完成情况，不声明结果已经发生。',
    boundary: 'ACTION_IS_NOT_OUTCOME',
    created_at: '2026-08-10T00:00:00.000Z',
  };
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

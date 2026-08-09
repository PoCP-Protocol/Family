import { describe, expect, it, vi } from 'vitest';
import { createGrowthApp, createPerspectiveRequest, submitRecordPerspective, submitStartGrowthOnboarding } from './app.js';

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
    expect(root.textContent).toContain('AI 非必需');
  });

  it('submits StartGrowthOnboarding with named-action headers and no AI personalization payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        onboarding: onboardingFixture(),
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await submitStartGrowthOnboarding(config, 'LOW');

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
      safetyScreeningResult: 'LOW',
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

    createGrowthApp(root, config);
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
    safety_screening_result: 'LOW',
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

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

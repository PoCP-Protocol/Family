import { describe, expect, it, vi } from 'vitest';
import { createGrowthApp, createPerspectiveRequest, submitBuildGrowthProfileDrafts, submitConfirmGrowthProfile, submitRecordPerspective, submitStartGrowthOnboarding } from './app.js';

import type { AppConfig } from './app.js';
import type { FamilyAggregateResponse } from '@family/contracts';

const config: AppConfig = {
  apiBaseUrl: 'http://api.test',
  actorPersonId: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  childId: '33333333-3333-4333-8333-333333333333',
  guardianPersonId: '11111111-1111-4111-8111-111111111111',
  runtimeMode: 'real-api',
};

describe('M2-102 Family web perspective capture', () => {
  it('renders Chinese F01/F02 shell before onboarding starts', () => {
    const root = document.createElement('main');

    createGrowthApp(root, { ...config, initialAggregate: familyAggregateFixture() });

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

    createGrowthApp(root, { ...config, initialAggregate: familyAggregateFixture() });
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
          'Idempotency-Key': `m2-103-drafts-${config.familyId}-onboarding-1`,
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

    createGrowthApp(root, { ...config, initialAggregate: familyAggregateFixture() });
    root.querySelector<HTMLFormElement>('#growth-onboarding-form')?.requestSubmit();
    await flushPromises();
    root.querySelector<HTMLFormElement>('form[data-perspective-form="parent"]')?.requestSubmit();
    await flushPromises();

    expect(root.textContent).toContain('我们目前看到的沟通状态');
    expect(root.textContent).toContain('这不是评分，也不是事实判定，而是基于目前信息形成的工作画像。');
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

function familyAggregateFixture(currentOnboarding = null): FamilyAggregateResponse {
  return {
    family: {
      family_id: config.familyId,
      display_name: '联调家庭',
      status: 'ACTIVE',
      primary_contact_person_id: config.guardianPersonId ?? null,
      created_at: '2026-08-09T00:00:00.000Z',
      updated_at: '2026-08-09T00:00:00.000Z',
      version: 1,
    },
    members: [
      {
        person_id: config.guardianPersonId!,
        family_id: config.familyId,
        person_type: 'PARENT',
        parent_role: 'GUARDIAN',
        display_name: '监护人',
        birth_date: null,
        account_id: config.actorPersonId,
        created_at: '2026-08-09T00:00:00.000Z',
        updated_at: '2026-08-09T00:00:00.000Z',
      },
      {
        person_id: config.childId!,
        family_id: config.familyId,
        person_type: 'CHILD',
        parent_role: null,
        display_name: '孩子',
        birth_date: '2012-06-01',
        account_id: null,
        created_at: '2026-08-09T00:00:00.000Z',
        updated_at: '2026-08-09T00:00:00.000Z',
      },
    ],
    relationships: [],
    lifeStages: [
      {
        assignment_id: 'life-stage-1',
        family_id: config.familyId,
        child_id: config.childId!,
        life_stage_code: 'EARLY_ADOLESCENCE_12_15',
        effective_from: '2026-08-09T00:00:00.000Z',
        effective_to: null,
        source: 'MANUAL',
        created_at: '2026-08-09T00:00:00.000Z',
      },
    ],
    consents: [],
    currentOnboarding,
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

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

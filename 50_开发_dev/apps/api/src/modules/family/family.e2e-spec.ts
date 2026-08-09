import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families E2E', () => {
  let app: INestApplication;
  let baseUrl: string;
  let pool: pg.Pool;

  beforeAll(async () => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('E2E-01 creates a family through real HTTP with 201 response', async () => {
    const response = await postFamily({ display_name: '王家', idempotency_key: 'e2e-valid-1' }, 'corr-e2e-01');
    const body = await response.json() as CreateFamilyHttpResponse;

    expect(response.status).toBe(201);
    expect(body.family.family_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.family.display_name).toBe('王家');
    expect(body.family.status).toBe('ACTIVE');
    expect(body.family.version).toBe(1);
    expect(typeof body.family.created_at).toBe('string');
  });

  it('E2E-02 rejects client supplied family_id and does not create a family', async () => {
    const response = await postFamily({
      family_id: '11111111-1111-1111-1111-111111111111',
      display_name: '王家',
      idempotency_key: 'e2e-invalid-family-id',
    }, 'corr-e2e-02');
    const families = await pool.query('select family_id from families');

    expect(response.status).toBe(400);
    expect(await errorStatus(response)).toBe(400);
    expect(families.rowCount).toBe(0);
  });

  it('E2E-03 rejects missing or invalid display_name', async () => {
    const response = await postFamily({ idempotency_key: 'e2e-invalid-display' }, 'corr-e2e-03');

    expect(response.status).toBe(400);
    expect(await errorStatus(response)).toBe(400);
  });

  it('E2E-04 rejects missing actor context with OpenAPI-aligned 401', async () => {
    const response = await fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'corr-e2e-04',
        'x-source': 'vitest-e2e',
        'idempotency-key': 'e2e-missing-actor',
      },
      body: JSON.stringify({ display_name: '王家', idempotency_key: 'e2e-missing-actor' }),
    });

    expect(response.status).toBe(401);
    expect(await errorStatus(response)).toBe(401);
  });

  it('E2E-05 replays same idempotency key with same payload', async () => {
    const first = await postFamily({ display_name: '王家', idempotency_key: 'e2e-idem-same' }, 'corr-e2e-05');
    const second = await postFamily({ display_name: '王家', idempotency_key: 'e2e-idem-same' }, 'corr-e2e-05');
    const firstBody = await first.json() as CreateFamilyHttpResponse;
    const secondBody = await second.json() as CreateFamilyHttpResponse;
    const families = await pool.query('select family_id from families');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(secondBody).toEqual(firstBody);
    expect(families.rowCount).toBe(1);
  });

  it('E2E-06 rejects same idempotency key with different payload', async () => {
    await postFamily({ display_name: '王家', idempotency_key: 'e2e-idem-conflict' }, 'corr-e2e-06');
    const response = await postFamily({ display_name: '李家', idempotency_key: 'e2e-idem-conflict' }, 'corr-e2e-06');

    expect(response.status).toBe(409);
    expect(await errorStatus(response)).toBe(409);
  });

  it('E2E-07 propagates correlation id to audit and outbox', async () => {
    const correlationId = 'corr-e2e-07';
    const response = await postFamily({ display_name: '王家', idempotency_key: 'e2e-correlation' }, correlationId);
    const body = await response.json() as CreateFamilyHttpResponse;
    const audit = await pool.query('select correlation_id from audit_logs where resource_id = $1', [body.family.family_id]);
    const outbox = await pool.query('select correlation_id from outbox_events where aggregate_id = $1', [body.family.family_id]);

    expect(audit.rows[0]?.correlation_id).toBe(correlationId);
    expect(outbox.rows[0]?.correlation_id).toBe(correlationId);
  });

  it('E2E-08 creates only expected database side effects', async () => {
    await postFamily({ display_name: '王家', idempotency_key: 'e2e-side-effects' }, 'corr-e2e-08');

    await expectCount('families', 1);
    await expectCount('audit_logs', 1);
    await expectCount('outbox_events', 1);
    await expectCount('idempotency_keys', 1);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_journeys', 0);
  });

  it('E2E-M2-101 starts growth onboarding through real HTTP without AI consent', async () => {
    const correlationId = 'corr-e2e-m2-101';
    const familyResponse = await postFamily({ display_name: '青春期沟通家庭', idempotency_key: 'e2e-m2-family' }, correlationId);
    const familyBody = await familyResponse.json() as CreateFamilyHttpResponse;
    const parentBody = await postJson<{ parent: { person_id: string } }>(`/families/${familyBody.family.family_id}/parents`, {
      role: 'GUARDIAN',
      display_name: '监护人',
      account_id: 'architect-1',
      idempotency_key: 'e2e-m2-parent',
    }, correlationId);
    const childBody = await postJson<{ child: { person_id: string } }>(`/families/${familyBody.family.family_id}/children`, {
      display_name: '孩子',
      birth_date: '2012-06-01',
      idempotency_key: 'e2e-m2-child',
    }, correlationId);

    await postJson(`/families/${familyBody.family.family_id}/relationships`, {
      person_a_id: parentBody.parent.person_id,
      person_b_id: childBody.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: 'e2e-m2-relationship',
    }, correlationId);
    await postJson(`/families/${familyBody.family.family_id}/life-stages`, {
      child_id: childBody.child.person_id,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-08-10T00:00:00.000Z',
      idempotency_key: 'e2e-m2-life-stage',
    }, correlationId);

    for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'] as const) {
      await postJson(`/families/${familyBody.family.family_id}/consents`, {
        subjectPersonId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        purpose,
        policyVersion: 'm2-101-e2e',
      }, correlationId, `e2e-m2-consent-${purpose}`);
    }

    const onboardingResponse = await fetch(`${baseUrl}/families/${familyBody.family.family_id}/growth/onboarding`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': 'e2e-m2-start-onboarding',
      },
      body: JSON.stringify({
        childId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingResponse.json() as StartGrowthOnboardingHttpResponse;

    expect(onboardingResponse.status).toBe(201);
    expect(onboardingBody.onboarding).toMatchObject({
      family_id: familyBody.family.family_id,
      child_id: childBody.child.person_id,
      guardian_person_id: parentBody.parent.person_id,
      journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      target_dimensions: ['P03', 'R03', 'R04', 'R05'],
      status: 'ACTIVE',
      phase: 'ONBOARDING',
      safety_screening_result: 'LOW',
      ai_personalization_enabled: false,
    });

    await expectCount('growth_journeys', 1);
    const audit = await pool.query('select correlation_id from audit_logs where action_name = $1', ['StartGrowthOnboarding']);
    const outbox = await pool.query('select correlation_id from outbox_events where event_name = $1', ['GrowthOnboardingStarted']);
    const growthEvent = await pool.query('select payload from growth_events where event_type = $1', ['GrowthOnboardingStarted']);
    expect(audit.rows[0]?.correlation_id).toBe(correlationId);
    expect(outbox.rows[0]?.correlation_id).toBe(correlationId);
    expect(growthEvent.rows[0]?.payload?.ai_personalization_enabled).toBe(false);
  });

  it('E2E-M2-102 records parent and child perspectives through real HTTP and rejects client final severity', async () => {
    const correlationId = 'corr-e2e-m2-102';
    const setup = await seedM2Onboarding(correlationId);

    const parentResponse = await postPerspective(setup.familyId, setup.onboardingId, {
      subjectPersonId: setup.childId,
      authorPersonId: setup.parentId,
      perspectiveType: 'PARENT_PERSPECTIVE',
      captureMode: 'DIRECT_SELF_REPORT',
      relatedDimensionIds: ['P03', 'R03'],
      content: {
        promptId: 'parent-friction-v1',
        responseText: '我觉得我们最近一说学习就容易吵起来。',
        selectedSignals: ['interrupts', 'argues'],
      },
      structuredSafetySignals: ['NONE'],
    }, correlationId, 'e2e-m2-102-parent');
    const parentBody = await parentResponse.json() as RecordPerspectiveHttpResponse;
    const childResponse = await postPerspective(setup.familyId, setup.onboardingId, {
      subjectPersonId: setup.childId,
      authorPersonId: setup.childId,
      perspectiveType: 'CHILD_PERSPECTIVE',
      captureMode: 'FACILITATED_ENTRY',
      relatedDimensionIds: ['R03', 'R04'],
      content: {
        promptId: 'child-friction-v1',
        responseText: '我希望妈妈先听我说完再评价。',
        selectedSignals: ['wants-to-be-heard'],
      },
      structuredSafetySignals: ['NONE'],
    }, correlationId, 'e2e-m2-102-child');
    const childBody = await childResponse.json() as RecordPerspectiveHttpResponse;

    expect(parentResponse.status).toBe(201);
    expect(childResponse.status).toBe(201);
    expect(parentBody.perspective).toMatchObject({
      family_id: setup.familyId,
      onboarding_id: setup.onboardingId,
      subject_person_id: setup.childId,
      author_person_id: setup.parentId,
      recorded_by_actor_id: 'architect-1',
      perspective_type: 'PARENT_PERSPECTIVE',
      capture_mode: 'DIRECT_SELF_REPORT',
      fact_boundary: 'PERSPECTIVE_NOT_FACT',
      safety_disposition: {
        severity: 'LOW',
        disposition: 'NORMAL',
        policy_version: 'M2_102_DETERMINISTIC_V1',
        signals: ['NONE'],
      },
    });
    expect(parentBody.evidence).toMatchObject({
      perspective_id: parentBody.perspective.perspective_id,
      evidence_type: 'SELF_REPORT',
      source: 'PARENT',
      evidence_level: 'E1',
    });
    expect(childBody.evidence.source).toBe('CHILD');

    const summaryResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/perspectives`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
        'x-actor-id': 'architect-1',
      },
    });
    const summary = await summaryResponse.json() as PerspectiveSummaryHttpResponse;
    expect(summaryResponse.status).toBe(200);
    expect(summary.perspectives.map((item) => item.perspective_type)).toEqual(['PARENT_PERSPECTIVE', 'CHILD_PERSPECTIVE']);
    expect(summary.evidence).toHaveLength(2);

    const rejected = await postPerspective(setup.familyId, setup.onboardingId, {
      subjectPersonId: setup.childId,
      authorPersonId: setup.parentId,
      perspectiveType: 'PARENT_PERSPECTIVE',
      captureMode: 'DIRECT_SELF_REPORT',
      relatedDimensionIds: ['P03'],
      content: {
        promptId: 'invalid-severity-v1',
        responseText: '客户端不能提交最终安全等级。',
        selectedSignals: [],
      },
      structuredSafetySignals: ['NONE'],
      safetySeverity: 'LOW',
    }, correlationId, 'e2e-m2-102-client-severity');
    expect(rejected.status).toBe(400);
    expect(await errorStatus(rejected)).toBe(400);

    await expectCount('perspectives', 2);
    await expectCount('evidence_records', 2);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_priorities', 0);
  });

  it('E2E-M2-103 builds insight drafts and confirms one limited profile through real HTTP', async () => {
    const correlationId = 'corr-e2e-m2-103';
    const setup = await seedM2Onboarding(correlationId);
    await seedM2PerspectivePair(setup, correlationId);

    const draftsResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/profile-drafts`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': 'e2e-m2-103-build-drafts',
      },
      body: JSON.stringify({}),
    });
    const draftsBody = await draftsResponse.json() as GrowthProfileDraftsHttpResponse;

    expect(draftsResponse.status).toBe(201);
    expect(draftsBody.drafts).toHaveLength(4);
    expect(draftsBody.drafts.find((draft) => draft.dimension_id === 'P03')).toMatchObject({
      profile_scope: 'PARENT_GROWTH_PROFILE',
      subject_person_id: setup.parentId,
      subject_relationship_id: null,
      candidate_state: 'UNRESOLVED',
      confidence: 'LOW',
      status: 'REVIEW_REQUIRED',
    });
    expect(draftsBody.drafts.find((draft) => draft.dimension_id === 'R03')).toMatchObject({
      profile_scope: 'RELATIONSHIP_GROWTH_PROFILE',
      candidate_state: 'DEVELOPING',
      status: 'DRAFT',
    });
    expect(draftsBody.drafts.find((draft) => draft.dimension_id === 'R05')).toMatchObject({
      candidate_state: 'UNRESOLVED',
      status: 'REVIEW_REQUIRED',
    });

    const insightResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/insight`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
        'x-actor-id': 'architect-1',
      },
    });
    const insightBody = await insightResponse.json() as GrowthInsightHttpResponse;
    const draftToConfirm = draftsBody.drafts.find((draft) => draft.dimension_id === 'R03');
    expect(draftToConfirm).toBeDefined();

    expect(insightResponse.status).toBe(200);
    expect(insightBody.parent_profile_drafts).toHaveLength(1);
    expect(insightBody.relationship_profile_drafts).toHaveLength(3);
    expect(insightBody.confirmed_profiles).toHaveLength(0);

    const confirmResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/profile-drafts/${draftToConfirm!.draft_id}/confirm`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': 'e2e-m2-103-confirm-r03',
      },
      body: JSON.stringify({}),
    });
    const confirmBody = await confirmResponse.json() as ConfirmGrowthProfileHttpResponse;

    expect(confirmResponse.status).toBe(201);
    expect(confirmBody.profile).toMatchObject({
      profile_scope: 'RELATIONSHIP_GROWTH_PROFILE',
      dimension_id: 'R03',
      state: 'DEVELOPING',
      confidence: 'MEDIUM',
      status: 'WORKING',
      policy_version: 'M2_103_DETERMINISTIC_V1',
    });
    expect(confirmBody.profile.basis.fact_boundary).toBe('PROFILE_IS_INTERPRETIVE_NOT_FACT');
    expect(confirmBody.profile.evidence_snapshot.evidence_ids).toHaveLength(2);
    expect(confirmBody.draft.status).toBe('CONFIRMED');

    await expectCount('growth_profile_drafts', 4);
    await expectCount('growth_profiles', 1);
    await expectCount('growth_profile_dimensions', 1);
    await expectCount('growth_priorities', 0);
    const aiEvents = await pool.query("select count(*)::int as count from outbox_events where event_name like 'AI%' or event_name like 'Model%'");
    expect(aiEvents.rows[0].count).toBe(0);
  });

  async function postFamily(body: Record<string, unknown>, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': String(body.idempotency_key ?? 'missing'),
      },
      body: JSON.stringify(body),
    });
  }

  async function postJson<TBody = unknown>(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<TBody> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);
    return await response.json() as TBody;
  }

  async function seedM2Onboarding(correlationId: string): Promise<{ familyId: string; parentId: string; childId: string; onboardingId: string }> {
    const familyResponse = await postFamily({ display_name: '青春期沟通家庭', idempotency_key: `e2e-m2-family-${correlationId}` }, correlationId);
    const familyBody = await familyResponse.json() as CreateFamilyHttpResponse;
    const parentBody = await postJson<{ parent: { person_id: string } }>(`/families/${familyBody.family.family_id}/parents`, {
      role: 'GUARDIAN',
      display_name: '监护人',
      account_id: 'architect-1',
      idempotency_key: `e2e-m2-parent-${correlationId}`,
    }, correlationId);
    const childBody = await postJson<{ child: { person_id: string } }>(`/families/${familyBody.family.family_id}/children`, {
      display_name: '孩子',
      birth_date: '2012-06-01',
      idempotency_key: `e2e-m2-child-${correlationId}`,
    }, correlationId);

    await postJson(`/families/${familyBody.family.family_id}/relationships`, {
      person_a_id: parentBody.parent.person_id,
      person_b_id: childBody.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: `e2e-m2-relationship-${correlationId}`,
    }, correlationId);
    await postJson(`/families/${familyBody.family.family_id}/life-stages`, {
      child_id: childBody.child.person_id,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-08-10T00:00:00.000Z',
      idempotency_key: `e2e-m2-life-stage-${correlationId}`,
    }, correlationId);

    for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'] as const) {
      await postJson(`/families/${familyBody.family.family_id}/consents`, {
        subjectPersonId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        purpose,
        policyVersion: 'm2-102-e2e',
      }, correlationId, `e2e-m2-consent-${purpose}-${correlationId}`);
    }

    const onboardingResponse = await fetch(`${baseUrl}/families/${familyBody.family.family_id}/growth/onboarding`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': `e2e-m2-start-onboarding-${correlationId}`,
      },
      body: JSON.stringify({
        childId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingResponse.json() as StartGrowthOnboardingHttpResponse;
    expect(onboardingResponse.status).toBe(201);

    return {
      familyId: familyBody.family.family_id,
      parentId: parentBody.parent.person_id,
      childId: childBody.child.person_id,
      onboardingId: onboardingBody.onboarding.onboarding_id,
    };
  }

  async function postPerspective(familyId: string, onboardingId: string, body: Record<string, unknown>, correlationId: string, idempotencyKey: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });
  }

  async function seedM2PerspectivePair(setup: { familyId: string; parentId: string; childId: string; onboardingId: string }, correlationId: string): Promise<void> {
    const parentResponse = await postPerspective(setup.familyId, setup.onboardingId, {
      subjectPersonId: setup.childId,
      authorPersonId: setup.parentId,
      perspectiveType: 'PARENT_PERSPECTIVE',
      captureMode: 'DIRECT_SELF_REPORT',
      relatedDimensionIds: ['P03', 'R03'],
      content: {
        promptId: 'parent-m2-103-v1',
        responseText: '我发现自己经常还没听完就开始评价。',
        selectedSignals: ['interrupts', 'evaluates-too-fast'],
      },
      structuredSafetySignals: ['NONE'],
    }, correlationId, `e2e-m2-103-parent-${correlationId}`);
    const childResponse = await postPerspective(setup.familyId, setup.onboardingId, {
      subjectPersonId: setup.childId,
      authorPersonId: setup.childId,
      perspectiveType: 'CHILD_PERSPECTIVE',
      captureMode: 'FACILITATED_ENTRY',
      relatedDimensionIds: ['R03', 'R04'],
      content: {
        promptId: 'child-m2-103-v1',
        responseText: '我希望大人先听我讲完，再一起想办法。',
        selectedSignals: ['wants-to-be-heard'],
      },
      structuredSafetySignals: ['NONE'],
    }, correlationId, `e2e-m2-103-child-${correlationId}`);

    expect(parentResponse.status).toBe(201);
    expect(childResponse.status).toBe(201);
  }

  async function errorStatus(response: Response): Promise<number> {
    const body = await response.json() as { statusCode?: number };
    return body.statusCode ?? 0;
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

interface CreateFamilyHttpResponse {
  family: {
    family_id: string;
    display_name: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    version: number;
    created_at: string;
  };
}

interface StartGrowthOnboardingHttpResponse {
  onboarding: {
    onboarding_id: string;
    family_id: string;
    child_id: string;
    guardian_person_id: string;
    journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT';
    life_stage_code: 'EARLY_ADOLESCENCE_12_15';
    target_dimensions: ['P03', 'R03', 'R04', 'R05'];
    status: 'ACTIVE';
    phase: 'ONBOARDING';
    safety_screening_result: 'LOW';
    ai_personalization_enabled: false;
  };
}

interface RecordPerspectiveHttpResponse {
  perspective: {
    perspective_id: string;
    family_id: string;
    onboarding_id: string;
    subject_person_id: string;
    author_person_id: string;
    recorded_by_actor_id: string;
    perspective_type: 'PARENT_PERSPECTIVE' | 'CHILD_PERSPECTIVE';
    capture_mode: 'DIRECT_SELF_REPORT' | 'FACILITATED_ENTRY' | 'PROXY_REPORTED';
    related_dimension_ids: string[];
    fact_boundary: 'PERSPECTIVE_NOT_FACT';
    safety_disposition: {
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      disposition: 'NORMAL' | 'SAFETY_ESCALATION';
      policy_version: 'M2_102_DETERMINISTIC_V1';
      signals: string[];
    };
  };
  evidence: {
    evidence_id: string;
    perspective_id: string;
    evidence_type: 'SELF_REPORT';
    source: 'PARENT' | 'CHILD' | 'FACILITATOR';
    evidence_level: 'E1';
  };
}

interface PerspectiveSummaryHttpResponse {
  perspectives: RecordPerspectiveHttpResponse['perspective'][];
  evidence: RecordPerspectiveHttpResponse['evidence'][];
}

interface GrowthProfileDraftHttpDto {
  draft_id: string;
  profile_scope: 'PARENT_GROWTH_PROFILE' | 'RELATIONSHIP_GROWTH_PROFILE';
  subject_person_id: string | null;
  subject_relationship_id: string | null;
  dimension_id: 'P03' | 'R03' | 'R04' | 'R05';
  candidate_state: 'UNRESOLVED' | 'EMERGING' | 'DEVELOPING' | 'PRACTICING' | 'STABILIZING';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'DRAFT' | 'CONFIRMED' | 'STALE' | 'REVIEW_REQUIRED';
  synthesis: {
    fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT';
  };
  evidence_snapshot: {
    evidence_ids: string[];
  };
}

interface GrowthProfileDraftsHttpResponse {
  drafts: GrowthProfileDraftHttpDto[];
}

interface GrowthInsightHttpResponse {
  parent_profile_drafts: GrowthProfileDraftHttpDto[];
  relationship_profile_drafts: GrowthProfileDraftHttpDto[];
  confirmed_profiles: GrowthProfileHttpDto[];
}

interface ConfirmGrowthProfileHttpResponse {
  draft: GrowthProfileDraftHttpDto;
  profile: GrowthProfileHttpDto;
}

interface GrowthProfileHttpDto {
  profile_scope: 'PARENT_GROWTH_PROFILE' | 'RELATIONSHIP_GROWTH_PROFILE';
  dimension_id: 'P03' | 'R03' | 'R04' | 'R05';
  state: 'EMERGING' | 'DEVELOPING' | 'PRACTICING' | 'STABILIZING';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'WORKING' | 'SUPERSEDED' | 'ARCHIVED';
  policy_version: 'M2_103_DETERMINISTIC_V1';
  basis: {
    fact_boundary: 'PROFILE_IS_INTERPRETIVE_NOT_FACT';
  };
  evidence_snapshot: {
    evidence_ids: string[];
  };
}
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';

interface PgAvailability {
  ready: boolean;
  reason: string;
}

const pgAvailability: PgAvailability = { ready: false, reason: 'TEST_DATABASE_URL_NOT_CHECKED' };

let app: INestApplication | undefined;
let baseUrl = '';
let pool: pg.Pool | undefined;

beforeAll(async () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    pgAvailability.reason = 'PENDING_REAL_POSTGRESQL: TEST_DATABASE_URL is not set';
    return;
  }

  try {
    process.env.DATABASE_URL = testDatabaseUrl;
    pool = createTestPool();
    await pool.query('select 1');
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    await app.listen(0);
    baseUrl = await app.getUrl();
    pgAvailability.ready = true;
    pgAvailability.reason = 'REAL_POSTGRESQL_READY';
  } catch (error) {
    pgAvailability.ready = false;
    pgAvailability.reason = `PENDING_REAL_POSTGRESQL: ${(error as Error).message}`;
    await app?.close();
    await pool?.end();
    app = undefined;
    pool = undefined;
  }
});

beforeEach(async () => {
  if (!pgAvailability.ready || !pool) {
    return;
  }
  await cleanFamilyCoreTables(pool);
});

afterAll(async () => {
  await app?.close();
  await pool?.end();
});

describe('M2 Wave2 PostgreSQL + HTTP E2E readiness', () => {
  it('reports real PostgreSQL availability without faking PASS', () => {
    expect(pgAvailability.reason).toMatch(/REAL_POSTGRESQL_READY|PENDING_REAL_POSTGRESQL/);
  });
});

describe('M2 Wave2 PostgreSQL + HTTP E2E', () => {
  it('E2E-W2-01 happy path confirms priority, starts intervention, completes action, and creates no outcome-like or AI side effects', async (context) => {
    skipIfPostgresUnavailable(context);
    const setup = await seedConfirmedProfile('corr-w2-happy');

    const insightResponse = await getPriorityInsight(setup.familyId, setup.onboardingId);
    const insight = await insightResponse.json() as GrowthPriorityInsightHttpResponse;

    expect(insightResponse.status).toBe(200);
    expect(insight.draft.candidate?.dimension_id).toBe('R03');
    expect(insight.active_priority).toBeNull();

    const confirmResponse = await confirmPriority(setup.familyId, setup.onboardingId, insight.draft.draft_id, 'R03', 'corr-w2-happy', 'idem-w2-confirm-r03');
    const confirm = await confirmResponse.json() as ConfirmGrowthPriorityHttpResponse;

    expect(confirmResponse.status).toBe(201);
    expect(confirm.priority).toMatchObject({
      family_id: setup.familyId,
      onboarding_id: setup.onboardingId,
      profile_id: setup.profileId,
      dimension_id: 'R03',
      status: 'ACTIVE',
      boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
    });

    const cardResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/interventions/LISTEN_BEFORE_RESPOND`, {
      headers: baseHeaders('corr-w2-card'),
    });
    expect(cardResponse.status).toBe(200);
    expect((await cardResponse.json() as { intervention_code: string }).intervention_code).toBe('LISTEN_BEFORE_RESPOND');

    const startResponse = await startIntervention(setup.familyId, setup.onboardingId, confirm.priority!.priority_id, 'corr-w2-happy', 'idem-w2-start-intervention');
    const start = await startResponse.json() as StartInterventionHttpResponse;

    expect(startResponse.status).toBe(201);
    expect(start.intervention.intervention_code).toBe('LISTEN_BEFORE_RESPOND');
    expect(start.episode).toMatchObject({
      family_id: setup.familyId,
      onboarding_id: setup.onboardingId,
      priority_id: confirm.priority!.priority_id,
      status: 'ACTIVE',
      planned_days: 7,
    });
    expect(start.actions).toHaveLength(7);
    expect(start.actions.map((action) => action.day_index)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(start.actions.every((action) => action.boundary === 'ACTION_IS_NOT_OUTCOME')).toBe(true);

    const activeResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/interventions/active`, {
      headers: baseHeaders('corr-w2-active'),
    });
    const active = await activeResponse.json() as StartInterventionHttpResponse;
    expect(activeResponse.status).toBe(200);
    expect(active.episode.episode_id).toBe(start.episode.episode_id);
    expect(active.actions).toHaveLength(7);

    const todayResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/actions/today`, {
      headers: baseHeaders('corr-w2-today'),
    });
    const today = await todayResponse.json() as GrowthActionHttpDto;
    expect(todayResponse.status).toBe(200);
    expect(today.action_id).toBe(start.actions[0].action_id);
    expect(today.status).toBe('PENDING');

    const completeResponse = await completeAction(setup.familyId, start.actions[0].action_id, 'corr-w2-happy', 'idem-w2-complete-action', {
      completion_status: 'COMPLETED',
      reflection: '今天我先停下来听孩子讲完,没有马上给建议。',
      occurred_at: '2026-08-10T12:00:00.000Z',
    });
    const complete = await completeResponse.json() as CompleteGrowthActionHttpResponse;

    expect(completeResponse.status).toBe(201);
    expect(complete.action).toMatchObject({
      action_id: start.actions[0].action_id,
      status: 'COMPLETED',
      completion_status: 'COMPLETED',
      reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME',
      boundary: 'ACTION_IS_NOT_OUTCOME',
    });
    expect(complete.reflection_boundary).toBe('REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME');

    await expectCount('growth_priorities', 1);
    await expectCount('intervention_episodes', 1);
    await expectCount('growth_actions', 7);
    await expectOutcomeLikeTablesEmpty();
    await expectNoAiLikeSideEffects();
    await expectAuditActions(['ConfirmGrowthPriority', 'StartIntervention', 'CompleteGrowthAction']);
    await expectOutboxEvents(['GrowthPriorityConfirmed', 'InterventionStarted', 'GrowthActionCompleted']);
  });

  it('E2E-W2-02 revoked or missing consent blocks priority, intervention, and action flow without side effects', async (context) => {
    skipIfPostgresUnavailable(context);
    const missingConsentSetup = await seedConfirmedProfile('corr-w2-missing-consent');
    await pool!.query(
      `delete from consents where family_id = $1 and subject_person_id = $2 and purpose = 'GROWTH_TRACKING'`,
      [missingConsentSetup.familyId, missingConsentSetup.childId],
    );
    const missingInsight = await (await getPriorityInsight(missingConsentSetup.familyId, missingConsentSetup.onboardingId)).json() as GrowthPriorityInsightHttpResponse;
    const missingConfirm = await confirmPriority(missingConsentSetup.familyId, missingConsentSetup.onboardingId, missingInsight.draft.draft_id, 'R03', 'corr-w2-missing-consent', 'idem-w2-missing-consent-confirm');

    expect(missingConfirm.status).toBe(403);
    await expectCount('growth_priorities', 0);
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);

    await cleanFamilyCoreTables(pool!);
    const revokedSetup = await seedConfirmedProfile('corr-w2-revoked-consent');
    const revokedInsight = await (await getPriorityInsight(revokedSetup.familyId, revokedSetup.onboardingId)).json() as GrowthPriorityInsightHttpResponse;
    const confirmed = await (await confirmPriority(revokedSetup.familyId, revokedSetup.onboardingId, revokedInsight.draft.draft_id, 'R03', 'corr-w2-revoked-consent', 'idem-w2-revoked-confirm')).json() as ConfirmGrowthPriorityHttpResponse;
    const started = await (await startIntervention(revokedSetup.familyId, revokedSetup.onboardingId, confirmed.priority!.priority_id, 'corr-w2-revoked-consent', 'idem-w2-revoked-start')).json() as StartInterventionHttpResponse;

    await revokeConsent(revokedSetup.familyId, revokedSetup.childId, 'GROWTH_TRACKING');

    const blockedIntervention = await startIntervention(revokedSetup.familyId, revokedSetup.onboardingId, confirmed.priority!.priority_id, 'corr-w2-revoked-consent', 'idem-w2-revoked-start-2');
    const blockedAction = await completeAction(revokedSetup.familyId, started.actions[0].action_id, 'corr-w2-revoked-consent', 'idem-w2-revoked-complete', {
      completion_status: 'COMPLETED',
      reflection: '应被撤回 consent 阻止。',
      occurred_at: '2026-08-10T12:00:00.000Z',
    });

    expect(blockedIntervention.status).toBe(403);
    expect(blockedAction.status).toBe(403);
    await expectCount('growth_priorities', 1);
    await expectCount('intervention_episodes', 1);
    await expectCount('growth_actions', 7);
    await expectCompletedActionCount(0);
    await expectOutcomeLikeTablesEmpty();
  });

  it('E2E-W2-03 safety escalation blocks normal Wave2 continuation without priority/intervention/action side effects', async (context) => {
    skipIfPostgresUnavailable(context);
    const setup = await seedConfirmedProfile('corr-w2-safety');
    await pool!.query(
      `update perspectives
       set safety_disposition = '{"severity":"MEDIUM","disposition":"HUMAN_REVIEW","policy_version":"M2_102_DETERMINISTIC_V1","signals":["HUMAN_REVIEW_REQUIRED"]}'::jsonb
       where family_id = $1 and onboarding_id = $2`,
      [setup.familyId, setup.onboardingId],
    );
    const insight = await (await getPriorityInsight(setup.familyId, setup.onboardingId)).json() as GrowthPriorityInsightHttpResponse;
    const confirm = await confirmPriority(setup.familyId, setup.onboardingId, insight.draft.draft_id, 'R03', 'corr-w2-safety', 'idem-w2-safety-confirm');

    expect(confirm.status).toBe(403);
    await expectCount('growth_priorities', 0);
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);
    await expectOutcomeLikeTablesEmpty();
  });

  it('E2E-W2-04 forbidden fields are rejected and do not mutate Wave2 state', async (context) => {
    skipIfPostgresUnavailable(context);
    const setup = await seedConfirmedProfile('corr-w2-forbidden');
    const insight = await (await getPriorityInsight(setup.familyId, setup.onboardingId)).json() as GrowthPriorityInsightHttpResponse;

    const forbiddenPriority = await postJson(`/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/priority/confirm`, {
      draft_id: insight.draft.draft_id,
      decision: 'R03',
      priority_id: '11111111-1111-4111-8111-111111111111',
    }, 'corr-w2-forbidden', 'idem-w2-forbidden-priority');
    expect(forbiddenPriority.status).toBe(400);
    await expectCount('growth_priorities', 0);

    const confirmed = await (await confirmPriority(setup.familyId, setup.onboardingId, insight.draft.draft_id, 'R03', 'corr-w2-forbidden', 'idem-w2-forbidden-confirm-valid')).json() as ConfirmGrowthPriorityHttpResponse;
    const forbiddenIntervention = await postJson(`/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/interventions/start`, {
      priority_id: confirmed.priority!.priority_id,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      episode_id: '11111111-1111-4111-8111-111111111111',
    }, 'corr-w2-forbidden', 'idem-w2-forbidden-intervention');
    expect(forbiddenIntervention.status).toBe(400);
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);

    const started = await (await startIntervention(setup.familyId, setup.onboardingId, confirmed.priority!.priority_id, 'corr-w2-forbidden', 'idem-w2-forbidden-start-valid')).json() as StartInterventionHttpResponse;
    const forbiddenAction = await completeAction(setup.familyId, started.actions[0].action_id, 'corr-w2-forbidden', 'idem-w2-forbidden-action', {
      completion_status: 'COMPLETED',
      reflection: '字段白名单测试。',
      occurred_at: '2026-08-10T12:00:00.000Z',
      outcome_id: '11111111-1111-4111-8111-111111111111',
    });

    expect(forbiddenAction.status).toBe(400);
    await expectCompletedActionCount(0);
    await expectOutcomeLikeTablesEmpty();
  });

  it('E2E-W2-05 no-priority decision and stale draft do not create hidden state', async (context) => {
    skipIfPostgresUnavailable(context);
    const setup = await seedConfirmedProfile('corr-w2-no-priority');
    const insight = await (await getPriorityInsight(setup.familyId, setup.onboardingId)).json() as GrowthPriorityInsightHttpResponse;

    const noPriority = await confirmPriority(setup.familyId, setup.onboardingId, insight.draft.draft_id, 'NO_PRIORITY_YET', 'corr-w2-no-priority', 'idem-w2-no-priority');
    const noPriorityBody = await noPriority.json() as ConfirmGrowthPriorityHttpResponse;
    expect(noPriority.status).toBe(201);
    expect(noPriorityBody.priority).toBeNull();
    await expectCount('growth_priorities', 0);
    await expectCount('intervention_episodes', 0);
    await expectCount('growth_actions', 0);

    const stale = await confirmPriority(setup.familyId, setup.onboardingId, '11111111-1111-4111-8111-111111111111', 'R03', 'corr-w2-no-priority', 'idem-w2-stale-priority');
    expect(stale.status).toBe(409);
    await expectCount('growth_priorities', 0);
  });
});

function skipIfPostgresUnavailable(context: { skip: (note?: string) => void }): void {
  if (!pgAvailability.ready) {
    context.skip(pgAvailability.reason);
  }
}

async function seedConfirmedProfile(correlationId: string, options: { grantGrowthTrackingConsent?: boolean; structuredSafetySignals?: Array<'NONE' | 'SELF_HARM' | 'HARM_TO_OTHERS' | 'ABUSE' | 'VIOLENCE' | 'SEVERE_CRISIS'> } = {}): Promise<SeededWave2State> {
  const grantGrowthTrackingConsent = options.grantGrowthTrackingConsent ?? true;
  const family = await postFamily({ display_name: 'Wave2 E2E 家庭', idempotency_key: `idem-${correlationId}-family` }, correlationId);
  const familyBody = await family.json() as CreateFamilyHttpResponse;
  expect(family.status).toBe(201);

  const parent = await postJsonExpect<{ parent: { person_id: string } }>(`/families/${familyBody.family.family_id}/parents`, {
    role: 'GUARDIAN',
    display_name: '监护人',
    account_id: 'architect-1',
    idempotency_key: `idem-${correlationId}-parent`,
  }, correlationId);
  const child = await postJsonExpect<{ child: { person_id: string } }>(`/families/${familyBody.family.family_id}/children`, {
    display_name: '孩子',
    birth_date: '2012-06-01',
    idempotency_key: `idem-${correlationId}-child`,
  }, correlationId);
  const relationship = await postJsonExpect<{ relationship: { relationship_id: string } }>(`/families/${familyBody.family.family_id}/relationships`, {
    person_a_id: parent.parent.person_id,
    person_b_id: child.child.person_id,
    relationship_type: 'GUARDIAN_CHILD',
    idempotency_key: `idem-${correlationId}-relationship`,
  }, correlationId);

  await postJsonExpect(`/families/${familyBody.family.family_id}/life-stages`, {
    child_id: child.child.person_id,
    life_stage_code: 'EARLY_ADOLESCENCE_12_15',
    effective_from: '2026-08-10T00:00:00.000Z',
    idempotency_key: `idem-${correlationId}-life-stage`,
  }, correlationId);

  const purposes: Array<'SERVICE' | 'ASSESSMENT' | 'GROWTH_TRACKING'> = ['SERVICE', 'ASSESSMENT'];
  if (grantGrowthTrackingConsent) {
    purposes.push('GROWTH_TRACKING');
  }
  for (const purpose of purposes) {
    await postJsonExpect(`/families/${familyBody.family.family_id}/consents`, {
      subjectPersonId: child.child.person_id,
      guardianPersonId: parent.parent.person_id,
      purpose,
      policyVersion: `policy-${correlationId}`,
    }, correlationId, `idem-${correlationId}-consent-${purpose}`);
  }

  const onboarding = await postJsonExpect<StartGrowthOnboardingHttpResponse>(`/families/${familyBody.family.family_id}/growth/onboarding`, {
    childId: child.child.person_id,
    guardianPersonId: parent.parent.person_id,
    structuredSafetySignals: options.structuredSafetySignals ?? ['NONE'],
  }, correlationId, `idem-${correlationId}-onboarding`);

  await seedPerspectivePair(familyBody.family.family_id, onboarding.onboarding.onboarding_id, parent.parent.person_id, child.child.person_id, correlationId);
  const drafts = await postJsonExpect<GrowthProfileDraftsHttpResponse>(`/families/${familyBody.family.family_id}/growth/onboardings/${onboarding.onboarding.onboarding_id}/profile-drafts`, {}, correlationId, `idem-${correlationId}-profile-drafts`);
  const relationshipDraft = drafts.drafts.find((draft) => draft.dimension_id === 'R03');
  expect(relationshipDraft).toBeDefined();
  const profile = await postJsonExpect<ConfirmGrowthProfileHttpResponse>(`/families/${familyBody.family.family_id}/growth/profile-drafts/${relationshipDraft!.draft_id}/confirm`, {}, correlationId, `idem-${correlationId}-confirm-profile`);

  return {
    familyId: familyBody.family.family_id,
    parentId: parent.parent.person_id,
    childId: child.child.person_id,
    relationshipId: relationship.relationship.relationship_id,
    onboardingId: onboarding.onboarding.onboarding_id,
    profileId: profile.profile.profile_id,
  };
}

async function seedPerspectivePair(familyId: string, onboardingId: string, parentId: string, childId: string, correlationId: string): Promise<void> {
  const parentResponse = await postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    subjectPersonId: childId,
    authorPersonId: parentId,
    perspectiveType: 'PARENT_PERSPECTIVE',
    captureMode: 'DIRECT_SELF_REPORT',
    relatedDimensionIds: ['P03', 'R03'],
    content: {
      promptId: 'wave2-parent-v1',
      responseText: '我经常还没听完就开始讲道理。',
      selectedSignals: ['interrupts', 'evaluates-too-fast'],
    },
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-parent-perspective`);
  const childResponse = await postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    subjectPersonId: childId,
    authorPersonId: childId,
    perspectiveType: 'CHILD_PERSPECTIVE',
    captureMode: 'FACILITATED_ENTRY',
    relatedDimensionIds: ['R03', 'R04'],
    content: {
      promptId: 'wave2-child-v1',
      responseText: '我希望大人先听我说完再回应。',
      selectedSignals: ['wants-to-be-heard'],
    },
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-child-perspective`);

  expect(parentResponse.status).toBe(201);
  expect(childResponse.status).toBe(201);
}

async function postFamily(body: Record<string, unknown>, correlationId: string): Promise<Response> {
  return postJson('/families', body, correlationId, String(body.idempotency_key ?? 'missing'));
}

async function getPriorityInsight(familyId: string, onboardingId: string): Promise<Response> {
  return fetch(`${baseUrl}/families/${familyId}/growth/onboardings/${onboardingId}/priority`, {
    method: 'GET',
    headers: baseHeaders('corr-w2-get-priority-insight'),
  });
}

async function confirmPriority(familyId: string, onboardingId: string, draftId: string, decision: GrowthPriorityDecision, correlationId: string, idempotencyKey: string): Promise<Response> {
  return postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/priority/confirm`, { draft_id: draftId, decision }, correlationId, idempotencyKey);
}

async function startIntervention(familyId: string, onboardingId: string, priorityId: string, correlationId: string, idempotencyKey: string): Promise<Response> {
  return postJson(`/families/${familyId}/growth/onboardings/${onboardingId}/interventions/start`, { priority_id: priorityId, intervention_code: 'LISTEN_BEFORE_RESPOND' }, correlationId, idempotencyKey);
}

async function completeAction(familyId: string, actionId: string, correlationId: string, idempotencyKey: string, body: Record<string, unknown>): Promise<Response> {
  return postJson(`/families/${familyId}/growth/actions/${actionId}/complete`, body, correlationId, idempotencyKey);
}

async function postJson(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: baseHeaders(correlationId, idempotencyKey),
    body: JSON.stringify(body),
  });
}

async function postJsonExpect<TBody>(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<TBody> {
  const response = await postJson(path, body, correlationId, idempotencyKey);
  expect(response.status).toBe(201);
  return await response.json() as TBody;
}

function baseHeaders(correlationId: string, idempotencyKey?: string): Record<string, string> {
  return {
    authorization: 'Bearer test-token',
    'content-type': 'application/json',
    'x-actor-id': 'architect-1',
    'x-correlation-id': correlationId,
    'x-source': 'vitest-e2e',
    ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
  };
}

async function revokeConsent(familyId: string, subjectPersonId: string, purpose: 'SERVICE' | 'ASSESSMENT' | 'GROWTH_TRACKING'): Promise<void> {
  await pool!.query(
    `update consents
     set status = 'WITHDRAWN', withdrawn_at = now()
     where family_id = $1 and subject_person_id = $2 and purpose = $3`,
    [familyId, subjectPersonId, purpose],
  );
}

async function expectCount(tableName: string, expected: number): Promise<void> {
  const result = await pool!.query(`select count(*)::int as count from ${tableName}`);
  expect(result.rows[0].count).toBe(expected);
}

async function expectOptionalTableCount(tableName: string, expected: number): Promise<void> {
  const exists = await pool!.query('select to_regclass($1) as table_name', [tableName]);
  if (!exists.rows[0].table_name) {
    return;
  }
  await expectCount(tableName, expected);
}

async function expectCompletedActionCount(expected: number): Promise<void> {
  const result = await pool!.query("select count(*)::int as count from growth_actions where completion_status is not null");
  expect(result.rows[0].count).toBe(expected);
}

async function expectOutcomeLikeTablesEmpty(): Promise<void> {
  await expectCount('outcomes', 0);
  await expectCount('milestones', 0);
  await expectOptionalTableCount('growth_reviews', 0);
}

async function expectNoAiLikeSideEffects(): Promise<void> {
  const events = await pool!.query(
    `select event_name from outbox_events
     where lower(event_name) like any($1::text[])
     order by event_name`,
    [['%ai%', '%llm%', '%model%', '%agent%', '%causal%', '%world%']],
  );
  expect(events.rows).toEqual([]);

  const tables = await pool!.query<{ table_name: string }>(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and (table_name like 'ai_%'
         or table_name like 'llm_%'
         or table_name like 'model_%'
         or table_name like 'agent_%'
         or table_name like 'causal_%'
         or table_name like 'world_%')
     order by table_name`,
  );
  for (const row of tables.rows) {
    await expectCount(row.table_name, 0);
  }
}

async function expectAuditActions(actionNames: string[]): Promise<void> {
  const result = await pool!.query<{ action_name: string }>(
    `select action_name
     from audit_logs
     where action_name = any($1::varchar[])
     order by created_at`,
    [actionNames],
  );
  expect(result.rows.map((row) => row.action_name)).toEqual(actionNames);
}

async function expectOutboxEvents(eventNames: string[]): Promise<void> {
  const result = await pool!.query<{ event_name: string }>(
    `select event_name
     from outbox_events
     where event_name = any($1::varchar[])
     order by occurred_at`,
    [eventNames],
  );
  expect(result.rows.map((row) => row.event_name)).toEqual(eventNames);
}

interface SeededWave2State {
  familyId: string;
  parentId: string;
  childId: string;
  relationshipId: string;
  onboardingId: string;
  profileId: string;
}

interface CreateFamilyHttpResponse {
  family: { family_id: string };
}

interface StartGrowthOnboardingHttpResponse {
  onboarding: { onboarding_id: string };
}

interface GrowthProfileDraftHttpDto {
  draft_id: string;
  dimension_id: 'P03' | 'R03' | 'R04' | 'R05';
}

interface GrowthProfileDraftsHttpResponse {
  drafts: GrowthProfileDraftHttpDto[];
}

interface ConfirmGrowthProfileHttpResponse {
  profile: { profile_id: string };
}

type GrowthPriorityDecision = 'P03' | 'R03' | 'R04' | 'R05' | 'NO_PRIORITY_YET';

interface GrowthPriorityInsightHttpResponse {
  draft: {
    draft_id: string;
    candidate: null | { dimension_id: 'P03' | 'R03' | 'R04' | 'R05' };
  };
  active_priority: null | GrowthPriorityHttpDto;
}

interface ConfirmGrowthPriorityHttpResponse {
  priority: null | GrowthPriorityHttpDto;
  decision: GrowthPriorityDecision;
}

interface GrowthPriorityHttpDto {
  priority_id: string;
  family_id: string;
  onboarding_id: string;
  profile_id: string;
  dimension_id: 'P03' | 'R03' | 'R04' | 'R05';
  status: 'ACTIVE' | 'SUPERSEDED';
  boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS';
}

interface StartInterventionHttpResponse {
  intervention: { intervention_code: 'LISTEN_BEFORE_RESPOND' };
  episode: {
    episode_id: string;
    family_id: string;
    onboarding_id: string;
    priority_id: string;
    status: 'ACTIVE';
    planned_days: 7;
  };
  actions: GrowthActionHttpDto[];
}

interface CompleteGrowthActionHttpResponse {
  action: GrowthActionHttpDto;
  reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME';
}

interface GrowthActionHttpDto {
  action_id: string;
  day_index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED';
  completion_status: null | 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED';
  reflection_boundary: null | 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME';
  boundary: 'ACTION_IS_NOT_OUTCOME';
}

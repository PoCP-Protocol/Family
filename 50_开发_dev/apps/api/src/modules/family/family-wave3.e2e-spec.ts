import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';

let app: INestApplication | undefined;
let baseUrl = '';
let pool: pg.Pool | undefined;

beforeAll(async () => {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error('REQUIRED_REAL_POSTGRESQL: TEST_DATABASE_URL is not set');
  }
  process.env.DATABASE_URL = testDatabaseUrl;
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});

beforeEach(async () => {
  await cleanFamilyCoreTables(pool!);
});

afterAll(async () => {
  await app?.close();
  await pool?.end();
});

describe('M2 Wave3 Observe & Review PostgreSQL + HTTP E2E', () => {
  it('W3-E2E-01 valid completed 7-day cycle completes review and exposes timeline provenance', async () => {
    const setup = await seedReadyEpisode('corr-w3-happy');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-happy');

    const parentObservationResponse = await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '父母观察到自己能先听完再回应。', 'corr-w3-happy', 'idem-w3-parent-observation');
    const parentObservation = await parentObservationResponse.json() as RecordOutcomeObservationHttpResponse;
    expect(parentObservationResponse.status).toBe(201);
    expect(parentObservation.observation).toMatchObject({
      family_id: setup.familyId,
      subject_person_id: setup.childId,
      observer_person_id: setup.parentId,
      intervention_episode_id: setup.episodeId,
      perspective_type: 'PARENT_OBSERVATION',
      boundary: 'OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT',
      policy_version: 'M2_106_DETERMINISTIC_V1',
    });

    const childObservationResponse = await recordOutcomeObservation(setup, 'CHILD_OBSERVATION', setup.childId, '孩子说这周被打断少了一些。', 'corr-w3-happy', 'idem-w3-child-observation');
    const childObservation = await childObservationResponse.json() as RecordOutcomeObservationHttpResponse;
    expect(childObservationResponse.status).toBe(201);
    expect(childObservation.observation).toMatchObject({
      observer_person_id: setup.childId,
      perspective_type: 'CHILD_OBSERVATION',
      boundary: 'OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT',
    });

    const reviewResponse = await postJson(`/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/review/complete`, {}, 'corr-w3-happy', 'idem-w3-review');
    const reviewBody = await reviewResponse.json() as CompleteGrowthReviewHttpResponse;
    expect(reviewResponse.status).toBe(201);
    expect(reviewBody.review).toMatchObject({
      family_id: setup.familyId,
      intervention_episode_id: setup.episodeId,
      priority_id: setup.priorityId,
      dimension_id: 'R03',
      status: 'COMPLETED',
      action_summary: { total_actions: 7, completed: 7, partial: 0, not_completed: 0, missing: 0 },
      boundary: 'REVIEW_IS_NOT_PROFILE_MUTATION_OR_DIAGNOSIS',
      policy_version: 'M2_106_DETERMINISTIC_V1',
    });
    expect(reviewBody.observations.map((observation) => observation.perspective_type)).toEqual(['PARENT_OBSERVATION', 'CHILD_OBSERVATION']);
    expect(reviewBody.review.limitations).toEqual(['PARENT_CHILD_DIVERGENCE']);

    const replayResponse = await postJson(`/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/review/complete`, {}, 'corr-w3-happy', 'idem-w3-review');
    expect(replayResponse.status).toBe(201);
    expect((await replayResponse.json() as CompleteGrowthReviewHttpResponse).review.review_id).toBe(reviewBody.review.review_id);

    const conflictingReview = await postJson(`/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/review/complete`, {}, 'corr-w3-happy', 'idem-w3-review-conflict');
    expect(conflictingReview.status).toBe(409);

    const decisionResponse = await postJson(`/families/${setup.familyId}/growth/reviews/${reviewBody.review.review_id}/next-step`, {
      decision: 'CONTINUE',
      rationale: '继续保持先听后回应的练习。',
    }, 'corr-w3-happy', 'idem-w3-next-step');
    const decisionBody = await decisionResponse.json() as RecordNextStepDecisionHttpResponse;
    expect(decisionResponse.status).toBe(201);
    expect(decisionBody.decision).toMatchObject({
      family_id: setup.familyId,
      review_id: reviewBody.review.review_id,
      intervention_episode_id: setup.episodeId,
      decision: 'CONTINUE',
      boundary: 'NEXT_STEP_DECISION_IS_NOT_NEXT_ACTION',
      policy_version: 'M2_106_DETERMINISTIC_V1',
    });

    const timelineResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/timeline`, {
      headers: baseHeaders('corr-w3-timeline'),
    });
    const timeline = await timelineResponse.json() as FamilyTimelineHttpResponse;
    expect(timelineResponse.status).toBe(200);
    expect(timeline.events.map((event) => event.event_type)).toEqual([
      'INTERVENTION_STARTED',
      'GROWTH_ACTION_COMPLETED',
      'GROWTH_ACTION_COMPLETED',
      'GROWTH_ACTION_COMPLETED',
      'GROWTH_ACTION_COMPLETED',
      'GROWTH_ACTION_COMPLETED',
      'GROWTH_ACTION_COMPLETED',
      'GROWTH_ACTION_COMPLETED',
      'OUTCOME_OBSERVATION_RECORDED',
      'OUTCOME_OBSERVATION_RECORDED',
      'GROWTH_REVIEW_COMPLETED',
      'NEXT_STEP_DECISION_RECORDED',
    ]);
    expect(timeline.events.every((event) => event.boundary === 'TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING')).toBe(true);
    const timelineFieldAndTypeSurface = JSON.stringify(timeline.events.map((event) => ({
      event_type: event.event_type,
      source: event.source,
      title: event.title,
      payload_keys: Object.keys(event.payload),
    }))).toLowerCase();
    expect(timelineFieldAndTypeSurface).not.toMatch(/total_score|diagnosis|ai_|llm|model|agent|causal_effect/);

    await expectCount('growth_reviews', 1);
    await expectCount('next_step_decisions', 1);
    await expectGrowthProfileUnchanged(setup.profileId);
    await expectNoAiLikeSideEffects();
    await expectAuditActions(['RecordOutcomeObservation', 'RecordOutcomeObservation', 'CompleteGrowthReview', 'RecordNextStepDecision']);
    await expectOutboxEvents(['OutcomeObservationRecorded', 'OutcomeObservationRecorded', 'GrowthReviewCompleted', 'NextStepDecisionRecorded']);
  });

  it('W3-E2E-04 blocks writes when consent is missing and blocks review when safety route is non-normal', async () => {
    const consentSetup = await seedReadyEpisode('corr-w3-consent');
    await pool!.query(
      `delete from consents where family_id = $1 and subject_person_id = $2 and purpose = 'GROWTH_TRACKING'`,
      [consentSetup.familyId, consentSetup.childId],
    );
    const blockedObservation = await recordOutcomeObservation(consentSetup, 'PARENT_OBSERVATION', consentSetup.parentId, '不应写入。', 'corr-w3-consent', 'idem-w3-consent-observation');
    expect(blockedObservation.status).toBe(403);
    await expectCount('outcome_observations', 0);

    await cleanFamilyCoreTables(pool!);
    const safetySetup = await seedReadyEpisode('corr-w3-safety');
    await pool!.query(
      `update perspectives
       set safety_disposition = '{"severity":"MEDIUM","disposition":"HUMAN_REVIEW","policy_version":"M2_102_DETERMINISTIC_V1","signals":["HUMAN_REVIEW_REQUIRED"]}'::jsonb
       where family_id = $1 and onboarding_id = $2`,
      [safetySetup.familyId, safetySetup.onboardingId],
    );
    const blockedReview = await postJson(`/families/${safetySetup.familyId}/growth/intervention-episodes/${safetySetup.episodeId}/review/complete`, {}, 'corr-w3-safety', 'idem-w3-safety-review');
    expect(blockedReview.status).toBe(403);
    await expectCount('growth_reviews', 0);
    await expectCount('next_step_decisions', 0);
  });

  it('W3-E2E-06 keeps the onboarding child canonical in a multi-child family', async () => {
    const setup = await seedReadyEpisode('corr-w3-multi-child');
    const otherChild = await postJsonExpect<{ child: { person_id: string } }>(`/families/${setup.familyId}/children`, {
      display_name: '另一个孩子',
      birth_date: '2013-06-01',
      idempotency_key: 'idem-w3-multi-child-second-child',
    }, 'corr-w3-multi-child');

    const mismatchedObservation = await postJson(`/families/${setup.familyId}/growth/outcome-observations`, {
      subject_person_id: otherChild.child.person_id,
      observer_person_id: setup.parentId,
      intervention_episode_id: setup.episodeId,
      perspective_type: 'PARENT_OBSERVATION',
      observation_text: '不能把另一个孩子写成观察对象。',
      observed_at: '2026-08-17T10:00:00.000Z',
    }, 'corr-w3-multi-child', 'idem-w3-multi-child-mismatch');

    expect(mismatchedObservation.status).toBe(409);
    await expectCount('outcome_observations', 0);

    const validObservation = await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '仍然写入原 onboarding child。', 'corr-w3-multi-child', 'idem-w3-multi-child-valid');
    expect(validObservation.status).toBe(201);
    await expectCount('outcome_observations', 1);
  });

  it('W3-E2E-02 partial evidence preserves missing check-ins as limitations without converting pending to not completed', async () => {
    const setup = await seedReadyEpisode('corr-w3-missing');
    await completeSomeActions(setup.familyId, setup.actions.slice(0, 3), 'corr-w3-missing', 'COMPLETED');
    // Direct SQL fixture setup: make the existing episode review-eligible by elapsed time; canonical actions remain HTTP-created.
    await ageEpisodePastPlannedEnd(setup.episodeId);

    const observationResponse = await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '只有前三天有记录，后面缺失。', 'corr-w3-missing', 'idem-w3-missing-observation', {
      action_refs: setup.actions.slice(0, 3).map((action) => action.action_id),
      limitations: ['第 4-7 天没有 check-in。'],
    });
    expect(observationResponse.status).toBe(201);

    const reviewResponse = await completeReview(setup, 'corr-w3-missing', 'idem-w3-missing-review');
    const reviewBody = await reviewResponse.json() as CompleteGrowthReviewHttpResponse;
    expect(reviewResponse.status).toBe(201);
    expect(reviewBody.review.action_summary).toEqual({ total_actions: 7, completed: 3, partial: 0, not_completed: 0, missing: 4 });
    expect(reviewBody.review.limitations).toContain('MISSING_CHECK_INS');
    const pendingActions = await pool!.query<{ count: number }>(`select count(*)::int as count from growth_actions where intervention_episode_id = $1 and status = 'PENDING'`, [setup.episodeId]);
    expect(pendingActions.rows[0].count).toBe(4);
  });

  it('W3-E2E-03 parent and child divergence preserves both observations separately', async () => {
    const setup = await seedReadyEpisode('corr-w3-divergence');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-divergence');
    await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '家长认为冲突明显减少。', 'corr-w3-divergence', 'idem-w3-divergence-parent');
    await recordOutcomeObservation(setup, 'CHILD_OBSERVATION', setup.childId, '孩子认为还是经常被打断。', 'corr-w3-divergence', 'idem-w3-divergence-child');

    const reviewBody = await (await completeReview(setup, 'corr-w3-divergence', 'idem-w3-divergence-review')).json() as CompleteGrowthReviewHttpResponse;
    expect(reviewBody.observations.map((observation) => observation.perspective_type)).toEqual(['PARENT_OBSERVATION', 'CHILD_OBSERVATION']);
    expect(reviewBody.observations[0].observation_text).not.toBe(reviewBody.observations[1].observation_text);
    expect(reviewBody.review.limitations).toContain('PARENT_CHILD_DIVERGENCE');
  });

  it('W3-E2E-05 non-normal safety route blocks normal review completion without diagnosis', async () => {
    const setup = await seedReadyEpisode('corr-w3-safety-only');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-safety-only');
    // Direct SQL fixture setup: simulate server-derived non-normal route established before Wave3 review.
    await pool!.query(
      `update perspectives
       set safety_disposition = '{"severity":"MEDIUM","disposition":"HUMAN_REVIEW","policy_version":"M2_102_DETERMINISTIC_V1","signals":["HUMAN_REVIEW_REQUIRED"]}'::jsonb
       where family_id = $1 and onboarding_id = $2`,
      [setup.familyId, setup.onboardingId],
    );
    const blockedReview = await completeReview(setup, 'corr-w3-safety-only', 'idem-w3-safety-only-review');
    expect(blockedReview.status).toBe(403);
    await expectCount('growth_reviews', 0);
  });

  it('W3-E2E-07 same idempotency replay returns the same safe result and unauthorized replay is blocked', async () => {
    const setup = await seedReadyEpisode('corr-w3-idem');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-idem');
    await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '可安全重放。', 'corr-w3-idem', 'idem-w3-idem-observation');

    const first = await (await completeReview(setup, 'corr-w3-idem', 'idem-w3-idem-review')).json() as CompleteGrowthReviewHttpResponse;
    const replay = await (await completeReview(setup, 'corr-w3-idem', 'idem-w3-idem-review')).json() as CompleteGrowthReviewHttpResponse;
    expect(replay.review.review_id).toBe(first.review.review_id);
    const unauthorizedReplay = await postJson(`/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/review/complete`, {}, 'corr-w3-idem', 'idem-w3-idem-review', 'not-family-actor');
    expect(unauthorizedReplay.status).toBe(403);
    await expectCount('growth_reviews', 1);
  });

  it('W3-E2E-08 different idempotency key after finalized review cannot rewrite canonical review', async () => {
    const setup = await seedReadyEpisode('corr-w3-finalized');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-finalized');
    await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '已完成复盘。', 'corr-w3-finalized', 'idem-w3-finalized-observation');
    const reviewBody = await (await completeReview(setup, 'corr-w3-finalized', 'idem-w3-finalized-review')).json() as CompleteGrowthReviewHttpResponse;

    const conflictingReview = await completeReview(setup, 'corr-w3-finalized', 'idem-w3-finalized-review-conflict');
    expect(conflictingReview.status).toBe(409);
    const stored = await pool!.query<{ review_id: string }>('select review_id from growth_reviews');
    expect(stored.rows.map((row) => row.review_id)).toEqual([reviewBody.review.review_id]);
  });

  it('W3-E2E-09 review leaves GrowthProfile unchanged', async () => {
    const setup = await seedReadyEpisode('corr-w3-profile');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-profile');
    await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '复盘不改画像。', 'corr-w3-profile', 'idem-w3-profile-observation');
    expect((await completeReview(setup, 'corr-w3-profile', 'idem-w3-profile-review')).status).toBe(201);
    await expectGrowthProfileUnchanged(setup.profileId);
  });

  it('W3-E2E-10 review creates no total score, ranking, diagnosis, or AI side effect', async () => {
    const setup = await seedReadyEpisode('corr-w3-no-ai');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-no-ai');
    await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '只记录观察，不生成诊断。', 'corr-w3-no-ai', 'idem-w3-no-ai-observation');
    const reviewBody = await (await completeReview(setup, 'corr-w3-no-ai', 'idem-w3-no-ai-review')).json() as CompleteGrowthReviewHttpResponse;
    const forbiddenBusinessSurface = JSON.stringify({
      review_keys: Object.keys(reviewBody.review),
      observation_keys: reviewBody.observations.flatMap((observation) => Object.keys(observation)),
      action_summary_keys: Object.keys(reviewBody.review.action_summary),
    }).toLowerCase();
    expect(forbiddenBusinessSurface).not.toMatch(/total_score|ranking|diagnosis|ai_|llm|model|agent|percentage/);
    await expectNoAiLikeSideEffects();
  });

  it('W3-E2E-11 Wave3 Named Actions write Audit and Outbox records', async () => {
    const setup = await seedReadyEpisode('corr-w3-audit');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-audit');
    await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, '审计和 outbox 应保留。', 'corr-w3-audit', 'idem-w3-audit-observation');
    const reviewBody = await (await completeReview(setup, 'corr-w3-audit', 'idem-w3-audit-review')).json() as CompleteGrowthReviewHttpResponse;
    const decisionResponse = await postJson(`/families/${setup.familyId}/growth/reviews/${reviewBody.review.review_id}/next-step`, {
      decision: 'ADJUST',
      rationale: '下一轮调整提醒方式，但不自动启动。',
    }, 'corr-w3-audit', 'idem-w3-audit-next-step');
    expect(decisionResponse.status).toBe(201);
    await expectAuditActions(['RecordOutcomeObservation', 'CompleteGrowthReview', 'RecordNextStepDecision']);
    await expectOutboxEvents(['OutcomeObservationRecorded', 'GrowthReviewCompleted', 'NextStepDecisionRecorded']);
  });

  it('W3-E2E-12 Timeline preserves ordering, references, and no score/ranking surface', async () => {
    const setup = await seedReadyEpisode('corr-w3-timeline-refs');
    await completeAllActions(setup.familyId, setup.actions, 'corr-w3-timeline-refs');
    const observationResponse = await recordOutcomeObservation(setup, 'PARENT_OBSERVATION', setup.parentId, 'Timeline 要显示观察来源。', 'corr-w3-timeline-refs', 'idem-w3-timeline-refs-observation', {
      action_refs: [setup.actions[0].action_id],
      reflection_refs: [setup.actions[0].action_id],
      evidence_refs: [setup.actions[1].action_id],
    });
    expect(observationResponse.status).toBe(201);
    const reviewBody = await (await completeReview(setup, 'corr-w3-timeline-refs', 'idem-w3-timeline-refs-review')).json() as CompleteGrowthReviewHttpResponse;
    await postJson(`/families/${setup.familyId}/growth/reviews/${reviewBody.review.review_id}/next-step`, {
      decision: 'PAUSE',
      rationale: '先暂停观察一周。',
    }, 'corr-w3-timeline-refs', 'idem-w3-timeline-refs-next-step');

    const timelineResponse = await fetch(`${baseUrl}/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/timeline`, {
      headers: baseHeaders('corr-w3-timeline-refs'),
    });
    const timeline = await timelineResponse.json() as FamilyTimelineHttpResponse;
    expect(timelineResponse.status).toBe(200);
    expect(timeline.events.at(0)?.event_type).toBe('INTERVENTION_STARTED');
    expect(timeline.events.map((event) => event.event_type)).toContain('OUTCOME_OBSERVATION_RECORDED');
    expect(timeline.events.map((event) => event.event_type)).toContain('GROWTH_REVIEW_COMPLETED');
    expect(timeline.events.map((event) => event.event_type)).toContain('NEXT_STEP_DECISION_RECORDED');
    const forbiddenTimelineBusinessSurface = JSON.stringify(timeline.events.map((event) => ({
      event_type: event.event_type,
      source: event.source,
      title: event.title,
      payload_keys: Object.keys(event.payload),
    }))).toLowerCase();
    expect(forbiddenTimelineBusinessSurface).not.toMatch(/total_score|ranking|diagnosis|ai_|llm|model|agent|causal_effect/);
  });
});

async function seedReadyEpisode(correlationId: string): Promise<SeededWave3State> {
  const family = await postFamily({ display_name: 'Wave3 E2E 家庭', idempotency_key: `idem-${correlationId}-family` }, correlationId);
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
  await postJsonExpect(`/families/${familyBody.family.family_id}/relationships`, {
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

  for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'] as const) {
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
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-onboarding`);
  await seedPerspectivePair(familyBody.family.family_id, onboarding.onboarding.onboarding_id, parent.parent.person_id, child.child.person_id, correlationId);
  const drafts = await postJsonExpect<GrowthProfileDraftsHttpResponse>(`/families/${familyBody.family.family_id}/growth/onboardings/${onboarding.onboarding.onboarding_id}/profile-drafts`, {}, correlationId, `idem-${correlationId}-profile-drafts`);
  const relationshipDraft = drafts.drafts.find((draft) => draft.dimension_id === 'R03');
  expect(relationshipDraft).toBeDefined();
  const profile = await postJsonExpect<ConfirmGrowthProfileHttpResponse>(`/families/${familyBody.family.family_id}/growth/profile-drafts/${relationshipDraft!.draft_id}/confirm`, {}, correlationId, `idem-${correlationId}-confirm-profile`);
  const insight = await (await getPriorityInsight(familyBody.family.family_id, onboarding.onboarding.onboarding_id)).json() as GrowthPriorityInsightHttpResponse;
  const priority = await postJsonExpect<ConfirmGrowthPriorityHttpResponse>(`/families/${familyBody.family.family_id}/growth/onboardings/${onboarding.onboarding.onboarding_id}/priority/confirm`, {
    draft_id: insight.draft.draft_id,
    decision: 'R03',
  }, correlationId, `idem-${correlationId}-priority`);
  const intervention = await postJsonExpect<StartInterventionHttpResponse>(`/families/${familyBody.family.family_id}/growth/onboardings/${onboarding.onboarding.onboarding_id}/interventions/start`, {
    priority_id: priority.priority!.priority_id,
    intervention_code: 'LISTEN_BEFORE_RESPOND',
  }, correlationId, `idem-${correlationId}-intervention`);

  return {
    familyId: familyBody.family.family_id,
    parentId: parent.parent.person_id,
    childId: child.child.person_id,
    onboardingId: onboarding.onboarding.onboarding_id,
    profileId: profile.profile.profile_id,
    priorityId: priority.priority!.priority_id,
    episodeId: intervention.episode.episode_id,
    actions: intervention.actions,
  };
}

async function seedPerspectivePair(familyId: string, onboardingId: string, parentId: string, childId: string, correlationId: string): Promise<void> {
  await postJsonExpect(`/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    subjectPersonId: childId,
    authorPersonId: parentId,
    perspectiveType: 'PARENT_PERSPECTIVE',
    captureMode: 'DIRECT_SELF_REPORT',
    relatedDimensionIds: ['P03', 'R03'],
    content: { promptId: 'wave3-parent-v1', responseText: '我经常还没听完就开始讲道理。', selectedSignals: ['interrupts'] },
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-parent-perspective`);
  await postJsonExpect(`/families/${familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    subjectPersonId: childId,
    authorPersonId: childId,
    perspectiveType: 'CHILD_PERSPECTIVE',
    captureMode: 'FACILITATED_ENTRY',
    relatedDimensionIds: ['R03', 'R04'],
    content: { promptId: 'wave3-child-v1', responseText: '我希望大人先听我说完再回应。', selectedSignals: ['wants-to-be-heard'] },
    structuredSafetySignals: ['NONE'],
  }, correlationId, `idem-${correlationId}-child-perspective`);
}

async function completeAllActions(familyId: string, actions: GrowthActionHttpDto[], correlationId: string): Promise<void> {
  await completeSomeActions(familyId, actions, correlationId, 'COMPLETED');
}

async function completeSomeActions(familyId: string, actions: GrowthActionHttpDto[], correlationId: string, completionStatus: 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED'): Promise<void> {
  for (const action of actions) {
    const response = await postJson(`/families/${familyId}/growth/actions/${action.action_id}/complete`, {
      completion_status: completionStatus,
      reflection: `第 ${action.day_index} 天先听后回应。`,
      occurred_at: new Date().toISOString(),
    }, correlationId, `idem-${correlationId}-complete-${action.day_index}`);
    expect(response.status).toBe(201);
  }
}

async function ageEpisodePastPlannedEnd(episodeId: string): Promise<void> {
  await pool!.query(`update intervention_episodes set started_at = now() - interval '8 days' where episode_id = $1`, [episodeId]);
}

async function completeReview(setup: SeededWave3State, correlationId: string, idempotencyKey: string): Promise<Response> {
  return postJson(`/families/${setup.familyId}/growth/intervention-episodes/${setup.episodeId}/review/complete`, {}, correlationId, idempotencyKey);
}

async function recordOutcomeObservation(
  setup: SeededWave3State,
  perspectiveType: 'PARENT_OBSERVATION' | 'CHILD_OBSERVATION',
  observerPersonId: string,
  observationText: string,
  correlationId: string,
  idempotencyKey: string,
  extras: { action_refs?: string[]; reflection_refs?: string[]; evidence_refs?: string[]; limitations?: string[] } = {},
): Promise<Response> {
  return postJson(`/families/${setup.familyId}/growth/outcome-observations`, {
    subject_person_id: setup.childId,
    observer_person_id: observerPersonId,
    intervention_episode_id: setup.episodeId,
    perspective_type: perspectiveType,
    observation_text: observationText,
    ...extras,
    observed_at: new Date().toISOString(),
  }, correlationId, idempotencyKey);
}

async function postFamily(body: Record<string, unknown>, correlationId: string): Promise<Response> {
  return postJson('/families', body, correlationId, String(body.idempotency_key ?? 'missing'));
}

async function getPriorityInsight(familyId: string, onboardingId: string): Promise<Response> {
  return fetch(`${baseUrl}/families/${familyId}/growth/onboardings/${onboardingId}/priority`, { headers: baseHeaders('corr-w3-get-priority-insight') });
}

async function postJson(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string, actorId = 'architect-1'): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: baseHeaders(correlationId, idempotencyKey, actorId),
    body: JSON.stringify(body),
  });
}

async function postJsonExpect<TBody>(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<TBody> {
  const response = await postJson(path, body, correlationId, idempotencyKey);
  expect(response.status).toBe(201);
  return await response.json() as TBody;
}

function baseHeaders(correlationId: string, idempotencyKey?: string, actorId = 'architect-1'): Record<string, string> {
  return {
    authorization: 'Bearer test-token',
    'content-type': 'application/json',
    'x-actor-id': actorId,
    'x-correlation-id': correlationId,
    'x-source': 'vitest-e2e',
    ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
  };
}

async function expectCount(tableName: string, expected: number): Promise<void> {
  const result = await pool!.query(`select count(*)::int as count from ${tableName}`);
  expect(result.rows[0].count).toBe(expected);
}

async function expectGrowthProfileUnchanged(profileId: string): Promise<void> {
  const profile = await pool!.query<{ version: number; effective_to: Date | null }>('select version, effective_to from growth_profiles where profile_id = $1', [profileId]);
  expect(profile.rowCount).toBe(1);
  expect(profile.rows[0]).toEqual({ version: 1, effective_to: null });

  const profileCount = await pool!.query<{ count: number }>('select count(*)::int as count from growth_profiles');
  expect(profileCount.rows[0].count).toBe(1);

  const dimensions = await pool!.query<{ dimension_id: string }>('select dimension_id from growth_profile_dimensions where profile_id = $1 order by dimension_id', [profileId]);
  expect(dimensions.rows.map((row) => row.dimension_id)).toEqual(['R03']);
}

async function expectNoAiLikeSideEffects(): Promise<void> {
  const events = await pool!.query(
    `select event_name from outbox_events
     where lower(event_name) like any($1::text[])
     order by event_name`,
    [['%ai%', '%llm%', '%model%', '%agent%', '%causal%', '%world%']],
  );
  expect(events.rows).toEqual([]);
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

interface SeededWave3State {
  familyId: string;
  parentId: string;
  childId: string;
  onboardingId: string;
  profileId: string;
  priorityId: string;
  episodeId: string;
  actions: GrowthActionHttpDto[];
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

interface GrowthPriorityInsightHttpResponse {
  draft: { draft_id: string };
}

interface ConfirmGrowthPriorityHttpResponse {
  priority: { priority_id: string } | null;
}

interface StartInterventionHttpResponse {
  episode: { episode_id: string };
  actions: GrowthActionHttpDto[];
}

interface GrowthActionHttpDto {
  action_id: string;
  day_index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

interface OutcomeObservationHttpDto {
  observation_id: string;
  family_id: string;
  subject_person_id: string;
  observer_person_id: string;
  intervention_episode_id: string;
  observation_text: string;
  perspective_type: 'PARENT_OBSERVATION' | 'CHILD_OBSERVATION';
  boundary: 'OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT';
  policy_version: 'M2_106_DETERMINISTIC_V1';
}

interface RecordOutcomeObservationHttpResponse {
  observation: OutcomeObservationHttpDto;
}

interface CompleteGrowthReviewHttpResponse {
  review: {
    review_id: string;
    family_id: string;
    intervention_episode_id: string;
    priority_id: string;
    dimension_id: 'R03';
    status: 'COMPLETED';
    action_summary: { total_actions: 7; completed: number; partial: number; not_completed: number; missing: number };
    limitations: string[];
    boundary: 'REVIEW_IS_NOT_PROFILE_MUTATION_OR_DIAGNOSIS';
    policy_version: 'M2_106_DETERMINISTIC_V1';
  };
  observations: OutcomeObservationHttpDto[];
}

interface RecordNextStepDecisionHttpResponse {
  decision: {
    decision_id: string;
    family_id: string;
    review_id: string;
    intervention_episode_id: string;
    decision: 'CONTINUE' | 'ADJUST' | 'PAUSE' | 'REVIEW_REQUIRED';
    boundary: 'NEXT_STEP_DECISION_IS_NOT_NEXT_ACTION';
    policy_version: 'M2_106_DETERMINISTIC_V1';
  };
}

interface FamilyTimelineHttpResponse {
  events: Array<{
    event_type: string;
    source: string;
    title: string;
    payload: Record<string, unknown>;
    boundary: 'TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING';
  }>;
}
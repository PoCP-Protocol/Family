import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { seedChildSubject, seedTrustedFamilyGuardian } from '../../test/family-auth-fixtures';
import { OrchestrationRepository } from './orchestration.repository';
import { OrchestrationService } from './orchestration.service';
import { VERTICAL_POLICY_VERSION } from './orchestration.types';

describe('FAMILY_PHASE8_PROGRESS_STEWARD_METRICS_001 real PostgreSQL integration', () => {
  let pool: pg.Pool;
  let repository: OrchestrationRepository;
  let service: OrchestrationService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new OrchestrationRepository();
    service = new OrchestrationService(repository);
  });
  beforeEach(async () => { await cleanFamilyCoreTables(pool); });
  afterAll(async () => { await repository.onModuleDestroy(); await pool.end(); });

  it('projects service progress, family-scoped steward queue and non-outcome metrics, then records an internal draft', async () => {
    const seed = await seedScenario('phase8-positive');
    const audit = { actorId: seed.guardianId, correlationId: 'phase8-positive', source: 'vitest', occurredAt: new Date().toISOString() };
    const intent = await service.createIntent({ familyId: seed.familyId, subjectPersonId: seed.childId, signalText: '我们今晚想先缓和冲突。', goalText: '今晚保留一次低冲突沟通的机会。', idempotencyKey: 'p8-intent-001' }, audit);
    const beforeRecommendation = await service.getProgressProjection(seed.familyId, seed.childId);
    expect(beforeRecommendation).toMatchObject({ current_stage: 'NEED_CONFIRMED', next_step: 'CONFIRM_SERVICE', truth_boundary: 'SERVICE_PROGRESS_NOT_GROWTH_OUTCOME' });

    const recommendation = await service.requestRecommendation({ familyId: seed.familyId, growthIntentId: intent.growth_intent_id, idempotencyKey: 'p8-rec-001' }, audit);
    const options = await service.getProgressProjection(seed.familyId, seed.childId);
    expect(options).toMatchObject({ current_stage: 'RESOURCE_OPTIONS', next_step: 'REVIEW_OPTIONS' });

    const decision = await service.decideService({ familyId: seed.familyId, recommendationId: recommendation.resource_recommendation_id, decisionType: 'ACCEPT', selectedOfferIds: [seed.offerId], idempotencyKey: 'p8-decision-001' }, audit);
    const plan = await service.createPlan({ familyId: seed.familyId, decisionId: decision.family_service_decision_id, idempotencyKey: 'p8-plan-001' }, audit);
    const serviceCase = await service.openServiceCase({ familyId: seed.familyId, planId: plan.orchestration_plan_id, idempotencyKey: 'p8-case-001' }, audit);

    const open = await service.getProgressProjection(seed.familyId, seed.childId);
    expect(open).toMatchObject({ current_stage: 'FOLLOW_UP_DUE', next_step: 'RECORD_FOLLOW_UP', can_pause: true, source_refs: { service_case_id: serviceCase.service_case_id } });
    const queue = await service.getStewardQueue(seed.familyId);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ service_case_id: serviceCase.service_case_id, needs_follow_up: true, needs_recovery: false, reason_code: 'FOLLOW_UP_DUE', truth_boundary: 'INTERNAL_SERVICE_QUEUE_NOT_CHILD_OR_FAMILY_RISK_SCORE' });

    const metricsBefore = await service.getServiceMetrics(seed.familyId, seed.childId);
    expect(metricsBefore).toMatchObject({ family_decision_rate: 1, service_case_open_rate: 1, follow_up_capture_rate: 0, helpfulness_signal: null, context_reuse_available: true, truth_boundary: 'SERVICE_DELIVERY_AND_FAMILY_PERCEPTION_NOT_GROWTH_OUTCOME' });

    const draft = await service.createStewardHandoffDraft({ familyId: seed.familyId, serviceCaseId: serviceCase.service_case_id, subjectPersonId: seed.childId, summaryText: '家庭选择了低风险沟通练习，等待家庭回访。', idempotencyKey: 'p8-draft-001' }, audit);
    expect(draft).toMatchObject({ family_id: seed.familyId, service_case_id: serviceCase.service_case_id, status: 'DRAFT', limitation_text: 'INTERNAL_DRAFT_NOT_ADVISOR_ASSIGNMENT_NOT_GROWTH_OUTCOME' });
    const replay = await service.createStewardHandoffDraft({ familyId: seed.familyId, serviceCaseId: serviceCase.service_case_id, subjectPersonId: seed.childId, summaryText: '不得改变幂等结果。', idempotencyKey: 'p8-draft-001' }, audit);
    expect(replay.steward_handoff_draft_id).toBe(draft.steward_handoff_draft_id);

    await service.recordFollowUp({ familyId: seed.familyId, serviceCaseId: serviceCase.service_case_id, helpfulness: 'HELPFUL', responseText: '家庭主观觉得有帮助。', idempotencyKey: 'p8-followup-001' }, audit);
    const closed = await service.getProgressProjection(seed.familyId, seed.childId);
    expect(closed).toMatchObject({ current_stage: 'FOLLOW_UP_CAPTURED', next_step: 'NONE', last_family_signal: 'HELPFUL', can_cancel: false });
    const metricsAfter = await service.getServiceMetrics(seed.familyId, seed.childId);
    expect(metricsAfter).toMatchObject({ follow_up_capture_rate: 1, helpfulness_signal: 'HELPFUL' });
    const auditRows = await pool.query(`select action_name,result from audit_logs where family_id=$1 and resource_id=$2 order by created_at`, [seed.familyId, draft.steward_handoff_draft_id]);
    expect(auditRows.rows).toEqual(expect.arrayContaining([expect.objectContaining({ action_name: 'CreateStewardHandoffDraft', result: 'SUCCESS' })]));
  });

  it('keeps NO_ACTION as a terminal service projection without queue, plan or case', async () => {
    const seed = await seedScenario('phase8-no-action');
    const audit = { actorId: seed.guardianId, correlationId: 'phase8-no-action', source: 'vitest', occurredAt: new Date().toISOString() };
    const intent = await service.createIntent({ familyId: seed.familyId, subjectPersonId: seed.childId, signalText: '这次我们先不行动。', goalText: '保留家庭自行决定的空间。', idempotencyKey: 'p8-no-intent-001' }, audit);
    const recommendation = await service.requestRecommendation({ familyId: seed.familyId, growthIntentId: intent.growth_intent_id, idempotencyKey: 'p8-no-rec-001' }, audit);
    await service.decideService({ familyId: seed.familyId, recommendationId: recommendation.resource_recommendation_id, decisionType: 'NO_ACTION', selectedOfferIds: [], idempotencyKey: 'p8-no-decision-001' }, audit);
    expect(await service.getProgressProjection(seed.familyId, seed.childId)).toMatchObject({ current_stage: 'NO_ACTION', next_step: 'NONE', can_cancel: false });
    expect(await service.getStewardQueue(seed.familyId)).toHaveLength(0);
    expect(await service.getServiceMetrics(seed.familyId, seed.childId)).toMatchObject({ family_decision_rate: 1, service_case_open_rate: 0, follow_up_capture_rate: 0, context_reuse_available: false });
  });

  it('fails closed when a draft tries to combine another family case and subject', async () => {
    const first = await seedScenario('phase8-cross-a');
    const second = await seedScenario('phase8-cross-b');
    const audit = { actorId: second.guardianId, correlationId: 'phase8-cross', source: 'vitest', occurredAt: new Date().toISOString() };
    const intent = await service.createIntent({ familyId: first.familyId, subjectPersonId: first.childId, signalText: '第一家庭的需要。', goalText: '第一家庭的目标。', idempotencyKey: 'p8-cross-intent-001' }, { ...audit, actorId: first.guardianId });
    const recommendation = await service.requestRecommendation({ familyId: first.familyId, growthIntentId: intent.growth_intent_id, idempotencyKey: 'p8-cross-rec-001' }, { ...audit, actorId: first.guardianId });
    const decision = await service.decideService({ familyId: first.familyId, recommendationId: recommendation.resource_recommendation_id, decisionType: 'ACCEPT', selectedOfferIds: [first.offerId], idempotencyKey: 'p8-cross-decision-001' }, { ...audit, actorId: first.guardianId });
    const plan = await service.createPlan({ familyId: first.familyId, decisionId: decision.family_service_decision_id, idempotencyKey: 'p8-cross-plan-001' }, { ...audit, actorId: first.guardianId });
    const caseRow = await service.openServiceCase({ familyId: first.familyId, planId: plan.orchestration_plan_id, idempotencyKey: 'p8-cross-case-001' }, { ...audit, actorId: first.guardianId });
    await expect(service.createStewardHandoffDraft({ familyId: second.familyId, serviceCaseId: caseRow.service_case_id, subjectPersonId: second.childId, summaryText: '跨家庭草案必须拒绝。', idempotencyKey: 'p8-cross-draft-001' }, audit)).rejects.toThrow('service_case_not_open_in_family');
  });

  async function seedScenario(suffix: string) {
    const family = await seedTrustedFamilyGuardian(pool, suffix);
    const childId = await seedChildSubject(pool, family.familyId, '孩子', '2012-08-16');
    await pool.query(`insert into consents(family_id,subject_person_id,guardian_person_id,purpose,status,policy_version,granted_at) values ($1,$2,$3,'SERVICE','GRANTED',$4,now())`, [family.familyId, childId, family.guardianId, VERTICAL_POLICY_VERSION]);
    const capability = await pool.query<{ growth_capability_id: string }>(`insert into growth_capabilities(capability_code,display_name,description,need_type,policy_version) values ($1,'降温与重开沟通','受控低风险沟通能力。','PARENT_CHILD_COMMUNICATION_CONFLICT',$2) returning growth_capability_id`, [`P8_DE_ESCALATION_${suffix}`, VERTICAL_POLICY_VERSION]);
    const offer = await pool.query<{ resource_offer_id: string }>(`insert into resource_offers(resource_code,resource_type,title,description,need_type,requires_consent,policy_version) values ($1,'AI_COACH','确定性沟通提示','不调用真实外部模型的内部提示。','PARENT_CHILD_COMMUNICATION_CONFLICT',true,$2) returning resource_offer_id`, [`P8_AI_COACH_${suffix}`, VERTICAL_POLICY_VERSION]);
    await pool.query(`insert into resource_offer_capabilities(resource_offer_id,growth_capability_id) values ($1,$2)`, [offer.rows[0].resource_offer_id, capability.rows[0].growth_capability_id]);
    return { familyId: family.familyId, guardianId: family.guardianId, childId, offerId: offer.rows[0].resource_offer_id };
  }
});

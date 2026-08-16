import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { OrchestrationRepository } from './orchestration.repository';
import { OrchestrationService } from './orchestration.service';
import { VERTICAL_POLICY_VERSION } from './orchestration.types';

describe('FAMILY-GROWTH-VERTICAL-SLICE-001 real PostgreSQL integration', () => {
  let pool: pg.Pool;
  let repository: OrchestrationRepository;
  let service: OrchestrationService;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repository = new OrchestrationRepository();
    service = new OrchestrationService(repository);
  });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool);
  });

  afterAll(async () => {
    await repository.onModuleDestroy();
    await pool.end();
  });

  it('runs the deterministic family-authorized Golden Journey and keeps service truth separated from Growth OS', async () => {
    const seed = await seedTrustedFamily('golden');
    const audit = auditFor(seed.guardianId, 'golden');

    const intent = await service.createIntent({
      familyId: seed.familyId,
      subjectPersonId: seed.childId,
      signalText: '孩子刚摔门，我今晚不知道怎么重新开口。',
      goalText: '今晚以低冲突方式重新开启一次沟通。',
      idempotencyKey: 'golden-intent-001',
    }, audit);

    expect(intent.truth_boundary).toBe('NEED_SIGNAL_AND_FAMILY_CONFIRMED_INTENT_NOT_CHILD_DIAGNOSIS');

    const recommendation = await service.requestRecommendation({
      familyId: seed.familyId,
      growthIntentId: intent.growth_intent_id,
      idempotencyKey: 'golden-recommendation-001',
    }, audit);

    const candidateCodes = recommendation.candidates.map((candidate: Record<string, unknown>) => candidate.resource_code);
    expect(candidateCodes).toContain(seed.aiOfferId);
    expect(candidateCodes).not.toContain(seed.programOfferId);

    const t1 = await pool.query(
      `select result, reason_code from service_eligibility_evaluations
        where family_id=$1 and growth_intent_id=$2 order by evaluated_at, service_eligibility_evaluation_id`,
      [seed.familyId, intent.growth_intent_id],
    );
    expect(t1.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ result: 'ELIGIBLE', reason_code: 'LOW_RISK_POLICY_PASS' }),
      expect.objectContaining({ result: 'INELIGIBLE', reason_code: 'RESOURCE_TYPE_NOT_AUTHORIZED_FOR_VERTICAL' }),
    ]));

    const decision = await service.decideService({
      familyId: seed.familyId,
      recommendationId: recommendation.resource_recommendation_id,
      decisionType: 'ACCEPT',
      selectedOfferIds: [seed.aiOfferUuid],
      rationale: '先试一个低风险、可退出的沟通提示。',
      idempotencyKey: 'golden-decision-001',
    }, audit);

    const plan = await service.createPlan({
      familyId: seed.familyId,
      decisionId: decision.family_service_decision_id,
      idempotencyKey: 'golden-plan-001',
    }, audit);
    expect(plan.plan_boundary).toBe('DECLARATIVE_PLAN_ONLY_NOT_EXECUTION_OR_COMPLETION_TRUTH');

    const serviceCase = await service.openServiceCase({
      familyId: seed.familyId,
      planId: plan.orchestration_plan_id,
      idempotencyKey: 'golden-case-001',
    }, audit);
    expect(serviceCase.execution_boundary).toBe('SERVICE_CASE_RECORDS_SERVICE_EXECUTION_NOT_CHILD_OR_FAMILY_GROWTH_OUTCOME');

    const followUp = await service.recordFollowUp({
      familyId: seed.familyId,
      serviceCaseId: serviceCase.service_case_id,
      helpfulness: 'A_LITTLE_HELPFUL',
      responseText: '今晚能先停一下再说，感觉有一点帮助。',
      idempotencyKey: 'golden-follow-up-001',
    }, audit);
    expect(followUp.truth_class).toBe('USER_PERCEIVED_HELPFULNESS');

    const context = await service.getContextReuse(seed.familyId, seed.childId);
    expect(context.boundary).toBe('MINIMAL_FAMILY_SCOPED_CONTEXT_REUSE_NO_CROSS_FAMILY_LEARNING_OR_CAUSAL_CLAIM');
    expect(context.items).toHaveLength(1);
    expect(context.items[0]).toMatchObject({
      helpfulness: 'A_LITTLE_HELPFUL',
      note: 'USER_PERCEIVED_HELPFULNESS_NOT_GROWTH_OUTCOME',
    });

    const counts = await pool.query(
      `select
        (select count(*)::int from growth_need_signals) as signals,
        (select count(*)::int from growth_intents) as intents,
        (select count(*)::int from growth_intent_capabilities) as intent_capabilities,
        (select count(*)::int from resource_recommendations) as recommendations,
        (select count(*)::int from family_service_decisions) as decisions,
        (select count(*)::int from orchestration_plans) as plans,
        (select count(*)::int from service_cases) as cases,
        (select count(*)::int from follow_up_responses) as follow_ups,
        (select count(*)::int from outcome_observations) as observations`,
    );
    expect(counts.rows[0]).toMatchObject({
      signals: 1, intents: 1, intent_capabilities: 1, recommendations: 1,
      decisions: 1, plans: 1, cases: 1, follow_ups: 1, observations: 0,
    });
  });

  it('records NO_ACTION as a valid family choice without creating a plan or service case', async () => {
    const seed = await seedTrustedFamily('no-action');
    const audit = auditFor(seed.guardianId, 'no-action');
    const intent = await service.createIntent({
      familyId: seed.familyId,
      subjectPersonId: seed.childId,
      signalText: '这次我们想先不行动。',
      goalText: '保留之后再选择的空间。',
      idempotencyKey: 'no-action-intent-001',
    }, audit);
    const recommendation = await service.requestRecommendation({
      familyId: seed.familyId,
      growthIntentId: intent.growth_intent_id,
      idempotencyKey: 'no-action-recommendation-001',
    }, audit);

    const decision = await service.decideService({
      familyId: seed.familyId,
      recommendationId: recommendation.resource_recommendation_id,
      decisionType: 'NO_ACTION',
      selectedOfferIds: [],
      idempotencyKey: 'no-action-decision-001',
    }, audit);
    expect(decision).toMatchObject({ status: 'DECLINED', truth_boundary: 'FAMILY_SERVICE_DECISION_IS_SEPARATE_FROM_RECOMMENDATION_AND_EXECUTION' });

    const writes = await pool.query(
      `select
         (select count(*)::int from family_service_decision_offers) as selected_offers,
         (select count(*)::int from orchestration_plans) as plans,
         (select count(*)::int from service_cases) as cases`,
    );
    expect(writes.rows[0]).toMatchObject({ selected_offers: 0, plans: 0, cases: 0 });
  });

  it('fails closed after trusted family membership is revoked and never creates a Need or Intent', async () => {
    const seed = await seedTrustedFamily('revoked');
    await pool.query(`update family_memberships set status='REVOKED', revoked_at=now() where family_id=$1 and person_id=$2`, [seed.familyId, seed.guardianId]);

    await expect(service.createIntent({
      familyId: seed.familyId,
      subjectPersonId: seed.childId,
      signalText: '撤销后不应继续创建服务需求。',
      goalText: '不应被写入。',
      idempotencyKey: 'revoked-intent-001',
    }, auditFor(seed.guardianId, 'revoked'))).rejects.toThrow('trusted_actor_not_in_family');

    const r = await pool.query(`select count(*)::int as count from growth_need_signals where family_id=$1`, [seed.familyId]);
    expect(r.rows[0].count).toBe(0);
  });

  async function seedTrustedFamily(suffix: string): Promise<{ familyId: string; guardianId: string; childId: string; aiOfferUuid: string; aiOfferId: string; programOfferId: string }> {
    const account = await pool.query<{ account_id: string }>(`insert into accounts(external_ref) values ($1) returning account_id`, [`integration-${suffix}@family.local`]);
    const family = await pool.query<{ family_id: string }>(`insert into families(display_name) values ($1) returning family_id`, [`纵切家庭-${suffix}`]);
    const guardian = await pool.query<{ person_id: string }>(
      `insert into persons(family_id,person_type,parent_role,display_name,account_id)
       values ($1,'PARENT','GUARDIAN','监护人',$2) returning person_id`,
      [family.rows[0].family_id, `integration-${suffix}@family.local`],
    );
    await pool.query(`update families set primary_contact_person_id=$1 where family_id=$2`, [guardian.rows[0].person_id, family.rows[0].family_id]);
    const child = await pool.query<{ person_id: string }>(
      `insert into persons(family_id,person_type,display_name,birth_date)
       values ($1,'CHILD','孩子','2012-08-16') returning person_id`,
      [family.rows[0].family_id],
    );
    await pool.query(`insert into account_person_bindings(account_id,person_id,status) values ($1,$2,'ACTIVE')`, [account.rows[0].account_id, guardian.rows[0].person_id]);
    await pool.query(`insert into family_memberships(family_id,person_id,role,status,joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now()),($1,$3,'CHILD_SUBJECT','ACTIVE',now())`, [family.rows[0].family_id, guardian.rows[0].person_id, child.rows[0].person_id]);
    await pool.query(
      `insert into consents(family_id,subject_person_id,guardian_person_id,purpose,status,policy_version,granted_at)
       values ($1,$2,$3,'SERVICE','GRANTED',$4,now())`,
      [family.rows[0].family_id, child.rows[0].person_id, guardian.rows[0].person_id, VERTICAL_POLICY_VERSION],
    );

    const capability = await pool.query<{ growth_capability_id: string }>(
      `insert into growth_capabilities(capability_code,display_name,description,need_type,policy_version)
       values ('DE_ESCALATION','降温与重开沟通','帮助家庭在冲突后以低风险方式暂停、稳定和重新开启沟通。','PARENT_CHILD_COMMUNICATION_CONFLICT',$1)
       returning growth_capability_id`,
      [VERTICAL_POLICY_VERSION],
    );
    const ai = await pool.query<{ resource_offer_id: string }>(
      `insert into resource_offers(resource_code,resource_type,title,description,need_type,requires_consent,policy_version)
       values ('V3_AI_COACH_COMMUNICATION','AI_COACH','冷静开口提示','确定性内部提示，不调用真实外部模型。','PARENT_CHILD_COMMUNICATION_CONFLICT',true,$1)
       returning resource_offer_id`,
      [VERTICAL_POLICY_VERSION],
    );
    const program = await pool.query<{ resource_offer_id: string }>(
      `insert into resource_offers(resource_code,resource_type,title,description,need_type,requires_consent,policy_version)
       values ('V3_PROGRAM_RESERVED','PROGRAM','预留 Program 资源','仅用于验证未授权资源 fail-closed。','PARENT_CHILD_COMMUNICATION_CONFLICT',true,$1)
       returning resource_offer_id`,
      [VERTICAL_POLICY_VERSION],
    );
    await pool.query(`insert into resource_offer_capabilities(resource_offer_id,growth_capability_id) values ($1,$2),($3,$2)`, [ai.rows[0].resource_offer_id, capability.rows[0].growth_capability_id, program.rows[0].resource_offer_id]);

    return {
      familyId: family.rows[0].family_id,
      guardianId: guardian.rows[0].person_id,
      childId: child.rows[0].person_id,
      aiOfferUuid: ai.rows[0].resource_offer_id,
      aiOfferId: 'V3_AI_COACH_COMMUNICATION',
      programOfferId: 'V3_PROGRAM_RESERVED',
    };
  }

  function auditFor(actorId: string, suffix: string) {
    return { actorId, correlationId: `integration-${suffix}`, source: 'vitest', occurredAt: new Date().toISOString() };
  }
});

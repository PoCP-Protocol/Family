import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';
import type { AuditInput, CreateIntentInput, CreatePlanInput, DecideServiceInput, FamilyProgressProjection, FamilyServiceMetrics, OpenCaseInput, RecordFollowUpInput, RequestRecommendationInput, ResourceOffer, ResourceType, StewardHandoffDraft, StewardQueueItem, CreateStewardHandoffDraftInput, UpdateStewardHandoffDraftInput } from './orchestration.types';
import { COMMUNICATION_CONFLICT_NEED, VERTICAL_POLICY_VERSION } from './orchestration.types';

@Injectable()
export class OrchestrationRepository implements OnModuleDestroy {
  private readonly pool: pg.Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');
    this.pool = new pg.Pool({ connectionString });
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }

  async withTransaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await work(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally { client.release(); }
  }

  async createIntent(input: CreateIntentInput, audit: AuditInput): Promise<{ need_signal_id: string; growth_intent_id: string; status: string }> {
    return this.withTransaction(async (client) => {
      const existing = await client.query<{ need_signal_id: string; growth_intent_id: string; status: string }>(
        `SELECT n.need_signal_id, i.growth_intent_id, i.status
           FROM growth_need_signals n JOIN growth_intents i ON i.need_signal_id=n.need_signal_id
          WHERE n.family_id=$1 AND n.idempotency_key=$2`, [input.familyId, input.idempotencyKey]);
      if (existing.rowCount) return existing.rows[0];
      await this.assertAdultActorAndChildSubject(client, input.familyId, audit.actorId, input.subjectPersonId);
      const signal = await client.query<{ need_signal_id: string }>(
        `INSERT INTO growth_need_signals(family_id,subject_person_id,need_type,signal_text,created_by_person_id,idempotency_key,policy_version)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING need_signal_id`,
        [input.familyId, input.subjectPersonId, COMMUNICATION_CONFLICT_NEED, input.signalText, audit.actorId, input.idempotencyKey, VERTICAL_POLICY_VERSION]);
      const intent = await client.query<{ growth_intent_id: string; status: string }>(
        `INSERT INTO growth_intents(family_id,subject_person_id,need_signal_id,need_type,goal_text,confirmed_by_person_id,idempotency_key,policy_version)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING growth_intent_id,status`,
        [input.familyId, input.subjectPersonId, signal.rows[0].need_signal_id, COMMUNICATION_CONFLICT_NEED, input.goalText, audit.actorId, input.idempotencyKey, VERTICAL_POLICY_VERSION]);
      const mappedCapabilities = await client.query<{ growth_capability_id: string }>(
        `INSERT INTO growth_intent_capabilities(growth_intent_id,growth_capability_id,policy_version)
         SELECT $1,growth_capability_id,$2 FROM growth_capabilities WHERE need_type=$3
         RETURNING growth_capability_id`,
        [intent.rows[0].growth_intent_id, VERTICAL_POLICY_VERSION, COMMUNICATION_CONFLICT_NEED]);
      if (!mappedCapabilities.rowCount) throw new Error('growth_capability_mapping_missing');
      return { need_signal_id: signal.rows[0].need_signal_id, growth_intent_id: intent.rows[0].growth_intent_id, status: intent.rows[0].status };
    });
  }

  async getIntentForRecommendation(client: pg.PoolClient, familyId: string, intentId: string): Promise<{ growth_intent_id: string; subject_person_id: string; need_type: string; status: string }> {
    const r = await client.query<{ growth_intent_id: string; subject_person_id: string; need_type: string; status: string }>(
      `SELECT growth_intent_id,subject_person_id,need_type,status FROM growth_intents WHERE family_id=$1 AND growth_intent_id=$2 FOR UPDATE`, [familyId, intentId]);
    if (!r.rowCount) throw new Error('growth_intent_not_found_in_family');
    if (r.rows[0].status !== 'OPEN') throw new Error('growth_intent_not_open');
    return r.rows[0];
  }

  async findRecommendationByKey(client: pg.PoolClient, familyId: string, idempotencyKey: string): Promise<{ resource_recommendation_id: string; growth_intent_id: string; status: string } | null> {
    const r = await client.query<{ resource_recommendation_id: string; growth_intent_id: string; status: string }>(
      `SELECT resource_recommendation_id,growth_intent_id,status FROM resource_recommendations WHERE family_id=$1 AND idempotency_key=$2`, [familyId, idempotencyKey]);
    return r.rows[0] ?? null;
  }

  async activeServiceConsent(client: pg.PoolClient, familyId: string, subjectPersonId: string): Promise<boolean> {
    const r = await client.query(
      `SELECT 1 FROM consents WHERE family_id=$1 AND subject_person_id=$2 AND purpose='SERVICE' AND status='GRANTED' AND withdrawn_at IS NULL LIMIT 1`,
      [familyId, subjectPersonId]);
    return !!r.rowCount;
  }

  async getActiveOffers(client: pg.PoolClient, growthIntentId: string): Promise<ResourceOffer[]> {
    const r = await client.query<ResourceOffer>(
      `SELECT o.resource_offer_id,o.resource_code,o.resource_type,
              coalesce(array_agg(gc.capability_code) FILTER (WHERE gc.capability_code IS NOT NULL), ARRAY[]::varchar[]) AS capability_codes,
              o.title,o.description,o.age_scope,o.age_min_months,o.age_max_months,o.life_stage_scope,o.need_type,o.evidence_level,o.risk_boundary,o.privacy_boundary,o.effort_class,o.duration_class,o.cost_class,o.requires_consent,o.requires_human,o.content_ref,o.provider_qualification,o.availability_status,o.policy_version
         FROM resource_offers o
         JOIN resource_offer_capabilities roc ON roc.resource_offer_id=o.resource_offer_id
         JOIN growth_capabilities gc ON gc.growth_capability_id=roc.growth_capability_id
         JOIN growth_intent_capabilities gic ON gic.growth_capability_id=roc.growth_capability_id
        WHERE gic.growth_intent_id=$1
          AND o.availability_status='ACTIVE'
          -- 内部 NO_ACTION / AI_COACH 仍由首条纵切 policy 单独控制；
          -- 所有可供阅读或练习的内容资产必须经资源目录 ADMITTED 准入，不能仅凭 content_ref 字符串进入家庭服务。
          AND (
            o.resource_type NOT IN ('PRACTICE','CONTENT')
            OR EXISTS (
              SELECT 1
              FROM resource_asset_admissions aa
              JOIN resource_asset_versions av ON av.resource_asset_version_id=aa.resource_asset_version_id
              JOIN resource_assets a ON a.resource_asset_id=av.resource_asset_id
              WHERE aa.resource_asset_version_id=o.resource_asset_version_id
                AND aa.status='ADMITTED'
                AND a.copyright_status IN ('OWNED','LICENSED')
                AND av.primary_evidence_source_class <> 'UNVERIFIED_OR_INFERRED'
                AND EXISTS (
                  SELECT 1 FROM resource_asset_evidence ae
                  WHERE ae.resource_asset_version_id=av.resource_asset_version_id
                    AND ae.evidence_source_class <> 'UNVERIFIED_OR_INFERRED'
                    AND ae.claim_scope IN ('PROVENANCE_ONLY','SAFETY_CONTEXT')
                )
            )
          )
        GROUP BY o.resource_offer_id
        ORDER BY o.resource_code`, [growthIntentId]);
    return r.rows;
  }

  async createRecommendation(client: pg.PoolClient, input: RequestRecommendationInput, actorId: string, candidates: Array<{ resourceOfferId: string; rank: number; eligibility: string; rationale: string; limitations: string }>, evaluations: Array<{ resourceOfferId: string; result: string; reasonCode: string; detail: string }>): Promise<{ resource_recommendation_id: string; status: string }> {
    const inserted = await client.query<{ resource_recommendation_id: string; status: string }>(
      `INSERT INTO resource_recommendations(family_id,growth_intent_id,status,policy_version,idempotency_key,created_by_person_id)
       VALUES($1,$2,'PROPOSED',$3,$4,$5) RETURNING resource_recommendation_id,status`,
      [input.familyId, input.growthIntentId, VERTICAL_POLICY_VERSION, input.idempotencyKey, actorId]);
    const id = inserted.rows[0].resource_recommendation_id;
    for (const candidate of candidates) {
      await client.query(
        `INSERT INTO resource_recommendation_candidates(resource_recommendation_id,resource_offer_id,rank,eligibility_result,rationale,limitations)
         VALUES($1,$2,$3,$4,$5,$6)`, [id, candidate.resourceOfferId, candidate.rank, candidate.eligibility, candidate.rationale, candidate.limitations]);
    }
    for (const evaluation of evaluations) {
      await client.query(
        `INSERT INTO service_eligibility_evaluations(family_id,resource_offer_id,growth_intent_id,phase,result,reason_code,detail,policy_version)
         VALUES($1,$2,$3,'T1_RECOMMENDATION',$4,$5,$6,$7)`,
        [input.familyId, evaluation.resourceOfferId, input.growthIntentId, evaluation.result, evaluation.reasonCode, evaluation.detail, VERTICAL_POLICY_VERSION]);
    }
    return inserted.rows[0];
  }

  async recommendationView(familyId: string, recommendationId: string): Promise<{ resource_recommendation_id: string; growth_intent_id: string; status: string; candidates: Array<Record<string, unknown>> }> {
    const r = await this.pool.query<{ resource_recommendation_id: string; growth_intent_id: string; status: string }>(
      `SELECT resource_recommendation_id,growth_intent_id,status FROM resource_recommendations WHERE family_id=$1 AND resource_recommendation_id=$2`, [familyId, recommendationId]);
    if (!r.rowCount) throw new Error('recommendation_not_found_in_family');
    const candidates = await this.pool.query(
      `SELECT c.rank,c.eligibility_result,c.rationale,c.limitations,o.resource_offer_id,o.resource_code,o.resource_type,o.title,o.description,o.risk_boundary,o.content_ref
         FROM resource_recommendation_candidates c JOIN resource_offers o ON o.resource_offer_id=c.resource_offer_id
        WHERE c.resource_recommendation_id=$1 ORDER BY c.rank`, [recommendationId]);
    return { ...r.rows[0], candidates: candidates.rows };
  }

  async createDecision(input: DecideServiceInput, audit: AuditInput): Promise<{ family_service_decision_id: string; status: string }> {
    return this.withTransaction(async (client) => {
      const existing = await client.query<{ family_service_decision_id: string; status: string }>(
        `SELECT family_service_decision_id,status FROM family_service_decisions WHERE family_id=$1 AND idempotency_key=$2`, [input.familyId, input.idempotencyKey]);
      if (existing.rowCount) return existing.rows[0];
      await this.assertAdultActor(client, input.familyId, audit.actorId);
      const recommendation = await client.query<{ resource_recommendation_id: string; status: string }>(
        `SELECT resource_recommendation_id,status FROM resource_recommendations WHERE family_id=$1 AND resource_recommendation_id=$2 FOR UPDATE`, [input.familyId, input.recommendationId]);
      if (!recommendation.rowCount) throw new Error('recommendation_not_found_in_family');
      if (recommendation.rows[0].status !== 'PROPOSED') throw new Error('recommendation_not_decidable');
      const allowed = await client.query<{ resource_offer_id: string }>(
        `SELECT c.resource_offer_id FROM resource_recommendation_candidates c WHERE c.resource_recommendation_id=$1 AND c.eligibility_result='ELIGIBLE'`, [input.recommendationId]);
      const allowedIds = new Set(allowed.rows.map((r) => r.resource_offer_id));
      // DECLINE 与 NO_ACTION 均是家庭的有效自主选择：不可夹带资源，也不生成可执行服务计划。
      if (['DECLINE', 'NO_ACTION'].includes(input.decisionType) && input.selectedOfferIds.length) throw new Error('non_action_decision_cannot_select_offer');
      if (!['DECLINE', 'NO_ACTION'].includes(input.decisionType) && !input.selectedOfferIds.length) throw new Error('decision_requires_selected_offer');
      if (input.selectedOfferIds.some((id) => !allowedIds.has(id))) throw new Error('decision_selected_offer_not_eligible_candidate');
      const status = ['DECLINE', 'NO_ACTION'].includes(input.decisionType) ? 'DECLINED' : 'ACCEPTED';
      const inserted = await client.query<{ family_service_decision_id: string; status: string }>(
        `INSERT INTO family_service_decisions(family_id,resource_recommendation_id,decision_type,status,decided_by_person_id,rationale,idempotency_key,policy_version)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING family_service_decision_id,status`,
        [input.familyId, input.recommendationId, input.decisionType, status, audit.actorId, input.rationale ?? null, input.idempotencyKey, VERTICAL_POLICY_VERSION]);
      for (const offerId of input.selectedOfferIds) {
        await client.query(`INSERT INTO family_service_decision_offers(family_service_decision_id,resource_offer_id) VALUES($1,$2)`, [inserted.rows[0].family_service_decision_id, offerId]);
      }
      await client.query(`UPDATE resource_recommendations SET status='DECIDED' WHERE resource_recommendation_id=$1`, [input.recommendationId]);
      return inserted.rows[0];
    });
  }

  async createPlan(input: CreatePlanInput, audit: AuditInput): Promise<{ orchestration_plan_id: string; status: string; step_count: number }> {
    return this.withTransaction(async (client) => {
      const existing = await client.query<{ orchestration_plan_id: string; status: string }>(`SELECT orchestration_plan_id,status FROM orchestration_plans WHERE family_id=$1 AND idempotency_key=$2`, [input.familyId, input.idempotencyKey]);
      if (existing.rowCount) {
        const count = await client.query<{ count: string }>(`SELECT count(*) FROM orchestration_plan_steps WHERE orchestration_plan_id=$1`, [existing.rows[0].orchestration_plan_id]);
        return { ...existing.rows[0], step_count: Number(count.rows[0].count) };
      }
      await this.assertAdultActor(client, input.familyId, audit.actorId);
      const decision = await client.query<{ family_service_decision_id: string; status: string }>(`SELECT family_service_decision_id,status FROM family_service_decisions WHERE family_id=$1 AND family_service_decision_id=$2 FOR UPDATE`, [input.familyId, input.decisionId]);
      if (!decision.rowCount) throw new Error('decision_not_found_in_family');
      if (decision.rows[0].status !== 'ACCEPTED') throw new Error('decision_not_accepted');
      const offers = await client.query<{ resource_offer_id: string }>(`SELECT resource_offer_id FROM family_service_decision_offers WHERE family_service_decision_id=$1 ORDER BY resource_offer_id`, [input.decisionId]);
      if (!offers.rowCount) throw new Error('accepted_decision_has_no_offer');
      const inserted = await client.query<{ orchestration_plan_id: string; status: string }>(
        `INSERT INTO orchestration_plans(family_id,family_service_decision_id,status,idempotency_key,policy_version,created_by_person_id)
         VALUES($1,$2,'READY',$3,$4,$5) RETURNING orchestration_plan_id,status`,
        [input.familyId, input.decisionId, input.idempotencyKey, VERTICAL_POLICY_VERSION, audit.actorId]);
      for (let index = 0; index < offers.rows.length; index += 1) {
        await client.query(`INSERT INTO orchestration_plan_steps(orchestration_plan_id,resource_offer_id,step_order) VALUES($1,$2,$3)`, [inserted.rows[0].orchestration_plan_id, offers.rows[index].resource_offer_id, index + 1]);
      }
      return { ...inserted.rows[0], step_count: offers.rowCount };
    });
  }

  async createServiceCase(
    input: OpenCaseInput,
    audit: AuditInput,
    evaluateT2: (client: pg.PoolClient) => Promise<{ result: string; reasonCode: string; detail: string; offerId: string }>,
  ): Promise<{ service_case_id: string; status: string }> {
    return this.withTransaction(async (client) => {
      const existing = await client.query<{ service_case_id: string; status: string }>(`SELECT service_case_id,status FROM service_cases WHERE family_id=$1 AND idempotency_key=$2`, [input.familyId, input.idempotencyKey]);
      if (existing.rowCount) return existing.rows[0];
      await this.assertAdultActor(client, input.familyId, audit.actorId);
      const plan = await client.query<{ orchestration_plan_id: string; subject_person_id: string; status: string }>(
        `SELECT p.orchestration_plan_id,i.subject_person_id,p.status
           FROM orchestration_plans p
           JOIN family_service_decisions d ON d.family_service_decision_id=p.family_service_decision_id
           JOIN resource_recommendations r ON r.resource_recommendation_id=d.resource_recommendation_id
           JOIN growth_intents i ON i.growth_intent_id=r.growth_intent_id
          WHERE p.family_id=$1 AND p.orchestration_plan_id=$2 FOR UPDATE`, [input.familyId, input.planId]);
      if (!plan.rowCount) throw new Error('plan_not_found_in_family');
      if (plan.rows[0].status !== 'READY') throw new Error('plan_not_ready');
      // T2 必须与 plan 锁定、case 写入和资格留痕处于同一事务，避免资源/同意在检查后变化。
      const evaluation = await evaluateT2(client);
      if (evaluation.result !== 'ELIGIBLE') throw new Error(`execution_ineligible_${evaluation.reasonCode}`);
      const inserted = await client.query<{ service_case_id: string; status: string }>(
        `INSERT INTO service_cases(family_id,subject_person_id,orchestration_plan_id,status,next_action_at,idempotency_key,policy_version,opened_by_person_id)
         VALUES($1,$2,$3,'AWAITING_FOLLOW_UP',now() + interval '1 day',$4,$5,$6) RETURNING service_case_id,status`,
        [input.familyId, plan.rows[0].subject_person_id, input.planId, input.idempotencyKey, VERTICAL_POLICY_VERSION, audit.actorId]);
      await client.query(
        `INSERT INTO service_eligibility_evaluations(family_id,resource_offer_id,service_case_id,phase,result,reason_code,detail,policy_version)
         VALUES($1,$2,$3,'T2_EXECUTION',$4,$5,$6,$7)`,
        [input.familyId, evaluation.offerId, inserted.rows[0].service_case_id, evaluation.result, evaluation.reasonCode, evaluation.detail, VERTICAL_POLICY_VERSION]);
      return inserted.rows[0];
    });
  }

  async recordFollowUp(input: RecordFollowUpInput, audit: AuditInput): Promise<{ follow_up_response_id: string; truth_class: string }> {
    return this.withTransaction(async (client) => {
      const existing = await client.query<{ follow_up_response_id: string; truth_class: string }>(`SELECT follow_up_response_id,truth_class FROM follow_up_responses WHERE family_id=$1 AND idempotency_key=$2`, [input.familyId, input.idempotencyKey]);
      if (existing.rowCount) return existing.rows[0];
      await this.assertAdultActor(client, input.familyId, audit.actorId);
      const serviceCase = await client.query(`SELECT service_case_id FROM service_cases WHERE family_id=$1 AND service_case_id=$2`, [input.familyId, input.serviceCaseId]);
      if (!serviceCase.rowCount) throw new Error('service_case_not_found_in_family');
      const inserted = await client.query<{ follow_up_response_id: string; truth_class: string }>(
        `INSERT INTO follow_up_responses(family_id,service_case_id,helpfulness,response_text,idempotency_key,recorded_by_person_id,policy_version)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING follow_up_response_id,truth_class`,
        [input.familyId, input.serviceCaseId, input.helpfulness, input.responseText ?? null, input.idempotencyKey, audit.actorId, VERTICAL_POLICY_VERSION]);
      await client.query(`UPDATE service_cases SET status='CLOSED',closed_at=now() WHERE family_id=$1 AND service_case_id=$2 AND status='AWAITING_FOLLOW_UP'`, [input.familyId, input.serviceCaseId]);
      return inserted.rows[0];
    });
  }

  async contextReuse(familyId: string, subjectPersonId: string): Promise<Array<{ serviceCaseId: string; needType: string; selectedResources: Array<{ resourceCode: string; resourceType: ResourceType; title: string }>; helpfulness: 'HELPFUL' | 'A_LITTLE_HELPFUL' | 'NOT_HELPFUL' | 'NOT_ANSWERED' | null; followUpAt: string | null }>> {
    const activeConsent = await this.pool.query(
      `SELECT 1
         FROM consents
        WHERE family_id=$1 AND subject_person_id=$2 AND purpose='SERVICE' AND status='GRANTED' AND withdrawn_at IS NULL
        LIMIT 1`,
      [familyId, subjectPersonId],
    );
    if (!activeConsent.rowCount) return [];

    const cases = await this.pool.query<{ service_case_id: string; need_type: string; helpfulness: 'HELPFUL' | 'A_LITTLE_HELPFUL' | 'NOT_HELPFUL' | 'NOT_ANSWERED' | null; follow_up_at: string | null }>(
      `SELECT c.service_case_id,i.need_type,fu.helpfulness,fu.created_at::text AS follow_up_at
         FROM service_cases c
         JOIN orchestration_plans p ON p.orchestration_plan_id=c.orchestration_plan_id
         JOIN family_service_decisions d ON d.family_service_decision_id=p.family_service_decision_id
         JOIN resource_recommendations r ON r.resource_recommendation_id=d.resource_recommendation_id
         JOIN growth_intents i ON i.growth_intent_id=r.growth_intent_id
         LEFT JOIN LATERAL (SELECT helpfulness,created_at FROM follow_up_responses WHERE service_case_id=c.service_case_id ORDER BY created_at DESC LIMIT 1) fu ON true
        WHERE c.family_id=$1 AND c.subject_person_id=$2
        ORDER BY c.opened_at DESC LIMIT 10`, [familyId, subjectPersonId]);
    const result = [];
    for (const row of cases.rows) {
      const offers = await this.pool.query<{ resource_code: string; resource_type: ResourceType; title: string }>(
        `SELECT o.resource_code,o.resource_type,o.title
           FROM service_cases c JOIN orchestration_plans p ON p.orchestration_plan_id=c.orchestration_plan_id
           JOIN orchestration_plan_steps s ON s.orchestration_plan_id=p.orchestration_plan_id
           JOIN resource_offers o ON o.resource_offer_id=s.resource_offer_id
          WHERE c.service_case_id=$1 ORDER BY s.step_order`, [row.service_case_id]);
      result.push({ serviceCaseId: row.service_case_id, needType: row.need_type, selectedResources: offers.rows.map((o) => ({ resourceCode: o.resource_code, resourceType: o.resource_type, title: o.title })), helpfulness: row.helpfulness, followUpAt: row.follow_up_at });
    }
    return result;
  }

  async firstPlanOfferForExecution(client: pg.PoolClient, familyId: string, planId: string): Promise<ResourceOffer> {
    const r = await client.query<ResourceOffer>(
      `SELECT o.resource_offer_id,o.resource_code,o.resource_type,
              coalesce(array_agg(gc.capability_code) FILTER (WHERE gc.capability_code IS NOT NULL), ARRAY[]::varchar[]) AS capability_codes,
              o.title,o.description,o.age_scope,o.age_min_months,o.age_max_months,o.life_stage_scope,o.need_type,o.evidence_level,o.risk_boundary,o.privacy_boundary,o.effort_class,o.duration_class,o.cost_class,o.requires_consent,o.requires_human,o.content_ref,o.provider_qualification,o.availability_status,o.policy_version
         FROM orchestration_plans p JOIN orchestration_plan_steps s ON s.orchestration_plan_id=p.orchestration_plan_id
         JOIN resource_offers o ON o.resource_offer_id=s.resource_offer_id
         LEFT JOIN resource_offer_capabilities roc ON roc.resource_offer_id=o.resource_offer_id
         LEFT JOIN growth_capabilities gc ON gc.growth_capability_id=roc.growth_capability_id
        WHERE p.family_id=$1 AND p.orchestration_plan_id=$2
        GROUP BY o.resource_offer_id,s.step_order ORDER BY s.step_order LIMIT 1`, [familyId, planId]);
    if (!r.rowCount) throw new Error('plan_has_no_offer');
    return r.rows[0];
  }

  async activeServiceConsentForPlan(client: pg.PoolClient, familyId: string, planId: string): Promise<boolean> {
    const r = await client.query<{ subject_person_id: string }>(
      `SELECT i.subject_person_id FROM orchestration_plans p
       JOIN family_service_decisions d ON d.family_service_decision_id=p.family_service_decision_id
       JOIN resource_recommendations rr ON rr.resource_recommendation_id=d.resource_recommendation_id
       JOIN growth_intents i ON i.growth_intent_id=rr.growth_intent_id
       WHERE p.family_id=$1 AND p.orchestration_plan_id=$2`, [familyId, planId]);
    if (!r.rowCount) throw new Error('plan_not_found_in_family');
    return this.activeServiceConsent(client, familyId, r.rows[0].subject_person_id);
  }

  async progressProjection(familyId: string, subjectPersonId: string): Promise<FamilyProgressProjection> {
    const result = await this.pool.query({
      text: `WITH latest_intent AS (
        SELECT i.* FROM growth_intents i WHERE i.family_id=$1 AND i.subject_person_id=$2 ORDER BY i.created_at DESC LIMIT 1
      )
      SELECT i.growth_intent_id,
             rr.resource_recommendation_id,
             d.family_service_decision_id AS decision_id,
             d.decision_type,
             p.orchestration_plan_id,
             c.service_case_id,
             c.status AS case_status,
             c.next_action_at,
             fu.follow_up_response_id,
             fu.helpfulness
        FROM latest_intent i
        LEFT JOIN LATERAL (SELECT * FROM resource_recommendations r WHERE r.family_id=$1 AND r.growth_intent_id=i.growth_intent_id ORDER BY r.created_at DESC LIMIT 1) rr ON true
        LEFT JOIN LATERAL (SELECT * FROM family_service_decisions x WHERE x.family_id=$1 AND x.resource_recommendation_id=rr.resource_recommendation_id ORDER BY x.decided_at DESC LIMIT 1) d ON true
        LEFT JOIN LATERAL (SELECT * FROM orchestration_plans x WHERE x.family_id=$1 AND x.family_service_decision_id=d.family_service_decision_id ORDER BY x.created_at DESC LIMIT 1) p ON true
        LEFT JOIN LATERAL (SELECT * FROM service_cases x WHERE x.family_id=$1 AND x.orchestration_plan_id=p.orchestration_plan_id ORDER BY x.opened_at DESC LIMIT 1) c ON true
        LEFT JOIN LATERAL (SELECT * FROM follow_up_responses x WHERE x.family_id=$1 AND x.service_case_id=c.service_case_id ORDER BY x.created_at DESC LIMIT 1) fu ON true`,
      values: [familyId, subjectPersonId],
    });
    if (!result.rowCount) {
      return { family_id: familyId, subject_person_id: subjectPersonId, current_stage: 'NEED_CONFIRMED', next_step: 'CONFIRM_SERVICE', can_pause: false, can_cancel: false, last_family_signal: null, source_refs: { growth_intent_id: null, recommendation_id: null, decision_id: null, plan_id: null, service_case_id: null, follow_up_response_id: null }, truth_boundary: 'SERVICE_PROGRESS_NOT_GROWTH_OUTCOME' };
    }
    const row = result.rows[0] as { growth_intent_id: string; resource_recommendation_id: string | null; decision_id: string | null; decision_type: string | null; orchestration_plan_id: string | null; service_case_id: string | null; case_status: string | null; next_action_at: string | null; follow_up_response_id: string | null; helpfulness: FamilyProgressProjection['last_family_signal'] };
    const noAction = row.decision_type === 'NO_ACTION' || row.decision_type === 'DECLINE';
    const stage = row.follow_up_response_id ? 'FOLLOW_UP_CAPTURED' : noAction ? 'NO_ACTION' : row.service_case_id ? (row.case_status === 'AWAITING_FOLLOW_UP' ? 'FOLLOW_UP_DUE' : 'SERVICE_OPEN') : row.orchestration_plan_id ? 'PLAN_READY' : row.decision_id ? 'FAMILY_DECIDED' : row.resource_recommendation_id ? 'RESOURCE_OPTIONS' : 'NEED_CONFIRMED';
    const nextStep = stage === 'NEED_CONFIRMED' ? 'CONFIRM_SERVICE' : stage === 'RESOURCE_OPTIONS' ? 'REVIEW_OPTIONS' : stage === 'FAMILY_DECIDED' ? 'REVIEW_PLAN' : stage === 'PLAN_READY' ? 'OPEN_SERVICE_CASE' : stage === 'SERVICE_OPEN' || stage === 'FOLLOW_UP_DUE' ? 'RECORD_FOLLOW_UP' : 'NONE';
    return { family_id: familyId, subject_person_id: subjectPersonId, current_stage: stage, next_step: nextStep, can_pause: stage === 'SERVICE_OPEN' || stage === 'FOLLOW_UP_DUE', can_cancel: stage !== 'FOLLOW_UP_CAPTURED' && stage !== 'NO_ACTION', last_family_signal: row.helpfulness, source_refs: { growth_intent_id: row.growth_intent_id, recommendation_id: row.resource_recommendation_id, decision_id: row.decision_id, plan_id: row.orchestration_plan_id, service_case_id: row.service_case_id, follow_up_response_id: row.follow_up_response_id }, truth_boundary: 'SERVICE_PROGRESS_NOT_GROWTH_OUTCOME' };
  }

  async stewardQueue(familyId: string): Promise<StewardQueueItem[]> {
    const result = await this.pool.query<{ family_id: string; service_case_id: string; subject_person_id: string; status: string; sla_class: string; next_action_at: string | null; escalation_reason: string | null; has_follow_up: boolean }>(
      `SELECT c.family_id,c.service_case_id,c.subject_person_id,c.status,c.sla_class,c.next_action_at,c.escalation_reason,
              EXISTS (SELECT 1 FROM follow_up_responses fu WHERE fu.family_id=c.family_id AND fu.service_case_id=c.service_case_id) AS has_follow_up
         FROM service_cases c
        WHERE c.family_id=$1 AND c.status NOT IN ('CLOSED','CANCELLED')
        ORDER BY c.next_action_at NULLS LAST,c.opened_at`, [familyId]);
    return result.rows.map((row) => ({ family_id: row.family_id, service_case_id: row.service_case_id, subject_person_id: row.subject_person_id, status: row.status, needs_follow_up: !row.has_follow_up && row.status === 'AWAITING_FOLLOW_UP', needs_recovery: row.status === 'ESCALATED' || !!row.escalation_reason, sla_class: row.sla_class, next_action_at: row.next_action_at, reason_code: row.status === 'ESCALATED' || row.escalation_reason ? 'ESCALATION_REVIEW' : !row.has_follow_up && row.status === 'AWAITING_FOLLOW_UP' ? 'FOLLOW_UP_DUE' : 'OPEN_CASE', truth_boundary: 'INTERNAL_SERVICE_QUEUE_NOT_CHILD_OR_FAMILY_RISK_SCORE' }));
  }

  async serviceMetrics(familyId: string, subjectPersonId: string): Promise<FamilyServiceMetrics> {
    const result = await this.pool.query<{ recommendation_count: string; decision_count: string; accepted_decision_count: string; case_count: string; follow_up_count: string; first_intent_at: string | null; first_recommendation_at: string | null; helpfulness: FamilyServiceMetrics['helpfulness_signal'] }>(
      `WITH intents AS (SELECT growth_intent_id,created_at FROM growth_intents WHERE family_id=$1 AND subject_person_id=$2),
       recs AS (SELECT r.resource_recommendation_id,r.growth_intent_id,r.created_at FROM resource_recommendations r JOIN intents i ON i.growth_intent_id=r.growth_intent_id),
       decisions AS (SELECT d.family_service_decision_id,d.status,r.growth_intent_id FROM family_service_decisions d JOIN recs r ON r.resource_recommendation_id=d.resource_recommendation_id),
       cases AS (SELECT c.service_case_id,c.orchestration_plan_id FROM service_cases c WHERE c.family_id=$1 AND c.subject_person_id=$2),
       followups AS (SELECT fu.follow_up_response_id,fu.service_case_id,fu.helpfulness,fu.created_at FROM follow_up_responses fu JOIN cases c ON c.service_case_id=fu.service_case_id),
       latest_fu AS (SELECT helpfulness FROM followups ORDER BY created_at DESC LIMIT 1)
       SELECT (SELECT count(*) FROM recs)::text AS recommendation_count,
              (SELECT count(*) FROM decisions)::text AS decision_count,
              (SELECT count(*) FROM decisions WHERE status='ACCEPTED')::text AS accepted_decision_count,
              (SELECT count(*) FROM cases)::text AS case_count,
              (SELECT count(*) FROM followups)::text AS follow_up_count,
              (SELECT min(created_at)::text FROM intents) AS first_intent_at,
              (SELECT min(created_at)::text FROM recs) AS first_recommendation_at,
              (SELECT helpfulness FROM latest_fu) AS helpfulness`, [familyId, subjectPersonId]);
    const row = result.rows[0];
    const recommendations = Number(row.recommendation_count);
    const decisions = Number(row.decision_count);
    const accepted = Number(row.accepted_decision_count);
    const cases = Number(row.case_count);
    const followups = Number(row.follow_up_count);
    const time = row.first_intent_at && row.first_recommendation_at ? Math.max(0, new Date(row.first_recommendation_at).getTime() - new Date(row.first_intent_at).getTime()) : null;
    return { family_id: familyId, subject_person_id: subjectPersonId, time_to_first_recommendation_ms: time, family_decision_rate: recommendations ? decisions / recommendations : 0, service_case_open_rate: accepted ? cases / accepted : 0, follow_up_capture_rate: cases ? followups / cases : 0, helpfulness_signal: row.helpfulness, context_reuse_available: cases > 0, truth_boundary: 'SERVICE_DELIVERY_AND_FAMILY_PERCEPTION_NOT_GROWTH_OUTCOME' };
  }

  async createStewardHandoffDraft(input: CreateStewardHandoffDraftInput, audit: AuditInput): Promise<StewardHandoffDraft> {
    return this.withTransaction(async (client) => {
      const existing = await client.query<StewardHandoffDraft>(`SELECT steward_handoff_draft_id,family_id,service_case_id,subject_person_id,source_follow_up_response_id,status,summary_text,limitation_text,created_at::text,updated_at::text FROM steward_handoff_drafts WHERE family_id=$1 AND idempotency_key=$2`, [input.familyId, input.idempotencyKey]);
      if (existing.rowCount) return existing.rows[0];
      await this.assertAdultActor(client, input.familyId, audit.actorId);
      const relation = await client.query(`SELECT service_case_id FROM service_cases WHERE family_id=$1 AND service_case_id=$2 AND subject_person_id=$3 AND status NOT IN ('CLOSED','CANCELLED')`, [input.familyId, input.serviceCaseId, input.subjectPersonId]);
      if (!relation.rowCount) throw new Error('service_case_not_open_in_family');
      if (input.sourceFollowUpResponseId) {
        const followup = await client.query(`SELECT follow_up_response_id FROM follow_up_responses WHERE family_id=$1 AND service_case_id=$2 AND follow_up_response_id=$3`, [input.familyId, input.serviceCaseId, input.sourceFollowUpResponseId]);
        if (!followup.rowCount) throw new Error('follow_up_not_found_in_family');
      }
      const inserted = await client.query<StewardHandoffDraft>(`INSERT INTO steward_handoff_drafts(family_id,service_case_id,subject_person_id,source_follow_up_response_id,summary_text,created_by_person_id,updated_by_person_id,idempotency_key,policy_version) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8) RETURNING steward_handoff_draft_id,family_id,service_case_id,subject_person_id,source_follow_up_response_id,status,summary_text,limitation_text,created_at::text,updated_at::text`, [input.familyId,input.serviceCaseId,input.subjectPersonId,input.sourceFollowUpResponseId ?? null,input.summaryText,audit.actorId,input.idempotencyKey,VERTICAL_POLICY_VERSION]);
      await this.writeAudit(client, input.familyId, audit, input.idempotencyKey, 'CreateStewardHandoffDraft', 'steward_handoff_draft', inserted.rows[0].steward_handoff_draft_id, 'SUCCESS');
      return inserted.rows[0];
    });
  }

  async updateStewardHandoffDraft(input: UpdateStewardHandoffDraftInput, audit: AuditInput): Promise<StewardHandoffDraft> {
    return this.withTransaction(async (client) => {
      await this.assertAdultActor(client, input.familyId, audit.actorId);
      const updated = await client.query<StewardHandoffDraft>(`UPDATE steward_handoff_drafts SET summary_text=$1,status=coalesce($2,status),updated_by_person_id=$3,updated_at=now() WHERE family_id=$4 AND steward_handoff_draft_id=$5 RETURNING steward_handoff_draft_id,family_id,service_case_id,subject_person_id,source_follow_up_response_id,status,summary_text,limitation_text,created_at::text,updated_at::text`, [input.summaryText,input.status ?? null,audit.actorId,input.familyId,input.draftId]);
      if (!updated.rowCount) throw new Error('steward_handoff_draft_not_found_in_family');
      await this.writeAudit(client, input.familyId, audit, input.idempotencyKey, 'UpdateStewardHandoffDraft', 'steward_handoff_draft', input.draftId, 'SUCCESS');
      return updated.rows[0];
    });
  }

  private async writeAudit(client: pg.PoolClient, familyId: string, audit: AuditInput, idempotencyKey: string, actionName: string, resourceType: string, resourceId: string, result: string): Promise<void> {
    await client.query(`INSERT INTO audit_logs(family_id,actor_type,actor_id,action_name,resource_type,resource_id,correlation_id,idempotency_key,result,metadata) VALUES($1,'PERSON',$2,$3,$4,$5,$6,$7,$8,$9)`, [familyId,audit.actorId,actionName,resourceType,resourceId,audit.correlationId,idempotencyKey,result,JSON.stringify({ source: audit.source, policy_version: VERTICAL_POLICY_VERSION, boundary: 'INTERNAL_FAMILY_SCOPED_DRAFT_NOT_EXTERNAL_HANDOFF' })]);
  }

  private async assertAdultActor(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
    const r = await client.query<{ person_type: string; role: string }>(
      `SELECT p.person_type,m.role
         FROM persons p
         JOIN family_memberships m ON m.person_id=p.person_id AND m.family_id=p.family_id AND m.status='ACTIVE'
         JOIN account_person_bindings b ON b.person_id=p.person_id AND b.status='ACTIVE'
        WHERE p.family_id=$1 AND p.person_id=$2
        LIMIT 1`,
      [familyId, actorId],
    );
    if (!r.rowCount) throw new Error('trusted_actor_not_in_family');
    if (r.rows[0].person_type !== 'PARENT' || !['OWNER_GUARDIAN','GUARDIAN'].includes(r.rows[0].role)) {
      throw new Error('trusted_actor_must_be_active_guardian');
    }
  }

  private async assertAdultActorAndChildSubject(client: pg.PoolClient, familyId: string, actorId: string, subjectPersonId: string): Promise<void> {
    await this.assertAdultActor(client, familyId, actorId);
    const subject = await client.query<{ person_type: string }>(`SELECT person_type FROM persons WHERE family_id=$1 AND person_id=$2`, [familyId, subjectPersonId]);
    if (!subject.rowCount || subject.rows[0].person_type !== 'CHILD') throw new Error('subject_must_be_child_in_family');
  }
}

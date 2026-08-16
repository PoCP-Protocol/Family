import { Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';
import type { AuditInput, CreateIntentInput, CreatePlanInput, DecideServiceInput, OpenCaseInput, RecordFollowUpInput, RequestRecommendationInput, ResourceOffer, ResourceType } from './orchestration.types';
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

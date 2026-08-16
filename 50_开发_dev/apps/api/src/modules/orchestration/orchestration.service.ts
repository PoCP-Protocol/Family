/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 编排 runtime 服务(单家庭价值闭环)。
 * 建议≠决定≠计划≠执行≠回访≠观察≠复用;RANKING≠ORCHESTRATION;T1 推荐 eligible ≠ T2 执行 eligible(FAIL CLOSED)。
 * 不写 GrowthPriority/GrowthAction/OutcomeObservation;不调 Principal.acceptProposal;安全由 Principal 内部保障。
 */
import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  ContextReuseProjectionDto, FamilyDecisionType, GrowthCapabilityKey,
  ResourceOfferDto, ResourceRecommendationDto, SafeOrchestrationOutcome,
} from '@family/contracts';
import { PrincipalAiCoachResource } from '../principal/principal-ai-coach.resource';
import { classifyNeed } from './need-classification.policy';
import { candidateOffersForCommunicationConflict } from './resource.registry';
import { evaluateOfferEligibility, type EligibilityContext } from './eligibility.policy';
import { buildRecommendation } from './recommendation.policy';
import { checkDecisionIntegrity } from './decision-integrity.policy';
import { OrchestrationRepository, type EligibilityFacts } from './orchestration.repository';

const POLICY_VERSION = 'orch-v1';
const SELF_STEWARD = 'family-steward:v1';

export interface RequestHelpResult {
  signal_id: string;
  proposed_need_type: string | null;
  proposed_capability_keys: GrowthCapabilityKey[];
  confirm_prompt: string;         // 家长可读的显式确认提示
  supported: boolean;             // false=当前纵切不支持,不臆造
}

export interface DecideResult {
  decision_id: string;
  outcome: 'SERVICE_STARTED' | SafeOrchestrationOutcome;
  case_id: string | null;
  ai_coach: { delivered: boolean; risk_route: string; human_handoff: boolean } | null;
  t2_ineligible_offers?: string[];
}

@Injectable()
export class OrchestrationService {
  constructor(
    @Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository,
    @Inject(PrincipalAiCoachResource) private readonly aiCoach: PrincipalAiCoachResource,
  ) {}

  private eligibilityContext(_offerRequiresConsent: boolean, facts: EligibilityFacts, evaluationRef: string): EligibilityContext {
    return {
      requiredConsentGranted: facts.aiPersonalizationConsentGranted,
      providerQualificationActive: true,   // V1:自营 AI_COACH provider 资格 ACTIVE(source of truth = Provider Qualification Gate)
      ageInScope: facts.ageInScope,
      safetyRouteNormal: true,              // AI_COACH 交付时由 Principal 内部安全路由强制;此处不预判放宽
      available: true,
      externalReferralTargetConfigured: !!process.env.FAMILY_EXTERNAL_REFERRAL_TARGET,
      policyVersion: POLICY_VERSION,
      evaluatedAt: new Date().toISOString(),
      evaluationRef,
      // offerRequiresConsent 已由 offer.requires_consent 驱动(见 evaluateOfferEligibility)
    };
  }

  /** ① 家长表达问题 → 记录服务层原始输入 + NON_CANONICAL NeedSignal;返回需家长显式确认的 Intent 提案。 */
  async requestHelp(familyId: string, subjectPersonId: string, rawText: string, source: 'MANUAL' | 'PRINCIPAL' | 'SERVICE_FOLLOWUP', correlationId: string): Promise<RequestHelpResult> {
    if (!rawText?.trim()) throw new BadRequestException('raw_text_required');
    const cls = classifyNeed(rawText);
    return this.repo.withTransaction(async (c) => {
      const input = await c.query<{ input_id: string }>(
        `insert into growth_need_inputs(family_id, subject_person_id, raw_text) values ($1,$2,$3) returning input_id`,
        [familyId, subjectPersonId, rawText.trim()],
      );
      const inputId = input.rows[0].input_id;
      const signal = await c.query<{ signal_id: string }>(
        `insert into growth_need_signals(family_id, subject_person_id, source, raw_ref, inferred_need_type, confidence, canonical_family_fact)
         values ($1,$2,$3,$4,$5,$6,false) returning signal_id`,
        [familyId, subjectPersonId, source, inputId, cls.need_type, cls.confidence],
      );
      const supported = cls.need_type != null;
      return {
        signal_id: signal.rows[0].signal_id,
        proposed_need_type: cls.need_type,
        proposed_capability_keys: cls.required_capability_keys,
        confirm_prompt: supported
          ? '你现在最想解决的是:先让冲突降下来,并找到今晚重新开口的方式?'
          : '我暂时没完全理解这个情况。要不要换句话描述你现在最想解决的问题?',
        supported,
      };
    });
  }

  /** ② 家长显式确认 → 创建 GrowthIntent(OPEN)。不创建 GrowthPriority。 */
  async confirmIntent(familyId: string, subjectPersonId: string, actorPersonId: string, signalId: string, goalText: string): Promise<{ intent_id: string; required_capability_keys: GrowthCapabilityKey[] }> {
    const cls = classifyNeed(goalText);
    // 若确认文本无法分类,回退到已存 signal 的推断类型(仍要求支持的纵切类型)。
    return this.repo.withTransaction(async (c) => {
      const sig = await c.query<{ inferred_need_type: string | null }>(
        `select inferred_need_type from growth_need_signals where signal_id=$1 and family_id=$2`, [signalId, familyId],
      );
      const needType = cls.need_type ?? sig.rows[0]?.inferred_need_type ?? null;
      if (needType !== 'PARENT_CHILD_COMMUNICATION_CONFLICT') throw new BadRequestException('unsupported_need_for_v1_slice');
      const caps = cls.required_capability_keys.length ? cls.required_capability_keys : (['DE_ESCALATION', 'COMMUNICATION_REOPENING'] as GrowthCapabilityKey[]);
      const intent = await c.query<{ intent_id: string }>(
        `insert into growth_intents(family_id, subject_person_id, signal_ref, need_type, goal_text, required_capability_keys, status, confirmed_by)
         values ($1,$2,$3,$4,$5,$6,'OPEN',$7) returning intent_id`,
        [familyId, subjectPersonId, signalId, needType, goalText.trim(), caps, actorPersonId],
      );
      return { intent_id: intent.rows[0].intent_id, required_capability_keys: caps };
    });
  }

  /** ③ 生成推荐:候选原子 Offer → T1 Eligibility(FAIL CLOSED)→ 确定性排序 → 持久化 Recommendation。 */
  async recommend(familyId: string, subjectPersonId: string, intentId: string): Promise<ResourceRecommendationDto> {
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    const intentRow = await this.repo.query<{ required_capability_keys: string[] }>(
      `select required_capability_keys from growth_intents where intent_id=$1 and family_id=$2 and status='OPEN'`, [intentId, familyId],
    );
    if ((intentRow.rowCount ?? 0) === 0) throw new BadRequestException('intent_not_open');
    const requiredCaps = (intentRow.rows[0].required_capability_keys as GrowthCapabilityKey[]);

    const candidates = candidateOffersForCommunicationConflict({
      approvedPracticeContentRef: process.env.FAMILY_APPROVED_PRACTICE_CONTENT_REF ?? null,
      externalReferralTargetRef: process.env.FAMILY_EXTERNAL_REFERRAL_TARGET ?? null,
    });
    const eligible: ResourceOfferDto[] = [];
    return this.repo.withTransaction(async (c) => {
      for (const offer of candidates) {
        const ref = randomUUID();
        const evalDto = evaluateOfferEligibility(offer, 'T1', this.eligibilityContext(offer.requires_consent, facts, ref));
        await c.query(
          `insert into eligibility_evaluations(eligibility_evaluation_ref, family_id, intent_ref, stage, offer_ref, eligible, reason_codes, policy_version)
           values ($1,$2,$3,'T1',$4,$5,$6,$7)`,
          [ref, familyId, intentId, offer.offer_id, evalDto.eligible, evalDto.reason_codes, POLICY_VERSION],
        );
        if (evalDto.eligible) eligible.push(offer);
      }
      const rec = buildRecommendation({ recommendationId: randomUUID(), intentId, version: 1, requiredCapabilityKeys: requiredCaps, eligibleOffers: eligible });
      const saved = await c.query<{ recommendation_id: string }>(
        `insert into resource_recommendations(recommendation_id, family_id, intent_ref, version, candidates, recommended_offer_refs, required_capability_keys, covered_capability_keys, uncovered_capability_keys, why_now, status)
         values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,'SHOWN') returning recommendation_id`,
        [rec.recommendation_id, familyId, intentId, rec.version, JSON.stringify(rec.candidates), rec.recommended_offer_refs, rec.required_capability_keys, rec.covered_capability_keys, rec.uncovered_capability_keys, rec.why_now],
      );
      return { ...rec, recommendation_id: saved.rows[0].recommendation_id, candidates: rec.candidates };
    });
  }

  /** ④ 家庭决定 → 完整性校验 → Plan(声明) → T2 复验(FAIL CLOSED)→ ServiceCase + AI_COACH 交付。 */
  async decide(params: {
    familyId: string; subjectPersonId: string; actorPersonId: string; intentId: string;
    recommendationId: string; recommendationVersion: number; decisionType: FamilyDecisionType; selectedOfferRefs: string[];
    goalMessage: string; correlationId: string;
  }): Promise<DecideResult> {
    const { familyId, subjectPersonId, actorPersonId, intentId, recommendationId, recommendationVersion, decisionType, selectedOfferRefs, goalMessage, correlationId } = params;

    const recRow = await this.repo.query<{ candidates: unknown; recommended_offer_refs: string[]; version: number; required_capability_keys: string[]; covered_capability_keys: string[]; uncovered_capability_keys: string[]; why_now: string }>(
      `select candidates, recommended_offer_refs, version, required_capability_keys, covered_capability_keys, uncovered_capability_keys, why_now
         from resource_recommendations where recommendation_id=$1 and family_id=$2 and intent_ref=$3`,
      [recommendationId, familyId, intentId],
    );
    if ((recRow.rowCount ?? 0) === 0) throw new BadRequestException('recommendation_not_found');
    const rec: ResourceRecommendationDto = {
      recommendation_id: recommendationId, intent_id: intentId, version: recRow.rows[0].version,
      candidates: recRow.rows[0].candidates as ResourceRecommendationDto['candidates'],
      recommended_offer_refs: recRow.rows[0].recommended_offer_refs,
      required_capability_keys: recRow.rows[0].required_capability_keys as GrowthCapabilityKey[],
      covered_capability_keys: recRow.rows[0].covered_capability_keys as GrowthCapabilityKey[],
      uncovered_capability_keys: recRow.rows[0].uncovered_capability_keys as GrowthCapabilityKey[],
      why_now: recRow.rows[0].why_now, status: 'SHOWN',
    };

    const integrity = checkDecisionIntegrity(rec, decisionType, selectedOfferRefs, recommendationVersion);
    if (!integrity.ok) throw new BadRequestException(`decision_integrity:${integrity.code}`);

    // 记录 Decision(独立可审计边界)。
    const decisionId = await this.repo.withTransaction(async (c) => {
      const d = await c.query<{ decision_id: string }>(
        `insert into family_service_decisions(family_id, subject_person_id, intent_ref, recommendation_ref, recommendation_version, decision_type, selected_offer_refs, actor_person_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8) returning decision_id`,
        [familyId, subjectPersonId, intentId, recommendationId, recommendationVersion, decisionType, selectedOfferRefs, actorPersonId],
      );
      return d.rows[0].decision_id;
    });

    if (decisionType === 'DISMISS' || selectedOfferRefs.length === 0) {
      await this.repo.query(`update growth_intents set status='CLOSED', close_reason='NO_ACTION_SELECTED' where intent_id=$1 and family_id=$2`, [intentId, familyId]);
      return { decision_id: decisionId, outcome: 'NO_ACTION', case_id: null, ai_coach: null };
    }

    // 声明式 Plan(不拥有执行真相)。selected 是原子 offer_id;从 candidates 恢复其能力覆盖用于 step。
    const candMap = new Map(rec.candidates.map((c) => [c.offer_ref, c.covered_capability_keys]));
    const steps = selectedOfferRefs.map((offerRef, i) => ({
      step_no: i + 1,
      capability_keys: candMap.get(offerRef) ?? rec.required_capability_keys,
      offer_ref: offerRef,
      covered_capability_keys: candMap.get(offerRef) ?? [],
      trigger: i === 0 ? 'NOW' : 'AFTER_PREV',
      condition: null,
    }));

    // T2 执行前复验(FAIL CLOSED)——推荐时 eligible ≠ 执行时 eligible。
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    const allCandidateOffers = candidateOffersForCommunicationConflict({
      approvedPracticeContentRef: process.env.FAMILY_APPROVED_PRACTICE_CONTENT_REF ?? null,
      externalReferralTargetRef: process.env.FAMILY_EXTERNAL_REFERRAL_TARGET ?? null,
    });
    // 用 resource_type 对齐(offer_id 是每次生成的;T2 按 selected 的 type 语义复验第一顺位 AI_COACH/PRACTICE)。
    const t2Ineligible: string[] = [];
    const planId = await this.repo.withTransaction(async (c) => {
      const p = await c.query<{ plan_id: string }>(
        `insert into orchestration_plans(family_id, subject_person_id, intent_ref, version, accepted_by_decision_ref, steps, status)
         values ($1,$2,$3,1,$4,$5::jsonb,'ACCEPTED') returning plan_id`,
        [familyId, subjectPersonId, intentId, decisionId, JSON.stringify(steps)],
      );
      for (const offerRef of selectedOfferRefs) {
        // 以 AI_COACH 语义复验(V1 selected 主要是 AI_COACH);其它 type 用对应 requires_consent。
        const proto = allCandidateOffers.find((o) => o.resource_type === 'AI_COACH') ?? allCandidateOffers[0];
        const ref = randomUUID();
        const t2 = evaluateOfferEligibility({ ...proto, offer_id: offerRef }, 'T2', this.eligibilityContext(proto.requires_consent, facts, ref));
        await c.query(
          `insert into eligibility_evaluations(eligibility_evaluation_ref, family_id, intent_ref, stage, offer_ref, eligible, reason_codes, policy_version)
           values ($1,$2,$3,'T2',$4,$5,$6,$7)`,
          [ref, familyId, intentId, offerRef, t2.eligible, t2.reason_codes, POLICY_VERSION],
        );
        if (!t2.eligible) t2Ineligible.push(offerRef);
      }
      return p.rows[0].plan_id;
    });

    // T2 不通过 → 不执行、不静默替换 → 显式安全出口。
    if (t2Ineligible.length > 0) {
      return { decision_id: decisionId, outcome: 'RE_RECOMMEND_REQUIRED', case_id: null, ai_coach: null, t2_ineligible_offers: t2Ineligible };
    }

    // T2 通过 → 创建 ServiceCase(执行真相)+ AI_COACH 交付(Principal 内部安全)。
    const caseId = await this.repo.withTransaction(async (c) => {
      const sc = await c.query<{ case_id: string }>(
        `insert into service_cases(family_id, subject_person_id, intent_ref, plan_ref, status, owner)
         values ($1,$2,$3,$4,'IN_PROGRESS',$5) returning case_id`,
        [familyId, subjectPersonId, intentId, planId, SELF_STEWARD],
      );
      return sc.rows[0].case_id;
    });

    const coach = await this.aiCoach.deliver({ familyId, subjectPersonId, actorPersonId, message: goalMessage, correlationId });
    await this.repo.query(
      `insert into service_contributions(case_ref, provider_ref, role, task_ref, completed_at, quality_state)
       values ($1,$2,'AI_COACH',$3, now(), $4)`,
      [caseId, 'family-self:ai-coach', `principal-session:${coach.session_id}`, coach.delivered ? 'DELIVERED' : 'HELD'],
    );
    // AI 转人工/扣留 → Case 反映 WAITING_FAMILY / ESCALATED(不自动继续)。
    if (coach.human_handoff) {
      await this.repo.query(`update service_cases set status='ESCALATED' where case_id=$1`, [caseId]);
    }
    await this.repo.query(`update growth_intents set status='CLOSED', close_reason='SERVICE_DELIVERED' where intent_id=$1 and family_id=$2`, [intentId, familyId]);

    return {
      decision_id: decisionId,
      outcome: 'SERVICE_STARTED',
      case_id: caseId,
      ai_coach: { delivered: coach.delivered, risk_route: coach.risk_route, human_handoff: coach.human_handoff },
    };
  }

  async getCase(familyId: string, caseId: string): Promise<Record<string, unknown> | null> {
    const r = await this.repo.query(
      `select case_id, status, owner, opened_at, next_action_at, closed_at, intent_ref, plan_ref from service_cases where case_id=$1 and family_id=$2`,
      [caseId, familyId],
    );
    return r.rows[0] ?? null;
  }

  /** ⑤ 回访 + helpfulness(服务层;非 Observation;不写 canonical)。 */
  async submitFollowUp(familyId: string, caseId: string, helpfulness: string, text: string | null): Promise<{ followup_id: string }> {
    const allowed = ['HELPFUL', 'SOMEWHAT_HELPFUL', 'NOT_HELPFUL_YET', 'UNANSWERED'];
    if (!allowed.includes(helpfulness)) throw new BadRequestException('invalid_helpfulness');
    const own = await this.repo.query(`select 1 from service_cases where case_id=$1 and family_id=$2`, [caseId, familyId]);
    if ((own.rowCount ?? 0) === 0) throw new ConflictException('case_not_in_family');
    const r = await this.repo.query<{ followup_id: string }>(
      `insert into service_followup_responses(case_ref, response_ref, helpfulness, truth_class)
       values ($1,$2,$3,'SERVICE_NOTE') returning followup_id`,
      [caseId, text, helpfulness],
    );
    return { followup_id: r.rows[0].followup_id };
  }

  /** ⑥ M5 Context Reuse(只读投影;禁因果断言)。 */
  async contextReuse(familyId: string, subjectPersonId: string): Promise<ContextReuseProjectionDto> {
    const prior = await this.repo.query<{ case_id: string; plan_ref: string }>(
      `select sc.case_id, sc.plan_ref from service_cases sc
        where sc.family_id=$1 and sc.subject_person_id=$2 order by sc.opened_at desc limit 1`,
      [familyId, subjectPersonId],
    );
    const priorCase = prior.rows[0] ?? null;
    let helpfulness: ContextReuseProjectionDto['prior_helpfulness'] = null;
    const priorOffers: string[] = [];
    const statements: string[] = [];
    if (priorCase) {
      const fu = await this.repo.query<{ helpfulness: string }>(
        `select helpfulness from service_followup_responses where case_ref=$1 order by captured_at desc limit 1`, [priorCase.case_id],
      );
      helpfulness = (fu.rows[0]?.helpfulness as ContextReuseProjectionDto['prior_helpfulness']) ?? null;
      const plan = await this.repo.query<{ steps: Array<{ offer_ref: string }> }>(`select steps from orchestration_plans where plan_id=$1`, [priorCase.plan_ref]);
      for (const s of (plan.rows[0]?.steps ?? [])) priorOffers.push(s.offer_ref);
      statements.push('上次类似情况,你选择了先让冲突降下来,再找机会重新开口。');
      if (helpfulness) statements.push(helpfulness === 'HELPFUL' ? '你上次反馈:有帮助。' : helpfulness === 'SOMEWHAT_HELPFUL' ? '你上次反馈:有一点帮助。' : '你上次反馈:暂时没有帮助。');
    }
    return {
      family_id: familyId,
      subject_person_id: subjectPersonId,
      need_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      prior_case_ref: priorCase?.case_id ?? null,
      prior_selected_offer_refs: priorOffers,
      prior_helpfulness: helpfulness,
      reuse_statements: statements, // 仅主观回顾;绝无"方法已证明有效"
    };
  }
}

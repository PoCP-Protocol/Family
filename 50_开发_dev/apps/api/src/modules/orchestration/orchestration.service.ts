/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 编排 runtime 服务(单家庭价值闭环;3A 运行时真相修正)。
 * 七真相分离;RANKING≠ORCHESTRATION;T1 推荐 eligible ≠ T2 执行 eligible(exact-offer snapshot 复验,FAIL CLOSED)。
 * 执行按【所选 Offer 类型】分派(绝不都跑 AI_COACH);subject 链服务端派生;不写 canonical;不臆造家庭文本。
 * SERVICE consent 是落库/执行前提;AI_PERSONALIZATION 是 AI_COACH 额外要求;年龄严格 12–15。
 */
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { safetyPrecheck } from '@family/principal-ai';
import type {
  ContextReuseProjectionDto, FamilyDecisionType, GrowthCapabilityKey,
  ResourceOfferDto, ResourceRecommendationDto, SafeOrchestrationOutcome,
} from '@family/contracts';
import { PrincipalAiCoachResource } from '../principal/principal-ai-coach.resource';
import { classifyNeed } from './need-classification.policy';
import { candidateOffersForCommunicationConflict, resolveResourceRuntimeState } from './resource.registry';
import { evaluateOfferEligibility, type EligibilityContext } from './eligibility.policy';
import { buildRecommendation } from './recommendation.policy';
import { checkDecisionIntegrity } from './decision-integrity.policy';
import { OrchestrationRepository, type EligibilityFacts } from './orchestration.repository';
import type {
  ConfirmSyntheticIntentDto,
  RecordSyntheticDecisionDto,
  StartSyntheticNeedDto,
  TestLoopAuditEntryDto,
  TestLoopCandidatesDto,
  TestLoopDecisionResultDto,
  TestLoopIntentResultDto,
  TestLoopNeedResultDto,
} from './l0-l1-test-loop.dto';
import { decisionTextEquivalent, noActionTextEquivalent, safeStop, toEqualCandidateView } from './l0-l1-test-loop.policy';
import { requireDevSyntheticTestLoop, TEST_LOOP_POLICY_VERSION } from './test-env.policy';
import {
  createMockExecutorReceipt,
  findSyntheticCandidate,
  SYNTHETIC_ADMITTED_CANDIDATES,
  SYNTHETIC_FIXTURE_VERSION,
  SYNTHETIC_INTENT_CHOICES,
  SYNTHETIC_NEED_CHOICES,
} from './test-fixtures/synthetic-admitted-candidates';
import { FamilyLlmGatewayService } from './llm-gateway/family-llm-gateway.service';
import { getFamilyLlmPagePolicy, listFamilyLlmPagePolicies } from './llm-gateway/family-llm-page-policy';
import type { FamilyLlmGatewayResult } from './llm-gateway/family-llm.contract';

const POLICY_VERSION = 'orch-v1';
const SELF_STEWARD = 'family-steward:v1';

export interface RequestHelpResult {
  signal_id: string; proposed_need_type: string | null; proposed_capability_keys: GrowthCapabilityKey[];
  confirm_prompt: string; supported: boolean;
}
export interface DecideResult {
  decision_id: string; outcome: 'SERVICE_STARTED' | SafeOrchestrationOutcome;
  case_id: string | null; executed_resource_type: string | null;
  ai_coach: { delivered: boolean; risk_route: string; human_handoff: boolean } | null;
  t2_ineligible_offers?: string[];
}

@Injectable()
export class OrchestrationService {
  /** DEV-only 内存审计：仅支持当前进程的内部演示回放，不持久化真实数据，也不是生产审计实现。 */
  private readonly testLoopAudit = new Map<string, TestLoopAuditEntryDto[]>();

  constructor(
    @Inject(OrchestrationRepository) private readonly repo: OrchestrationRepository,
    @Inject(PrincipalAiCoachResource) private readonly aiCoach: PrincipalAiCoachResource,
    @Inject(FamilyLlmGatewayService) private readonly familyLlmGateway: FamilyLlmGatewayService,
  ) {}

  private ctxFor(offer: ResourceOfferDto, facts: EligibilityFacts, safetyNormal: boolean, evaluationRef: string): EligibilityContext {
    const rt = resolveResourceRuntimeState(offer.resource_type);
    return {
      serviceConsentGranted: facts.serviceConsentGranted,
      aiPersonalizationConsentGranted: facts.aiPersonalizationConsentGranted,
      ageInScope: facts.ageInScope,
      safetyRouteNormal: safetyNormal,
      providerQualificationActive: rt.providerQualificationActive,
      available: rt.available,
      externalReferralTargetConfigured: rt.externalReferralTargetConfigured,
      policyVersion: POLICY_VERSION,
      evaluatedAt: new Date().toISOString(),
      evaluationRef,
    };
  }

  /**
   * §21 幂等(顺序重放):同 key+同 request → 重放已存响应;同 key+异 request → 409;首次 → 执行 work 并存响应。
   * 复用共享 idempotency_keys 表。非并发锁(V1 只保障 retry 不产生重复 ServiceCase/AI 交付等)。
   */
  private async withIdempotency<T>(action: string, key: string | undefined, request: unknown, work: () => Promise<T>): Promise<T> {
    if (!key) return work();
    const requestHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
    await this.repo.query(`insert into idempotency_keys(idempotency_key, action_name, request_hash) values ($1,$2,$3) on conflict (idempotency_key) do nothing`, [key, action, requestHash]);
    const row = (await this.repo.query<{ action_name: string; request_hash: string; response_body: unknown | null }>(
      `select action_name, request_hash, response_body from idempotency_keys where idempotency_key=$1`, [key])).rows[0];
    if (!row || row.action_name !== action || row.request_hash !== requestHash) throw new ConflictException('idempotency_conflict');
    if (row.response_body) return row.response_body as T;
    const response = await work();
    await this.repo.query(`update idempotency_keys set response_code=200, response_body=$2::jsonb where idempotency_key=$1`, [key, JSON.stringify(response)]);
    return response;
  }

  private registryEnv() {
    return {
      approvedPracticeContentRef: process.env.FAMILY_APPROVED_PRACTICE_CONTENT_REF ?? null,
      externalReferralTargetRef: process.env.FAMILY_EXTERNAL_REFERRAL_TARGET ?? null,
    };
  }

  /** ① 表达需求:先校验 subject(家庭/CHILD/12–15)+ SERVICE consent,再写服务层输入 + NON_CANONICAL NeedSignal。 */
  async requestHelp(familyId: string, subjectPersonId: string, actorPersonId: string, rawText: string, source: 'MANUAL' | 'PRINCIPAL' | 'SERVICE_FOLLOWUP', _correlationId: string, idempotencyKey?: string): Promise<RequestHelpResult> {
    return this.withIdempotency('RequestGrowthHelp', idempotencyKey, { familyId, subjectPersonId, actorPersonId, rawText, source }, async () => {
    if (!rawText?.trim()) throw new BadRequestException('raw_text_required');
    const subj = await this.repo.checkSubject(familyId, subjectPersonId);
    if (!subj.exists || !subj.inFamily) throw new ForbiddenException('subject_not_in_family');
    if (!subj.isChild) throw new BadRequestException('subject_not_child');
    if (!subj.ageInScope) throw new ForbiddenException('subject_out_of_age_scope_12_15');
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required'); // 无 SERVICE consent → 0 input / 0 signal

    const cls = classifyNeed(rawText);
    return this.repo.withTransaction(async (c) => {
      const input = await c.query<{ input_id: string }>(
        `insert into growth_need_inputs(family_id, subject_person_id, actor_person_id, data_class, raw_text)
         values ($1,$2,$3,'FAMILY_PRIVATE_TEXT',$4) returning input_id`,
        [familyId, subjectPersonId, actorPersonId, rawText.trim()],
      );
      const signal = await c.query<{ signal_id: string }>(
        `insert into growth_need_signals(family_id, subject_person_id, source, raw_ref, inferred_need_type, confidence, canonical_family_fact)
         values ($1,$2,$3,$4,$5,$6,false) returning signal_id`,
        [familyId, subjectPersonId, source, input.rows[0].input_id, cls.need_type, cls.confidence],
      );
      const supported = cls.need_type != null;
      return {
        signal_id: signal.rows[0].signal_id, proposed_need_type: cls.need_type, proposed_capability_keys: cls.required_capability_keys,
        confirm_prompt: supported ? '你现在最想解决的是:先让冲突降下来,并找到今晚重新开口的方式?' : '我暂时没完全理解。要不要换句话描述你现在最想解决的问题?',
        supported,
      };
    });
    });
  }

  /** ② 显式确认:subject 从 signal 派生(不信客户端);创建 GrowthIntent(OPEN)。不建 GrowthPriority。 */
  async confirmIntent(familyId: string, actorPersonId: string, signalId: string, goalText: string, idempotencyKey?: string): Promise<{ intent_id: string; subject_person_id: string; required_capability_keys: GrowthCapabilityKey[] }> {
    return this.withIdempotency('ConfirmGrowthIntent', idempotencyKey, { familyId, actorPersonId, signalId, goalText }, async () => {
    const sig = await this.repo.query<{ subject_person_id: string; inferred_need_type: string | null }>(
      `select subject_person_id, inferred_need_type from growth_need_signals where signal_id=$1 and family_id=$2`, [signalId, familyId],
    );
    if ((sig.rowCount ?? 0) === 0) throw new BadRequestException('signal_not_found');
    const subjectPersonId = sig.rows[0].subject_person_id; // 服务端派生 subject
    const cls = classifyNeed(goalText);
    const needType = cls.need_type ?? sig.rows[0].inferred_need_type ?? null;
    if (needType !== 'PARENT_CHILD_COMMUNICATION_CONFLICT') throw new BadRequestException('unsupported_need_for_v1_slice');
    const caps = (cls.required_capability_keys.length ? cls.required_capability_keys : (['DE_ESCALATION', 'COMMUNICATION_REOPENING'] as GrowthCapabilityKey[]));
    const intent = await this.repo.query<{ intent_id: string }>(
      `insert into growth_intents(family_id, subject_person_id, signal_ref, need_type, goal_text, required_capability_keys, status, confirmed_by)
       values ($1,$2,$3,$4,$5,$6,'OPEN',$7) returning intent_id`,
      [familyId, subjectPersonId, signalId, needType, goalText.trim(), caps, actorPersonId],
    );
    return { intent_id: intent.rows[0].intent_id, subject_person_id: subjectPersonId, required_capability_keys: caps };
    });
  }

  private async loadOpenIntent(familyId: string, intentId: string): Promise<{ subjectPersonId: string; requiredCaps: GrowthCapabilityKey[]; goalText: string; status: string }> {
    const r = await this.repo.query<{ subject_person_id: string; required_capability_keys: string[]; goal_text: string; status: string }>(
      `select subject_person_id, required_capability_keys, goal_text, status from growth_intents where intent_id=$1 and family_id=$2`, [intentId, familyId],
    );
    if ((r.rowCount ?? 0) === 0) throw new BadRequestException('intent_not_found');
    return { subjectPersonId: r.rows[0].subject_person_id, requiredCaps: r.rows[0].required_capability_keys as GrowthCapabilityKey[], goalText: r.rows[0].goal_text, status: r.rows[0].status };
  }

  /** ③ 推荐:候选原子 Offer → T1 Eligibility(FAIL CLOSED,持久化 offer_snapshot)→ 确定性排序。subject 从 intent 派生。 */
  async recommend(familyId: string, intentId: string, idempotencyKey?: string): Promise<ResourceRecommendationDto> {
    return this.withIdempotency('RequestGrowthRecommendation', idempotencyKey, { familyId, intentId }, async () => {
    const intent = await this.loadOpenIntent(familyId, intentId);
    if (intent.status !== 'OPEN') throw new BadRequestException('intent_not_open');
    const subjectPersonId = intent.subjectPersonId;
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    const safetyNormal = safetyPrecheck({ user_message: intent.goalText }) === 'NORMAL';
    const candidates = candidateOffersForCommunicationConflict(this.registryEnv());
    const eligible: ResourceOfferDto[] = [];
    return this.repo.withTransaction(async (c) => {
      for (const offer of candidates) {
        const ref = randomUUID();
        const evalDto = evaluateOfferEligibility(offer, 'T1', this.ctxFor(offer, facts, safetyNormal, ref));
        await c.query(
          `insert into eligibility_evaluations(eligibility_evaluation_ref, family_id, intent_ref, stage, offer_ref, eligible, reason_codes, offer_snapshot, policy_version)
           values ($1,$2,$3,'T1',$4,$5,$6,$7::jsonb,$8)`,
          [ref, familyId, intentId, offer.offer_id, evalDto.eligible, evalDto.reason_codes, JSON.stringify(offer), POLICY_VERSION],
        );
        if (evalDto.eligible) eligible.push(offer);
      }
      const rec = buildRecommendation({ recommendationId: randomUUID(), intentId, version: 1, requiredCapabilityKeys: intent.requiredCaps, eligibleOffers: eligible });
      await c.query(
        `insert into resource_recommendations(recommendation_id, family_id, intent_ref, version, candidates, recommended_offer_refs, required_capability_keys, covered_capability_keys, uncovered_capability_keys, why_now, status)
         values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,'SHOWN')`,
        [rec.recommendation_id, familyId, intentId, rec.version, JSON.stringify(rec.candidates), rec.recommended_offer_refs, rec.required_capability_keys, rec.covered_capability_keys, rec.uncovered_capability_keys, rec.why_now],
      );
      return rec;
    });
    });
  }

  /** 载入某 selected offer 的 exact T1 快照(禁 T2 重新生成猜类型)。 */
  private async loadT1Snapshot(familyId: string, intentId: string, offerRef: string): Promise<ResourceOfferDto | null> {
    const r = await this.repo.query<{ offer_snapshot: ResourceOfferDto }>(
      `select offer_snapshot from eligibility_evaluations where family_id=$1 and intent_ref=$2 and stage='T1' and offer_ref=$3 order by evaluated_at desc limit 1`,
      [familyId, intentId, offerRef],
    );
    return r.rows[0]?.offer_snapshot ?? null;
  }

  /** ④ 决定 → 完整性 → Plan(声明) → T2 exact-offer 复验(FAIL CLOSED) → 按类型分派执行。 */
  async decide(params: {
    familyId: string; actorPersonId: string; intentId: string; recommendationId: string; recommendationVersion: number;
    decisionType: FamilyDecisionType; selectedOfferRefs: string[]; correlationId: string; idempotencyKey?: string;
  }): Promise<DecideResult> {
    const { familyId, actorPersonId, intentId, recommendationId, recommendationVersion, decisionType, selectedOfferRefs, correlationId, idempotencyKey } = params;
    return this.withIdempotency('DecideGrowthService', idempotencyKey, { familyId, intentId, recommendationId, recommendationVersion, decisionType, selectedOfferRefs }, async (): Promise<DecideResult> => {
    const intent = await this.loadOpenIntent(familyId, intentId);
    const subjectPersonId = intent.subjectPersonId; // 服务端派生

    const recRow = await this.repo.query<{ candidates: unknown; recommended_offer_refs: string[]; version: number; required_capability_keys: string[]; covered_capability_keys: string[]; uncovered_capability_keys: string[]; why_now: string }>(
      `select candidates, recommended_offer_refs, version, required_capability_keys, covered_capability_keys, uncovered_capability_keys, why_now
         from resource_recommendations where recommendation_id=$1 and family_id=$2 and intent_ref=$3`, [recommendationId, familyId, intentId],
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

    const decisionId = (await this.repo.query<{ decision_id: string }>(
      `insert into family_service_decisions(family_id, subject_person_id, intent_ref, recommendation_ref, recommendation_version, decision_type, selected_offer_refs, actor_person_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning decision_id`,
      [familyId, subjectPersonId, intentId, recommendationId, recommendationVersion, decisionType, selectedOfferRefs, actorPersonId],
    )).rows[0].decision_id;

    if (decisionType === 'DISMISS' || selectedOfferRefs.length === 0) {
      await this.repo.query(`update growth_intents set status='CLOSED', close_reason='NO_ACTION_SELECTED' where intent_id=$1 and family_id=$2`, [intentId, familyId]);
      return { decision_id: decisionId, outcome: 'NO_ACTION', case_id: null, executed_resource_type: 'NO_ACTION', ai_coach: null };
    }

    // 载入每个 selected offer 的 exact T1 快照(不重新生成)。
    const snapshots = new Map<string, ResourceOfferDto>();
    for (const ref of selectedOfferRefs) {
      const snap = await this.loadT1Snapshot(familyId, intentId, ref);
      if (!snap) throw new BadRequestException(`selected_offer_not_in_t1:${ref}`);
      snapshots.set(ref, snap);
    }

    // 声明式 Plan(step 覆盖能力从 candidates 恢复)。
    const candMap = new Map(rec.candidates.map((c) => [c.offer_ref, c.covered_capability_keys]));
    const steps = selectedOfferRefs.map((offerRef, i) => ({
      step_no: i + 1, capability_keys: candMap.get(offerRef) ?? intent.requiredCaps, offer_ref: offerRef,
      covered_capability_keys: candMap.get(offerRef) ?? [], trigger: i === 0 ? 'NOW' : 'AFTER_PREV', condition: null,
    }));
    const planId = (await this.repo.query<{ plan_id: string }>(
      `insert into orchestration_plans(family_id, subject_person_id, intent_ref, version, accepted_by_decision_ref, steps, status)
       values ($1,$2,$3,1,$4,$5::jsonb,'ACCEPTED') returning plan_id`,
      [familyId, subjectPersonId, intentId, decisionId, JSON.stringify(steps)],
    )).rows[0].plan_id;

    // T2 exact-offer 复验(FAIL CLOSED),用各自快照的真实类型/模式,新鲜 facts + runtime state。
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    const safetyNormal = safetyPrecheck({ user_message: intent.goalText }) === 'NORMAL';
    const t2Ineligible: string[] = [];
    for (const ref of selectedOfferRefs) {
      const snap = snapshots.get(ref)!;
      const evalRef = randomUUID();
      const t2 = evaluateOfferEligibility(snap, 'T2', this.ctxFor(snap, facts, safetyNormal, evalRef));
      await this.repo.query(
        `insert into eligibility_evaluations(eligibility_evaluation_ref, family_id, intent_ref, stage, offer_ref, eligible, reason_codes, offer_snapshot, policy_version)
         values ($1,$2,$3,'T2',$4,$5,$6,$7::jsonb,$8)`,
        [evalRef, familyId, intentId, ref, t2.eligible, t2.reason_codes, JSON.stringify(snap), POLICY_VERSION],
      );
      if (!t2.eligible) t2Ineligible.push(ref);
    }
    if (t2Ineligible.length > 0) {
      return { decision_id: decisionId, outcome: 'RE_RECOMMEND_REQUIRED', case_id: null, executed_resource_type: null, ai_coach: null, t2_ineligible_offers: t2Ineligible };
    }

    // 按【所选 Offer 类型】分派执行(绝不都跑 AI_COACH)。V1:主步取第一顺位。
    const primary = snapshots.get(selectedOfferRefs[0])!;
    const caseId = (await this.repo.query<{ case_id: string }>(
      `insert into service_cases(family_id, subject_person_id, intent_ref, plan_ref, status, owner)
       values ($1,$2,$3,$4,'IN_PROGRESS',$5) returning case_id`,
      [familyId, subjectPersonId, intentId, planId, SELF_STEWARD],
    )).rows[0].case_id;

    let aiCoachResult: DecideResult['ai_coach'] = null;
    let executedType = primary.resource_type;

    if (primary.resource_type === 'AI_COACH') {
      const coach = await this.aiCoach.deliver({ familyId, subjectPersonId, actorPersonId, message: intent.goalText, correlationId });
      aiCoachResult = { delivered: coach.delivered, risk_route: coach.risk_route, human_handoff: coach.human_handoff };
      await this.repo.query(
        `insert into service_contributions(case_ref, provider_ref, role, task_ref, completed_at, quality_state)
         values ($1,$2,'AI_COACH',$3, ${coach.human_handoff ? 'null' : 'now()'}, $4)`,
        [caseId, 'family-self:ai-coach', `principal-session:${coach.session_id}`, coach.human_handoff ? 'HELD' : 'DELIVERED'],
      );
      // 生命周期:交付→WAITING_FAMILY(等回访);扣留/升级→ESCALATED。Intent 保持 OPEN(未 SERVICE_DELIVERED)。
      await this.repo.query(`update service_cases set status=$2, next_action_at = now() + interval '1 day' where case_id=$1`,
        [caseId, coach.human_handoff ? 'ESCALATED' : 'WAITING_FAMILY']);
    } else if (primary.resource_type === 'EXTERNAL_REFERRAL') {
      executedType = 'EXTERNAL_REFERRAL';
      await this.repo.query(
        `insert into service_contributions(case_ref, provider_ref, role, task_ref, quality_state)
         values ($1,null,'EXTERNAL_REFERRAL',$2,'RECORDED')`,
        [caseId, `referral:${primary.external_referral_target_ref}`],
      );
      await this.repo.query(`update service_cases set status='WAITING_FAMILY', next_action_at = now() + interval '1 day' where case_id=$1`, [caseId]);
    } else {
      // PRACTICE 等尚无真实 executor → 不静默替换;标记等待家庭执行。
      await this.repo.query(`update service_cases set status='WAITING_FAMILY', next_action_at = now() + interval '1 day' where case_id=$1`, [caseId]);
    }
    // Intent 保持 OPEN;SERVICE_DELIVERED 只在 follow-up 完成时写(见 submitFollowUp)。

    return { decision_id: decisionId, outcome: 'SERVICE_STARTED', case_id: caseId, executed_resource_type: executedType, ai_coach: aiCoachResult };
    });
  }

  // ===== ARCH-GO-TEST-FULL-FUNCTION-001: DEV synthetic full-loop only =====
  // Never call recommend()/decide() below: those legacy paths rank candidates and/or create Plan/Case/AI/external execution.
  private appendTestLoopAudit(correlationId: string, entry: Omit<TestLoopAuditEntryDto, 'correlation_id'>): void {
    const existing = this.testLoopAudit.get(correlationId) ?? [];
    existing.push({ correlation_id: correlationId, ...entry });
    this.testLoopAudit.set(correlationId, existing);
  }

  private async findSyntheticTestSubject(familyId: string): Promise<string | null> {
    const candidate = await this.repo.query<{ person_id: string }>(
      `select person_id from persons where family_id=$1 and person_type='CHILD' order by person_id asc limit 1`,
      [familyId],
    );
    const personId = candidate.rows[0]?.person_id ?? null;
    if (!personId) return null;
    const check = await this.repo.checkSubject(familyId, personId);
    return check.exists && check.inFamily && check.isChild && check.ageInScope ? personId : null;
  }

  private async requireSyntheticFacts(familyId: string): Promise<{ subjectPersonId: string; facts: EligibilityFacts }> {
    requireDevSyntheticTestLoop();
    const subjectPersonId = await this.findSyntheticTestSubject(familyId);
    if (!subjectPersonId) throw new ForbiddenException('test_loop_synthetic_subject_unavailable');
    const facts = await this.repo.loadEligibilityFacts(familyId, subjectPersonId);
    if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required');
    return { subjectPersonId, facts };
  }

  async testLoopCapability(): Promise<{ enabled: boolean; mode: 'DEV_SYNTHETIC_ONLY'; policy_version: string; environment_status: 'DEV_IMPLEMENTING' | 'DEV_READY_FOR_TEST' | 'TEST_VALIDATED' | 'PROD_HOLD' }> {
    const cap = requireDevSyntheticTestLoop();
    return cap;
  }

  /** L0 synthetic Need: only controlled choices, server-derived synthetic child, no free text. */
  async startSyntheticNeed(familyId: string, actorPersonId: string, dto: StartSyntheticNeedDto, correlationId: string, idempotencyKey?: string): Promise<TestLoopNeedResultDto> {
    const cap = requireDevSyntheticTestLoop();
    if (dto.skip === true && dto.need_choice) throw new BadRequestException('test_loop_need_choice_or_skip');
    if (dto.skip === true) {
      this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'NEED', decision_type: 'DISMISS', allowed_state_upper_bound: 'NO_ACTION', safe_stop_reason: null, template_id: null, action_started: false });
      return { need_ref: null, next_state: 'NO_ACTION', allowed_state_upper_bound: 'NO_ACTION', text_equivalent: noActionTextEquivalent() };
    }
    if (!dto.need_choice || !(dto.need_choice in SYNTHETIC_NEED_CHOICES)) throw new BadRequestException('test_loop_need_choice_required');
    const choice = SYNTHETIC_NEED_CHOICES[dto.need_choice];
    return this.withIdempotency('StartSyntheticTestLoopNeed', idempotencyKey, { familyId, actorPersonId, need_choice: dto.need_choice }, async () => {
      const { subjectPersonId } = await this.requireSyntheticFacts(familyId);
      const result = await this.repo.withTransaction(async (c) => {
        const input = await c.query<{ input_id: string }>(
          `insert into growth_need_inputs(family_id, subject_person_id, actor_person_id, data_class, raw_text)
           values ($1,$2,$3,'FAMILY_PRIVATE_TEXT',$4) returning input_id`,
          [familyId, subjectPersonId, actorPersonId, `[TEST_ONLY_SYNTHETIC_FIXTURE] ${choice.text}`],
        );
        const signal = await c.query<{ signal_id: string }>(
          `insert into growth_need_signals(family_id, subject_person_id, source, raw_ref, inferred_need_type, confidence, canonical_family_fact)
           values ($1,$2,'MANUAL',$3,'PARENT_CHILD_COMMUNICATION_CONFLICT',1,false) returning signal_id`,
          [familyId, subjectPersonId, input.rows[0].input_id],
        );
        return signal.rows[0].signal_id;
      });
      this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'NEED', decision_type: null, allowed_state_upper_bound: 'NEED', safe_stop_reason: null, template_id: null, action_started: false });
      return { need_ref: result, next_state: 'INTENT', allowed_state_upper_bound: 'NEED', text_equivalent: `已记录内部演示的当下需要：${choice.text}。这不是诊断、评分或成长结论。你可以继续确认支持偏好，或返回。` };
    });
  }

  /** L0 synthetic Intent: controlled choice only; no-action never creates Plan/Case/Task/Reminder. */
  async confirmSyntheticIntent(familyId: string, actorPersonId: string, dto: ConfirmSyntheticIntentDto, correlationId: string, idempotencyKey?: string): Promise<TestLoopIntentResultDto> {
    const cap = requireDevSyntheticTestLoop();
    if (dto.no_action === true && (dto.intent_choice || dto.need_ref)) throw new BadRequestException('test_loop_intent_choice_or_no_action');
    if (dto.no_action === true) {
      this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'INTENT', decision_type: 'DISMISS', allowed_state_upper_bound: 'NO_ACTION', safe_stop_reason: null, template_id: null, action_started: false });
      return { intent_id: null, next_state: 'NO_ACTION', allowed_state_upper_bound: 'NO_ACTION', text_equivalent: noActionTextEquivalent() };
    }
    if (!dto.need_ref || !dto.intent_choice || !(dto.intent_choice in SYNTHETIC_INTENT_CHOICES)) throw new BadRequestException('test_loop_need_ref_and_intent_choice_required');
    const choice = SYNTHETIC_INTENT_CHOICES[dto.intent_choice];
    return this.withIdempotency('ConfirmSyntheticTestLoopIntent', idempotencyKey, { familyId, actorPersonId, need_ref: dto.need_ref, intent_choice: dto.intent_choice }, async () => {
      const { subjectPersonId } = await this.requireSyntheticFacts(familyId);
      const signal = await this.repo.query<{ subject_person_id: string }>(
        `select subject_person_id from growth_need_signals where signal_id=$1 and family_id=$2`,
        [dto.need_ref, familyId],
      );
      if ((signal.rowCount ?? 0) !== 1 || signal.rows[0].subject_person_id !== subjectPersonId) throw new ForbiddenException('test_loop_need_ref_not_in_synthetic_family');
      const intent = await this.repo.query<{ intent_id: string }>(
        `insert into growth_intents(family_id, subject_person_id, signal_ref, need_type, goal_text, required_capability_keys, status, confirmed_by)
         values ($1,$2,$3,'PARENT_CHILD_COMMUNICATION_CONFLICT',$4,$5,'OPEN',$6) returning intent_id`,
        [familyId, subjectPersonId, dto.need_ref, `[TEST_ONLY_SYNTHETIC_FIXTURE] ${choice.text}`, ['DE_ESCALATION', 'COMMUNICATION_REOPENING'], actorPersonId],
      );
      this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'INTENT', decision_type: null, allowed_state_upper_bound: 'INTENT', safe_stop_reason: null, template_id: null, action_started: false });
      return { intent_id: intent.rows[0].intent_id, next_state: 'CANDIDATES', allowed_state_upper_bound: 'INTENT', text_equivalent: `已确认内部演示的支持偏好：${choice.text}。接下来只会显示合成、已标记为 test-only 的候选；平台不会排序或替家庭决定。` };
    });
  }

  async getSyntheticAdmittedCandidates(familyId: string, intentId: string, correlationId: string): Promise<TestLoopCandidatesDto> {
    const cap = requireDevSyntheticTestLoop();
    const intent = await this.loadOpenIntent(familyId, intentId);
    const facts = await this.repo.loadEligibilityFacts(familyId, intent.subjectPersonId);
    if (!facts.serviceConsentGranted) {
      const stop = safeStop('SERVICE_CONSENT_REQUIRED');
      this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'CANDIDATES', decision_type: null, allowed_state_upper_bound: stop.allowed_state_upper_bound, safe_stop_reason: stop.reason, template_id: stop.template_id, action_started: false });
      return { intent_id: intentId, fixture_version: SYNTHETIC_FIXTURE_VERSION, candidates: [], safe_stop: stop, allowed_state_upper_bound: stop.allowed_state_upper_bound, text_equivalent: stop.message };
    }
    const views = SYNTHETIC_ADMITTED_CANDIDATES.map(toEqualCandidateView);
    this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'CANDIDATES', decision_type: null, allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES', safe_stop_reason: null, template_id: null, action_started: false });
    return {
      intent_id: intentId,
      fixture_version: SYNTHETIC_FIXTURE_VERSION,
      candidates: views,
      safe_stop: null,
      allowed_state_upper_bound: 'READ_ONLY_ADMITTED_CANDIDATES',
      text_equivalent: '以下是用于内部演示的合成已准入候选。它们以相同字段展示，不表达排序、推荐、效果或真实服务资格。你可以查看说明、返回、暂停或现在先不行动。',
    };
  }

  /** L1 decision-only route: writes FamilyServiceDecision only; never Plan/Case/AI/external execution. */
  async recordSyntheticDecision(familyId: string, actorPersonId: string, dto: RecordSyntheticDecisionDto, correlationId: string, idempotencyKey?: string): Promise<TestLoopDecisionResultDto> {
    const cap = requireDevSyntheticTestLoop();
    if (dto.fixture_version !== SYNTHETIC_FIXTURE_VERSION) throw new BadRequestException('test_loop_fixture_version_mismatch');
    if (dto.decision_type === 'SELECT' && !dto.candidate_ref) throw new BadRequestException('test_loop_candidate_ref_required');
    if (dto.decision_type === 'DISMISS' && dto.candidate_ref) throw new BadRequestException('test_loop_dismiss_requires_empty_candidate');
    return this.withIdempotency('RecordSyntheticTestLoopDecision', idempotencyKey, { familyId, actorPersonId, ...dto }, async () => {
      const intent = await this.loadOpenIntent(familyId, dto.intent_id);
      const facts = await this.repo.loadEligibilityFacts(familyId, intent.subjectPersonId);
      if (!facts.serviceConsentGranted) throw new ForbiddenException('service_consent_required');
      const fixture = dto.candidate_ref ? findSyntheticCandidate(dto.candidate_ref) : null;
      if (dto.decision_type === 'SELECT' && !fixture) throw new BadRequestException('test_loop_candidate_not_admitted');
      const recommendation = await this.repo.query<{ recommendation_id: string; version: number }>(
        `select recommendation_id, version from resource_recommendations where family_id=$1 and intent_ref=$2 and status='SHOWN' order by created_at desc limit 1`,
        [familyId, dto.intent_id],
      );
      let recommendationId = recommendation.rows[0]?.recommendation_id;
      let recommendationVersion = recommendation.rows[0]?.version;
      if (!recommendationId) {
        const inserted = await this.repo.query<{ recommendation_id: string; version: number }>(
          `insert into resource_recommendations(recommendation_id, family_id, intent_ref, version, candidates, recommended_offer_refs, required_capability_keys, covered_capability_keys, uncovered_capability_keys, why_now, status)
           values (gen_random_uuid(),$1,$2,1,$3::jsonb,'{}',$4,'{}',$4,$5,'SHOWN') returning recommendation_id, version`,
          [familyId, dto.intent_id, JSON.stringify(SYNTHETIC_ADMITTED_CANDIDATES.map((candidate) => ({ offer_ref: candidate.offer_ref, title: candidate.title, source_label: candidate.source_label, admission_version: candidate.admission_version }))), ['DE_ESCALATION', 'COMMUNICATION_REOPENING'], '[TEST_ONLY_SYNTHETIC_FIXTURE] candidate view only; no ranking, effect claim, or real execution.'],
        );
        recommendationId = inserted.rows[0].recommendation_id;
        recommendationVersion = inserted.rows[0].version;
      }
      const decision = await this.repo.query<{ decision_id: string }>(
        `insert into family_service_decisions(family_id, subject_person_id, intent_ref, recommendation_ref, recommendation_version, decision_type, selected_offer_refs, actor_person_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8) returning decision_id`,
        [familyId, intent.subjectPersonId, dto.intent_id, recommendationId, recommendationVersion, dto.decision_type === 'DISMISS' ? 'DISMISS' : 'SELECT_ALTERNATIVE', dto.decision_type === 'DISMISS' ? [] : [fixture!.offer_ref], actorPersonId],
      );
      const noAction = dto.decision_type === 'DISMISS';
      this.appendTestLoopAudit(correlationId, { policy_version: cap.policy_version, fixture_version: SYNTHETIC_FIXTURE_VERSION, input_category: 'DECISION', decision_type: dto.decision_type, allowed_state_upper_bound: noAction ? 'NO_ACTION' : 'DECISION', safe_stop_reason: null, template_id: null, action_started: false });
      return {
        decision_id: decision.rows[0].decision_id,
        outcome: noAction ? 'NO_ACTION' : 'DECISION_RECORDED',
        allowed_state_upper_bound: noAction ? 'NO_ACTION' : 'DECISION',
        action_started: false,
        plan_id: null,
        case_id: null,
        mock_executor: noAction ? null : createMockExecutorReceipt(),
        text_equivalent: noAction ? noActionTextEquivalent() : decisionTextEquivalent(),
      };
    });
  }

  /**
   * Real LLM page explanation for the 34-page Family DEV experience.
   * Client input is limited to a registered page ID and a correlation/journey alias;
   * use case, model policy, state bound, candidates, fixture, scope and audit are derived server-side.
   */
  async generateFamilyLlmPageDraft(
    familyId: string,
    actorPersonId: string,
    input: { page_id?: string; journey_id?: string; fixture_version?: string },
    correlationId: string,
  ): Promise<FamilyLlmGatewayResult> {
    const cap = requireDevSyntheticTestLoop();
    const pageId = input.page_id?.trim();
    if (!pageId) throw new BadRequestException('family_llm_page_id_required');
    if (input.fixture_version && input.fixture_version !== SYNTHETIC_FIXTURE_VERSION) {
      throw new BadRequestException('family_llm_fixture_version_mismatch');
    }
    const pagePolicy = getFamilyLlmPagePolicy(pageId);
    if (!pagePolicy) throw new BadRequestException('family_llm_page_not_registered');
    await this.requireSyntheticFacts(familyId);

    const result = await this.familyLlmGateway.generate({
      family_id: familyId,
      actor_person_id: actorPersonId,
      trace_id: correlationId,
      context: {
        environment: cap.environment_status === 'TEST_VALIDATED' ? 'TEST' : 'DEV',
        fixture_id: 'family-34-page-dev-fixture',
        fixture_version: SYNTHETIC_FIXTURE_VERSION,
        journey_id: input.journey_id?.trim() || correlationId,
        page_id: pagePolicy.page_id,
        use_case: pagePolicy.use_case,
        policy_version: cap.policy_version,
        schema_version: 'family-llm-draft.v1',
        allowed_state_upper_bound: pagePolicy.allowed_state_upper_bound,
        mock_state: `TEST_PAGE_${pagePolicy.page_id}`,
        admitted_candidates: SYNTHETIC_ADMITTED_CANDIDATES.map((candidate) => ({
          alias: candidate.offer_ref,
          title: candidate.title,
          admission_version: candidate.admission_version,
        })),
        supported_actions: pagePolicy.supported_actions,
      },
    });
    this.appendTestLoopAudit(correlationId, {
      policy_version: cap.policy_version,
      fixture_version: SYNTHETIC_FIXTURE_VERSION,
      input_category: 'STUB',
      decision_type: null,
      allowed_state_upper_bound: result.audit.allowed_state_upper_bound,
      safe_stop_reason: result.stop_code,
      template_id: result.decision === 'ALLOW_DRAFT' ? null : result.stop_code,
      action_started: false,
    });
    return result;
  }

  listFamilyLlmPages() {
    requireDevSyntheticTestLoop();
    return listFamilyLlmPagePolicies().map((policy) => ({
      page_id: policy.page_id,
      use_case: policy.use_case,
      allowed_state_upper_bound: policy.allowed_state_upper_bound,
    }));
  }

  async replayFamilyLlm(familyId: string, correlationId: string) {
    requireDevSyntheticTestLoop();
    return this.familyLlmGateway.replay(familyId, correlationId);
  }

  getSyntheticTestLoopAudit(correlationId: string): TestLoopAuditEntryDto[] {
    requireDevSyntheticTestLoop();
    return [...(this.testLoopAudit.get(correlationId) ?? [])];
  }

  async getCase(familyId: string, caseId: string): Promise<Record<string, unknown> | null> {
    const r = await this.repo.query(
      `select case_id, status, owner, opened_at, next_action_at, closed_at, intent_ref, plan_ref from service_cases where case_id=$1 and family_id=$2`,
      [caseId, familyId],
    );
    return r.rows[0] ?? null;
  }

  /** ⑤ 回访 + helpfulness(actor provenance;非 Observation)。有效反馈→完成服务环:Case COMPLETED + Intent CLOSED/SERVICE_DELIVERED。 */
  async submitFollowUp(familyId: string, actorPersonId: string, caseId: string, helpfulness: string, text: string | null, idempotencyKey?: string): Promise<{ followup_id: string }> {
    return this.withIdempotency('SubmitServiceFollowUp', idempotencyKey, { familyId, actorPersonId, caseId, helpfulness, text }, async () => {
    const allowed = ['HELPFUL', 'SOMEWHAT_HELPFUL', 'NOT_HELPFUL_YET', 'UNANSWERED'];
    if (!allowed.includes(helpfulness)) throw new BadRequestException('invalid_helpfulness');
    const own = await this.repo.query<{ intent_ref: string; status: string }>(`select intent_ref, status from service_cases where case_id=$1 and family_id=$2`, [caseId, familyId]);
    if ((own.rowCount ?? 0) === 0) throw new ForbiddenException('case_not_in_family');
    const r = await this.repo.query<{ followup_id: string }>(
      `insert into service_followup_responses(case_ref, actor_person_id, response_ref, helpfulness, truth_class)
       values ($1,$2,$3,$4,'SERVICE_NOTE') returning followup_id`,
      [caseId, actorPersonId, text, helpfulness],
    );
    // 家庭给出实质反馈(非 UNANSWERED)且 case 未升级 → 本次服务环完成。
    if (helpfulness !== 'UNANSWERED' && own.rows[0].status === 'WAITING_FAMILY') {
      await this.repo.query(`update service_cases set status='COMPLETED', closed_at=now() where case_id=$1`, [caseId]);
      await this.repo.query(`update growth_intents set status='CLOSED', close_reason='SERVICE_DELIVERED' where intent_id=$1 and family_id=$2`, [own.rows[0].intent_ref, familyId]);
    }
    return { followup_id: r.rows[0].followup_id };
    });
  }

  /** ⑥ Context Reuse(只读;按 need_type 过滤,同类才复用;禁因果)。 */
  async contextReuse(familyId: string, subjectPersonId: string): Promise<ContextReuseProjectionDto> {
    const prior = await this.repo.query<{ case_id: string; plan_ref: string }>(
      `select sc.case_id, sc.plan_ref from service_cases sc
        join growth_intents gi on gi.intent_id = sc.intent_ref
        where sc.family_id=$1 and sc.subject_person_id=$2 and gi.need_type='PARENT_CHILD_COMMUNICATION_CONFLICT'
        order by sc.opened_at desc limit 1`,
      [familyId, subjectPersonId],
    );
    const priorCase = prior.rows[0] ?? null;
    let helpfulness: ContextReuseProjectionDto['prior_helpfulness'] = null;
    const priorOffers: string[] = [];
    const statements: string[] = [];
    if (priorCase) {
      const fu = await this.repo.query<{ helpfulness: string }>(`select helpfulness from service_followup_responses where case_ref=$1 order by captured_at desc limit 1`, [priorCase.case_id]);
      helpfulness = (fu.rows[0]?.helpfulness as ContextReuseProjectionDto['prior_helpfulness']) ?? null;
      const plan = await this.repo.query<{ steps: Array<{ offer_ref: string }> }>(`select steps from orchestration_plans where plan_id=$1`, [priorCase.plan_ref]);
      for (const s of (plan.rows[0]?.steps ?? [])) priorOffers.push(s.offer_ref);
      statements.push('上次类似情况,你选择了先让冲突降下来,再找机会重新开口。');
      if (helpfulness) statements.push(helpfulness === 'HELPFUL' ? '你上次反馈:有帮助。' : helpfulness === 'SOMEWHAT_HELPFUL' ? '你上次反馈:有一点帮助。' : '你上次反馈:暂时没有帮助。');
    }
    return {
      family_id: familyId, subject_person_id: subjectPersonId, need_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      prior_case_ref: priorCase?.case_id ?? null, prior_selected_offer_refs: priorOffers, prior_helpfulness: helpfulness,
      reuse_statements: statements,
    };
  }
}

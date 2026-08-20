import { ConflictException, ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { InterventionCode, StartInterventionResponse } from '@family/contracts';
import type { AiGateway } from '@family/ai-gateway';
import { InterventionService } from '../family/intervention.service';
import {
  runPrincipalTextMvp, safetyPrecheck, assessResponseQuality,
  parentVerbalEscalationReview, imminentSelfLossOfControlReview,
  type PrincipalAiInput, type PrincipalAiOutput,
} from '@family/principal-ai';
import { resolvePrincipalConsent, evaluateProcessing, buildPrincipalFamilyContext, resolveProviderPolicy, FPAI_PROVIDER_REGISTRY_SNAPSHOT, type ProcessingDataCategory } from '@family/principal-runtime';
import { PrincipalRepository } from './principal.repository';
import { loadGroundedKnowledge } from './principal-knowledge';

/** DI token:Principal 真实模型网关(env-gated)。未配置真实 provider 时为 null → 确定性回退(不发外部调用)。 */
export const PRINCIPAL_AI_GATEWAY = 'PRINCIPAL_AI_GATEWAY';

/**
 * M3-INT-001 §34 Runtime Feature Profile。默认 internal:真实外呼/图片/failover 全关。
 * internal_livecheck 仅供本机受控测试开启外呼(pilot/production 仍默认关,待治理授权)。
 * 图片对外始终隔离(§15/§17),不随 profile 打开。
 */
interface RuntimeProfile {
  name: string;
  externalText: boolean;
  authorizedExternalCategories: readonly ProcessingDataCategory[];
}
function resolveRuntimeProfile(): RuntimeProfile {
  const p = process.env.FPAI_RUNTIME_PROFILE || 'internal';
  // W2R-102 受控模型优先内部门(架构师授权,provider=anthropic-cc-switch):
  //   model_first_internal = 内部 dogfood 默认走真实模型(仍需 gateway+consent+processing 门);pilot/production 仍未授权。
  //   与 internal_livecheck 同为受控外呼档(文本类;图片始终隔离);默认(unset)= internal = 关,CI 零外呼不变。
  if (p === 'internal_livecheck' || p === 'model_first_internal') {
    return {
      name: p, externalText: true,
      authorizedExternalCategories: ['USER_PROVIDED_TEXT', 'MINIMAL_GROWTH_CONTEXT', 'MINOR_PRIVATE_TEXT', 'FAMILY_PRIVATE_TEXT'],
    };
  }
  return { name: 'internal', externalText: false, authorizedExternalCategories: [] };
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

export type PrincipalDeliveryMode = 'LEGACY' | 'ORCHESTRATION_AI_COACH';

export interface HandleMessageResult {
  session_id: string;
  response_id: string | null;
  risk_route: string;
  consent_allowed: boolean;
  response: PrincipalAiOutput | null;
  action_proposal_id: string | null;
  human_handoff: boolean;
}

export interface AcceptProposalResult {
  proposal_id: string;
  episode: StartInterventionResponse['episode'];
  actions: StartInterventionResponse['actions'];
}

// M3-101A-C:proposal.recommended_intervention_id → 既有 Named Action 的 intervention_code。
// 白名单:只有已批准且有 Named Action 的干预可桥接;其余拒绝(不静默造干预)。
const BRIDGEABLE_INTERVENTIONS: Record<string, InterventionCode> = {
  LISTEN_BEFORE_RESPOND: 'LISTEN_BEFORE_RESPOND',
};

@Injectable()
export class PrincipalService {
  constructor(
    @Inject(PrincipalRepository) private readonly repo: PrincipalRepository,
    @Inject(InterventionService) private readonly intervention: InterventionService,
    // env-gated 真实模型网关(cc switch / AnthropicAiGateway)。null → runPrincipalTextMvp 走确定性回退,不发外部调用。
    @Optional() @Inject(PRINCIPAL_AI_GATEWAY) private readonly gateway: AiGateway | null = null,
  ) {}

  async createSession(familyId: string, subjectRef: string, actorId: string, correlationId: string): Promise<{ session_id: string }> {
    const s = await this.repo.createSession(familyId, subjectRef, actorId);
    await this.repo.recordProductEvent('principal_entry_viewed', familyId, s.session_id, correlationId, { actorId });
    return s;
  }

  async handleMessage(
    familyId: string, sessionId: string, subjectRef: string, actorId: string,
    userMessage: string, correlationId: string,
    images?: Array<{ media_type: string; data: string }>,
    options?: { deliveryMode?: PrincipalDeliveryMode },
  ): Promise<HandleMessageResult> {
    const deliveryMode = options?.deliveryMode ?? 'LEGACY';
    await this.repo.addMessage(sessionId, familyId, 'USER', userMessage, correlationId);
    await this.repo.recordProductEvent('principal_question_submitted', familyId, sessionId, correlationId,
      images?.length ? { image_count: images.length } : {}); // 只记数量,不落原始字节(隐私)

    // Consent (canonical) — 授权才允许注入个性化 Family context;此处最小化不读 growth。
    const consents = await this.repo.loadConsents(familyId, subjectRef);
    const consent = resolvePrincipalConsent(consents, subjectRef);

    // M3-INT-001 §9-14 P0:真实外呼前强制 Consent → Processing Policy → Provider 门。
    // userMessage 即家庭私有文本(USER_PROVIDED_TEXT);Family 场景默认按未成年人从严。
    const profile = resolveRuntimeProfile();
    // PROVIDER_POLICY_RUNTIME_001(behind flag,默认关):flag=on 时 providerApproved/categories 由 Provider Registry 派生
    // (堵 §15 漂移:registry 明确 minor/private_text 不外发,profile 曾错误全允许);flag 关=现行为不变。
    const useRegistry = process.env.FPAI_PROVIDER_POLICY_RUNTIME === 'on';
    const providerId = process.env.FPAI_MODEL_VENDOR === 'zhipu' ? 'zhipu-glm4v' : 'anthropic-cc-switch';
    const policy = useRegistry
      ? resolveProviderPolicy(FPAI_PROVIDER_REGISTRY_SNAPSHOT, providerId, profile.name)
      : { providerApproved: profile.externalText, authorizedExternalCategories: profile.authorizedExternalCategories };
    if (useRegistry) {
      await this.repo.recordProductEvent('principal_provider_policy_evaluated', familyId, sessionId, correlationId,
        { provider: providerId, environment: profile.name, approved: policy.providerApproved, categories: policy.authorizedExternalCategories, source: 'provider_registry' });
    }
    const processing = evaluateProcessing({
      consent, policyVersion: consent.matched?.policy_version ?? 'unknown',
      policyVersionApproved: profile.externalText, // 受控 env 视为已批;生产以治理为准
      subjectPersonId: subjectRef, guardianPersonId: consent.matched?.guardian_person_id ?? 'unknown',
      dataCategory: 'USER_PROVIDED_TEXT', minorData: true,
      providerClass: this.gateway ? 'EXTERNAL_PROVIDER' : 'FAKE',
      providerApproved: policy.providerApproved,          // flag=on: Provider Registry;off: 受控 env
      externalProcessingEnabled: profile.externalText, // 默认 internal → false
      authorizedExternalCategories: policy.authorizedExternalCategories,
    });
    // 只有 processing 判定 ALLOW 且存在真实网关,才真正对外调用;否则确定性回退(零外呼)。
    const willCallExternal = !!this.gateway && processing.allowed;
    if (this.gateway && !processing.allowed) {
      await this.repo.recordProductEvent('principal_processing_denied', familyId, sessionId, correlationId, { decision: processing.decision, reason: processing.reason });
    }
    // §15 图片隔离:图片对外处理未授权 → 一律不随请求外发(仅确定性内部处理忽略图片)。
    if (images?.length) {
      await this.repo.recordProductEvent('principal_image_quarantined', familyId, sessionId, correlationId, { image_count: images.length });
    }

    // M3-104 每日配额:仅约束真实外部模型成本。危机(precheck=HIGH_RISK)不受配额影响;不外呼不计。
    const cap = Number(process.env.FPAI_PRINCIPAL_DAILY_CAP ?? 0);
    if (willCallExternal && cap > 0 && safetyPrecheck({ user_message: userMessage }) !== 'HIGH_RISK') {
      const used = await this.repo.countRealAttemptsToday(familyId); // B2:按真实 provider attempt 计量
      if (used >= cap) {
        await this.repo.saveHandoff(sessionId, familyId, subjectRef, 'REVIEW', 'quota', 'REVIEWER');
        await this.repo.recordProductEvent('principal_quota_exceeded', familyId, sessionId, correlationId, { used, cap });
        return { session_id: sessionId, response_id: null, risk_route: 'REVIEW', consent_allowed: consent.allowed, response: null, action_proposal_id: null, human_handoff: true };
      }
    }

    // W2R-101 对象化上下文:仅在 consent 允许时,注入【最小 allowlist】typed PrincipalFamilyContextV1
    // (canonical FACT/状态,不含私有文本/AI_INFERENCE)。否则 null(输出=0,不偷偷降级)。
    let familyContext: Record<string, unknown> | undefined;
    if (consent.allowed) {
      const slice = await this.repo.loadFamilyContextSlice(familyId, subjectRef);
      const ctx = buildPrincipalFamilyContext(slice, consent);
      if (ctx) {
        familyContext = ctx as unknown as Record<string, unknown>;
        await this.repo.recordProductEvent('principal_object_context_injected', familyId, sessionId, correlationId,
          { life_stage: ctx.lifeStage, priorities: ctx.confirmedGrowthPriority.length, interventions: ctx.activeIntervention.length });
      }
    }

    const requestId = randomUUID();
    const input: PrincipalAiInput = {
      request_id: requestId, session_id: sessionId, entry_point: 'ASK_FAMILI_PRINCIPAL',
      user_message: userMessage,
      consent_context: { fpai_lab_consent: consent.allowed, family_context_read_allowed: consent.allowed },
      ...(familyContext ? { family_context: familyContext } : {}),
      // 图片隔离:不注入 images(即使收到);外呼由 willCallExternal 决定。
    };

    // 安全编排全部在 runPrincipalTextMvp 内(已单测,101B 唯一接入点):
    //  precheck=HIGH_RISK → 根本不调用模型;调用后 postcheck;schema 不过 → FAIL_CLOSED(REVIEW,绝不返自由文本)。
    //  gateway=null(默认/CI/测试)→ 确定性回退,零外部调用;gateway=真实(FPAI_PRINCIPAL_PROVIDER=real)→ cc switch(anthropic-compatible)。
    // FAIL CLOSED:真实网关任何失败(超时/网络/4xx/5xx/非法JSON/schema)绝不 500、绝不返原始文本 —— 安全降级到人工复核。
    // W2R-103B:注入唯一 Intervention(LISTEN_BEFORE_RESPOND)的循证链;找不到 bundle → grounded=false(不编造)。
    const grounding = loadGroundedKnowledge('LISTEN_BEFORE_RESPOND');
    let run: Awaited<ReturnType<typeof runPrincipalTextMvp>>;
    try {
      run = await runPrincipalTextMvp(input, willCallExternal ? (this.gateway ?? undefined) : undefined, grounding);
    } catch (e) {
      const kind = (e as { kind?: string })?.kind ?? 'MODEL_ERROR';
      await this.repo.saveHandoff(sessionId, familyId, subjectRef, 'REVIEW', 'model_error', 'REVIEWER');
      await this.repo.recordProductEvent('principal_model_error', familyId, sessionId, correlationId, { kind });
      return { session_id: sessionId, response_id: null, risk_route: 'REVIEW', consent_allowed: consent.allowed, response: null, action_proposal_id: null, human_handoff: true };
    }
    const output = run.output;
    let route = output.risk_route;
    const schemaPass = run.model_run.schema_validation === 'PASS';

    await this.repo.saveModelRun({
      request_id: requestId, session_id: sessionId, family_id_ref: familyId,
      model_provider: run.model_run.model_provider, model_name: run.model_run.model_name,
      prompt_version: run.model_run.prompt_version, soul_version: run.model_run.soul_version, soul_hash: run.model_run.soul_hash,
      scenario_id: run.model_run.scenario_id, method_refs: run.model_run.method_refs, source_refs: run.model_run.source_refs,
      input_hash: sha256(userMessage), output_hash: run.model_run.output_hash,
      risk_route: route, schema_validation: run.model_run.schema_validation, latency_ms: run.model_run.latency_ms,
    });

    // W2R-103B grounding 证据(§13):记录本次响应依据的循证链摘要(已穿进模型输入的同一对象)。
    // 只记结构化元数据,不写论文/心理原文;不写 canonical。
    await this.repo.recordProductEvent('principal_knowledge_grounded', familyId, sessionId, correlationId, {
      intervention_id: run.grounded_knowledge.intervention_id,
      bundle_version: run.grounded_knowledge.bundle_version ?? null,
      grounded: run.grounded_knowledge.grounded,
      knowledge_refs: run.grounded_knowledge.knowledge_refs,
      external_evidence_count: run.grounded_knowledge.external_evidence_count,
      highest_grade: run.grounded_knowledge.highest_grade,
      evidence_gate_status: run.grounded_knowledge.evidence_gate_status,
      source_registry_gate: run.grounded_knowledge.source_registry_gate,
      family_decision_non_decisive: run.grounded_knowledge.family_decision_non_decisive,
    });

    // M3-108 阈值告警:真实外呼(attempt)达到 warn 阈值(默认 80%)发一次 principal_quota_warning(exceeded 由前置守卫另发)。
    const provider = run.model_run.model_provider;
    if (cap > 0 && provider !== 'fake' && provider !== 'deterministic-fallback') {
      const usedAfter = await this.repo.countRealAttemptsToday(familyId); // B2:按 attempt 计量
      const warnPct = Number(process.env.FPAI_PRINCIPAL_DAILY_WARN_PCT ?? 80);
      const warnAt = Math.max(1, Math.ceil((cap * warnPct) / 100));
      if (usedAfter === warnAt && usedAfter < cap) {
        await this.repo.recordProductEvent('principal_quota_warning', familyId, sessionId, correlationId, { used: usedAfter, cap, warn_at: warnAt });
      }
    }

    // HIGH_RISK: 不展示陪练输出、不建 proposal、转人工。
    if (route === 'HIGH_RISK') {
      const trigger = safetyPrecheck({ user_message: userMessage }) === 'HIGH_RISK' ? 'precheck' : 'postcheck';
      await this.repo.saveHandoff(sessionId, familyId, subjectRef, route, trigger);
      await this.repo.recordProductEvent('principal_safety_routed', familyId, sessionId, correlationId, { risk_route: route });
      await this.repo.recordProductEvent('principal_human_handoff_created', familyId, sessionId, correlationId, {});
      return { session_id: sessionId, response_id: null, risk_route: route, consent_allowed: consent.allowed, response: null, action_proposal_id: null, human_handoff: true };
    }

    // W2R-104 智能质量闸:非 HIGH_RISK 输出经【理解/标签化/漏判风险】独立评估。judge 与主模型同门控
    // (willCallExternal 才注入真实网关;CI/默认无 judge → 确定性底座,零外呼)。不过 → 安全降级 REVIEW,
    // 只降级不放宽(仅在 NORMAL 时下调;绝不把 REVIEW/HIGH_RISK 提升)。
    const verdict = await assessResponseQuality(
      { user_message: userMessage, output, scenario_id: run.model_run.scenario_id, precheck_route: safetyPrecheck({ user_message: userMessage }) },
      willCallExternal ? (this.gateway ?? undefined) : undefined,
    );
    await this.repo.recordProductEvent('principal_quality_gate_evaluated', familyId, sessionId, correlationId,
      { pass: verdict.pass, dimensions: verdict.dimensions, judged_by: verdict.judged_by });
    if (!verdict.pass && route === 'NORMAL') {
      route = 'REVIEW';
      await this.repo.recordProductEvent('principal_quality_gate_failed', familyId, sessionId, correlationId,
        { dimensions: verdict.dimensions, failed_checks: verdict.failed_checks, judged_by: verdict.judged_by });
    }

    // W2R-104-FINAL-FIX-001:确定性 REVIEW 升级护栏(落实专家 Huangxia 对 GOLD-051 的裁定 KEEP_REVIEW)。
    // 家长本人【已经发生】的激烈言语攻击/情绪失控言语 → 至少 REVIEW。只升不降(仅 NORMAL→REVIEW),
    // 独立于 HIGH_RISK precheck 与生成式 judge;model 可判 NORMAL,专家接地的确定性策略据此升级。
    if (route === 'NORMAL') {
      const verbalEscalation = parentVerbalEscalationReview({ user_message: userMessage });   // Tier1:已发生激烈言语(GOLD-051)
      const imminentLossOfControl = imminentSelfLossOfControlReview({ user_message: userMessage }); // Tier2:临界失控(GOLD-053)
      if (verbalEscalation || imminentLossOfControl) {
        route = 'REVIEW';
        await this.repo.recordProductEvent('principal_review_escalation_guard', familyId, sessionId, correlationId,
          { guard: verbalEscalation ? 'parent_verbal_escalation' : 'imminent_self_loss_of_control', escalated_from: 'NORMAL', escalated_to: 'REVIEW' });
      }
    }

    const resp = await this.repo.saveResponse(sessionId, familyId, route, schemaPass, output);
    await this.repo.recordProductEvent('principal_response_received', familyId, sessionId, correlationId, { response_id: resp.response_id, risk_route: route });

    // REVIEW(含 FAIL_CLOSED 降级)→ W2R-105 Human Confirmation 闭环:
    // 响应已存但【扣留】,response_id 挂到 handoff 供复核;不展示给家长、不建 proposal、human_handoff=true。
    // 人工复核 APPROVED 后经 resolveHandoff 释放(supersedes W2R-104 的过渡"直接展示 REVIEW 响应")。
    if (route === 'REVIEW') {
      await this.repo.saveHandoff(sessionId, familyId, subjectRef, route, 'review', 'REVIEWER', resp.response_id);
      await this.repo.recordProductEvent('principal_review_queued', familyId, sessionId, correlationId, { response_id: resp.response_id });
      await this.repo.recordProductEvent('principal_human_handoff_created', familyId, sessionId, correlationId, {});
      return { session_id: sessionId, response_id: resp.response_id, risk_route: route, consent_allowed: consent.allowed, response: null, action_proposal_id: null, human_handoff: true };
    }

    // LEGACY NORMAL(schema 已过;FAIL_CLOSED 会被降为 REVIEW,不进此分支)→ 建 Action Proposal(canonical=false)。
    // ORCHESTRATION_AI_COACH 复用本方法前面的完整安全管线，但不创建 legacy proposal，也不调用 acceptProposal。
    let proposalId: string | null = null;
    if (route === 'NORMAL' && output.one_small_action && deliveryMode === 'LEGACY') {
      const p = await this.repo.saveProposal({
        response_id: resp.response_id, session_id: sessionId, family_id: familyId, subject_ref: subjectRef,
        proposal_type: 'RECOMMEND_INTERVENTION', recommended_intervention_id: 'LISTEN_BEFORE_RESPOND',
        display_title: 'Tonight', display_instruction: output.one_small_action,
        rationale: output.possible_pattern ?? null, risk_route: route,
      });
      proposalId = p.proposal_id;
      await this.repo.recordProductEvent('principal_action_proposal_viewed', familyId, sessionId, correlationId, { proposal_id: proposalId });
    }

    if (deliveryMode === 'ORCHESTRATION_AI_COACH') {
      await this.repo.recordProductEvent('principal_orchestration_ai_coach_delivered', familyId, sessionId, correlationId, { proposal_delta: 0, delivery_mode: deliveryMode });
    }
    return { session_id: sessionId, response_id: resp.response_id, risk_route: route, consent_allowed: consent.allowed, response: output, action_proposal_id: proposalId, human_handoff: false };
  }

  async sessionBelongsToFamily(sessionId: string, familyId: string): Promise<boolean> {
    return this.repo.sessionBelongsToFamily(sessionId, familyId);
  }

  // M3-108/B2 配额用量:持久来源=principal_model_attempts(真实 provider attempt,含 failover/失败;跨重启有效)。
  async getUsage(familyId: string): Promise<Record<string, unknown>> {
    const cap = Number(process.env.FPAI_PRINCIPAL_DAILY_CAP ?? 0);
    const warnPct = Number(process.env.FPAI_PRINCIPAL_DAILY_WARN_PCT ?? 80);
    const u = await this.repo.attemptUsageToday(familyId);
    const used = u.attempts; // 计量口径 = provider attempts(§27)
    let state = 'OK';
    if (cap <= 0) state = 'UNLIMITED';
    else if (used >= cap) state = 'EXCEEDED';
    else if (used >= Math.max(1, Math.ceil((cap * warnPct) / 100))) state = 'WARN';
    return {
      date: new Date().toISOString().slice(0, 10),
      logical_runs: u.logical_runs,
      provider_attempts: u.attempts,
      successful_attempts: u.successes,
      failed_attempts: u.failures,
      failovers: u.failovers,
      token_usage: null,          // §28:暂无法精确 → null,不伪造
      estimated_cost: null,
      used, cap, remaining: cap > 0 ? Math.max(0, cap - used) : null, state,
    };
  }

  // M3-103 人工复核队列
  async listHandoffs(familyId: string): Promise<Array<Record<string, unknown>>> {
    return this.repo.listOpenHandoffs(familyId);
  }

  // W2R-105 Human Confirmation 闭环:复核结论落库;仅 APPROVED 释放此前【扣留】的候选响应给家长。
  // 返回 released_response:APPROVED 且 handoff 挂有扣留响应 → 释放的响应体;否则 null。
  async resolveHandoff(familyId: string, handoffId: string, actorId: string, resolution: string, note: string | null, correlationId: string): Promise<{ ok: boolean; released_response: unknown | null }> {
    const ok = await this.repo.resolveHandoff(handoffId, familyId, actorId, resolution, note);
    if (!ok) return { ok: false, released_response: null };
    await this.repo.recordProductEvent('principal_handoff_resolved', familyId, null, correlationId, { handoff_id: handoffId, resolution });

    // 只降级不放宽的对偶:只有人工 APPROVED 才把扣留响应释放给家长(Human Gate);其余 resolution 保持扣留。
    if (resolution === 'APPROVED') {
      const ho = await this.repo.loadHandoff(handoffId, familyId);
      if (ho?.response_id) {
        const released = await this.repo.markHandoffReleased(handoffId, familyId, ho.response_id);
        if (released) {
          const resp = await this.repo.loadResponse(ho.response_id, familyId);
          await this.repo.recordProductEvent('principal_handoff_response_released', familyId, null, correlationId, { handoff_id: handoffId, response_id: ho.response_id });
          return { ok: true, released_response: resp?.output ?? null };
        }
      }
    }
    return { ok: true, released_response: null };
  }

  /**
   * Action Bridge:把被人类采纳的 NORMAL proposal 翻译为对既有 StartIntervention Named Action 的调用。
   * 关键不变量:桥接**不绕过任何 canonical 门** —— consent/safety/priority/权限/幂等 全部由 InterventionService 独立再校验。
   * 任一门失败则其事务回滚(Growth 零写),proposal 保持 PROPOSED;成功才标记 ACCEPTED 并记录溯源。
   * 返回 null(→ 404):proposal 不存在或不属于该 family(防跨家庭枚举)。
   */
  async acceptProposal(
    familyId: string, proposalId: string, actorId: string, correlationId: string,
    params: { onboarding_id: string; priority_id: string; idempotency_key: string },
  ): Promise<AcceptProposalResult | null> {
    const proposal = await this.repo.loadProposal(proposalId);
    if (!proposal || proposal.family_id !== familyId) return null;

    if (proposal.status !== 'PROPOSED') {
      throw new ConflictException(`proposal_not_acceptable:${proposal.status.toLowerCase()}`);
    }
    // 纵深防御:HIGH_RISK 不产生 proposal,但即便存在非 NORMAL 也绝不桥接进 Growth。
    if (proposal.risk_route !== 'NORMAL') {
      throw new ForbiddenException('proposal_risk_route_not_normal');
    }
    const interventionCode = BRIDGEABLE_INTERVENTIONS[proposal.recommended_intervention_id];
    if (!interventionCode) {
      throw new ConflictException('intervention_not_bridgeable');
    }

    // 调用既有 Named Action。其内部再校验 family/权限/priority(ACTIVE R03 + WORKING confirmed profile)/
    // consent(SERVICE+ASSESSMENT+GROWTH_TRACKING)/NORMAL safety/无活动 episode/幂等。失败抛出 → 直接上抛(fail closed)。
    const response = await this.intervention.startIntervention(
      { family_id: familyId, onboarding_id: params.onboarding_id, priority_id: params.priority_id, intervention_code: interventionCode, idempotency_key: params.idempotency_key },
      { actor: actorId, correlationId, source: 'FPAI_PRINCIPAL_ACTION_BRIDGE', occurredAt: new Date().toISOString() },
    );

    await this.repo.markProposalAccepted(proposalId, response.episode.episode_id, actorId);
    await this.repo.recordProductEvent('principal_proposal_accepted', familyId, proposal.session_id, correlationId, { proposal_id: proposalId, episode_id: response.episode.episode_id });
    await this.repo.recordProductEvent('principal_action_bridged', familyId, proposal.session_id, correlationId, { episode_id: response.episode.episode_id, intervention_code: interventionCode });

    return { proposal_id: proposalId, episode: response.episode, actions: response.actions };
  }

  async getSession(familyId: string, sessionId: string): Promise<Record<string, unknown> | null> {
    return this.repo.getSessionAggregate(familyId, sessionId);
  }

  async submitFeedback(familyId: string, responseId: string, actorId: string, rating: string | null, note: string | null, correlationId: string): Promise<void> {
    await this.repo.saveFeedback(responseId, familyId, actorId, rating, note);
    await this.repo.recordProductEvent('principal_feedback_submitted', familyId, null, correlationId, { response_id: responseId });
  }
}

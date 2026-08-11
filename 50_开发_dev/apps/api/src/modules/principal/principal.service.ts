import { ConflictException, ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { InterventionCode, StartInterventionResponse } from '@family/contracts';
import type { AiGateway } from '@family/ai-gateway';
import { InterventionService } from '../family/intervention.service';
import {
  runPrincipalTextMvp, safetyPrecheck,
  type PrincipalAiInput, type PrincipalAiOutput,
} from '@family/principal-ai';
import { resolvePrincipalConsent } from '@family/principal-runtime';
import { PrincipalRepository } from './principal.repository';

/** DI token:Principal 真实模型网关(env-gated)。未配置真实 provider 时为 null → 确定性回退(不发外部调用)。 */
export const PRINCIPAL_AI_GATEWAY = 'PRINCIPAL_AI_GATEWAY';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

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
  ): Promise<HandleMessageResult> {
    await this.repo.addMessage(sessionId, familyId, 'USER', userMessage, correlationId);
    await this.repo.recordProductEvent('principal_question_submitted', familyId, sessionId, correlationId, {});

    // Consent (canonical) — 授权才允许注入个性化 Family context;此处最小化不读 growth。
    const consents = await this.repo.loadConsents(familyId, subjectRef);
    const consent = resolvePrincipalConsent(consents, subjectRef);

    const requestId = randomUUID();
    const input: PrincipalAiInput = {
      request_id: requestId, session_id: sessionId, entry_point: 'ASK_FAMILI_PRINCIPAL',
      user_message: userMessage,
      consent_context: { fpai_lab_consent: consent.allowed, family_context_read_allowed: consent.allowed },
    };

    // 安全编排全部在 runPrincipalTextMvp 内(已单测,101B 唯一接入点):
    //  precheck=HIGH_RISK → 根本不调用模型;调用后 postcheck;schema 不过 → FAIL_CLOSED(REVIEW,绝不返自由文本)。
    //  gateway=null(默认/CI/测试)→ 确定性回退,零外部调用;gateway=真实(FPAI_PRINCIPAL_PROVIDER=real)→ cc switch(anthropic-compatible)。
    const run = await runPrincipalTextMvp(input, this.gateway ?? undefined);
    const output = run.output;
    const route = output.risk_route;
    const schemaPass = run.model_run.schema_validation === 'PASS';

    await this.repo.saveModelRun({
      request_id: requestId, session_id: sessionId, family_id_ref: familyId,
      model_provider: run.model_run.model_provider, model_name: run.model_run.model_name,
      prompt_version: run.model_run.prompt_version, soul_version: run.model_run.soul_version, soul_hash: run.model_run.soul_hash,
      scenario_id: run.model_run.scenario_id, method_refs: run.model_run.method_refs, source_refs: run.model_run.source_refs,
      input_hash: sha256(userMessage), output_hash: run.model_run.output_hash,
      risk_route: route, schema_validation: run.model_run.schema_validation, latency_ms: run.model_run.latency_ms,
    });

    // HIGH_RISK: 不展示陪练输出、不建 proposal、转人工。
    if (route === 'HIGH_RISK') {
      const trigger = safetyPrecheck({ user_message: userMessage }) === 'HIGH_RISK' ? 'precheck' : 'postcheck';
      await this.repo.saveHandoff(sessionId, familyId, subjectRef, route, trigger);
      await this.repo.recordProductEvent('principal_safety_routed', familyId, sessionId, correlationId, { risk_route: route });
      await this.repo.recordProductEvent('principal_human_handoff_created', familyId, sessionId, correlationId, {});
      return { session_id: sessionId, response_id: null, risk_route: route, consent_allowed: consent.allowed, response: null, action_proposal_id: null, human_handoff: true };
    }

    const resp = await this.repo.saveResponse(sessionId, familyId, route, schemaPass, output);
    await this.repo.recordProductEvent('principal_response_received', familyId, sessionId, correlationId, { response_id: resp.response_id, risk_route: route });

    // NORMAL(schema 已过;FAIL_CLOSED 会被降为 REVIEW,不进此分支)→ 建 Action Proposal(canonical=false)。
    // 真正应用到 Growth 是 101A-C accept(→ 既有 Named Action)。
    let proposalId: string | null = null;
    if (route === 'NORMAL' && output.one_small_action) {
      const p = await this.repo.saveProposal({
        response_id: resp.response_id, session_id: sessionId, family_id: familyId, subject_ref: subjectRef,
        proposal_type: 'RECOMMEND_INTERVENTION', recommended_intervention_id: 'LISTEN_BEFORE_RESPOND',
        display_title: 'Tonight', display_instruction: output.one_small_action,
        rationale: output.possible_pattern ?? null, risk_route: route,
      });
      proposalId = p.proposal_id;
      await this.repo.recordProductEvent('principal_action_proposal_viewed', familyId, sessionId, correlationId, { proposal_id: proposalId });
    }

    return { session_id: sessionId, response_id: resp.response_id, risk_route: route, consent_allowed: consent.allowed, response: output, action_proposal_id: proposalId, human_handoff: false };
  }

  async sessionBelongsToFamily(sessionId: string, familyId: string): Promise<boolean> {
    return this.repo.sessionBelongsToFamily(sessionId, familyId);
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

import { ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { InterventionCode, StartInterventionResponse } from '@family/contracts';
import { InterventionService } from '../family/intervention.service';
import {
  askPrincipal, safetyPrecheck, safetyPostcheck, validatePrincipalOutput, detectScenario,
  PRINCIPAL_AI_PROMPT_VERSION, PRINCIPAL_SOUL_VERSION,
  type PrincipalAiInput, type PrincipalAiOutput,
} from '@family/principal-ai';
import { resolvePrincipalConsent } from '@family/principal-runtime';
import { PrincipalRepository } from './principal.repository';

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
    const startedAt = Date.now();
    await this.repo.addMessage(sessionId, familyId, 'USER', userMessage, correlationId);
    await this.repo.recordProductEvent('principal_question_submitted', familyId, sessionId, correlationId, {});

    // Consent (canonical) — AI_PERSONALIZATION+GRANTED gates personalized Family context
    const consents = await this.repo.loadConsents(familyId, subjectRef);
    const consent = resolvePrincipalConsent(consents, subjectRef);

    // Safety precheck BEFORE generation
    const precheck = safetyPrecheck({ user_message: userMessage });
    const scenario = detectScenario({ user_message: userMessage });
    const requestId = randomUUID();

    // Provider = deterministic soul (FakeAiGateway equivalent). REAL model via cc switch is M3-101B (env-gated), not here.
    const input: PrincipalAiInput = {
      request_id: requestId, session_id: sessionId, entry_point: 'ASK_FAMILI_PRINCIPAL',
      user_message: userMessage,
      // 最小化:未授权时不注入 Family context(输出=0);此处 B 阶段不读 growth 读模型
      consent_context: { fpai_lab_consent: consent.allowed, family_context_read_allowed: consent.allowed },
    };
    const output = askPrincipal(input);
    const evalResult = validatePrincipalOutput(output);
    const postRoute = safetyPostcheck(output, precheck);

    const latency = Date.now() - startedAt;
    await this.repo.saveModelRun({
      request_id: requestId, session_id: sessionId, family_id_ref: familyId,
      model_provider: 'fake', model_name: 'principal-soul-deterministic',
      prompt_version: PRINCIPAL_AI_PROMPT_VERSION, soul_version: PRINCIPAL_SOUL_VERSION, soul_hash: sha256(PRINCIPAL_SOUL_VERSION),
      scenario_id: scenario, method_refs: output.method_refs ?? [], source_refs: output.source_refs ?? [],
      input_hash: sha256(userMessage), output_hash: sha256(JSON.stringify(output)),
      risk_route: postRoute, schema_validation: evalResult.pass ? 'valid' : 'invalid', latency_ms: latency,
    });

    // HIGH_RISK: no coaching output, no proposal, human handoff
    if (postRoute === 'HIGH_RISK') {
      await this.repo.saveHandoff(sessionId, familyId, subjectRef, postRoute, precheck === 'HIGH_RISK' ? 'precheck' : 'postcheck');
      await this.repo.recordProductEvent('principal_safety_routed', familyId, sessionId, correlationId, { risk_route: postRoute });
      await this.repo.recordProductEvent('principal_human_handoff_created', familyId, sessionId, correlationId, {});
      return { session_id: sessionId, response_id: null, risk_route: postRoute, consent_allowed: consent.allowed, response: null, action_proposal_id: null, human_handoff: true };
    }

    const resp = await this.repo.saveResponse(sessionId, familyId, postRoute, evalResult.pass, output);
    await this.repo.recordProductEvent('principal_response_received', familyId, sessionId, correlationId, { response_id: resp.response_id, risk_route: postRoute });

    // NORMAL + valid: create an Action Proposal bound to the existing deterministic intervention (canonical=false).
    // Actual application into Growth OS is M3-101A-C (accept endpoint → existing Named Action).
    let proposalId: string | null = null;
    if (postRoute === 'NORMAL' && evalResult.pass && output.one_small_action) {
      const p = await this.repo.saveProposal({
        response_id: resp.response_id, session_id: sessionId, family_id: familyId, subject_ref: subjectRef,
        proposal_type: 'RECOMMEND_INTERVENTION', recommended_intervention_id: 'LISTEN_BEFORE_RESPOND',
        display_title: 'Tonight', display_instruction: output.one_small_action,
        rationale: output.possible_pattern ?? null, risk_route: postRoute,
      });
      proposalId = p.proposal_id;
      await this.repo.recordProductEvent('principal_action_proposal_viewed', familyId, sessionId, correlationId, { proposal_id: proposalId });
    }

    return { session_id: sessionId, response_id: resp.response_id, risk_route: postRoute, consent_allowed: consent.allowed, response: output, action_proposal_id: proposalId, human_handoff: false };
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

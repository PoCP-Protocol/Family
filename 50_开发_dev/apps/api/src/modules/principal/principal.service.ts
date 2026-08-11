import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
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

@Injectable()
export class PrincipalService {
  constructor(@Inject(PrincipalRepository) private readonly repo: PrincipalRepository) {}

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

  async getSession(familyId: string, sessionId: string): Promise<Record<string, unknown> | null> {
    return this.repo.getSessionAggregate(familyId, sessionId);
  }

  async submitFeedback(familyId: string, responseId: string, actorId: string, rating: string | null, note: string | null, correlationId: string): Promise<void> {
    await this.repo.saveFeedback(responseId, familyId, actorId, rating, note);
    await this.repo.recordProductEvent('principal_feedback_submitted', familyId, null, correlationId, { response_id: responseId });
  }
}

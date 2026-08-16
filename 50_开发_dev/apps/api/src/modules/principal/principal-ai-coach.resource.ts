/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · Principal 的窄 AI_COACH 资源适配。
 * 只暴露 deliver()(内部用 createSession + handleMessage);【绝不】暴露/调用 acceptProposal(legacy Growth bridge)。
 * 既有安全全部保留:Consent / Provider policy / Safety route / Human Gate / quality gate / fail closed 均由 PrincipalService 内部执行。
 * Orchestration 只知道"AI_COACH Resource",不知道 Principal 的 legacy Growth 桥。
 */
import { Inject, Injectable } from '@nestjs/common';
import { PrincipalService } from './principal.service';

export interface AiCoachDeliverInput {
  familyId: string;
  subjectPersonId: string;
  actorPersonId: string;
  message: string;
  correlationId: string;
}

export interface AiCoachDeliverResult {
  session_id: string;
  response_id: string | null;
  risk_route: string;       // NORMAL | REVIEW | HIGH_RISK(由 Principal 决定)
  human_handoff: boolean;   // REVIEW/HIGH_RISK → 响应被扣留/转人工
  consent_allowed: boolean;
  delivered: boolean;       // 是否有可展示给家长的响应(仅 NORMAL 且未扣留)
}

@Injectable()
export class PrincipalAiCoachResource {
  constructor(@Inject(PrincipalService) private readonly principal: PrincipalService) {}

  /** 交付一次 AI 陪练。安全由 Principal 内部保障;此处不绕过、不解释、不放宽。 */
  async deliver(input: AiCoachDeliverInput): Promise<AiCoachDeliverResult> {
    const session = await this.principal.createSession(input.familyId, input.subjectPersonId, input.actorPersonId, input.correlationId);
    const result = await this.principal.handleMessage(
      input.familyId,
      session.session_id,
      input.subjectPersonId,
      input.actorPersonId,
      input.message,
      input.correlationId,
      undefined,
      { deliveryMode: 'ORCHESTRATION_AI_COACH' },
    );
    return {
      session_id: result.session_id,
      response_id: result.response_id,
      risk_route: result.risk_route,
      human_handoff: result.human_handoff,
      consent_allowed: result.consent_allowed,
      // 仅 NORMAL 且未转人工才视为已交付可见响应(REVIEW/HIGH_RISK 响应被 Human Gate 扣留)。
      delivered: result.risk_route === 'NORMAL' && !result.human_handoff && result.response != null,
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { OpenAICompatibleAiGateway, type AiGatewayError } from '@family/ai-gateway';
import { AuditReplayService } from './audit-replay.service';
import { ContextAssemblerService, FamilyLlmInputBlockedError, type AssembleFamilyLlmContextInput } from './context-assembler.service';
import type { FamilyLlmGatewayAuditRecord, FamilyLlmGatewayResult, FamilyLlmSnapshot } from './family-llm.contract';
import { FAMILY_LLM_DRAFT_JSON_SCHEMA } from './family-llm.contract';
import { resolveFamilyLlmConfig } from './family-llm.config';
import { FamilyLlmOutputBlockedError, FamilyLlmOutputValidator } from './output-validator';

export interface GenerateFamilyLlmDraftInput {
  family_id: string;
  actor_person_id: string;
  trace_id: string;
  context: AssembleFamilyLlmContextInput;
}

const STOP_TEXT: Record<string, string> = {
  LLM_DISABLED: '当前智能说明未启用。你可以返回、暂停或现在先不继续。',
  LLM_NOT_CONFIGURED: '当前智能说明暂未配置。你可以返回、暂停或现在先不继续。',
  LLM_MODEL_NOT_ALLOWED: '当前智能说明暂不可用。你可以返回、暂停或现在先不继续。',
  LLM_ENVIRONMENT_BLOCKED: '当前环境不提供智能说明。你可以返回、暂停或现在先不继续。',
  LLM_INPUT_ENVIRONMENT_BLOCKED: '当前信息无法在此流程中使用。你可以返回、暂停或现在先不继续。',
  LLM_INPUT_FIXTURE_REQUIRED: '当前测试样例不可用。你可以返回、暂停或现在先不继续。',
  LLM_INPUT_UNSUPPORTED_USE_CASE: '当前页面暂不提供智能说明。你可以返回、暂停或现在先不继续。',
  LLM_INPUT_STATE_BOUND_BLOCKED: '当前状态无法继续生成说明。你可以返回、暂停或现在先不继续。',
  LLM_INPUT_FREE_TEXT_BLOCKED: '当前流程只使用已确认的测试选项。你可以返回、暂停或现在先不继续。',
  LLM_OUTPUT_SCHEMA_INVALID: '当前无法安全展示说明。你可以返回、暂停或现在先不继续。',
  LLM_OUTPUT_FORBIDDEN_COPY: '当前无法安全展示说明。你可以返回、暂停或现在先不继续。',
  LLM_OUTPUT_CANDIDATE_INVALID: '当前无法安全展示说明。你可以返回、暂停或现在先不继续。',
  LLM_OUTPUT_STATE_BOUND_INVALID: '当前无法安全展示说明。你可以返回、暂停或现在先不继续。',
  LLM_OUTPUT_TEXT_EQUIVALENT_INCOMPLETE: '当前无法提供完整文字说明。你可以返回、暂停或现在先不继续。',
  LLM_OUTPUT_TOOL_INVALID: '当前无法安全展示说明。你可以返回、暂停或现在先不继续。',
  LLM_PROVIDER_FAILURE: '当前智能说明暂不可用。你可以返回、暂停或现在先不继续。',
};

@Injectable()
export class FamilyLlmGatewayService {
  constructor(
    @Inject(ContextAssemblerService) private readonly contextAssembler: ContextAssemblerService,
    @Inject(FamilyLlmOutputValidator) private readonly validator: FamilyLlmOutputValidator,
    @Inject(AuditReplayService) private readonly auditReplay: AuditReplayService,
  ) {}

  async generate(input: GenerateFamilyLlmDraftInput): Promise<FamilyLlmGatewayResult> {
    let snapshot: FamilyLlmSnapshot;
    try {
      snapshot = this.contextAssembler.assemble(input.context);
    } catch (error) {
      const code = error instanceof FamilyLlmInputBlockedError ? error.code : 'LLM_INPUT_FIXTURE_REQUIRED';
      return this.stop(input, null, 'BLOCK_INPUT', code);
    }

    const configResolution = resolveFamilyLlmConfig();
    if (!configResolution.enabled) {
      return this.stop(input, snapshot, 'BLOCK_CONFIGURATION', configResolution.code);
    }

    const gateway = new OpenAICompatibleAiGateway({
      baseUrl: configResolution.config.baseUrl,
      apiKey: configResolution.config.apiKey,
      model: configResolution.config.model,
      timeoutMs: configResolution.config.timeoutMs,
    });

    let generated: unknown;
    let modelId: string | null = configResolution.config.model;
    try {
      const result = await gateway.generateStructured<FamilyLlmSnapshot, Record<string, unknown>>({
        use_case: snapshot.use_case,
        prompt_version: snapshot.policy_version,
        schema_version: snapshot.schema_version,
        input: snapshot,
        output_schema: FAMILY_LLM_DRAFT_JSON_SCHEMA,
        input_refs: [snapshot.fixture_id, snapshot.fixture_version, snapshot.page_id],
        policy_context: {
          human_confirmation_required: true,
          may_mutate_business_state: false,
        },
      });
      generated = result.output;
      modelId = result.model;
    } catch (error) {
      // Provider failures are intentionally reduced to a stable enum and never return provider text.
      const code = this.providerFailureCode(error);
      return this.stop(input, snapshot, 'PROVIDER_FAILURE', code, modelId);
    }

    try {
      const validated = this.validator.validate(snapshot, generated);
      const audit = await this.persist({
        input,
        snapshot,
        model: modelId,
        gateway_decision: 'ALLOW_DRAFT',
        input_block_reason: null,
        output_block_reason: null,
        tool_names: validated.tool_proposals.map((proposal) => proposal.name),
      });
      return {
        decision: 'ALLOW_DRAFT',
        draft: validated.draft,
        stop_code: null,
        text_equivalent: validated.draft.text_equivalent,
        audit,
      };
    } catch (error) {
      const code = error instanceof FamilyLlmOutputBlockedError ? error.code : 'LLM_OUTPUT_SCHEMA_INVALID';
      return this.stop(input, snapshot, 'BLOCK_OUTPUT', code, modelId);
    }
  }

  async replay(familyId: string, traceId: string): Promise<FamilyLlmGatewayAuditRecord[]> {
    return this.auditReplay.replay(familyId, traceId);
  }

  private async stop(
    input: GenerateFamilyLlmDraftInput,
    snapshot: FamilyLlmSnapshot | null,
    decision: FamilyLlmGatewayAuditRecord['gateway_decision'],
    code: string,
    model: string | null = null,
  ): Promise<FamilyLlmGatewayResult> {
    const textEquivalent = STOP_TEXT[code] ?? STOP_TEXT.LLM_PROVIDER_FAILURE;
    const isOutput = decision === 'BLOCK_OUTPUT';
    const audit = await this.persist({
      input,
      snapshot,
      model,
      gateway_decision: decision,
      input_block_reason: isOutput ? null : code,
      output_block_reason: isOutput ? code : null,
      tool_names: [],
    });
    return { decision, draft: null, stop_code: code, text_equivalent: textEquivalent, audit };
  }

  private async persist(params: {
    input: GenerateFamilyLlmDraftInput;
    snapshot: FamilyLlmSnapshot | null;
    model: string | null;
    gateway_decision: FamilyLlmGatewayAuditRecord['gateway_decision'];
    input_block_reason: string | null;
    output_block_reason: string | null;
    tool_names: FamilyLlmGatewayAuditRecord['tool_names'];
  }): Promise<FamilyLlmGatewayAuditRecord> {
    const snapshot = params.snapshot;
    const fallback = params.input.context;
    return this.auditReplay.record({
      family_id: params.input.family_id,
      actor_person_id: params.input.actor_person_id,
      trace_id: params.input.trace_id,
      environment: snapshot?.environment ?? fallback.environment,
      use_case: snapshot?.use_case ?? fallback.use_case,
      fixture_id: snapshot?.fixture_id ?? fallback.fixture_id,
      fixture_version: snapshot?.fixture_version ?? fallback.fixture_version,
      page_id: snapshot?.page_id ?? fallback.page_id,
      model: params.model,
      policy_version: snapshot?.policy_version ?? fallback.policy_version,
      schema_version: snapshot?.schema_version ?? fallback.schema_version,
      gateway_decision: params.gateway_decision,
      input_block_reason: params.input_block_reason,
      output_block_reason: params.output_block_reason,
      allowed_state_upper_bound: snapshot?.allowed_state_upper_bound ?? fallback.allowed_state_upper_bound,
      tool_names: params.tool_names,
    });
  }

  private providerFailureCode(error: unknown): 'LLM_PROVIDER_FAILURE' {
    const gatewayError = error as Partial<AiGatewayError>;
    // Deliberately collapse all provider/network/parse details: they may include sensitive provider metadata.
    void gatewayError;
    return 'LLM_PROVIDER_FAILURE';
  }
}

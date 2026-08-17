import {
  FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS,
  type FamilyLlmDraft,
  type FamilyLlmSnapshot,
  type FamilyLlmStateUpperBound,
} from './family-llm.contract';
import { FamilyLlmToolBlockedError, FamilyLlmToolRegistry, type ValidatedFamilyLlmToolProposal } from './tool-registry';

export class FamilyLlmOutputBlockedError extends Error {
  constructor(readonly code: 'LLM_OUTPUT_SCHEMA_INVALID' | 'LLM_OUTPUT_FORBIDDEN_COPY' | 'LLM_OUTPUT_CANDIDATE_INVALID' | 'LLM_OUTPUT_STATE_BOUND_INVALID' | 'LLM_OUTPUT_TEXT_EQUIVALENT_INCOMPLETE' | 'LLM_OUTPUT_TOOL_INVALID') {
    super(code);
    this.name = 'FamilyLlmOutputBlockedError';
  }
}

export interface ValidatedFamilyLlmDraft {
  draft: FamilyLlmDraft;
  tool_proposals: ValidatedFamilyLlmToolProposal[];
}

const FORBIDDEN_COPY = [
  /最佳方案/i,
  /最适合你/i,
  /精准推荐/i,
  /系统建议你/i,
  /必须做/i,
  /成长分/i,
  /成长指数/i,
  /风险分/i,
  /风险等级/i,
  /家庭排名/i,
  /排行榜/i,
  /诊断/i,
  /临床/i,
  /心理疾病/i,
  /永久标签/i,
  /保证效果/i,
  /承诺效果/i,
  /一定有效/i,
  /自动创建(?:计划|服务|订单|预约)/i,
  /立即购买/i,
  /马上付费/i,
  /立即充值/i,
  /https?:\/\//i,
  /www\./i,
];

const STATE_ORDER: Record<FamilyLlmStateUpperBound, number> = {
  NONE: 0,
  NEED: 1,
  INTENT: 2,
  READ_ONLY_ADMITTED_CANDIDATES: 3,
  DECISION: 4,
  NO_ACTION: 4,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown, limit: number): value is string[] {
  return Array.isArray(value) && value.length <= limit && value.every((entry) => typeof entry === 'string' && entry.trim().length > 0 && entry.length <= 120);
}

function ensureString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function validateShape(value: unknown): asserts value is FamilyLlmDraft {
  if (!isRecord(value)) throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_SCHEMA_INVALID');
  const keys = Object.keys(value).sort();
  const expected = ['allowed_state_upper_bound', 'body', 'kind', 'referenced_candidates', 'text_equivalent', 'title', 'tool_proposals'];
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_SCHEMA_INVALID');
  if (!['EXPLANATION_DRAFT', 'TEXT_EQUIVALENT_DRAFT', 'SAFETY_STOP_DRAFT', 'HUMAN_GATE_REQUIRED_DRAFT'].includes(String(value.kind))) {
    throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_SCHEMA_INVALID');
  }
  if (!ensureString(value.title, 120) || !ensureString(value.body, 1200) || !ensureString(value.text_equivalent, 1600)) {
    throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_SCHEMA_INVALID');
  }
  if (!isStringArray(value.referenced_candidates, 3) || !FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS.includes(value.allowed_state_upper_bound as FamilyLlmStateUpperBound)) {
    throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_SCHEMA_INVALID');
  }
  if (!Array.isArray(value.tool_proposals) || value.tool_proposals.length > 1 || !value.tool_proposals.every((proposal) => isRecord(proposal) && typeof proposal.name === 'string' && isRecord(proposal.arguments))) {
    throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_SCHEMA_INVALID');
  }
}

function isTextEquivalentComplete(snapshot: FamilyLlmSnapshot, text: string): boolean {
  const required = ['返回'];
  if (snapshot.supported_actions.includes('PAUSE')) required.push('暂停');
  if (snapshot.supported_actions.includes('NO_ACTION')) required.push('不继续');
  return required.every((phrase) => text.includes(phrase));
}

export class FamilyLlmOutputValidator {
  constructor(private readonly toolRegistry: FamilyLlmToolRegistry = new FamilyLlmToolRegistry()) {}

  validate(snapshot: FamilyLlmSnapshot, output: unknown): ValidatedFamilyLlmDraft {
    validateShape(output);
    const combined = `${output.title}\n${output.body}\n${output.text_equivalent}`;
    if (FORBIDDEN_COPY.some((pattern) => pattern.test(combined))) {
      throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_FORBIDDEN_COPY');
    }

    const allowedAliases = new Set(snapshot.admitted_candidates.map((candidate) => candidate.alias));
    if (output.referenced_candidates.some((alias) => !allowedAliases.has(alias))) {
      throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_CANDIDATE_INVALID');
    }

    if (STATE_ORDER[output.allowed_state_upper_bound] > STATE_ORDER[snapshot.allowed_state_upper_bound]) {
      throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_STATE_BOUND_INVALID');
    }

    if (!isTextEquivalentComplete(snapshot, output.text_equivalent)) {
      throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_TEXT_EQUIVALENT_INCOMPLETE');
    }

    try {
      const validatedTools = output.tool_proposals.map((proposal) => this.toolRegistry.validate(snapshot, {
        name: proposal.name as FamilyLlmDraft['tool_proposals'][number]['name'],
        arguments: proposal.arguments as Record<string, string | boolean>,
      }));
      return { draft: output, tool_proposals: validatedTools };
    } catch (error) {
      if (error instanceof FamilyLlmToolBlockedError) {
        throw new FamilyLlmOutputBlockedError('LLM_OUTPUT_TOOL_INVALID');
      }
      throw error;
    }
  }
}

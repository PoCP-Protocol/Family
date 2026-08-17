import { Injectable } from '@nestjs/common';
import {
  FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS,
  FAMILY_LLM_USE_CASES,
  type FamilyLlmCandidateSnapshot,
  type FamilyLlmSnapshot,
  type FamilyLlmStateUpperBound,
  type FamilyLlmUseCase,
} from './family-llm.contract';

export class FamilyLlmInputBlockedError extends Error {
  constructor(readonly code: 'LLM_INPUT_ENVIRONMENT_BLOCKED' | 'LLM_INPUT_FIXTURE_REQUIRED' | 'LLM_INPUT_UNSUPPORTED_USE_CASE' | 'LLM_INPUT_STATE_BOUND_BLOCKED' | 'LLM_INPUT_FREE_TEXT_BLOCKED') {
    super(code);
    this.name = 'FamilyLlmInputBlockedError';
  }
}

export interface AssembleFamilyLlmContextInput {
  environment: 'DEV' | 'TEST';
  fixture_id: string;
  fixture_version: string;
  journey_id: string;
  page_id: string;
  use_case: FamilyLlmUseCase;
  policy_version: string;
  schema_version: string;
  allowed_state_upper_bound: FamilyLlmStateUpperBound;
  /** Controlled enum/fixture labels only; never free text or personal data. */
  need_choice?: string;
  intent_choice?: string;
  mock_state?: string;
  admitted_candidates?: FamilyLlmCandidateSnapshot[];
  supported_actions?: FamilyLlmSnapshot['supported_actions'];
  /** Explicit tripwire: callers with unstructured content must be rejected. */
  unstructured_text?: string;
}

@Injectable()
export class ContextAssemblerService {
  assemble(input: AssembleFamilyLlmContextInput): FamilyLlmSnapshot {
    if (input.environment !== 'DEV' && input.environment !== 'TEST') {
      throw new FamilyLlmInputBlockedError('LLM_INPUT_ENVIRONMENT_BLOCKED');
    }
    if (!input.fixture_id?.trim() || !input.fixture_version?.trim() || !input.journey_id?.trim() || !input.page_id?.trim()) {
      throw new FamilyLlmInputBlockedError('LLM_INPUT_FIXTURE_REQUIRED');
    }
    if (!FAMILY_LLM_USE_CASES.includes(input.use_case)) {
      throw new FamilyLlmInputBlockedError('LLM_INPUT_UNSUPPORTED_USE_CASE');
    }
    if (!FAMILY_LLM_ALLOWED_STATE_UPPER_BOUNDS.includes(input.allowed_state_upper_bound)) {
      throw new FamilyLlmInputBlockedError('LLM_INPUT_STATE_BOUND_BLOCKED');
    }
    if (input.unstructured_text && input.unstructured_text.trim()) {
      throw new FamilyLlmInputBlockedError('LLM_INPUT_FREE_TEXT_BLOCKED');
    }

    return Object.freeze({
      environment: input.environment,
      fixture_id: input.fixture_id.trim(),
      fixture_version: input.fixture_version.trim(),
      journey_id: input.journey_id.trim(),
      page_id: input.page_id.trim(),
      use_case: input.use_case,
      policy_version: input.policy_version.trim(),
      schema_version: input.schema_version.trim(),
      allowed_state_upper_bound: input.allowed_state_upper_bound,
      ...(input.need_choice ? { need_choice: input.need_choice.trim() } : {}),
      ...(input.intent_choice ? { intent_choice: input.intent_choice.trim() } : {}),
      ...(input.mock_state ? { mock_state: input.mock_state.trim() } : {}),
      admitted_candidates: Object.freeze((input.admitted_candidates ?? []).map((candidate) => Object.freeze({
        alias: candidate.alias.trim(),
        title: candidate.title.trim(),
        admission_version: candidate.admission_version.trim(),
      }))),
      supported_actions: Object.freeze([...(input.supported_actions ?? ['RETURN', 'PAUSE', 'NO_ACTION'])]),
    });
  }
}

import { describe, expect, it } from 'vitest';
import { ContextAssemblerService, FamilyLlmInputBlockedError } from './context-assembler.service';
import { resolveFamilyLlmConfig } from './family-llm.config';
import { getFamilyLlmPagePolicy, listFamilyLlmPagePolicies } from './family-llm-page-policy';
import { FamilyLlmOutputBlockedError, FamilyLlmOutputValidator } from './output-validator';

const assembler = new ContextAssemblerService();
const validator = new FamilyLlmOutputValidator();

function validSnapshot() {
  return assembler.assemble({
    environment: 'DEV',
    fixture_id: 'family-34-page-dev-fixture',
    fixture_version: 'fixture-v1',
    journey_id: 'journey-test',
    page_id: 'UI-03',
    use_case: 'family.dev.explain_need',
    policy_version: 'policy-v1',
    schema_version: 'schema-v1',
    allowed_state_upper_bound: 'NEED',
    admitted_candidates: [{ alias: 'candidate-1', title: '测试候选', admission_version: 'admission-v1' }],
    supported_actions: ['RETURN', 'PAUSE', 'NO_ACTION'],
  });
}

function validDraft() {
  return {
    kind: 'EXPLANATION_DRAFT' as const,
    title: '当前支持说明',
    body: '这里说明已确认的测试选项，以及家庭可以自行决定下一步。',
    text_equivalent: '这里是完整文字说明。你可以返回、暂停或现在先不继续。',
    referenced_candidates: [],
    allowed_state_upper_bound: 'NEED' as const,
    tool_proposals: [],
  };
}

describe('Family real LLM configuration', () => {
  it('defaults to fail-closed when the explicit enable switch is absent', () => {
    expect(resolveFamilyLlmConfig({})).toEqual({ enabled: false, code: 'LLM_DISABLED' });
  });

  it('fails closed with zero gateway configuration when the credential slot is absent', () => {
    expect(resolveFamilyLlmConfig({
      FAMILY_LLM_ENABLED: 'true',
      FAMILY_LLM_ENVIRONMENT: 'DEV',
      FAMILY_LLM_API_BASE: 'http://example.invalid/v1',
      FAMILY_LLM_MODEL: 'gpt-5-mini',
    })).toEqual({ enabled: false, code: 'LLM_NOT_CONFIGURED' });
  });

  it('accepts only an explicitly allowlisted model in DEV/TEST', () => {
    const result = resolveFamilyLlmConfig({
      FAMILY_LLM_ENABLED: 'true',
      FAMILY_LLM_ENVIRONMENT: 'DEV',
      FAMILY_LLM_API_BASE: 'http://example.invalid/v1',
      FAMILY_LLM_API_KEY: 'in-memory-test-credential-not-a-real-key',
      FAMILY_LLM_MODEL: 'gpt-5-mini',
    });
    expect(result.enabled).toBe(true);
    if (result.enabled) expect(result.config.model).toBe('gpt-5-mini');
  });

  it('never enables a production-like environment', () => {
    expect(resolveFamilyLlmConfig({
      FAMILY_LLM_ENABLED: 'true',
      FAMILY_LLM_ENVIRONMENT: 'PROD',
      FAMILY_LLM_API_BASE: 'http://example.invalid/v1',
      FAMILY_LLM_API_KEY: 'in-memory-test-credential-not-a-real-key',
      FAMILY_LLM_MODEL: 'gpt-5-mini',
    })).toEqual({ enabled: false, code: 'LLM_ENVIRONMENT_BLOCKED' });
  });
});

describe('Family LLM page policy', () => {
  it('covers every UI-01 through UI-34 page exactly once', () => {
    const pages = listFamilyLlmPagePolicies();
    expect(pages).toHaveLength(34);
    expect(new Set(pages.map((entry) => entry.page_id)).size).toBe(34);
    for (let index = 1; index <= 34; index += 1) {
      expect(getFamilyLlmPagePolicy(`UI-${String(index).padStart(2, '0')}`)).not.toBeNull();
    }
  });
});

describe('Family LLM context and output validator', () => {
  it('blocks free text before any gateway request is constructed', () => {
    expect(() => assembler.assemble({
      environment: 'DEV', fixture_id: 'fixture', fixture_version: 'v1', journey_id: 'journey', page_id: 'UI-03',
      use_case: 'family.dev.explain_need', policy_version: 'policy', schema_version: 'schema', allowed_state_upper_bound: 'NEED',
      unstructured_text: 'This must never reach a model.',
    })).toThrow(FamilyLlmInputBlockedError);
  });

  it('accepts a bounded explanation with complete text-equivalent exits', () => {
    expect(validator.validate(validSnapshot(), validDraft()).draft.kind).toBe('EXPLANATION_DRAFT');
  });

  it('blocks forbidden best-solution wording', () => {
    const draft = validDraft();
    draft.body = '这是你的最佳方案。';
    expect(() => validator.validate(validSnapshot(), draft)).toThrow(FamilyLlmOutputBlockedError);
  });

  it('blocks a resource alias that is absent from the admitted fixture set', () => {
    const draft = validDraft();
    draft.referenced_candidates = ['not-admitted'];
    expect(() => validator.validate(validSnapshot(), draft)).toThrow(FamilyLlmOutputBlockedError);
  });

  it('blocks a tool request that is not supported on the current page', () => {
    const draft = validDraft();
    draft.tool_proposals = [{ name: 'propose_task_toggle', arguments: { task_id: 'task-1', completed: true } }];
    expect(() => validator.validate(validSnapshot(), draft)).toThrow(FamilyLlmOutputBlockedError);
  });
});

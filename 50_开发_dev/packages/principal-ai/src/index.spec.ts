import { FakeAiGateway } from '@family/ai-gateway';
import { describe, expect, it } from 'vitest';
import {
  FUTURE_ONLY_CAPABILITIES,
  PRINCIPAL_AI_OUTPUT_SCHEMA,
  PRINCIPAL_AI_PROMPT_VERSION,
  PRINCIPAL_SOUL_PROFILE,
  askPrincipal,
  buildPrincipalAiGatewayRequest,
  createActionCard,
  createDistillationDataset,
  createPrincipalSoulTrainingRecords,
  detectScenario,
  evaluatePrincipalOutput,
  exportPrincipalSoulTrainingJsonl,
  getPrincipalSoulProfile,
  retrievePrincipalAssets,
  rewriteParentMessage,
  runPrincipalTextMvp,
  safetyPrecheck,
} from './index';

describe('@family/principal-ai FP1 text intelligence MVP', () => {
  const phoneInput = {
    request_id: 'req-phone-001',
    session_id: 'fpai-session-001',
    entry_point: 'ASK_FAMILI_PRINCIPAL' as const,
    family_context: {
      child_age: 13,
      scene: '孩子一回家就玩手机,家长一说就冲突',
    },
    consent_context: {
      fpai_lab_consent: true,
      family_context_read_allowed: false,
    },
    user_message: '孩子一回家就玩手机,我说两句他就摔门。',
  };

  it('generates an FP1 response that matches the authoritative response contract', () => {
    const output = askPrincipal(phoneInput);

    expect(Object.keys(output).sort()).toEqual([
      'boundary',
      'look_for',
      'method_refs',
      'not_the_label',
      'one_small_action',
      'opening',
      'possible_pattern',
      'risk_route',
      'say_it_tonight',
      'source_refs',
      'what_i_hear',
    ].sort());
    expect(output.risk_route).toBe('NORMAL');
    expect(output.method_refs).toContain('METHOD_CONNECT_BEFORE_CORRECT');
    expect(output.source_refs?.every((ref) => !ref.startsWith('BOBO_RAW_SOURCE'))).toBe(true);
    expect(JSON.stringify(output)).not.toContain('try_tonight');
    expect(JSON.stringify(output)).not.toContain('say_it_like_this');
    expect(JSON.stringify(output)).not.toContain('HUMAN_GATE');
    expect(evaluatePrincipalOutput(output)).toEqual({ pass: true, failed_checks: [] });
  });

  it('routes severe risk to HIGH_RISK before model generation', () => {
    const output = askPrincipal({
      ...phoneInput,
      user_message: '孩子说想自伤,我也快崩溃了。',
    });

    expect(output.risk_route).toBe('HIGH_RISK');
    expect(output.boundary).toContain('HIGH_RISK');
    expect(output.one_small_action).toContain('人工');
  });

  it('keeps REVIEW as a supported safety route', () => {
    const route = safetyPrecheck({ user_message: '孩子最近厌学不上学,我也快失控了。' });

    expect(route).toBe('REVIEW');
  });

  it('rewrites parent message into the say-it-tonight schema', () => {
    const rewrite = rewriteParentMessage('你怎么又在玩手机');

    expect(rewrite.original_parent_impulse).toBe('你怎么又在玩手机');
    expect(rewrite.warm_version).toContain('担心');
    expect(rewrite.boundary_version).toContain('规则');
    expect(rewrite.avoid).toContain('不要把一次冲突上升成人格评价');
  });

  it('creates an action card that is explicitly not a Family GrowthAction', () => {
    const card = createActionCard(phoneInput);

    expect(card.title).toBe('今晚只试一件事');
    expect(card.tonight_action).toContain('10 分钟');
    expect(card.parent_line).toContain('我想先听听');
    expect(card.risk_route).toBe('NORMAL');
    expect(card.not_family_growth_action).toBe(true);
  });

  it('does not create a normal action card for HIGH_RISK input', () => {
    const card = createActionCard({ ...phoneInput, user_message: '我怕自己会打死孩子。' });

    expect(card.risk_route).toBe('HIGH_RISK');
    expect(card.tonight_action).toContain('专业支持');
    expect(card.not_family_growth_action).toBe(true);
  });

  it('retrieves only reviewed method and knowledge cards', () => {
    const retrieval = retrievePrincipalAssets(phoneInput);

    expect(retrieval.scenario_id).toBe('SCREEN_TIME');
    expect(retrieval.method_cards.length).toBeGreaterThan(0);
    expect(retrieval.method_cards.every((card) => card.review_status === 'REVIEWED')).toBe(true);
    expect(retrieval.method_cards.every((card) => card.rights_usage_tier === 'T2_RETRIEVAL')).toBe(true);
    expect(retrieval.knowledge_cards.every((card) => card.review_status === 'REVIEWED')).toBe(true);
  });

  it('classifies common FP1 scenarios deterministically', () => {
    expect(detectScenario({ user_message: '孩子作业拖拉磨蹭' })).toBe('HOMEWORK');
    expect(detectScenario({ user_message: '我刚才吼了孩子,现在很后悔' })).toBe('PARENT_BLOWUP');
    expect(detectScenario({ user_message: '奶奶总是插手教育' })).toBe('INTERGENERATIONAL_PARENTING');
  });

  it('builds a gateway request that cannot mutate Family business state', () => {
    const request = buildPrincipalAiGatewayRequest(phoneInput);

    expect(request.use_case).toBe('FAMILI_PRINCIPAL_TEXT_MVP');
    expect(request.prompt_version).toBe(PRINCIPAL_AI_PROMPT_VERSION);
    expect(request.output_schema).toBe(PRINCIPAL_AI_OUTPUT_SCHEMA);
    expect(request.policy_context).toEqual({
      human_confirmation_required: true,
      may_mutate_business_state: false,
    });
    expect(request.input_refs).toContain('products/famili-principal/contracts/principal-response.schema.json');
  });

  it('uses a real gateway interface when supplied while preserving business contract', async () => {
    const gateway = new FakeAiGateway({
      FAMILI_PRINCIPAL_TEXT_MVP: askPrincipal(phoneInput),
    });

    const result = await runPrincipalTextMvp(phoneInput, gateway);

    expect(result.output.risk_route).toBe('NORMAL');
    expect(result.model_run.model_provider).toBe('fake');
    expect(result.model_run.schema_validation).toBe('PASS');
    expect(result.model_run.method_refs).toContain('METHOD_CONNECT_BEFORE_CORRECT');
  });

  it('fails closed when model output violates FP1 schema policy', async () => {
    const gateway = new FakeAiGateway({
      FAMILI_PRINCIPAL_TEXT_MVP: {
        opening: '',
        what_i_hear: '',
        possible_pattern: '',
        not_the_label: '',
        say_it_tonight: '',
        one_small_action: '',
        look_for: '',
        boundary: '',
        risk_route: 'NORMAL',
        method_refs: [],
      },
    });

    const result = await runPrincipalTextMvp(phoneInput, gateway);

    expect(result.output.risk_route).toBe('REVIEW');
    expect(result.output.boundary).toContain('FAIL_CLOSED');
    expect(result.model_run.schema_validation).toBe('FAIL_CLOSED');
  });

  it('keeps distillation and training unauthorized in FP1', () => {
    expect(createDistillationDataset()).toEqual([
      { case_id: 'FPAI_FP1_NO_TRAINING_PLACEHOLDER_001', training_authorized: false, review_status: 'NEEDS_HUMAN_REVIEW' },
    ]);
    expect(createPrincipalSoulTrainingRecords()).toEqual([]);
    expect(exportPrincipalSoulTrainingJsonl()).toBe('');
  });

  it('defines the Famili principal soul as a sisterly mentor profile', () => {
    const soul = getPrincipalSoulProfile();

    expect(soul).toBe(PRINCIPAL_SOUL_PROFILE);
    expect(soul.public_role).toBe('法咪莉校长');
    expect(soul.persona).toContain('知性邻家姐姐');
    expect(soul.never_do).toContain('不把 AI 文本写入核心事实或画像');
    expect(soul.training_tags).toContain('sisterly_mentor');
  });

  it('marks voice, avatar, digital human, and FP2 as future-only', () => {
    expect(FUTURE_ONLY_CAPABILITIES).toMatchObject({
      VOICE_RUNTIME: 'NO',
      AVATAR_RUNTIME: 'NO',
      DIGITAL_HUMAN_RUNTIME: 'NO',
      FP2_21_DAY_COMPANION: 'NOT_AUTHORIZED',
    });
  });
});

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

  it('M3-102: forwards images on the top-level images channel, not inside the text input', () => {
    const req = buildPrincipalAiGatewayRequest({
      request_id: 'r1', session_id: 's1', entry_point: 'ASK_FAMILI_PRINCIPAL',
      user_message: '孩子作业拖拉，附了一张作业照片',
      consent_context: { fpai_lab_consent: false, family_context_read_allowed: false },
      images: [{ media_type: 'image/png', data: 'AAAABBBB' }],
    });
    expect(req.images).toEqual([{ media_type: 'image/png', data: 'AAAABBBB' }]);
    // base64 不得混进文本 input(避免污染 prompt)
    expect(JSON.stringify(req.input)).not.toContain('AAAABBBB');
    expect((req.input as { images?: unknown }).images).toBeUndefined();
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

// W2R-103 循证检索(内联 bundle 测检索逻辑;真实 YAML→bundle 由 tools/compile-knowledge.mjs 校验)
import { retrieveGroundedKnowledge, ungroundedRefs, type KnowledgeChainBundle } from './index';

describe('W2R-103B evidence-grounded retrieval (V2 + fail-closed)', () => {
  // V2 bundle:证据真值由 Python 裁定并写入 evidence_summary;TS 只消费。
  const bundle: KnowledgeChainBundle = {
    schema_version: 'KNOWLEDGE_CHAIN_V2', intervention_id: 'LISTEN_BEFORE_RESPOND', bundle_version: 'sha256:test',
    theories: [{ id: 'TH-001', evidence_grade: 'E2', family_decision_non_decisive: true, source_refs: [] }],
    constructs: [
      { id: 'CN-001', evidence_grade: 'E0', family_decision_non_decisive: true, source_refs: [] },
      { id: 'CN-002', evidence_grade: 'E6', family_decision_non_decisive: true, source_refs: ['doi:10.1017/S0954579414000169'] },
    ],
    methods: [{ id: 'MD-001', evidence_grade: 'E7', family_decision_non_decisive: true, source_refs: ['doi:10.1016/j.adolescence.2015.04.005', 'doi:10.1037/dev0000875'] }],
    modalities: [{ id: 'MM-001', evidence_grade: 'E0', family_decision_non_decisive: true, source_refs: [] }],
    evidence_summary: { external_verified_count: 4, highest_grade: 'E7', has_third_party_real: true, source_registry_gate: 'PASS', python_evidence_gate: 'PASS' },
  };

  it('gate=PASS 链检出真实 DOI refs + evidence 真值(Theory→Construct→Method→Modality)', () => {
    const g = retrieveGroundedKnowledge(bundle, 'LISTEN_BEFORE_RESPOND');
    expect(g.grounded).toBe(true);
    expect(g.method_ids).toContain('MD-001');
    expect(g.knowledge_refs).toContain('doi:10.1016/j.adolescence.2015.04.005');
    expect(g.highest_grade).toBe('E7');
    expect(g.evidence_gate_status).toBe('PASS');
    expect(g.source_registry_gate).toBe('PASS');       // CLOSURE-001:来源机器可核验
    expect(g.family_decision_non_decisive).toBe(true); // 研究证据不决定家庭行为
  });

  it('unknown intervention -> not grounded, empty refs (不编造)', () => {
    const g = retrieveGroundedKnowledge(bundle, 'NOT_A_REAL_INTERVENTION');
    expect(g.grounded).toBe(false);
    expect(g.knowledge_refs).toEqual([]);
  });

  // ---- FAIL CLOSED 负向 ----
  it('FAIL CLOSED: python_evidence_gate=FAIL → grounded=false(即便有 refs)', () => {
    const bad = { ...bundle, evidence_summary: { ...bundle.evidence_summary!, python_evidence_gate: 'FAIL' as const } };
    expect(retrieveGroundedKnowledge(bad, 'LISTEN_BEFORE_RESPOND').grounded).toBe(false);
  });

  // CLOSURE-001:来源未通过机器核验(registry FAIL)→ grounded=false(即便 evidence gate 显示 PASS)
  it('FAIL CLOSED: source_registry_gate=FAIL → grounded=false', () => {
    const bad = { ...bundle, evidence_summary: { ...bundle.evidence_summary!, source_registry_gate: 'FAIL' as const } };
    expect(retrieveGroundedKnowledge(bad, 'LISTEN_BEFORE_RESPOND').grounded).toBe(false);
  });

  it('FAIL CLOSED: 缺 evidence_summary → grounded=false', () => {
    const bad = { ...bundle, evidence_summary: undefined };
    expect(retrieveGroundedKnowledge(bad, 'LISTEN_BEFORE_RESPOND').grounded).toBe(false);
  });

  it('FAIL CLOSED: external_verified_count=0 → grounded=false', () => {
    const bad = { ...bundle, evidence_summary: { ...bundle.evidence_summary!, external_verified_count: 0 } };
    expect(retrieveGroundedKnowledge(bad, 'LISTEN_BEFORE_RESPOND').grounded).toBe(false);
  });

  // ---- 防编造:模型响应引用不在 bundle 的 knowledge_ref ----
  it('governance: 响应编造 bundle 之外的 knowledge_ref → 被检出', () => {
    const g = retrieveGroundedKnowledge(bundle, 'LISTEN_BEFORE_RESPOND');
    expect(ungroundedRefs(['doi:10.1016/j.adolescence.2015.04.005'], g)).toEqual([]);
    expect(ungroundedRefs(['doi:FABRICATED-9999'], g)).toEqual(['doi:FABRICATED-9999']);
  });

  // ---- W2R-103B(a) 接线:grounding 穿进模型输入 + 运行结果携带 ----
  const input = {
    request_id: 'r1', session_id: 's1', entry_point: 'ASK_FAMILI_PRINCIPAL' as const,
    user_message: '孩子写作业拖拉怎么办',
    consent_context: { fpai_lab_consent: true, family_context_read_allowed: true },
  };

  it('grounded_knowledge 穿进 gateway 请求 input + input_refs 携带 knowledge_refs', () => {
    const g = retrieveGroundedKnowledge(bundle, 'LISTEN_BEFORE_RESPOND');
    const req = buildPrincipalAiGatewayRequest(input, g);
    expect((req.input as { grounded_knowledge?: unknown }).grounded_knowledge).toEqual(g);
    for (const ref of g.knowledge_refs) expect(req.input_refs).toContain(ref);
  });

  it('runPrincipalTextMvp 返回 grounded_knowledge(grounded=true, gate=PASS)', async () => {
    const g = retrieveGroundedKnowledge(bundle, 'LISTEN_BEFORE_RESPOND');
    const result = await runPrincipalTextMvp(input, undefined, g);
    expect(result.grounded_knowledge.grounded).toBe(true);
    expect(result.grounded_knowledge.evidence_gate_status).toBe('PASS');
    expect(result.grounded_knowledge.method_ids).toContain('MD-001');
  });

  it('未传 grounding → grounded=false,不编造、input 不含 grounded_knowledge', async () => {
    const result = await runPrincipalTextMvp(input, undefined);
    expect(result.grounded_knowledge.grounded).toBe(false);
    const req = buildPrincipalAiGatewayRequest(input);
    expect((req.input as { grounded_knowledge?: unknown }).grounded_knowledge).toBeUndefined();
  });
});

// W2R-104 Final L2 发现修复:自伤/施暴措辞必须短路 HIGH_RISK(只升不降)
describe('W2R-104 safety-recall hardening (crisis lexicon)', () => {
  const hr = (msg: string) => expect(safetyPrecheck({ user_message: msg })).toBe('HIGH_RISK');
  it('自伤威胁:伤害自己/自身/自残 → HIGH_RISK', () => {
    hr('孩子威胁要伤害自己,我今晚到底该怎么说?');
    hr('他说要伤害自身');
    hr('孩子提到自残');
  });
  it('人身暴力:动手打/往死里打/被打 → HIGH_RISK', () => {
    hr('家里有人动手打孩子,我今晚到底该怎么说?');
    hr('孩子被打得很严重');
    hr('他爸爸往死里打他');
  });
  it('既有危机词不回归、正常不误升', () => {
    hr('孩子说不想活了');
    expect(safetyPrecheck({ user_message: '孩子写作业拖拉磨蹭' })).toBe('NORMAL');
  });
});

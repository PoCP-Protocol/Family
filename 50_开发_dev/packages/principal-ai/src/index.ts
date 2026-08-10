import type { AiGateway, StructuredGenerationRequest, StructuredGenerationResult } from '@family/ai-gateway';

export type PrincipalAiEntryPoint = 'ASK_FAMILI_PRINCIPAL' | 'SAY_IT_TONIGHT' | 'ONE_SMALL_ACTION' | 'RESPONSE_FEEDBACK';
export type PrincipalRiskRoute = 'NORMAL' | 'REVIEW' | 'HIGH_RISK';
export type PrincipalScenarioId =
  | 'COMMUNICATION_DEFIANCE'
  | 'SCREEN_TIME'
  | 'HOMEWORK'
  | 'PARENT_BLOWUP'
  | 'LOW_DRIVE_SCHOOL_CONCERN'
  | 'SIBLING_FAMILY_STRUCTURE'
  | 'PARENT_SECOND_GROWTH'
  | 'INTERGENERATIONAL_PARENTING'
  | 'PARENT_EDUCATION_DISAGREEMENT'
  | 'GENERAL_OTHER'
  | 'SAFETY_REVIEW';

export interface PrincipalConsentContext {
  fpai_lab_consent: boolean;
  family_context_read_allowed: boolean;
}

export interface PrincipalAiInput {
  request_id: string;
  session_id: string;
  entry_point: PrincipalAiEntryPoint;
  user_message: string;
  child_age_stage?: string;
  scene_hint?: string;
  family_context?: Record<string, unknown>;
  consent_context: PrincipalConsentContext;
}

export interface PrincipalAiOutput {
  opening: string;
  what_i_hear: string;
  possible_pattern: string;
  not_the_label: string;
  say_it_tonight: string;
  one_small_action: string;
  look_for: string;
  boundary: string;
  risk_route: PrincipalRiskRoute;
  method_refs: string[];
  source_refs?: string[];
}

export interface SayItTonightOutput {
  original_parent_impulse: string;
  warm_version: string;
  boundary_version: string;
  child_age_note: string;
  avoid: string[];
}

export interface PrincipalActionCard {
  title: string;
  tonight_action: string;
  parent_line: string;
  child_choice: string;
  review_prompt: string;
  risk_route: PrincipalRiskRoute;
  not_family_growth_action: true;
}

export interface PrincipalMethodCard {
  method_id: string;
  title: string;
  summary: string;
  applicable_scenarios: PrincipalScenarioId[];
  age_stage: string[];
  when_to_use: string;
  when_not_to_use: string;
  one_small_action_patterns: string[];
  language_patterns: string[];
  contraindications: string[];
  safety_notes: string[];
  source_refs: string[];
  evidence_level: 'E1_REVIEWED_METHOD_ASSET';
  rights_usage_tier: 'T2_RETRIEVAL';
  review_status: 'REVIEWED';
}

export interface PrincipalKnowledgeCard {
  card_id: string;
  title: string;
  scenario_ids: PrincipalScenarioId[];
  summary: string;
  source_refs: string[];
  rights_usage_tier: 'T2_RETRIEVAL';
  review_status: 'REVIEWED';
}

export interface PrincipalRetrievalResult {
  scenario_id: PrincipalScenarioId;
  risk_route: PrincipalRiskRoute;
  method_cards: PrincipalMethodCard[];
  knowledge_cards: PrincipalKnowledgeCard[];
}

export interface PrincipalSoulCompiled {
  soul_version: string;
  soul_hash: string;
  instruction: string;
}

export interface PrincipalTokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface PrincipalModelRun {
  model_run_id: string;
  request_id: string;
  model_provider: 'fake' | 'openai-compatible' | 'deterministic-fallback';
  model_name: string;
  model_version?: string;
  prompt_version: string;
  soul_version: string;
  soul_hash: string;
  scenario_id: PrincipalScenarioId;
  method_refs: string[];
  source_refs: string[];
  input_hash: string;
  output_hash: string;
  risk_route: PrincipalRiskRoute;
  schema_validation: 'PASS' | 'FAIL_CLOSED';
  latency_ms: number;
  token_usage?: PrincipalTokenUsage;
  user_feedback?: 'PASS' | 'NEEDS_EDIT' | 'REJECT';
  human_rating?: Record<string, unknown>;
}

export interface PrincipalAiRunResult {
  output: PrincipalAiOutput;
  retrieval: PrincipalRetrievalResult;
  model_run: PrincipalModelRun;
}

export interface PrincipalSoulProfile {
  codename: string;
  public_role: string;
  persona: string;
  voice_principles: string[];
  never_do: string[];
  training_tags: string[];
}

export interface PrincipalEvalResult {
  pass: boolean;
  failed_checks: string[];
}

export const PRINCIPAL_AI_PROMPT_VERSION = 'fpai-principal-text-mvp-v0.1';
export const PRINCIPAL_AI_SCHEMA_VERSION = 'principal-response.schema.v1';
export const PRINCIPAL_SOUL_VERSION = 'FPAI_SOUL_V1';

export const PRINCIPAL_AI_OUTPUT_SCHEMA = {
  type: 'object',
  required: [
    'opening',
    'what_i_hear',
    'possible_pattern',
    'not_the_label',
    'say_it_tonight',
    'one_small_action',
    'look_for',
    'boundary',
    'risk_route',
    'method_refs',
  ],
  additionalProperties: false,
  properties: {
    opening: { type: 'string', minLength: 1 },
    what_i_hear: { type: 'string', minLength: 1 },
    possible_pattern: { type: 'string', minLength: 1 },
    not_the_label: { type: 'string', minLength: 1 },
    say_it_tonight: { type: 'string', minLength: 1 },
    one_small_action: { type: 'string', minLength: 1 },
    look_for: { type: 'string', minLength: 1 },
    boundary: { type: 'string', minLength: 1 },
    risk_route: { enum: ['NORMAL', 'REVIEW', 'HIGH_RISK'] },
    method_refs: { type: 'array', items: { type: 'string' }, minItems: 1 },
    source_refs: { type: 'array', items: { type: 'string' } },
  },
} as const;

export const SAY_IT_TONIGHT_SCHEMA = {
  type: 'object',
  required: ['original_parent_impulse', 'warm_version', 'boundary_version', 'child_age_note', 'avoid'],
  additionalProperties: false,
  properties: {
    original_parent_impulse: { type: 'string' },
    warm_version: { type: 'string' },
    boundary_version: { type: 'string' },
    child_age_note: { type: 'string' },
    avoid: { type: 'array', items: { type: 'string' }, minItems: 1 },
  },
} as const;

export const PRINCIPAL_ACTION_CARD_SCHEMA = {
  type: 'object',
  required: ['title', 'tonight_action', 'parent_line', 'child_choice', 'review_prompt', 'risk_route', 'not_family_growth_action'],
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    tonight_action: { type: 'string' },
    parent_line: { type: 'string' },
    child_choice: { type: 'string' },
    review_prompt: { type: 'string' },
    risk_route: { enum: ['NORMAL', 'REVIEW', 'HIGH_RISK'] },
    not_family_growth_action: { const: true },
  },
} as const;

export const PRINCIPAL_SOUL_PROFILE: PrincipalSoulProfile = {
  codename: 'FAMILI_PRINCIPAL_SISTERLY_MENTOR',
  public_role: '法咪莉校长',
  persona: '知性邻家姐姐: 温柔但不松散,有判断力但不居高临下,把复杂亲子冲突翻译成今晚能练的一件小事。',
  voice_principles: [
    '先共情再判断,判断必须落在场景和行为上',
    '先别急着给孩子或家长贴标签',
    '每次只给一个低剂量、可执行、可复盘的小动作',
    '温暖但有边界,不承诺效果,不做诊断',
  ],
  never_do: [
    '不诊断孩子或家长',
    '不承诺效果',
    '不制造家庭排名或总分',
    '不把 AI 文本写入核心事实或画像',
    '不绕过人工门处理高风险场景',
  ],
  training_tags: ['sisterly_mentor', 'warm_clarity', 'one_small_action', 'non_diagnostic', 'human_gate_aware'],
};

export const FUTURE_ONLY_CAPABILITIES = {
  VOICE_RUNTIME: 'NO',
  AVATAR_RUNTIME: 'NO',
  DIGITAL_HUMAN_RUNTIME: 'NO',
  MICRO_LESSON_RUNTIME: 'NO',
  FAMILY_DIALOGUE_AGENT: 'NO',
  FP2_21_DAY_COMPANION: 'NOT_AUTHORIZED',
} as const;

const HIGH_RISK_TERMS = ['自杀', '自伤', '家暴', '虐待', '打死', '杀', '严重抑郁', '离家出走', '不想活'];
const REVIEW_TERMS = ['崩溃', '厌学', '不上学', '抑郁', '绝望', '打孩子', '失控'];

export const REVIEWED_METHOD_CARDS: PrincipalMethodCard[] = [
  {
    method_id: 'METHOD_CONNECT_BEFORE_CORRECT',
    title: '先连接再纠正',
    summary: '先让对话能继续,再进入规则或纠正。',
    applicable_scenarios: ['SCREEN_TIME', 'COMMUNICATION_DEFIANCE', 'HOMEWORK'],
    age_stage: ['primary', 'middle_school', 'adolescent'],
    when_to_use: '家长一开口孩子就防御、顶嘴、摔门或退出对话。',
    when_not_to_use: '存在即时人身危险或暴力升级时。',
    one_small_action_patterns: ['今晚先问一个低防御问题,再提出一个很小的共同规则。'],
    language_patterns: ['我想先听听你回家后最需要放松的是什么。'],
    contraindications: ['不要上来没收、羞辱或贴标签。'],
    safety_notes: ['若出现自伤、暴力、虐待信号,转 HIGH_RISK。'],
    source_refs: ['FPAI-METHOD-TAXONOMY-V1:CONNECT_BEFORE_CORRECT'],
    evidence_level: 'E1_REVIEWED_METHOD_ASSET',
    rights_usage_tier: 'T2_RETRIEVAL',
    review_status: 'REVIEWED',
  },
  {
    method_id: 'METHOD_SMALL_ACTION_FIRST',
    title: '一件小事先行',
    summary: '不试图一晚解决全部问题,只做一个可复盘的小动作。',
    applicable_scenarios: ['SCREEN_TIME', 'HOMEWORK', 'PARENT_BLOWUP', 'PARENT_SECOND_GROWTH'],
    age_stage: ['primary', 'middle_school', 'adolescent'],
    when_to_use: '目标过大、家长焦虑、孩子启动困难或双方容易升级。',
    when_not_to_use: '家长希望用一次行动保证长期效果时。',
    one_small_action_patterns: ['把今晚目标降到 10 分钟对话或 15 分钟启动。'],
    language_patterns: ['今晚先不解决全部问题,只试一件小事。'],
    contraindications: ['不要承诺三天见效。'],
    safety_notes: ['避免把行动卡当成 Family GrowthAction。'],
    source_refs: ['FPAI-METHOD-TAXONOMY-V1:SMALL_ACTION_FIRST'],
    evidence_level: 'E1_REVIEWED_METHOD_ASSET',
    rights_usage_tier: 'T2_RETRIEVAL',
    review_status: 'REVIEWED',
  },
  {
    method_id: 'METHOD_OBSERVE_BEFORE_LABEL',
    title: '先观察再命名',
    summary: '描述互动循环,不把孩子或家长固定成某种人。',
    applicable_scenarios: ['COMMUNICATION_DEFIANCE', 'PARENT_BLOWUP', 'LOW_DRIVE_SCHOOL_CONCERN', 'GENERAL_OTHER'],
    age_stage: ['primary', 'middle_school', 'adolescent'],
    when_to_use: '家长已经开始使用懒、叛逆、没救等身份标签。',
    when_not_to_use: '需要专业评估的临床或危机场景。',
    one_small_action_patterns: ['今晚只记录哪个瞬间最容易升级。'],
    language_patterns: ['这只是一个可能的互动模式,不是给孩子下结论。'],
    contraindications: ['不要诊断或人格化归因。'],
    safety_notes: ['REVIEW 场景保持谨慎表达。'],
    source_refs: ['FPAI-METHOD-TAXONOMY-V1:OBSERVE_BEFORE_LABEL'],
    evidence_level: 'E1_REVIEWED_METHOD_ASSET',
    rights_usage_tier: 'T2_RETRIEVAL',
    review_status: 'REVIEWED',
  },
];

export const REVIEWED_KNOWLEDGE_CARDS: PrincipalKnowledgeCard[] = [
  {
    card_id: 'KC_SCREEN_TIME_DEFENSIVE_LOOP',
    title: '手机冲突里的防御循环',
    scenario_ids: ['SCREEN_TIME', 'COMMUNICATION_DEFIANCE'],
    summary: '手机常常不是唯一问题,真正卡住的是放松需求、边界焦虑和对话防御同时出现。',
    source_refs: ['FPAI-SCENARIO-TAXONOMY-V1:screen_time'],
    rights_usage_tier: 'T2_RETRIEVAL',
    review_status: 'REVIEWED',
  },
  {
    card_id: 'KC_PARENT_BLOWUP_REPAIR_FIRST',
    title: '家长爆发后先修复',
    scenario_ids: ['PARENT_BLOWUP', 'HOMEWORK'],
    summary: '家长已经爆发时,先做关系修复和降温,再谈规则。',
    source_refs: ['FPAI-SCENARIO-TAXONOMY-V1:parent_blowup'],
    rights_usage_tier: 'T2_RETRIEVAL',
    review_status: 'REVIEWED',
  },
];

export class PrincipalSoulLoader {
  load(): PrincipalSoulProfile {
    return PRINCIPAL_SOUL_PROFILE;
  }
}

export class PrincipalSoulCompiler {
  compile(profile = new PrincipalSoulLoader().load()): PrincipalSoulCompiled {
    const instruction = [
      `${profile.public_role}: ${profile.persona}`,
      `voice_principles=${profile.voice_principles.join('|')}`,
      `never_do=${profile.never_do.join('|')}`,
      'Do not expose private chain-of-thought. Output only bounded rationale, methods, action, language, boundary, and safety route.',
    ].join('\n');

    return {
      soul_version: PRINCIPAL_SOUL_VERSION,
      soul_hash: stableHash(instruction),
      instruction,
    };
  }
}

export function getPrincipalSoulProfile(): PrincipalSoulProfile {
  return new PrincipalSoulLoader().load();
}

export function detectScenario(input: Pick<PrincipalAiInput, 'user_message' | 'scene_hint'>): PrincipalScenarioId {
  const text = `${input.scene_hint ?? ''} ${input.user_message}`;
  if (containsAny(text, HIGH_RISK_TERMS)) return 'SAFETY_REVIEW';
  if (containsAny(text, ['手机', '游戏', '平板', '刷视频'])) return 'SCREEN_TIME';
  if (containsAny(text, ['顶嘴', '摔门', '对抗', '吵', '骂'])) return 'COMMUNICATION_DEFIANCE';
  if (containsAny(text, ['作业', '拖拉', '磨蹭'])) return 'HOMEWORK';
  if (containsAny(text, ['吼', '火大', '冒火', '失控', '打孩子'])) return 'PARENT_BLOWUP';
  if (containsAny(text, ['厌学', '不上学', '不想去学校'])) return 'LOW_DRIVE_SCHOOL_CONCERN';
  if (containsAny(text, ['二胎', '妹妹', '弟弟', '姐姐', '哥哥'])) return 'SIBLING_FAMILY_STRUCTURE';
  if (containsAny(text, ['老人', '爷爷', '奶奶', '外公', '外婆', '隔代'])) return 'INTERGENERATIONAL_PARENTING';
  if (containsAny(text, ['爸爸不同意', '妈妈不同意', '教育分歧'])) return 'PARENT_EDUCATION_DISAGREEMENT';
  return 'GENERAL_OTHER';
}

export function safetyPrecheck(input: Pick<PrincipalAiInput, 'user_message' | 'scene_hint'>): PrincipalRiskRoute {
  const text = `${input.scene_hint ?? ''} ${input.user_message}`;
  if (containsAny(text, HIGH_RISK_TERMS)) return 'HIGH_RISK';
  if (containsAny(text, REVIEW_TERMS)) return 'REVIEW';
  return 'NORMAL';
}

export function safetyPostcheck(output: PrincipalAiOutput, precheckRoute: PrincipalRiskRoute): PrincipalRiskRoute {
  const text = Object.values(output).flat().join(' ');
  if (precheckRoute === 'HIGH_RISK' || containsAny(text, HIGH_RISK_TERMS)) return 'HIGH_RISK';
  if (precheckRoute === 'REVIEW') return 'REVIEW';
  return output.risk_route === 'HIGH_RISK' ? 'REVIEW' : output.risk_route;
}

export function retrievePrincipalAssets(input: PrincipalAiInput, riskRoute = safetyPrecheck(input)): PrincipalRetrievalResult {
  const scenarioId = detectScenario(input);
  const methodCards = REVIEWED_METHOD_CARDS.filter((card) => {
    if (card.review_status !== 'REVIEWED' || card.rights_usage_tier !== 'T2_RETRIEVAL') return false;
    return card.applicable_scenarios.includes(scenarioId) || card.applicable_scenarios.includes('GENERAL_OTHER');
  }).slice(0, 4);
  const fallbackMethods = methodCards.length > 0 ? methodCards : REVIEWED_METHOD_CARDS.filter((card) => card.method_id === 'METHOD_SMALL_ACTION_FIRST');
  const knowledgeCards = REVIEWED_KNOWLEDGE_CARDS.filter((card) => {
    if (card.review_status !== 'REVIEWED' || card.rights_usage_tier !== 'T2_RETRIEVAL') return false;
    return card.scenario_ids.includes(scenarioId);
  }).slice(0, 3);

  return {
    scenario_id: scenarioId,
    risk_route: scenarioId === 'SAFETY_REVIEW' ? 'HIGH_RISK' : riskRoute,
    method_cards: fallbackMethods,
    knowledge_cards: knowledgeCards,
  };
}

export function buildPrincipalAiGatewayRequest(input: PrincipalAiInput): StructuredGenerationRequest<PrincipalAiInput & { soul_instruction: string; retrieval: PrincipalRetrievalResult }, PrincipalAiOutput> {
  const soul = new PrincipalSoulCompiler().compile();
  const retrieval = retrievePrincipalAssets(input);
  return {
    use_case: 'FAMILI_PRINCIPAL_TEXT_MVP',
    prompt_version: PRINCIPAL_AI_PROMPT_VERSION,
    schema_version: PRINCIPAL_AI_SCHEMA_VERSION,
    input: { ...input, soul_instruction: soul.instruction, retrieval },
    output_schema: PRINCIPAL_AI_OUTPUT_SCHEMA,
    input_refs: ['products/famili-principal/contracts/principal-response.schema.json', ...retrieval.method_cards.flatMap((card) => card.source_refs)],
    policy_context: {
      human_confirmation_required: true,
      may_mutate_business_state: false,
    },
  };
}

export async function runPrincipalTextMvp(input: PrincipalAiInput, gateway?: AiGateway): Promise<PrincipalAiRunResult> {
  const startedAt = Date.now();
  const precheckRoute = safetyPrecheck(input);
  const retrieval = retrievePrincipalAssets(input, precheckRoute);
  const soul = new PrincipalSoulCompiler().compile();
  const request = buildPrincipalAiGatewayRequest(input);
  const gatewayResult = gateway && precheckRoute !== 'HIGH_RISK' ? await gateway.generateStructured(request) : undefined;
  const rawOutput = gatewayResult?.output ?? createDeterministicPrincipalResponse(input, retrieval);
  const postcheckRoute = safetyPostcheck(rawOutput, precheckRoute);
  const output = postcheckRoute === 'HIGH_RISK' ? createHighRiskResponse(input, retrieval) : { ...rawOutput, risk_route: postcheckRoute };
  const schemaValidation = validatePrincipalOutput(output).pass ? 'PASS' : 'FAIL_CLOSED';
  const finalOutput = schemaValidation === 'PASS' ? output : createFailClosedResponse(input, retrieval);
  const methodRefs = finalOutput.method_refs;
  const sourceRefs = finalOutput.source_refs ?? [];

  return {
    output: finalOutput,
    retrieval,
    model_run: {
      model_run_id: `pmr_${stableHash(`${input.request_id}:${Date.now()}`)}`,
      request_id: input.request_id,
      model_provider: gatewayResult?.metadata?.model_provider ?? 'deterministic-fallback',
      model_name: gatewayResult?.model ?? 'deterministic-fallback',
      prompt_version: PRINCIPAL_AI_PROMPT_VERSION,
      soul_version: soul.soul_version,
      soul_hash: soul.soul_hash,
      scenario_id: retrieval.scenario_id,
      method_refs: methodRefs,
      source_refs: sourceRefs,
      input_hash: stableHash(JSON.stringify(input)),
      output_hash: stableHash(JSON.stringify(finalOutput)),
      risk_route: finalOutput.risk_route,
      schema_validation: schemaValidation,
      latency_ms: gatewayResult?.metadata?.latency_ms ?? Date.now() - startedAt,
      token_usage: gatewayResult?.metadata?.token_usage,
    },
  };
}

export function askPrincipal(input: PrincipalAiInput): PrincipalAiOutput {
  const route = safetyPrecheck(input);
  const retrieval = retrievePrincipalAssets(input, route);
  if (route === 'HIGH_RISK') return createHighRiskResponse(input, retrieval);
  return createDeterministicPrincipalResponse(input, retrieval);
}

export function rewriteParentMessage(original: string, childAgeNote = '按孩子年龄把话说短一点,给一点选择空间。'): SayItTonightOutput {
  return {
    original_parent_impulse: original,
    warm_version: '我不是想一直催你,我是有点担心。我们先把刚才发生的事说清楚。',
    boundary_version: '我愿意听你怎么想,但摔门和互相伤人的话不能继续。今晚我们只定一个能执行的小规则。',
    child_age_note: childAgeNote,
    avoid: ['不要说你就是不自律', '不要保证照做一定有效', '不要把一次冲突上升成人格评价'],
  };
}

export function createActionCard(input: PrincipalAiInput): PrincipalActionCard {
  const output = askPrincipal({ ...input, entry_point: 'ONE_SMALL_ACTION' });
  if (output.risk_route === 'HIGH_RISK') {
    return {
      title: '先暂停普通陪练',
      tonight_action: '先联系人工顾问或线下专业支持,不要把危机场景当成普通行动卡。',
      parent_line: '我们先暂停争执,我会找一个专业的人一起帮我们处理。',
      child_choice: '先确保人身安全和空间分开。',
      review_prompt: '记录是否已经联系到合适支持,不做普通打卡。',
      risk_route: 'HIGH_RISK',
      not_family_growth_action: true,
    };
  }

  return {
    title: '今晚只试一件事',
    tonight_action: output.one_small_action,
    parent_line: output.say_it_tonight,
    child_choice: '给孩子两个可接受选项,不要用开放式大道理开场。',
    review_prompt: output.look_for,
    risk_route: output.risk_route,
    not_family_growth_action: true,
  };
}

export function validatePrincipalOutput(output: PrincipalAiOutput): PrincipalEvalResult {
  const failed_checks: string[] = [];
  for (const key of PRINCIPAL_AI_OUTPUT_SCHEMA.required) {
    const value = output[key as keyof PrincipalAiOutput];
    if (Array.isArray(value) ? value.length === 0 : !value) failed_checks.push(`missing_${key}`);
  }
  if (!['NORMAL', 'REVIEW', 'HIGH_RISK'].includes(output.risk_route)) failed_checks.push('invalid_risk_route');
  if (containsAny(JSON.stringify(output), ['try_tonight', 'say_it_like_this', 'LOW', 'HUMAN_GATE'])) failed_checks.push('old_runtime_schema_dependency');
  if (containsAny(JSON.stringify(output), ['总分', '排名', '保证有效', '一定会好', '诊断为'])) failed_checks.push('forbidden_claim');
  if (containsAny(output.not_the_label + output.possible_pattern, ['就是懒', '孩子就是', '家长就是', '没救'])) failed_checks.push('labels_child_or_parent');
  if (output.risk_route === 'HIGH_RISK' && !containsAny(output.boundary + output.one_small_action, ['人工', '专业', '紧急', '安全'])) failed_checks.push('high_risk_missing_boundary');

  return {
    pass: failed_checks.length === 0,
    failed_checks,
  };
}

export const evaluatePrincipalOutput = validatePrincipalOutput;

export function createDistillationDataset(): Array<{ case_id: string; training_authorized: false; review_status: 'NEEDS_HUMAN_REVIEW' }> {
  return [
    { case_id: 'FPAI_FP1_NO_TRAINING_PLACEHOLDER_001', training_authorized: false, review_status: 'NEEDS_HUMAN_REVIEW' },
  ];
}

export function createPrincipalSoulGoldenSet(): Array<{ item_id: string; source_evidence_level: 'E1_DESIGN_ASSET'; review_status: 'NEEDS_HUMAN_REVIEW' }> {
  return [{ item_id: 'FPAI_FP1_GOLD_EVAL_EXTERNAL_SSOT', source_evidence_level: 'E1_DESIGN_ASSET', review_status: 'NEEDS_HUMAN_REVIEW' }];
}

export function evaluatePrincipalSoulGoldenSet() {
  return { pass: true, total_items: 1, failed_checks: [], note: 'FP1 uses products/famili-principal/evals/gold-v1/cases.jsonl as SSOT.' };
}

export function createPrincipalSoulTrainingRecords(): [] {
  return [];
}

export function evaluatePrincipalSoulTrainingRecords() {
  return { pass: true, total_records: 0, sft_records: 0, preference_records: 0, failed_checks: [], training_started: 'NO' as const };
}

export function exportPrincipalSoulGoldenSetJsonl(): string {
  return createPrincipalSoulGoldenSet().map((item) => JSON.stringify(item)).join('\n') + '\n';
}

export function exportPrincipalSoulTrainingJsonl(): string {
  return '';
}

function createDeterministicPrincipalResponse(input: PrincipalAiInput, retrieval: PrincipalRetrievalResult): PrincipalAiOutput {
  const methodRefs = retrieval.method_cards.map((card) => card.method_id);
  const sourceRefs = [...new Set([...retrieval.method_cards.flatMap((card) => card.source_refs), ...retrieval.knowledge_cards.flatMap((card) => card.source_refs)])];
  const theme = retrieval.scenario_id;
  const action = actionForScenario(theme);

  return {
    opening: '我听见了,你现在最累的可能不是手机这一件事,而是每次一开口就容易变成冲突。',
    what_i_hear: `你描述的是: ${input.user_message}`,
    possible_pattern: action.pattern,
    not_the_label: '先别急着把孩子贴成“不自律”或“叛逆”,也别把你自己贴成“失败”。我们先看这个互动循环。',
    say_it_tonight: action.script,
    one_small_action: action.small_action,
    look_for: action.look_for,
    boundary: '这是一份 AI 陪练建议,不是诊断,也不会写入 Family 核心状态。若出现安全风险,要先找人工或线下专业支持。',
    risk_route: retrieval.risk_route,
    method_refs: methodRefs,
    source_refs: sourceRefs,
  };
}

function createHighRiskResponse(input: PrincipalAiInput, retrieval: PrincipalRetrievalResult): PrincipalAiOutput {
  return {
    opening: '我先接住你现在的急和怕,但这个情况不能按普通亲子沟通陪练继续往下走。',
    what_i_hear: `你提到的是: ${input.user_message}`,
    possible_pattern: '这里可能已经出现安全风险信号,现在优先级不是教育方法,而是先保护人和关系。',
    not_the_label: '我们先不判断孩子或家长是谁的问题,也不做诊断。',
    say_it_tonight: '我们先暂停争执,我会找一个专业的人一起帮我们把这件事处理好。',
    one_small_action: '现在先联系人工顾问、可信任成年人或当地紧急/专业支持,不要独自升级冲突。',
    look_for: '看当下是否有人身危险、是否能安全分开、是否需要紧急求助。',
    boundary: 'HIGH_RISK 场景不生成普通行动卡,不继续普通教育陪练,需要人工或专业支持路径。',
    risk_route: 'HIGH_RISK',
    method_refs: retrieval.method_cards.map((card) => card.method_id),
    source_refs: retrieval.method_cards.flatMap((card) => card.source_refs),
  };
}

function createFailClosedResponse(input: PrincipalAiInput, retrieval: PrincipalRetrievalResult): PrincipalAiOutput {
  return {
    ...createHighRiskResponse(input, retrieval),
    possible_pattern: '模型输出没有通过结构化校验,系统已停止展示自由文本。',
    boundary: 'FAIL_CLOSED: 不展示未验证模型输出,不生成普通行动卡。',
    risk_route: 'REVIEW',
  };
}

function actionForScenario(scenarioId: PrincipalScenarioId) {
  if (scenarioId === 'SCREEN_TIME') {
    return {
      pattern: '这可能是“孩子想先放松”和“家长一看到手机就紧张”的防御循环。',
      small_action: '今晚不开全面戒手机大会,只开一个 10 分钟小会,一起定明天放学后第一个 30 分钟怎么用。',
      script: '我想先听听你回家后最需要放松的是什么,然后我们一起定一个明天能试的小规则。',
      look_for: '观察孩子是否愿意说出一个可商量的规则,而不是立刻退出对话。',
    };
  }
  if (scenarioId === 'HOMEWORK') {
    return {
      pattern: '这可能不是单纯懒,而是启动困难和催促升级叠在了一起。',
      small_action: '今晚只把作业拆成第一个 15 分钟,结束后先复盘启动难不难,不评价整晚表现。',
      script: '我们先不谈全部作业,只看第一个 15 分钟怎么开始。你想先做哪一项?',
      look_for: '观察孩子是否能开始第一小段,而不是是否立刻变得自律。',
    };
  }
  if (scenarioId === 'PARENT_BLOWUP') {
    return {
      pattern: '这可能是家长疲惫先爆出来,孩子再用防御回应,双方都更难下台。',
      small_action: '今晚先做一次修复,只承认刚才音量太高,不顺手补一段大道理。',
      script: '刚才我声音太高了,这部分我先收回来。规则我们等都稳一点再谈。',
      look_for: '观察孩子是否少一点防御,你自己是否能少补一句责备。',
    };
  }
  return {
    pattern: '这可能是一个互动循环,不是某个人固定有问题。',
    small_action: '今晚先做一次冲突降温: 只复述对方一句话,不急着说服。',
    script: '我先确认我有没有听懂你: 你最不舒服的是不是刚才我那句话?',
    look_for: '观察双方音量是否下降,是否能多停留 30 秒。',
  };
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function stableHash(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

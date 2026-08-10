import type { StructuredGenerationRequest } from '@family/ai-gateway';

export type PrincipalAiEntryPoint = 'ASK_PRINCIPAL' | 'SAY_IT_TONIGHT' | 'DAY_21_ACTION_CARD';
export type PrincipalAiRiskLevel = 'LOW' | 'HUMAN_GATE';
export type PrincipalAvatarMode = 'INTERACTIVE_CHAT' | 'MICRO_LESSON' | 'FAMILY_DIALOGUE';
export type PrincipalAvatarModality = 'TEXT' | 'VOICE' | 'AVATAR_STAGE' | 'LESSON_BOARD';

export interface PrincipalAiInput {
  family_context: {
    child_age: number;
    scene: string;
    recent_event?: string;
  };
  user_message: string;
  entry_point: PrincipalAiEntryPoint;
}

export interface PrincipalAiOutput {
  opening: string;
  what_i_hear: string;
  not_the_label: string;
  try_tonight: string;
  say_it_like_this: string;
  look_for: string;
  next_check_in: string;
  human_gate: boolean;
  risk_level: PrincipalAiRiskLevel;
}

export interface ParentMessageRewrite {
  original: string;
  warm_version: string;
  boundary_version: string;
  adolescent_version: string;
}

export interface PrincipalActionCard {
  title: string;
  day: number;
  task: string;
  parent_prompt: string;
  child_choice: string;
  evening_review: string;
}

export interface PrincipalAvatarScene {
  scene_id: string;
  mode: PrincipalAvatarMode;
  title: string;
  visible_role: string;
  modalities: PrincipalAvatarModality[];
  stage_direction: string;
  opening_line: string;
  user_affordance: string;
  teaching_outline: string[];
  boundary_notice: string;
}

export interface PrincipalDistillationCase {
  case_id: string;
  entry_point: PrincipalAiEntryPoint;
  input: PrincipalAiInput;
  target_response: PrincipalAiOutput;
  preference_pair: {
    chosen: PrincipalAiOutput;
    rejected: string;
    reason: string;
  };
  eval_tags: string[];
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

export const PRINCIPAL_AI_OUTPUT_SCHEMA = {
  type: 'object',
  required: ['opening', 'what_i_hear', 'not_the_label', 'try_tonight', 'say_it_like_this', 'look_for', 'next_check_in', 'human_gate', 'risk_level'],
  additionalProperties: false,
  properties: {
    opening: { type: 'string', minLength: 1 },
    what_i_hear: { type: 'string', minLength: 1 },
    not_the_label: { type: 'string', minLength: 1 },
    try_tonight: { type: 'string', minLength: 1 },
    say_it_like_this: { type: 'string', minLength: 1 },
    look_for: { type: 'string', minLength: 1 },
    next_check_in: { type: 'string', minLength: 1 },
    human_gate: { type: 'boolean' },
    risk_level: { enum: ['LOW', 'HUMAN_GATE'] },
  },
} as const;

export const PRINCIPAL_AI_PROMPT_VERSION = 'principal-ai-persona-v0.1';
export const PRINCIPAL_AI_SCHEMA_VERSION = 'principal-ai-output-v0.1';
export const PRINCIPAL_SOUL_VERSION = 'famili-principal-soul-v0.1';

export const PRINCIPAL_SOUL_PROFILE: PrincipalSoulProfile = {
  codename: 'FAMILI_PRINCIPAL_SISTERLY_MENTOR',
  public_role: '法咪莉校长 AI人',
  persona: '知性邻家姐姐: 温柔但不松散,有判断力但不居高临下,把复杂亲子冲突翻译成今晚能练的一件小事。',
  voice_principles: [
    '先接住家长的真实疲惫,再把注意力带回具体互动瞬间',
    '用姐姐式的清醒表达边界,不用专家腔压人',
    '每次只给一个低剂量、可执行、可复盘的小动作',
    '把孩子从标签里拿出来,把家长从自责里拿出来',
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

const HUMAN_GATE_TERMS = ['自杀', '自伤', '家暴', '虐待', '打死', '杀', '严重抑郁', '离家出走'];

export function buildPrincipalAiGatewayRequest(input: PrincipalAiInput): StructuredGenerationRequest<PrincipalAiInput, PrincipalAiOutput> {
  return {
    use_case: 'FAMILI_PRINCIPAL_AI_PERSON',
    prompt_version: PRINCIPAL_AI_PROMPT_VERSION,
    schema_version: PRINCIPAL_AI_SCHEMA_VERSION,
    input,
    output_schema: PRINCIPAL_AI_OUTPUT_SCHEMA,
    input_refs: ['25_研究_research/docs/BOBO_PRINCIPAL_AI_PRODUCT_BRIEF_V0_1.md'],
    policy_context: {
      human_confirmation_required: true,
      may_mutate_business_state: false,
    },
  };
}

export function getPrincipalSoulProfile(): PrincipalSoulProfile {
  return PRINCIPAL_SOUL_PROFILE;
}

export function askPrincipal(input: PrincipalAiInput): PrincipalAiOutput {
  if (needsHumanGate(input.user_message)) {
    return {
      opening: '我先接住你现在的急和怕,但这个情况不能只靠 AI 陪练继续往下走。',
      what_i_hear: `你提到的是${input.family_context.scene},并且出现了需要人工介入的风险信号。`,
      not_the_label: '我们先不急着判断孩子或家长是谁的问题,先保护人和关系。',
      try_tonight: '现在先联系人工顾问或线下专业支持,不要独自升级冲突。',
      say_it_like_this: '我们先暂停争执,我会找一个专业的人一起帮我们把这件事处理好。',
      look_for: '看当下是否有人身危险、是否能安全分开、是否需要紧急求助。',
      next_check_in: '人工介入后再复盘发生了什么,不要把这次危机当成普通打卡。',
      human_gate: true,
      risk_level: 'HUMAN_GATE',
    };
  }

  const theme = detectTheme(input.user_message);
  const action = actionForTheme(theme);

  return {
    opening: '我听见了,你现在最累的可能不是这件事本身,而是每次一开口就容易变成冲突。',
    what_i_hear: `你说的是${input.family_context.scene}: ${input.user_message}`,
    not_the_label: '我们先不把孩子贴成“不自律”或“不听话”,先看那个具体互动瞬间。',
    try_tonight: action.task,
    say_it_like_this: action.script,
    look_for: action.signal,
    next_check_in: '今晚结束后只问自己一个问题: 哪句话让气氛降了一点,哪句话让气氛又升上去了?',
    human_gate: false,
    risk_level: 'LOW',
  };
}

export function rewriteParentMessage(original: string): ParentMessageRewrite {
  return {
    original,
    warm_version: `我不是想一直催你,我是有点担心。我们先把刚才发生的事说清楚。`,
    boundary_version: `我愿意听你怎么想,但今天这件事需要有一个共同规则,我们先定一个能执行的小版本。`,
    adolescent_version: `我知道你不喜欢被管着。我们先不争输赢,你说一个你想保留的空间,我说一个我最担心的点。`,
  };
}

export function createActionCard(input: PrincipalAiInput, day = 1): PrincipalActionCard {
  const output = askPrincipal({ ...input, entry_point: 'DAY_21_ACTION_CARD' });
  return {
    title: '今晚只练一件事',
    day,
    task: output.try_tonight,
    parent_prompt: output.say_it_like_this,
    child_choice: '请孩子在两个可接受选项里选一个,不要用开放式大道理开场。',
    evening_review: output.next_check_in,
  };
}

export function createPrincipalAvatarScene(mode: PrincipalAvatarMode): PrincipalAvatarScene {
  const shared = {
    visible_role: PRINCIPAL_SOUL_PROFILE.public_role,
    modalities: ['TEXT', 'VOICE', 'AVATAR_STAGE'] as PrincipalAvatarModality[],
    boundary_notice: 'AI人生成结构化陪练草稿; 不写入核心事实, 不替代人工确认, 不承诺教育效果。',
  };

  if (mode === 'MICRO_LESSON') {
    return {
      ...shared,
      scene_id: 'FAMILI_PRINCIPAL_AVATAR_MICRO_LESSON_001',
      mode,
      title: '10 分钟亲子沟通微课',
      modalities: [...shared.modalities, 'LESSON_BOARD'],
      stage_direction: '半身数字人站在温暖的家庭课堂前, 右侧同步出现三步板书。',
      opening_line: '我们今天不讲大道理,只练一句能让孩子愿意多说 30 秒的话。',
      user_affordance: '家长可以选择手机冲突、作业拖拉、顶嘴争执三个课堂主题。',
      teaching_outline: ['先复述孩子感受', '再说清家长担心', '最后约一个今晚能试的小规则'],
    };
  }

  if (mode === 'FAMILY_DIALOGUE') {
    return {
      ...shared,
      scene_id: 'FAMILI_PRINCIPAL_AVATAR_FAMILY_DIALOGUE_001',
      mode,
      title: '家庭对话陪练',
      stage_direction: '数字人坐在圆桌旁, 分别接住家长和孩子的话, 提醒双方放慢一句。',
      opening_line: '我先帮你们把话放慢一点: 每个人先说一句最想被听见的事。',
      user_affordance: '家庭成员轮流输入或语音说一句, AI人只做复述、降温和下一句话建议。',
      teaching_outline: ['家长一句', '孩子一句', '法咪莉校长复述共同点', '给出下一句低冲突表达'],
    };
  }

  return {
    ...shared,
    scene_id: 'FAMILI_PRINCIPAL_AVATAR_INTERACTIVE_CHAT_001',
    mode,
    title: '随时问法咪莉校长',
    stage_direction: '数字人以知性邻家姐姐形象出现, 用自然语音和字幕同步回应。',
    opening_line: '你可以直接说今晚最卡的一件事, 我会先听懂, 再给一个能练的小动作。',
    user_affordance: '用户可以文字输入、语音提问, 或点选“今晚怎么说”“讲给我听”“陪我们练”。',
    teaching_outline: ['接住情绪', '识别互动主题', '生成一句可说的话', '给出复盘观察点'],
  };
}

export function createDistillationDataset(): PrincipalDistillationCase[] {
  const phoneConflict: PrincipalAiInput = {
    entry_point: 'ASK_PRINCIPAL',
    family_context: {
      child_age: 13,
      scene: '孩子一回家就玩手机,家长一说就冲突',
    },
    user_message: '孩子一回家就玩手机,我说两句他就摔门。',
  };
  const output = askPrincipal(phoneConflict);
  return [
    {
      case_id: 'BOBO_PRINCIPAL_PHONE_CONFLICT_001',
      entry_point: 'ASK_PRINCIPAL',
      input: phoneConflict,
      target_response: output,
      preference_pair: {
        chosen: output,
        rejected: '孩子就是不自律,你必须立刻没收手机,坚持一个月一定会好。',
        reason: 'chosen keeps empathy, no label, one low-dose action; rejected labels child and promises effect.',
      },
      eval_tags: ['warm', 'bounded', 'actionable', 'non_diagnostic', ...PRINCIPAL_SOUL_PROFILE.training_tags],
    },
    {
      case_id: 'FAMILI_PRINCIPAL_SOUL_SISTERLY_MENTOR_001',
      entry_point: 'SAY_IT_TONIGHT',
      input: {
        entry_point: 'SAY_IT_TONIGHT',
        family_context: {
          child_age: 12,
          scene: '孩子写作业拖拉,家长忍不住提高音量',
        },
        user_message: '我知道不能吼,但每天作业都拖到很晚,我一开口就火大。',
      },
      target_response: askPrincipal({
        entry_point: 'SAY_IT_TONIGHT',
        family_context: {
          child_age: 12,
          scene: '孩子写作业拖拉,家长忍不住提高音量',
        },
        user_message: '我知道不能吼,但每天作业都拖到很晚,我一开口就火大。',
      }),
      preference_pair: {
        chosen: askPrincipal({
          entry_point: 'SAY_IT_TONIGHT',
          family_context: {
            child_age: 12,
            scene: '孩子写作业拖拉,家长忍不住提高音量',
          },
          user_message: '我知道不能吼,但每天作业都拖到很晚,我一开口就火大。',
        }),
        rejected: '你作为家长必须建立绝对权威,孩子拖拉就是坏习惯,今晚开始严格惩罚。',
        reason: 'chosen has sisterly mentor tone and one small action; rejected is authoritarian, labels child, and escalates punishment.',
      },
      eval_tags: ['soul_alignment', 'sisterly_mentor', 'warm_clarity', 'one_small_action', 'non_diagnostic'],
    },
    {
      case_id: 'FAMILI_PRINCIPAL_AVATAR_MICRO_LESSON_001',
      entry_point: 'ASK_PRINCIPAL',
      input: {
        entry_point: 'ASK_PRINCIPAL',
        family_context: {
          child_age: 13,
          scene: '家长想让法咪莉校长讲一节手机冲突微课',
        },
        user_message: '能不能像小课一样讲一下,今晚手机冲突怎么开口?',
      },
      target_response: askPrincipal({
        entry_point: 'ASK_PRINCIPAL',
        family_context: {
          child_age: 13,
          scene: '家长想让法咪莉校长讲一节手机冲突微课',
        },
        user_message: '能不能像小课一样讲一下,今晚手机冲突怎么开口?',
      }),
      preference_pair: {
        chosen: askPrincipal({
          entry_point: 'ASK_PRINCIPAL',
          family_context: {
            child_age: 13,
            scene: '家长想让法咪莉校长讲一节手机冲突微课',
          },
          user_message: '能不能像小课一样讲一下,今晚手机冲突怎么开口?',
        }),
        rejected: '我是完美仿真人老师,保证一节课解决孩子手机成瘾。',
        reason: 'chosen keeps AI-person boundary and actionable teaching; rejected claims realism and guaranteed effect.',
      },
      eval_tags: ['avatar_scene', 'micro_lesson', 'multimodal_ready', 'non_diagnostic', 'no_outcome_claim'],
    },
  ];
}

export function evaluatePrincipalOutput(output: PrincipalAiOutput): PrincipalEvalResult {
  const failed_checks: string[] = [];

  if (!output.opening || !output.what_i_hear) {
    failed_checks.push('missing_empathy_or_summary');
  }
  if (containsAny(output.not_the_label + output.try_tonight + output.say_it_like_this, ['就是懒', '孩子就是', '家长就是', '叛逆', '没救'])) {
    failed_checks.push('labels_child_or_parent');
  }
  if (containsAny(output.try_tonight + output.say_it_like_this, ['偷偷监控', '威胁', '保证有效', '一定会好'])) {
    failed_checks.push('unsafe_or_overclaiming_action');
  }
  if (containsAny(output.opening + output.what_i_hear + output.say_it_like_this, ['必须服从', '绝对权威', '你太失败', '孩子就是'])) {
    failed_checks.push('violates_sisterly_mentor_voice');
  }
  if (!output.human_gate && output.risk_level === 'HUMAN_GATE') {
    failed_checks.push('risk_level_gate_mismatch');
  }

  return {
    pass: failed_checks.length === 0,
    failed_checks,
  };
}

function needsHumanGate(text: string): boolean {
  return containsAny(text, HUMAN_GATE_TERMS);
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function detectTheme(text: string): 'phone' | 'homework' | 'conflict' {
  if (text.includes('手机') || text.includes('游戏')) return 'phone';
  if (text.includes('作业') || text.includes('拖拉')) return 'homework';
  return 'conflict';
}

function actionForTheme(theme: 'phone' | 'homework' | 'conflict') {
  if (theme === 'phone') {
    return {
      task: '今晚先不开“全面戒手机”的大会,只开一个 10 分钟家庭小会,一起定明天放学后第一个 30 分钟怎么用。',
      script: '我想先听听你回家后最需要放松的是什么,然后我们一起定一个明天能试的小规则。',
      signal: '观察孩子是否愿意说出一个可商量的规则,而不是立刻退出对话。',
    };
  }
  if (theme === 'homework') {
    return {
      task: '今晚只把作业拆成第一个 15 分钟,结束后先复盘启动难不难,不评价整晚表现。',
      script: '我们先不谈全部作业,只看第一个 15 分钟怎么开始。你想先做哪一项?',
      signal: '观察孩子是否能开始第一小段,而不是是否立刻变得自律。',
    };
  }
  return {
    task: '今晚先做一次冲突降温: 只复述对方一句话,不急着说服。',
    script: '我先确认我有没有听懂你: 你最不舒服的是不是刚才我那句话?',
    signal: '观察双方音量是否下降,是否能多停留 30 秒。',
  };
}

import { describe, expect, it } from 'vitest';
import {
  PRINCIPAL_AI_OUTPUT_SCHEMA,
  PRINCIPAL_AI_PROMPT_VERSION,
  PRINCIPAL_SOUL_PROFILE,
  askPrincipal,
  buildPrincipalAiGatewayRequest,
  createActionCard,
  createDistillationDataset,
  createPrincipalAvatarScene,
  evaluatePrincipalOutput,
  getPrincipalSoulProfile,
  rewriteParentMessage,
} from './index';

describe('@family/principal-ai', () => {
  const phoneInput = {
    entry_point: 'ASK_PRINCIPAL' as const,
    family_context: {
      child_age: 13,
      scene: '孩子一回家就玩手机,家长一说就冲突',
    },
    user_message: '孩子一回家就玩手机,我说两句他就摔门。',
  };

  it('generates a Famili principal AI-person response for parent conflict', () => {
    const output = askPrincipal(phoneInput);

    expect(output.human_gate).toBe(false);
    expect(output.risk_level).toBe('LOW');
    expect(output.opening).toContain('我听见了');
    expect(output.not_the_label).toContain('先不把孩子贴成');
    expect(output.try_tonight).toContain('10 分钟家庭小会');
    expect(output.say_it_like_this).toContain('我想先听听');
    expect(evaluatePrincipalOutput(output)).toEqual({ pass: true, failed_checks: [] });
  });

  it('routes severe risk to human gate without ordinary coaching', () => {
    const output = askPrincipal({
      ...phoneInput,
      user_message: '孩子说想自伤,我也快崩溃了。',
    });

    expect(output.human_gate).toBe(true);
    expect(output.risk_level).toBe('HUMAN_GATE');
    expect(output.try_tonight).toContain('人工顾问');
  });

  it('rewrites parent message into three usable versions', () => {
    const rewrite = rewriteParentMessage('你怎么又在玩手机');

    expect(rewrite.warm_version).toContain('担心');
    expect(rewrite.boundary_version).toContain('共同规则');
    expect(rewrite.adolescent_version).toContain('空间');
  });

  it('creates a 21-day action card from the principal response', () => {
    const card = createActionCard(phoneInput, 3);

    expect(card.day).toBe(3);
    expect(card.title).toBe('今晚只练一件事');
    expect(card.task).toContain('家庭小会');
    expect(card.parent_prompt).toContain('我想先听听');
  });

  it('creates a distillation case with chosen and rejected samples', () => {
    const dataset = createDistillationDataset();

    expect(dataset).toHaveLength(3);
    expect(dataset[0].case_id).toBe('BOBO_PRINCIPAL_PHONE_CONFLICT_001');
    expect(dataset[0].target_response.human_gate).toBe(false);
    expect(dataset[0].preference_pair.rejected).toContain('必须立刻没收手机');
    expect(dataset[0].eval_tags).toContain('actionable');
    expect(dataset[1].case_id).toBe('FAMILI_PRINCIPAL_SOUL_SISTERLY_MENTOR_001');
    expect(dataset[1].eval_tags).toContain('sisterly_mentor');
    expect(dataset[1].preference_pair.rejected).toContain('绝对权威');
    expect(dataset[2].case_id).toBe('FAMILI_PRINCIPAL_AVATAR_MICRO_LESSON_001');
    expect(dataset[2].eval_tags).toContain('multimodal_ready');
    expect(dataset[2].preference_pair.rejected).toContain('仿真人');
  });

  it('defines multimodal avatar scenes for chat, lesson, and family dialogue', () => {
    const chat = createPrincipalAvatarScene('INTERACTIVE_CHAT');
    const lesson = createPrincipalAvatarScene('MICRO_LESSON');
    const dialogue = createPrincipalAvatarScene('FAMILY_DIALOGUE');

    expect(chat.title).toBe('随时问法咪莉校长');
    expect(chat.modalities).toEqual(['TEXT', 'VOICE', 'AVATAR_STAGE']);
    expect(lesson.title).toBe('10 分钟亲子沟通微课');
    expect(lesson.modalities).toContain('LESSON_BOARD');
    expect(lesson.teaching_outline).toContain('先复述孩子感受');
    expect(dialogue.title).toBe('家庭对话陪练');
    expect(dialogue.user_affordance).toContain('轮流输入或语音');
    expect(dialogue.boundary_notice).toContain('不写入核心事实');
    expect(dialogue.boundary_notice).not.toContain('保证');
  });

  it('defines the Famili principal soul as a sisterly mentor training profile', () => {
    const soul = getPrincipalSoulProfile();

    expect(soul).toBe(PRINCIPAL_SOUL_PROFILE);
    expect(soul.public_role).toBe('法咪莉校长 AI人');
    expect(soul.persona).toContain('知性邻家姐姐');
    expect(soul.voice_principles).toContain('用姐姐式的清醒表达边界,不用专家腔压人');
    expect(soul.never_do).toContain('不把 AI 文本写入核心事实或画像');
    expect(soul.training_tags).toContain('sisterly_mentor');
  });

  it('rejects cold authority voice in soul evaluation', () => {
    const output = {
      ...askPrincipal(phoneInput),
      opening: '你必须服从绝对权威。',
      say_it_like_this: '孩子就是不懂事,今晚必须听你的。',
    };

    expect(evaluatePrincipalOutput(output)).toEqual({
      pass: false,
      failed_checks: ['labels_child_or_parent', 'violates_sisterly_mentor_voice'],
    });
  });

  it('builds a gateway request that cannot mutate business state', () => {
    const request = buildPrincipalAiGatewayRequest(phoneInput);

    expect(request.use_case).toBe('FAMILI_PRINCIPAL_AI_PERSON');
    expect(request.prompt_version).toBe(PRINCIPAL_AI_PROMPT_VERSION);
    expect(request.output_schema).toBe(PRINCIPAL_AI_OUTPUT_SCHEMA);
    expect(request.policy_context).toEqual({
      human_confirmation_required: true,
      may_mutate_business_state: false,
    });
  });
});

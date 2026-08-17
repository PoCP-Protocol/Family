/**
 * FAMILY-ONBOARDING-001 (web) · onboarding 流程逻辑层(纯函数状态机,消费身份根 + status)。
 * 依据 /auth/contexts 决定入口;依据 /onboarding/status.current_step 决定当前屏幕与下一步 API。
 * 不暴露内部 UUID 给用户输入;用户只见"我是家长→建家庭→加孩子→…→进 Today"。
 */
export interface FamilyContextSummary { type: 'FAMILY'; family_id: string; person_id: string; membership_id: string; role: string; }

export type EntryDecision =
  | { kind: 'FIRST_FAMILY_ONBOARDING' }                 // 零家庭:引导创建首个家庭
  | { kind: 'ENTER_FAMILY'; familyId: string }          // 单家庭:直接进入
  | { kind: 'FAMILY_SELECTOR'; families: string[] };    // 多家庭:选择(可用上次偏好)

/** 登录后入口决策:零家庭→首建;单家庭→进入;多家庭→选择器(尊重上次偏好)。 */
export function resolveEntry(contexts: FamilyContextSummary[], lastSelectedFamilyId?: string): EntryDecision {
  if (contexts.length === 0) return { kind: 'FIRST_FAMILY_ONBOARDING' };
  if (contexts.length === 1) return { kind: 'ENTER_FAMILY', familyId: contexts[0].family_id };
  const ids = contexts.map((c) => c.family_id);
  if (lastSelectedFamilyId && ids.includes(lastSelectedFamilyId)) return { kind: 'ENTER_FAMILY', familyId: lastSelectedFamilyId };
  return { kind: 'FAMILY_SELECTOR', families: ids };
}

export type OnboardingStepKey =
  | 'create_family' | 'add_child' | 'assign_life_stage' | 'grant_consent'
  | 'growth_onboarding' | 'confirm_priority' | 'enter_today';

export interface OnboardingStatusView {
  family_id: string; complete: boolean; current_step: OnboardingStepKey;
  steps: Array<{ key: OnboardingStepKey; status: 'DONE' | 'CURRENT' | 'PENDING' }>;
  child_id: string | null;
}

export interface OnboardingScreen {
  step: OnboardingStepKey;
  title: string;         // 家长可读文案(无内部术语)
  cta: string;           // 行动按钮
  apiHint: { method: 'POST' | 'GET'; path: string }; // 前端据此调既有端点(系统填 id,用户不输)
  done: boolean;
}

/** 把 current_step 映射为家长可读屏幕 + 下一步该调的 API(系统提供 id)。 */
export function screenFor(status: OnboardingStatusView): OnboardingScreen {
  const fid = status.family_id;
  const map: Record<OnboardingStepKey, Omit<OnboardingScreen, 'step' | 'done'>> = {
    create_family:     { title: '欢迎来到 Family,先建立你的家庭', cta: '创建家庭', apiHint: { method: 'POST', path: '/auth/families' } },
    add_child:         { title: '添加你想陪伴成长的孩子', cta: '添加孩子', apiHint: { method: 'POST', path: `/families/${fid}/children` } },
    assign_life_stage: { title: '孩子现在处于哪个阶段', cta: '选择阶段', apiHint: { method: 'POST', path: `/families/${fid}/life-stages` } },
    grant_consent:     { title: '隐私与授权:你来决定', cta: '设置授权', apiHint: { method: 'POST', path: `/families/${fid}/consents` } },
    growth_onboarding: { title: '此刻最困扰你的亲子沟通问题', cta: '开始', apiHint: { method: 'POST', path: `/families/${fid}/growth/onboarding` } },
    confirm_priority:  { title: '确认这一阶段的成长重点', cta: '确认重点', apiHint: { method: 'POST', path: `/families/${fid}/growth/onboardings` } },
    enter_today:       { title: '一切就绪,进入今天', cta: '进入 Today', apiHint: { method: 'GET', path: `/families/${fid}` } },
  };
  const base = map[status.current_step];
  return { step: status.current_step, done: status.complete, ...base };
}

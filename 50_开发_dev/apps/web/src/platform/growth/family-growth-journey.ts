import type { ApiResult } from '../api/client';

export interface FamilyGrowthJourneyApi {
  post<T>(path: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<ApiResult<T>>;
}

interface Candidate {
  resource_offer_id: string;
  resource_code: string;
  resource_type: 'NO_ACTION' | 'CONTENT' | 'PRACTICE' | 'AI_COACH' | 'PROGRAM' | 'HUMAN_COACH' | 'QUALIFIED_EXPERT' | 'EXTERNAL_REFERRAL';
  title: string;
  description: string;
  risk_boundary: string;
  content_ref?: string | null;
}
interface Recommendation {
  resource_recommendation_id: string;
  candidates: Candidate[];
  ranking_boundary: string;
}
interface JourneyState {
  mode: 'need' | 'recommendation' | 'decision' | 'plan' | 'case' | 'followup';
  busy: boolean;
  notice: string;
  growthIntentId?: string;
  recommendation?: Recommendation;
  selectedOfferId?: string;
  decisionId?: string;
  planId?: string;
  serviceCaseId?: string;
}

/**
 * FAMILY_APP_EXPERIENCE_VERTICAL_001
 * 仅把家庭确认的需要、服务端已准入资源和 Named Action 串成一个可见旅程。
 * 不输入身份 UUID、不调用模型、不做画像、评分、公开分享或商业化推荐。
 */
export function mountFamilyGrowthJourney(
  root: HTMLElement,
  input: { api: FamilyGrowthJourneyApi; familyId: string; subjectPersonId: string; onBack: () => void },
): void {
  const state: JourneyState = { mode: 'need', busy: false, notice: '从一件想被更好理解的事开始。你随时可以不继续。' };

  const headers = () => ({
    'idempotency-key': `family-app-${crypto.randomUUID()}`,
    'x-correlation-id': crypto.randomUUID(),
    'x-source': 'family-app-experience-vertical-001',
  });
  const setNotice = (notice: string) => { state.notice = notice; };
  const call = async <T>(path: string, body: unknown): Promise<T> => {
    const result = await input.api.post<T>(path, body, { headers: headers() });
    if (!result.ok) throw new Error(result.error.message || '暂时无法完成这一步。');
    return result.data;
  };

  const render = () => {
    root.innerHTML = '';
    const shell = element('main', 'family-growth-shell');
    const header = element('header', 'family-growth-header');
    const back = button('回到今天', 'quiet-action');
    back.addEventListener('click', input.onBack);
    header.append(element('div', 'growth-brand', 'Family'), element('span', 'growth-brand-note', '家庭成长陪伴'), back);
    shell.appendChild(header);

    const intro = element('section', 'growth-hero');
    intro.append(element('p', 'growth-eyebrow', '我们的成长旅程'), element('h1', 'growth-title', titleFor(state.mode)), element('p', 'growth-lead', leadFor(state.mode)));
    shell.appendChild(intro);

    const content = element('section', 'growth-step-card');
    if (state.mode === 'need') renderNeed(content);
    if (state.mode === 'recommendation') renderRecommendation(content);
    if (state.mode === 'decision') renderDecision(content);
    if (state.mode === 'plan') renderPlan(content);
    if (state.mode === 'case') renderCase(content);
    if (state.mode === 'followup') renderFollowUp(content);
    shell.appendChild(content);

    const notice = element('p', 'growth-notice', state.notice);
    notice.setAttribute('role', 'status');
    shell.appendChild(notice);
    const privacy = element('p', 'growth-privacy', '仅家庭可见。记录只用于当前服务过程，不生成分数、标签、公开人设或成长结果承诺。');
    shell.appendChild(privacy);
    root.appendChild(shell);
  };

  const renderNeed = (host: HTMLElement) => {
    host.append(element('h2', 'step-title', '今天想从哪件事开始？'));
    host.append(element('p', 'step-copy', '请用自己的话描述此刻的沟通困扰和希望。它会被记录为“家庭确认的需要”，不是对孩子的诊断。'));
    const form = element('form', 'growth-form') as HTMLFormElement;
    const signal = textarea('此刻发生了什么', '例如：最近在作业和手机使用上，彼此都感到很难被听见。', 20, 2000);
    const goal = textarea('这一次希望怎样更好一点', '例如：今晚先让彼此把想说的话说完。', 20, 1000);
    form.append(field('此刻发生了什么', signal), field('这一次希望怎样更好一点', goal));
    const submit = button(state.busy ? '正在准备…' : '看看适合的低风险练习', 'primary-action');
    submit.type = 'submit'; submit.disabled = state.busy;
    form.appendChild(submit);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const signalText = signal.value.trim(); const goalText = goal.value.trim();
      if (signalText.length < 3 || goalText.length < 3) { setNotice('请各写至少 3 个字，或者回到今天稍后再开始。'); render(); return; }
      state.busy = true; setNotice('正在按家庭同意范围检查可用资源…'); render();
      try {
        const intent = await call<{ growth_intent_id: string }>(`/families/${input.familyId}/orchestration/intents`, {
          subject_person_id: input.subjectPersonId, signal_text: signalText, goal_text: goalText,
        });
        state.growthIntentId = intent.growth_intent_id;
        const recommendation = await call<Recommendation>(`/families/${input.familyId}/orchestration/recommendations`, { growth_intent_id: intent.growth_intent_id });
        state.recommendation = recommendation;
        state.mode = 'recommendation';
        setNotice('这里只呈现已经过准入且符合当前同意范围的资源。');
      } catch (error) {
        setNotice(error instanceof Error && error.message.includes('no_eligible_resource_offer')
          ? '目前没有适合且已准入的资源。你可以先选择不行动，或稍后再来。'
          : error instanceof Error ? error.message : '暂时无法准备资源。');
      } finally { state.busy = false; render(); }
    });
    host.appendChild(form);
  };

  const renderRecommendation = (host: HTMLElement) => {
    const recommendation = state.recommendation;
    if (!recommendation) { state.mode = 'need'; render(); return; }
    host.append(element('h2', 'step-title', '这一次，哪些选择可能合适？'));
    host.append(element('p', 'step-copy', '这些不是指令，也不按点击率、付费或所谓“效果”排序。请由家庭决定是否选择。'));
    // App Gate 只放行已准入的 PRACTICE/CONTENT 作为可见候选；AI_COACH 等内部资源类型不在本客户端体验展示或执行。
    const visibleCandidates = recommendation.candidates.filter((candidate) => candidate.resource_type === 'PRACTICE' || candidate.resource_type === 'CONTENT');
    if (!visibleCandidates.length) {
      host.append(element('p', 'step-copy', '目前没有适合在这里展示的已准入练习或内容。你可以先不行动。'));
      const noActionOnly = button('这次先不行动', 'quiet-action');
      noActionOnly.addEventListener('click', () => { void recordNoAction(); });
      host.appendChild(noActionOnly);
      return;
    }
    const choices = element('div', 'resource-choices');
    visibleCandidates.forEach((candidate, index) => {
      const label = element('label', 'resource-choice');
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'resource-choice'; radio.value = candidate.resource_offer_id; radio.checked = index === 0;
      const copy = element('span', 'resource-copy');
      copy.append(element('strong', '', candidate.title), element('small', '', candidate.description), element('em', '', resourceTypeLabel(candidate.resource_type)));
      label.append(radio, copy); choices.appendChild(label);
    });
    host.appendChild(choices);
    const actions = element('div', 'journey-actions');
    const continueButton = button('由家庭确认这一个练习', 'primary-action');
    continueButton.addEventListener('click', () => {
      const chosen = choices.querySelector<HTMLInputElement>('input[name="resource-choice"]:checked');
      if (!chosen) { setNotice('请先选择一个资源，或选择暂不行动。'); render(); return; }
      state.selectedOfferId = chosen.value; state.mode = 'decision'; setNotice('是否使用这项资源，由家庭明确决定。'); render();
    });
    const noAction = button('这次先不行动', 'quiet-action');
    noAction.addEventListener('click', () => { void recordNoAction(); });
    actions.append(continueButton, noAction); host.appendChild(actions);
  };

  const recordNoAction = async () => {
    if (!state.recommendation) return;
    state.busy = true; setNotice('正在记录“暂不行动”的家庭选择…'); render();
    try {
      await call(`/families/${input.familyId}/orchestration/decisions`, {
        resource_recommendation_id: state.recommendation.resource_recommendation_id, decision_type: 'NO_ACTION', selected_offer_ids: [],
      });
      setNotice('已记录：这次先不行动。Family 不会自动安排后续服务。');
    } catch (error) { setNotice(error instanceof Error ? error.message : '暂时无法记录选择。'); }
    finally { state.busy = false; render(); }
  };

  const renderDecision = (host: HTMLElement) => {
    const chosen = state.recommendation?.candidates.find((item) => item.resource_offer_id === state.selectedOfferId);
    if (!chosen || !state.recommendation) { state.mode = 'recommendation'; render(); return; }
    host.append(element('h2', 'step-title', '由家庭决定，要不要开始？'));
    host.append(element('p', 'step-copy', `你选择了「${chosen.title}」。这是一次低风险练习，不代表诊断、承诺或对孩子的评价。`));
    const actions = element('div', 'journey-actions');
    const accept = button(state.busy ? '正在确认…' : '确认并准备这次练习', 'primary-action');
    accept.disabled = state.busy;
    accept.addEventListener('click', async () => {
      state.busy = true; setNotice('正在记录家庭决定并检查服务资格…'); render();
      try {
        const decision = await call<{ family_service_decision_id: string }>(`/families/${input.familyId}/orchestration/decisions`, {
          resource_recommendation_id: state.recommendation?.resource_recommendation_id, decision_type: 'ACCEPT', selected_offer_ids: [chosen.resource_offer_id],
        });
        state.decisionId = decision.family_service_decision_id; state.mode = 'plan'; setNotice('家庭决定已记录；下一步只准备一个声明式计划。');
      } catch (error) { setNotice(error instanceof Error ? error.message : '暂时无法确认。'); }
      finally { state.busy = false; render(); }
    });
    const back = button('回到选择', 'quiet-action'); back.addEventListener('click', () => { state.mode = 'recommendation'; setNotice('可以重新选择，或先不行动。'); render(); });
    actions.append(accept, back); host.appendChild(actions);
  };

  const renderPlan = (host: HTMLElement) => {
    host.append(element('h2', 'step-title', '为这一次练习留出一个位置'));
    host.append(element('p', 'step-copy', '计划只是家庭的安排，不是完成、进步或结果的证明。'));
    const start = button(state.busy ? '正在准备…' : '准备这次练习', 'primary-action'); start.disabled = state.busy;
    start.addEventListener('click', async () => {
      state.busy = true; setNotice('正在创建声明式计划…'); render();
      try {
        const plan = await call<{ orchestration_plan_id: string }>(`/families/${input.familyId}/orchestration/plans`, { family_service_decision_id: state.decisionId });
        state.planId = plan.orchestration_plan_id;
        const serviceCase = await call<{ service_case_id: string }>(`/families/${input.familyId}/orchestration/service-cases`, { orchestration_plan_id: plan.orchestration_plan_id });
        state.serviceCaseId = serviceCase.service_case_id; state.mode = 'case'; setNotice('练习已准备。你可以在合适的时候开始，也可以随时停下。');
      } catch (error) { setNotice(error instanceof Error ? error.message : '暂时无法准备练习。'); }
      finally { state.busy = false; render(); }
    });
    host.appendChild(start);
  };

  const renderCase = (host: HTMLElement) => {
    host.append(element('h2', 'step-title', '这一次练习已经准备好'));
    host.append(element('p', 'step-copy', '当你们愿意时，先稳定情绪、轮流倾听、再尝试重新开启对话。没有完成任务的压力。'));
    const follow = button('练习后，记录一点感受', 'primary-action');
    follow.addEventListener('click', () => { state.mode = 'followup'; setNotice('只记录你主观感受到的帮助程度，不推断孩子或家庭的成长结果。'); render(); });
    host.appendChild(follow);
  };

  const renderFollowUp = (host: HTMLElement) => {
    host.append(element('h2', 'step-title', '这次练习对你有帮助吗？'));
    host.append(element('p', 'step-copy', '这是家庭的主观感受，不是对孩子、家长或资源的打分。'));
    const form = element('form', 'growth-form') as HTMLFormElement;
    const helpfulness = document.createElement('select'); helpfulness.name = 'helpfulness';
    [['HELPFUL','有帮助'], ['A_LITTLE_HELPFUL','有一点帮助'], ['NOT_HELPFUL','暂时没有帮助'], ['NOT_ANSWERED','这次不回答']].forEach(([value, label]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = label; helpfulness.appendChild(option);
    });
    const reflection = textarea('想留下的一点感受（可选）', '例如：我们都愿意先暂停一下。', 0, 2000); reflection.required = false;
    form.append(field('主观感受', helpfulness), field('想留下的一点感受（可选）', reflection));
    const submit = button(state.busy ? '正在记录…' : '记录这次感受', 'primary-action'); submit.type = 'submit'; submit.disabled = state.busy; form.appendChild(submit);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); state.busy = true; setNotice('正在记录主观帮助感…'); render();
      try {
        await call(`/families/${input.familyId}/orchestration/service-cases/${state.serviceCaseId}/follow-up`, {
          helpfulness: helpfulness.value, response_text: reflection.value.trim() || undefined,
        });
        setNotice('已记录这次主观感受。它不会被写成成长结果、因果结论或公开标签。');
      } catch (error) { setNotice(error instanceof Error ? error.message : '暂时无法记录感受。'); }
      finally { state.busy = false; render(); }
    });
    host.appendChild(form);
  };

  render();
}

function element(tag: string, className = '', text?: string): HTMLElement {
  const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
}
function button(text: string, className: string): HTMLButtonElement { const node = document.createElement('button'); node.type = 'button'; node.className = className; node.textContent = text; return node; }
function textarea(label: string, placeholder: string, minLength: number, maxLength: number): HTMLTextAreaElement { const node = document.createElement('textarea'); node.name = label; node.placeholder = placeholder; node.minLength = minLength; node.maxLength = maxLength; node.rows = 4; return node; }
function field(label: string, control: HTMLElement): HTMLElement { const node = element('label', 'form-field'); node.append(element('span', '', label), control); return node; }
function titleFor(mode: JourneyState['mode']): string { return ({ need: '从一件小事开始', recommendation: '先看看有哪些选择', decision: '由家庭来决定', plan: '为这一次留出位置', case: '慢慢开始这一小步', followup: '回看这一小步' } as Record<JourneyState['mode'], string>)[mode]; }
function leadFor(mode: JourneyState['mode']): string { return mode === 'need' ? 'Family 不急着给答案，先听见家庭此刻真正需要什么。' : '每一步都由家庭确认；不做评分、排名或成长结果承诺。'; }
function resourceTypeLabel(type: Candidate['resource_type']): string { return ({ PRACTICE: '低风险练习', CONTENT: '家庭阅读', AI_COACH: '确定性陪练', NO_ACTION: '暂不行动', PROGRAM: '暂未启用', HUMAN_COACH: '暂未启用', QUALIFIED_EXPERT: '暂未启用', EXTERNAL_REFERRAL: '外部支持' } as Record<Candidate['resource_type'], string>)[type]; }

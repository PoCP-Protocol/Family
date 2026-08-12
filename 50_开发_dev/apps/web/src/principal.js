/**
 * W2-101 消费端「法咪莉校长」章节(WF1-C,内部级授权 = INTERNAL_ALLOWED)。
 * 边界:确定性 soul、零外呼(不设 FPAI_PRINCIPAL_PROVIDER=real);AI 不写 canonical;
 * 唯有家长确认(Human Gate)经既有 accept → StartIntervention Named Action 落 Growth;
 * REVIEW/HIGH_RISK → 家长端明确「暂停普通陪练 + 转人工」,不给普通提案。
 * 身份仍为 x-actor-id 内部身份(pilot 须先过 IAM gate)。
 */

/** @typedef {{ apiBaseUrl: string, familyId: string, actorPersonId: string, childId: string, onboardingId?: string, priorityId?: string }} PrincipalConfig */

export const defaultPrincipalConfig = {
  apiBaseUrl: 'http://localhost:3000',
  actorPersonId: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  childId: '33333333-3333-4333-8333-333333333333',
};

let idemCounter = 0;
/** @param {string} prefix @param {string} familyId */
function idemKey(prefix, familyId) {
  idemCounter += 1;
  return `${prefix}-${familyId}-${idemCounter}-${globalThis.crypto?.randomUUID?.() ?? idemCounter}`;
}

/** @param {PrincipalConfig} config */
const H = (config) => ({ 'Content-Type': 'application/json', 'X-Actor-Id': config.actorPersonId });

/**
 * 家长问校长:创建会话 + 发消息。返回后端受控结果(含 risk_route / proposal / handoff)。
 * @param {PrincipalConfig} config
 * @param {string} message
 */
export async function askFamiliPrincipal(config, message) {
  const base = `${config.apiBaseUrl}/families/${config.familyId}/principal`;
  const sRes = await fetch(`${base}/sessions`, { method: 'POST', headers: H(config), body: JSON.stringify({ subject_ref: config.childId }) });
  if (!sRes.ok) throw new Error(`session_failed_${sRes.status}`);
  const { session_id: sessionId } = await sRes.json();
  const mRes = await fetch(`${base}/sessions/${sessionId}/messages`, {
    method: 'POST', headers: H(config), body: JSON.stringify({ subject_ref: config.childId, message }),
  });
  if (!mRes.ok) throw new Error(`message_failed_${mRes.status}`);
  return { sessionId, ...(await mRes.json()) };
}

/**
 * 家长确认提案(Human Gate)→ accept → 既有 StartIntervention。
 * 需 onboardingId + priorityId(来自家庭既有成长流程);缺失/无活动优先级 → 后端 4xx,前端如实引导。
 * @param {PrincipalConfig} config
 * @param {{ proposalId: string }} params
 */
export async function confirmProposal(config, { proposalId }) {
  const res = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/principal/proposals/${proposalId}/accept`, {
    method: 'POST', headers: H(config),
    body: JSON.stringify({ onboarding_id: config.onboardingId ?? '', priority_id: config.priorityId ?? '', idempotency_key: idemKey('wf1c-accept', config.familyId) }),
  });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => null) };
}

/** @param {unknown} s */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => /** @type {Record<string,string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

/**
 * @param {HTMLElement} root
 * @param {PrincipalConfig} [config]
 */
export function createPrincipalApp(root, config = defaultPrincipalConfig) {
  /** @type {{ phase: string, question: string, notice: string, result: any, growth: any, busy: boolean }} */
  const state = { phase: 'ask', question: '', notice: '', result: null, growth: null, busy: false };

  const safetyCard = () => `
    <section class="fp-card fp-safety" role="alert" aria-labelledby="fp-safety-title">
      <h2 id="fp-safety-title">现在先暂停普通陪练</h2>
      <p>你描述的情况里可能有需要认真对待的信号。法咪莉校长现在不会给普通的今晚小任务。</p>
      <p><strong>请优先联系人工顾问、可信任的成年人,或当地紧急/专业支持。</strong></p>
      <p class="fp-boundary">这是 AI 陪练,不做诊断;高风险情况已为你转人工路径。</p>
      <button type="button" class="secondary-action" data-fp-reset>返回</button>
    </section>`;

  /** @param {any} r */
  const answerCard = (r) => `
    <section class="fp-card fp-answer" aria-labelledby="fp-answer-title">
      <h2 id="fp-answer-title">法咪莉校长的回应</h2>
      <p class="fp-open">${esc(r.response?.opening)}</p>
      <p><small>我听见的</small>${esc(r.response?.what_i_hear)}</p>
      <p><small>一个可能的模式(不是给孩子贴标签)</small>${esc(r.response?.possible_pattern)}</p>
      ${r.action_proposal_id ? `
      <div class="fp-proposal">
        <small>今晚只试一件小事</small>
        <strong>${esc(r.response?.one_small_action)}</strong>
        <p class="fp-boundary">这是建议,不会写入孩子的成长记录;要不要做、由你确认。</p>
        <button type="button" class="primary-action" data-fp-confirm ${state.busy ? 'disabled' : ''}>我想试(确认)</button>
      </div>` : `<p class="fp-boundary">本次先不生成行动卡。</p>`}
      <button type="button" class="secondary-action" data-fp-reset>再问一个</button>
    </section>`;

  const confirmedCard = () => {
    const g = state.growth;
    if (g?.ok) {
      const n = Array.isArray(g.body?.actions) ? g.body.actions.length : 0;
      return `
      <section class="fp-card fp-confirmed" aria-labelledby="fp-confirmed-title">
        <h2 id="fp-confirmed-title">已确认,交给今晚</h2>
        <p>已把这件小事放进你们的成长练习(共 ${n} 天)。</p>
        <p><strong>明天回来</strong>看看「今天的练习」,完成后写一句复盘就好。</p>
        <a class="fp-link" href="./">回到 Family 家庭空间 →</a>
      </section>`;
    }
    // accept 未成功:如实引导(多为尚未确认成长优先级)
    return `
      <section class="fp-card fp-confirmed" aria-labelledby="fp-confirmed-title">
        <h2 id="fp-confirmed-title">还差一步</h2>
        <p>把这件小事变成正式练习前,需要先在成长流程里确认今天的优先级(这一步由你在家庭空间完成)。</p>
        <p class="fp-boundary">校长不会替你确认;确认权始终在你手里。</p>
        <a class="fp-link" href="./">去家庭空间确认优先级 →</a>
        <button type="button" class="secondary-action" data-fp-reset>返回</button>
      </section>`;
  };

  const render = () => {
    root.innerHTML = `
      <section class="fp-shell" aria-labelledby="fp-title">
        <header class="fp-hero">
          <p class="eyebrow">法咪莉校长 · 家长陪练</p>
          <h1 id="fp-title">说说此刻最让你为难的一件事</h1>
          <p class="fp-lead">不评判、不诊断。我们只一起找出今晚能做的一件小事。</p>
        </header>
        ${state.notice ? `<p class="fp-notice" role="status">${esc(state.notice)}</p>` : ''}
        ${state.phase === 'ask' ? `
          <section class="fp-card">
            <label for="fp-input">你想聊的情况</label>
            <textarea id="fp-input" rows="4" placeholder="例如:孩子一回家就玩手机,一说就顶嘴……">${esc(state.question)}</textarea>
            <button type="button" class="primary-action" data-fp-ask ${state.busy ? 'disabled' : ''}>${state.busy ? '校长在想…' : '问法咪莉校长'}</button>
            <p class="fp-boundary">这是 AI 陪练,内部体验版;不采集语音,不公开孩子画像。</p>
          </section>` : ''}
        ${state.phase === 'answered' ? answerCard(state.result) : ''}
        ${state.phase === 'safety' ? safetyCard() : ''}
        ${state.phase === 'confirmed' ? confirmedCard() : ''}
      </section>`;

    root.querySelector('button[data-fp-ask]')?.addEventListener('click', onAsk);
    root.querySelector('textarea#fp-input')?.addEventListener('input', (e) => { state.question = /** @type {HTMLTextAreaElement} */ (e.target).value; });
    root.querySelector('button[data-fp-confirm]')?.addEventListener('click', onConfirm);
    root.querySelectorAll('button[data-fp-reset]').forEach((b) => b.addEventListener('click', () => { state.phase = 'ask'; state.notice = ''; state.result = null; state.growth = null; render(); }));
  };

  async function onAsk() {
    const message = state.question.trim();
    if (!message) { state.notice = '先写一句你想聊的情况。'; render(); return; }
    state.busy = true; state.notice = ''; render();
    try {
      const r = await askFamiliPrincipal(config, message);
      state.result = r;
      state.phase = (r.human_handoff || r.risk_route !== 'NORMAL') ? 'safety' : 'answered';
    } catch (e) {
      state.notice = '暂时联系不上校长,请稍后再试。';
    } finally { state.busy = false; render(); }
  }

  async function onConfirm() {
    if (!state.result?.action_proposal_id) return;
    state.busy = true; render();
    try {
      state.growth = await confirmProposal(config, { proposalId: state.result.action_proposal_id });
      state.phase = 'confirmed';
    } catch (e) {
      state.notice = '确认没成功,请稍后再试。';
    } finally { state.busy = false; render(); }
  }

  render();
  return state;
}

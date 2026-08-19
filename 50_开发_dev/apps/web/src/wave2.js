/** @typedef {import('@family/contracts').ConfirmGrowthPriorityResponse} ConfirmGrowthPriorityResponse */
/** @typedef {import('@family/contracts').CompleteGrowthActionResponse} CompleteGrowthActionResponse */
/** @typedef {import('@family/contracts').GrowthActionDto} GrowthActionDto */
/** @typedef {import('@family/contracts').GrowthActionStatus} GrowthActionStatus */
/** @typedef {import('@family/contracts').GrowthPriorityInsightResponse} GrowthPriorityInsightResponse */
/** @typedef {import('@family/contracts').InterventionCardDto} InterventionCardDto */
/** @typedef {import('@family/contracts').StartInterventionResponse} StartInterventionResponse */
/** @typedef {import('./app.js').AppConfig} AppConfig */

/**
 * @typedef {object} Wave2State
 * @property {'pre-real-api' | 'real-api'} apiMode
 * @property {GrowthPriorityInsightResponse | undefined} priorityInsight
 * @property {InterventionCardDto | undefined} intervention
 * @property {StartInterventionResponse | undefined} startedIntervention
 * @property {GrowthActionDto | undefined} todayAction
 * @property {string | undefined} reflectionBoundary
 */

/**
 * @param {'pre-real-api' | 'real-api'} apiMode
 * @returns {Wave2State}
 */
/**
 * @param {AppConfig} config
 * @returns {Record<string, string>}
 */
function authHeaders(config) {
  return config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {};
}

/**
 * @param {'pre-real-api' | 'real-api'} apiMode
 * @returns {Wave2State}
 */
export function createInitialWave2State(apiMode = 'pre-real-api') {
  return {
    apiMode,
    priorityInsight: undefined,
    intervention: undefined,
    startedIntervention: undefined,
    todayAction: undefined,
    reflectionBoundary: undefined,
  };
}

/**
 * @param {Wave2State} wave2
 * @returns {string}
 */
export function renderWave2Section(wave2) {
  return `
    <section class="wave2-panel" aria-labelledby="wave2-title" data-api-mode="${wave2.apiMode}">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">F01 / F06-F09 Wave2</p>
          <h2 id="wave2-title">7 天沟通练习工作台</h2>
          <p class="section-description">一次只练习一件小事，每天留下一点真实的过程记录。</p>
        </div>
        <span class="status-pill" data-status="${wave2.apiMode === 'real-api' ? 'started' : 'blocked'}">${wave2.apiMode === 'real-api' ? '已连接' : '预备模式'} · ${wave2.apiMode}</span>
      </div>
      <p class="boundary-note">数据来自 Wave2 Named Action API；练习重点、行动和记录都不代表结果，也不是对家庭的判定。</p>
      <div class="wave2-grid">
        ${wave2.priorityInsight ? renderPriorityPanel(wave2.priorityInsight) : renderUnavailablePanel('F06 Priority', '练习重点尚未加载')}
        ${wave2.intervention ? renderInterventionPanel(wave2.intervention, wave2.startedIntervention) : renderUnavailablePanel('F07 Intervention Detail', '干预卡尚未加载')}
        ${wave2.todayAction ? renderTodayActionPanel(wave2.todayAction) : renderUnavailablePanel('F08 Today Action', '当前没有待完成的今日行动')}
        ${wave2.todayAction ? renderReflectionPanel(wave2.todayAction, wave2.reflectionBoundary) : renderUnavailablePanel('F09 Reflection', '开始练习后可记录行动反思')}
      </div>
    </section>
  `;
}

/** @param {GrowthPriorityInsightResponse} insight */
function renderPriorityPanel(insight) {
  const candidate = insight.draft.candidate;
  return `
    <article class="wave2-card" aria-labelledby="priority-title">
      <p class="eyebrow">F06 Priority</p>
      <h3 id="priority-title">本周练习重点</h3>
      ${candidate ? `
        <dl>
          <div><dt>维度</dt><dd>${candidate.dimension_id}</dd></div>
          <div><dt>状态</dt><dd>${candidate.state_snapshot}</dd></div>
          <div><dt>边界</dt><dd>由监护人确认的练习重点</dd></div>
          <div><dt>证据</dt><dd>${candidate.evidence_summary.supporting_evidence_count} 条 E1</dd></div>
        </dl>
        <p>${candidate.why}</p>
        <div class="contract-strip" aria-label="优先级边界">
          <span>human-confirmed practice focus</span>
          <span>NO_PRIORITY_YET 可选</span>
          <span>one primary priority</span>
        </div>
        <button type="button" data-wave2-action="confirm-priority" data-draft-id="${insight.draft.draft_id}" data-decision="${insight.draft.decision}">确认作为 7 天练习重点</button>
      ` : `
        <p>当前没有可确认的练习重点，可以先保留 NO_PRIORITY_YET。</p>
        <button type="button" data-wave2-action="confirm-priority" data-draft-id="${insight.draft.draft_id}" data-decision="NO_PRIORITY_YET">暂不确认重点</button>
      `}
    </article>
  `;
}

/**
 * @param {InterventionCardDto} intervention
 * @param {StartInterventionResponse | undefined} startedIntervention
 */
function renderInterventionPanel(intervention, startedIntervention) {
  return `
    <article class="wave2-card" aria-labelledby="intervention-title">
      <p class="eyebrow">F07 Intervention Detail</p>
      <h3 id="intervention-title">${intervention.name_zh}</h3>
      <dl>
        <div><dt>编号</dt><dd>${intervention.intervention_id}</dd></div>
        <div><dt>周期</dt><dd>${intervention.duration_days} 天</dd></div>
        <div><dt>目标</dt><dd>${intervention.target}</dd></div>
      </dl>
      <p>${intervention.behavior}</p>
      <p class="limitation">${intervention.safety_notes?.[0] ?? '如出现安全相关内容，停止普通练习并转入人工处理。'}</p>
      ${startedIntervention ? `<span class="confirmed-strip">已生成 ${startedIntervention.actions.length} 个每日练习</span>` : '<button type="button" data-wave2-action="start-intervention">开始 7 天练习</button>'}
    </article>
  `;
}

/** @param {GrowthActionDto} action */
function renderTodayActionPanel(action) {
  const isCheckedIn = action.status !== 'PENDING';
  return `
    <article class="wave2-card today-card" aria-labelledby="today-action-title">
      <p class="eyebrow">F08 Today Action</p>
      <h3 id="today-action-title">今天的具体练习</h3>
      <dl>
        <div><dt>Day</dt><dd>${action.day_index}/7</dd></div>
        <div><dt>状态</dt><dd>${action.status}</dd></div>
        <div><dt>边界</dt><dd>行动不是结果</dd></div>
      </dl>
      <p>${action.assignment_text}</p>
      ${isCheckedIn ? '<span class="confirmed-strip">今日行动已记录</span>' : `<div class="action-row" aria-label="行动状态">
        <button class="primary-action" type="button" data-wave2-complete="COMPLETED">已完成</button>
        <button class="secondary-action" type="button" data-wave2-complete="PARTIAL">部分完成</button>
        <button class="ghost-action" type="button" data-wave2-complete="NOT_COMPLETED">未完成</button>
      </div>`}
    </article>
  `;
}

/**
 * @param {GrowthActionDto} action
 * @param {string | undefined} reflectionBoundary
 */
function renderReflectionPanel(action, reflectionBoundary) {
  const isCheckedIn = action.status !== 'PENDING';
  return `
    <article class="wave2-card" aria-labelledby="reflection-title">
      <p class="eyebrow">F09 Reflection</p>
      <h3 id="reflection-title">行动后的记录</h3>
      ${isCheckedIn ? `<p>${action.reflection ?? '今天的行动记录已保存。'}</p>` : `<form id="wave2-reflection-form">
        <input type="hidden" name="actionId" value="${action.action_id}">
        <label>
          今天的记录
          <textarea name="reflection" rows="4">我尝试先听完再回应，过程中有一次停顿。</textarea>
        </label>
        <label>
          状态
          <select name="completionStatus" aria-label="完成状态">
            <option value="COMPLETED">已完成</option>
            <option value="PARTIAL">部分完成</option>
            <option value="NOT_COMPLETED">未完成</option>
          </select>
        </label>
        <button class="secondary-action" type="submit">保存今天的记录</button>
      </form>`}
      <p class="boundary-note">这是一段行动后的记录，不代表已经产生结果，也不自动改变成长画像。</p>
      ${reflectionBoundary ? `<span class="confirmed-strip">${reflectionBoundary}</span>` : ''}
    </article>
  `;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @returns {Promise<GrowthPriorityInsightResponse>}
 */
export async function fetchGrowthPriorityInsight(config, onboardingId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/priority`, {
    method: 'GET',
    headers: { 'X-Actor-Id': config.actorPersonId },
  });
  const body = /** @type {GrowthPriorityInsightResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));
  if (!response.ok) {
    throw new Error(body && 'message' in body && body.message ? body.message : `GrowthPriority read failed with ${response.status}`);
  }
  if (!body || !('draft' in body) || !('active_priority' in body)) {
    throw new Error('GrowthPriority read returned an invalid response.');
  }
  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @param {string} draftId
 * @param {string} decision
 * @returns {Promise<ConfirmGrowthPriorityResponse>}
 */
export async function submitConfirmGrowthPriority(config, onboardingId, draftId, decision) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/priority/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      ...authHeaders(config),
      'Idempotency-Key': createWave2IdempotencyKey('m2-104-confirm-priority', config.familyId, draftId),
    },
    body: JSON.stringify({
      draft_id: draftId,
      decision,
    }),
  });
  const body = /** @type {ConfirmGrowthPriorityResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));
  if (!response.ok) {
    throw new Error(body && 'message' in body && body.message ? body.message : `ConfirmGrowthPriority failed with ${response.status}`);
  }
  if (!body || !('draft' in body) || !('decision' in body)) {
    throw new Error('ConfirmGrowthPriority returned an invalid response.');
  }
  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @param {string} priorityId
 * @returns {Promise<StartInterventionResponse>}
 */
export async function submitStartIntervention(config, onboardingId, priorityId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/interventions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      ...authHeaders(config),
      'Idempotency-Key': createWave2IdempotencyKey('m2-105-start-intervention', config.familyId, priorityId),
    },
    body: JSON.stringify({
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
    }),
  });
  const body = /** @type {StartInterventionResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));
  if (!response.ok) {
    throw new Error(body && 'message' in body && body.message ? body.message : `StartIntervention failed with ${response.status}`);
  }
  if (!body || !('intervention' in body) || !('actions' in body)) {
    throw new Error('StartIntervention returned an invalid response.');
  }
  return body;
}

/** @param {AppConfig} config @returns {Promise<InterventionCardDto>} */
export async function fetchListenBeforeRespondCard(config) {
  return fetchWave2Json(`${config.apiBaseUrl}/families/${config.familyId}/growth/interventions/LISTEN_BEFORE_RESPOND`, config, 'Intervention card');
}

/** @param {AppConfig} config @param {string} onboardingId @returns {Promise<StartInterventionResponse | null>} */
export async function fetchActiveIntervention(config, onboardingId) {
  return fetchWave2Json(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/interventions/active`, config, 'Active intervention');
}

/** @param {AppConfig} config @returns {Promise<GrowthActionDto | null>} */
export async function fetchTodayGrowthAction(config) {
  return fetchWave2Json(`${config.apiBaseUrl}/families/${config.familyId}/growth/actions/today`, config, 'Today action');
}

/** @param {string} url @param {AppConfig} config @param {string} label @returns {Promise<any>} */
async function fetchWave2Json(url, config, label) {
  const response = await fetch(url, { method: 'GET', headers: { 'X-Actor-Id': config.actorPersonId } });
  const body = typeof response.text === 'function'
    ? await response.text().then((rawBody) => rawBody.length > 0 ? JSON.parse(rawBody) : null)
    : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? `${label} read failed with ${response.status}`);
  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} actionId
 * @param {Exclude<GrowthActionStatus, 'PENDING'>} completionStatus
 * @param {string} reflection
 * @returns {Promise<CompleteGrowthActionResponse>}
 */
export async function submitCompleteGrowthAction(config, actionId, completionStatus, reflection) {
  const completionResourceId = `${actionId}-${completionStatus}-${createStableTextHash(reflection)}`;
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/actions/${actionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      ...authHeaders(config),
      'Idempotency-Key': createWave2IdempotencyKey('m2-105-complete-action', config.familyId, completionResourceId),
    },
    body: JSON.stringify({
      completion_status: completionStatus,
      reflection,
      occurred_at: new Date().toISOString(),
    }),
  });
  const body = /** @type {CompleteGrowthActionResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));
  if (!response.ok) {
    throw new Error(body && 'message' in body && body.message ? body.message : `CompleteGrowthAction failed with ${response.status}`);
  }
  if (!body || !('action' in body) || !('reflection_boundary' in body)) {
    throw new Error('CompleteGrowthAction returned an invalid response.');
  }
  return body;
}

export function createFrozenPriorityFixture() {
  const createdAt = '2026-08-10T00:00:00.000Z';
  return /** @type {GrowthPriorityInsightResponse} */ ({
    onboarding_id: 'onboarding-1',
    family_id: '22222222-2222-4222-8222-222222222222',
    active_priority: null,
    draft: {
      draft_id: 'priority-draft-R03',
      family_id: '22222222-2222-4222-8222-222222222222',
      onboarding_id: 'onboarding-1',
      decision: 'R03',
      candidate: {
        dimension_id: 'R03',
        profile_id: 'profile-R03',
        profile_version: 1,
        state_snapshot: 'DEVELOPING',
        reason_codes: ['RECENTLY_CONFIRMED_PROFILE', 'PRACTICE_READY'],
        evidence_summary: {
          supporting_evidence_count: 2,
          limitations: ['SELF_REPORT_ONLY'],
          agreement_level: 'ALIGNED',
          confidence: 'MEDIUM',
        },
        eligibility: 'ELIGIBLE',
        boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
        why: '父母和孩子的记录都提到“先听完再回应”会让沟通更容易继续，因此本周只选择一个可练习重点。',
        expected_change: '只记录练习过程，不声明改变已经发生。',
        limitations: [],
        policy_version: 'M2_104_DETERMINISTIC_V2',
        created_at: createdAt,
      },
      profile_refs: [{ profile_id: 'profile-R03', version: 1, dimension_id: 'R03' }],
      evidence_refs: ['evidence-PARENT', 'evidence-CHILD'],
      confidence: 'MEDIUM',
      policy_version: 'M2_104_DETERMINISTIC_V2',
      profile_snapshot: {},
      created_at: createdAt,
    },
  });
}

export function createFrozenInterventionFixture() {
  return /** @type {InterventionCardDto} */ ({
    intervention_id: 'INTERVENTION-001',
    intervention_code: 'LISTEN_BEFORE_RESPOND',
    name_zh: '先听后回应',
    duration_days: 7,
    why: '把回应放在倾听之后，让沟通更容易继续。',
    target: '父母在亲子沟通中的回应方式。',
    behavior: '孩子表达时，先停顿、复述听到的内容，再表达自己的看法。',
    applicability: ['P03', 'R03', 'R04', 'R05'],
    contraindications: ['出现安全风险时先走人工门。'],
    safety_notes: ['如出现安全相关内容，停止普通练习并转入人工处理。'],
    expected_mediator: '父母倾听行为',
    expected_outcome: 'Wave2 前端不展示为结果承诺',
    action_template: '先听完，再回应。',
    policy_version: 'M2_105_DETERMINISTIC_V1',
  });
}

export function createFrozenActionFixture() {
  return /** @type {GrowthActionDto} */ ({
    action_id: 'action-day-1',
    family_id: '22222222-2222-4222-8222-222222222222',
    onboarding_id: 'onboarding-1',
    priority_id: 'priority-R03',
    intervention_episode_id: 'episode-1',
    day_index: 1,
    status: 'PENDING',
    assignment_text: '今天在一次沟通中，先停顿 3 秒，邀请孩子把话说完，再回应。',
    due_date: '2026-08-10',
    completed_at: null,
    completion_status: null,
    reflection: null,
    reflection_boundary: null,
    boundary: 'ACTION_IS_NOT_OUTCOME',
    created_at: '2026-08-10T00:00:00.000Z',
  });
}

/**
 * @param {string} prefix
 * @param {string} familyId
 * @param {string} resourceId
 */
function createWave2IdempotencyKey(prefix, familyId, resourceId) {
  return `${prefix}-${familyId}-${resourceId}`;
}

/** @param {string} value */
function createStableTextHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

/** @param {string} eyebrow @param {string} message */
function renderUnavailablePanel(eyebrow, message) {
  return `<article class="wave2-card"><p class="eyebrow">${eyebrow}</p><p>${message}</p></article>`;
}

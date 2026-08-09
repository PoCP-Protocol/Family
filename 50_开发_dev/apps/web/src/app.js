/** @typedef {import('@family/contracts').SafetyScreeningResult} SafetyScreeningResult */
/** @typedef {import('@family/contracts').GrowthOnboardingDto} GrowthOnboardingDto */
/** @typedef {import('@family/contracts').StartGrowthOnboardingResponse} StartGrowthOnboardingResponse */
/** @typedef {import('@family/contracts').RecordPerspectiveRequest} RecordPerspectiveRequest */
/** @typedef {import('@family/contracts').RecordPerspectiveResponse} RecordPerspectiveResponse */
/** @typedef {import('@family/contracts').PerspectiveSummaryResponse} PerspectiveSummaryResponse */
/** @typedef {import('@family/contracts').StructuredSafetySignal} StructuredSafetySignal */

/**
 * @typedef {object} AppConfig
 * @property {string} apiBaseUrl
 * @property {string} actorPersonId
 * @property {string} familyId
 * @property {string} childId
 * @property {string} guardianPersonId
 */

/** @type {AppConfig} */
const defaultConfig = {
  apiBaseUrl: 'http://localhost:3000',
  actorPersonId: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  childId: '33333333-3333-4333-8333-333333333333',
  guardianPersonId: '11111111-1111-4111-8111-111111111111',
};

/**
 * @param {HTMLElement} root
 * @param {AppConfig} config
 */
export function createGrowthApp(root, config = defaultConfig) {
  const state = {
    status: 'idle',
    message: '请先启动成长入口，再记录父母视角与孩子视角。安全等级由服务端策略派生。',
    /** @type {GrowthOnboardingDto | undefined} */
    onboarding: undefined,
    /** @type {PerspectiveSummaryResponse | undefined} */
    summary: undefined,
  };

  const render = () => {
    root.innerHTML = `
      <section class="shell" aria-labelledby="family-home-title">
        <header class="topbar">
          <div>
            <p class="eyebrow">Family Core · M2-102</p>
            <h1 id="family-home-title">成长视角记录台</h1>
          </div>
          <span class="slice-badge">青春期亲子沟通</span>
        </header>

        <section class="workspace" aria-label="成长工作台">
          <aside class="family-panel" aria-label="家庭上下文">
            <h2>F01 家庭上下文</h2>
            <dl>
              <div><dt>家庭</dt><dd>${config.familyId}</dd></div>
              <div><dt>监护人</dt><dd>${config.guardianPersonId}</dd></div>
              <div><dt>孩子</dt><dd>${config.childId}</dd></div>
              <div><dt>阶段</dt><dd>12-15 岁早期青春期</dd></div>
            </dl>
          </aside>

          <main class="flow-panel">
            <section class="onboarding-panel" aria-labelledby="onboarding-title">
              <div class="panel-heading">
                <div>
                  <p class="eyebrow">F02 成长入口</p>
                  <h2 id="onboarding-title">启动亲子沟通成长旅程</h2>
                </div>
                <output class="status-pill" data-status="${state.status}">${statusLabel(state.status)}</output>
              </div>

              <form id="growth-onboarding-form">
                <label>
                  安全初筛
                  <select name="safetyScreeningResult" aria-label="安全初筛">
                    ${safetyOption('LOW', 'LOW · 可以进入普通记录')}
                    ${safetyOption('MEDIUM', 'MEDIUM · 需要人工门')}
                    ${safetyOption('HIGH', 'HIGH · 需要人工门')}
                    ${safetyOption('CRITICAL', 'CRITICAL · 需要人工门')}
                  </select>
                </label>

                <div class="consent-strip" aria-label="同意范围">
                  <span>SERVICE</span>
                  <span>ASSESSMENT</span>
                  <span>GROWTH_TRACKING</span>
                  <span class="optional">AI 非必需</span>
                </div>

                <button type="submit" ${state.status === 'submitting' ? 'disabled' : ''}>
                  ${state.status === 'submitting' ? '启动中...' : '启动成长入口'}
                </button>
              </form>

              <p class="message" role="status">${state.message}</p>
              ${state.onboarding ? renderOnboarding(state.onboarding) : ''}
            </section>

            ${state.onboarding ? renderPerspectiveForms() : ''}
            ${state.summary ? renderPerspectiveSummary(state.summary) : ''}
          </main>
        </section>
      </section>
    `;

    const onboardingForm = /** @type {HTMLFormElement | null} */ (root.querySelector('#growth-onboarding-form'));
    onboardingForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(onboardingForm);
      const safetyScreeningResult = /** @type {SafetyScreeningResult} */ (formData.get('safetyScreeningResult'));
      await startOnboarding(safetyScreeningResult);
    });

    root.querySelectorAll('form[data-perspective-form]').forEach((formElement) => {
      const form = /** @type {HTMLFormElement} */ (formElement);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await recordPerspective(form);
      });
    });
  };

  /** @param {SafetyScreeningResult} safetyScreeningResult */
  const startOnboarding = async (safetyScreeningResult) => {
    state.status = 'submitting';
    state.message = '正在提交 StartGrowthOnboarding Named Action...';
    state.onboarding = undefined;
    state.summary = undefined;
    render();

    try {
      const response = await submitStartGrowthOnboarding(config, safetyScreeningResult);
      state.onboarding = response.onboarding;
      state.status = 'started';
      state.message = '成长入口已启动。下一步分别记录父母视角和孩子视角。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '启动成长入口失败。';
    }

    render();
  };

  /** @param {HTMLFormElement} form */
  const recordPerspective = async (form) => {
    if (!state.onboarding) {
      return;
    }

    state.status = 'submitting';
    state.message = '正在记录 Perspective，并由服务端派生安全处置...';
    render();

    try {
      const formData = new FormData(form);
      const perspectiveKind = String(formData.get('perspectiveKind'));
      const responseText = String(formData.get('responseText') ?? '').trim();
      const selectedSignals = String(formData.get('selectedSignals') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const request = createPerspectiveRequest(config, state.onboarding.onboarding_id, perspectiveKind, responseText, selectedSignals);
      await submitRecordPerspective(config, state.onboarding.onboarding_id, request);
      state.summary = await fetchPerspectiveSummary(config, state.onboarding.onboarding_id);
      state.status = 'started';
      state.message = '视角已记录为 Perspective + E1 Evidence。没有写入事实、画像或优先级。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '记录视角失败。';
    }

    render();
  };

  render();
}

/**
 * @param {AppConfig} config
 * @param {SafetyScreeningResult} safetyScreeningResult
 * @returns {Promise<StartGrowthOnboardingResponse>}
 */
export async function submitStartGrowthOnboarding(config, safetyScreeningResult) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      'Idempotency-Key': createIdempotencyKey('m2-101', config.familyId, config.childId),
    },
    body: JSON.stringify({
      childId: config.childId,
      guardianPersonId: config.guardianPersonId,
      safetyScreeningResult,
    }),
  });

  const body = /** @type {StartGrowthOnboardingResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `StartGrowthOnboarding failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('onboarding' in body)) {
    throw new Error('StartGrowthOnboarding returned an invalid response.');
  }

  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @param {RecordPerspectiveRequest} request
 * @returns {Promise<RecordPerspectiveResponse>}
 */
export async function submitRecordPerspective(config, onboardingId, request) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      'Idempotency-Key': request.idempotency_key,
    },
    body: JSON.stringify({
      subjectPersonId: request.subject_person_id,
      authorPersonId: request.author_person_id,
      perspectiveType: request.perspective_type,
      captureMode: request.capture_mode,
      relatedDimensionIds: request.related_dimension_ids,
      content: {
        promptId: request.content.prompt_id,
        responseText: request.content.response_text,
        selectedSignals: request.content.selected_signals,
      },
      structuredSafetySignals: request.structured_safety_signals,
    }),
  });

  const body = /** @type {RecordPerspectiveResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `RecordPerspective failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('perspective' in body) || !('evidence' in body)) {
    throw new Error('RecordPerspective returned an invalid response.');
  }

  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @returns {Promise<PerspectiveSummaryResponse>}
 */
export async function fetchPerspectiveSummary(config, onboardingId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/perspectives`, {
    method: 'GET',
    headers: {
      'X-Actor-Id': config.actorPersonId,
    },
  });
  const body = /** @type {PerspectiveSummaryResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `Perspective summary failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('perspectives' in body) || !('evidence' in body)) {
    throw new Error('Perspective summary returned an invalid response.');
  }

  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @param {string} perspectiveKind
 * @param {string} responseText
 * @param {string[]} selectedSignals
 * @returns {RecordPerspectiveRequest}
 */
export function createPerspectiveRequest(config, onboardingId, perspectiveKind, responseText, selectedSignals) {
  const isChildPerspective = perspectiveKind === 'child';
  const prefix = isChildPerspective ? 'child' : 'parent';
  return {
    family_id: config.familyId,
    onboarding_id: onboardingId,
    subject_person_id: config.childId,
    author_person_id: isChildPerspective ? config.childId : config.guardianPersonId,
    perspective_type: isChildPerspective ? 'CHILD_PERSPECTIVE' : 'PARENT_PERSPECTIVE',
    capture_mode: isChildPerspective ? 'FACILITATED_ENTRY' : 'DIRECT_SELF_REPORT',
    related_dimension_ids: isChildPerspective ? ['R03', 'R04'] : ['P03', 'R03'],
    content: {
      prompt_id: `${prefix}-m2-102-v1`,
      response_text: responseText,
      selected_signals: selectedSignals,
    },
    structured_safety_signals: ['NONE'],
    idempotency_key: createIdempotencyKey(`m2-102-${prefix}`, config.familyId, onboardingId),
  };
}

/**
 * @param {string} prefix
 * @param {string} familyId
 * @param {string} resourceId
 */
function createIdempotencyKey(prefix, familyId, resourceId) {
  return `${prefix}-${familyId}-${resourceId}`;
}

/**
 * @param {SafetyScreeningResult} value
 * @param {string} label
 */
function safetyOption(value, label) {
  return `<option value="${value}">${label}</option>`;
}

/** @param {string} status */
function statusLabel(status) {
  switch (status) {
    case 'submitting':
      return '提交中';
    case 'started':
      return '已启动';
    case 'blocked':
      return '人工门';
    case 'error':
      return '需处理';
    default:
      return '就绪';
  }
}

/** @param {GrowthOnboardingDto} onboarding */
function renderOnboarding(onboarding) {
  return `
    <dl class="result-panel" aria-label="成长入口结果">
      <div><dt>状态</dt><dd>${onboarding.status}</dd></div>
      <div><dt>旅程</dt><dd>${onboarding.journey_type}</dd></div>
      <div><dt>阶段</dt><dd>${onboarding.phase}</dd></div>
      <div><dt>维度</dt><dd>${onboarding.target_dimensions.join(', ')}</dd></div>
    </dl>
  `;
}

function renderPerspectiveForms() {
  return `
    <section class="perspective-grid" aria-label="视角记录">
      ${renderPerspectiveForm('parent', 'F03 父母视角', '我看到的亲子沟通摩擦', '我觉得我们最近一说学习就容易吵起来。', 'interrupts, argues')}
      ${renderPerspectiveForm('child', 'F04 孩子视角', '孩子表达的沟通体验', '我希望妈妈先听我说完再评价。', 'wants-to-be-heard')}
    </section>
  `;
}

/**
 * @param {'parent' | 'child'} kind
 * @param {string} title
 * @param {string} label
 * @param {string} value
 * @param {string} signalValue
 */
function renderPerspectiveForm(kind, title, label, value, signalValue) {
  return `
    <form class="perspective-card" data-perspective-form="${kind}">
      <input type="hidden" name="perspectiveKind" value="${kind}">
      <div>
        <p class="eyebrow">${title}</p>
        <h2>${label}</h2>
      </div>
      <label>
        视角文本
        <textarea name="responseText" rows="5" required>${value}</textarea>
      </label>
      <label>
        结构化观察标签
        <input name="selectedSignals" value="${signalValue}" aria-label="结构化观察标签">
      </label>
      <div class="contract-strip" aria-label="记录边界">
        <span>Perspective != Fact</span>
        <span>E1 Self Report</span>
        <span>服务端安全策略</span>
      </div>
      <button type="submit">记录${kind === 'child' ? '孩子' : '父母'}视角</button>
    </form>
  `;
}

/** @param {PerspectiveSummaryResponse} summary */
function renderPerspectiveSummary(summary) {
  return `
    <section class="summary-panel" aria-labelledby="summary-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Perspective Summary</p>
          <h2 id="summary-title">父母 / 孩子视角对照</h2>
        </div>
        <span class="status-pill" data-status="started">${summary.evidence.length} 条 E1 证据</span>
      </div>
      <div class="summary-list">
        ${summary.perspectives.map(renderPerspectiveItem).join('')}
      </div>
    </section>
  `;
}

/** @param {PerspectiveSummaryResponse['perspectives'][number]} perspective */
function renderPerspectiveItem(perspective) {
  const title = perspective.perspective_type === 'CHILD_PERSPECTIVE' ? '孩子视角' : '父母视角';
  return `
    <article class="summary-item">
      <h3>${title}</h3>
      <p>${perspective.content.response_text}</p>
      <dl>
        <div><dt>主体</dt><dd>${perspective.subject_person_id}</dd></div>
        <div><dt>作者</dt><dd>${perspective.author_person_id}</dd></div>
        <div><dt>采集方式</dt><dd>${perspective.capture_mode}</dd></div>
        <div><dt>事实边界</dt><dd>${perspective.fact_boundary}</dd></div>
        <div><dt>服务端处置</dt><dd>${perspective.safety_disposition.disposition}</dd></div>
      </dl>
    </article>
  `;
}

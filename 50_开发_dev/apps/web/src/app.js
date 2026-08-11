/** @typedef {import('@family/contracts').SafetyScreeningResult} SafetyScreeningResult */
/** @typedef {import('@family/contracts').GrowthOnboardingDto} GrowthOnboardingDto */
/** @typedef {import('@family/contracts').StartGrowthOnboardingResponse} StartGrowthOnboardingResponse */
/** @typedef {import('@family/contracts').RecordPerspectiveRequest} RecordPerspectiveRequest */
/** @typedef {import('@family/contracts').RecordPerspectiveResponse} RecordPerspectiveResponse */
/** @typedef {import('@family/contracts').PerspectiveSummaryResponse} PerspectiveSummaryResponse */
/** @typedef {import('@family/contracts').BuildGrowthProfileDraftsResponse} BuildGrowthProfileDraftsResponse */
/** @typedef {import('@family/contracts').GrowthInsightResponse} GrowthInsightResponse */
/** @typedef {import('@family/contracts').ConfirmGrowthProfileResponse} ConfirmGrowthProfileResponse */
/** @typedef {import('@family/contracts').GrowthProfileDraftDto} GrowthProfileDraftDto */
/** @typedef {import('@family/contracts').StructuredSafetySignal} StructuredSafetySignal */
/** @typedef {import('@family/contracts').FamilyAggregateResponse} FamilyAggregateResponse */
/** @typedef {import('@family/contracts').PersonDto} PersonDto */
/** @typedef {import('@family/contracts').LifeStageAssignmentDto} LifeStageAssignmentDto */

/**
 * @typedef {object} AppConfig
 * @property {string} apiBaseUrl
 * @property {string} actorPersonId
 * @property {string} familyId
 * @property {string | undefined} childId
 * @property {string | undefined} guardianPersonId
 * @property {'real-api'} runtimeMode
 * @property {FamilyAggregateResponse | undefined} [initialAggregate]
 */

/** @type {AppConfig} */
const defaultConfig = {
  apiBaseUrl: 'http://localhost:3000',
  actorPersonId: 'dev-actor-1',
  familyId: '',
  childId: undefined,
  guardianPersonId: undefined,
  runtimeMode: 'real-api',
};

/**
 * @param {HTMLElement} root
 * @param {Partial<AppConfig>} [config]
 */
export function createGrowthApp(root, config = defaultConfig) {
  /** @type {AppConfig} */
  const mergedConfig = { ...defaultConfig, ...config, runtimeMode: 'real-api' };
  const state = {
    status: 'idle',
    message: 'REAL API MODE。请选择或创建真实家庭，再进入成长入口。',
    config: mergedConfig,
    /** @type {FamilyAggregateResponse | undefined} */
    aggregate: mergedConfig.initialAggregate,
    /** @type {GrowthOnboardingDto | undefined} */
    onboarding: mergedConfig.initialAggregate?.currentOnboarding ?? undefined,
    /** @type {PerspectiveSummaryResponse | undefined} */
    summary: undefined,
    /** @type {GrowthInsightResponse | undefined} */
    insight: undefined,
  };

  const context = () => {
    const aggregate = state.aggregate;
    const members = aggregate?.members ?? [];
    const childId = state.config.childId ?? firstChildId(members);
    const guardianId = state.config.guardianPersonId ?? firstGuardianId(members);
    return {
      ...state.config,
      childId,
      guardianPersonId: guardianId,
    };
  };

  const render = () => {
    const current = context();
    const aggregate = state.aggregate;
    const familyPanel = aggregate
      ? renderFamilyPanel(aggregate, current)
      : renderFamilySetup(state.config, state.status === 'submitting');

    root.innerHTML = `
      <section class="shell" aria-labelledby="family-home-title">
        <header class="topbar">
          <div>
            <p class="eyebrow">Family Core · REAL API MODE</p>
            <h1 id="family-home-title">成长视角记录台</h1>
          </div>
          <span class="slice-badge">development test actor</span>
        </header>

        <section class="workspace" aria-label="成长工作台">
          ${familyPanel}

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
                  监护人
                  <select name="guardianPersonId" aria-label="监护人" ${aggregate ? '' : 'disabled'}>
                    ${renderMemberOptions(aggregate?.members ?? [], current.guardianPersonId, 'PARENT')}
                  </select>
                </label>

                <label>
                  孩子
                  <select name="childId" aria-label="孩子" ${aggregate ? '' : 'disabled'}>
                    ${renderMemberOptions(aggregate?.members ?? [], current.childId, 'CHILD')}
                  </select>
                </label>

                <label>
                  安全初筛
                  <select name="safetyScreeningResult" aria-label="安全初筛" ${canStartOnboarding(current, aggregate) ? '' : 'disabled'}>
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

                <button type="submit" ${state.status === 'submitting' || !canStartOnboarding(current, aggregate) ? 'disabled' : ''}>
                  ${state.status === 'submitting' ? '启动中...' : '启动成长入口'}
                </button>
              </form>

              <p class="message" role="status">${state.message}</p>
              ${state.onboarding ? renderOnboarding(state.onboarding) : ''}
            </section>

            ${state.onboarding ? renderPerspectiveForms() : ''}
            ${state.summary ? renderPerspectiveSummary(state.summary) : ''}
            ${state.summary ? renderGrowthInsightPanel(state.insight) : ''}
          </main>
        </section>
      </section>
    `;

    const setupForm = /** @type {HTMLFormElement | null} */ (root.querySelector('#family-context-form'));
    setupForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(setupForm);
      await loadFamilyContext({
        apiBaseUrl: String(formData.get('apiBaseUrl') ?? state.config.apiBaseUrl).trim(),
        actorPersonId: String(formData.get('actorPersonId') ?? state.config.actorPersonId).trim(),
        familyId: String(formData.get('familyId') ?? '').trim(),
        childId: undefined,
        guardianPersonId: undefined,
        runtimeMode: 'real-api',
      });
    });

    root.querySelector('#create-family-context')?.addEventListener('click', async () => {
      await createFamilyContext();
    });

    const onboardingForm = /** @type {HTMLFormElement | null} */ (root.querySelector('#growth-onboarding-form'));
    onboardingForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const onboardingFormData = new FormData(onboardingForm);
      state.config.guardianPersonId = String(onboardingFormData.get('guardianPersonId') ?? '').trim() || undefined;
      state.config.childId = String(onboardingFormData.get('childId') ?? '').trim() || undefined;
      const safetyScreeningResult = /** @type {SafetyScreeningResult} */ (onboardingFormData.get('safetyScreeningResult'));
      await startOnboarding(safetyScreeningResult);
    });

    root.querySelectorAll('form[data-perspective-form]').forEach((formElement) => {
      const form = /** @type {HTMLFormElement} */ (formElement);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await recordPerspective(form);
      });
    });

    root.querySelector('#build-profile-drafts')?.addEventListener('click', async () => {
      await buildProfileDrafts();
    });

    root.querySelectorAll('button[data-confirm-draft-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        const draftId = button.getAttribute('data-confirm-draft-id');
        if (draftId) {
          await confirmProfileDraft(draftId);
        }
      });
    });
  };

  /** @param {SafetyScreeningResult} safetyScreeningResult */
  const startOnboarding = async (safetyScreeningResult) => {
    const current = context();
    if (!canStartOnboarding(current, state.aggregate)) {
      state.status = 'error';
      state.message = '请先加载真实家庭，并确保存在监护人、孩子与当前发展阶段。';
      render();
      return;
    }

    state.status = 'submitting';
    state.message = '正在提交 StartGrowthOnboarding Named Action...';
    state.onboarding = undefined;
    state.summary = undefined;
    state.insight = undefined;
    render();

    try {
      const response = await submitStartGrowthOnboarding(current, safetyScreeningResult);
      state.onboarding = response.onboarding;
      state.status = 'started';
      state.message = '成长入口已启动。下一步分别记录父母视角和孩子视角。';
      writeUrlState(current, response.onboarding.onboarding_id);
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
      const current = context();
      const request = createPerspectiveRequest(current, state.onboarding.onboarding_id, perspectiveKind, responseText, selectedSignals);
      await submitRecordPerspective(current, state.onboarding.onboarding_id, request);
      state.summary = await fetchPerspectiveSummary(current, state.onboarding.onboarding_id);
      state.insight = undefined;
      state.status = 'started';
      state.message = '视角已记录为 Perspective + E1 Evidence。没有写入事实、画像或优先级。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '记录视角失败。';
    }

    render();
  };

  const buildProfileDrafts = async () => {
    if (!state.onboarding) {
      return;
    }

    state.status = 'submitting';
    state.message = '正在合成 Growth Profile Draft。Evidence 支持 Profile，但 Evidence 本身不是 Profile。';
    render();

    try {
      const current = context();
      await submitBuildGrowthProfileDrafts(current, state.onboarding.onboarding_id);
      state.insight = await fetchGrowthInsight(current, state.onboarding.onboarding_id);
      state.status = 'started';
      state.message = '已生成工作画像草稿。它不是评分，也不是事实判定。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '生成成长画像草稿失败。';
    }

    render();
  };

  /** @param {string} draftId */
  const confirmProfileDraft = async (draftId) => {
    if (!state.onboarding) {
      return;
    }

    state.status = 'submitting';
    state.message = '正在确认 Growth Profile。确认画像不会自动生成优先级或行动。';
    render();

    try {
      const current = context();
      await submitConfirmGrowthProfile(current, draftId);
      state.insight = await fetchGrowthInsight(current, state.onboarding.onboarding_id);
      state.status = 'started';
      state.message = '画像已确认。当前仍没有写入 Growth Priority、行动或 AI 侧效果。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '确认成长画像失败。';
    }

    render();
  };

  /** @param {Partial<AppConfig>} nextConfig */
  const loadFamilyContext = async (nextConfig) => {
    state.status = 'submitting';
    state.message = '正在读取真实 Family aggregate...';
    state.config = { ...state.config, ...nextConfig };
    render();

    try {
      const aggregate = await fetchFamilyAggregate(state.config);
      state.aggregate = aggregate;
      state.config.childId = state.config.childId ?? aggregate.currentOnboarding?.child_id ?? firstChildId(aggregate.members);
      state.config.guardianPersonId = state.config.guardianPersonId ?? aggregate.currentOnboarding?.guardian_person_id ?? firstGuardianId(aggregate.members);
      state.onboarding = aggregate.currentOnboarding ?? undefined;
      if (state.onboarding) {
        state.summary = await fetchPerspectiveSummary(state.config, state.onboarding.onboarding_id);
        try {
          state.insight = await fetchGrowthInsight(state.config, state.onboarding.onboarding_id);
        } catch {
          state.insight = undefined;
        }
      } else {
        state.summary = undefined;
        state.insight = undefined;
      }
      state.status = 'idle';
      state.message = state.onboarding
        ? '已从真实 API 恢复当前 onboarding 状态。'
        : '已读取真实家庭。可以继续启动成长入口。';
      writeUrlState(state.config, state.onboarding?.onboarding_id);
    } catch (error) {
      state.aggregate = undefined;
      state.onboarding = undefined;
      state.summary = undefined;
      state.insight = undefined;
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '读取家庭上下文失败。';
    }

    render();
  };

  const createFamilyContext = async () => {
    state.status = 'submitting';
    state.message = '正在通过真实 API 创建联调家庭...';
    render();

    try {
      const created = await bootstrapFamilyContext(state.config);
      await loadFamilyContext({
        ...state.config,
        familyId: created.familyId,
        childId: created.childId,
        guardianPersonId: created.guardianPersonId,
      });
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '创建联调家庭失败。';
      render();
    }
  };

  const initialConfig = readUrlState();
  state.config = { ...state.config, ...initialConfig };

  render();

  if (!state.aggregate && state.config.familyId) {
    void loadFamilyContext(state.config);
  }
}

/**
 * @param {AppConfig} config
 * @returns {Promise<FamilyAggregateResponse>}
 */
export async function fetchFamilyAggregate(config) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}`, {
    method: 'GET',
    headers: {
      'X-Actor-Id': config.actorPersonId,
    },
  });
  const body = /** @type {FamilyAggregateResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `Family aggregate failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('family' in body) || !('members' in body)) {
    throw new Error('Family aggregate returned an invalid response.');
  }

  return body;
}

/** @param {AppConfig} config */
async function bootstrapFamilyContext(config) {
  const correlationId = `browser-bootstrap-${Date.now()}`;
  const family = await postJson(`${config.apiBaseUrl}/families`, {
    display_name: '联调家庭',
    idempotency_key: `browser-create-family-${Date.now()}`,
  }, config, correlationId);
  const familyId = family.family.family_id;
  const parent = await postJson(`${config.apiBaseUrl}/families/${familyId}/parents`, {
    role: 'GUARDIAN',
    display_name: '监护人',
    account_id: config.actorPersonId,
    idempotency_key: `browser-add-parent-${familyId}`,
  }, { ...config, familyId }, correlationId);
  const child = await postJson(`${config.apiBaseUrl}/families/${familyId}/children`, {
    display_name: '孩子',
    birth_date: '2012-06-01',
    idempotency_key: `browser-add-child-${familyId}`,
  }, { ...config, familyId }, correlationId);
  await postJson(`${config.apiBaseUrl}/families/${familyId}/relationships`, {
    person_a_id: parent.parent.person_id,
    person_b_id: child.child.person_id,
    relationship_type: 'GUARDIAN_CHILD',
    idempotency_key: `browser-add-relationship-${familyId}`,
  }, { ...config, familyId }, correlationId);
  await postJson(`${config.apiBaseUrl}/families/${familyId}/life-stages`, {
    child_id: child.child.person_id,
    life_stage_code: 'EARLY_ADOLESCENCE_12_15',
    effective_from: '2026-08-10T00:00:00.000Z',
    idempotency_key: `browser-life-stage-${familyId}`,
  }, { ...config, familyId }, correlationId);
  for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING']) {
    await postJson(`${config.apiBaseUrl}/families/${familyId}/consents`, {
      subjectPersonId: child.child.person_id,
      guardianPersonId: parent.parent.person_id,
      purpose,
      policyVersion: 'browser-bootstrap-v1',
    }, { ...config, familyId }, correlationId, `browser-consent-${purpose}-${familyId}`);
  }
  return {
    familyId,
    guardianPersonId: parent.parent.person_id,
    childId: child.child.person_id,
  };
}

/**
 * @param {string} url
 * @param {Record<string, unknown>} body
 * @param {AppConfig} config
 * @param {string} correlationId
 * @param {string | undefined} [idempotencyKey]
 */
async function postJson(url, body, config, correlationId, idempotencyKey = undefined) {
  /** @type {Record<string, string>} */
  const headers = {
    'Content-Type': 'application/json',
    'X-Actor-Id': config.actorPersonId,
    'X-Correlation-Id': correlationId,
    'X-Source': 'family-web-real-api',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && payload && 'message' in payload && payload.message
      ? payload.message
      : `Request failed with ${response.status}`;
    throw new Error(String(message));
  }
  return payload;
}

/**
 * @param {AppConfig} config
 * @param {SafetyScreeningResult} safetyScreeningResult
 * @returns {Promise<StartGrowthOnboardingResponse>}
 */
export async function submitStartGrowthOnboarding(config, safetyScreeningResult) {
  if (!config.childId || !config.guardianPersonId) {
    throw new Error('Missing child or guardian context for StartGrowthOnboarding.');
  }
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
 * @returns {Promise<BuildGrowthProfileDraftsResponse>}
 */
export async function submitBuildGrowthProfileDrafts(config, onboardingId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/profile-drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      'Idempotency-Key': createIdempotencyKey('m2-103-drafts', config.familyId, onboardingId),
    },
    body: JSON.stringify({}),
  });
  const body = /** @type {BuildGrowthProfileDraftsResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `BuildGrowthProfileDrafts failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('drafts' in body)) {
    throw new Error('BuildGrowthProfileDrafts returned an invalid response.');
  }

  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} onboardingId
 * @returns {Promise<GrowthInsightResponse>}
 */
export async function fetchGrowthInsight(config, onboardingId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/insight`, {
    method: 'GET',
    headers: {
      'X-Actor-Id': config.actorPersonId,
    },
  });
  const body = /** @type {GrowthInsightResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `GrowthInsight failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('parent_profile_drafts' in body) || !('relationship_profile_drafts' in body)) {
    throw new Error('GrowthInsight returned an invalid response.');
  }

  return body;
}

/**
 * @param {AppConfig} config
 * @param {string} draftId
 * @returns {Promise<ConfirmGrowthProfileResponse>}
 */
export async function submitConfirmGrowthProfile(config, draftId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/profile-drafts/${draftId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      'Idempotency-Key': createIdempotencyKey('m2-103-confirm', config.familyId, draftId),
    },
    body: JSON.stringify({}),
  });
  const body = /** @type {ConfirmGrowthProfileResponse | { message?: string } | undefined} */ (await response.json().catch(() => undefined));

  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `ConfirmGrowthProfile failed with ${response.status}`;
    throw new Error(message);
  }

  if (!body || !('draft' in body) || !('profile' in body)) {
    throw new Error('ConfirmGrowthProfile returned an invalid response.');
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
  if (!config.childId || !config.guardianPersonId) {
    throw new Error('Missing child or guardian context for RecordPerspective.');
  }
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

/** @returns {Partial<AppConfig>} */
function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  /** @type {Partial<AppConfig>} */
  const config = { runtimeMode: 'real-api' };
  const apiBaseUrl = params.get('apiBaseUrl');
  const actorPersonId = params.get('actorId');
  const familyId = params.get('familyId');
  const childId = params.get('childId');
  const guardianPersonId = params.get('guardianPersonId');

  if (apiBaseUrl) config.apiBaseUrl = apiBaseUrl;
  if (actorPersonId) config.actorPersonId = actorPersonId;
  if (familyId) config.familyId = familyId;
  if (childId) config.childId = childId;
  if (guardianPersonId) config.guardianPersonId = guardianPersonId;

  return config;
}

/**
 * @param {AppConfig} config
 * @param {string | undefined} [onboardingId]
 */
function writeUrlState(config, onboardingId = undefined) {
  const params = new URLSearchParams();
  params.set('mode', 'real-api');
  params.set('apiBaseUrl', config.apiBaseUrl);
  params.set('actorId', config.actorPersonId);
  if (config.familyId) params.set('familyId', config.familyId);
  if (config.childId) params.set('childId', config.childId);
  if (config.guardianPersonId) params.set('guardianPersonId', config.guardianPersonId);
  if (onboardingId) params.set('onboardingId', onboardingId);
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

/**
 * @param {AppConfig} config
 * @param {FamilyAggregateResponse | undefined} aggregate
 */
function canStartOnboarding(config, aggregate) {
  return Boolean(aggregate && config.familyId && config.childId && config.guardianPersonId && currentLifeStage(aggregate.lifeStages, config.childId));
}

/**
 * @param {AppConfig} config
 * @param {boolean} disabled
 */
function renderFamilySetup(config, disabled) {
  return `
    <aside class="family-panel" aria-label="家庭上下文">
      <h2>F01 家庭上下文</h2>
      <p class="message">当前未加载家庭。REAL API MODE 下不会自动生成假家庭。</p>
      <form id="family-context-form">
        <label>
          API Base URL
          <input name="apiBaseUrl" value="${escapeHtml(config.apiBaseUrl)}" aria-label="API Base URL">
        </label>
        <label>
          Development Actor
          <input name="actorPersonId" value="${escapeHtml(config.actorPersonId)}" aria-label="Development Actor">
        </label>
        <label>
          Family ID
          <input name="familyId" value="${escapeHtml(config.familyId)}" aria-label="Family ID">
        </label>
        <button type="submit" ${disabled ? 'disabled' : ''}>读取真实家庭</button>
        <button id="create-family-context" type="button" ${disabled ? 'disabled' : ''}>创建联调家庭</button>
      </form>
    </aside>
  `;
}

/**
 * @param {FamilyAggregateResponse} aggregate
 * @param {AppConfig} config
 */
function renderFamilyPanel(aggregate, config) {
  const family = aggregate.family;
  const members = aggregate.members;
  const childCount = members.filter((member) => member.person_type === 'CHILD').length;
  const guardianCount = members.filter((member) => member.person_type === 'PARENT').length;
  const selectedChild = members.find((member) => member.person_id === config.childId);
  const selectedGuardian = members.find((member) => member.person_id === config.guardianPersonId);
  const lifeStage = currentLifeStage(aggregate.lifeStages, config.childId);
  return `
    <aside class="family-panel" aria-label="家庭上下文">
      <h2>F01 家庭上下文</h2>
      <dl>
        <div><dt>模式</dt><dd>real-api</dd></div>
        <div><dt>家庭 ID</dt><dd>${family.family_id}</dd></div>
        <div><dt>家庭名称</dt><dd>${escapeHtml(family.display_name)}</dd></div>
        <div><dt>成员数</dt><dd>${members.length}</dd></div>
        <div><dt>监护人数</dt><dd>${guardianCount}</dd></div>
        <div><dt>孩子数</dt><dd>${childCount}</dd></div>
        <div><dt>关系数</dt><dd>${aggregate.relationships.length}</dd></div>
        <div><dt>当前监护人</dt><dd>${selectedGuardian ? escapeHtml(selectedGuardian.display_name) : '未选择'}</dd></div>
        <div><dt>当前孩子</dt><dd>${selectedChild ? escapeHtml(selectedChild.display_name) : '未选择'}</dd></div>
        <div><dt>当前阶段</dt><dd>${lifeStage ? escapeHtml(lifeStage.life_stage_code) : '未配置'}</dd></div>
        <div><dt>当前 onboarding</dt><dd>${aggregate.currentOnboarding ? aggregate.currentOnboarding.onboarding_id : '无'}</dd></div>
      </dl>
    </aside>
  `;
}

/**
 * @param {PersonDto[]} members
 * @param {string | undefined} selectedId
 * @param {'PARENT' | 'CHILD'} personType
 */
function renderMemberOptions(members, selectedId, personType) {
  const filtered = members.filter((member) => member.person_type === personType);
  if (filtered.length === 0) {
    return '<option value="">暂无可选成员</option>';
  }
  return filtered.map((member) => `<option value="${member.person_id}" ${member.person_id === selectedId ? 'selected' : ''}>${escapeHtml(member.display_name)} · ${member.person_id}</option>`).join('');
}

/** @param {PersonDto[]} members */
function firstChildId(members) {
  return members.find((member) => member.person_type === 'CHILD')?.person_id;
}

/** @param {PersonDto[]} members */
function firstGuardianId(members) {
  return members.find((member) => member.person_type === 'PARENT' && member.parent_role === 'GUARDIAN')?.person_id
    ?? members.find((member) => member.person_type === 'PARENT')?.person_id;
}

/**
 * @param {LifeStageAssignmentDto[]} lifeStages
 * @param {string | undefined} childId
 */
function currentLifeStage(lifeStages, childId) {
  return lifeStages.find((item) => item.child_id === childId && item.effective_to === null) ?? null;
}

/** @param {string | number | null | undefined} value */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

/** @param {GrowthInsightResponse | undefined} insight */
function renderGrowthInsightPanel(insight) {
  const drafts = insight ? [...insight.parent_profile_drafts, ...insight.relationship_profile_drafts] : [];
  return `
    <section class="insight-panel" aria-labelledby="growth-insight-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">F05 Growth Insight</p>
          <h2 id="growth-insight-title">我们目前看到的沟通状态</h2>
        </div>
        <button id="build-profile-drafts" type="button">生成成长画像草稿</button>
      </div>
      <p class="boundary-note">这不是评分，也不是事实判定，而是基于目前信息形成的工作画像。</p>
      <div class="contract-strip" aria-label="画像边界">
        <span>Evidence 支持 Profile</span>
        <span>Evidence 本身不是 Profile</span>
        <span>不生成优先级</span>
        <span>不触发 AI</span>
      </div>
      ${drafts.length > 0 ? `
        <div class="insight-grid">
          ${drafts.map(renderGrowthProfileDraft).join('')}
        </div>
      ` : '<p class="message">记录父母与孩子视角后，可以生成一组有限的成长画像草稿。</p>'}
      ${insight && insight.confirmed_profiles.length > 0 ? `
        <div class="confirmed-strip" aria-label="已确认画像">
          已确认 ${insight.confirmed_profiles.length} 个工作画像；确认不代表事实成立，也不会自动生成行动。
        </div>
      ` : ''}
    </section>
  `;
}

/** @param {GrowthProfileDraftDto} draft */
function renderGrowthProfileDraft(draft) {
  const confirmable = draft.status === 'DRAFT' && draft.candidate_state !== 'UNRESOLVED';
  return `
    <article class="insight-card" data-dimension="${draft.dimension_id}">
      <div>
        <p class="eyebrow">${profileScopeLabel(draft)}</p>
        <h3>${dimensionLabel(draft.dimension_id)}</h3>
      </div>
      <dl>
        <div><dt>当前状态</dt><dd>${candidateStateLabel(draft.candidate_state)}</dd></div>
        <div><dt>信心</dt><dd>${confidenceLabel(draft.confidence)}</dd></div>
        <div><dt>证据</dt><dd>${draft.evidence_snapshot.evidence_ids.length} 条 E1</dd></div>
        <div><dt>一致性</dt><dd>${agreementLabel(draft.synthesis.agreement_level)}</dd></div>
      </dl>
      <p>${evidenceExplanation(draft)}</p>
      ${draft.synthesis.limitations.length > 0 ? `<p class="limitation">${limitationExplanation(draft.synthesis.limitations)}</p>` : ''}
      ${confirmable ? `<button type="button" data-confirm-draft-id="${draft.draft_id}">这符合我们目前的情况</button>` : '<span class="review-needed">信息不足，暂不确认</span>'}
    </article>
  `;
}

/** @param {GrowthProfileDraftDto} draft */
function profileScopeLabel(draft) {
  return draft.profile_scope === 'PARENT_GROWTH_PROFILE' ? '父母成长画像' : '亲子关系画像';
}

/** @param {string} dimensionId */
function dimensionLabel(dimensionId) {
  /** @type {Record<string, string>} */
  const labels = {
    P03: 'P03 父母倾听与回应方式',
    R03: 'R03 冲突中被听见的程度',
    R04: 'R04 分歧后的修复能力',
    R05: 'R05 日常协作节奏',
  };
  return labels[dimensionId] ?? dimensionId;
}

/** @param {string} state */
function candidateStateLabel(state) {
  /** @type {Record<string, string>} */
  const labels = {
    UNRESOLVED: '信息不足',
    EMERGING: '刚开始浮现',
    DEVELOPING: '正在发展',
    PRACTICING: '正在练习',
    STABILIZING: '趋于稳定',
  };
  return labels[state] ?? state;
}

/** @param {string} confidence */
function confidenceLabel(confidence) {
  return confidence === 'MEDIUM' ? '中' : confidence === 'HIGH' ? '高' : '低';
}

/** @param {string} agreement */
function agreementLabel(agreement) {
  /** @type {Record<string, string>} */
  const labels = {
    ALIGNED: '多方表达相互支持',
    PARTIAL: '部分支持',
    DIVERGENT: '存在分歧',
    INSUFFICIENT: '证据不足',
  };
  return labels[agreement] ?? agreement;
}

/** @param {GrowthProfileDraftDto} draft */
function evidenceExplanation(draft) {
  if (draft.candidate_state === 'UNRESOLVED') {
    return '目前证据还不足，只能保留为待澄清状态。';
  }
  if (draft.synthesis.agreement_level === 'DIVERGENT') {
    return '不同视角之间存在差异，画像只能作为工作假设。';
  }
  return '当前草稿来自父母/孩子 Perspective 及其 E1 Evidence，只能支持解释性画像。';
}

/** @param {string[]} limitations */
function limitationExplanation(limitations) {
  /** @type {Record<string, string>} */
  const labels = {
    INSUFFICIENT_EVIDENCE: '证据不足',
    SELF_REPORT_ONLY: '仅有自陈材料',
    PERSPECTIVE_DIVERGENCE: '视角存在分歧',
    SAFETY_ESCALATION_EXCLUDED: '安全升级内容已排除',
    PROXY_CHILD_PERSPECTIVE: '孩子视角为代理记录',
    NO_CHILD_PERSPECTIVE: '缺少孩子视角',
  };
  return limitations.map((item) => labels[item] ?? item).join('、');
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

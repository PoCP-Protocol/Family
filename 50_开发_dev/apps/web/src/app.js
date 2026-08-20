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
import {
  createFrozenActionFixture,
  createFrozenInterventionFixture,
  createFrozenPriorityFixture,
  createInitialWave2State,
  fetchActiveIntervention,
  fetchGrowthPriorityInsight,
  fetchListenBeforeRespondCard,
  fetchTodayGrowthAction,
  renderWave2Section,
  submitCompleteGrowthAction,
  submitConfirmGrowthPriority,
  submitStartIntervention,
} from './wave2.js';
import {
  createFrozenNextStepFixture,
  createFrozenReviewFixture,
  createFrozenTimelineFixture,
  createInitialWave3State,
  fetchGrowthTimeline,
  renderWave3Section,
  submitCompleteGrowthReview,
  submitRecordNextStepDecision,
  submitRecordOutcomeObservation,
} from './wave3.js';

/**
 * @typedef {object} AppConfig
 * @property {string} apiBaseUrl
 * @property {string} actorPersonId
 * @property {string} familyId
 * @property {string} childId
 * @property {string} guardianPersonId
 * @property {string} [authToken]
 * @property {'pre-real-api' | 'real-api'} [wave2ApiMode]
 */

/** @type {AppConfig} */
export const defaultConfig = {
  apiBaseUrl: 'http://localhost:3000',
  actorPersonId: '11111111-1111-4111-8111-111111111111',
  familyId: '22222222-2222-4222-8222-222222222222',
  childId: '33333333-3333-4333-8333-333333333333',
  guardianPersonId: '11111111-1111-4111-8111-111111111111',
};

/**
 * @param {AppConfig} config
 * @returns {Record<string, string>}
 */
function authHeaders(config) {
  return config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {};
}

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
    /** @type {GrowthInsightResponse | undefined} */
    insight: undefined,
    wave2: createInitialWave2State(config.wave2ApiMode ?? 'pre-real-api'),
    wave3: createInitialWave3State(),
  };

  const render = () => {
    const journeyStage = state.insight?.confirmed_profiles.length
      ? 4
      : state.insight
        ? 3
        : state.summary
          ? 2
          : state.onboarding
            ? 1
            : 0;
    root.innerHTML = `
      <section class="shell" aria-labelledby="family-home-title">
        <header class="app-header">
          <div class="brand" aria-label="Family 家庭成长陪伴">
            <span class="brand-mark" aria-hidden="true">F</span>
            <span class="brand-name">Family <small>家庭成长陪伴</small></span>
          </div>
          <div class="header-meta">
            <a class="product-switch-link" href="?product=waf">We are 伐木累</a>
            <span class="privacy-chip"><span aria-hidden="true">●</span> 仅家庭可见</span>
            <span class="avatar" aria-label="监护人账户">家</span>
          </div>
        </header>

        <section class="topbar" aria-label="成长旅程介绍">
          <div class="hero-copy">
            <p class="eyebrow">Family Core · M2-102</p>
            <h1 id="family-home-title">让沟通，<br><span>从被听见开始</span></h1>
            <p class="hero-lead">不急着下结论。先记录彼此的视角，再找到这一周最值得练习的一件小事。</p>
            <div class="hero-meta" aria-label="当前主题">
              <span class="slice-badge">青春期亲子沟通</span>
              <span class="gentle-badge">约 2 分钟开始</span>
            </div>
          </div>
          <div class="hero-art" role="img" aria-label="家庭沿着成长路径同行的抽象插画"></div>
        </section>

        <section class="workspace" aria-label="成长工作台">
          <aside class="family-panel" aria-label="家庭上下文">
            <p class="eyebrow">F01 家庭上下文</p>
            <h2>我们的成长旅程</h2>
            <div class="stage-card">
              <span class="stage-icon" aria-hidden="true">芽</span>
              <div><small>当前成长阶段</small><strong>12–15 岁 · 早期青春期</strong></div>
            </div>
            <nav class="journey-nav" aria-label="成长旅程进度">
              <ol>
                <li class="${journeyStage === 0 ? 'active' : journeyStage > 0 ? 'done' : ''}"><span>1</span><div><strong>建立起点</strong><small>确认安全与使用范围</small></div></li>
                <li class="${journeyStage === 1 ? 'active' : journeyStage > 1 ? 'done' : ''}"><span>2</span><div><strong>听见彼此</strong><small>记录父母与孩子视角</small></div></li>
                <li class="${journeyStage === 2 || journeyStage === 3 ? 'active' : journeyStage > 3 ? 'done' : ''}"><span>3</span><div><strong>形成理解</strong><small>查看有限的工作画像</small></div></li>
                <li class="${journeyStage === 4 ? 'active' : ''}"><span>4</span><div><strong>开始练习</strong><small>一次只改变一件小事</small></div></li>
              </ol>
            </nav>
            <p class="privacy-note"><span aria-hidden="true">◇</span> 记录只用于本次家庭成长旅程，并遵循同意范围。</p>
            <details class="technical-details">
              <summary>查看数据标识</summary>
              <dl>
                <div><dt>家庭</dt><dd>${config.familyId}</dd></div>
                <div><dt>监护人</dt><dd>${config.guardianPersonId}</dd></div>
                <div><dt>孩子</dt><dd>${config.childId}</dd></div>
              </dl>
            </details>
          </aside>

          <main class="flow-panel">
            <section class="onboarding-panel" aria-labelledby="onboarding-title">
              <div class="panel-heading">
                <div>
                  <p class="eyebrow"><span class="step-number">01</span> F02 成长入口</p>
                  <h2 id="onboarding-title">启动亲子沟通成长旅程</h2>
                  <p class="section-description">先完成一个简短确认，系统会根据安全规则决定接下来的记录方式。</p>
                </div>
                <output class="status-pill" data-status="${state.status}">${statusLabel(state.status)}</output>
              </div>

              <form id="growth-onboarding-form">
                <label>
                  <span>当前观察到的安全事实信号 <small>必选</small></span>
                  <div class="safety-signal-group" aria-label="安全事实信号">
                    ${safetySignalCheckbox('NONE', '未观察到安全风险信号', true)}
                    ${safetySignalCheckbox('SELF_HARM', '提到自伤')}
                    ${safetySignalCheckbox('HARM_TO_OTHERS', '提到伤害他人')}
                    ${safetySignalCheckbox('ABUSE', '提到虐待或侵害')}
                    ${safetySignalCheckbox('VIOLENCE', '提到暴力')}
                    ${safetySignalCheckbox('SEVERE_CRISIS', '存在严重危机')}
                  </div>
                </label>

                <div class="consent-strip" aria-label="同意范围">
                  <span><strong>基础服务</strong><small>SERVICE</small></span>
                  <span><strong>视角整理</strong><small>ASSESSMENT</small></span>
                  <span><strong>成长记录</strong><small>GROWTH_TRACKING</small></span>
                  <span class="optional"><strong>规则保障</strong><small>确定性流程</small></span>
                </div>

                <button class="primary-action" type="submit" ${state.status === 'submitting' ? 'disabled' : ''}>
                  ${state.status === 'submitting' ? '正在准备旅程…' : '开始 2 分钟记录'}
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p class="message status-message" role="status"><span aria-hidden="true">i</span>${state.message}</p>
              ${state.onboarding ? renderOnboarding(state.onboarding) : ''}
            </section>

            ${state.onboarding ? renderPerspectiveForms() : ''}
            ${state.summary ? renderPerspectiveSummary(state.summary) : ''}
            ${state.summary ? renderGrowthInsightPanel(state.insight) : ''}
            ${state.insight && state.insight.confirmed_profiles.length > 0 ? renderWave2Section(state.wave2) : ''}
            ${state.wave2.startedIntervention ? renderWave3Section(state.wave3, state.wave2.startedIntervention.episode.episode_id) : ''}
          </main>
        </section>
      </section>
    `;

    const onboardingForm = /** @type {HTMLFormElement | null} */ (root.querySelector('#growth-onboarding-form'));
    onboardingForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(onboardingForm);
      const structuredSafetySignals = /** @type {StructuredSafetySignal[]} */ (formData.getAll('structuredSafetySignals'));
      await startOnboarding(structuredSafetySignals.length ? structuredSafetySignals : ['NONE']);
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

    root.querySelector('button[data-wave2-action="confirm-priority"]')?.addEventListener('click', async (event) => {
      const button = /** @type {HTMLButtonElement} */ (event.currentTarget);
      await confirmWave2Priority(button.dataset.draftId ?? 'priority-draft-R03', button.dataset.decision ?? 'R03');
    });

    root.querySelector('button[data-wave2-action="start-intervention"]')?.addEventListener('click', async () => {
      await startWave2Intervention();
    });

    root.querySelectorAll('button[data-wave2-complete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const completionStatus = /** @type {Exclude<import('@family/contracts').GrowthActionStatus, 'PENDING'>} */ (button.getAttribute('data-wave2-complete'));
        await completeWave2Action(completionStatus, '按钮记录：今天已更新练习状态。');
      });
    });

    root.querySelector('#wave2-reflection-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = /** @type {HTMLFormElement} */ (event.currentTarget);
      const formData = new FormData(form);
      const completionStatus = /** @type {Exclude<import('@family/contracts').GrowthActionStatus, 'PENDING'>} */ (String(formData.get('completionStatus')));
      const reflection = String(formData.get('reflection') ?? '').trim();
      await completeWave2Action(completionStatus, reflection);
    });

    root.querySelector('button[data-wave3-action="record-parent-observation"]')?.addEventListener('click', async () => {
      await recordWave3Observation('PARENT_OBSERVATION');
    });

    root.querySelector('button[data-wave3-action="record-child-observation"]')?.addEventListener('click', async () => {
      await recordWave3Observation('CHILD_OBSERVATION');
    });

    root.querySelector('button[data-wave3-action="complete-review"]')?.addEventListener('click', async () => {
      await completeWave3Review();
    });

    root.querySelector('button[data-wave3-action="refresh-timeline"]')?.addEventListener('click', async () => {
      await refreshWave3Timeline();
    });

    root.querySelector('button[data-wave3-action="record-next-step"]')?.addEventListener('click', async () => {
      await recordWave3NextStep();
    });
  };

  /** @param {StructuredSafetySignal[]} structuredSafetySignals */
  const startOnboarding = async (structuredSafetySignals) => {
    state.status = 'submitting';
    state.message = '正在提交 StartGrowthOnboarding Named Action...';
    state.onboarding = undefined;
    state.summary = undefined;
    state.insight = undefined;
    render();

    try {
      let response;
      try {
        response = await submitStartGrowthOnboarding(config, structuredSafetySignals);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('growth_onboarding_already_active')) {
          throw error;
        }
        response = await fetchActiveGrowthOnboarding(config);
        if (!response) {
          throw new Error('active_growth_onboarding_not_found');
        }
        state.message = '已恢复当前家庭成长旅程。下一步分别记录父母视角和孩子视角。';
      }
      state.onboarding = response.onboarding;
      state.status = 'started';
      if (!state.message.includes('已恢复')) {
        state.message = '成长入口已启动。下一步分别记录父母视角和孩子视角。';
      }
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
      state.insight = undefined;
      state.status = 'started';
      state.message = '视角已记录为 Perspective + E1 Evidence。没有写入事实、画像或优先级。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '记录视角失败。';
    }

    render();
  };

  const hydrateWave2 = async () => {
    if (!state.onboarding) {
      return;
    }

    if (state.wave2.apiMode === 'real-api') {
      const [priorityInsight, intervention, activeIntervention, todayAction] = await Promise.all([
        fetchGrowthPriorityInsight(config, state.onboarding.onboarding_id),
        fetchListenBeforeRespondCard(config),
        fetchActiveIntervention(config, state.onboarding.onboarding_id),
        fetchTodayGrowthAction(config),
      ]);
      state.wave2.priorityInsight = priorityInsight;
      state.wave2.intervention = intervention;
      state.wave2.startedIntervention = activeIntervention ?? undefined;
      state.wave2.todayAction = todayAction ?? undefined;
      return;
    }

    state.wave2.priorityInsight = createFrozenPriorityFixture();
    state.wave2.intervention = createFrozenInterventionFixture();
    state.wave2.startedIntervention = undefined;
    state.wave2.todayAction = undefined;
  };

  const buildProfileDrafts = async () => {
    if (!state.onboarding) {
      return;
    }

    state.status = 'submitting';
    state.message = '正在合成 Growth Profile Draft。Evidence 支持 Profile，但 Evidence 本身不是 Profile。';
    render();

    try {
      await submitBuildGrowthProfileDrafts(
        config,
        state.onboarding.onboarding_id,
        createPerspectiveSourceFingerprint(state.summary),
      );
      state.insight = await fetchGrowthInsight(config, state.onboarding.onboarding_id);
      if (state.insight.confirmed_profiles.length > 0) {
        await hydrateWave2();
      }
      state.status = 'started';
      state.message = '已生成工作画像草稿。它是解释性工作材料，不是事实判定。';
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
      await submitConfirmGrowthProfile(config, draftId);
      state.insight = await fetchGrowthInsight(config, state.onboarding.onboarding_id);
      await hydrateWave2();
      state.status = 'started';
      state.message = '画像已确认。当前仍没有写入 Growth Priority 或行动。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '确认成长画像失败。';
    }

    render();
  };

  /**
   * @param {string} draftId
   * @param {string} decision
   */
  const confirmWave2Priority = async (draftId, decision) => {
    if (!state.onboarding) {
      return;
    }

    state.status = 'submitting';
    state.message = '正在提交 ConfirmGrowthPriority Named Action。';
    render();

    try {
      if (state.wave2.apiMode === 'real-api') {
        const response = await submitConfirmGrowthPriority(config, state.onboarding.onboarding_id, draftId, decision);
        state.wave2.priorityInsight = { onboarding_id: state.onboarding.onboarding_id, family_id: config.familyId, draft: response.draft, active_priority: response.priority };
      } else {
        const priorityInsight = createFrozenPriorityFixture();
        const dimensionId = ['P03', 'R03', 'R04', 'R05'].includes(decision) ? /** @type {import('@family/contracts').M2GrowthDimensionId} */ (decision) : 'R03';
        state.wave2.priorityInsight = {
          ...priorityInsight,
          active_priority: {
            priority_id: 'priority-R03',
            family_id: config.familyId,
            onboarding_id: state.onboarding.onboarding_id,
            profile_id: 'profile-R03',
            dimension_id: dimensionId,
            status: 'ACTIVE',
            version: 1,
            boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
            reason_codes: ['RECENTLY_CONFIRMED_PROFILE', 'PRACTICE_READY'],
            evidence_refs: ['evidence-PARENT', 'evidence-CHILD'],
            policy_version: 'M2_104_DETERMINISTIC_V2',
            confirmed_by_actor_id: config.actorPersonId,
            confirmed_at: '2026-08-10T00:00:00.000Z',
            superseded_at: null,
            previous_priority_id: null,
            created_at: '2026-08-10T00:00:00.000Z',
          },
        };
      }
      state.status = 'started';
      state.message = '已确认本周练习重点。不会自动开始练习计划。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '确认练习重点失败。';
    }

    render();
  };

  const startWave2Intervention = async () => {
    if (!state.onboarding) {
      return;
    }

    state.status = 'submitting';
    state.message = '正在提交 StartIntervention。';
    render();

    try {
      const priorityId = state.wave2.priorityInsight?.active_priority?.priority_id;
      if (!priorityId) throw new Error('请先确认一个练习重点。');
      if (state.wave2.apiMode === 'real-api') {
        state.wave2.startedIntervention = await submitStartIntervention(config, state.onboarding.onboarding_id, priorityId);
        state.wave2.intervention = state.wave2.startedIntervention.intervention;
        state.wave2.todayAction = state.wave2.startedIntervention.actions[0];
        try {
          state.wave2.todayAction = await fetchTodayGrowthAction(config) ?? state.wave2.todayAction;
        } catch {
          state.message = '7 天练习已准备，今日行动使用 StartIntervention 返回的 Day 1。';
        }
      } else {
        const action = createFrozenActionFixture();
        state.wave2.startedIntervention = {
          intervention: state.wave2.intervention ?? createFrozenInterventionFixture(),
          episode: {
            episode_id: 'episode-1',
            family_id: config.familyId,
            onboarding_id: state.onboarding.onboarding_id,
            priority_id: priorityId,
            intervention_id: 'INTERVENTION-001',
            intervention_code: 'LISTEN_BEFORE_RESPOND',
            status: 'ACTIVE',
            started_by_actor_id: config.actorPersonId,
            planned_days: 7,
            policy_version: 'M2_105_DETERMINISTIC_V1',
            started_at: '2026-08-10T00:00:00.000Z',
            created_at: '2026-08-10T00:00:00.000Z',
          },
          actions: /** @type {Array<1 | 2 | 3 | 4 | 5 | 6 | 7>} */ ([1, 2, 3, 4, 5, 6, 7]).map((dayIndex) => ({
            ...action,
            action_id: `action-day-${dayIndex}`,
            day_index: dayIndex,
          })),
        };
        state.wave2.todayAction = action;
      }
      state.status = 'started';
      state.message = state.message.startsWith('7 天练习已准备') ? state.message : '7 天练习已准备。每天只有具体行动状态，不写结果。';
      state.wave3 = createInitialWave3State();
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '开始练习失败。';
    }

    render();
  };

  /**
   * @param {Exclude<import('@family/contracts').GrowthActionStatus, 'PENDING'>} completionStatus
   * @param {string} reflection
   */
  const completeWave2Action = async (completionStatus, reflection) => {
    const action = state.wave2.todayAction;
    if (!action) {
      state.status = 'error';
      state.message = '当前没有可记录的今日行动。';
      render();
      return;
    }
    state.status = 'submitting';
    state.message = '正在提交 CompleteGrowthAction。';
    render();

    try {
      if (state.wave2.apiMode === 'real-api') {
        const response = await submitCompleteGrowthAction(config, action.action_id, completionStatus, reflection);
        state.wave2.todayAction = response.action;
        state.wave2.reflectionBoundary = response.reflection_boundary;
      } else {
        state.wave2.todayAction = {
          ...action,
          status: completionStatus,
          completion_status: completionStatus,
          completed_at: new Date().toISOString(),
          reflection,
          reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME',
        };
        state.wave2.reflectionBoundary = 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME';
      }
      state.status = 'started';
      state.message = '行动状态已记录；反思只作为原始记录保留。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '保存行动状态失败。';
    }

    render();
  };

  const getWave3EpisodeId = () => state.wave2.startedIntervention?.episode.episode_id;
  const getWave3ActionId = () => state.wave2.todayAction?.action_id ?? state.wave2.startedIntervention?.actions[0]?.action_id ?? '';

  /** @param {'PARENT_OBSERVATION' | 'CHILD_OBSERVATION'} perspectiveType */
  const recordWave3Observation = async (perspectiveType) => {
    const episodeId = getWave3EpisodeId();
    if (!episodeId) {
      return;
    }
    state.status = 'submitting';
    state.message = '正在记录 OutcomeObservation。Observation 不等于 Fact 或 CausalEffect。';
    render();

    try {
      if (state.wave2.apiMode === 'real-api') {
        await submitRecordOutcomeObservation(config, episodeId, perspectiveType, getWave3ActionId());
        state.wave3.timeline = await fetchGrowthTimeline(config, episodeId);
      } else {
        state.wave3.timeline = createFrozenTimelineFixture(config, episodeId);
      }
      state.status = 'started';
      state.message = '结果观察已记录为观察材料，不写事实结论或因果结论。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '记录结果观察失败。';
    }

    render();
  };

  const completeWave3Review = async () => {
    const episodeId = getWave3EpisodeId();
    if (!episodeId) {
      return;
    }
    state.status = 'submitting';
    state.message = '正在完成 GrowthReview。复盘不会自动改写画像或生成诊断。';
    render();

    try {
      state.wave3.review = state.wave2.apiMode === 'real-api'
        ? await submitCompleteGrowthReview(config, episodeId)
        : createFrozenReviewFixture(config, episodeId);
      state.wave3.timeline = state.wave2.apiMode === 'real-api'
        ? await fetchGrowthTimeline(config, episodeId)
        : createFrozenTimelineFixture(config, episodeId);
      state.status = 'started';
      state.message = '7 天复盘已完成；它是 Review，不是 Profile mutation 或 Diagnosis。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '完成成长复盘失败。';
    }

    render();
  };

  const refreshWave3Timeline = async () => {
    const episodeId = getWave3EpisodeId();
    if (!episodeId) {
      return;
    }
    state.status = 'submitting';
    state.message = '正在读取 FamilyTimeline。Timeline 只呈现过程来源。';
    render();

    try {
      state.wave3.timeline = state.wave2.apiMode === 'real-api'
        ? await fetchGrowthTimeline(config, episodeId)
        : createFrozenTimelineFixture(config, episodeId);
      state.status = 'started';
      state.message = '时间线已刷新。它不是总分、排名或效果承诺。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '刷新时间线失败。';
    }

    render();
  };

  const recordWave3NextStep = async () => {
    const review = state.wave3.review?.review;
    if (!review) {
      return;
    }
    state.status = 'submitting';
    state.message = '正在记录 NextStepDecision。Decision 不等于 NextAction。';
    render();

    try {
      state.wave3.nextStep = state.wave2.apiMode === 'real-api'
        ? await submitRecordNextStepDecision(config, review.review_id, 'CONTINUE')
        : createFrozenNextStepFixture(config, review.review_id);
      state.status = 'started';
      state.message = '下一步决策已记录；没有自动创建下一轮行动。';
    } catch (error) {
      state.status = 'error';
      state.message = error instanceof Error ? error.message : '记录下一步决策失败。';
    }

    render();
  };

  render();
}

/**
 * @param {AppConfig} config
 * @returns {Promise<StartGrowthOnboardingResponse | null>}
 */
export async function fetchActiveGrowthOnboarding(config) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboarding/active`, {
    method: 'GET',
    headers: {
      'X-Actor-Id': config.actorPersonId,
      ...authHeaders(config),
    },
  });
  const body = /** @type {StartGrowthOnboardingResponse | null | { message?: string } | undefined} */ (await response.json().catch(() => undefined));
  if (!response.ok) {
    const message = body && 'message' in body && body.message ? body.message : `ActiveGrowthOnboarding failed with ${response.status}`;
    throw new Error(message);
  }
  if (body === null) return null;
  if (!body || !('onboarding' in body)) {
    throw new Error('ActiveGrowthOnboarding returned an invalid response.');
  }
  return body;
}

/**
 * @param {AppConfig} config
 * @param {StructuredSafetySignal[]} structuredSafetySignals
 * @returns {Promise<StartGrowthOnboardingResponse>}
 */
export async function submitStartGrowthOnboarding(config, structuredSafetySignals) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      ...authHeaders(config),
      'Idempotency-Key': createIdempotencyKey('m2-101', config.familyId, config.childId),
    },
    body: JSON.stringify({
      childId: config.childId,
      guardianPersonId: config.guardianPersonId,
      structuredSafetySignals,
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
      ...authHeaders(config),
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
      ...authHeaders(config),
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
 * @param {string} [sourceFingerprint]
 * @returns {Promise<BuildGrowthProfileDraftsResponse>}
 */
export async function submitBuildGrowthProfileDrafts(config, onboardingId, sourceFingerprint = 'initial') {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${onboardingId}/profile-drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Actor-Id': config.actorPersonId,
      ...authHeaders(config),
      'Idempotency-Key': createIdempotencyKey('m2-103-drafts', config.familyId, `${onboardingId}-${sourceFingerprint}`),
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
      ...authHeaders(config),
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
      ...authHeaders(config),
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

/** @param {PerspectiveSummaryResponse | undefined} summary */
function createPerspectiveSourceFingerprint(summary) {
  const perspectiveIds = summary?.perspectives.map((perspective) => perspective.perspective_id).sort() ?? [];
  return perspectiveIds.length > 0 ? `p${perspectiveIds.length}-${createStableHash(perspectiveIds.join('|'))}` : 'initial';
}

/** @param {string} value */
function createStableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * @param {StructuredSafetySignal} value
 * @param {string} label
 * @param {boolean} checked
 */
function safetySignalCheckbox(value, label, checked = false) {
  return `<label class="safety-signal-option"><input type="checkbox" name="structuredSafetySignals" value="${value}" ${checked ? 'checked' : ''}> <span>${label}</span></label>`;
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
      <div><dt>安全路径</dt><dd>${onboarding.safety_disposition.disposition} / ${onboarding.safety_disposition.severity}</dd></div>
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
    <form class="perspective-card perspective-card--${kind}" data-perspective-form="${kind}">
      <input type="hidden" name="perspectiveKind" value="${kind}">
      <div class="perspective-heading">
        <span class="perspective-icon" aria-hidden="true">${kind === 'child' ? '孩' : '亲'}</span>
        <div><p class="eyebrow">${title}</p>
        <h2>${label}</h2>
        </div>
      </div>
      <label>
        <span>用自己的话描述 <small>这是一段视角记录，不是事实判定</small></span>
        <textarea name="responseText" rows="5" required>${value}</textarea>
      </label>
      <label>
        <span>观察关键词 <small>可选，用逗号分隔</small></span>
        <input name="selectedSignals" value="${signalValue}" aria-label="结构化观察标签">
      </label>
      <div class="contract-strip" aria-label="记录边界">
        <span>Perspective != Fact</span>
        <span>E1 Self Report</span>
        <span>服务端安全策略</span>
      </div>
      <button class="secondary-action" type="submit">保存${kind === 'child' ? '孩子' : '父母'}视角 <span aria-hidden="true">→</span></button>
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
      <p class="boundary-note">这是基于目前信息形成的解释性工作画像，不是事实判定。</p>
      <div class="contract-strip" aria-label="画像边界">
        <span>Evidence 支持 Profile</span>
        <span>Evidence 本身不是 Profile</span>
        <span>不生成优先级</span>
        <span>不触发自动行动</span>
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

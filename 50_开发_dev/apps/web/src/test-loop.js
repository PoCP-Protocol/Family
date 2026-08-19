// @ts-nocheck
// Family / 伐木累 visual shell. Historical `bangyang-reference` paths preserve the supplied source evidence.
import { mountTeacherSupplyView } from './teacher-supply-view.js';
/**
 * @typedef {{ apiBaseUrl: string, familyId: string, onboardingId?: string, initialPage?: string, firstSliceApiMode?: 'disabled'|'synthetic-api', coreGrowthApiMode?: 'disabled'|'synthetic-api', platformSurfacesApiMode?: 'disabled'|'synthetic-api', commerceCatalogApiMode?: 'disabled'|'synthetic-api', membershipProjectionApiMode?: 'disabled'|'synthetic-api', serviceRecordsApiMode?: 'disabled'|'synthetic-api', authToken?: string, authActorId?: string }} TestLoopConfig
 */
/** @type {TestLoopConfig} */
export const defaultTestLoopConfig = {
  apiBaseUrl: 'http://localhost:3000',
  familyId: '22222222-2222-4222-8222-222222222222',
  // Disabled unless an internal synthetic/dev harness opts in. No production
  // identity, token or fallback task is embedded in the static visual shell.
  firstSliceApiMode: 'disabled',
  // UI-02..UI-10 only load synthetic Family Growth OS data when a DEV harness opts in.
  coreGrowthApiMode: 'disabled',
  // UI-11..UI-34 share a separate opt-in DEV-only platform projection.
  platformSurfacesApiMode: 'disabled',
  // UI-13 may additionally read an admitted, family-scoped content directory; it never creates commercial state.
  commerceCatalogApiMode: 'disabled',
  // UI-18 reads a family-private service scope only; it never renews, refunds, grants, consumes, or changes benefits.
  membershipProjectionApiMode: 'disabled',
  // UI-24 reads family-private support records only; it never changes requests, schedules, notifications, payments, or services.
  serviceRecordsApiMode: 'disabled',
};

const ICONS = { assessment: '🛡', task: '✓', child: '🎮', rank: '🏆', report: '📘', assistant: '🤖', invite: '🎁', group: '👥', points: '🪙', goods: '👜', member: '👤', plan: '📋', class: '📖', activity: '🎪' };
const tap = (action, label, cls = '') => `<button class="by-btn ${cls}" data-by="${action}">${label}</button>`;
const mini = (action, icon, title, note = '') => `<button class="by-mini" data-by="${action}"><b>${icon}</b><span>${title}</span>${note ? `<small>${note}</small>` : ''}</button>`;
const card = (title, note, action, art = 'blue') => `<button class="by-content-card" data-by="${action}"><div class="by-art ${art}"></div><strong>${title}</strong><small>${note}</small></button>`;

/** Family / 伐木累 34-page visual SSOT → stable route mapping. Asset/source IDs remain legacy-traceable elsewhere. */
export const FAMILY_UI_34_ROUTE_MANIFEST = Object.freeze([
  ['UI-01', 'home'], ['UI-02', 'growth-assessment'], ['UI-03', 'assessment'], ['UI-04', 'core-report'],
  ['UI-05', 'core-plan'], ['UI-06', 'core-community'], ['UI-07', 'core-mine'], ['UI-08', 'growth-report'],
  ['UI-09', 'growth-daily-task'], ['UI-10', 'growth-child'], ['UI-11', 'growth-ranking'], ['UI-12', 'growth-poster'],
  ['UI-13', 'commerce-mall'], ['UI-14', 'commerce-product'], ['UI-15', 'commerce-invite'], ['UI-16', 'commerce-group'],
  ['UI-17', 'commerce-points'], ['UI-18', 'commerce-mine'], ['UI-19', 'teacher-zone'], ['UI-20', 'teacher-detail'],
  ['UI-21', 'consultation-booking'], ['UI-22', 'salon-list'], ['UI-23', 'activity-detail'], ['UI-24', 'service-mine'],
  ['UI-25', 'parent-community'], ['UI-26', 'publish-dynamic'], ['UI-27', 'dynamic-detail'], ['UI-28', 'my-community'],
  ['UI-29', 'growth-outcomes'], ['UI-30', 'annual-member-mine'], ['UI-31', 'my-services'], ['UI-32', 'orders-assets'],
  ['UI-33', 'family-profile'], ['UI-34', 'service-records'],
]);
const FAMILY_UI_34_ROUTE_SET = new Set(FAMILY_UI_34_ROUTE_MANIFEST.map(([, route]) => route));
/** Researched support experience; intentionally outside the immutable supplied 34-screen manifest. */
const FAMILY_SUPPORT_ROUTE_SET = new Set(['growth-camp-21']);
const FAMILY_UI_ID_BY_ROUTE = Object.freeze({ ...Object.fromEntries(FAMILY_UI_34_ROUTE_MANIFEST.map(([uiId, route]) => [route, uiId])), 'growth-camp-21': 'UI-35' });

/** @param {HTMLElement} root @param {TestLoopConfig} config */
export function createTestLoopApp(root, config = defaultTestLoopConfig) {
  let page = (FAMILY_UI_34_ROUTE_SET.has(config.initialPage) || FAMILY_SUPPORT_ROUTE_SET.has(config.initialPage)) ? config.initialPage : 'home';
  let checked = [false, false, false];
  let currentNeed = '亲子沟通';
  let llmTextEquivalent = '';
  /** @type {any | null} */
  let familyTodayProjection = null;
  let firstSliceLoadState = 'IDLE';
  let firstSliceResultState = '';
  let firstSliceNextHint = '';
  /** @type {any | null} */
  let coreGrowthProjection = null;
  let coreGrowthLoadState = 'IDLE';
  let coreGrowthNoopReceipt = '';
  /** @type {any | null} */
  let reportExplanationProjection = null;
  /** @type {any | null} */
  let planPreviewProjection = null;
  let planPreviewRefreshState = '';
  /** @type {any | null} */
  let serviceJourneyProjection = null;
  let serviceJourneyLoadState = 'IDLE';
  let privateCheckinDraftState = '';
  /** @type {any | null} */
  let growthProfileReadbackProjection = null;
  /** @type {any | null} */
  let familyReviewReadbackProjection = null;
  let growthReadbackLoadState = 'IDLE';
  /** @type {any | null} */
  let platformSurfacesProjection = null;
  let platformSurfacesLoadState = 'IDLE';
  let platformSurfacesNoopReceipt = '';
  /** @type {any[] | null} */
  let commerceCatalogProjection = null;
  let commerceCatalogLoadState = 'IDLE';
  /** @type {{ product_ref: string, product_version?: number, title: string } | null} */
  let selectedCatalogItem = null;
  let detailInterestState = '';
  let familyStudyGroupDraftState = '';
  let familyInvitationDraftState = '';
  let familySharingDraftState = '';
  let familyExpressionNotesState = '';
  let renewalInterestDraftState = '';
  let expertLiveSessionState = '';
  /** @type {any | null} */
  let expertLiveSessionProjection = null;
  /** @type {any | null} */
  let membershipProjection = null;
  let membershipProjectionLoadState = 'IDLE';
  /** @type {{ service_offering_ref: string, title: string, service_type?: string | null, age_band?: string | null, next_available_channel?: string | null, next_available_at?: string | null, availability_status?: string | null } | null} */
  let selectedSupportTopic = null;
  /** @type {{ activity_ref: string, title: string, summary: string, age_hint: string } | null} */
  let selectedGrowthActivity = null;
  /** @type {{ exchange_ref: string, title: string, summary: string, topic: string } | null} */
  let selectedLearningExchange = null;
  let consultationNeedDraftState = '';
  /** @type {any | null} */
  let familySupportRecordsProjection = null;
  let familySupportRecordsLoadState = 'IDLE';
  const llmActionRoutes = {
    'llm-growth-assessment': ['UI-02', 'assessment'],
    'llm-core-report': ['UI-04', 'core-plan'],
    'llm-daily-task': ['UI-09', 'growth-child'],
    'llm-commerce-group': ['UI-16', 'commerce-group'],
    'llm-teacher-booking': ['UI-21', 'consultation-booking'],
    'llm-activity': ['UI-23', 'service-mine'],
    'llm-community-publish': ['UI-26', 'publish-dynamic'],
    'llm-my-services': ['UI-31', 'family-profile'],
  };
  const commerceActionRoutes = {
    'commerce-submit-intent': { pageId: 'UI-14', productRef: 'PRODUCT_PARENT_CHILD_CAMP', productVersion: 1, nextPage: 'orders-assets' },
    'commerce-load-customer-assets': { pageId: null, productRef: null, productVersion: null, nextPage: 'orders-assets' },
  };
  const serviceBookingActionRoutes = {
    'service-submit-booking': { pageId: 'UI-21', serviceOfferingRef: 'SERVICE_PARENT_CHILD_PRIMARY', serviceOfferingVersion: 1, availabilitySlotRef: 'SLOT_PRIMARY', nextPage: 'service-mine' },
    'service-load-customer-projection': { pageId: null, serviceOfferingRef: null, serviceOfferingVersion: null, availabilitySlotRef: null, nextPage: 'service-mine' },
  };
  const experienceActionRoutes = {
    'experience-create-invite': { pageId: 'UI-15', action: 'CREATE_INVITE', fixtureRef: 'CAMPAIGN_FAMILY_MOMENTS', nextPage: 'commerce-mine' },
    'experience-create-group': { pageId: 'UI-16', action: 'CREATE_GROUP', fixtureRef: 'GROUP_PARENT_CHILD_CAMP', nextPage: 'commerce-mine' },
    'experience-create-booking': { pageId: 'UI-21', action: 'CREATE_BOOKING', fixtureRef: 'TEACHER_LI_SLOT_2025_05_21_1000', channel: 'VIDEO', nextPage: 'service-mine' },
    'experience-create-event': { pageId: 'UI-23', action: 'CREATE_EVENT', fixtureRef: 'EVENT_PARENT_CHILD_SALON_2025_05_25', nextPage: 'service-mine' },
    'experience-publish-template': { pageId: 'UI-26', action: 'PUBLISH_TEMPLATE', fixtureRef: 'POST_TEMPLATE_GROWTH_CARD', nextPage: 'my-community' },
    'experience-load-assets': { pageId: 'UI-32', action: null, fixtureRef: null, nextPage: 'orders-assets' },
    'experience-create-renewal-interest': { pageId: 'UI-30', action: 'CREATE_RENEWAL_INTEREST', fixtureRef: 'RENEWAL_INTENT_FAMILY_GROWTH', nextPage: 'annual-member-mine' },
    'experience-enter-expert-live': { pageId: 'UI-01', action: 'ENTER_EXPERT_LIVE', fixtureRef: 'EXPERT_LIVE_SESSION_FAMILY_GUIDANCE', nextPage: 'teacher-zone' },
  };
  const firstSliceApiEnabled = () => config.firstSliceApiMode === 'synthetic-api';
  const coreGrowthApiEnabled = () => config.coreGrowthApiMode === 'synthetic-api';
  const platformSurfacesApiEnabled = () => config.platformSurfacesApiMode === 'synthetic-api';
  const commerceCatalogApiEnabled = () => config.commerceCatalogApiMode === 'synthetic-api';
  const membershipProjectionApiEnabled = () => config.membershipProjectionApiMode === 'synthetic-api';
  const familySupportRecordsApiEnabled = () => config.serviceRecordsApiMode === 'synthetic-api';
  const firstSliceHeaders = (correlationId, write = false) => ({
    ...(write ? { 'content-type': 'application/json' } : {}),
    'x-correlation-id': correlationId,
    ...(write ? { 'idempotency-key': correlationId, 'x-source': 'ui-01-ui-09-first-slice' } : {}),
    ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}),
    ...(config.authActorId ? { 'x-actor-id': config.authActorId } : {}),
  });
  const productCopy = (value) => String(value || '')
    .replace(/\bDEV\b\s*/gi, '')
    .replace(/\bSYNTHETIC(?:_[A-Z_]+)?\b\s*/gi, '')
    .replace(/\bNOOP(?:_NOT_INVOKED)?\b\s*/gi, '')
    .replace(/\bno-op\b\s*/gi, '')
    .replace(/外部效果(?:保持)?/g, '')
    .replace(/测试数据/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/：\s*[。；]/g, '。')
    .trim();
  const coreGrowthProductContent = {
    'UI-02': { title: '家庭成长测评', summary: '从一次测评开始，了解你当下更关注的成长方向。', next: '开始家庭测评' },
    'UI-03': { title: '成长说明', summary: '根据你的选择，整理家庭互动的参考内容。', next: '查看成长说明' },
    'UI-04': { title: '家庭成长报告', summary: '回顾关键时刻，找到可以慢慢练习的地方。', next: '查看 90 天成长计划' },
    'UI-05': { title: '90 天成长计划', summary: '把关注的方向拆成容易开始、可以坚持的小行动。', next: '查看今天的行动' },
    'UI-06': { title: '成长陪伴', summary: '跟随每周的节奏，给家庭多一点稳定的陪伴。', next: '继续今天的行动' },
    'UI-07': { title: '我的成长服务', summary: '在这里查看正在进行的计划和陪伴内容。', next: '继续成长计划' },
    'UI-08': { title: '成长回顾', summary: '留存过程中的小发现，为下一步提供参考。', next: '继续成长计划' },
    'UI-10': { title: '成长小助手', summary: '为孩子准备轻松、有趣的成长小练习。', next: '挑选一个小练习' },
    'UI-35': { title: '21 天智慧父母成长营', summary: '每天一个小行动，让亲子沟通从温和的陪伴开始。', next: '记录今天的行动' },
  };
  const platformProductContent = {
    'UI-11': '成长旅程', 'UI-12': '成长故事', 'UI-13': '成长好物', 'UI-14': '课程与工具',
    'UI-15': '邀请同行', 'UI-16': '一起参与', 'UI-17': '成长积分', 'UI-18': '我的服务',
    'UI-19': '专家陪伴', 'UI-20': '专家介绍', 'UI-21': '咨询预约', 'UI-22': '主题活动',
    'UI-23': '亲子活动', 'UI-24': '服务进度', 'UI-25': '家长社群', 'UI-26': '分享此刻',
    'UI-27': '成长动态', 'UI-28': '我的分享', 'UI-29': '成长回顾', 'UI-30': '会员服务',
    'UI-31': '我的服务', 'UI-32': '已购内容', 'UI-33': '家庭资料', 'UI-34': '服务记录',
  };
  const firstSlicePanel = (surface) => {
    if (!firstSliceApiEnabled()) return '';
    if (firstSliceLoadState === 'LOADING') return `<output class="by-first-slice-panel" data-first-slice-surface="${surface}">正在读取今日家庭任务…</output>`;
    if (firstSliceLoadState === 'ERROR') return `<output class="by-first-slice-panel is-blocked" data-first-slice-surface="${surface}">今日任务暂时无法加载，请稍后再试。</output>`;
    if (!familyTodayProjection) return '';
    if (!familyTodayProjection.today_task) return `<output class="by-first-slice-panel" data-first-slice-surface="${surface}">当前没有可打卡的今日任务。</output>`;
    const task = familyTodayProjection.today_task;
    const status = firstSliceResultState === 'SUCCESS' || firstSliceResultState === 'REPLAYED'
      ? `今天的行动已记录，明天继续。${firstSliceNextHint ? ` ${firstSliceNextHint}` : ''}`
      : task.task_state === 'CHECKED_IN' ? '今天的任务已经完成，做得很好。' : `当前任务：${task.assignment_text}`;
    return `<output class="by-first-slice-panel" data-first-slice-surface="${surface}" data-first-slice-task="${task.task_id}" data-first-slice-state="${task.task_state}">${status}</output>`;
  };
  const familyActionReviewLink = () => {
    if (!coreGrowthApiEnabled() || coreGrowthLoadState !== 'READY') return '';
    const review = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-08')?.action_review;
    if (!review) return '';
    return `<section class="by-action-review-link" data-ui08-action-review-state="${review.state}"><p>今天的行动已记录。想花一分钟回想一下这次陪伴吗？</p><button class="by-btn full-primary" data-by="ui09-open-family-review">查看家庭回顾</button></section>`;
  };
  const weeklyPlanActionContext = () => {
    if (!coreGrowthApiEnabled() || coreGrowthLoadState !== 'READY') return '';
    const handoff = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-05')?.plan_preview?.weekly_action_handoff;
    if (!handoff || handoff.state !== 'OPENED') return '';
    return `<section class="by-weekly-action-context" data-ui05-weekly-action-state="${handoff.state}"><small>本周计划提醒</small><h2>${handoff.label}</h2><p>${handoff.action}</p><span>如果不方便：${handoff.fallback}</span><em>今天的任务仍以本页当前安排为准。</em></section>`;
  };
  const coreGrowthPanel = (surface) => {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return `<output class="by-first-slice-panel" data-core-growth-surface="${surface}">正在准备你的成长内容…</output>`;
    if (coreGrowthLoadState === 'ERROR') return `<output class="by-first-slice-panel is-blocked" data-core-growth-surface="${surface}">内容暂时无法加载，请稍后再试。</output>`;
    const card = coreGrowthProjection?.cards?.find((item) => item.surface === surface);
    if (!card) return '';
    const persistedReceipt = coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === surface);
    const receipt = coreGrowthNoopReceipt
      ? ` ${coreGrowthNoopReceipt}`
      : persistedReceipt ? ' 已记录本次成长行动。' : '';
    const content = coreGrowthProductContent[surface] || { title: productCopy(card.title), summary: productCopy(card.summary), next: productCopy(card.next_hint) };
    return `<output class="by-first-slice-panel" data-core-growth-surface="${surface}" data-core-growth-state="${card.state}" data-growth-loop="${card.loop || 'GROWTH_LOOP'}" data-business-capability="${card.business_capability || ''}" data-primary-objects="${(card.primary_objects || []).join(',')}"><b>${content.title}</b>：${content.summary} 下一步：${content.next}${receipt}</output><button class="by-btn ghost by-core-growth-refresh" data-by="dev-core-refresh" aria-label="刷新成长内容">刷新内容</button><button class="by-btn ghost by-core-growth-noop" data-by="dev-core-noop" data-core-growth-command="${card.command.name}" data-core-growth-surface="${surface}" aria-label="记录本次成长行动">记录行动</button>`;
  };
  async function requestUi04Ui05Projections() {
    if (!coreGrowthApiEnabled() || !config.onboardingId) return;
    const headers = { 'x-correlation-id': `family-ui04-ui05-${Date.now()}`, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) };
    try {
      const [reportResponse, planResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/report-explanation`, { credentials: config.authToken ? 'omit' : 'include', headers }),
        fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/plan-preview`, { credentials: config.authToken ? 'omit' : 'include', headers }),
      ]);
      const [report, plan] = await Promise.all([reportResponse.json(), planResponse.json()]);
      if (!reportResponse.ok || !planResponse.ok) throw new Error('ui04_ui05_projection_unavailable');
      reportExplanationProjection = report;
      planPreviewProjection = plan;
    } catch (_error) {
      reportExplanationProjection = null;
      planPreviewProjection = null;
    }
  }

  async function refreshUi05PlanPreview() {
    if (!coreGrowthApiEnabled() || !config.onboardingId) return null;
    const idempotencyKey = `family-ui05-plan-preview-${config.familyId}-${config.onboardingId}`;
    const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/plan-preview/refresh`, {
      method: 'POST', credentials: config.authToken ? 'omit' : 'include',
      headers: { 'content-type': 'application/json', 'x-correlation-id': idempotencyKey, 'idempotency-key': idempotencyKey, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
      body: JSON.stringify({ source_insight_version: 'GROWTH_INSIGHT_V1' }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || payload?.code || 'ui05_plan_preview_refresh_failed');
    planPreviewProjection = payload;
    planPreviewRefreshState = payload?.replayed ? 'REPLAYED' : 'REFRESHED';
    return payload;
  }

  async function requestUi06ServiceJourney() {
    if (!coreGrowthApiEnabled() || !config.onboardingId || serviceJourneyLoadState === 'LOADING') return serviceJourneyProjection;
    const correlationId = `family-ui06-service-journey-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    serviceJourneyLoadState = 'LOADING';
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/service-journey`, {
        credentials: config.authToken ? 'omit' : 'include',
        headers: { 'x-correlation-id': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
      });
      const payload = await response.json();
      if (!response.ok || payload?.family_id !== config.familyId || payload?.onboarding_id !== config.onboardingId || payload?.visibility !== 'FAMILY_PRIVATE') throw new Error('ui06_service_journey_unavailable');
      serviceJourneyProjection = payload;
      serviceJourneyLoadState = 'READY';
      return payload;
    } catch (_error) {
      serviceJourneyProjection = null;
      serviceJourneyLoadState = 'ERROR';
      return null;
    }
  }

  async function createUi06PrivateCheckinDraft(actionRef = 'WEEKLY_ACTION_SEE') {
    if (!coreGrowthApiEnabled() || !config.onboardingId) return null;
    const idempotencyKey = `family-ui06-private-checkin-${config.familyId}-${config.onboardingId}-${actionRef}`;
    const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/service-journey/checkin-drafts`, {
      method: 'POST',
      credentials: config.authToken ? 'omit' : 'include',
      headers: { 'content-type': 'application/json', 'x-correlation-id': idempotencyKey, 'idempotency-key': idempotencyKey, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
      body: JSON.stringify({ action_ref: actionRef }),
    });
    const payload = await response.json();
    if (!response.ok || payload?.external_effect !== false || payload?.ontology_write !== false || payload?.draft_kind !== 'PRIVATE_CHECKIN_DRAFT') throw new Error(payload?.message || payload?.code || 'ui06_private_checkin_draft_failed');
    privateCheckinDraftState = payload?.state || 'CREATED';
    serviceJourneyLoadState = 'IDLE';
    await requestUi06ServiceJourney();
    return payload;
  }

  async function requestUi07Ui08Readbacks() {
    if (!coreGrowthApiEnabled() || !config.onboardingId || growthReadbackLoadState === 'LOADING') return;
    const correlationId = `family-ui07-ui08-readback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    growthReadbackLoadState = 'LOADING';
    try {
      const headers = { 'x-correlation-id': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) };
      const [profileResponse, reviewResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/growth-profile-readback`, { credentials: config.authToken ? 'omit' : 'include', headers }),
        fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/onboardings/${config.onboardingId}/family-review-readback`, { credentials: config.authToken ? 'omit' : 'include', headers }),
      ]);
      const [profile, review] = await Promise.all([profileResponse.json(), reviewResponse.json()]);
      if (!profileResponse.ok || !reviewResponse.ok || profile?.family_id !== config.familyId || review?.family_id !== config.familyId || profile?.visibility !== 'FAMILY_PRIVATE' || review?.visibility !== 'FAMILY_PRIVATE') throw new Error('ui07_ui08_readback_unavailable');
      growthProfileReadbackProjection = profile;
      familyReviewReadbackProjection = review;
      growthReadbackLoadState = 'READY';
    } catch (_error) {
      growthProfileReadbackProjection = null;
      familyReviewReadbackProjection = null;
      growthReadbackLoadState = 'ERROR';
    }
  }

  async function requestCoreGrowthProjection() {
    if (!coreGrowthApiEnabled() || coreGrowthLoadState === 'LOADING') return coreGrowthProjection;
    const correlationId = `family-dev-core-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    coreGrowthLoadState = 'LOADING';
    root.dataset.familyCoreGrowthStatus = 'LOADING';
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/dev/core-growth`, {
        method: 'GET', credentials: config.authToken ? 'omit' : 'include', headers: { 'x-correlation-id': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
      });
      const payload = await response.json();
      if (!response.ok || payload?.family_id !== config.familyId || payload?.data_source !== 'SYNTHETIC_DEV_ONLY' || !Array.isArray(payload?.cards)) throw new Error('dev_core_growth_projection_unavailable');
          coreGrowthProjection = payload; await Promise.all([requestUi04Ui05Projections(), requestUi06ServiceJourney(), requestUi07Ui08Readbacks()]); coreGrowthLoadState = 'READY';
      root.dataset.familyCoreGrowthStatus = 'READY';
      llmTextEquivalent = '成长内容已更新。你可以根据当前情况选择下一步行动。';
      return payload;
    } catch (_error) {
      coreGrowthProjection = null;
      coreGrowthLoadState = 'ERROR';
      root.dataset.familyCoreGrowthStatus = 'ERROR';
      llmTextEquivalent = '成长内容暂时无法加载，请稍后再试。';
      return null;
    }
  }
  async function submitCoreGrowthNoop(surface, command, selection = '') {
    const correlationId = `family-dev-core-noop-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (!coreGrowthApiEnabled()) return null;
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/dev/flow-events`, {
        method: 'POST', credentials: config.authToken ? 'omit' : 'include',
        headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, 'idempotency-key': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
        body: JSON.stringify({ ui_id: surface, command, ...(selection ? { selection } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.event_state !== 'DEV_CONFIRMED' || payload?.external_effect !== false || payload?.data_source !== 'SYNTHETIC_DEV_ONLY') throw new Error('dev_core_growth_receipt_failed');
      coreGrowthNoopReceipt = '本次成长行动已记录。';
      root.dataset.familyCoreGrowthNoop = payload.event_state;
      return payload;
    } catch (_error) {
      coreGrowthNoopReceipt = '本次行动暂时无法记录，请稍后再试。';
      root.dataset.familyCoreGrowthNoop = 'CLIENT_FAILURE';
      return null;
    }
  }
  const familyContentCatalogPanel = () => {
    if (!commerceCatalogApiEnabled()) return '';
    if (commerceCatalogLoadState === 'LOADING') return `<section class="by-family-content-catalog" data-ui13-catalog-state="LOADING">正在准备可了解的内容…</section>`;
    if (commerceCatalogLoadState === 'ERROR') return `<section class="by-family-content-catalog is-blocked" data-ui13-catalog-state="ERROR">内容目录暂时无法加载，请稍后再试。</section>`;
    if (!commerceCatalogProjection) return '';
    const items = commerceCatalogProjection.slice(0, 3);
    const list = items.length
      ? `<ol>${items.map((item) => `<li data-ui13-catalog-item="${item.product_ref}"><b>${item.title}</b><span>可以先了解内容，再决定是否继续。</span><button class="by-btn by-btn-ghost" data-by="ui13-open-catalog-item" data-ui13-catalog-item="${item.product_ref}">了解一下</button></li>`).join('')}</ol>`
      : '<p class="by-catalog-empty">暂时还没有适合在这里展示的内容。你可以过一会儿再来看看。</p>';
    return `<section class="by-family-content-catalog" data-platform-surface="UI-13" data-ui13-catalog-state="READY"><small>家庭内容目录</small><h2>从这些内容慢慢了解</h2><p>每个家庭都有自己的节奏，你可以先看看，再决定要不要继续。</p>${list}</section>`;
  };
  const personalGrowthJourneyPanel = (card) => {
    const journey = card?.personal_growth_journey;
    if (!journey) return '';
    const entries = journey.entries.length
      ? `<ol>${journey.entries.map((entry) => `<li data-ui11-event="${entry.event_id}"><b>${entry.label}</b><span>${entry.detail}</span></li>`).join('')}</ol>`
      : '<p class="by-journey-empty">还没有留下过程记录。可以先从一个想关注的小事开始。</p>';
    return `<section class="by-personal-growth-journey" data-platform-surface="UI-11" data-ui11-journey-state="${journey.state}"><small>我们的成长旅程</small><h2>${journey.headline}</h2>${entries}<div><button class="by-btn by-btn-ghost" data-by="ui11-open-plan">查看 90 天成长计划</button><button class="by-btn by-btn-ghost" data-by="ui11-open-private-story">看看家庭故事</button><button class="by-btn full-primary" data-by="ui11-open-family-review">查看家庭回顾</button></div></section>`;
  };
  const privateGrowthStoryPanel = (card) => {
    const story = card?.private_growth_story;
    if (!story) return '';
    const moments = story.moments.length
      ? `<ol>${story.moments.map((moment, index) => `<li data-ui12-moment="${index + 1}">${moment}</li>`).join('')}</ol>`
      : '<p class="by-story-empty">这里会慢慢留下属于我们家的过程片段。</p>';
    return `<section class="by-private-growth-story" data-platform-surface="UI-12" data-ui12-story-state="${story.state}"><small>家庭私有回看</small><h2>${story.title}</h2><p>${story.summary}</p>${moments}<button class="by-btn full-primary" data-by="ui12-return-growth-journey">回到成长旅程</button></section>`;
  };
  const familySelfRecordPanel = (card) => {
    const record = card?.family_self_record;
    if (!record) return '';
    return `<section class="by-family-self-record" data-platform-surface="UI-17" data-ui17-self-record-state="${record.state}"><small>家庭小记</small><h2>${record.headline}</h2><p>${record.confirmation}</p><article>${record.pause_hint}</article><div><button class="by-btn by-btn-ghost" data-by="ui17-open-family-review">查看家庭回顾</button><button class="by-btn full-primary" data-by="ui17-continue-daily-action">继续今天的行动</button></div></section>`;
  };
  const familyGrowthActivityCatalogPanel = (card) => {
    const catalog = card?.family_growth_activity_catalog;
    if (!catalog) return '';
    const activities = catalog.activities?.length
      ? `<ol>${catalog.activities.map((activity) => `<li data-ui22-activity-ref="${activity.activity_ref}"><b>${activity.title}</b><span>${activity.summary}</span><em>${activity.age_hint}</em><button class="by-btn by-btn-ghost" data-by="ui22-open-activity-detail" data-ui22-activity-ref="${activity.activity_ref}">查看活动说明</button></li>`).join('')}</ol>`
      : '<p>暂时还没有可以在这里了解的活动主题。可以之后再来看看。</p>';
    return `<section class="by-family-growth-activity-catalog" data-platform-surface="UI-22" data-ui22-activity-catalog-state="${catalog.state}"><small>家庭成长活动</small><h2>${catalog.headline}</h2><p>${catalog.introduction}</p>${activities}<button class="by-btn full-primary" data-by="ui22-return-support-topics">回到支持主题</button></section>`;
  };
  const familyLearningExchangeFeedPanel = (card) => {
    const feed = card?.family_learning_exchange_feed;
    if (!feed) return '';
    const entries = feed.entries?.length
      ? `<ol>${feed.entries.map((entry) => `<li data-ui25-exchange-ref="${entry.exchange_ref}"><b>${entry.title}</b><span>${entry.summary}</span><em>${entry.topic}</em><button class="by-btn by-btn-ghost" data-by="ui25-open-exchange-detail" data-ui25-exchange-ref="${entry.exchange_ref}">读读这段经验</button></li>`).join('')}</ol>`
      : '<p>暂时还没有可以在这里阅读的经验内容。可以之后再来看看。</p>';
    return `<section class="by-family-learning-exchange-feed" data-platform-surface="UI-25" data-ui25-exchange-feed-state="${feed.state}"><small>家庭成长交流</small><h2>${feed.headline}</h2><p>${feed.introduction}</p>${entries}<button class="by-btn full-primary" data-by="ui25-open-activity-catalog">看看家庭活动</button></section>`;
  };
  const familyLearningExchangeDetailPanel = () => {
    if (!selectedLearningExchange) return '';
    return `<section class="by-family-learning-exchange-detail" data-ui27-exchange-detail-state="READY" data-ui27-exchange-ref="${selectedLearningExchange.exchange_ref}"><small>一段家庭经验</small><h2>${selectedLearningExchange.title}</h2><p>${selectedLearningExchange.summary}</p><p>主题：${selectedLearningExchange.topic}</p><p>每个家庭的情况都不同，可以只把它当作一个慢慢参考的想法。</p><button class="by-btn full-primary" data-by="ui27-return-exchange-feed">回到家庭交流</button></section>`;
  };
  const platformSurfacePanel = (surface) => {
    if (surface === 'UI-13' && commerceCatalogApiEnabled()) return familyContentCatalogPanel();
    if (!platformSurfacesApiEnabled() || !surface || !/^UI-(1[1-9]|2[0-9]|3[0-4])$/.test(surface)) return '';
    if (platformSurfacesLoadState === 'LOADING') return `<output class="by-first-slice-panel" data-platform-surface="${surface}">正在准备页面内容…</output>`;
    if (platformSurfacesLoadState === 'ERROR') return `<output class="by-first-slice-panel is-blocked" data-platform-surface="${surface}">页面内容暂时无法加载，请稍后再试。</output>`;
    const card = platformSurfacesProjection?.cards?.find((item) => item.surface === surface);
    if (!card) return '';
    const persistedReceipt = platformSurfacesProjection?.recent_flow_events?.find((event) => event.ui_id === surface);
    const receipt = platformSurfacesNoopReceipt
      ? ` ${platformSurfacesNoopReceipt}`
      : persistedReceipt ? ' 已记录本次选择。' : '';
    if (surface === 'UI-11') return personalGrowthJourneyPanel(card);
    if (surface === 'UI-12') return privateGrowthStoryPanel(card);
    if (surface === 'UI-17') return familySelfRecordPanel(card);
    if (surface === 'UI-22') return familyGrowthActivityCatalogPanel(card);
    if (surface === 'UI-25') return familyLearningExchangeFeedPanel(card);
    if (surface === 'UI-27') return '';
    const title = platformProductContent[surface] || productCopy(card.title);
    return `<output class="by-first-slice-panel" data-platform-surface="${surface}" data-platform-state="${card.state}" data-growth-loop="${card.loop || 'CUSTOMER_BACKEND_LOOP'}" data-business-capability="${card.business_capability || ''}" data-primary-objects="${(card.primary_objects || []).join(',')}"><b>${title}</b>：为家庭成长提供适合的内容与支持。下一步：按自己的节奏继续探索。${receipt}</output><button class="by-btn ghost" data-by="platform-surface-refresh">刷新内容</button><button class="by-btn ghost" data-by="platform-surface-noop" data-platform-surface="${surface}" data-platform-command="${card.command.name}">记录选择</button>`;
  };
  async function requestCommerceCatalogProjection() {
    if (!commerceCatalogApiEnabled() || commerceCatalogLoadState === 'LOADING') return commerceCatalogProjection;
    const correlationId = `family-ui13-catalog-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    commerceCatalogLoadState = 'LOADING';
    root.dataset.familyCommerceCatalogStatus = 'LOADING';
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/commerce/products`, {
        method: 'GET', credentials: config.authToken ? 'omit' : 'include', headers: { 'x-correlation-id': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload?.products) || payload.products.some((item) => item?.admission_status !== 'ADMITTED' || item?.fixture_only !== true)) throw new Error('family_commerce_catalog_unavailable');
      commerceCatalogProjection = payload.products.map((item) => ({ product_ref: item.product_ref, product_version: item.product_version, title: item.title }));
      commerceCatalogLoadState = 'READY';
      root.dataset.familyCommerceCatalogStatus = 'READY';
      return commerceCatalogProjection;
    } catch (_error) {
      commerceCatalogProjection = null;
      commerceCatalogLoadState = 'ERROR';
      root.dataset.familyCommerceCatalogStatus = 'ERROR';
      return null;
    }
  }
  async function requestPlatformSurfacesProjection() {
    if (!platformSurfacesApiEnabled() || platformSurfacesLoadState === 'LOADING') return platformSurfacesProjection;
    const correlationId = `family-dev-platform-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    platformSurfacesLoadState = 'LOADING'; root.dataset.familyPlatformSurfacesStatus = 'LOADING';
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/dev/platform-surfaces`, { method: 'GET', credentials: 'include', headers: { 'x-correlation-id': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) } });
      const payload = await response.json();
      if (!response.ok || payload?.family_id !== config.familyId || payload?.data_source !== 'SYNTHETIC_DEV_ONLY' || payload?.external_effect_adapter !== 'NOOP_NOT_INVOKED' || !Array.isArray(payload?.cards)) throw new Error('dev_platform_surfaces_unavailable');
      platformSurfacesProjection = payload; platformSurfacesLoadState = 'READY'; root.dataset.familyPlatformSurfacesStatus = 'READY';
      llmTextEquivalent = '页面内容已更新。你可以继续了解和选择适合的服务。';
      return payload;
    } catch (_error) {
      platformSurfacesProjection = null; platformSurfacesLoadState = 'ERROR'; root.dataset.familyPlatformSurfacesStatus = 'ERROR';
      llmTextEquivalent = '页面内容暂时无法加载，请稍后再试。'; return null;
    }
  }
  async function submitPlatformSurfaceNoop(surface, command) {
    if (!platformSurfacesApiEnabled()) return null;
    const correlationId = `family-dev-platform-noop-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/dev/flow-events`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, 'idempotency-key': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) }, body: JSON.stringify({ ui_id: surface, command }) });
      const payload = await response.json();
      if (!response.ok || payload?.event_state !== 'DEV_CONFIRMED' || payload?.external_effect !== false || payload?.data_source !== 'SYNTHETIC_DEV_ONLY') throw new Error('dev_platform_receipt_failed');
      platformSurfacesNoopReceipt = '本次选择已记录。'; root.dataset.familyPlatformSurfaceNoop = payload.event_state; return payload;
    } catch (_error) {
      platformSurfacesNoopReceipt = '本次选择暂时无法记录，请稍后再试。'; root.dataset.familyPlatformSurfaceNoop = 'CLIENT_FAILURE'; return null;
    }
  }
  async function requestFamilyToday() {
    if (!firstSliceApiEnabled() || firstSliceLoadState === 'LOADING') return familyTodayProjection;
    const correlationId = `family-ui01-today-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    firstSliceLoadState = 'LOADING';
    root.dataset.familyTodayProjectionStatus = 'LOADING';
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/today`, {
        method: 'GET', credentials: 'include', headers: firstSliceHeaders(correlationId),
      });
      const payload = await response.json();
      if (!response.ok || !payload || payload.family_id !== config.familyId || !['READY', 'EMPTY'].includes(payload.entry_state)) {
        throw new Error('family_today_projection_unavailable');
      }
      familyTodayProjection = payload;
      firstSliceLoadState = 'READY';
      root.dataset.familyTodayProjectionStatus = payload.entry_state;
      root.dataset.familyTodayTaskId = payload.today_task?.task_id || '';
      llmTextEquivalent = payload.today_task
        ? `今日任务：${payload.today_task.assignment_text}。任务完成只表示 action/check-in，不代表教育效果。`
        : '当前没有可打卡的今日任务。';
      return payload;
    } catch (_error) {
      familyTodayProjection = null;
      firstSliceLoadState = 'ERROR';
      root.dataset.familyTodayProjectionStatus = 'ERROR';
      root.dataset.familyTodayTaskId = '';
      llmTextEquivalent = '今日任务暂时无法加载，请稍后再试。';
      return null;
    }
  }
  async function requestUi09TaskCompletion() {
    const correlationId = `family-ui09-task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (firstSliceApiEnabled()) {
      const projection = familyTodayProjection || await requestFamilyToday();
      const task = projection?.today_task;
      root.dataset.familyPageObjectsAction = 'CompleteGrowthAction';
      root.dataset.familyPageObjectsObject = task?.task_id || '';
      if (!task || !task.checkin_allowed) {
        root.dataset.familyPageObjectsStatus = 'NO_ACTION';
        llmTextEquivalent = '当前没有可完成的今日任务；未发出 check-in 请求。';
        return projection;
      }
      try {
        const actionResponse = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/tasks/${task.task_id}/check-in`, {
          method: 'POST', credentials: 'include', headers: firstSliceHeaders(correlationId, true),
          body: JSON.stringify({ completion_status: 'COMPLETED', reflection: '', occurred_at: new Date().toISOString() }),
        });
        const payload = await actionResponse.json();
        if (!actionResponse.ok || !payload?.action || !['SUCCESS', 'REPLAYED'].includes(payload?.result_state || 'SUCCESS')) {
          throw new Error('task_checkin_failed');
        }
        firstSliceResultState = payload.result_state || 'SUCCESS';
        firstSliceNextHint = payload?.next_hint?.text_key === 'REFRESH_TODAY_AFTER_CHECKIN'
          ? '稍后刷新，即可查看下一步安排。'
          : '';
        familyTodayProjection = { ...projection, today_task: payload.action, entry_state: 'READY' };
        if (coreGrowthApiEnabled()) {
          const focus = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-05')?.plan_preview?.focus
            || coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === 'UI-02')?.selection
            || 'PARENT_CHILD_COMMUNICATION';
          await submitCoreGrowthNoop('UI-09', 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', focus);
          coreGrowthLoadState = 'IDLE';
          await requestCoreGrowthProjection();
        }
        root.dataset.familyPageObjectsStatus = firstSliceResultState;
        root.dataset.familyPageObjectsObject = payload.action.task_id || task.task_id;
        llmTextEquivalent = '今天的家庭行动已记录。';
        return payload;
      } catch (_error) {
        root.dataset.familyPageObjectsStatus = 'CLIENT_FAILURE';
        root.dataset.familyPageObjectsObject = '';
        llmTextEquivalent = '当前任务暂时无法完成，请稍后再试。';
        return null;
      }
    }
    const baseUrl = `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/page-objects`;
    root.dataset.familyPageObjectsAction = 'COMPLETE_TASK';
    root.dataset.familyPageObjectsObject = '';
    try {
      const projectionResponse = await fetch(baseUrl, {
        method: 'GET', credentials: 'include', headers: { 'x-correlation-id': correlationId },
      });
      const projection = await projectionResponse.json();
      const task = Array.isArray(projection?.tasks)
        ? projection.tasks.find((item) => item?.source_page_id === 'UI-09' && item?.status === 'OPEN' && typeof item?.task_id === 'string')
        : null;
      if (!task) {
        root.dataset.familyPageObjectsStatus = 'NO_ACTION';
        llmTextEquivalent = '当前没有可完成的今日任务。你可以返回、暂停或现在先不继续。';
        return projection;
      }
      const actionResponse = await fetch(`${baseUrl}/actions`, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, 'idempotency-key': correlationId },
        body: JSON.stringify({ page_id: 'UI-09', action: 'COMPLETE_TASK', object_id: task.task_id }),
      });
      const payload = await actionResponse.json();
      const hasNoExternalEffect = payload?.external_effect === false;
      root.dataset.familyPageObjectsStatus = hasNoExternalEffect ? (payload?.status || 'CLIENT_FAILURE') : 'CLIENT_FAILURE';
      root.dataset.familyPageObjectsObject = hasNoExternalEffect ? (payload?.object_id || '') : '';
      llmTextEquivalent = hasNoExternalEffect
        ? (payload?.text_equivalent || '这项家庭行动已记录。')
        : '当前任务暂不可完成。你可以返回、暂停或现在先不继续。';
      return payload;
    } catch (_error) {
      root.dataset.familyPageObjectsStatus = 'CLIENT_FAILURE';
      root.dataset.familyPageObjectsObject = '';
      llmTextEquivalent = '当前任务暂不可完成。你可以返回、暂停或现在先不继续。';
      return null;
    }
  }
  async function requestPageExplanation(pageId) {
    const correlationId = `family-web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/llm/draft`, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
        body: JSON.stringify({ page_id: pageId }),
      });
      const payload = await response.json();
      llmTextEquivalent = payload?.text_equivalent || '当前说明暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyLlmDecision = payload?.decision || 'CLIENT_FAILURE';
      root.dataset.familyLlmTrace = payload?.audit?.trace_id || correlationId;
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前说明暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyLlmDecision = 'CLIENT_FAILURE';
      root.dataset.familyLlmTrace = correlationId;
      return null;
    }
  }
  async function requestTestExperience(routeKey) {
    const route = experienceActionRoutes[routeKey];
    const correlationId = `family-experience-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const isProjection = route.action === null;
      const url = isProjection
        ? `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/experience/customer-projection`
        : `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/experience/operations`;
      const response = await fetch(url, {
        method: isProjection ? 'GET' : 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, ...(isProjection ? {} : { 'idempotency-key': correlationId }) },
        ...(isProjection ? {} : { body: JSON.stringify({ page_id: route.pageId, action: route.action, fixture_ref: route.fixtureRef, fixture_version: 'family-34-page-test-experience.v1', ...(route.channel ? { channel: route.channel } : {}) }) }),
      });
      const payload = await response.json();
      llmTextEquivalent = payload?.text_equivalent || '当前体验回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyExperienceAction = route.action || 'READ_CUSTOMER_PROJECTION';
      root.dataset.familyExperienceStatus = payload?.status || (isProjection ? 'READ_ONLY' : 'CLIENT_FAILURE');
      root.dataset.familyExperienceOperation = payload?.operation_id || '';
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前体验回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyExperienceAction = route.action || 'READ_CUSTOMER_PROJECTION';
      root.dataset.familyExperienceStatus = 'CLIENT_FAILURE';
      root.dataset.familyExperienceOperation = '';
      return null;
    }
  }
  async function requestMembershipProjection() {
    if (!membershipProjectionApiEnabled() || membershipProjectionLoadState === 'LOADING') return membershipProjection;
    const correlationId = `family-membership-scope-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    membershipProjectionLoadState = 'LOADING';
    root.dataset.familyMembershipProjectionStatus = 'LOADING';
    try {
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/membership/customer-projection`, {
        method: 'GET', credentials: 'include', headers: firstSliceHeaders(correlationId),
      });
      if (!response.ok) throw new Error(`membership_projection_${response.status}`);
      membershipProjection = await response.json();
      membershipProjectionLoadState = 'READY';
      root.dataset.familyMembershipProjectionStatus = 'READY';
      return membershipProjection;
    } catch (_error) {
      membershipProjection = null;
      membershipProjectionLoadState = 'ERROR';
      root.dataset.familyMembershipProjectionStatus = 'ERROR';
      return null;
    }
  }
  async function requestCommerceIntent(routeKey) {
    const configuredRoute = commerceActionRoutes[routeKey];
    const route = routeKey === 'commerce-submit-intent' && selectedCatalogItem
      ? { ...configuredRoute, productRef: selectedCatalogItem.product_ref, productVersion: selectedCatalogItem.product_version || configuredRoute.productVersion }
      : configuredRoute;
    const correlationId = `family-commerce-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const isProjection = route.pageId === null;
      const response = await fetch(
        isProjection
          ? `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/commerce/customer-projection`
          : `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/commerce/order-intents`,
        {
          method: isProjection ? 'GET' : 'POST',
          credentials: config.authToken ? 'omit' : 'include',
          headers: { ...firstSliceHeaders(correlationId), 'content-type': 'application/json', ...(isProjection ? {} : { 'idempotency-key': correlationId }) },
          ...(isProjection ? {} : { body: JSON.stringify({ page_id: route.pageId, product_ref: route.productRef, product_version: route.productVersion }) }),
        },
      );
      const payload = await response.json();
      llmTextEquivalent = payload?.intent?.text_equivalent || payload?.text_equivalent || '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyCommerceAction = isProjection ? 'READ_CUSTOMER_COMMERCE_PROJECTION' : 'SUBMIT_ORDER_INTENT';
      root.dataset.familyCommerceStatus = payload?.intent?.status || (isProjection ? 'READ_ONLY' : 'CLIENT_FAILURE');
      root.dataset.familyCommerceOrderIntent = payload?.intent?.order_intent_id || '';
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyCommerceAction = route.pageId === null ? 'READ_CUSTOMER_COMMERCE_PROJECTION' : 'SUBMIT_ORDER_INTENT';
      root.dataset.familyCommerceStatus = 'CLIENT_FAILURE';
      root.dataset.familyCommerceOrderIntent = '';
      return null;
    }
  }
  const nav = () => `<nav class="by-tabbar"><button data-by="home" class="${page === 'home' ? 'on' : ''}">⌂<span>首页</span></button><button data-by="mall" class="${['mall','product','invite','group','points'].includes(page) ? 'on' : ''}">▣<span>商城</span></button><button data-by="plan" class="${['plan','task','report','child','poster'].includes(page) ? 'on' : ''}">◌<span>成长</span></button><button data-by="mine" class="${page === 'mine' ? 'on' : ''}">♙<span>我的</span></button></nav>`;
  const top = (title, action = 'back', right = '⋯') => `<header class="by-top"><button data-by="${action}" class="by-back">‹</button><strong>${title}</strong><button data-by="home" class="by-more">${right}</button></header>`;
  const shell = (title, content, noTop = false) => `<section class="by-app">${noTop ? '' : top(title)}<main class="by-screen">${content}</main>${nav()}</section>`;
  const actionBar = (left, right, la, ra) => `<div class="by-bottom-actions">${tap(la, left, 'ghost')}${tap(ra, right, 'primary')}</div>`;

  function home() { return shell('', `<header class="by-home-top"><div><small>早上好，乐乐妈妈 👋</small><strong>一起成长，一起成为更好的父母</strong></div><button data-by="mine">⋯</button></header>
    <section class="by-blue-banner"><div><b>邀请好友领成长礼包</b><span>邀请越多，奖励越多</span>${tap('invite','立即邀请','white')}</div><div class="by-family-art">👩‍👦</div></section>
    <section class="by-quick-grid">${mini('live','📺','专家直播','今晚 20:00')}${mini('assessment','🛡','家庭成长体检','了解当下需要')}${mini('points','🪙','成长积分商城','任务换奖励')}${mini('member','🛍','会员专享','专属权益')}${mini('plan','🔥','限时挑战','一起完成小目标')}${mini('invite','🎁','邀请有礼','分享成长')}</section>
    <div class="by-section-title"><strong>今日推荐</strong><button data-by="mall">更多 ›</button></div><div class="by-card-scroll">${card('21 天亲子沟通挑战营','¥199 起','product','family')}${card('家庭成长测评卡','¥39','assessment','book')}${card('亲子阅读工具包','¥69','product','yellow')}</div>
    <section class="by-growth-strip"><b>从一次家庭体检开始</b><span>看见当下 · 制定计划 · 一起成长</span>${tap('assessment','开始体检','blue-small')}</section>`, true); }
  function assessment() { const options=[['学','学习习惯','注意力不集中、作业拖拉','cyan'],['心','情绪管理','容易焦虑、暴躁脾气','orange'],['♥','亲子沟通','不愿沟通、冲突较多','rose'],['▣','手机依赖','沉迷手机、使用失控','blue'],['▥','自律能力','缺乏自律、依赖监督','green']]; return shell('家庭测评', `<section class="assessment-step-head"><b>第 2 / 5 步</b><i><em></em></i></section><section class="assessment-step-question"><h1>您孩子目前最需要改善的问题是？</h1><small>（单选）</small></section><div class="assessment-option-list">${options.map((x,i)=>`<button data-by="select-need-${i}" class="${i===2?'selected':''}"><i class="${x[3]}">${x[0]}</i><span><strong>${x[1]}</strong><small>${x[2]}</small></span>${i===2?'<b>✓</b>':''}</button>`).join('')}</div><section class="assessment-extra"><h3>补充信息 <small>（可选）</small></h3><label><span>孩子年龄/阶段</span><b>10岁（小学四年级）⌄</b></label><label><span>家庭情况</span><div><i class="selected">双亲家庭</i><i>单亲家庭</i><i>重组家庭</i></div></label><label><span>孩子性别</span><div><i class="selected">男孩</i><i>女孩</i></div></label></section>${tap('report','下一步','assessment-next')}`); }
  function report() { const chips=['亲子沟通','学习习惯','情绪管理','自律能力','手机依赖']; return shell('家庭成长报告', `<section class="by-child-info"><span>👦</span><div><b>乐乐 10 岁 / 小学四年级</b><small>测评时间：2024-05-20</small></div></section><section class="by-radar-card"><h3>成长综合评估</h3><div class="by-radar"><i>成长<br><b>回顾</b></i></div><div class="by-radar-labels">${chips.map((x,i)=>`<span>${x}<b>${72-i*3}</b></span>`).join('')}</div></section><section class="by-report-lines"><p>🟢 <b>优势</b> 亲子沟通基础不错，愿意表达想法</p><p>🟠 <b>关注</b> 自主学习仍需要更多陪伴</p><p>🟡 <b>优先建议</b> 从每天 15 分钟亲子阅读开始</p></section><section class="by-stage-path"><b>推荐成长路径</b><div><span><strong>7 天</strong>轻松启程</span><i>→</i><span><strong>30 天</strong>养成习惯</span><i>→</i><span><strong>90 天</strong>收获成长</span></div></section><div class="by-section-title"><strong>为你准备的成长路径</strong><button data-by="mall">更多 ›</button></div><div class="by-path-cards">${card('21 天沟通挑战','从每天 15 分钟开始','plan','family')}${card('亲子阅读工具包','和孩子一起读','product','book')}${card('成长活动日历','周末一起参与','plan','yellow')}</div>${tap('plan','生成我的成长计划','full-primary')}`); }
  function taskPage() { return shell('今日成长任务', `<section class="by-robot-banner"><span>🤖</span><div><b>成长管家提醒：</b><p>今天建议完成 3 个成长小任务</p></div></section><div class="by-task-list">${[['亲子沟通 15 分钟','认真倾听孩子今天的 3 件事','15 分钟'],['记录孩子情绪变化','温柔地看见孩子的感受','5 分钟'],['完成专注力小游戏','和孩子一起动动脑','10 分钟']].map((t,i)=>`<button data-by="check-${i}" class="by-task ${checked[i]?'done':''}"><b>${i+1}</b><div><strong>${t[0]}</strong><small>${t[1]}</small><em>+10 成长积分　${t[2]}</em></div><i>${checked[i]?'✓':'□'}</i></button>`).join('')}</div><section class="by-week-progress"><div><b>本周完成度</b><strong>${checked.filter(Boolean).length ? 78 : 60}%</strong></div><span><i style="width:${checked.filter(Boolean).length ? 78 : 60}%"></i></span><p>连续打卡　<b>12 天</b></p></section>${tap('poster','完成今日任务','full-primary')}`); }
  function child() { return shell('成长小助手', `<section class="by-child-hero"><div><b>Hi，乐乐小朋友！</b><p>今天又是元气满满的一天！</p></div><span>🧒</span></section><section class="by-energy"><div><b>⚡ 成长能量</b><strong>66/100 <small>Lv.3</small></strong></div><i><em></em></i></section><div class="by-kid-grid">${mini('task','🎯','专注力训练','单词学习 15 分钟')}${mini('task','📖','阅读打卡','养成阅读习惯')}${mini('poster','🌷','情绪小日记','认识我的情绪')}${mini('plan','📝','今日目标','明天再完成')}</div><section class="by-challenge"><b>🏆 今日挑战</b><p>整理书桌，阅读 20 分钟</p><span>✨ +20 能量　⭐ +10 星星　›</span></section><section class="by-rewards"><b>我的奖励</b><span>⭐ 12　🏅 3　🏆 1　🎁 2</span></section>${tap('task','开始挑战','full-primary')}`); }
  function ranking() { return shell('成长榜单', `<div class="by-segments"><b>本周</b><span>本月</span><span>同城</span><span>同班级</span></div><section class="by-podium"><article><span>🥈</span><i>👩</i><b>阳光妈妈家庭</b><small>积分 1120</small></article><article class="first"><span>👑</span><i>👩</i><b>乐乐妈妈家庭</b><small>积分 1280</small></article><article><span>🥉</span><i>👩</i><b>阳光妈妈家庭</b><small>积分 1660</small></article></section><div class="by-rank-list">${['开心爸爸家庭','小太阳妈妈家庭','聪聪妈妈家庭'].map((x,i)=>`<p><b>${i+4}</b><span>👩　${x}</span><em>连续 ${14-i} 天　 ${980-i*60}</em></p>`).join('')}</div><section class="by-my-rank"><b>我的成长旅程</b><span>和家人一起完成每一天的小行动</span></section>`); }
  function poster() { return shell('成长成果海报', `<article class="by-poster"><header><span>✦</span><b>我们一起见证孩子的成长</b></header><div class="by-poster-user">👦 乐乐　10 岁 / 小学四年级</div><h1>孩子从不愿表达，<br>到主动分享学校里的事情</h1><div class="by-poster-path"><span>成长前<br><b>很少主动分享</b></span><i>→</i><span>成长后<br><b>主动分享学校趣事</b></span></div><div class="by-poster-data"><b>连续打卡<br><strong>21 天</strong></b><b>成长收获<br><strong>+132</strong></b></div><div class="by-medals">🏅　🏆</div><footer><i>▣</i><span>扫码查看成长故事</span></footer></article><div class="by-share-row">${tap('home','分享给好友','share')}${tap('home','分享到朋友圈','share')}${tap('home','生成海报','share')}</div>`); }
  function plan() { return shell('家庭成长计划', `<section class="by-plan-header"><small>成长第 1 阶段</small><h1>21 天亲子沟通挑战营</h1><p>从认真倾听开始，让家里的每一次对话更温暖。</p><span><i></i></span><b>已完成 6 / 21 天</b></section><div class="by-section-title"><strong>今天的计划</strong><button data-by="task">查看任务 ›</button></div><div class="by-plan-list">${[['1','温柔地问候','和孩子聊聊今天的心情'],['2','亲子共读','读一个沟通小故事'],['3','晚间回顾','留下一句今天的小收获']].map(x=>`<button data-by="task"><b>${x[0]}</b><span><strong>${x[1]}</strong><small>${x[2]}</small></span><i>›</i></button>`).join('')}</div><div class="by-section-title"><strong>为你准备</strong><button data-by="mall">更多 ›</button></div><div class="by-path-cards">${card('亲子沟通微课','每天 15 分钟','product','family')}${card('家庭阅读工具包','陪孩子一起读','product','book')}</div>`); }
  function mall() { return shell('家庭成长商城', `<header class="by-home-top"><div><small>早上好，乐乐妈妈 👋</small><strong>一起成长，一起成为更好的父母</strong></div><button data-by="mine">⋯</button></header><section class="by-blue-banner"><div><b>邀请好友领成长礼包</b><span>邀请越多，奖励越多</span>${tap('invite','立即邀请','white')}</div><div class="by-family-art">👩‍👦</div></section><section class="by-quick-grid">${mini('group','👥','拼团专区','多人一起成长')}${mini('points','🪙','积分商城','任务换奖励')}${mini('product','👜','成长好物','课程·工具·服务')}${mini('invite','🎁','邀请有礼','分享成长')}</section><div class="by-section-title"><strong>今日推荐</strong><button data-by="product">更多 ›</button></div><div class="by-card-scroll">${card('21 天亲子沟通挑战营','¥199 起','product','family')}${card('家庭成长测评卡','¥39','assessment','book')}${card('亲子阅读工具包','¥69','product','yellow')}</div>`); }
  function product() { return shell('商品详情', `<section class="by-product-art"><div><h1>21 天亲子沟通挑战营</h1><p>改善亲子关系，从有效沟通开始</p></div><span>👩‍👦</span></section><section class="by-price"><strong>¥399</strong><span>原价 ¥699</span><p>拼团价 <b>¥199</b>（3 人成团）　会员价 <b>¥179</b></p></section><section class="by-benefits"><div>✓ 21 天成长训练</div><div>✓ 17 份社群陪伴</div><div>✓ 专家答疑</div><div>✓ 会员专属服务</div></section><section class="by-product-copy"><h3>你将获得</h3><p>训练营　+　打卡社群　+　顾问答疑</p></section><section class="by-share-tip">分享给 3 位家长，领取专属优惠券</section>${actionBar('立即购买','发起拼团','home','group')}`); }
  function invite() { return shell('邀请有礼', `<section class="by-invite-title"><h2>邀请 3 个家庭，解锁会员权益</h2><p>一起成长，快乐更多更长久</p></section><section class="by-invite-progress"><span>已邀请家庭</span><strong>1/3</strong><i><em></em></i><p>再邀请 <b>2</b> 个家庭即可解锁全部奖励</p></section><div class="by-reward-grid">${mini('home','📘','家庭测评 1 次','价值 ¥59')}${mini('home','🏠','成长积分 300','价值 ¥30')}${mini('home','🎟','专家答疑券','价值 ¥99')}${mini('home','🎫','会员折扣券','9 折优惠')}</div>${tap('home','立即邀请','full-primary')}<div class="by-invite-methods"><span>💬 邀请好友</span><span>◉ 朋友圈</span><span>▣ 生成海报</span></div>`); }
  function group() { return shell('拼团专区', `<div class="by-segments"><b>全部</b><span>课程服务</span><span>会员卡</span><span>工具包</span></div><div class="by-group-list">${[['90 天成长陪跑计划','¥399','还差 2 人成团'],['家庭教育会员年卡','¥499','还差 3 人成团'],['亲子习惯养成工具包','¥99','还差 1 人成团'],['专注力提升训练营','¥199','还差 2 人成团']].map(x=>`<article><h3>${x[0]}</h3><p>👩 乐乐妈妈　👩 👩　${x[2]}</p><span><s>¥799</s>　<b>拼团价 ${x[1]}</b></span>${tap('home','去拼团','orange')}</article>`).join('')}</div>`); }
  function points() { return shell('积分商城', `<section class="by-points-card"><div><small>我的成长积分</small><strong>1280</strong>${tap('home','去签到 +10','white')}</div><span>🏆</span></section><div class="by-section-title"><strong>任务中心</strong><small>做任务，赚积分</small></div><div class="by-points-tasks">${['分享测评报告','邀请好友注册','完成打卡','发布成长案例','参与直播'].map((x,i)=>`<p><b>${['▣','♙','✓','✦','◉'][i]}</b>${x}<span>+${[50,100,20,80,30][i]}</span><button data-by="home">去完成</button></p>`).join('')}</div><div class="by-section-title"><strong>积分可兑换</strong><button data-by="product">更多 ›</button></div><div class="by-exchange-grid">${[['亲子沟通书','📘'],['亲子沟通手册','📗'],['课程优惠券','🎫'],['成长阅读礼包','👜']].map(x=>`<article><b>${x[1]}</b><strong>${x[0]}</strong><small>199 积分起</small>${tap('home','立即兑换','tiny')}</article>`).join('')}</div>`); }
  function mine() { return shell('我的', `<section class="by-profile"><span>👩</span><div><b>乐乐妈妈</b><small>一起成长，一起成为更好的父母</small></div><em>成长合伙人</em></section><section class="by-stat-row">${[['已邀请家庭','12'],['拼团成交','8'],['成长积分','1280'],['可用权益','286']].map(x=>`<span><small>${x[0]}</small><b>${x[1]}</b></span>`).join('')}</section><section class="by-level"><span>我的等级　<b>LV3 成长达人</b><small>距下一等级还差 720 积分</small></span><i>👑</i></section><div class="by-menu">${[['我的订单','home'],['邀请记录','invite'],['奖励明细','points'],['专属海报','poster'],['会员权益','member'],['客服支持','home']].map(x=>`<button data-by="${x[1]}">${x[0]}<b>›</b></button>`).join('')}</div><section class="by-member-banner"><div><b>年度会员服务</b><span>有效期至 2025-05-20</span>${tap('member','会员中心','gold')}</div><i>👑</i></section>`); }
  function member() { return shell('会员中心', `<section class="by-member-banner large"><div><b>家庭成长年度会员</b><span>陪伴每一次重要的成长时刻</span>${tap('plan','查看我的计划','gold')}</div><i>👑</i></section><div class="by-benefit-list">${['90 天家庭成长计划','成长课堂精选内容','每周家庭活动','成长记录与海报','专属服务支持'].map((x,i)=>`<p><b>${['🛡','📖','🎪','📘','♡'][i]}</b><span>${x}<small>陪伴家庭持续成长</small></span><i>›</i></p>`).join('')}</div>`); }

  function home() { return shell('', `<header class="home-spec-head"><strong>家庭成长平台</strong><span><button data-by="home">···</button><button data-by="home">◉</button></span></header><section class="home-spec-welcome"><div><h1>早上好，</h1><h2>今天也一起陪孩子成长 ☀</h2></div><button data-by="home">♧</button></section><section class="home-spec-banner"><div><h1>免费家庭测评</h1><p>3 分钟了解孩子成长状况</p><small>获取更科学的成长建议</small>${tap('assessment','立即测评 →','home-spec-cta')}</div><figure aria-label="一家四口的家庭插画"><span>👨</span><span>👩</span><span>🧒</span><span>👧</span></figure></section><section class="home-spec-grid">${mini('report','⌁','AI诊断')}${mini('plan','♙','21天挑战营')}${mini('plan','▣','90天成长计划')}${mini('poster','▤','成长案例')}${mini('home','▧','专家直播')}${mini('home','♧','家庭顾问')}</section><section class="home-spec-section"><div class="home-spec-title"><strong>今日成长任务</strong><button data-by="task">查看全部 ›</button></div><div class="home-spec-tasks"><button data-by="task"><i class="task-mint">▣</i><span>亲子沟通小练习</span><b class="complete">✓</b></button><button data-by="task"><i class="task-orange">▣</i><span>完成今日阅读打卡</span><b>去完成</b></button><button data-by="task"><i class="task-orange">▣</i><span>情绪记录</span><b>去完成</b></button></div></section><section class="home-spec-section"><div class="home-spec-title"><strong>推荐内容/服务</strong><button data-by="mall">更多 ›</button></div><div class="home-spec-recommend">${card('妈妈总问我：为什么？','今天 20:00 开播','product','home-r1')}${card('高效学习习惯养成课','限时 12 课 · 1268 人学习','product','home-r2')}${card('从紧张冲突到亲子和谐','真实案例分享','product','home-r3')}</div></section>` , true); }
  function reportExplanationLiveOverlay() {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return `<output class="by-ui03-live-overlay" data-ui03-explanation-state="LOADING">正在准备你的成长内容…</output>`;
    if (coreGrowthLoadState === 'ERROR') return `<output class="by-ui03-live-overlay is-blocked" data-ui03-explanation-state="ERROR">内容暂时无法加载，请稍后再试。</output>`;
    const focus = coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === 'UI-02')?.selection || '未选择';
    return `<output class="by-ui03-live-overlay" data-ui03-explanation-state="READY" data-ui03-parent-focus="${focus}">你当前更关注：${focus}。这里整理的是帮助你了解家庭互动的参考内容，可以结合实际情况慢慢尝试。</output>`;
  }
  function assessment() {
    const hotspots = [
      ['ref-ai-back', 'growth-assessment', '返回家庭测评'],
      ['ref-ai-more', 'ui03-preview-plan', '查看解释边界'],
      ['ref-ai-plan', 'ui03-preview-plan', '生成个性化方案草稿'],
    ];
    return `<section class="by-app by-ui-reference"><div class="by-ui-reference-screen" role="img" aria-label="AI成长诊断报告：家庭上下文、五维可视化、核心关注方向、成长建议和个性化方案草稿入口" style="background-image:url('/public/bangyang-reference/ui18/core-03-ai-report.png')">${hotspots.map((item) => `<button class="by-hotspot ${item[0]}" data-by="${item[1]}" aria-label="${item[2]}"></button>`).join('')}${reportExplanationLiveOverlay()}</div></section>${coreGrowthPanel('UI-03')}`;
  }

  function homeLiveOverlay() {
    if (!firstSliceApiEnabled()) return '';
    if (firstSliceLoadState === 'LOADING') return `<output class="by-home-live-overlay" data-ui01-live-state="LOADING">正在读取今日任务…</output>`;
    if (firstSliceLoadState === 'ERROR') return `<output class="by-home-live-overlay is-blocked" data-ui01-live-state="ERROR">今日任务不可读取</output>`;
    const task = familyTodayProjection?.today_task;
    if (!task) return `<output class="by-home-live-overlay" data-ui01-live-state="EMPTY">今日暂无待办任务</output>`;
    const state = task.task_state === 'CHECKED_IN' ? '已完成' : '待完成';
    return `<output class="by-home-live-overlay" data-ui01-live-state="${task.task_state}" data-ui01-task-id="${task.task_id}">${state}：${task.assignment_text}</output>`;
  }
  function home() { return `<section class="by-app by-reference-home"><div class="by-reference-screen" role="img" aria-label="家庭成长平台首页：免费家庭测评、六项成长服务、今日成长任务、推荐内容服务和首页计划社群我的导航"><button class="by-hotspot hs-header-more" data-by="core-mine" data-ui01-feature="header_more" aria-label="更多与家庭档案"></button><button class="by-hotspot hs-header-context" data-by="home" data-ui01-feature="header_context" aria-label="家庭上下文"></button><button class="by-hotspot hs-notification" data-by="core-mine" data-ui01-feature="notification" aria-label="提醒"></button><button class="by-hotspot hs-assessment" data-by="growth-assessment" data-ui01-feature="assessment_campaign assessment_cta" aria-label="立即开始测评"></button><button class="by-hotspot hs-ai" data-by="assessment" data-ui01-feature="ai_diagnostic" aria-label="AI成长说明"></button><button class="by-hotspot hs-challenge" data-by="growth-camp-21" data-ui01-feature="challenge_21" aria-label="21天挑战营"></button><button class="by-hotspot hs-plan" data-by="core-plan" data-ui01-feature="plan_90" aria-label="90天成长计划"></button><button class="by-hotspot hs-case" data-by="poster" data-ui01-feature="growth_cases" aria-label="成长案例"></button><button class="by-hotspot hs-live" data-by="teacher-zone" data-ui01-feature="expert_live" aria-label="专家直播"></button><button class="by-hotspot hs-advisor" data-by="teacher-zone" data-ui01-feature="family_advisor" aria-label="家庭顾问"></button><button class="by-hotspot hs-tasks" data-by="growth-daily-task" data-ui01-feature="today_tasks" aria-label="今日成长任务"></button><button class="by-hotspot hs-task-communication" data-by="growth-daily-task" data-ui01-feature="task_communication" aria-label="亲子沟通小练习"></button><button class="by-hotspot hs-task-reading" data-by="growth-daily-task" data-ui01-feature="task_reading" aria-label="完成今日阅读打卡"></button><button class="by-hotspot hs-task-emotion" data-by="growth-daily-task" data-ui01-feature="task_emotion" aria-label="情绪记录"></button><button class="by-hotspot hs-card1" data-by="commerce-mall" data-ui01-feature="recommended_card_1" aria-label="看看推荐内容"></button><button class="by-hotspot hs-card2" data-by="commerce-mall" data-ui01-feature="recommended_card_2" aria-label="看看推荐内容"></button><button class="by-hotspot hs-card3" data-by="commerce-mall" data-ui01-feature="recommended_card_3" aria-label="看看推荐内容"></button><button class="by-hotspot hs-nav-home" data-by="home" data-ui01-feature="nav_home" aria-label="首页"></button><button class="by-hotspot hs-nav-plan" data-by="plan" data-ui01-feature="nav_plan" aria-label="计划"></button><button class="by-hotspot hs-nav-community" data-by="core-community" data-ui01-feature="nav_community" aria-label="社群"></button><button class="by-hotspot hs-nav-mine" data-by="core-mine" data-ui01-feature="nav_mine" aria-label="我的"></button>${homeLiveOverlay()}</div>${firstSlicePanel('UI-01')}</section>`; }
  const visualReference = (file, label, hotspots = []) => `<section class="by-app by-ui-reference"><div class="by-ui-reference-screen" role="img" aria-label="${label}" style="background-image:url('/public/bangyang-reference/ui18/${file}.png')">${hotspots.map((x) => `<button class="by-hotspot ${x[0]}" data-by="${x[1]}" aria-label="${x[2]}"></button>`).join('')}</div></section>`;
  const clearReference = (file, label, hotspots = [], ratio = '434/1124') => `<section class="by-app by-clear-reference"><div class="by-clear-reference-screen" role="img" aria-label="${label}" style="background-image:url('/public/bangyang-reference/${file}');aspect-ratio:${ratio}">${hotspots.map((x) => `<button class="by-hotspot ${x[0]}" data-by="${x[1]}" aria-label="${x[2]}"></button>`).join('')}</div></section>`;
  function familyReportLivePanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return `<section class="by-report-live-panel" data-ui04-report-state="LOADING">正在准备你的成长报告…</section>`;
    if (coreGrowthLoadState === 'ERROR') return `<section class="by-report-live-panel is-blocked" data-ui04-report-state="ERROR">成长报告暂时无法加载，请稍后再试。</section>`;
    const draft = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-04')?.report_draft;
    const projection = reportExplanationProjection;
    if (!draft && !projection) return '';
    const observations = projection?.observations?.length ? projection.observations : (draft?.observations ?? []);
    const headline = projection?.title || draft?.headline || '家庭成长报告';
    const summary = projection?.hypotheses?.[0]?.text || draft?.summary || '报告说明正在准备。';
    const focus = draft?.focus || 'PARENT_CHILD_COMMUNICATION';
    return `<section class="by-report-live-panel" data-ui04-report-state="${projection?.state || draft?.state}" data-ui04-focus="${focus}"><small>家庭成长报告 · ${projection?.ai_ready?.model_gateway_status === 'NOOP_NOT_INVOKED' ? '基于规则的说明' : '待复核'}</small><h2>${headline}</h2><p>${summary}</p><ul>${observations.map((item) => `<li><b>${item.label}</b><span>${item.detail}</span></li>`).join('')}</ul><article><b>下一步候选</b><span>${draft?.this_week_action?.when || '由家庭自行决定节奏'}</span><p>${projection?.recommendations?.[0]?.text || draft?.this_week_action?.action || '先查看 90 天计划预览。'}</p><small>这是 Perspective/Recommendation 草稿，不是诊断或效果结论。</small></article><button class="by-btn full-primary" data-by="ui04-plan-handoff">查看 90 天成长计划</button></section>`;
  }
  function familyPlanLivePanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return `<section class="by-plan-live-panel" data-ui05-plan-state="LOADING">正在准备你的 90 天成长计划…</section>`;
    if (coreGrowthLoadState === 'ERROR') return `<section class="by-plan-live-panel is-blocked" data-ui05-plan-state="ERROR">90 天成长计划暂时无法加载，请稍后再试。</section>`;
    const preview = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-05')?.plan_preview;
    const projection = planPreviewProjection;
    if (!preview && !projection) return '';
    const stages = projection?.structure?.stages?.length ? projection.structure.stages.map((stage) => ({ label: stage.label, weeks: stage.weeks, intent: stage.intent, small_action: stage.small_action })) : (preview?.stages ?? []);
    const headline = projection?.focus?.label || preview?.headline || '90 天成长计划';
    const nextAction = projection?.next_action?.text || preview?.next_action || '从本周的一件小行动开始。';
    return `<section class="by-plan-live-panel" data-ui05-plan-state="${projection?.state || preview?.state}" data-ui05-focus="${projection?.focus?.dimension_id || preview?.focus || ''}"><small>90 天成长计划 · ${projection?.model_gateway_status === 'NOOP_NOT_INVOKED' ? '受控草稿预览' : '待复核'}</small><h2>${headline}</h2><ol>${stages.map((stage) => `<li><b>${stage.label}</b><span>${stage.weeks}</span><p>${stage.intent}</p><small>${stage.small_action}</small></li>`).join('')}</ol><p class="by-plan-live-next">${nextAction}</p><small>阶段与行动是候选草稿，不会自动创建正式任务或计划。</small><button class="by-btn full-primary" data-by="ui05-open-weekly-action">查看今天的行动</button>${planPreviewRefreshState ? `<output data-ui05-refresh-state="${planPreviewRefreshState}">计划预览已更新</output>` : ''}</section>`;
  }
  function coreReport() { return `${clearReference('ai-growth-diagnosis-reference-436x1118.png', '家庭成长说明：儿童信息蓝卡、五维成长评估、核心问题、成长建议和生成个性化方案', [['clear-bottom-cta', 'ui04-plan-handoff', '查看 90 天成长计划']], '436/1118')}${familyReportLivePanel()}`; }
  function corePlan() { return `${clearReference('growth-plan-90day-reference-434x1130.png', '90天成长方案：阶段信息、3/12/36/90统计、四周时间线、任务状态和开始执行计划', [['clear-bottom-cta', 'ui05-open-weekly-action', '查看今天的行动']], '434/1130')}${familyPlanLivePanel()}`; }
  function growthCamp21() {
    const card = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-35');
    const draft = card?.curriculum_draft;
    const current = draft?.current_day || {
      day_number: 1,
      theme: '从一次认真倾听开始',
      parent_action: '选择一个日常情境，先完整听完孩子的表达，再决定怎样回应。',
      reflection_prompt: '写下你留意到的一个细节和当下的感受。',
    };
    const receipt = coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === 'UI-35');
    const stages = (draft?.stages || []).map((stage) => `<li data-ui35-stage="${stage.stage_id}"><b>${stage.label.replace(/^阶段[一二三]：/, '')}</b><span>${stage.day_range}</span><small>${stage.intent}</small></li>`).join('') || '<li data-ui35-stage="PENDING"><b>观察与连接</b><span>Day 1-7</span><small>从每天一次温和的陪伴行动开始。</small></li><li data-ui35-stage="PRACTICE"><b>沟通与练习</b><span>Day 8-14</span><small>把小行动带进熟悉的家庭时刻。</small></li><li data-ui35-stage="REVIEW"><b>回顾与延续</b><span>Day 15-21</span><small>回顾自己的行动，准备下一阶段。</small></li>';
    const receiptText = receipt ? '今天的行动已记录，明天继续。' : '完成后记得为自己点个赞。';
    const state = draft ? draft.status : 'NOT_LOADED';
    return shell('21天智慧父母成长营', `<section class="by-growth-camp-head" data-ui35-curriculum-state="${state}"><small>21 天陪伴课程 · 温和开始</small><h1>${current.theme}</h1><p>${current.parent_action}</p><span><i style="width:${Math.round((current.day_number / (draft?.day_count || 21)) * 100)}%"></i></span><b>第 ${current.day_number} / ${draft?.day_count || 21} 天</b></section><section class="by-growth-camp-stages" aria-label="课程阶段"><h2>成长路径</h2><ul>${stages}</ul></section><section class="by-growth-camp-task"><div><strong>今天的小行动</strong><small>给自己和孩子一点从容的时间</small></div><p>${current.reflection_prompt}</p><button class="by-btn full-primary" data-by="camp21-checkin" data-ui35-day="${current.day_number}">记录今天的行动</button><output data-ui35-receipt="${receipt ? 'RECORDED' : 'EMPTY'}">${receiptText}</output></section><section class="by-growth-camp-support"><b>温和提醒</b><p>每个家庭都有自己的节奏。记录下你的感受和观察，下一次可以从一个更小、更容易开始的行动继续。</p></section>${coreGrowthPanel('UI-35')}`);
  }
  function familyCompanionProgressPanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (config.onboardingId) {
      if (serviceJourneyLoadState === 'LOADING') return `<section class="by-family-companion-progress" data-ui06-service-journey-state="LOADING">正在准备家庭陪伴内容…</section>`;
      if (serviceJourneyLoadState === 'ERROR') return `<section class="by-family-companion-progress is-blocked" data-ui06-service-journey-state="ERROR">陪伴内容暂时无法加载，请稍后再试。</section>`;
      const journey = serviceJourneyProjection;
      if (journey) {
        const cards = (journey.service_cards || []).map((card) => `<li data-ui06-service-ref="${card.service_ref}" data-ui06-service-state="${card.state}"><b>${card.label}</b><span>${card.state === 'HOLD' ? '需要进一步确认后再继续' : '可在这里查看说明'}</span></li>`).join('');
        const feed = (journey.private_feed || []).length ? `<ol>${journey.private_feed.map((entry) => `<li data-ui06-private-entry="${entry.entry_id}">${entry.kind === 'CHECKIN_DRAFT' ? '已留下一个家庭小记' : '已记录一次家庭行动'}</li>`).join('')}</ol>` : '<p>这里会慢慢留下属于家庭自己的过程小记。</p>';
        const receipt = privateCheckinDraftState ? `<output data-ui06-private-draft-state="${privateCheckinDraftState}">家庭小记已留好。可以慢慢回看，之后再决定下一步。</output>` : '';
        return `<section class="by-family-companion-progress" data-ui06-service-journey-state="${journey.state}" data-ui06-visibility="${journey.visibility}"><small>本周陪跑</small><h2>${journey.process_summary.label}</h2><p>${journey.next_hint.text}</p><ul>${cards}</ul><article><b>家庭私有小记</b>${feed}</article><small>这里记录的是家庭过程，不代表成长效果或评价。</small><div><button class="by-btn by-btn-ghost" data-by="ui06-open-family-review">查看家庭回顾</button><button class="by-btn full-primary" data-by="ui06-create-private-draft">留下今天的小记</button></div>${receipt}</section>`;
      }
    }
    if (coreGrowthLoadState !== 'READY') return '';
    const progress = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-06')?.companion_progress;
    if (!progress) return '';
    return `<section class="by-family-companion-progress" data-ui06-companion-state="${progress.state}" data-ui06-focus="${progress.focus}"><small>本周陪跑</small><h2>${progress.headline}</h2><p>${progress.confirmation}</p><article>${progress.pace_hint}</article><div><button class="by-btn by-btn-ghost" data-by="ui06-open-family-review">查看家庭回顾</button><button class="by-btn full-primary" data-by="ui06-continue-daily-action">继续今天的行动</button></div></section>`;
  }
  function coreCommunity() { return `${clearReference('delivery-community-reference-458x1128.png', '陪跑服务：四张服务卡、本周完成度、成长打卡、家长交流、直播和社群导航', [['clear-fab', 'ui06-create-private-draft', '记录家庭小记']], '458/1128')}${familyCompanionProgressPanel()}`; }
  function familyGrowthProfileProgressPanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (config.onboardingId) {
      if (growthReadbackLoadState === 'LOADING') return `<section class="by-growth-profile-progress" data-ui07-profile-state="LOADING">正在整理家庭成长档案…</section>`;
      if (growthReadbackLoadState === 'ERROR') return `<section class="by-growth-profile-progress is-blocked" data-ui07-profile-state="ERROR">成长档案暂时无法加载，请稍后再试。</section>`;
      const profile = growthProfileReadbackProjection;
      if (profile) {
        const focus = profile.focus?.label || '等待家庭确认当前关注方向';
        const plan = profile.plan_context ? `已准备 ${profile.plan_context.horizon_days} 天行动预览` : '计划预览仍在准备中';
        return `<section class="by-growth-profile-progress" data-ui07-profile-state="${profile.state}" data-ui07-visibility="${profile.visibility}"><small>我们的成长档案</small><h2>${focus}</h2><p>${plan}</p><article>这里回看家庭已经确认的关注方向和过程来源，不是对孩子的评价或成长结果。</article><small>已关联 ${profile.evidence_lineage.length} 条来源记录</small><div><button class="by-btn by-btn-ghost" data-by="ui07-open-plan">查看 90 天成长计划</button><button class="by-btn full-primary" data-by="ui07-open-family-review">查看家庭回顾</button></div></section>`;
      }
    }
    if (coreGrowthLoadState !== 'READY') return '';
    const profile = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-07')?.growth_profile_progress;
    if (!profile) return '';
    return `<section class="by-growth-profile-progress" data-ui07-profile-state="${profile.state}" data-ui07-focus="${profile.focus}"><small>我们的成长档案</small><h2>${profile.headline}</h2><p>${profile.summary}</p><div><button class="by-btn by-btn-ghost" data-by="ui07-open-plan">查看 90 天成长计划</button><button class="by-btn full-primary" data-by="ui07-open-family-review">查看家庭回顾</button></div></section>`;
  }
  function coreMine() { return `${clearReference('mine-member-reference-434x1124.png', '我的会员中心：深蓝会员信息、邀请权益、功能列表、年度会员服务和四栏导航', [['clear-bottom-nav-home', 'home', '首页']], '434/1124')}${familyGrowthProfileProgressPanel()}`; }
  function assessmentEntryLiveOverlay() {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return `<output class="by-assessment-live-overlay" data-ui02-assessment-state="LOADING">正在读取测评草稿…</output>`;
    if (coreGrowthLoadState === 'ERROR') return `<output class="by-assessment-live-overlay is-blocked" data-ui02-assessment-state="ERROR">测评草稿暂不可读取</output>`;
    const saved = coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === 'UI-02');
    const selected = saved?.selection || '未选择';
    const status = saved ? '草稿已记录' : '可开始测评';
    return `<output class="by-assessment-live-overlay" data-ui02-assessment-state="${saved ? 'DRAFT_SAVED' : 'NOT_STARTED'}" data-ui02-selected-dimension="${selected}">${status}：${selected}。从你最想改善的地方开始就好。</output>`;
  }
  function growthAssessment() {
    const hotspots = [
      ['clear-entry-cta', 'ui02-start-assessment', '立即开始测评'],
      ['clear-assessment-dimension-1', 'ui02-select-dimension', '选择亲子沟通', 'PARENT_CHILD_COMMUNICATION'],
      ['clear-assessment-dimension-2', 'ui02-select-dimension', '选择学习习惯', 'LEARNING_HABITS'],
      ['clear-assessment-dimension-3', 'ui02-select-dimension', '选择情绪管理', 'EMOTION_REGULATION'],
      ['clear-assessment-dimension-4', 'ui02-select-dimension', '选择自律能力', 'SELF_REGULATION'],
      ['clear-assessment-dimension-5', 'ui02-select-dimension', '选择手机依赖', 'DEVICE_USE_CONTEXT'],
    ];
    return `<section class="by-app by-clear-reference"><div class="by-clear-reference-screen" role="img" aria-label="家庭成长体检第1步：三分钟了解孩子成长状态、五大维度和示例问题" style="background-image:url('/public/bangyang-reference/family-assessment-entry-reference-428x952.png');aspect-ratio:428/952">${hotspots.map((item) => `<button class="by-hotspot ${item[0]}" data-by="${item[1]}"${item[3] ? ` data-ui02-selection="${item[3]}"` : ''} aria-label="${item[2]}"></button>`).join('')}${assessmentEntryLiveOverlay()}</div></section>${coreGrowthPanel('UI-02')}`;
  }
  function familyActionReviewPanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (config.onboardingId) {
      if (growthReadbackLoadState === 'LOADING') return `<section class="by-family-action-review" data-ui08-review-state="LOADING">正在整理家庭过程回顾…</section>`;
      if (growthReadbackLoadState === 'ERROR') return `<section class="by-family-action-review is-blocked" data-ui08-review-state="ERROR">家庭回顾暂时无法加载，请稍后再试。</section>`;
      const review = familyReviewReadbackProjection;
      if (review) {
        const records = review.recorded_actions?.length ? `<ol>${review.recorded_actions.map((item) => `<li data-ui08-receipt="${item.receipt_id}">${item.source_ui === 'UI-06' ? '已留下家庭私有小记' : '已记录一次家庭行动'}</li>`).join('')}</ol>` : '<p>还没有需要回看的行动记录。可以按自己的节奏从一个小行动开始。</p>';
        return `<section class="by-family-action-review" data-ui08-review-state="${review.state}" data-ui08-visibility="${review.visibility}"><small>家庭成长回顾</small><h2>${review.state === 'ACTION_RECORDED' ? '已留下过程记录' : '从一次行动开始'}</h2>${records}<article><b>可以想想</b><span>${review.reflection_prompt || '这一次，我注意到了什么？这只是自己的感受和观察。'}</span></article><p class="by-review-next">${review.next_hint?.text || '可以先回到 90 天成长计划，按家庭节奏决定下一步。'}</p><small>行动记录和感受不等于成长结果或孩子评价。</small><button class="by-btn full-primary" data-by="core-plan">回到 90 天成长计划</button></section>`;
      }
    }
    if (coreGrowthLoadState !== 'READY') return '';
    const review = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-08')?.action_review;
    if (!review) return '';
    return `<section class="by-family-action-review" data-ui08-review-state="${review.state}" data-ui08-focus="${review.focus}"><small>家庭成长回顾</small><h2>${review.headline}</h2><p>${review.confirmation}</p><article><b>可以想想</b><span>${review.reflection_prompt}</span></article><p class="by-review-next">${review.next_step}</p><button class="by-btn full-primary" data-by="core-plan">回到 90 天成长计划</button></section>`;
  }
  function growthReport() { return `${visualReference('growth-02-ai-report', '家庭成长报告：综合评估、优势风险建议和推荐成长路径', [['ref-bottom-cta', 'core-plan', '生成个性化方案']])}${familyActionReviewPanel()}`; }
  function growthDailyTask() { return `${clearReference('daily-growth-task-reference-448x916.png', '今日成长任务：机器人提醒、三项任务、积分时长、本周完成度、连续打卡和完成今日任务', [['clear-bottom-cta', 'page-objects-complete-daily-task', '完成今日任务']], '448/916')}${weeklyPlanActionContext()}${firstSlicePanel('UI-09')}${familyActionReviewLink()}`; }
  function familyChildActionPromptPanel() {
    if (!coreGrowthApiEnabled() || coreGrowthLoadState !== 'READY') return '';
    const prompt = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-10')?.child_action_prompt;
    if (!prompt) return '';
    return `<section class="by-child-action-prompt" data-ui10-prompt-state="${prompt.state}" data-ui10-focus="${prompt.focus}"><small>一起试试</small><h2>${prompt.headline}</h2><p>${prompt.shared_action}</p><article>${prompt.pause_hint}</article><button class="by-btn full-primary" data-by="ui10-return-daily-action">回到今天的行动</button></section>`;
  }
  function growthChild() { return `${clearReference('growth-child-assistant-reference-448x920.png', '成长小助手：欢迎 Banner、成长能量、四色活动卡、今日挑战、奖励和开始挑战', [['clear-bottom-cta', 'growth-daily-task', '开始挑战']], '448/920')}${familyChildActionPromptPanel()}`; }
  function growthRanking() { return clearReference('growth-ranking-reference-450x918.png', '成长排行榜：筛选栏、领奖台、排名列表、个人排名与成长行动家称号，仅作原图静态视觉展示', [], '450/918'); }
  function growthPoster() { return clearReference('growth-poster-reference-444x970.png', '成长成果海报：成长故事、成长前后、连续打卡、成长值、勋章、二维码与分享方式，仅作原图静态视觉展示', [['clear-poster-share', 'home', '返回首页']], '444/970'); }
  async function requestConsultationNeedDraft() {
    const offeringRef = selectedSupportTopic?.service_offering_ref || 'SERVICE_PARENT_CHILD_PRIMARY';
    const offeringVersion = 1;
    const correlationId = `family-ui21-need-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const slotsResponse = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/slots?service_offering_ref=${encodeURIComponent(offeringRef)}&service_offering_version=${offeringVersion}`, {
        method: 'GET', credentials: 'include', headers: firstSliceHeaders(correlationId),
      });
      const slotsPayload = await slotsResponse.json();
      const slot = Array.isArray(slotsPayload?.slots) ? slotsPayload.slots.find((item) => item?.status === 'AVAILABLE') : null;
      if (!slotsResponse.ok || !slot?.availability_slot_ref) throw new Error('family_consultation_slot_unavailable');
      const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/booking-requests`, {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, 'idempotency-key': correlationId, ...(config.authToken ? { authorization: `Bearer ${config.authToken}` } : {}) },
        body: JSON.stringify({ page_id: 'UI-21', service_offering_ref: offeringRef, service_offering_version: offeringVersion, availability_slot_ref: slot.availability_slot_ref, attributes: { entry: 'family_support_explanation' } }),
      });
      const payload = await response.json();
      const accepted = response.ok && payload?.booking?.external_effect === false && ['REQUESTED', 'REPLAYED'].includes(payload?.booking?.status);
      root.dataset.familyConsultationNeedStatus = accepted ? payload.booking.status : 'CLIENT_FAILURE';
      root.dataset.familyConsultationNeedRequest = accepted ? (payload.booking.booking_request_id || '') : '';
      llmTextEquivalent = accepted ? '咨询需求已记下。你可以继续了解，之后再决定是否需要安排。' : '暂时无法记下咨询需求，请稍后再试。';
      return accepted ? payload : null;
    } catch (_error) {
      root.dataset.familyConsultationNeedStatus = 'CLIENT_FAILURE';
      root.dataset.familyConsultationNeedRequest = '';
      llmTextEquivalent = '暂时无法记下咨询需求，请稍后再试。';
      return null;
    }
  }
  async function requestFamilySupportRecords() {
    const correlationId = `family-ui24-records-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    familySupportRecordsLoadState = 'LOADING';
    try {
      const [response, pageObjectsResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/customer-projection`, {
          method: 'GET', credentials: 'include', headers: firstSliceHeaders(correlationId),
        }),
        fetch(`${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/page-objects`, {
          method: 'GET', credentials: 'include', headers: firstSliceHeaders(`${correlationId}-page-objects`),
        }),
      ]);
      const payload = await response.json();
      const pageObjectsPayload = await pageObjectsResponse.json();
      const valid = response.ok && pageObjectsResponse.ok
        && payload?.family_id === config.familyId
        && pageObjectsPayload?.family_id === config.familyId
        && payload?.visibility === 'FAMILY_PRIVATE'
        && Array.isArray(payload?.bookings)
        && Array.isArray(payload?.service_records)
        && Array.isArray(pageObjectsPayload?.service_records);
      const existingRecordIds = new Set((payload?.service_records || []).map((record) => record?.service_record_id));
      const pageObjectRecords = (pageObjectsPayload?.service_records || [])
        .filter((record) => record?.service_record_id
          && record?.visibility === 'FAMILY_PRIVATE'
          && !existingRecordIds.has(record.service_record_id))
        .map((record) => ({
          service_record_id: record.service_record_id,
          source_booking_request_id: record.source_booking_request_id || record.operation_ref || '',
          status: record.status,
          record_kind: record.record_kind || null,
          operation_ref: record.operation_ref || null,
          occurred_at: record.occurred_at || null,
          external_effect: record.external_effect === false ? false : null,
        }));
      familySupportRecordsProjection = valid
        ? { ...payload, service_records: [...payload.service_records, ...pageObjectRecords] }
        : null;
      familySupportRecordsLoadState = valid ? 'READY' : 'ERROR';
      root.dataset.ui24SupportRecordsStatus = valid ? 'READ_ONLY_READY' : 'CLIENT_FAILURE';
      root.dataset.ui24SupportRecordsExternalEffect = 'false';
      return familySupportRecordsProjection;
    } catch (_error) {
      familySupportRecordsProjection = null;
      familySupportRecordsLoadState = 'ERROR';
      root.dataset.ui24SupportRecordsStatus = 'CLIENT_FAILURE';
      root.dataset.ui24SupportRecordsExternalEffect = 'false';
      return null;
    }
  }
  async function requestServiceBooking(routeKey) {
    const route = serviceBookingActionRoutes[routeKey];
    const correlationId = `family-service-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    try {
      const isProjection = route.pageId === null;
      const response = await fetch(
        isProjection
          ? `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/customer-projection`
          : `${config.apiBaseUrl}/families/${config.familyId}/orchestration/test-loop/services/booking-requests`,
        {
          method: isProjection ? 'GET' : 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId, ...(isProjection ? {} : { 'idempotency-key': correlationId }) },
          ...(isProjection ? {} : { body: JSON.stringify({ page_id: route.pageId, service_offering_ref: route.serviceOfferingRef, service_offering_version: route.serviceOfferingVersion, availability_slot_ref: route.availabilitySlotRef }) }),
        },
      );
      const payload = await response.json();
      llmTextEquivalent = payload?.booking?.text_equivalent || payload?.text_equivalent || '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyServiceBookingAction = isProjection ? 'READ_SERVICE_BOOKING_PROJECTION' : 'SUBMIT_SERVICE_BOOKING';
      root.dataset.familyServiceBookingStatus = payload?.booking?.status || (isProjection ? 'READ_ONLY' : 'CLIENT_FAILURE');
      root.dataset.familyServiceBookingRequest = payload?.booking?.booking_request_id || '';
      return payload;
    } catch (_error) {
      llmTextEquivalent = '当前服务回执暂不可用。你可以返回、暂停或现在先不继续。';
      root.dataset.familyServiceBookingAction = route.pageId === null ? 'READ_SERVICE_BOOKING_PROJECTION' : 'SUBMIT_SERVICE_BOOKING';
      root.dataset.familyServiceBookingStatus = 'CLIENT_FAILURE';
      root.dataset.familyServiceBookingRequest = '';
      return null;
    }
  }
  function commerceMall() { return clearReference('family-growth-mall-reference-424x978.png', '家庭成长商城：首页问候、邀请成长礼包、六宫格入口、今日推荐和商城底部导航', [['clear-mall-invite', 'commerce-invite', '立即邀请'], ['clear-mall-product-1', 'commerce-product', '21天亲子沟通挑战营'], ['clear-mall-product-2', 'commerce-product', '家庭成长测评卡'], ['clear-mall-product-3', 'commerce-product', '亲子阅读工具包']], '424/978'); }
  function familyServiceScopePanel() {
    if (!membershipProjectionApiEnabled()) return '';
    if (membershipProjectionLoadState === 'LOADING') return '<section class="by-family-service-scope" data-ui18-service-scope-state="LOADING"><p>正在准备家庭服务说明…</p></section>';
    if (membershipProjectionLoadState === 'ERROR') return '<section class="by-family-service-scope is-blocked" data-ui18-service-scope-state="ERROR"><p>家庭服务说明暂时无法加载，请稍后再试。</p></section>';
    if (!membershipProjection) return '';
    const supportLabel = (ref) => ({ BENEFIT_CONSULT: '家庭交流支持', BENEFIT_CONTENT: '成长内容支持' }[ref] || '家庭支持项目');
    const items = [...new Set((membershipProjection.benefits || []).map((benefit) => supportLabel(benefit.benefit_ref)))];
    const hasScope = (membershipProjection.subscriptions || []).length > 0 || items.length > 0;
    const content = hasScope
      ? `<p>这里整理了家庭当前可以慢慢了解的支持内容。是否使用、何时使用，都由你们按自己的节奏决定。</p><ul>${(items.length ? items : ['家庭成长支持']).map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '<p>现在还没有需要安排的服务内容。可以先继续家庭成长计划，慢慢找到适合你们的支持。</p>';
    return `<section class="by-family-service-scope" data-ui18-service-scope-state="${hasScope ? 'READY' : 'EMPTY'}"><small>家庭服务说明</small><h2>${hasScope ? '为家庭准备的支持内容' : '先从家庭成长计划开始'}</h2>${content}<div><button class="by-btn by-btn-ghost" data-by="ui18-open-growth-profile">查看成长档案</button><button class="by-btn full-primary" data-by="ui18-open-growth-plan">查看成长计划</button><button class="by-btn by-btn-ghost" data-by="ui18-open-support-topics">了解支持主题</button></div></section>`;
  }
  function familyContentDetailPanel() {
    if (!selectedCatalogItem) return '';
    const state = detailInterestState === 'SAVED'
      ? '<p class="by-detail-interest-success">你的了解意向已记下。你可以继续看看，或晚些时候再决定。</p>'
      : detailInterestState === 'ERROR'
        ? '<p class="by-detail-interest-error">暂时无法记下这份意向，请稍后再试。</p>'
        : '<p>可以先看看内容是否符合你们现在的节奏，再决定要不要继续。</p>';
    return `<section class="by-family-content-detail" data-ui14-detail-state="${detailInterestState || 'READY'}" data-ui14-product-ref="${selectedCatalogItem.product_ref}"><small>家庭内容详情</small><h2>${selectedCatalogItem.title}</h2><p class="by-detail-version">内容版本 ${selectedCatalogItem.product_version || 1}</p>${state}<button class="by-btn full-primary" data-by="ui14-save-interest">记下了解意向</button><button class="by-btn by-btn-ghost" data-by="ui14-open-group-draft">想和熟悉家庭一起学习</button><button class="by-btn by-btn-ghost" data-by="ui14-open-invitation-draft">准备一段邀请说明</button><button class="by-btn by-btn-ghost" data-by="ui14-return-catalog">回到内容目录</button></section>`;
  }
  function commerceProduct() { return `${clearReference('product-detail-reference-418x970.png', '商品详情：21天亲子沟通挑战营、价格、服务权益、邀请优惠券和购买拼团操作区', [['clear-product-buy', 'commerce-submit-intent', '立即购买'], ['clear-product-group', 'ui14-open-group-draft', '想和熟悉家庭一起学习']], '418/970')}${familyContentDetailPanel()}`; }
  function familyInvitationDraftPanel() {
    if (!selectedCatalogItem) return '';
    const state = familyInvitationDraftState === 'SAVED'
      ? '<p class="by-invitation-draft-success">邀请说明已记下。是否发送、何时发送，都可以之后再决定。</p>'
      : familyInvitationDraftState === 'ERROR'
        ? '<p class="by-invitation-draft-error">暂时无法记下这段说明，请稍后再试。</p>'
        : '<p>如果想向熟悉的家庭介绍这项内容，可以先整理一段说明；是否发送由你们自己决定。</p>';
    return `<section class="by-family-invitation-draft" data-ui15-invitation-draft-state="${familyInvitationDraftState || 'READY'}" data-ui15-product-ref="${selectedCatalogItem.product_ref}"><small>家庭邀请说明</small><h2>先想清楚，再决定要不要发出</h2><p class="by-invitation-draft-item">当前内容：${selectedCatalogItem.title}</p>${state}<button class="by-btn full-primary" data-by="ui15-save-invitation-draft">记下邀请说明</button><button class="by-btn by-btn-ghost" data-by="ui15-return-content-detail">回到内容详情</button></section>`;
  }
  function commerceInvite() { return `${clearReference('invite-rewards-reference-432x992.png', '邀请有礼：邀请3个家庭、1/3进度、奖励卡、立即邀请、邀请方式和二维码横幅', [['clear-invite-cta', 'ui15-save-invitation-draft', '记下邀请说明']], '432/992')}${familyInvitationDraftPanel()}`; }
  function familyStudyGroupDraftPanel() {
    if (!selectedCatalogItem) return '';
    const state = familyStudyGroupDraftState === 'SAVED'
      ? '<p class="by-group-draft-success">共学想法已记下。是否邀请、何时一起开始，都可以之后再决定。</p>'
      : familyStudyGroupDraftState === 'ERROR'
        ? '<p class="by-group-draft-error">暂时无法记下这个想法，请稍后再试。</p>'
        : '<p>如果你们想和熟悉的家庭一起学习，可以先把这个想法记下来；是否邀请由你们自己决定。</p>';
    return `<section class="by-family-study-group-draft" data-ui16-group-draft-state="${familyStudyGroupDraftState || 'READY'}" data-ui16-product-ref="${selectedCatalogItem.product_ref}"><small>家庭共学想法</small><h2>一起慢慢学习，也可以之后再决定</h2><p class="by-group-draft-item">当前内容：${selectedCatalogItem.title}</p>${state}<button class="by-btn full-primary" data-by="ui16-save-study-group-draft">记下共学想法</button><button class="by-btn by-btn-ghost" data-by="ui16-return-content-detail">回到内容详情</button></section>`;
  }
  function commerceGroup() { return `${clearReference('group-buy-reference-440x960.png', '拼团专区：分类Tab、四张拼团卡、团长、倒计时、参与头像、原价拼团价和去拼团按钮', [['clear-group-join', 'ui16-save-study-group-draft', '记下共学想法']], '440/960')}${familyStudyGroupDraftPanel()}`; }
  function commercePoints() { return `${clearReference('points-mall-reference-472x982.png', '积分商城：成长积分、签到、五项任务奖励、四项兑换礼和立即兑换按钮', [], '472/982')}${familyPointsProjectionPanel()}`; }
  function commerceMine() { return `${clearReference('partner-mine-reference-440x994.png', '我的：成长合伙人、邀请成交积分可提现数据、等级进度、功能菜单与年度会员服务', [['clear-bottom-nav-home', 'home', '首页']], '440/994')}${familyServiceScopePanel()}`; }
  function teacherZone() { return clearReference('teacher-zone-reference-458x1008.png', '名师专区：搜索、咨询 Banner、热门领域、推荐名师与底部导航，仅作静态视觉展示', [['clear-bottom-nav-home', 'home', '首页'], ['clear-teacher-detail', 'teacher-detail', '查看名师详情']], '458/1008'); }
  function familySupportExplanationPanel() {
    if (!selectedSupportTopic) return '';
    const channel = ({ VIDEO: '线上交流', TEXT: '文字交流', OFFLINE: '线下交流' }[String(selectedSupportTopic.next_available_channel)] || '可进一步了解');
    const detail = selectedSupportTopic.availability_status === 'AVAILABLE'
      ? `可以了解的方式：${channel}${selectedSupportTopic.next_available_at ? '；安排信息会在需要时再确认。' : '。'}`
      : '目前暂无安排信息，也可以先从主题说明开始了解。';
    return `<section class="by-family-support-explanation" data-ui20-support-explanation="READY" data-ui20-offering-ref="${selectedSupportTopic.service_offering_ref}"><small>家庭支持说明</small><h2>${selectedSupportTopic.title}</h2><p>这是一个可以从家庭当前情境慢慢了解的支持方向，不需要立刻作决定。</p><p>支持主题：${selectedSupportTopic.service_type || '家庭成长支持'}${selectedSupportTopic.age_band ? ` · 适龄参考：${selectedSupportTopic.age_band}` : ''}</p><p>${detail}</p><div><button class="by-btn by-btn-ghost" data-by="ui20-return-support-topics">回到支持主题</button><button class="by-btn full-primary" data-by="ui20-open-consultation-need">准备咨询需求</button></div></section>`;
  }
  function familyConsultationNeedPanel() {
    if (!selectedSupportTopic) return '';
    const status = consultationNeedDraftState === 'SAVED'
      ? '咨询需求已记下。你可以继续了解，之后再决定是否需要安排。'
      : consultationNeedDraftState === 'ERROR'
        ? '暂时无法记下咨询需求，请稍后再试。'
        : '可以先把想了解的方向记下来，不需要现在确定时间。';
    return `<section class="by-family-consultation-need" data-ui21-consultation-need-state="${consultationNeedDraftState || 'READY'}" data-ui21-offering-ref="${selectedSupportTopic.service_offering_ref}"><small>家庭咨询需求</small><h2>${selectedSupportTopic.title}</h2><p>${status}</p><p>支持主题：${selectedSupportTopic.service_type || '家庭成长支持'}${selectedSupportTopic.age_band ? ` · 适龄参考：${selectedSupportTopic.age_band}` : ''}</p><div><button class="by-btn by-btn-ghost" data-by="ui21-return-support-explanation">回到支持说明</button>${consultationNeedDraftState === 'SAVED' ? '<button class="by-btn full-primary" data-by="ui21-open-support-records">查看家庭支持记录</button>' : '<button class="by-btn full-primary" data-by="ui21-save-consultation-need">记下咨询需求</button>'}</div></section>`;
  }
  function teacherDetail() { return `${clearReference('teacher-detail-reference-426x1002.png', '名师详情：名师资料、擅长领域、可预约时间、家长评价与咨询预约操作区', [['clear-teacher-book', 'ui20-return-support-topics', '返回支持主题']], '426/1002')}${familySupportExplanationPanel()}`; }
  function consultationBooking() { return `${clearReference('consultation-booking-reference-492x1008.png', '在线咨询预约：咨询方式、时间、问题描述与确认预约', [['clear-booking-back', 'ui21-return-support-explanation', '返回支持说明'], ['clear-booking-confirm', 'ui21-save-consultation-need', '记下咨询需求']], '492/1008')}${familyConsultationNeedPanel()}`; }
  function familyGrowthActivityDetailPanel() {
    if (!selectedGrowthActivity) return '';
    return `<section class="by-family-growth-activity-detail" data-ui23-activity-detail-state="READY" data-ui23-activity-ref="${selectedGrowthActivity.activity_ref}"><small>家庭成长活动说明</small><h2>${selectedGrowthActivity.title}</h2><p>${selectedGrowthActivity.summary}</p><p>${selectedGrowthActivity.age_hint}</p><p>可以先慢慢了解活动主题；是否继续关注，由家庭自己决定。</p><button class="by-btn full-primary" data-by="ui23-return-activity-catalog">回到活动目录</button></section>`;
  }
  function salonList() { return clearReference('salon-list-reference-466x1008.png', '线下沙龙：城市主题筛选、活动列表与活动详情入口', [['clear-salon-detail', 'ui22-open-activity-detail', '查看活动说明']], '466/1008'); }
  function activityDetail() { return `${clearReference('activity-detail-reference-470x1016.png', '活动详情：活动亮点、流程、适合人群、参与收获与报名操作区，仅作静态视觉展示', [['clear-activity-mine', 'service-mine', '我的预约和活动'], ['clear-activity-confirm', 'ui23-return-activity-catalog', '回到活动目录']], '470/1016')}${familyGrowthActivityDetailPanel()}`; }
  function expertLiveSessionPanel() {
    const saved = expertLiveSessionState === 'SAVED';
    const error = expertLiveSessionState === 'ERROR';
    const session = expertLiveSessionProjection || {};
    const startsAt = session.starts_at ? new Date(session.starts_at) : null;
    const dateText = startsAt && !Number.isNaN(startsAt.valueOf()) ? startsAt.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '近期';
    const statusText = session.status === 'LIVE' ? '正在进行' : session.status === 'ENDED' ? '本场已结束' : '即将开始';
    const title = session.title || '家庭沟通主题直播';
    const topic = session.topic || '在日常互动里先听见彼此';
    const host = session.host_display_name || '家庭成长顾问';
    const actionText = session.status === 'ENDED' ? '记下下一场直播' : '记下这场直播';
    return `<section class="by-expert-live-session" data-ui01-live-state="${saved ? 'SAVED' : error ? 'ERROR' : 'READY'}" data-ui01-live-session-ref="${session.session_ref || ''}"><small>专家直播 · ${statusText}</small><h2>${dateText} · ${title}</h2><p>由${host}分享${topic}，先听一听，再决定是否适合你们。</p><p class="by-expert-live-status">${saved ? '这场直播已记在家庭的关注清单里。' : error ? '暂时无法记下这场直播，请稍后再试。' : '可以先记下这场直播，不需要现在进入或作出安排。'}</p><div><button class="by-btn by-btn-ghost" data-by="live-return-support">回到专家服务</button>${saved ? '<button class="by-btn full-primary" data-by="live-open-support-records">查看家庭支持记录</button>' : `<button class="by-btn full-primary" data-by="ui01-enter-expert-live">${actionText}</button>`}</div></section>`;
  }
  function familySupportRecordsPanel() {
    if (!familySupportRecordsApiEnabled()) return '';
    if (familySupportRecordsLoadState === 'LOADING') return '<section class="by-family-support-records" data-ui24-support-records-state="LOADING"><p>正在准备家庭支持记录…</p></section>';
    if (familySupportRecordsLoadState === 'ERROR') return '<section class="by-family-support-records is-blocked" data-ui24-support-records-state="ERROR"><p>家庭支持记录暂时无法加载，请稍后再试。</p></section>';
    if (!familySupportRecordsProjection) return '';
    const label = (ref) => /PARENT_CHILD|DIALOGUE|COMMUNICATION/.test(String(ref || '')) ? '亲子沟通支持' : '家庭支持';
    const status = (value) => ({ REQUESTED: '需求已记下', PENDING: '正在整理中', CANCELLED: '这个需求已暂停' }[value] || '可以继续了解');
    const bookings = familySupportRecordsProjection.bookings || [];
    const records = familySupportRecordsProjection.service_records || [];
    const content = bookings.length
      ? `<ul>${bookings.slice(0, 3).map((item) => `<li><b>${label(item.service_offering_ref)}</b><span>${status(item.status)}</span></li>`).join('')}</ul><p>这些记录只帮助家庭回看已经记下的需求；后续是否继续，仍由你们决定。</p>`
      : '<p>还没有需要回看的支持记录。可以先从支持主题或成长计划开始慢慢了解。</p>';
    const recordHint = records.length ? '<p class="by-support-records-hint">已为家庭保留一份过程记录，方便之后回看。</p>' : '';
    return `<section class="by-family-support-records" data-ui24-support-records-state="${bookings.length ? 'READY' : 'EMPTY'}"><small>家庭支持记录</small><h2>${bookings.length ? '已经记下的支持需求' : '先从想了解的方向开始'}</h2>${content}${recordHint}<div><button class="by-btn by-btn-ghost" data-by="ui24-open-support-topics">继续了解支持主题</button><button class="by-btn full-primary" data-by="ui24-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function familyServiceRecordsPanel() {
    if (!familySupportRecordsApiEnabled()) return '';
    if (familySupportRecordsLoadState === 'LOADING') return '<section class="by-family-service-records" data-ui34-records-state="LOADING"><small>家庭服务记录</small><h2>正在准备过程记录</h2><p>请稍等片刻。</p></section>';
    if (familySupportRecordsLoadState === 'ERROR') return '<section class="by-family-service-records is-blocked" data-ui34-records-state="ERROR"><small>家庭服务记录</small><h2>服务记录暂时无法回看</h2><p>可以稍后再试，也可以先回到我的咨询和活动。</p><button class="by-btn full-primary" data-by="ui34-open-support-records">回看家庭支持记录</button></section>';
    if (!familySupportRecordsProjection) return '';
    const bookings = familySupportRecordsProjection.bookings || [];
    const records = familySupportRecordsProjection.service_records || [];
    const count = bookings.length + records.length;
    const title = count ? '已经留存的家庭过程' : '还没有需要回看的记录';
    const content = count ? `当前有 ${count} 条家庭支持过程记录可回看。` : '可以先从支持主题或成长计划开始慢慢了解。';
    return `<section class="by-family-service-records" data-ui34-records-state="${count ? 'READY' : 'EMPTY'}"><small>家庭服务记录</small><h2>${title}</h2><p>${content}</p><p class="by-family-service-records-boundary">这些记录只说明家庭曾经记下过一个过程，不代表服务效果或孩子的变化结论。</p><div><button class="by-btn by-btn-ghost" data-by="ui34-open-support-records">查看我的咨询和活动</button><button class="by-btn full-primary" data-by="ui34-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function serviceMine() { return `${clearReference('service-mine-reference-472x1018.png', '我的咨询和活动：用户资料、咨询、活动与会员信息', [['clear-service-mine-home', 'home', '首页'], ['clear-service-mine-projection', 'service-load-customer-projection', '查看我的预约和服务记录']], '472/1018')}${familySupportRecordsPanel()}`; }
  function parentCommunity() { return clearReference('parent-community-reference-552x1034.png', '家长社区：搜索、话题、内容流与互动入口', [['clear-community-detail', 'ui25-open-exchange-detail', '阅读一段家庭经验'], ['clear-community-publish', 'ui25-open-sharing-draft', '写下家庭想法'], ['clear-community-mine', 'my-community', '我的社区']], '552/1034'); }
  function familySharingDraftPanel() {
    const status = familySharingDraftState === 'SAVED'
      ? '这段家庭想法已记下。可以慢慢修改，是否分享由你们之后再决定。'
      : familySharingDraftState === 'ERROR'
        ? '暂时无法记下这段想法，请稍后再试。'
        : '可以先把想留住的一段家庭感受记下来，不需要现在做任何分享决定。';
    const savedAction = familySharingDraftState === 'SAVED'
      ? '<button class="by-btn full-primary" data-by="ui26-open-expression-notes">查看家庭小记</button>'
      : '<button class="by-btn full-primary" data-by="ui26-save-sharing-draft">记下分享草稿</button>';
    return `<section class="by-family-sharing-draft" data-ui26-sharing-draft-state="${familySharingDraftState || 'READY'}"><small>家庭分享草稿</small><h2>先留给家庭，再慢慢决定</h2><p>可以写下一个你们正在尝试的小变化，或一次想继续记得的相处时刻。</p><p class="by-sharing-draft-status">${status}</p><div><button class="by-btn by-btn-ghost" data-by="ui26-return-exchange-feed">回到家庭交流</button>${savedAction}</div></section>`;
  }
  function familyExpressionNotesPanel() {
    const hasSavedNote = familyExpressionNotesState === 'SAVED' || familySharingDraftState === 'SAVED';
    const title = hasSavedNote ? '这一段家庭想法已经留好' : '先留下一段想记得的时刻';
    const content = hasSavedNote
      ? '这段小记只留给家庭。你们可以之后再决定要不要继续整理或分享。'
      : '当你们想把一段相处时刻留下来时，可以先回到家庭交流慢慢写下。';
    return `<section class="by-family-expression-notes" data-ui28-expression-notes-state="${hasSavedNote ? 'SAVED' : 'EMPTY'}"><small>家庭表达小记</small><h2>${title}</h2><p>${content}</p><p class="by-expression-notes-boundary">这里先留给家人，之后再决定怎样继续。</p><div><button class="by-btn by-btn-ghost" data-by="ui28-return-exchange-feed">回到家庭交流</button><button class="by-btn full-primary" data-by="ui28-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function publishDynamic() { return `${clearReference('publish-dynamic-reference-548x1028.png', '发布动态：发布类型、素材、话题、挑战与发布打卡操作区，仅作静态视觉展示', [['clear-publish-back', 'ui26-return-exchange-feed', '返回家庭交流'], ['clear-publish-confirm', 'ui26-save-sharing-draft', '记下分享草稿']], '548/1028')}${familySharingDraftPanel()}`; }
  function dynamicDetail() { return `${clearReference('dynamic-detail-reference-524x1022.png', '动态详情：内容、图片、评论、顾问回复与互动操作区，仅作静态视觉展示', [['clear-dynamic-back', 'ui27-return-exchange-feed', '回到家庭交流']], '524/1022')}${familyLearningExchangeDetailPanel()}`; }
  function myCommunity() { return `${clearReference('my-community-reference-560x1030.png', '我的社区：资料、动态、挑战与社区等级，仅作静态视觉展示', [['clear-my-community-back', 'parent-community', '返回家长社区']], '560/1030')}${familyExpressionNotesPanel()}`; }
  function familyGrowthReviewPanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return '<section class="by-family-growth-review" data-ui29-growth-review-state="LOADING"><small>家庭成长回顾</small><h2>正在准备这段家庭过程</h2><p>请稍等片刻。</p></section>';
    if (coreGrowthLoadState === 'ERROR') return '<section class="by-family-growth-review is-blocked" data-ui29-growth-review-state="ERROR"><small>家庭成长回顾</small><h2>这段家庭过程暂时无法回看</h2><p>可以稍后再试，或回到成长计划继续选择一件小行动。</p><button class="by-btn full-primary" data-by="ui29-open-growth-plan">回到成长计划</button></section>';
    const actionRecorded = coreGrowthProjection?.recent_flow_events?.some((event) => event.ui_id === 'UI-09' && event.command === 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW');
    const title = actionRecorded ? '已经留下一次家庭行动' : '先从一件小行动开始';
    const content = actionRecorded
      ? '这次记录只说明家庭已经试过一次。可以慢慢想想，什么时刻让彼此更愿意继续说下去。'
      : '当你们准备好了，可以从成长计划里选一件适合现在的小行动。';
    return `<section class="by-family-growth-review" data-ui29-growth-review-state="${actionRecorded ? 'ACTION_RECORDED' : 'EMPTY'}"><small>家庭成长回顾</small><h2>${title}</h2><p>${content}</p><p class="by-growth-review-boundary">每个家庭都有自己的节奏，不需要和别人比较。</p><div><button class="by-btn by-btn-ghost" data-by="ui29-open-private-story">查看家庭故事</button><button class="by-btn full-primary" data-by="ui29-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function growthOutcomes() { return `${clearReference('growth-outcomes-reference-522x1110.png', '成长成果：本周成长数据、荣誉勋章、成果案例对比与成长海报入口，仅作静态视觉展示', [['clear-outcomes-poster', 'ui29-open-private-story', '查看家庭故事']], '522/1110')}${familyGrowthReviewPanel()}`; }
  function familyPointsProjectionPanel() {
    if (!membershipProjectionApiEnabled()) return '';
    if (membershipProjectionLoadState === 'LOADING') return '<section class="by-family-points-projection" data-ui30-points-state="LOADING"><small>家庭积分回看</small><p>正在准备家庭积分说明。</p></section>';
    if (membershipProjectionLoadState === 'ERROR') return '<section class="by-family-points-projection is-blocked" data-ui30-points-state="ERROR"><small>家庭积分回看</small><p>家庭积分说明暂时无法加载，请稍后再试。</p></section>';
    const points = membershipProjection?.dev_points;
    if (!points) return '<section class="by-family-points-projection" data-ui30-points-state="EMPTY"><small>家庭积分回看</small><p>现在还没有可回看的家庭积分记录。</p></section>';
    return `<section class="by-family-points-projection" data-ui30-points-state="READY"><small>家庭积分回看</small><h2>${points.balance}</h2><p>这是家庭过程记录，只用于回看，不支持兑换、提现或改变正式积分。</p><button class="by-btn by-btn-ghost" data-by="ui30-return-annual-member">回到年度陪伴</button></section>`;
  }
  function familyAnnualServiceOverviewPanel() {
    if (!membershipProjectionApiEnabled()) return '';
    if (membershipProjectionLoadState === 'LOADING') return '<section class="by-family-annual-service-overview" data-ui30-service-overview-state="LOADING"><small>家庭服务回看</small><h2>正在准备家庭服务说明</h2><p>请稍等片刻。</p></section>';
    if (membershipProjectionLoadState === 'ERROR') return '<section class="by-family-annual-service-overview is-blocked" data-ui30-service-overview-state="ERROR"><small>家庭服务回看</small><h2>家庭服务说明暂时无法加载</h2><p>可以稍后再试，或先回到成长计划继续。</p><button class="by-btn full-primary" data-by="ui30-open-growth-plan">回到成长计划</button></section>';
    if (!membershipProjection) return '';
    const supportLabel = (ref) => ({ BENEFIT_CONSULT: '家庭交流支持', BENEFIT_CONTENT: '成长内容支持' }[ref] || '家庭支持项目');
    const items = [...new Set((membershipProjection.benefits || []).map((benefit) => supportLabel(benefit.benefit_ref)))];
    const hasService = (membershipProjection.subscriptions || []).length > 0 || items.length > 0;
    const content = hasService
      ? `<p>这些服务资料可以按家庭自己的节奏慢慢了解，不需要现在作出安排。</p><ul>${(items.length ? items : ['家庭成长支持']).map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '<p>现在还没有需要了解的服务内容。可以先回到成长计划，从一件小行动开始。</p>';
    const renewalState = renewalInterestDraftState === 'SAVED'
      ? '<p class="by-renewal-interest-success">续费了解意向已记下。之后是否继续，由家庭自己决定。</p>'
      : renewalInterestDraftState === 'ERROR'
        ? '<p class="by-renewal-interest-error">暂时无法记下续费了解意向，请稍后再试。</p>'
        : '';
    return `<section class="by-family-annual-service-overview" data-ui30-service-overview-state="${hasService ? 'READY' : 'EMPTY'}"><small>家庭服务回看</small><h2>${hasService ? '可以慢慢了解的支持' : '先从家庭成长计划开始'}</h2>${content}${renewalState}<div><button class="by-btn by-btn-ghost" data-by="ui30-open-points">查看家庭积分</button><button class="by-btn by-btn-ghost" data-by="ui30-open-invite">准备邀请说明</button><button class="by-btn by-btn-ghost" data-by="ui30-open-my-services">查看我的服务</button><button class="by-btn by-btn-ghost" data-by="ui30-create-renewal-interest">${renewalInterestDraftState === 'SAVED' ? '已记下续费想法' : '记下续费想法'}</button><button class="by-btn full-primary" data-by="ui30-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function annualMemberMine() { return `${clearReference('annual-member-mine-reference-532x994.png', '我的年度会员服务：成长积分、家庭等级、累计服务、邀请奖励、快捷入口和服务进度', [['clear-annual-services', 'ui30-open-my-services', '查看我的服务']], '532/994')}${familyAnnualServiceOverviewPanel()}`; }
  function familyMyServicesPanel() {
    if (!coreGrowthApiEnabled()) return '';
    if (coreGrowthLoadState === 'LOADING') return '<section class="by-family-my-services" data-ui31-services-state="LOADING"><small>家庭服务进度</small><h2>正在准备家庭计划</h2><p>请稍等片刻。</p></section>';
    if (coreGrowthLoadState === 'ERROR') return '<section class="by-family-my-services is-blocked" data-ui31-services-state="ERROR"><small>家庭服务进度</small><h2>暂时无法回看家庭计划</h2><p>可以稍后再试，也可以先回到成长计划。</p><button class="by-btn full-primary" data-by="ui31-open-growth-plan">回到成长计划</button></section>';
    const plan = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-05')?.plan_preview;
    const companion = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-06')?.companion_progress;
    if (!plan) return '<section class="by-family-my-services" data-ui31-services-state="EMPTY"><small>家庭服务进度</small><h2>还没有可回看的家庭计划</h2><p>可以从成长计划开始，选一件适合现在的小行动。</p><button class="by-btn full-primary" data-by="ui31-open-growth-plan">查看成长计划</button></section>';
    const stage = plan.stages?.[0];
    const actionCopy = companion?.state === 'ACTION_RECORDED' ? '今天已经留下一次家庭行动，可以按自己的节奏继续。' : (plan.next_action || '从一件小行动开始。');
    return `<section class="by-family-my-services" data-ui31-services-state="READY"><small>家庭服务进度</small><h2>${plan.headline}</h2><p>${stage ? `${stage.label} · ${stage.weeks}` : '90 天成长计划'}</p><p class="by-my-services-next">${actionCopy}</p><div><button class="by-btn by-btn-ghost" data-by="ui31-open-growth-plan">查看成长计划</button><button class="by-btn full-primary" data-by="ui31-open-daily-action">继续今天的行动</button><button class="by-btn by-btn-ghost" data-by="ui31-open-support-records">回看支持记录</button></div></section>`;
  }
  function myServices() { return `${clearReference('my-services-reference-532x1000.png', '我的服务：90天成长计划、任务进度、服务入口和继续打卡，仅作静态视觉展示', [['clear-services-profile', 'family-profile', '查看家庭档案']], '532/1000')}${familyMyServicesPanel()}`; }
  function familyOrdersAssetsPanel() {
    if (!membershipProjectionApiEnabled()) return '';
    if (membershipProjectionLoadState === 'LOADING') return '<section class="by-family-orders-assets" data-ui32-assets-state="LOADING"><small>家庭资产回看</small><h2>正在准备家庭资产说明</h2><p>请稍等片刻。</p></section>';
    if (membershipProjectionLoadState === 'ERROR') return '<section class="by-family-orders-assets is-blocked" data-ui32-assets-state="ERROR"><small>家庭资产回看</small><h2>家庭资产说明暂时无法加载</h2><p>可以稍后再试，或回到我的服务继续。</p><button class="by-btn full-primary" data-by="ui32-open-my-services">查看我的服务</button></section>';
    if (!membershipProjection) return '';
    const subscriptions = membershipProjection.subscriptions || [];
    const benefits = membershipProjection.benefits || [];
    const points = membershipProjection.dev_points?.balance;
    const hasReadableAsset = subscriptions.length > 0 || benefits.length > 0 || points !== undefined;
    const orderCopy = subscriptions.length > 0 ? `家庭已有 ${subscriptions.length} 项服务记录可回看。` : '现在还没有可回看的家庭订单记录。';
    const benefitCopy = benefits.length > 0 ? `当前有 ${benefits.length} 项家庭支持权益说明。` : '现在还没有可回看的权益说明。';
    return `<section class="by-family-orders-assets" data-ui32-assets-state="${hasReadableAsset ? 'READY' : 'EMPTY'}"><small>家庭资产回看</small><h2>${hasReadableAsset ? '这些信息只为家庭保留' : '先从家庭服务开始'}</h2><p>${orderCopy}</p><p>${benefitCopy}</p>${points !== undefined ? `<p class="by-orders-assets-points">家庭积分回看：${points}</p>` : ''}<p class="by-orders-assets-boundary">这里只回看家庭已有记录，不会在这里改变订单、权益或积分。</p><div><button class="by-btn by-btn-ghost" data-by="ui32-open-annual-member">回到年度陪伴</button><button class="by-btn by-btn-ghost" data-by="ui32-open-my-services">查看我的服务</button><button class="by-btn full-primary" data-by="ui32-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function ordersAssets() { return `${clearReference('orders-assets-reference-552x1010.png', '订单与资产：订单、优惠券、积分、奖励与权益中心', [['clear-orders-mine', 'commerce-load-customer-assets', '查看订单与资产']], '552/1010')}${familyOrdersAssetsPanel()}`; }
  function familyProfilePanel() {
    if (!platformSurfacesApiEnabled()) return '';
    if (platformSurfacesLoadState === 'LOADING') return '<section class="by-family-profile" data-ui33-profile-state="LOADING"><small>家庭档案回看</small><h2>正在准备家庭资料</h2><p>请稍等片刻。</p></section>';
    if (platformSurfacesLoadState === 'ERROR') return '<section class="by-family-profile is-blocked" data-ui33-profile-state="ERROR"><small>家庭档案回看</small><h2>家庭资料暂时无法回看</h2><p>可以稍后再试，也可以先回到我的服务。</p><button class="by-btn full-primary" data-by="ui33-open-my-services">查看我的服务</button></section>';
    const profileCard = platformSurfacesProjection?.cards?.find((item) => item.surface === 'UI-33');
    if (!profileCard) return '<section class="by-family-profile" data-ui33-profile-state="EMPTY"><small>家庭档案回看</small><h2>还没有可回看的家庭资料</h2><p>资料准备好后，会在这里按家庭范围显示。</p></section>';
    const growthProfile = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-07')?.growth_profile_progress;
    const focus = growthProfile?.focus;
    const focusLabel = ({ PARENT_CHILD_COMMUNICATION: '亲子沟通', EMOTION_REGULATION: '情绪理解', LEARNING_HABITS: '学习习惯' }[focus] || '家庭当前关注方向');
    return `<section class="by-family-profile" data-ui33-profile-state="READY"><small>家庭档案回看</small><h2>资料只为家庭服务</h2><p>${profileCard.summary || '这里回看家庭已经留存的资料和当前关注方向。'}</p>${focus ? `<p class="by-family-profile-focus">当前关注方向：${focusLabel}<br><span>这是家庭当前的工作视角，不是对孩子的诊断结论。</span></p>` : '<p class="by-family-profile-focus">当前还没有需要确认的关注方向，可以先按家庭节奏继续。</p>'}<p class="by-family-profile-boundary">成员资料、关注方向和成长记录彼此分开，之后如需更正再由家庭决定。</p><div><button class="by-btn by-btn-ghost" data-by="ui33-open-my-services">查看我的服务</button><button class="by-btn full-primary" data-by="ui33-open-growth-plan">回到成长计划</button></div></section>`;
  }
  function familyProfile() { return `${clearReference('family-profile-reference-542x1002.png', '家庭档案：孩子资料、关注问题、诊断方案、记录与时间线，仅作静态视觉展示', [['clear-profile-services', 'my-services', '查看服务']], '542/1002')}${familyProfilePanel()}`; }
  function serviceRecords() { return `${clearReference('service-records-reference-566x1008.png', '服务记录：咨询、活动和客服支持，仅作静态视觉展示', [['clear-records-mine', 'service-mine', '我的预约和活动']], '566/1008')}${familyServiceRecordsPanel()}`; }
  const pageAssistiveStatus = () => {
    if (page === 'commerce-mall' && commerceCatalogApiEnabled() && commerceCatalogLoadState === 'READY') return '内容目录已准备好。你可以按自己的节奏慢慢了解。';
    if (page === 'commerce-mine' && membershipProjectionApiEnabled() && membershipProjectionLoadState === 'READY') return '家庭服务说明已准备好。可以按自己的节奏慢慢了解。';
    if (page === 'service-mine' && familySupportRecordsApiEnabled() && familySupportRecordsLoadState === 'READY') return '家庭支持记录已准备好。可以慢慢回看已经记下的需求。';
    if (page === 'teacher-zone' && expertLiveSessionState === 'SAVED') return '专家直播已记在家庭关注清单里。';
    if (page === 'publish-dynamic' && familySharingDraftState === 'SAVED') return '家庭分享草稿已记下。可以慢慢修改，之后再决定。';
    if (page === 'my-community' && (familyExpressionNotesState === 'SAVED' || familySharingDraftState === 'SAVED')) return '家庭小记已留好。可以按自己的节奏继续。';
    if (page === 'growth-outcomes' && coreGrowthLoadState === 'READY') return '家庭成长回顾已准备好。可以按自己的节奏慢慢回看。';
    if (page === 'annual-member-mine' && membershipProjectionLoadState === 'READY') return '家庭服务说明已准备好。可以按自己的节奏慢慢了解。';
    if (page === 'my-services' && coreGrowthApiEnabled() && coreGrowthLoadState === 'READY') return '家庭服务进度已准备好。可以继续，也可以先停在这里。';
    if (!platformSurfacesApiEnabled() || platformSurfacesLoadState !== 'READY') return llmTextEquivalent;
    if (page === 'growth-ranking') return '成长旅程已更新。你可以回看已经走过的几步。';
    if (page === 'growth-poster') return '家庭故事已准备好。可以慢慢回看这些片段。';
    if (page === 'commerce-points') return '家庭小记已准备好。可以按自己的节奏回看和继续。';
    if (page === 'parent-community') return '家庭经验内容已准备好。可以慢慢看看哪些想法适合自己的家庭。';
    if (page === 'dynamic-detail' && selectedLearningExchange) return '正在阅读一段家庭经验。可以参考，也可以保留自己的判断。';
    return llmTextEquivalent;
  };
  function render() { if (page === 'teacher-zone') { mountTeacherSupplyView(root, { ...config, onOpenTopic: (topic) => { selectedSupportTopic = { service_offering_ref: topic.service_offering_ref, title: topic.title, service_type: topic.service_type, age_band: topic.age_band, next_available_channel: topic.next_available_channel, next_available_at: topic.next_available_at, availability_status: topic.availability_status }; page = 'teacher-detail'; render(); }, onOpenActivityCatalog: () => { page = 'salon-list'; render(); }, onRender: (projection) => { expertLiveSessionProjection = projection?.live_session || null; if (!root.querySelector('.by-expert-live-session')) root.insertAdjacentHTML('beforeend', `${expertLiveSessionPanel()}<p class="by-assistive-status" aria-live="polite">${pageAssistiveStatus()}</p>`); bind(); } }); return; } const views = { home, assessment, report, task:taskPage, child, ranking, poster, plan, mall, product, invite, group, points, mine, member, 'core-report':coreReport, 'core-plan':corePlan, 'core-community':coreCommunity, 'core-mine':coreMine, 'growth-assessment':growthAssessment, 'growth-report':growthReport, 'growth-daily-task':growthDailyTask, 'growth-camp-21':growthCamp21, 'growth-child':growthChild, 'growth-ranking':growthRanking, 'growth-poster':growthPoster, 'commerce-mall':commerceMall, 'commerce-product':commerceProduct, 'commerce-invite':commerceInvite, 'commerce-group':commerceGroup, 'commerce-points':commercePoints, 'commerce-mine':commerceMine, 'teacher-zone':teacherZone, 'teacher-detail':teacherDetail, 'consultation-booking':consultationBooking, 'salon-list':salonList, 'activity-detail':activityDetail, 'service-mine':serviceMine, 'parent-community':parentCommunity, 'publish-dynamic':publishDynamic, 'dynamic-detail':dynamicDetail, 'my-community':myCommunity, 'growth-outcomes':growthOutcomes, 'annual-member-mine':annualMemberMine, 'my-services':myServices, 'orders-assets':ordersAssets, 'family-profile':familyProfile, 'service-records':serviceRecords }; root.innerHTML = `${(views[page] || home)()}${platformSurfacePanel(FAMILY_UI_ID_BY_ROUTE[page])}<p class="by-assistive-status" aria-live="polite">${pageAssistiveStatus()}</p>`; bind(); if (firstSliceApiEnabled() && (page === 'home' || page === 'growth-daily-task') && firstSliceLoadState === 'IDLE') { void requestFamilyToday().then(() => render()); } if (coreGrowthApiEnabled() && ['growth-assessment', 'assessment', 'core-report', 'core-plan', 'core-community', 'core-mine', 'growth-report', 'growth-daily-task', 'growth-child', 'growth-camp-21', 'growth-outcomes', 'my-services', 'family-profile'].includes(page) && coreGrowthLoadState === 'IDLE') { void requestCoreGrowthProjection().then(() => render()); } if (platformSurfacesApiEnabled() && /^UI-(1[1-9]|2[0-9]|3[0-4])$/.test(FAMILY_UI_ID_BY_ROUTE[page] || '') && platformSurfacesLoadState === 'IDLE') { void requestPlatformSurfacesProjection().then(() => render()); } if (commerceCatalogApiEnabled() && page === 'commerce-mall' && commerceCatalogLoadState === 'IDLE') { void requestCommerceCatalogProjection().then(() => render()); } if (membershipProjectionApiEnabled() && ['commerce-mine', 'annual-member-mine', 'commerce-points', 'orders-assets'].includes(page) && membershipProjectionLoadState === 'IDLE') { void requestMembershipProjection().then(() => render()); } if (familySupportRecordsApiEnabled() && ['service-mine', 'service-records'].includes(page) && familySupportRecordsLoadState === 'IDLE') { void requestFamilySupportRecords().then(() => render()); } }
  function bind() { root.querySelectorAll('[data-by]').forEach(el => el.addEventListener('click', async () => { const a = el.dataset.by; if (a === 'platform-surface-refresh') { platformSurfacesLoadState = 'IDLE'; platformSurfacesNoopReceipt = ''; root.setAttribute('aria-busy', 'true'); await requestPlatformSurfacesProjection(); root.removeAttribute('aria-busy'); render(); return; } if (a === 'platform-surface-noop') { root.setAttribute('aria-busy', 'true'); await submitPlatformSurfaceNoop(el.dataset.platformSurface || '', el.dataset.platformCommand || ''); root.removeAttribute('aria-busy'); render(); return; } if (a === 'dev-core-refresh') { coreGrowthLoadState = 'IDLE'; coreGrowthNoopReceipt = ''; root.setAttribute('aria-busy', 'true'); await requestCoreGrowthProjection(); root.removeAttribute('aria-busy'); render(); return; } if (a === 'dev-core-noop') { root.setAttribute('aria-busy', 'true'); await submitCoreGrowthNoop(el.dataset.coreGrowthSurface || '', el.dataset.coreGrowthCommand || ''); root.removeAttribute('aria-busy'); render(); return; } if (a === 'ui02-start-assessment' && !coreGrowthApiEnabled()) { root.setAttribute('aria-busy', 'true'); await requestPageExplanation('UI-02'); root.removeAttribute('aria-busy'); page = 'assessment'; render(); return; } if (a === 'ui02-select-dimension') { root.setAttribute('aria-busy', 'true'); await submitCoreGrowthNoop('UI-02', 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', el.dataset.ui02Selection || ''); coreGrowthLoadState = 'IDLE'; await requestCoreGrowthProjection(); root.removeAttribute('aria-busy'); render(); return; } if (a === 'ui02-start-assessment') { root.setAttribute('aria-busy', 'true'); const selection = coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === 'UI-02')?.selection || 'PARENT_CHILD_COMMUNICATION'; await submitCoreGrowthNoop('UI-02', 'START_SYNTHETIC_ASSESSMENT_DRAFT', selection); coreGrowthLoadState = 'IDLE'; await requestCoreGrowthProjection(); root.removeAttribute('aria-busy'); page = 'assessment'; render(); return; } if (a === 'ui03-preview-plan') { root.setAttribute('aria-busy', 'true'); if (coreGrowthApiEnabled()) { const selection = coreGrowthProjection?.recent_flow_events?.find((event) => event.ui_id === 'UI-02')?.selection || 'UNSPECIFIED'; await submitCoreGrowthNoop('UI-03', 'PREVIEW_SYNTHETIC_REPORT_EXPLANATION', selection); coreGrowthLoadState = 'IDLE'; await requestCoreGrowthProjection(); } else { await requestPageExplanation('UI-03'); } root.removeAttribute('aria-busy'); page = 'core-report'; render(); return; } if (a === 'ui04-plan-handoff') { root.setAttribute('aria-busy', 'true'); if (coreGrowthApiEnabled() && config.onboardingId) { try { await refreshUi05PlanPreview(); } catch (_error) { planPreviewRefreshState = 'ERROR'; } } else if (coreGrowthApiEnabled()) { const selection = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-04')?.report_draft?.focus || 'PARENT_CHILD_COMMUNICATION'; await submitCoreGrowthNoop('UI-04', 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', selection); coreGrowthLoadState = 'IDLE'; await requestCoreGrowthProjection(); } root.removeAttribute('aria-busy'); page = 'core-plan'; render(); return; } if (a === 'ui05-open-weekly-action') { root.setAttribute('aria-busy', 'true'); if (coreGrowthApiEnabled()) { const selection = coreGrowthProjection?.cards?.find((item) => item.surface === 'UI-05')?.plan_preview?.focus || 'PARENT_CHILD_COMMUNICATION'; await submitCoreGrowthNoop('UI-05', 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', selection); coreGrowthLoadState = 'IDLE'; await requestCoreGrowthProjection(); } root.removeAttribute('aria-busy'); page = 'growth-daily-task'; render(); return; } if (a === 'ui09-open-family-review') { page = 'growth-report'; render(); return; } if (a === 'ui06-create-private-draft') { if (!coreGrowthApiEnabled() || !config.onboardingId) { page = 'growth-daily-task'; render(); return; } root.setAttribute('aria-busy', 'true'); try { await createUi06PrivateCheckinDraft(); growthReadbackLoadState = 'IDLE'; await requestUi07Ui08Readbacks(); } catch (_error) { privateCheckinDraftState = 'ERROR'; } root.removeAttribute('aria-busy'); render(); return; } if (a === 'ui06-open-family-review') { page = 'growth-report'; render(); return; } if (a === 'ui06-continue-daily-action') { page = 'growth-daily-task'; render(); return; } if (a === 'ui10-return-daily-action') { page = 'growth-daily-task'; render(); return; } if (a === 'ui07-open-plan') { page = 'core-plan'; render(); return; } if (a === 'ui07-open-family-review') { page = 'growth-report'; render(); return; } if (a === 'ui13-open-catalog-item') { selectedCatalogItem = commerceCatalogProjection?.find((item) => item.product_ref === el.dataset.ui13CatalogItem) || null; detailInterestState = ''; page = 'commerce-product'; render(); return; } if (a === 'ui14-return-catalog') { page = 'commerce-mall'; render(); return; } if (a === 'ui14-open-group-draft') { familyStudyGroupDraftState = ''; page = 'commerce-group'; render(); return; } if (a === 'ui14-open-invitation-draft') { familyInvitationDraftState = ''; page = 'commerce-invite'; render(); return; } if (a === 'ui14-save-interest') { root.setAttribute('aria-busy', 'true'); const payload = await requestCommerceIntent('commerce-submit-intent'); root.removeAttribute('aria-busy'); detailInterestState = payload?.intent?.status === 'SUBMITTED' ? 'SAVED' : 'ERROR'; render(); return; } if (a === 'ui15-return-content-detail') { page = 'commerce-product'; render(); return; } if (a === 'ui15-save-invitation-draft') { root.setAttribute('aria-busy', 'true'); const payload = await requestTestExperience('experience-create-invite'); root.removeAttribute('aria-busy'); familyInvitationDraftState = payload?.external_effect !== true && ['CREATED', 'REPLAYED', 'CONFIRMED'].includes(payload?.status) ? 'SAVED' : 'ERROR'; llmTextEquivalent = familyInvitationDraftState === 'SAVED' ? '邀请说明已记下。' : '暂时无法记下这段说明，请稍后再试。'; render(); return; } if (a === 'ui16-return-content-detail') { page = 'commerce-product'; render(); return; } if (a === 'ui16-save-study-group-draft') { root.setAttribute('aria-busy', 'true'); const payload = await requestTestExperience('experience-create-group'); root.removeAttribute('aria-busy'); familyStudyGroupDraftState = payload?.external_effect !== true && ['CREATED', 'REPLAYED', 'CONFIRMED'].includes(payload?.status) ? 'SAVED' : 'ERROR'; llmTextEquivalent = familyStudyGroupDraftState === 'SAVED' ? '共学想法已记下。' : '暂时无法记下这个想法，请稍后再试。'; render(); return; } if (a === 'ui17-open-family-review') { page = 'growth-report'; render(); return; } if (a === 'ui17-continue-daily-action') { page = 'growth-daily-task'; render(); return; } if (a === 'ui18-open-growth-profile') { page = 'core-mine'; render(); return; } if (a === 'ui18-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui18-open-support-topics') { page = 'teacher-zone'; render(); return; } if (a === 'ui22-return-support-topics') { page = 'teacher-zone'; render(); return; } if (a === 'ui22-open-activity-detail') { const card = platformSurfacesProjection?.cards?.find((item) => item.surface === 'UI-22'); const activities = card?.family_growth_activity_catalog?.activities || []; selectedGrowthActivity = activities.find((activity) => activity.activity_ref === el.dataset.ui22ActivityRef) || activities[0] || null; page = 'activity-detail'; render(); return; } if (a === 'ui23-return-activity-catalog') { page = 'salon-list'; render(); return; } if (a === 'ui25-open-exchange-detail') { const card = platformSurfacesProjection?.cards?.find((item) => item.surface === 'UI-25'); const entries = card?.family_learning_exchange_feed?.entries || []; selectedLearningExchange = entries.find((entry) => entry.exchange_ref === el.dataset.ui25ExchangeRef) || entries[0] || null; page = 'dynamic-detail'; render(); return; } if (a === 'ui25-open-sharing-draft') { familySharingDraftState = ''; familyExpressionNotesState = ''; page = 'publish-dynamic'; render(); return; } if (a === 'ui25-open-activity-catalog') { page = 'salon-list'; render(); return; } if (a === 'ui26-return-exchange-feed' || a === 'ui27-return-exchange-feed' || a === 'ui28-return-exchange-feed') { page = 'parent-community'; render(); return; } if (a === 'ui26-open-expression-notes') { familyExpressionNotesState = familySharingDraftState === 'SAVED' ? 'SAVED' : 'EMPTY'; page = 'my-community'; render(); return; } if (a === 'ui28-open-growth-plan' || a === 'ui29-open-growth-plan' || a === 'ui30-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui30-open-my-services') { page = 'my-services'; render(); return; } if (a === 'ui30-open-points') { page = 'commerce-points'; render(); return; } if (a === 'ui31-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui31-open-daily-action') { page = 'growth-daily-task'; render(); return; } if (a === 'ui31-open-support-records') { page = 'service-mine'; render(); return; } if (a === 'ui32-open-annual-member') { page = 'annual-member-mine'; render(); return; } if (a === 'ui32-open-my-services') { page = 'my-services'; render(); return; } if (a === 'ui32-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui33-open-my-services') { page = 'my-services'; render(); return; } if (a === 'ui34-open-support-records') { page = 'service-mine'; render(); return; } if (a === 'ui34-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui33-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui30-open-invite') { page = 'commerce-invite'; render(); return; } if (a === 'ui30-return-annual-member') { page = 'annual-member-mine'; render(); return; } if (a === 'ui30-create-renewal-interest') { root.setAttribute('aria-busy', 'true'); const payload = await requestTestExperience('experience-create-renewal-interest'); root.removeAttribute('aria-busy'); renewalInterestDraftState = payload?.external_effect !== true && ['CREATED', 'REPLAYED', 'CONFIRMED'].includes(payload?.status) ? 'SAVED' : 'ERROR'; render(); return; } if (a === 'live-return-support') { page = 'teacher-zone'; render(); return; } if (a === 'live-open-support-records') { page = 'service-mine'; render(); return; } if (a === 'live') { page = 'teacher-zone'; render(); return; } if (a === 'ui01-enter-expert-live') { root.setAttribute('aria-busy', 'true'); const payload = await requestTestExperience('experience-enter-expert-live'); root.removeAttribute('aria-busy'); expertLiveSessionState = payload?.external_effect === false && ['CREATED', 'REPLAYED', 'CONFIRMED'].includes(payload?.status) ? 'SAVED' : 'ERROR'; render(); return; } if (a === 'ui29-open-private-story') { page = 'growth-poster'; render(); return; } if (a === 'ui26-save-sharing-draft') { root.setAttribute('aria-busy', 'true'); const payload = await requestTestExperience('experience-publish-template'); root.removeAttribute('aria-busy'); familySharingDraftState = payload?.external_effect === false && ['CREATED', 'REPLAYED', 'CONFIRMED'].includes(payload?.status) ? 'SAVED' : 'ERROR'; familyExpressionNotesState = familySharingDraftState === 'SAVED' ? 'SAVED' : ''; llmTextEquivalent = familySharingDraftState === 'SAVED' ? '家庭分享草稿已记下。可以慢慢修改，之后再决定。' : '暂时无法记下这段想法，请稍后再试。'; render(); return; } if (a === 'ui20-return-support-topics') { page = 'teacher-zone'; render(); return; } if (a === 'ui20-open-consultation-need') { consultationNeedDraftState = ''; page = 'consultation-booking'; render(); return; } if (a === 'ui21-return-support-explanation') { page = 'teacher-detail'; render(); return; } if (a === 'ui21-save-consultation-need') { root.setAttribute('aria-busy', 'true'); const payload = await requestConsultationNeedDraft(); root.removeAttribute('aria-busy'); consultationNeedDraftState = payload ? 'SAVED' : 'ERROR'; render(); return; } if (a === 'ui21-open-support-records') { familySupportRecordsLoadState = 'IDLE'; page = 'service-mine'; render(); return; } if (a === 'ui24-open-support-topics') { page = 'teacher-zone'; render(); return; } if (a === 'ui24-open-growth-plan') { page = 'core-plan'; render(); return; } if (a === 'ui11-open-plan') { page = 'core-plan'; render(); return; } if (a === 'ui11-open-private-story') { page = 'growth-poster'; render(); return; } if (a === 'ui12-return-growth-journey') { page = 'growth-ranking'; render(); return; } if (a === 'ui11-open-family-review') { page = 'growth-report'; render(); return; } if (a === 'page-objects-complete-daily-task') { root.setAttribute('aria-busy', 'true'); await requestUi09TaskCompletion(); root.removeAttribute('aria-busy'); render(); return; } if (a === 'camp21-checkin') { root.setAttribute('aria-busy', 'true'); const day = el.dataset.ui35Day || '1'; await submitCoreGrowthNoop('UI-35', 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', `DAY_${day}_PARENT_ACTION`); coreGrowthLoadState = 'IDLE'; await requestCoreGrowthProjection(); root.removeAttribute('aria-busy'); render(); return; } if (a in serviceBookingActionRoutes) { root.setAttribute('aria-busy', 'true'); const route = serviceBookingActionRoutes[a]; await requestServiceBooking(a); root.removeAttribute('aria-busy'); page = route.nextPage; render(); return; } if (a in commerceActionRoutes) { root.setAttribute('aria-busy', 'true'); const route = commerceActionRoutes[a]; await requestCommerceIntent(a); root.removeAttribute('aria-busy'); page = route.nextPage; render(); return; } if (a in llmActionRoutes) { const [pageId, nextPage] = llmActionRoutes[a]; root.setAttribute('aria-busy', 'true'); await requestPageExplanation(pageId); root.removeAttribute('aria-busy'); page = nextPage; render(); return; } if (a in experienceActionRoutes) { root.setAttribute('aria-busy', 'true'); const route = experienceActionRoutes[a]; await requestTestExperience(a); root.removeAttribute('aria-busy'); page = route.nextPage; render(); return; } if (a === 'back') { page = 'home'; } else if (a === 'assessment-form') { page = 'report'; } else if (a.startsWith('check-')) { checked[Number(a.slice(6))] = !checked[Number(a.slice(6))]; } else if (a === 'home' || a in { assessment:1, report:1, task:1, child:1, ranking:1, poster:1, plan:1, mall:1, product:1, invite:1, group:1, points:1, mine:1, member:1, 'core-report':1, 'core-plan':1, 'core-community':1, 'core-mine':1, 'growth-assessment':1, 'growth-report':1, 'growth-daily-task':1, 'growth-child':1, 'growth-camp-21':1, 'growth-ranking':1, 'growth-poster':1, 'commerce-mall':1, 'commerce-product':1, 'commerce-invite':1, 'commerce-group':1, 'commerce-points':1, 'commerce-mine':1, 'teacher-zone':1, 'teacher-detail':1, 'consultation-booking':1, 'salon-list':1, 'activity-detail':1, 'service-mine':1, 'parent-community':1, 'publish-dynamic':1, 'dynamic-detail':1, 'my-community':1, 'growth-outcomes':1, 'annual-member-mine':1, 'my-services':1, 'orders-assets':1, 'family-profile':1, 'service-records':1 }) { page = a; } render(); })); }
  render();
  return {
    navigate: (nextPage) => {
      page = (FAMILY_UI_34_ROUTE_SET.has(nextPage) || FAMILY_SUPPORT_ROUTE_SET.has(nextPage)) ? nextPage : 'home';
      render();
    },
  };
}

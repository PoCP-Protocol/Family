/** @typedef {import('@family/contracts').CompleteGrowthReviewResponse} CompleteGrowthReviewResponse */
/** @typedef {import('@family/contracts').FamilyTimelineResponse} FamilyTimelineResponse */
/** @typedef {import('@family/contracts').FamilyTimelineEventDto} FamilyTimelineEventDto */
/** @typedef {import('@family/contracts').NextStepDecision} NextStepDecision */
/** @typedef {import('@family/contracts').OutcomeObservationDto} OutcomeObservationDto */
/** @typedef {import('@family/contracts').RecordNextStepDecisionResponse} RecordNextStepDecisionResponse */
/** @typedef {import('@family/contracts').RecordOutcomeObservationResponse} RecordOutcomeObservationResponse */
/** @typedef {import('./app.js').AppConfig} AppConfig */

/**
 * @typedef {object} Wave3State
 * @property {FamilyTimelineResponse | undefined} timeline
 * @property {CompleteGrowthReviewResponse | undefined} review
 * @property {RecordNextStepDecisionResponse | undefined} nextStep
 */

/** @returns {Wave3State} */
export function createInitialWave3State() {
  return {
    timeline: undefined,
    review: undefined,
    nextStep: undefined,
  };
}

/**
 * @param {Wave3State} wave3
 * @param {string | undefined} episodeId
 * @returns {string}
 */
export function renderWave3Section(wave3, episodeId) {
  const review = wave3.review?.review;
  return `
    <section class="wave3-panel" aria-labelledby="wave3-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">F10 / F11 Wave3</p>
          <h2 id="wave3-title">观察、复盘与下一步决策</h2>
          <p class="section-description">把 7 天过程收束成可追溯的时间线和复盘，不写总分、排名或诊断。</p>
        </div>
        <span class="status-pill" data-status="${review ? 'started' : 'idle'}">${review ? '已复盘' : '待复盘'}</span>
      </div>
      <p class="boundary-note">Timeline is provenance, not score or ranking. GrowthReview is not diagnosis and does not mutate GrowthProfile. NextStepDecision is not NextAction.</p>
      <div class="wave3-actions" aria-label="Wave3 操作">
        <button type="button" data-wave3-action="record-parent-observation" ${episodeId ? '' : 'disabled'}>记录父母结果观察</button>
        <button type="button" data-wave3-action="record-child-observation" ${episodeId ? '' : 'disabled'}>记录孩子结果观察</button>
        <button type="button" data-wave3-action="complete-review" ${episodeId ? '' : 'disabled'}>完成 7 天复盘</button>
        <button type="button" data-wave3-action="refresh-timeline" ${episodeId ? '' : 'disabled'}>刷新时间线</button>
        <button type="button" data-wave3-action="record-next-step" ${review ? '' : 'disabled'}>记录下一步决策</button>
      </div>
      <div class="wave3-grid">
        ${renderTimelineCard(wave3.timeline)}
        ${renderReviewCard(wave3.review)}
        ${renderNextStepCard(wave3.nextStep)}
      </div>
    </section>
  `;
}

/** @param {FamilyTimelineResponse | undefined} timeline */
function renderTimelineCard(timeline) {
  return `
    <article class="wave3-card" aria-labelledby="timeline-title">
      <p class="eyebrow">F10 Family Timeline</p>
      <h3 id="timeline-title">7 天过程时间线</h3>
      ${timeline ? `<ol class="timeline-list">
        ${timeline.events.map((event) => `<li><span>${event.event_type}</span><strong>${event.title}</strong><small>${event.boundary}</small></li>`).join('')}
      </ol>` : '<p>完成行动记录后，可以读取只包含来源与事件的过程时间线。</p>'}
    </article>
  `;
}

/** @param {CompleteGrowthReviewResponse | undefined} reviewResponse */
function renderReviewCard(reviewResponse) {
  const review = reviewResponse?.review;
  return `
    <article class="wave3-card" aria-labelledby="review-title">
      <p class="eyebrow">F11 Growth Review</p>
      <h3 id="review-title">7 天成长复盘</h3>
      ${review ? `<dl>
        <div><dt>完成</dt><dd>${review.action_summary.completed}</dd></div>
        <div><dt>部分</dt><dd>${review.action_summary.partial}</dd></div>
        <div><dt>未完成</dt><dd>${review.action_summary.not_completed}</dd></div>
        <div><dt>缺失</dt><dd>${review.action_summary.missing}</dd></div>
        <div><dt>观察</dt><dd>${review.observation_ids.length} 条</dd></div>
      </dl>
      <p class="limitation">${review.limitations.join(' / ') || '当前复盘仅基于行动与观察记录。'}</p>
      <span class="confirmed-strip">${review.boundary}</span>
      ${reviewResponse.observations.map((observation) => `<p class="observation-line">${observation.perspective_type}: ${observation.observation_text}</p>`).join('')}` : '<p>复盘必须等待 7 天行动窗口完成或到期，不把缺失记录自动写成未完成。</p>'}
    </article>
  `;
}

/** @param {RecordNextStepDecisionResponse | undefined} nextStep */
function renderNextStepCard(nextStep) {
  return `
    <article class="wave3-card" aria-labelledby="next-step-title">
      <p class="eyebrow">Next Step Decision</p>
      <h3 id="next-step-title">下一步只记录决策</h3>
      ${nextStep ? `<dl>
        <div><dt>决策</dt><dd>${nextStep.decision.decision}</dd></div>
        <div><dt>理由</dt><dd>${nextStep.decision.rationale ?? '未填写'}</dd></div>
      </dl>
      <span class="confirmed-strip">${nextStep.decision.boundary}</span>` : '<p>这里没有自动创建下一轮行动，只保存人工确认的下一步方向。</p>'}
    </article>
  `;
}

/** @param {FamilyTimelineResponse} timeline @returns {FamilyTimelineResponse} */
export function sanitizeTimelineForProduct(timeline) {
  return {
    ...timeline,
    events: timeline.events.map((event) => ({
      ...event,
      payload: {},
    })),
  };
}

/** @param {AppConfig} config @param {string} episodeId @returns {Promise<FamilyTimelineResponse>} */
export async function fetchGrowthTimeline(config, episodeId) {
  const body = await fetchWave3Json(`${config.apiBaseUrl}/families/${config.familyId}/growth/intervention-episodes/${episodeId}/timeline`, config, 'GrowthTimeline');
  return sanitizeTimelineForProduct(/** @type {FamilyTimelineResponse} */ (body));
}

/** @param {AppConfig} config @param {string} episodeId @param {'PARENT_OBSERVATION' | 'CHILD_OBSERVATION'} perspectiveType @param {string} actionId @returns {Promise<RecordOutcomeObservationResponse>} */
export async function submitRecordOutcomeObservation(config, episodeId, perspectiveType, actionId) {
  const isChild = perspectiveType === 'CHILD_OBSERVATION';
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/outcome-observations`, {
    method: 'POST',
    headers: createWave3Headers(config, createWave3IdempotencyKey('m2-106-observation', config.familyId, episodeId, perspectiveType)),
    body: JSON.stringify({
      subject_person_id: config.childId,
      observer_person_id: isChild ? config.childId : config.guardianPersonId,
      intervention_episode_id: episodeId,
      perspective_type: perspectiveType,
      observation_text: isChild ? '孩子观察到本周被打断时能更容易说完。' : '父母观察到自己更容易先听完再回应。',
      action_refs: actionId ? [actionId] : [],
      reflection_refs: actionId ? [actionId] : [],
      evidence_refs: [],
      limitations: ['SELF_REPORT_ONLY'],
      observed_at: new Date().toISOString(),
    }),
  });
  return parseWave3Response(response, 'RecordOutcomeObservation');
}

/** @param {AppConfig} config @param {string} episodeId @returns {Promise<CompleteGrowthReviewResponse>} */
export async function submitCompleteGrowthReview(config, episodeId) {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/intervention-episodes/${episodeId}/review/complete`, {
    method: 'POST',
    headers: createWave3Headers(config, createWave3IdempotencyKey('m2-106-review', config.familyId, episodeId)),
    body: JSON.stringify({}),
  });
  return parseWave3Response(response, 'CompleteGrowthReview');
}

/** @param {AppConfig} config @param {string} reviewId @param {NextStepDecision} decision @returns {Promise<RecordNextStepDecisionResponse>} */
export async function submitRecordNextStepDecision(config, reviewId, decision = 'CONTINUE') {
  const response = await fetch(`${config.apiBaseUrl}/families/${config.familyId}/growth/reviews/${reviewId}/next-step`, {
    method: 'POST',
    headers: createWave3Headers(config, createWave3IdempotencyKey('m2-106-next-step', config.familyId, reviewId)),
    body: JSON.stringify({
      decision,
      rationale: '人工确认：先延续当前练习；这里没有自动创建下一轮行动。',
    }),
  });
  return parseWave3Response(response, 'RecordNextStepDecision');
}

/** @param {AppConfig} config @param {string} episodeId @returns {FamilyTimelineResponse} */
export function createFrozenTimelineFixture(config, episodeId) {
  return {
    family_id: config.familyId,
    intervention_episode_id: episodeId,
    events: [
      createTimelineEvent(config, episodeId, 'INTERVENTION_STARTED', 'Intervention started', 'episode-1'),
      createTimelineEvent(config, episodeId, 'GROWTH_ACTION_COMPLETED', 'Day 1 action completed', 'action-day-1'),
    ],
  };
}

/** @param {AppConfig} config @param {string} episodeId @returns {CompleteGrowthReviewResponse} */
export function createFrozenReviewFixture(config, episodeId) {
  return {
    review: {
      review_id: 'review-1',
      family_id: config.familyId,
      onboarding_id: 'onboarding-1',
      intervention_episode_id: episodeId,
      priority_id: 'priority-R03',
      dimension_id: 'R03',
      status: 'COMPLETED',
      action_summary: { total_actions: 7, completed: 1, partial: 0, not_completed: 0, missing: 6 },
      observation_ids: ['observation-parent', 'observation-child'],
      limitations: ['MISSING_CHECK_INS', 'PARENT_OBSERVATION_ONLY'],
      boundary: 'REVIEW_IS_NOT_PROFILE_MUTATION_OR_DIAGNOSIS',
      policy_version: 'M2_106_DETERMINISTIC_V1',
      completed_by_actor_id: config.actorPersonId,
      completed_at: '2026-08-10T00:00:00.000Z',
      created_at: '2026-08-10T00:00:00.000Z',
    },
    observations: [
      createFrozenObservation(config, episodeId, 'PARENT_OBSERVATION', '父母观察到自己更容易先听完再回应。'),
      createFrozenObservation(config, episodeId, 'CHILD_OBSERVATION', '孩子观察到本周被打断时能更容易说完。'),
    ],
  };
}

/** @param {AppConfig} config @param {string} reviewId @returns {RecordNextStepDecisionResponse} */
export function createFrozenNextStepFixture(config, reviewId) {
  return {
    decision: {
      decision_id: 'decision-1',
      family_id: config.familyId,
      review_id: reviewId,
      intervention_episode_id: 'episode-1',
      decision: 'CONTINUE',
      rationale: '人工确认：先延续当前练习；这里没有自动创建下一轮行动。',
      boundary: 'NEXT_STEP_DECISION_IS_NOT_NEXT_ACTION',
      policy_version: 'M2_106_DETERMINISTIC_V1',
      decided_by_actor_id: config.actorPersonId,
      decided_at: '2026-08-10T00:00:00.000Z',
      created_at: '2026-08-10T00:00:00.000Z',
    },
  };
}

/** @param {string} url @param {AppConfig} config @param {string} label @returns {Promise<unknown>} */
async function fetchWave3Json(url, config, label) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-Actor-Id': config.actorPersonId },
  });
  return parseWave3Response(response, label);
}

/** @param {Response} response @param {string} label @returns {Promise<any>} */
async function parseWave3Response(response, label) {
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body && typeof body === 'object' && 'message' in body && body.message ? String(body.message) : `${label} failed with ${response.status}`);
  }
  if (!body) {
    throw new Error(`${label} returned an invalid response.`);
  }
  return body;
}

/** @param {AppConfig} config @param {string} idempotencyKey */
function createWave3Headers(config, idempotencyKey) {
  return {
    'Content-Type': 'application/json',
    'X-Actor-Id': config.actorPersonId,
    'Idempotency-Key': idempotencyKey,
  };
}

/** @param {string} prefix @param {...string} parts */
function createWave3IdempotencyKey(prefix, ...parts) {
  return [prefix, ...parts].join('-');
}

/** @param {AppConfig} config @param {string} episodeId @param {import('@family/contracts').FamilyTimelineEventType} eventType @param {string} title @param {string} resourceId @returns {FamilyTimelineEventDto} */
function createTimelineEvent(config, episodeId, eventType, title, resourceId) {
  return {
    event_id: `${eventType}-${resourceId}`,
    family_id: config.familyId,
    intervention_episode_id: episodeId,
    event_type: eventType,
    occurred_at: '2026-08-10T00:00:00.000Z',
    source: eventType === 'INTERVENTION_STARTED' ? 'INTERVENTION_EPISODE' : 'GROWTH_ACTION',
    resource_id: resourceId,
    title,
    payload: {},
    boundary: 'TIMELINE_IS_PROVENANCE_NOT_SCORE_OR_RANKING',
  };
}

/** @param {AppConfig} config @param {string} episodeId @param {'PARENT_OBSERVATION' | 'CHILD_OBSERVATION'} perspectiveType @param {string} text @returns {OutcomeObservationDto} */
function createFrozenObservation(config, episodeId, perspectiveType, text) {
  const isChild = perspectiveType === 'CHILD_OBSERVATION';
  return {
    observation_id: isChild ? 'observation-child' : 'observation-parent',
    family_id: config.familyId,
    subject_person_id: config.childId,
    observer_person_id: isChild ? config.childId : config.guardianPersonId,
    intervention_episode_id: episodeId,
    perspective_type: perspectiveType,
    observation_text: text,
    action_refs: ['action-day-1'],
    reflection_refs: ['action-day-1'],
    evidence_refs: [],
    limitations: ['SELF_REPORT_ONLY'],
    observed_at: '2026-08-10T00:00:00.000Z',
    boundary: 'OBSERVATION_IS_NOT_FACT_OR_CAUSAL_EFFECT',
    policy_version: 'M2_106_DETERMINISTIC_V1',
    created_at: '2026-08-10T00:00:00.000Z',
  };
}

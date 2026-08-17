// @ts-nocheck
/**
 * ARCH-GO-TEST-FULL-FUNCTION-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * 纯 UI 状态机。它不保存 family/actor/subject，不生成推荐、评分、标签或 Action。
 */
export const TEST_LOOP_STAGES = Object.freeze({
  INTRO: 'INTRO',
  NEED: 'NEED',
  INTENT: 'INTENT',
  CANDIDATES: 'CANDIDATES',
  DETAIL: 'DETAIL',
  COMPARE: 'COMPARE',
  CONFIRM: 'CONFIRM',
  PAUSED: 'PAUSED',
  NO_ACTION: 'NO_ACTION',
  DECISION: 'DECISION',
  SAFE_STOP: 'SAFE_STOP',
  AUDIT: 'AUDIT',
  MULTIMODAL: 'MULTIMODAL',
});

export function createInitialTestLoopState() {
  return {
    /** 全量 App 导航只控制可见页面，不改变 family/actor/subject 或服务端事实。 */
    section: 'home',
    stage: TEST_LOOP_STAGES.INTRO,
    needRef: null,
    intentId: null,
    fixtureVersion: null,
    candidates: [],
    selectedCandidate: null,
    safeStop: null,
    receipt: null,
    auditEntries: [],
    message: '这是仅供内部开发体验的合成闭环。不会使用真实家庭或儿童数据，也不会启动真实服务。',
  };
}

export function moveTestLoop(state, stage, patch = {}) {
  return { ...state, ...patch, stage };
}

export function presentCandidates(state, payload) {
  if (payload.safe_stop) return moveTestLoop(state, TEST_LOOP_STAGES.SAFE_STOP, { safeStop: payload.safe_stop, candidates: [], fixtureVersion: payload.fixture_version ?? null, message: payload.text_equivalent });
  return moveTestLoop(state, TEST_LOOP_STAGES.CANDIDATES, {
    intentId: payload.intent_id,
    fixtureVersion: payload.fixture_version,
    candidates: payload.candidates,
    safeStop: null,
    message: payload.text_equivalent,
  });
}

export function selectCandidateForDetails(state, offerRef) {
  const selectedCandidate = state.candidates.find((candidate) => candidate.offer_ref === offerRef) ?? null;
  if (!selectedCandidate) return moveTestLoop(state, TEST_LOOP_STAGES.SAFE_STOP, { safeStop: { template_id: 'REF-L1-NOT-AVAILABLE', message: '这个选择当前还不能继续。你可以返回查看其他已准入选择，或现在先不继续。' } });
  return moveTestLoop(state, TEST_LOOP_STAGES.DETAIL, { selectedCandidate, message: selectedCandidate.text_equivalent });
}

export function pauseTestLoop(state) {
  return moveTestLoop(state, TEST_LOOP_STAGES.PAUSED, { message: '你们暂时停止查看候选。当前没有新增计划或服务过程；以后可以重新查看。' });
}

export function showNoAction(state, receipt) {
  return moveTestLoop(state, TEST_LOOP_STAGES.NO_ACTION, { receipt, message: receipt.text_equivalent });
}

export function showDecision(state, receipt) {
  return moveTestLoop(state, TEST_LOOP_STAGES.DECISION, { receipt, message: receipt.text_equivalent });
}

export function showAudit(state, auditEntries) {
  return moveTestLoop(state, TEST_LOOP_STAGES.AUDIT, { auditEntries, message: '以下仅显示内部合成闭环的最小审计元数据，不含家庭原文、儿童资料或模型推理。' });
}

export function textOnlyActions(stage) {
  const common = ['返回', '退出'];
  switch (stage) {
    case TEST_LOOP_STAGES.INTRO: return ['开始内部演示', '现在先不行动', ...common];
    case TEST_LOOP_STAGES.NEED: return ['继续', '跳过这一步', ...common];
    case TEST_LOOP_STAGES.INTENT: return ['查看当前可选支持', '现在先不行动', ...common];
    case TEST_LOOP_STAGES.CANDIDATES:
    case TEST_LOOP_STAGES.DETAIL:
    case TEST_LOOP_STAGES.COMPARE: return ['查看说明', '返回', '先暂停', '现在先不行动', '退出'];
    case TEST_LOOP_STAGES.CONFIRM: return ['确认选择这个下一步', '返回看看其他选择', '现在先不行动', '退出'];
    case TEST_LOOP_STAGES.PAUSED: return ['继续查看', '现在先不行动', '退出'];
    case TEST_LOOP_STAGES.MULTIMODAL: return ['查看合成情境', '返回', '退出'];
    case TEST_LOOP_STAGES.SAFE_STOP: return ['返回', '现在先不行动', '退出'];
    default: return common;
  }
}

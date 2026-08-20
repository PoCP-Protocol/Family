import { describe, expect, it } from 'vitest';
import {
  TEST_LOOP_STAGES,
  createInitialTestLoopState,
  moveTestLoop,
  pauseTestLoop,
  presentCandidates,
  selectCandidateForDetails,
  showDecision,
  showNoAction,
  textOnlyActions,
} from './test-loop-flow.js';

const candidates = [
  { offer_ref: 'synthetic:a', title: '候选 A', text_equivalent: '候选 A 的完整文字说明。平台不对候选排序。' },
  { offer_ref: 'synthetic:b', title: '候选 B', text_equivalent: '候选 B 的完整文字说明。平台不对候选排序。' },
];

describe('DEV L0/L1 test-loop flow', () => {
  it('starts as a text-only internal demo with no family state embedded', () => {
    const state = createInitialTestLoopState();
    expect(state.stage).toBe(TEST_LOOP_STAGES.INTRO);
    expect(state).not.toHaveProperty('familyId');
    expect(state).not.toHaveProperty('actorId');
    expect(textOnlyActions(state.stage)).toContain('现在先不行动');
  });

  it('shows equal unranked candidates and supports detail/return flow', () => {
    const base = moveTestLoop(createInitialTestLoopState(), TEST_LOOP_STAGES.INTENT, { intentId: 'intent-1' });
    const list = presentCandidates(base, { intent_id: 'intent-1', fixture_version: 'fixture-v1', candidates, safe_stop: null, text_equivalent: '等量候选说明。' });
    expect(list.stage).toBe(TEST_LOOP_STAGES.CANDIDATES);
    expect(list.candidates).toEqual(candidates);
    expect(list.candidates.every((candidate: Record<string, unknown>) => !Object.hasOwn(candidate, 'rank'))).toBe(true);
    const detail = selectCandidateForDetails(list, 'synthetic:a');
    expect(detail.stage).toBe(TEST_LOOP_STAGES.DETAIL);
    expect(detail.selectedCandidate.title).toBe('候选 A');
    expect(textOnlyActions(detail.stage)).toEqual(expect.arrayContaining(['返回', '先暂停', '现在先不行动']));
  });

  it('pauses without creating a decision, plan or case state', () => {
    const paused = pauseTestLoop(moveTestLoop(createInitialTestLoopState(), TEST_LOOP_STAGES.CANDIDATES, { candidates }));
    expect(paused.stage).toBe(TEST_LOOP_STAGES.PAUSED);
    expect(paused).not.toHaveProperty('planId');
    expect(paused).not.toHaveProperty('caseId');
    expect(paused).not.toHaveProperty('decisionId');
  });

  it('renders NO_ACTION and Decision receipts without treating either as an Action', () => {
    const base = createInitialTestLoopState();
    const noAction = showNoAction(base, { text_equivalent: '现在先不行动，不会创建计划、服务过程、任务或提醒。', action_started: false, plan_id: null, case_id: null });
    expect(noAction.stage).toBe(TEST_LOOP_STAGES.NO_ACTION);
    expect(noAction.receipt).toMatchObject({ action_started: false, plan_id: null, case_id: null });
    const decision = showDecision(base, { text_equivalent: '仅记录 Decision；未启动真实服务。', action_started: false, plan_id: null, case_id: null });
    expect(decision.stage).toBe(TEST_LOOP_STAGES.DECISION);
    expect(decision.receipt).toMatchObject({ action_started: false, plan_id: null, case_id: null });
  });

  it('fails closed when a candidate is not part of the current list', () => {
    const stopped = selectCandidateForDetails(moveTestLoop(createInitialTestLoopState(), TEST_LOOP_STAGES.CANDIDATES, { candidates }), 'unknown');
    expect(stopped.stage).toBe(TEST_LOOP_STAGES.SAFE_STOP);
    expect(stopped.safeStop.template_id).toBe('REF-L1-NOT-AVAILABLE');
  });
});

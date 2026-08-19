import { describe, expect, it } from 'vitest';
import { FAMILY_PLATFORM_SIX_LOOP_SCENARIOS } from '../../test-fixtures/family-platform-six-loop.fixture';

describe('Family platform six-loop contract boundaries', () => {
  it('covers the six PPT-derived loop nodes without inventing a new loop taxonomy', () => {
    expect(FAMILY_PLATFORM_SIX_LOOP_SCENARIOS.map((scenario) => scenario.name)).toEqual([
      '家庭体检获客',
      'AI诊断分析',
      '每日任务执行',
      '孩子端参与',
      '榜单激励留存',
      '报告分享裂变',
    ]);
    expect(FAMILY_PLATFORM_SIX_LOOP_SCENARIOS).toHaveLength(6);
  });

  it('keeps all loop fixtures family-scoped and external-effect free', () => {
    for (const scenario of FAMILY_PLATFORM_SIX_LOOP_SCENARIOS) {
      expect(scenario.uiScope.length).toBeGreaterThan(0);
      expect(scenario.externalEffect).toBe(false);
      expect(scenario.input).not.toContain('public');
      expect(scenario.output).not.toContain('cross_family');
    }
  });

  it('keeps AI-native boundaries explicit', () => {
    const diagnosis = FAMILY_PLATFORM_SIX_LOOP_SCENARIOS.find((scenario) => scenario.id === 'LOOP-02');
    const action = FAMILY_PLATFORM_SIX_LOOP_SCENARIOS.find((scenario) => scenario.id === 'LOOP-03');
    const review = FAMILY_PLATFORM_SIX_LOOP_SCENARIOS.find((scenario) => scenario.id === 'LOOP-05');
    const sharing = FAMILY_PLATFORM_SIX_LOOP_SCENARIOS.find((scenario) => scenario.id === 'LOOP-06');

    expect(diagnosis?.canonicalWrite).toBe('no_diagnosis_no_outcome');
    expect(diagnosis?.modelGateway).toBe('no_op_or_rule_projection_only');
    expect(action?.canonicalWrite).toBe('complete_growth_action');
    expect(review?.forbidden).toEqual(['family_ranking', 'total_score', 'child_diagnosis']);
    expect(sharing?.forbidden).toEqual(['public_publish', 'cross_family_visibility', 'external_share']);
  });
});

import { describe, expect, it } from 'vitest';
import {
  FAMILY_BUSINESS_LOOPS,
  FAMILY_BUSINESS_SCENARIOS,
  FAMILY_UI_ARCHITECTURE_BINDINGS,
  UI01_HOME_FEATURES,
  UI01_ENTRY_EXECUTION_QUEUE,
  assertFamilyBusinessScenarioCoverage,
  assertUi01EntryExecutionQueue,
  assertUi01HomeFeatureCoverage,
  assertFamilyUiArchitectureCoverage,
  getFamilyUiArchitectureBinding,
} from '@family/contracts';

describe('Family Growth OS six-loop UI architecture', () => {
  it('maps all 34 supplied UI screens exactly once', () => {
    expect(() => assertFamilyUiArchitectureCoverage()).not.toThrow();
    expect(FAMILY_UI_ARCHITECTURE_BINDINGS).toHaveLength(34);
    expect(new Set(FAMILY_UI_ARCHITECTURE_BINDINGS.map((item) => item.ui_id)).size).toBe(34);
  });

  it('uses only the six supplied business-loop families', () => {
    expect(new Set(FAMILY_UI_ARCHITECTURE_BINDINGS.map((item) => item.loop))).toEqual(new Set(FAMILY_BUSINESS_LOOPS));
  });

  it('decomposes six PDCA scenarios that collectively cover all 34 UI screens', () => {
    expect(() => assertFamilyBusinessScenarioCoverage()).not.toThrow();
    expect(FAMILY_BUSINESS_SCENARIOS).toHaveLength(6);
    expect(new Set(FAMILY_BUSINESS_SCENARIOS.map((scenario) => scenario.loop))).toEqual(new Set(FAMILY_BUSINESS_LOOPS));
    expect(new Set(FAMILY_BUSINESS_SCENARIOS.flatMap((scenario) => scenario.ui_ids)).size).toBe(34);
  });

  it('catalogues UI-01 visible feature points with routes and object boundaries', () => {
    expect(() => assertUi01HomeFeatureCoverage()).not.toThrow();
    expect(UI01_HOME_FEATURES.length).toBeGreaterThanOrEqual(16);
    expect(UI01_HOME_FEATURES.find((feature) => feature.feature_id === 'today_tasks')).toMatchObject({
      target_route: 'growth-daily-task', state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION',
    });
    expect(UI01_HOME_FEATURES.find((feature) => feature.feature_id === 'task_emotion')).toMatchObject({
      target_route: 'growth-daily-task', evidence_boundary: 'PERSPECTIVE',
    });
  });

  it('defines a UI-01 entry execution queue that reaches researched target pages', () => {
    expect(() => assertUi01EntryExecutionQueue()).not.toThrow();
    expect(UI01_ENTRY_EXECUTION_QUEUE).toEqual(expect.arrayContaining([
      expect.objectContaining({ source_feature_id: 'assessment_campaign', target_ui_id: 'UI-02', target_route: 'growth-assessment' }),
      expect.objectContaining({ source_feature_id: 'ai_diagnostic', target_ui_id: 'UI-03', target_route: 'assessment' }),
    ]));
  });

  it('preserves the first real slice and no-external-effect boundary', () => {
    expect(getFamilyUiArchitectureBinding('UI-09')).toMatchObject({
      loop: 'GROWTH_LOOP', state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION',
    });
    expect(getFamilyUiArchitectureBinding('UI-21')).toMatchObject({
      loop: 'TEACHER_SALON_LOOP', state_boundary: 'NOOP_ADAPTER', ai_boundary: 'NO_MODEL_CALL',
    });
  });
});

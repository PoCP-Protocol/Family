import { describe, expect, it } from 'vitest';
import {
  FAMILY_BUSINESS_LOOPS,
  FAMILY_BUSINESS_SCENARIOS,
  FAMILY_UI_ARCHITECTURE_BINDINGS,
  assertFamilyBusinessScenarioCoverage,
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

  it('preserves the first real slice and no-external-effect boundary', () => {
    expect(getFamilyUiArchitectureBinding('UI-09')).toMatchObject({
      loop: 'GROWTH_LOOP', state_boundary: 'NAMED_ACTION', evidence_boundary: 'NAMED_ACTION',
    });
    expect(getFamilyUiArchitectureBinding('UI-21')).toMatchObject({
      loop: 'TEACHER_SALON_LOOP', state_boundary: 'NOOP_ADAPTER', ai_boundary: 'NO_MODEL_CALL',
    });
  });
});

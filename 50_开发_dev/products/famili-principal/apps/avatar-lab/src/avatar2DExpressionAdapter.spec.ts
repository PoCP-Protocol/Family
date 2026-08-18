import { describe, expect, it } from 'vitest';
import { mapCharacterExpressionToFamilyExpression, verifyExpressionMappingComplete } from './avatar2DExpressionAdapter';
import type { FamilyExpression } from './avatar2DRenderer';

describe('MM3-E: Avatar2D Expression Mapping', () => {
  it('MM3-E01: Every CharacterExpression has explicit mapping', () => {
    const allCharacterExpressions = [
      'NEUTRAL_WARM',
      'LISTENING',
      'THINKING',
      'SOFT_ENCOURAGING',
      'WARM_FIRM',
      'CALM_SERIOUS',
      'CONCERNED_CALM',
      'BOUNDARY_CLEAR',
    ] as const;

    for (const expr of allCharacterExpressions) {
      const mapped = mapCharacterExpressionToFamilyExpression(expr);
      expect(mapped).toBeDefined();
      expect(typeof mapped).toBe('string');
    }
  });

  it('MM3-E02: Mapping exhaustiveness verified at runtime', () => {
    // Should not throw
    expect(() => verifyExpressionMappingComplete()).not.toThrow();
  });

  it('MM3-E03: LISTENING maps to CALM_WARM', () => {
    const result = mapCharacterExpressionToFamilyExpression('LISTENING');
    expect(result).toBe('CALM_WARM');
  });

  it('MM3-E04: SOFT_ENCOURAGING maps to GENTLE_ENCOURAGING', () => {
    const result = mapCharacterExpressionToFamilyExpression('SOFT_ENCOURAGING');
    expect(result).toBe('GENTLE_ENCOURAGING');
  });

  it('MM3-E05: BOUNDARY_CLEAR maps to CALM_SERIOUS', () => {
    const result = mapCharacterExpressionToFamilyExpression('BOUNDARY_CLEAR');
    expect(result).toBe('CALM_SERIOUS');
  });

  it('MM3-E06: NEUTRAL_WARM maps to CALM_WARM', () => {
    const result = mapCharacterExpressionToFamilyExpression('NEUTRAL_WARM');
    expect(result).toBe('CALM_WARM');
  });

  it('MM3-E07: THINKING maps to CALM_WARM', () => {
    const result = mapCharacterExpressionToFamilyExpression('THINKING');
    expect(result).toBe('CALM_WARM');
  });

  it('MM3-E08: WARM_FIRM maps to WARM_FIRM', () => {
    const result = mapCharacterExpressionToFamilyExpression('WARM_FIRM');
    expect(result).toBe('WARM_FIRM');
  });

  it('MM3-E09: CALM_SERIOUS maps to CALM_SERIOUS', () => {
    const result = mapCharacterExpressionToFamilyExpression('CALM_SERIOUS');
    expect(result).toBe('CALM_SERIOUS');
  });

  it('MM3-E10: CONCERNED_CALM maps to CALM_SERIOUS', () => {
    const result = mapCharacterExpressionToFamilyExpression('CONCERNED_CALM');
    expect(result).toBe('CALM_SERIOUS');
  });

  it('MM3-E11: All mapped results are valid FamilyExpression values', () => {
    const validFamilyExpressions = ['CALM_WARM', 'CALM_SERIOUS', 'GENTLE_ENCOURAGING', 'CALM_CAUTIOUS', 'WARM_FIRM'];
    const allCharacterExpressions = [
      'NEUTRAL_WARM',
      'LISTENING',
      'THINKING',
      'SOFT_ENCOURAGING',
      'WARM_FIRM',
      'CALM_SERIOUS',
      'CONCERNED_CALM',
      'BOUNDARY_CLEAR',
    ] as const;

    for (const expr of allCharacterExpressions) {
      const mapped = mapCharacterExpressionToFamilyExpression(expr);
      expect(validFamilyExpressions).toContain(mapped);
    }
  });
});

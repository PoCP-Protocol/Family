import { describe, expect, it } from 'vitest';
import { FES_SYNTHETIC_DATA_CONTRACT } from '@family/fes-contracts';
import { AI_GATEWAY_POLICY } from '@family/ai-gateway';
import { fesApiBoundary, getFesHealth } from './main';

describe('fes-api boundary contract', () => {
  it('keeps FES separate from Family Core', () => {
    expect(fesApiBoundary.application).toBe('FES');
    expect(fesApiBoundary.family_core_dependency).toBe('forbidden');
    expect(fesApiBoundary.semantic_boundaries).toContain('student != Child');
    expect(fesApiBoundary.semantic_boundaries).toContain('check-in != Outcome');
  });

  it('requires AI gateway and human confirmation', () => {
    expect(AI_GATEWAY_POLICY.business_module_direct_provider_call).toBe('forbidden');
    expect(AI_GATEWAY_POLICY.canonical_mutation_by_ai).toBe('forbidden');
    expect(AI_GATEWAY_POLICY.human_confirmation_required).toBe(true);
  });

  it('defines synthetic dirty data without real persons', () => {
    expect(FES_SYNTHETIC_DATA_CONTRACT.synthetic).toBe(true);
    expect(FES_SYNTHETIC_DATA_CONTRACT.no_real_minor).toBe(true);
    expect(FES_SYNTHETIC_DATA_CONTRACT.dirty_data_scenarios).toContain('orphan assessment');
    expect(FES_SYNTHETIC_DATA_CONTRACT.dirty_data_scenarios).toContain('AI conclusion');
  });

  it('exposes a minimal health contract', () => {
    expect(getFesHealth()).toEqual({
      status: 'ok',
      boundary: 'fes-api',
      ready_for_m1_implementation: true,
    });
  });
});

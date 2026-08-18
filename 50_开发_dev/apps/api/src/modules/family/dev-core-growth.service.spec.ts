import { describe, expect, it } from 'vitest';
import { DevCoreGrowthService } from './dev-core-growth.service';

describe('DevCoreGrowthService', () => {
  const service = new DevCoreGrowthService();
  const familyId = '22222222-2222-4222-8222-222222222222';

  it('provides UI-02~UI-10 synthetic Growth OS projection without outcomes, diagnosis, ranking or a model call', () => {
    const projection = service.getProjection(familyId);
    expect(projection).toMatchObject({
      projection_version: 'DEV_CORE_GROWTH_V1',
      family_id: familyId,
      data_source: 'SYNTHETIC_DEV_ONLY',
      model_gateway: { status: 'NOOP_NOT_INVOKED', rule: 'NO_FREE_TEXT_MODEL_WRITE_TO_CORE_ONTOLOGY' },
    });
    expect(projection.cards.map((card) => card.surface)).toEqual(['UI-02', 'UI-03', 'UI-04', 'UI-05', 'UI-06', 'UI-07', 'UI-08', 'UI-10']);
    expect(projection.cards.every((card) => card.data_source === 'SYNTHETIC_DEV_ONLY')).toBe(true);
    expect(JSON.stringify(projection)).not.toContain('family_ranking');
    expect(JSON.stringify(projection)).not.toContain('family_total_score');
    expect(JSON.stringify(projection)).not.toContain('diagnosis');
  });

  it('exposes a controller-safe allow-list for supported DEV surfaces', () => {
    expect(service.supportsSurface('UI-05')).toBe(true);
    expect(service.supportsSurface('UI-11')).toBe(false);
  });

  it('acknowledges supported DEV commands without persistence or external effect', () => {
    expect(service.acknowledgeNoop(familyId, 'UI-05', 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT')).toEqual({
      family_id: familyId,
      surface: 'UI-05',
      command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT',
      status: 'NOOP_ACKNOWLEDGED',
      persistence: 'NONE',
      external_effect: false,
      audit_boundary: 'DEV_COMMAND_TRACE_ONLY',
    });
  });

  it('rejects unsupported surfaces rather than creating an implicit dynamic route', () => {
    expect(() => service.acknowledgeNoop(familyId, 'UI-99' as any, 'UNKNOWN')).toThrow('unsupported_dev_core_growth_surface');
  });
});

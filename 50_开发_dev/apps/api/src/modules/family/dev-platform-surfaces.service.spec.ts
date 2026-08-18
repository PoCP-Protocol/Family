import { describe, expect, it } from 'vitest';
import { DevPlatformSurfacesService } from './dev-platform-surfaces.service';

describe('DevPlatformSurfacesService', () => {
  const service = new DevPlatformSurfacesService();
  const familyId = '22222222-2222-4222-8222-222222222222';

  it('covers UI-11 through UI-34 with synthetic, no-external-effect platform cards', () => {
    const projection = service.getProjection(familyId);
    expect(projection).toMatchObject({
      projection_version: 'DEV_PLATFORM_SURFACES_V1', family_id: familyId,
      data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED', model_gateway: 'NOOP_NOT_INVOKED',
    });
    expect(projection.cards).toHaveLength(24);
    expect(projection.cards.map((card) => card.surface)).toEqual([
      'UI-11','UI-12','UI-13','UI-14','UI-15','UI-16','UI-17','UI-18',
      'UI-19','UI-20','UI-21','UI-22','UI-23','UI-24','UI-25','UI-26',
      'UI-27','UI-28','UI-29','UI-30','UI-31','UI-32','UI-33','UI-34',
    ]);
    const text = JSON.stringify(projection);
    expect(text).not.toContain('family_total_score');
    expect(text).not.toContain('external_effect:true');
    expect(text).not.toContain('diagnosis');
  });

  it('exposes a controller-safe allow-list for UI-11~UI-34', () => {
    expect(service.supportsSurface('UI-21')).toBe(true);
    expect(service.supportsSurface('UI-10')).toBe(false);
  });

  it('returns an explicit no-op receipt for an external-effect shaped UI command', () => {
    expect(service.acknowledgeNoop(familyId, 'UI-21', 'PREVIEW_SYNTHETIC_BOOKING')).toEqual({
      family_id: familyId, surface: 'UI-21', command: 'PREVIEW_SYNTHETIC_BOOKING',
      status: 'NOOP_ACKNOWLEDGED', persistence: 'NONE', external_effect: false, model_gateway: 'NOOP_NOT_INVOKED',
    });
  });

  it('rejects surfaces outside the UI-11..UI-34 DEV platform contract', () => {
    expect(() => service.acknowledgeNoop(familyId, 'UI-10' as any, 'UNKNOWN')).toThrow('unsupported_dev_platform_surface');
  });
});

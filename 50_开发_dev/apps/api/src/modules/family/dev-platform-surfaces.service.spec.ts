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
    expect(projection.cards.find((card) => card.surface === 'UI-13')).toMatchObject({
      loop: 'COMMERCE_LOOP', business_capability: 'Catalog projection', state_boundary: 'READ_ONLY',
    });
    expect(projection.cards.find((card) => card.surface === 'UI-21')).toMatchObject({
      loop: 'TEACHER_SALON_LOOP', primary_objects: ['ServiceOffering', 'BookingDraft'], state_boundary: 'NOOP_ADAPTER',
    });
    expect(projection.cards.find((card) => card.surface === 'UI-25')).toMatchObject({ loop: 'COMMUNITY_LOOP' });
    expect(projection.cards.find((card) => card.surface === 'UI-33')).toMatchObject({ loop: 'CUSTOMER_BACKEND_LOOP' });
    const text = JSON.stringify(projection);
    expect(text).not.toContain('family_total_score');
    expect(text).not.toContain('external_effect:true');
    expect(text).not.toContain('diagnosis');
  });

  it('builds UI-11 as a same-family process journey instead of a ranking', () => {
    const emptyJourney = service.getProjection(familyId).cards.find((card) => card.surface === 'UI-11')?.personal_growth_journey;
    expect(emptyJourney).toMatchObject({ state: 'STARTING', plan_route: 'core-plan', review_route: 'growth-report', fact_boundary: 'PROCESS_EVENTS_NOT_OUTCOME_OR_RANKING' });
    const journey = service.getProjection(familyId, [
      { event_id: 'evt-02', ui_id: 'UI-02', business_loop: 'GROWTH_LOOP', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', event_state: 'DEV_CONFIRMED', created_at: '2026-08-19T00:00:01.000Z', replayed: false, selection: 'EMOTION_REGULATION' },
      { event_id: 'evt-05', ui_id: 'UI-05', business_loop: 'GROWTH_LOOP', command: 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', event_state: 'DEV_CONFIRMED', created_at: '2026-08-19T00:00:02.000Z', replayed: false },
      { event_id: 'evt-09', ui_id: 'UI-09', business_loop: 'GROWTH_LOOP', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', event_state: 'DEV_CONFIRMED', created_at: '2026-08-19T00:00:03.000Z', replayed: false },
      { event_id: 'evt-13', ui_id: 'UI-13', business_loop: 'COMMERCE_LOOP', command: 'READ_SYNTHETIC_CATALOG', event_state: 'DEV_CONFIRMED', created_at: '2026-08-19T00:00:04.000Z', replayed: false },
    ]).cards.find((card) => card.surface === 'UI-11')?.personal_growth_journey;
    expect(journey).toMatchObject({ state: 'IN_PROGRESS', headline: '我们已经走过的几步', plan_route: 'core-plan', review_route: 'growth-report' });
    expect(journey?.entries.map((entry) => entry.event_id)).toEqual(['evt-02', 'evt-05', 'evt-09']);
    const userJourneyContent = JSON.stringify({ state: journey?.state, headline: journey?.headline, entries: journey?.entries, plan_route: journey?.plan_route, review_route: journey?.review_route });
    expect(userJourneyContent).not.toMatch(/rank|score|percentile|peer|city|class|streak|badge|reward/i);
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

import type { GrowthActionDto } from '@family/contracts';

/**
 * UI-01/UI-09 FIRST-SLICE SYNTHETIC DEV FIXTURE ONLY.
 *
 * This file contains no real PII, no production IDs, no assessment result and
 * no educational outcome. It must never be imported by production request
 * paths; it exists solely for deterministic test/e2e/demo setup.
 */
export const UI01_UI09_SYNTHETIC_FIXTURE = Object.freeze({
  label: 'SYNTHETIC_DEV_ONLY__UI01_UI09_FIRST_SLICE_V1',
  familyId: '22222222-2222-4222-8222-222222222222',
  guardianAccountRef: 'synthetic-ui01-ui09-guardian',
  guardianDisplayName: 'Synthetic Guardian',
  childDisplayName: 'Synthetic Child',
  requiredConsentPurposes: ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'] as const,
  todayAction: {
    action_id: '11111111-1111-4111-8111-111111111111',
    family_id: '22222222-2222-4222-8222-222222222222',
    onboarding_id: '33333333-3333-4333-8333-333333333333',
    priority_id: '44444444-4444-4444-8444-444444444444',
    intervention_episode_id: '55555555-5555-4555-8555-555555555555',
    day_index: 1,
    status: 'PENDING',
    assignment_text: '先听完再回应',
    due_date: '2026-08-18',
    completed_at: null,
    completion_status: null,
    reflection: null,
    reflection_boundary: null,
    boundary: 'ACTION_IS_NOT_OUTCOME',
    created_at: '2026-08-18T00:00:00.000Z',
  } satisfies GrowthActionDto,
});

import { describe, expect, it } from 'vitest';
import { FamilyController } from './family.controller';

const familyId = '22222222-2222-4222-8222-222222222222';
const taskId = '11111111-1111-4111-8111-111111111111';
const actorId = '77777777-7777-4777-8777-777777777777';

const action = {
  action_id: taskId,
  family_id: familyId,
  onboarding_id: '33333333-3333-4333-8333-333333333333',
  priority_id: '44444444-4444-4444-8444-444444444444',
  intervention_episode_id: '55555555-5555-4555-8555-555555555555',
  day_index: 1 as const,
  status: 'COMPLETED' as const,
  assignment_text: '先听完再回应',
  due_date: '2026-08-18',
  completed_at: '2026-08-18T10:00:00.000Z',
  completion_status: 'COMPLETED' as const,
  reflection: '',
  reflection_boundary: 'REFLECTION_IS_RAW_MATERIAL_NOT_OUTCOME' as const,
  boundary: 'ACTION_IS_NOT_OUTCOME' as const,
  created_at: '2026-08-18T00:00:00.000Z',
};

function controller(overrides: Record<string, unknown> = {}) {
  const growthActionService = {
    completeGrowthAction: async () => ({ action, reflection_boundary: action.reflection_boundary, replayed: false }),
    ...overrides,
  };
  const todayService = {
    getFamilyTodayProjection: async () => ({
      projection_version: 'UI01_UI09_FAMILY_TODAY_V1',
      family_id: familyId,
      entry_state: 'READY',
      today_task: { task_id: taskId, assignment_text: action.assignment_text, task_state: 'NOT_STARTED' },
      ai_ready: { model_gateway_status: 'NOOP_NOT_INVOKED', evidence_boundary: 'ACTION_CHECKIN_IS_NOT_OUTCOME_OR_CAUSAL_EFFECT' },
    }),
  };
  const devCoreGrowthService = {
    supportsSurface: (surface: string) => surface === 'UI-05',
    getProjection: (scopeFamilyId: string) => ({ family_id: scopeFamilyId, data_source: 'SYNTHETIC_DEV_ONLY', cards: [] }),
    acknowledgeNoop: (scopeFamilyId: string, surface: string, command: string) => ({ family_id: scopeFamilyId, surface, command, status: 'NOOP_ACKNOWLEDGED', persistence: 'NONE', external_effect: false }),
  };
  const devPlatformSurfacesService = {
    supportsSurface: (surface: string) => surface === 'UI-21',
    getProjection: (scopeFamilyId: string) => ({ family_id: scopeFamilyId, data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED', cards: [] }),
    acknowledgeNoop: (scopeFamilyId: string, surface: string, command: string) => ({ family_id: scopeFamilyId, surface, command, status: 'NOOP_ACKNOWLEDGED', persistence: 'NONE', external_effect: false, model_gateway: 'NOOP_NOT_INVOKED' }),
  };
  const devFlowReceiptService = {
    record: async (scopeFamilyId: string, scopeActorId: string, input: { ui_id: string; command: string; correlation_id: string; idempotency_key?: string }) => ({
      event_id: '88888888-8888-4888-8888-888888888888', family_id: scopeFamilyId, ui_id: input.ui_id,
      business_loop: 'GROWTH_LOOP', command: input.command, event_state: 'DEV_CONFIRMED',
      data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false, model_gateway_status: 'NOOP_NOT_INVOKED', replayed: false,
      created_at: '2026-08-19T00:00:00.000Z', actor_id: scopeActorId,
    }),
    list: async (scopeFamilyId: string) => [],
  };
  return new FamilyController(
    {} as any, {} as any, {} as any, {} as any,
    growthActionService as any, {} as any, {} as any, todayService as any,
    devCoreGrowthService as any, devPlatformSurfacesService as any, devFlowReceiptService as any,
  );
}

describe('UI-01/UI-09 first slice controller contract', () => {
  it('returns the family-scoped Today projection without creating a canonical object', async () => {
    const result = await controller().today(familyId, actorId);
    expect(result).toMatchObject({
      family_id: familyId,
      entry_state: 'READY',
      ai_ready: { model_gateway_status: 'NOOP_NOT_INVOKED' },
    });
    expect(result).not.toHaveProperty('outcome');
    expect(result).not.toHaveProperty('family_total_score');
  });

  it('returns the family-scoped DEV Core Growth projection and acknowledges no-op command without persistence', async () => {
    const instance = controller();
    await expect(instance.devCoreGrowth(familyId, actorId)).resolves.toMatchObject({ family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY' });
    await expect(instance.devCoreGrowthCommand(familyId, actorId, { surface: 'UI-05', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT' })).resolves.toMatchObject({
      family_id: familyId, surface: 'UI-05', status: 'NOOP_ACKNOWLEDGED', persistence: 'NONE', external_effect: false,
    });
  });

  it('returns the family-scoped DEV Platform Surfaces projection and no-op receipt without external effect', async () => {
    const instance = controller();
    await expect(instance.devPlatformSurfaces(familyId, actorId)).resolves.toMatchObject({ family_id: familyId, data_source: 'SYNTHETIC_DEV_ONLY', external_effect_adapter: 'NOOP_NOT_INVOKED' });
    await expect(instance.devPlatformSurfacesCommand(familyId, actorId, { surface: 'UI-21', command: 'PREVIEW_SYNTHETIC_BOOKING' })).resolves.toMatchObject({
      family_id: familyId, surface: 'UI-21', status: 'NOOP_ACKNOWLEDGED', persistence: 'NONE', external_effect: false,
    });
  });

  it('rejects an unrecognized DEV platform surface before service execution', async () => {
    const instance = controller();
    await expect(instance.devPlatformSurfacesCommand(familyId, actorId, { surface: 'UI-99', command: 'UNKNOWN' })).rejects.toMatchObject({ response: { message: 'unsupported_dev_platform_surface' } });
  });

  it('records a persistent DEV synthetic flow receipt with no external effect', async () => {
    const result = await controller().recordDevFlowEvent(
      familyId,
      actorId,
      { ui_id: 'UI-05', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT' },
      'corr-dev-flow',
      'idem-dev-flow',
    );
    expect(result).toMatchObject({
      family_id: familyId, ui_id: 'UI-05', business_loop: 'GROWTH_LOOP',
      event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY', external_effect: false,
    });
  });

  it('wraps the existing CompleteGrowthAction readback in TaskCheckinResultProjection', async () => {
    const result = await controller().checkInTodayTask(
      familyId,
      taskId,
      { completion_status: 'COMPLETED', reflection: '', occurred_at: '2026-08-18T10:00:00.000Z' },
      actorId,
      'corr-ui01-ui09-contract',
      'ui-01-ui-09-first-slice',
      'idem-ui01-ui09-contract',
    );

    expect(result).toMatchObject({
      result_state: 'SUCCESS',
      action: { task_id: taskId, task_state: 'CHECKED_IN' },
      audit_status: 'RECORDED',
      correlation_id: 'corr-ui01-ui09-contract',
      idempotency_key_ref: 'idem-ui01-ui09-contract',
    });
    expect(result).not.toHaveProperty('outcome');
    expect(result).not.toHaveProperty('external_effect');
  });
});

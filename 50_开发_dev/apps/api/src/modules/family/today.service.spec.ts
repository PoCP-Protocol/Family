import { describe, expect, it } from 'vitest';
import { TodayService } from './today.service';
import { UI01_UI09_SYNTHETIC_FIXTURE } from './test-fixtures/ui01-ui09-synthetic.fixture';

/** TODAY-001 / UI-01+UI-09 · Today 只读聚合单测(stub GrowthActionService)。 */
function svc(action: unknown) {
  const fake = { getTodayAction: async () => action } as any;
  return new TodayService(fake);
}

const pendingAction = UI01_UI09_SYNTHETIC_FIXTURE.todayAction;

describe('TodayService.getToday', () => {
  it('无今日行动 → todaysAction null,pendingCheckin false', async () => {
    const t = await svc(null).getToday('fam-1', 'actor');
    expect(t.todaysAction).toBeNull();
    expect(t.pendingCheckin).toBe(false);
  });
  it('有未完成行动 → todaysAction=文案,pendingCheckin true', async () => {
    const t = await svc({ assignment_text: '先听完再回应', completed_at: null }).getToday('fam-1', 'actor');
    expect(t.todaysAction).toBe('先听完再回应');
    expect(t.pendingCheckin).toBe(true);
  });
  it('已完成行动 → pendingCheckin false', async () => {
    const t = await svc({ assignment_text: '先听完再回应', completed_at: '2026-08-15T00:00:00Z' }).getToday('fam-1', 'actor');
    expect(t.pendingCheckin).toBe(false);
  });
});

describe('TodayService.getFamilyTodayProjection', () => {
  it('maps an existing pending GrowthAction into the UI-01/UI-09 family-scoped projection', async () => {
    const projection = await svc(pendingAction).getFamilyTodayProjection(pendingAction.family_id, 'actor');

    expect(projection).toMatchObject({
      projection_version: 'UI01_UI09_FAMILY_TODAY_V1',
      family_id: pendingAction.family_id,
      entry_state: 'READY',
      today_task: {
        task_id: pendingAction.action_id,
        assignment_text: '先听完再回应',
        task_state: 'NOT_STARTED',
        checkin_allowed: true,
      },
      ai_ready: {
        evidence_boundary: 'ACTION_CHECKIN_IS_NOT_OUTCOME_OR_CAUSAL_EFFECT',
        recommendation_source: 'RULE_BASED_SYNTHETIC_NO_RECOMMENDATION',
        model_gateway_status: 'NOOP_NOT_INVOKED',
      },
    });
    expect(projection).not.toHaveProperty('outcome');
    expect(projection).not.toHaveProperty('family_total_score');
    expect(projection).not.toHaveProperty('family_ranking');
  });

  it('returns a real EMPTY projection rather than fabricating a task', async () => {
    const projection = await svc(null).getFamilyTodayProjection('22222222-2222-4222-8222-222222222222', 'actor');
    expect(projection.entry_state).toBe('EMPTY');
    expect(projection.today_task).toBeNull();
    expect(projection.ai_ready.model_gateway_status).toBe('NOOP_NOT_INVOKED');
  });
});

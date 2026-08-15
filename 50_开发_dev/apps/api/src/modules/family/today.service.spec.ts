import { describe, expect, it } from 'vitest';
import { TodayService } from './today.service';

/** TODAY-001 · Today 只读聚合单测(stub GrowthActionService)。 */
function svc(action: unknown) {
  const fake = { getTodayAction: async () => action } as any;
  return new TodayService(fake);
}

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

import type { AuditMeta, CompleteGrowthActionResponse } from '@family/contracts';
import { describe, expect, it } from 'vitest';
import type { FamilyRepository } from './family.repository';
import { REFLECTION_BOUNDARY } from './growth-action.policy';
import { GrowthActionService } from './growth-action.service';
import type { GrowthSubjectResolver } from './growth-subject.resolver';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const priorityId = '33333333-3333-4333-8333-333333333333';
const episodeId = '55555555-5555-4555-8555-555555555555';
const actionId = '77777777-7777-4777-8777-777777777777';
const childId = '66666666-6666-4666-8666-666666666666';
const actorId = 'actor-parent-1';

const meta: AuditMeta = {
  actor: actorId,
  correlationId: 'corr-m2-105-complete',
  source: 'vitest',
  occurredAt: '2026-08-10T00:00:00.000Z',
};

describe('GrowthActionService', () => {
  it('returns only an action due today and does not roll forward to a future day', async () => {
    const client = new FakeGrowthActionClient();
    const service = new GrowthActionService(createRepository(client), createSubjectResolver());

    await expect(service.getTodayAction(familyId, actorId)).resolves.toBeNull();

    expect(client.todayActionQuery).toContain('ga.due_date = current_date');
  });

  it('stores completion and reflection as raw material without profile or outcome writes', async () => {
    const client = new FakeGrowthActionClient();
    const service = new GrowthActionService(createRepository(client), createSubjectResolver());

    const response = await service.completeGrowthAction({
      family_id: familyId,
      action_id: actionId,
      completion_status: 'PARTIAL',
      reflection: '今天我先听完了,但中间还是有一次打断。',
      occurred_at: meta.occurredAt,
      idempotency_key: 'idem-complete-action',
    }, meta);

    expect(response.reflection_boundary).toBe(REFLECTION_BOUNDARY);
    expect(response.action).toMatchObject({
      action_id: actionId,
      status: 'PARTIAL',
      completion_status: 'PARTIAL',
      reflection_boundary: REFLECTION_BOUNDARY,
      boundary: 'ACTION_IS_NOT_OUTCOME',
    });
    expect(client.updatedActionCount).toBe(1);
    expect(client.auditActions).toEqual(['CompleteGrowthAction']);
    expect(client.outboxEvents).toEqual(['GrowthActionCompleted']);
    expect(client.profileOrOutcomeWrites).toEqual([]);
  });

  it('blocks completion when normal safety route cannot be verified', async () => {
    const client = new FakeGrowthActionClient(null, false);
    const service = new GrowthActionService(createRepository(client), createSubjectResolver());

    await expect(service.completeGrowthAction({
      family_id: familyId,
      action_id: actionId,
      completion_status: 'COMPLETED',
      reflection: '已完成。',
      occurred_at: meta.occurredAt,
      idempotency_key: 'idem-complete-normal-route-blocked',
    }, meta)).rejects.toThrow('normal_safety_route_not_verified');

    expect(client.updatedActionCount).toBe(0);
    expect(client.auditActions).toEqual([]);
    expect(client.outboxEvents).toEqual([]);
  });

  it('blocks a safety-sensitive new reflection without completing or emitting normal side effects', async () => {
    const client = new FakeGrowthActionClient();
    const service = new GrowthActionService(createRepository(client), createSubjectResolver());

    await expect(service.completeGrowthAction({
      family_id: familyId,
      action_id: actionId,
      completion_status: 'PARTIAL',
      reflection: '我不想活了，想伤害自己。',
      occurred_at: meta.occurredAt,
      idempotency_key: 'idem-sensitive-reflection',
    }, meta)).rejects.toThrow('reflection_requires_safety_support');

    expect(client.updatedActionCount).toBe(0);
    expect(client.auditActions).toEqual([]);
    expect(client.outboxEvents).toEqual([]);
  });

  it('replays an idempotent completion without rewriting the action', async () => {
    const replayResponse = createReplayResponse();
    const client = new FakeGrowthActionClient(replayResponse);
    const service = new GrowthActionService(createRepository(client), createSubjectResolver());

    const response = await service.completeGrowthAction({
      family_id: familyId,
      action_id: actionId,
      completion_status: 'COMPLETED',
      reflection: '已完成。',
      occurred_at: meta.occurredAt,
      idempotency_key: 'idem-complete-replay',
    }, meta);

    expect(response).toEqual({ ...replayResponse, replayed: true });
    expect(client.updatedActionCount).toBe(0);
    expect(client.auditActions).toEqual([]);
  });

  it('rejects a different idempotency key after the action is terminal', async () => {
    const client = new FakeGrowthActionClient(null, true, 'COMPLETED');
    const service = new GrowthActionService(createRepository(client), createSubjectResolver());

    await expect(service.completeGrowthAction({
      family_id: familyId,
      action_id: actionId,
      completion_status: 'PARTIAL',
      reflection: '第二次试图改写。',
      occurred_at: meta.occurredAt,
      idempotency_key: 'idem-complete-different-key',
    }, meta)).rejects.toThrow('growth_action_already_checked_in');

    expect(client.updatedActionCount).toBe(0);
    expect(client.auditActions).toEqual([]);
    expect(client.outboxEvents).toEqual([]);
  });
});

function createRepository(client: FakeGrowthActionClient): FamilyRepository {
  return {
    withTransaction: async <T>(work: (txClient: FakeGrowthActionClient) => Promise<T>) => work(client),
  } as unknown as FamilyRepository;
}

function createReplayResponse(): CompleteGrowthActionResponse {
  return {
    action: {
      action_id: actionId,
      family_id: familyId,
      onboarding_id: onboardingId,
      priority_id: priorityId,
      intervention_episode_id: episodeId,
      day_index: 1,
      status: 'COMPLETED',
      assignment_text: '停顿三秒,让孩子把话说完,今天不急着给建议。',
      due_date: '2026-08-10',
      completed_at: meta.occurredAt,
      completion_status: 'COMPLETED',
      reflection: '已完成。',
      reflection_boundary: REFLECTION_BOUNDARY,
      boundary: 'ACTION_IS_NOT_OUTCOME',
      created_at: meta.occurredAt,
    },
    reflection_boundary: REFLECTION_BOUNDARY,
  };
}

class FakeGrowthActionClient {
  updatedActionCount = 0;
  auditActions: string[] = [];
  outboxEvents: string[] = [];
  profileOrOutcomeWrites: string[] = [];
  todayActionQuery = '';
  private actionName = '';
  private requestHash = '';

  constructor(
    private readonly replayResponse: CompleteGrowthActionResponse | null = null,
    private readonly normalRouteVerified = true,
    private readonly currentActionStatus = 'PENDING',
  ) {}

  async query(sql: string, params: unknown[] = []): Promise<{ rowCount: number; rows: unknown[] }> {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    if (normalized.startsWith('insert into idempotency_keys')) {
      this.actionName = params[1] as string;
      this.requestHash = params[2] as string;
      return { rowCount: 1, rows: [] };
    }
    if (normalized.startsWith('select action_name, request_hash, response_body')) {
      return { rowCount: 1, rows: [{ action_name: this.actionName, request_hash: this.requestHash, response_body: this.replayResponse }] };
    }
    if (normalized.startsWith('select family_id from families')) {
      return { rowCount: 1, rows: [{ family_id: familyId }] };
    }
    if (normalized.startsWith('select audit_id from audit_logs')) {
      return { rowCount: 1, rows: [{ audit_id: 'audit-create-family' }] };
    }
    if (this.replayResponse) {
      throw new Error(`unexpected query after idempotency replay: ${normalized}`);
    }
    if (normalized.startsWith('select ga.action_id, ga.family_id')) {
      this.todayActionQuery = normalized;
      return { rowCount: 0, rows: [] };
    }
    if (normalized.startsWith('select ga.action_id, ga.onboarding_id, ga.priority_id')) {
      return { rowCount: 1, rows: [{ action_id: actionId, onboarding_id: onboardingId, priority_id: priorityId, status: this.currentActionStatus }] };
    }
    if (normalized.startsWith('select profile.subject_person_id')) {
      return { rowCount: 1, rows: [{ subject_person_id: childId, subject_relationship_id: null }] };
    }
    if (normalized.startsWith('select purpose from consents')) {
      return { rowCount: 3, rows: [{ purpose: 'SERVICE' }, { purpose: 'ASSESSMENT' }, { purpose: 'GROWTH_TRACKING' }] };
    }
    if (normalized.startsWith("select payload->'safety_disposition'->>'severity'")) {
      if (!this.normalRouteVerified) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 1, rows: [{ severity: 'LOW', disposition: 'NORMAL' }] };
    }
    if (normalized.startsWith('select perspective_id from perspectives')) {
      return { rowCount: 0, rows: [] };
    }
    if (normalized.startsWith('update growth_actions')) {
      this.updatedActionCount += 1;
      return {
        rowCount: 1,
        rows: [{
          action_id: actionId,
          family_id: familyId,
          onboarding_id: onboardingId,
          priority_id: priorityId,
          intervention_episode_id: episodeId,
          day_index: 1,
          status: params[2],
          assignment_text: '停顿三秒,让孩子把话说完,今天不急着给建议。',
          due_date: '2026-08-10',
          completed_at: params[3],
          completion_status: params[2],
          reflection: params[4],
          reflection_boundary: params[5],
          boundary: 'ACTION_IS_NOT_OUTCOME',
          created_at: meta.occurredAt,
        }],
      };
    }
    if (normalized.startsWith('insert into audit_logs')) {
      this.auditActions.push(params[3] as string);
      return { rowCount: 1, rows: [] };
    }
    if (normalized.startsWith('insert into outbox_events')) {
      this.outboxEvents.push(params[2] as string);
      return { rowCount: 1, rows: [] };
    }
    if (normalized.startsWith('update idempotency_keys')) {
      return { rowCount: 1, rows: [] };
    }
    if (normalized.includes('growth_profiles') || normalized.includes('outcomes') || normalized.includes('milestones') || normalized.includes('growth_reviews')) {
      this.profileOrOutcomeWrites.push(normalized);
    }
    throw new Error(`unexpected query: ${normalized}`);
  }
}

function createSubjectResolver(): GrowthSubjectResolver {
  return {
    resolve: async () => ({
      childPersonId: childId,
      guardianPersonIds: [actorId],
      subjectRelationshipId: null,
      resolvedVia: 'ONBOARDING_AND_PROFILE_PROVENANCE',
    }),
  } as GrowthSubjectResolver;
}

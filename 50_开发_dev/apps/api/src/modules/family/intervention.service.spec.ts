import type { AuditMeta, StartInterventionResponse } from '@family/contracts';
import { describe, expect, it } from 'vitest';
import type { FamilyRepository } from './family.repository';
import { buildGrowthActionAssignments, getListenBeforeRespondCard } from './intervention.policy';
import { InterventionService } from './intervention.service';
import type { GrowthSubjectResolver } from './growth-subject.resolver';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const priorityId = '33333333-3333-4333-8333-333333333333';
const profileId = '44444444-4444-4444-8444-444444444444';
const episodeId = '55555555-5555-4555-8555-555555555555';
const childId = '66666666-6666-4666-8666-666666666666';
const actorId = 'actor-parent-1';

const meta: AuditMeta = {
  actor: actorId,
  correlationId: 'corr-m2-105-start',
  source: 'vitest',
  occurredAt: '2026-08-10T00:00:00.000Z',
};

describe('Intervention policy', () => {
  it('builds a seven-day listen-before-respond card without outcome claims', () => {
    const card = getListenBeforeRespondCard();
    const assignments = buildGrowthActionAssignments(meta.occurredAt);

    expect(card).toMatchObject({
      intervention_id: 'INTERVENTION-001',
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      name_zh: '先听后回应',
      duration_days: 7,
      policy_version: 'M2_105_DETERMINISTIC_V1',
    });
    expect(card.expected_outcome).toContain('不承诺结果改善');
    expect(assignments).toHaveLength(7);
    expect(assignments.map((item) => item.dayIndex)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(assignments[0]).toMatchObject({ dueDate: '2026-08-10' });
    expect(assignments[6]).toMatchObject({ dueDate: '2026-08-16' });
  });
});

describe('InterventionService', () => {
  it('starts one active episode and exactly seven pending growth actions', async () => {
    const client = new FakeInterventionClient();
    const service = new InterventionService(createRepository(client), createSubjectResolver());

    const response = await service.startIntervention({
      family_id: familyId,
      onboarding_id: onboardingId,
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      idempotency_key: 'idem-start-intervention',
    }, meta);

    expect(response.episode).toMatchObject({
      episode_id: episodeId,
      priority_id: priorityId,
      intervention_id: 'INTERVENTION-001',
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      status: 'ACTIVE',
      planned_days: 7,
      policy_version: 'M2_105_DETERMINISTIC_V1',
    });
    expect(response.actions).toHaveLength(7);
    expect(response.actions.every((action) => action.status === 'PENDING')).toBe(true);
    expect(response.actions.every((action) => action.boundary === 'ACTION_IS_NOT_OUTCOME')).toBe(true);
    expect(response.actions.map((action) => action.day_index)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(client.insertedEpisodeCount).toBe(1);
    expect(client.insertedActions).toHaveLength(7);
    expect(client.auditActions).toEqual(['StartIntervention']);
    expect(client.outboxEvents).toEqual(['InterventionStarted']);
    expect(client.profileOrOutcomeWrites).toEqual([]);
  });

  it('blocks start when normal safety route cannot be verified', async () => {
    const client = new FakeInterventionClient(null, false);
    const service = new InterventionService(createRepository(client), createSubjectResolver());

    await expect(service.startIntervention({
      family_id: familyId,
      onboarding_id: onboardingId,
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      idempotency_key: 'idem-start-normal-route-blocked',
    }, meta)).rejects.toThrow('normal_safety_route_not_verified');

    expect(client.insertedEpisodeCount).toBe(0);
    expect(client.insertedActions).toEqual([]);
    expect(client.auditActions).toEqual([]);
  });

  it('replays an idempotent response without creating another episode or actions', async () => {
    const replayResponse = createReplayResponse();
    const client = new FakeInterventionClient(replayResponse);
    const service = new InterventionService(createRepository(client), createSubjectResolver());

    const response = await service.startIntervention({
      family_id: familyId,
      onboarding_id: onboardingId,
      priority_id: priorityId,
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      idempotency_key: 'idem-start-replay',
    }, meta);

    expect(response).toEqual(replayResponse);
    expect(client.insertedEpisodeCount).toBe(0);
    expect(client.insertedActions).toEqual([]);
    expect(client.auditActions).toEqual([]);
  });
});

function createRepository(client: FakeInterventionClient): FamilyRepository {
  return {
    withTransaction: async <T>(work: (txClient: FakeInterventionClient) => Promise<T>) => work(client),
  } as unknown as FamilyRepository;
}

function createReplayResponse(): StartInterventionResponse {
  return {
    intervention: getListenBeforeRespondCard(),
    episode: {
      episode_id: episodeId,
      family_id: familyId,
      onboarding_id: onboardingId,
      priority_id: priorityId,
      intervention_id: 'INTERVENTION-001',
      intervention_code: 'LISTEN_BEFORE_RESPOND',
      status: 'ACTIVE',
      started_by_actor_id: actorId,
      started_at: meta.occurredAt,
      planned_days: 7,
      policy_version: 'M2_105_DETERMINISTIC_V1',
      created_at: meta.occurredAt,
    },
    actions: [],
  };
}

class FakeInterventionClient {
  insertedEpisodeCount = 0;
  insertedActions: unknown[][] = [];
  auditActions: string[] = [];
  outboxEvents: string[] = [];
  profileOrOutcomeWrites: string[] = [];
  private actionName = '';
  private requestHash = '';

  constructor(private readonly replayResponse: StartInterventionResponse | null = null, private readonly normalRouteVerified = true) {}

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
    if (normalized.startsWith('select gp.priority_id')) {
      return {
        rowCount: 1,
        rows: [{ priority_id: priorityId, family_id: familyId, onboarding_id: onboardingId, profile_id: profileId, dimension_id: 'R03' }],
      };
    }
    if (normalized.startsWith('select subject_person_id, subject_relationship_id from growth_profiles')) {
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
    if (normalized.startsWith('select episode_id from intervention_episodes')) {
      return { rowCount: 0, rows: [] };
    }
    if (normalized.startsWith('insert into intervention_episodes')) {
      this.insertedEpisodeCount += 1;
      return {
        rowCount: 1,
        rows: [{
          episode_id: episodeId,
          family_id: familyId,
          onboarding_id: onboardingId,
          priority_id: priorityId,
          intervention_id: 'INTERVENTION-001',
          intervention_code: 'LISTEN_BEFORE_RESPOND',
          status: 'ACTIVE',
          started_by_actor_id: actorId,
          started_at: meta.occurredAt,
          planned_days: 7,
          policy_version: 'M2_105_DETERMINISTIC_V1',
          created_at: meta.occurredAt,
        }],
      };
    }
    if (normalized.startsWith('insert into growth_actions')) {
      this.insertedActions.push(params);
      const dayIndex = params[7] as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      return {
        rowCount: 1,
        rows: [{
          action_id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa${dayIndex}`,
          family_id: familyId,
          onboarding_id: onboardingId,
          priority_id: priorityId,
          intervention_episode_id: episodeId,
          day_index: dayIndex,
          status: 'PENDING',
          assignment_text: params[4],
          due_date: params[8],
          completed_at: null,
          completion_status: null,
          reflection: null,
          reflection_boundary: null,
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

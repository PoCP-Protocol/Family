import type { AuditMeta, GrowthPriorityDecision } from '@family/contracts';
import { describe, expect, it } from 'vitest';
import type { FamilyRepository } from './family.repository';
import { buildGrowthPriorityDraft, type ConfirmedProfileForPriority } from './growth-priority.policy';
import { GrowthPriorityService } from './growth-priority.service';
import type { GrowthSubjectResolver } from './growth-subject.resolver';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';
const relationshipId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const relationshipChildId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const actorId = 'actor-parent-1';
const meta: AuditMeta = {
  actor: actorId,
  correlationId: 'corr-m2-104',
  source: 'vitest',
  occurredAt: '2026-08-10T00:00:00.000Z',
};

describe('GrowthPriority policy', () => {
  it('selects R03 as the only primary practice focus without exposing score or ranking', () => {
    const draft = buildGrowthPriorityDraft({
      familyId,
      onboardingId,
      createdAt: meta.occurredAt,
      profiles: [
        createProfile({ profileId: '44444444-4444-4444-8444-444444444444', dimensionId: 'P03', state: 'EMERGING' }),
        createProfile({ profileId: '55555555-5555-4555-8555-555555555555', dimensionId: 'R03', state: 'DEVELOPING' }),
      ],
    });

    expect(draft.decision).toBe('R03');
    expect(draft.candidate).toMatchObject({
      dimension_id: 'R03',
      eligibility: 'ELIGIBLE',
      boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
      policy_version: 'M2_104_DETERMINISTIC_V2',
    });
    expect(draft.draft_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(JSON.stringify(draft)).not.toMatch(/score|rank|diagnosis|recommendation/i);
  });

  it('does not let supporting context compete through hidden ordinal ordering', () => {
    const draft = buildGrowthPriorityDraft({
      familyId,
      onboardingId,
      createdAt: meta.occurredAt,
      profiles: [
        createProfile({ profileId: '44444444-4444-4444-8444-444444444444', dimensionId: 'P03', state: 'DEVELOPING' }),
        createProfile({ profileId: '55555555-5555-4555-8555-555555555555', dimensionId: 'R03', state: 'PRACTICING' }),
        createProfile({ profileId: '66666666-6666-4666-8666-666666666666', dimensionId: 'R04', state: 'DEVELOPING' }),
      ],
    });

    expect(draft.decision).toBe('R03');
    expect(draft.candidate?.dimension_id).toBe('R03');
    expect(draft.profile_snapshot).toMatchObject({ candidate_count: 3, eligible_candidate_count: 1 });
  });

  it('returns NO_PRIORITY_YET when confirmed profile evidence is insufficient', () => {
    const draft = buildGrowthPriorityDraft({
      familyId,
      onboardingId,
      createdAt: meta.occurredAt,
      profiles: [
        createProfile({
          profileId: '66666666-6666-4666-8666-666666666666',
          dimensionId: 'R04',
          state: 'EMERGING',
          evidenceIds: [],
        }),
      ],
    });

    expect(draft.decision).toBe('NO_PRIORITY_YET');
    expect(draft.candidate).toBeNull();
    expect(draft.profile_snapshot).toMatchObject({ eligible_candidate_count: 0 });
  });
});

describe('GrowthPriorityService', () => {
  it('confirms NO_PRIORITY_YET without inserting an active priority', async () => {
    const client = new FakePriorityClient({ profiles: [] });
    const service = new GrowthPriorityService(createRepository(client), createSubjectResolver());
    const draft = buildGrowthPriorityDraft({ familyId, onboardingId, profiles: [], createdAt: meta.occurredAt });

    const response = await service.confirmGrowthPriority({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: draft.draft_id,
      decision: 'NO_PRIORITY_YET',
      idempotency_key: 'idem-no-priority-yet',
    }, meta);

    expect(response.priority).toBeNull();
    expect(response.decision).toBe('NO_PRIORITY_YET');
    expect(client.insertedPriority).toBe(false);
    expect(client.auditActions).toContain('ConfirmGrowthPriority');
    expect(client.outboxEvents).toContain('GrowthPriorityConfirmed');
    expect(client.consentSubjectIds).toEqual([childId]);
  });

  it('creates one active priority and supersedes the previous active priority', async () => {
    const profile = createProfile({ profileId: '77777777-7777-4777-8777-777777777777', dimensionId: 'R03', state: 'DEVELOPING' });
    const client = new FakePriorityClient({ profiles: [profile], activePriorityId: '88888888-8888-4888-8888-888888888888' });
    const service = new GrowthPriorityService(createRepository(client), createSubjectResolver());
    const draft = buildGrowthPriorityDraft({ familyId, onboardingId, profiles: [profile], createdAt: meta.occurredAt });

    const response = await service.confirmGrowthPriority({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: draft.draft_id,
      decision: 'R03',
      idempotency_key: 'idem-confirm-r03',
    }, meta);

    expect(response.priority).toMatchObject({
      family_id: familyId,
      onboarding_id: onboardingId,
      profile_id: profile.profile_id,
      dimension_id: 'R03',
      status: 'ACTIVE',
      version: 2,
      boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
      policy_version: 'M2_104_DETERMINISTIC_V2',
      previous_priority_id: '88888888-8888-4888-8888-888888888888',
    });
    expect(client.supersededActivePriority).toBe(true);
    expect(response.priority?.reason_codes).toContain('PRACTICE_READY');
    expect(response.priority?.evidence_refs).toEqual(['ev-R03']);
    expect(client.consentSubjectIds).toEqual([childId]);
    expect(client.relationshipLookupCount).toBe(0);
  });

  it('blocks confirmation when normal safety route cannot be verified', async () => {
    const client = new FakePriorityClient({ profiles: [], normalRouteVerified: false });
    const service = new GrowthPriorityService(createRepository(client), createSubjectResolver());
    const draft = buildGrowthPriorityDraft({ familyId, onboardingId, profiles: [], createdAt: meta.occurredAt });

    await expect(service.confirmGrowthPriority({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: draft.draft_id,
      decision: 'NO_PRIORITY_YET',
      idempotency_key: 'idem-normal-route-blocked',
    }, meta)).rejects.toThrow('normal_safety_route_not_verified');

    expect(client.insertedPriority).toBe(false);
    expect(client.auditActions).toEqual([]);
    expect(client.outboxEvents).toEqual([]);
  });

  it('uses the unified onboarding subject resolution for a relationship profile', async () => {
    const profile = createProfile({ profileId: '77777777-7777-4777-8777-777777777777', dimensionId: 'R03', state: 'DEVELOPING' });
    const client = new FakePriorityClient({
      profiles: [profile],
      profileSubjectPersonId: null,
      profileSubjectRelationshipId: relationshipId,
      relationshipSubjectPersonId: relationshipChildId,
    });
    const service = new GrowthPriorityService(createRepository(client), createSubjectResolver(relationshipChildId));
    const draft = buildGrowthPriorityDraft({ familyId, onboardingId, profiles: [profile], createdAt: meta.occurredAt });

    await service.confirmGrowthPriority({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: draft.draft_id,
      decision: 'R03',
      idempotency_key: 'idem-confirm-r03',
    }, meta);

    expect(client.consentSubjectIds).toEqual([relationshipChildId]);
    expect(client.relationshipLookupCount).toBe(0);
  });

  it('uses the same resolved onboarding child even when profile provenance has two subject fields', async () => {
    const profile = createProfile({ profileId: '77777777-7777-4777-8777-777777777777', dimensionId: 'R03', state: 'DEVELOPING' });
    const client = new FakePriorityClient({
      profiles: [profile],
      profileSubjectPersonId: childId,
      profileSubjectRelationshipId: relationshipId,
      relationshipSubjectPersonId: relationshipChildId,
    });
    const service = new GrowthPriorityService(createRepository(client), createSubjectResolver());
    const draft = buildGrowthPriorityDraft({ familyId, onboardingId, profiles: [profile], createdAt: meta.occurredAt });

    await service.confirmGrowthPriority({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: draft.draft_id,
      decision: 'R03',
      idempotency_key: 'idem-confirm-r03',
    }, meta);

    expect(client.consentSubjectIds).toEqual([childId]);
    expect(client.relationshipLookupCount).toBe(0);
  });

  it('replays an idempotent response without rewriting priority state', async () => {
    const replayResponse = { priority: null, decision: 'NO_PRIORITY_YET' as GrowthPriorityDecision, draft: buildGrowthPriorityDraft({ familyId, onboardingId, profiles: [], createdAt: meta.occurredAt }) };
    const client = new FakePriorityClient({ profiles: [], replayResponse });
    const service = new GrowthPriorityService(createRepository(client), createSubjectResolver());

    const response = await service.confirmGrowthPriority({
      family_id: familyId,
      onboarding_id: onboardingId,
      draft_id: replayResponse.draft.draft_id,
      decision: 'NO_PRIORITY_YET',
      idempotency_key: 'idem-replay',
    }, meta);

    expect(response).toEqual(replayResponse);
    expect(client.insertedPriority).toBe(false);
    expect(client.auditActions).toEqual([]);
  });
});
function createRepository(client: FakePriorityClient): FamilyRepository {
  return {
    withTransaction: async <T>(work: (txClient: FakePriorityClient) => Promise<T>) => work(client),
  } as unknown as FamilyRepository;
}

function createSubjectResolver(resolvedChildId = childId): GrowthSubjectResolver {
  return {
    resolve: async () => ({
      childPersonId: resolvedChildId,
      guardianPersonIds: [actorId],
      subjectRelationshipId: relationshipId,
      resolvedVia: 'ONBOARDING_AND_PROFILE_PROVENANCE',
    }),
  } as GrowthSubjectResolver;
}

function createProfile(input: {
  profileId: string;
  dimensionId: ConfirmedProfileForPriority['dimension_id'];
  state: ConfirmedProfileForPriority['state'];
  evidenceIds?: string[];
}): ConfirmedProfileForPriority {
  return {
    profile_id: input.profileId,
    family_id: familyId,
    dimension_id: input.dimensionId,
    state: input.state,
    confidence: 'MEDIUM',
    version: 1,
    basis: {
      supporting_evidence_ids: input.evidenceIds ?? [`ev-${input.dimensionId}`],
      limitations: [],
      agreement_level: 'ALIGNED',
      confidence: 'MEDIUM',
      candidate_state: input.state,
    },
    evidence_snapshot: {
      evidence_ids: input.evidenceIds ?? [`ev-${input.dimensionId}`],
    },
    confirmed_at: meta.occurredAt,
  };
}
class FakePriorityClient {
  insertedPriority = false;
  supersededActivePriority = false;
  auditActions: string[] = [];
  outboxEvents: string[] = [];
  consentSubjectIds: string[] = [];
  relationshipLookupCount = 0;
  private actionName = '';
  private requestHash = '';
  private storedResponse: unknown | null;

  constructor(private readonly state: {
    profiles: ConfirmedProfileForPriority[];
    activePriorityId?: string;
    replayResponse?: unknown;
    profileSubjectPersonId?: string | null;
    profileSubjectRelationshipId?: string | null;
    relationshipSubjectPersonId?: string;
    normalRouteVerified?: boolean;
  }) {
    this.storedResponse = state.replayResponse ?? null;
  }

  async query(sql: string, params: unknown[] = []): Promise<{ rowCount: number; rows: unknown[] }> {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    if (normalized.startsWith('insert into idempotency_keys')) {
      this.actionName = params[1] as string;
      this.requestHash = params[2] as string;
      return { rowCount: 1, rows: [] };
    }
    if (normalized.startsWith('select action_name, request_hash, response_body')) {
      return {
        rowCount: 1,
        rows: [{ action_name: this.actionName, request_hash: this.requestHash, response_body: this.storedResponse }],
      };
    }
    if (normalized.startsWith('select family_id from families')) {
      return { rowCount: 1, rows: [{ family_id: familyId }] };
    }
    if (normalized.startsWith('select audit_id from audit_logs')) {
      return { rowCount: 1, rows: [{ audit_id: 'audit-create-family' }] };
    }
    if (normalized.includes('growth_journeys') && normalized.includes('subject_person_id')) {
      throw new Error('growth_journeys.subject_person_id must not be queried');
    }
    if (normalized.startsWith('select journey_id from growth_journeys')) {
      return { rowCount: 1, rows: [{ journey_id: onboardingId }] };
    }
    if (normalized.startsWith('select family_id, subject_person_id, subject_relationship_id from growth_profiles')) {
      return {
        rowCount: 1,
        rows: [{
          family_id: familyId,
          subject_person_id: this.state.profileSubjectPersonId === undefined ? childId : this.state.profileSubjectPersonId,
          subject_relationship_id: this.state.profileSubjectRelationshipId ?? null,
        }],
      };
    }
    if (normalized.startsWith('select person_b_id from family_relationships')) {
      this.relationshipLookupCount += 1;
      return { rowCount: 1, rows: [{ person_b_id: this.state.relationshipSubjectPersonId ?? childId }] };
    }
    if (normalized.startsWith('select purpose from consents')) {
      this.consentSubjectIds.push(params[1] as string);
      return { rowCount: 3, rows: [{ purpose: 'SERVICE' }, { purpose: 'ASSESSMENT' }, { purpose: 'GROWTH_TRACKING' }] };
    }
    if (normalized.startsWith("select payload->'safety_disposition'->>'severity'")) {
      if (this.state.normalRouteVerified === false) {
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
    if (normalized.startsWith('select gp.profile_id')) {
      return { rowCount: this.state.profiles.length, rows: this.state.profiles.map(mapProfileRow) };
    }
    if (normalized.startsWith('select priority_id') && normalized.includes("status = 'active'")) {
      if (!this.state.activePriorityId) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 1, rows: [createPriorityRow({ priorityId: this.state.activePriorityId, status: 'ACTIVE', previousPriorityId: null })] };
    }
    if (normalized.startsWith('update growth_priorities set status')) {
      this.supersededActivePriority = true;
      return { rowCount: this.state.activePriorityId ? 1 : 0, rows: [] };
    }
    if (normalized.startsWith('insert into growth_priorities')) {
      this.insertedPriority = true;
      return { rowCount: 1, rows: [createPriorityRow({
        priorityId: '99999999-9999-4999-8999-999999999999',
        status: 'ACTIVE',
        profileId: params[2] as string,
        dimensionId: params[3] as ConfirmedProfileForPriority['dimension_id'],
        version: params[5] as number,
        reasonCodes: JSON.parse(params[7] as string),
        evidenceRefs: JSON.parse(params[8] as string),
        previousPriorityId: params[10] as string | null,
      })] };
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
      this.storedResponse = JSON.parse(params[2] as string);
      return { rowCount: 1, rows: [] };
    }

    throw new Error(`Unhandled SQL in fake client: ${sql}`);
  }
}

function mapProfileRow(profile: ConfirmedProfileForPriority): Record<string, unknown> {
  return {
    profile_id: profile.profile_id,
    family_id: profile.family_id,
    dimension_id: profile.dimension_id,
    state: profile.state,
    confidence: profile.confidence,
    version: profile.version,
    basis: profile.basis,
    evidence_snapshot: profile.evidence_snapshot,
    confirmed_at: profile.confirmed_at,
  };
}

function createPriorityRow(input: {
  priorityId: string;
  status: 'ACTIVE' | 'SUPERSEDED';
  profileId?: string;
  dimensionId?: ConfirmedProfileForPriority['dimension_id'];
  version?: number;
  reasonCodes?: string[];
  evidenceRefs?: string[];
  previousPriorityId?: string | null;
}): Record<string, unknown> {
  return {
    priority_id: input.priorityId,
    family_id: familyId,
    onboarding_id: onboardingId,
    profile_id: input.profileId ?? '77777777-7777-4777-8777-777777777777',
    dimension_id: input.dimensionId ?? 'R03',
    status: input.status,
    version: input.version ?? 1,
    boundary: 'PRIORITY_IS_HUMAN_CONFIRMED_PRACTICE_FOCUS',
    reason_codes: input.reasonCodes ?? ['RECENTLY_CONFIRMED_PROFILE'],
    evidence_refs: input.evidenceRefs ?? ['ev-R03'],
    policy_version: 'M2_104_DETERMINISTIC_V2',
    confirmed_by_actor_id: actorId,
    confirmed_at: meta.occurredAt,
    superseded_at: null,
    previous_priority_id: input.previousPriorityId ?? null,
    created_at: meta.occurredAt,
  };
}

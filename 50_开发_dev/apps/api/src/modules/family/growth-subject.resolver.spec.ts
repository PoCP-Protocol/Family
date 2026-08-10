import { describe, expect, it } from 'vitest';
import { GrowthSubjectResolver } from './growth-subject.resolver';

const familyId = '11111111-1111-4111-8111-111111111111';
const onboardingId = '22222222-2222-4222-8222-222222222222';
const parentId = '33333333-3333-4333-8333-333333333333';
const childId = '44444444-4444-4444-8444-444444444444';
const otherChildId = '55555555-5555-4555-8555-555555555555';
const relationshipId = '66666666-6666-4666-8666-666666666666';

describe('GrowthSubjectResolver', () => {
  it('resolves the child when parent and child perspectives have different subjects', async () => {
    const resolver = new GrowthSubjectResolver();
    const client = new FakeSubjectClient({
      provenanceRows: [
        createProvenanceRow({ perspectiveChildId: parentId, perspectiveType: 'PARENT_PERSPECTIVE', perspectiveSubjectType: 'PARENT' }),
        createProvenanceRow({ perspectiveChildId: childId, perspectiveType: 'CHILD_PERSPECTIVE', perspectiveSubjectType: 'CHILD' }),
      ],
    });

    const result = await resolver.resolve(client, { familyId, onboardingId });

    expect(result.childPersonId).toBe(childId);
    expect(result.guardianPersonIds).toEqual([parentId]);
  });

  it('blocks when onboarding child provenance points at another child', async () => {
    const resolver = new GrowthSubjectResolver();
    const client = new FakeSubjectClient({
      eventChildId: otherChildId,
      provenanceRows: [createProvenanceRow({ eventChildId: otherChildId, perspectiveChildId: childId, perspectiveType: 'CHILD_PERSPECTIVE', perspectiveSubjectType: 'CHILD' })],
    });

    await expect(resolver.resolve(client, { familyId, onboardingId })).rejects.toThrow('growth_subject_ambiguous');
  });

  it('blocks profile relationship provenance mismatch', async () => {
    const resolver = new GrowthSubjectResolver();
    const client = new FakeSubjectClient({
      profile: {
        profile_id: '77777777-7777-4777-8777-777777777777',
        subject_person_id: null,
        subject_relationship_id: '88888888-8888-4888-8888-888888888888',
      },
    });

    await expect(resolver.resolve(client, { familyId, onboardingId, profileId: '77777777-7777-4777-8777-777777777777' })).rejects.toThrow('growth_profile_relationship_mismatch');
  });

  it('blocks when no child provenance exists', async () => {
    const resolver = new GrowthSubjectResolver();
    const client = new FakeSubjectClient({ eventChildId: null, provenanceRows: [] });

    await expect(resolver.resolve(client, { familyId, onboardingId })).rejects.toThrow('growth_subject_unresolved');
  });

  it('blocks multiple child provenance', async () => {
    const resolver = new GrowthSubjectResolver();
    const client = new FakeSubjectClient({
      provenanceRows: [
        createProvenanceRow({ perspectiveChildId: childId, perspectiveType: 'CHILD_PERSPECTIVE', perspectiveSubjectType: 'CHILD' }),
        createProvenanceRow({ perspectiveChildId: otherChildId, perspectiveType: 'CHILD_PERSPECTIVE', perspectiveSubjectType: 'CHILD' }),
      ],
    });

    await expect(resolver.resolve(client, { familyId, onboardingId })).rejects.toThrow('growth_subject_ambiguous');
  });
});

interface ProvenanceRow {
  event_child_id: string | null;
  event_guardian_id: string | null;
  perspective_child_id: string | null;
  perspective_type: string | null;
  perspective_subject_type: string | null;
}

function createProvenanceRow(input: Partial<{
  eventChildId: string | null;
  eventGuardianId: string | null;
  perspectiveChildId: string | null;
  perspectiveType: string | null;
  perspectiveSubjectType: string | null;
}>): ProvenanceRow {
  return {
    event_child_id: input.eventChildId === undefined ? childId : input.eventChildId,
    event_guardian_id: input.eventGuardianId === undefined ? parentId : input.eventGuardianId,
    perspective_child_id: input.perspectiveChildId ?? null,
    perspective_type: input.perspectiveType ?? null,
    perspective_subject_type: input.perspectiveSubjectType ?? null,
  };
}

class FakeSubjectClient {
  constructor(private readonly state: {
    eventChildId?: string | null;
    provenanceRows?: ProvenanceRow[];
    profile?: { profile_id: string; subject_person_id: string | null; subject_relationship_id: string | null };
  } = {}) {}

  async query(sql: string): Promise<{ rowCount: number; rows: unknown[] }> {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    if (normalized.startsWith('select journey_id from growth_journeys')) {
      return { rowCount: 1, rows: [{ journey_id: onboardingId }] };
    }
    if (normalized.startsWith('select ge.payload')) {
      const rows = this.state.provenanceRows ?? [createProvenanceRow({ eventChildId: this.state.eventChildId })];
      return { rowCount: rows.length, rows };
    }
    if (normalized.startsWith('select person_type::text as person_type')) {
      return { rowCount: 1, rows: [{ person_type: 'CHILD' }] };
    }
    if (normalized.startsWith('select fr.relationship_id')) {
      return { rowCount: 1, rows: [{ relationship_id: relationshipId, guardian_person_id: parentId }] };
    }
    if (normalized.startsWith('select profile_id, subject_person_id, subject_relationship_id')) {
      return { rowCount: 1, rows: [this.state.profile] };
    }
    if (normalized.startsWith('select gp.profile_id from growth_profiles')) {
      return { rowCount: 1, rows: [{ profile_id: this.state.profile?.profile_id }] };
    }

    throw new Error(`Unhandled SQL in fake subject client: ${sql}`);
  }
}
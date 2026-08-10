import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type pg from 'pg';

const ONBOARDING_JOURNEY_TYPE = 'PARENT_CHILD_COMMUNICATION_CONFLICT';
const ONBOARDING_STARTED_EVENT = 'GrowthOnboardingStarted';

export interface GrowthSubjectResolution {
  childPersonId: string;
  guardianPersonIds: string[];
  subjectRelationshipId: string | null;
  resolvedVia: 'ONBOARDING_AND_PROFILE_PROVENANCE';
}

export interface GrowthSubjectResolutionInput {
  familyId: string;
  onboardingId: string;
  profileId?: string;
  priorityId?: string;
}

/**
 * Resolves the one child governed by a Wave2 onboarding from explicit onboarding,
 * perspective and profile provenance. It never selects an arbitrary family child.
 */
@Injectable()
export class GrowthSubjectResolver {
  async resolve(client: pg.PoolClient, input: GrowthSubjectResolutionInput): Promise<GrowthSubjectResolution> {
    await assertCanonicalOnboarding(client, input.familyId, input.onboardingId);

    const profile = await getProfileContext(client, input);
    const provenance = await client.query<{
      event_child_id: string | null;
      event_guardian_id: string | null;
      perspective_child_id: string | null;
      perspective_type: string | null;
      perspective_subject_type: string | null;
    }>(
      `select
         ge.payload->>'child_id' as event_child_id,
         ge.payload->>'guardian_person_id' as event_guardian_id,
         p.subject_person_id::text as perspective_child_id,
         p.perspective_type::text as perspective_type,
         ps.person_type::text as perspective_subject_type
       from growth_events ge
       left join perspectives p
         on p.family_id = ge.family_id
        and p.onboarding_id = $2::uuid
       left join persons ps
         on ps.family_id = p.family_id
        and ps.person_id = p.subject_person_id
       where ge.family_id = $1
         and ge.event_type = $3
         and ge.payload->>'onboarding_id' = $2::text
       for share of ge`,
      [input.familyId, input.onboardingId, ONBOARDING_STARTED_EVENT],
    );

    const childCandidates = new Set<string>();
    const eventGuardians = new Set<string>();
    for (const row of provenance.rows) {
      if (row.event_child_id) childCandidates.add(row.event_child_id);
      if (row.perspective_child_id && row.perspective_type === 'CHILD_PERSPECTIVE' && row.perspective_subject_type === 'CHILD') {
        childCandidates.add(row.perspective_child_id);
      }
      if (row.event_guardian_id) eventGuardians.add(row.event_guardian_id);
    }
    if (childCandidates.size !== 1) {
      throw new ConflictException(childCandidates.size === 0 ? 'growth_subject_unresolved' : 'growth_subject_ambiguous');
    }
    const childPersonId = Array.from(childCandidates)[0];

    const child = await client.query<{ person_type: string }>(
      `select person_type::text as person_type
       from persons
       where family_id = $1 and person_id = $2
       for share`,
      [input.familyId, childPersonId],
    );
    if (child.rows[0]?.person_type !== 'CHILD') {
      throw new ConflictException('growth_subject_is_not_child');
    }

    const relationships = await client.query<{
      relationship_id: string;
      guardian_person_id: string;
    }>(
      `select fr.relationship_id,
              case when pa.person_type = 'PARENT' then pa.person_id else pb.person_id end as guardian_person_id
       from family_relationships fr
       join persons pa on pa.person_id = fr.person_a_id and pa.family_id = fr.family_id
       join persons pb on pb.person_id = fr.person_b_id and pb.family_id = fr.family_id
       where fr.family_id = $1
         and fr.relationship_type in ('PARENT_CHILD', 'GUARDIAN_CHILD')
         and ((fr.person_a_id = $2 and pa.person_type = 'CHILD' and pb.person_type = 'PARENT')
           or (fr.person_b_id = $2 and pb.person_type = 'CHILD' and pa.person_type = 'PARENT'))
       for share of fr, pa, pb`,
      [input.familyId, childPersonId],
    );
    const guardianPersonIds = Array.from(new Set(relationships.rows.map((row) => row.guardian_person_id)));
    if (guardianPersonIds.length === 0) {
      throw new ConflictException('growth_subject_guardian_unresolved');
    }
    if (Array.from(eventGuardians).some((guardianId) => !guardianPersonIds.includes(guardianId))) {
      throw new ConflictException('growth_subject_guardian_mismatch');
    }

    let subjectRelationshipId: string | null = null;
    if (profile) {
      await assertProfileBelongsToOnboarding(client, profile.profile_id, input.onboardingId);
      if (profile.subject_person_id && !guardianPersonIds.includes(profile.subject_person_id)) {
        throw new ConflictException('growth_profile_subject_mismatch');
      }
      if (profile.subject_relationship_id) {
        const relationship = relationships.rows.find((row) => row.relationship_id === profile.subject_relationship_id);
        if (!relationship) {
          throw new ConflictException('growth_profile_relationship_mismatch');
        }
        subjectRelationshipId = relationship.relationship_id;
      }
    }

    return {
      childPersonId,
      guardianPersonIds,
      subjectRelationshipId,
      resolvedVia: 'ONBOARDING_AND_PROFILE_PROVENANCE',
    };
  }
}

async function assertCanonicalOnboarding(client: pg.PoolClient, familyId: string, onboardingId: string): Promise<void> {
  const result = await client.query(
    `select journey_id
     from growth_journeys
     where family_id = $1 and journey_id = $2 and journey_type = $3
       and phase = 'ONBOARDING' and status = 'ACTIVE'
     for share`,
    [familyId, onboardingId, ONBOARDING_JOURNEY_TYPE],
  );
  if (result.rowCount !== 1) throw new NotFoundException('active_growth_onboarding_not_found');
}

async function getProfileContext(
  client: pg.PoolClient,
  input: GrowthSubjectResolutionInput,
): Promise<{ profile_id: string; subject_person_id: string | null; subject_relationship_id: string | null } | null> {
  if (!input.profileId && !input.priorityId) return null;
  const result = input.priorityId
    ? await client.query<{ profile_id: string; subject_person_id: string | null; subject_relationship_id: string | null }>(
      `select gp.profile_id, profile.subject_person_id, profile.subject_relationship_id
       from growth_priorities gp
       join growth_profiles profile on profile.profile_id = gp.profile_id
       where gp.family_id = $1 and gp.onboarding_id = $2 and gp.priority_id = $3
       for share of gp, profile`,
      [input.familyId, input.onboardingId, input.priorityId],
    )
    : await client.query<{ profile_id: string; subject_person_id: string | null; subject_relationship_id: string | null }>(
      `select profile_id, subject_person_id, subject_relationship_id
       from growth_profiles
       where family_id = $1 and profile_id = $2
       for share`,
      [input.familyId, input.profileId],
    );
  if (!result.rows[0]) throw new NotFoundException(input.priorityId ? 'growth_priority_not_found' : 'growth_profile_not_found');
  return result.rows[0];
}

async function assertProfileBelongsToOnboarding(client: pg.PoolClient, profileId: string, onboardingId: string): Promise<void> {
  const result = await client.query(
    `select gp.profile_id
     from growth_profiles gp
     cross join lateral jsonb_array_elements_text(coalesce(gp.evidence_snapshot->'evidence_ids', '[]'::jsonb)) as evidence_ref(value)
     join evidence_records er on er.evidence_id::text = evidence_ref.value
     join perspectives p on p.perspective_id = er.perspective_id
     where gp.profile_id = $1 and p.onboarding_id = $2
     limit 1
     for share of gp, er, p`,
    [profileId, onboardingId],
  );
  if (result.rowCount !== 1) throw new ConflictException('growth_profile_onboarding_mismatch');
}

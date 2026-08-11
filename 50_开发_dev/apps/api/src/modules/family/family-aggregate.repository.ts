import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ConsentDto, ConsentPurpose, ConsentStatus, FamilyAggregateResponse, FamilyDto, FamilyRelationshipDto, GrowthOnboardingDto, LifeStageAssignmentDto, LifeStageCode, PersonDto, RelationshipType, SafetyScreeningResult } from '@family/contracts';
import type pg from 'pg';
import { FamilyRepository } from './family.repository';

const CREATE_FAMILY_ACTION = 'CreateFamily';
const GROWTH_ONBOARDING_STARTED_EVENT = 'GrowthOnboardingStarted';
const M2_ONBOARDING_JOURNEY_TYPE = 'PARENT_CHILD_COMMUNICATION_CONFLICT';

@Injectable()
export class FamilyAggregateRepository {
	constructor(@Inject(FamilyRepository) private readonly repository: FamilyRepository) {}

	async getFamilyAggregate(familyId: string, actorId: string): Promise<FamilyAggregateResponse> {
		return this.repository.withTransaction(async (client) => {
			const family = await getFamily(client, familyId);
			await assertFamilyManagePermission(client, familyId, actorId);
			const members = await getMembers(client, familyId);
			const relationships = await getRelationships(client, familyId);
			const lifeStages = await getActiveLifeStages(client, familyId);
			const consents = await getActiveConsents(client, familyId);
			const currentOnboarding = await getCurrentOnboarding(client, familyId);

			return { family, members, relationships, lifeStages, consents, currentOnboarding };
		});
	}
}

async function getCurrentOnboarding(client: pg.PoolClient, familyId: string): Promise<GrowthOnboardingDto | null> {
	const result = await client.query<{
		journey_id: string;
		family_id: string;
		journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT';
		phase: 'ONBOARDING';
		status: 'ACTIVE';
		started_at: Date;
		created_at: Date;
		child_id: string | null;
		guardian_person_id: string | null;
		life_stage_code: LifeStageCode | null;
		target_dimensions: string[] | null;
		safety_screening_result: SafetyScreeningResult | null;
		ai_personalization_enabled: boolean | null;
	}>(
		`select gj.journey_id,
		        gj.family_id,
		        gj.journey_type,
		        gj.phase,
		        gj.status,
		        gj.started_at,
		        gj.created_at,
		        ge.payload->>'child_id' as child_id,
		        ge.payload->>'guardian_person_id' as guardian_person_id,
		        ge.payload->>'life_stage_code' as life_stage_code,
		        coalesce(array(select jsonb_array_elements_text(ge.payload->'target_dimensions')), '{}'::text[]) as target_dimensions,
		        ge.payload->>'safety_screening_result' as safety_screening_result,
		        coalesce((ge.payload->>'ai_personalization_enabled')::boolean, false) as ai_personalization_enabled
		 from growth_journeys gj
		 left join lateral (
		   select payload
		   from growth_events
		   where family_id = $1
		     and event_type = $2
		     and payload->>'onboarding_id' = gj.journey_id::text
		   order by occurred_at desc
		   limit 1
		 ) ge on true
		 where gj.family_id = $1
		   and gj.journey_type = $3
		   and gj.phase = 'ONBOARDING'
		   and gj.status = 'ACTIVE'
		 order by gj.started_at desc
		 limit 1`,
		[familyId, GROWTH_ONBOARDING_STARTED_EVENT, M2_ONBOARDING_JOURNEY_TYPE],
	);

	const row = result.rows[0];
	if (!row || !row.child_id || !row.guardian_person_id || !row.life_stage_code || !row.safety_screening_result) {
		return null;
	}

	return {
		onboarding_id: row.journey_id,
		family_id: row.family_id,
		child_id: row.child_id,
		guardian_person_id: row.guardian_person_id,
		journey_type: row.journey_type,
		life_stage_code: row.life_stage_code,
		target_dimensions: (row.target_dimensions ?? ['P03', 'R03', 'R04', 'R05']) as GrowthOnboardingDto['target_dimensions'],
		status: row.status,
		phase: row.phase,
		safety_screening_result: row.safety_screening_result,
		ai_personalization_enabled: false,
		started_at: row.started_at.toISOString(),
		created_at: row.created_at.toISOString(),
	};
}

async function getFamily(client: pg.PoolClient, familyId: string): Promise<FamilyDto> {
	const result = await client.query<{
		family_id: string;
		display_name: string;
		status: FamilyDto['status'];
		primary_contact_person_id: string | null;
		created_at: Date;
		updated_at: Date;
		version: number;
	}>(
		`select family_id, display_name, status, primary_contact_person_id, created_at, updated_at, version
		 from families
		 where family_id = $1
		 for share`,
		[familyId],
	);

	const row = result.rows[0];
	if (!row) {
		throw new NotFoundException('family_not_found');
	}

	return {
		family_id: row.family_id,
		display_name: row.display_name,
		status: row.status,
		primary_contact_person_id: row.primary_contact_person_id,
		created_at: row.created_at.toISOString(),
		updated_at: row.updated_at.toISOString(),
		version: row.version,
	};
}

async function assertFamilyManagePermission(client: pg.PoolClient, familyId: string, actorId: string): Promise<void> {
	const result = await client.query(
		`select audit_id
		 from audit_logs
		 where family_id = $1 and actor_id = $2 and action_name = $3 and result = 'SUCCESS'
		 limit 1`,
		[familyId, actorId, CREATE_FAMILY_ACTION],
	);
	if (result.rowCount !== 1) {
		throw new ForbiddenException('actor_has_family_manage_permission');
	}
}

async function getMembers(client: pg.PoolClient, familyId: string): Promise<PersonDto[]> {
	const result = await client.query<PersonRow>(
		`select person_id, family_id, person_type, parent_role, display_name, birth_date, account_id, created_at, updated_at
		 from persons
		 where family_id = $1
		 order by created_at, person_id`,
		[familyId],
	);

	return result.rows.map(mapPerson);
}

async function getRelationships(client: pg.PoolClient, familyId: string): Promise<FamilyRelationshipDto[]> {
	const result = await client.query<RelationshipRow>(
		`select relationship_id, family_id, person_a_id, person_b_id, relationship_type, created_at
		 from family_relationships
		 where family_id = $1
		 order by created_at, relationship_id`,
		[familyId],
	);

	return result.rows.map(mapRelationship);
}

async function getActiveLifeStages(client: pg.PoolClient, familyId: string): Promise<LifeStageAssignmentDto[]> {
	const result = await client.query<LifeStageAssignmentRow>(
		`select assignment_id, family_id, child_id, life_stage_code, effective_from, effective_to, source, created_at
		 from life_stage_assignments
		 where family_id = $1 and effective_to is null
		 order by effective_from, assignment_id`,
		[familyId],
	);

	return result.rows.map(mapLifeStageAssignment);
}

async function getActiveConsents(client: pg.PoolClient, familyId: string): Promise<ConsentDto[]> {
	const result = await client.query<ConsentRow>(
		`select consent_id, family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at, withdrawn_at, created_at
		 from consents
		 where family_id = $1 and status = 'GRANTED'
		 order by granted_at, consent_id`,
		[familyId],
	);

	return result.rows.map(mapConsent);
}

interface PersonRow {
	person_id: string;
	family_id: string;
	person_type: PersonDto['person_type'];
	parent_role: PersonDto['parent_role'];
	display_name: string;
	birth_date: Date | null;
	account_id: string | null;
	created_at: Date;
	updated_at: Date;
}

function mapPerson(row: PersonRow): PersonDto {
	return {
		person_id: row.person_id,
		family_id: row.family_id,
		person_type: row.person_type,
		parent_role: row.parent_role,
		display_name: row.display_name,
		birth_date: formatDateOnly(row.birth_date),
		account_id: row.account_id,
		created_at: row.created_at.toISOString(),
		updated_at: row.updated_at.toISOString(),
	};
}

interface RelationshipRow {
	relationship_id: string;
	family_id: string;
	person_a_id: string;
	person_b_id: string;
	relationship_type: RelationshipType;
	created_at: Date;
}

function mapRelationship(row: RelationshipRow): FamilyRelationshipDto {
	return {
		relationship_id: row.relationship_id,
		family_id: row.family_id,
		person_a_id: row.person_a_id,
		person_b_id: row.person_b_id,
		relationship_type: row.relationship_type,
		created_at: row.created_at.toISOString(),
	};
}

interface LifeStageAssignmentRow {
	assignment_id: string;
	family_id: string;
	child_id: string;
	life_stage_code: LifeStageCode;
	effective_from: Date;
	effective_to: Date | null;
	source: string;
	created_at: Date;
}

function mapLifeStageAssignment(row: LifeStageAssignmentRow): LifeStageAssignmentDto {
	return {
		assignment_id: row.assignment_id,
		family_id: row.family_id,
		child_id: row.child_id,
		life_stage_code: row.life_stage_code,
		effective_from: row.effective_from.toISOString(),
		effective_to: row.effective_to ? row.effective_to.toISOString() : null,
		source: row.source,
		created_at: row.created_at.toISOString(),
	};
}

interface ConsentRow {
	consent_id: string;
	family_id: string;
	subject_person_id: string;
	guardian_person_id: string;
	purpose: ConsentPurpose;
	status: ConsentStatus;
	policy_version: string;
	granted_at: Date;
	withdrawn_at: Date | null;
	created_at: Date;
}

function mapConsent(row: ConsentRow): ConsentDto {
	return {
		consent_id: row.consent_id,
		family_id: row.family_id,
		subject_person_id: row.subject_person_id,
		guardian_person_id: row.guardian_person_id,
		purpose: row.purpose,
		status: row.status,
		policy_version: row.policy_version,
		granted_at: row.granted_at.toISOString(),
		withdrawn_at: row.withdrawn_at ? row.withdrawn_at.toISOString() : null,
		created_at: row.created_at.toISOString(),
	};
}

function formatDateOnly(value: Date | string | null): string | null {
	if (!value) {
		return null;
	}

	if (typeof value === 'string') {
		return value.slice(0, 10);
	}

	return [
		value.getFullYear(),
		String(value.getMonth() + 1).padStart(2, '0'),
		String(value.getDate()).padStart(2, '0'),
	].join('-');
}
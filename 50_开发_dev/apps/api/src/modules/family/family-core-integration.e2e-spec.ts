import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('TASK-107 M1 Family Core aggregate E2E', () => {
	let app: INestApplication;
	let baseUrl: string;
	let pool: pg.Pool;

	beforeAll(async () => {
		process.env.DATABASE_URL = getTestDatabaseUrl();
		pool = createTestPool();
		app = await NestFactory.create(AppModule, { logger: ['error'] });
		await app.listen(0);
		baseUrl = await app.getUrl();
	});

	beforeEach(async () => {
		await cleanFamilyCoreTables(pool);
	});

	afterAll(async () => {
		await app.close();
		await pool.end();
	});

	it('M1-E2E-01 runs full Family Core flow and reads canonical aggregate', async () => {
		const correlationId = 'corr-m1-final-01';
		const actorId = 'creator-m1-01';
		const family = await createFamily(actorId, 'idem-m1-family-01', correlationId);
		const familyReplay = await createFamily(actorId, 'idem-m1-family-01', correlationId);
		const familyConflict = await postFamily(actorId, 'idem-m1-family-01', correlationId, '另一个家庭');
		const parent = await addParent(family.family.family_id, actorId, 'idem-m1-parent-01', correlationId);
		const child = await addChild(family.family.family_id, actorId, 'idem-m1-child-01', correlationId, '2012-05-06');
		const relationship = await createRelationship(family.family.family_id, parent.parent.person_id, child.child.person_id, actorId, 'idem-m1-rel-01', correlationId);
		const lifeStage = await assignLifeStage(family.family.family_id, child.child.person_id, actorId, 'idem-m1-life-stage-01', correlationId);
		const consent = await grantConsent(family.family.family_id, child.child.person_id, parent.parent.person_id, actorId, 'idem-m1-consent-01', correlationId, 'family-consent-v1');
		const consentReplay = await grantConsent(family.family.family_id, child.child.person_id, parent.parent.person_id, actorId, 'idem-m1-consent-01', correlationId, 'family-consent-v1');
		const consentConflict = await postConsent(family.family.family_id, {
			subjectPersonId: child.child.person_id,
			guardianPersonId: parent.parent.person_id,
			purpose: 'MODEL_IMPROVEMENT',
			policyVersion: 'family-consent-v1',
		}, actorId, correlationId, 'idem-m1-consent-01');

		const response = await getAggregate(family.family.family_id, actorId);
		const aggregate = await response.json() as FamilyAggregateHttpResponse;

		expect(familyReplay).toEqual(family);
		expect(familyConflict.status).toBe(409);
		expect(consentReplay).toEqual(consent);
		expect(consentConflict.status).toBe(409);
		expect(response.status).toBe(200);
		expect(aggregate.family.family_id).toBe(family.family.family_id);
		expect(aggregate.members).toHaveLength(2);
		expect(aggregate.members.map((member) => member.person_type).sort()).toEqual(['CHILD', 'PARENT']);
		expect(aggregate.members.find((member) => member.person_type === 'CHILD')?.birth_date).toBe('2012-05-06');
		expect(aggregate.relationships).toEqual([relationship.relationship]);
		expect(aggregate.lifeStages).toEqual([lifeStage.assignment]);
		expect(aggregate.consents).toEqual([consent.consent]);
		expect(aggregate.consents[0].purpose).toBe('SERVICE');
		expect(aggregate.consents.some((row) => row.purpose === 'MODEL_IMPROVEMENT')).toBe(false);

		await expectAuditActions(correlationId, ['CreateFamily', 'AddParent', 'AddChild', 'CreateFamilyRelationship', 'AssignLifeStage', 'GrantConsent']);
		await expectOutboxEvents(correlationId, ['FamilyCreated', 'FamilyMemberAdded', 'FamilyRelationshipCreated', 'LifeStageAssigned', 'ConsentGranted']);
		await expectCount('families', 1);
		await expectCount('persons', 2);
		await expectCount('family_relationships', 1);
		await expectCount('life_stage_assignments', 1);
		await expectCount('consents', 1);
		await expectCount('growth_profiles', 0);
		await expectCount('growth_journeys', 0);
		await expectCount('growth_events', 0);
		await expectCount('growth_actions', 0);
		// Wave2 migration seeds one immutable intervention catalog entry; M1 flow creates none.
		await expectCount('interventions', 1);
	});

	it('M1-E2E-02 denies unauthorized aggregate read', async () => {
		const seed = await seedFamily('creator-m1-02', 'm1-02', false, false);
		const response = await getAggregate(seed.familyId, 'other-actor');

		expect(response.status).toBe(403);
	});

	it('M1-E2E-03 returns 404 for unknown family', async () => {
		const response = await getAggregate('11111111-1111-4111-8111-111111111111', 'creator-m1-03');

		expect(response.status).toBe(404);
	});

	it('M1-E2E-04 returns empty lifeStages when no active LifeStage exists', async () => {
		const seed = await seedFamily('creator-m1-04', 'm1-04', false, false);
		const response = await getAggregate(seed.familyId, 'creator-m1-04');
		const aggregate = await response.json() as FamilyAggregateHttpResponse;

		expect(response.status).toBe(200);
		expect(aggregate.lifeStages).toEqual([]);
	});

	it('M1-E2E-05 returns empty consents when no active Consent exists', async () => {
		const seed = await seedFamily('creator-m1-05', 'm1-05', true, false);
		const response = await getAggregate(seed.familyId, 'creator-m1-05');
		const aggregate = await response.json() as FamilyAggregateHttpResponse;

		expect(response.status).toBe(200);
		expect(aggregate.consents).toEqual([]);
	});

	it('M1-E2E-06 returns only active consent version', async () => {
		const seed = await seedFamily('creator-m1-06', 'm1-06', false, true);
		await grantConsent(seed.familyId, seed.childId, seed.parentId, 'creator-m1-06', 'idem-m1-consent-06-v1', 'corr-m1-06', 'family-consent-v1');
		const active = await grantConsent(seed.familyId, seed.childId, seed.parentId, 'creator-m1-06', 'idem-m1-consent-06-v2', 'corr-m1-06', 'family-consent-v2');
		const response = await getAggregate(seed.familyId, 'creator-m1-06');
		const aggregate = await response.json() as FamilyAggregateHttpResponse;

		expect(response.status).toBe(200);
		expect(aggregate.consents).toEqual([active.consent]);
		expect(aggregate.consents[0].policy_version).toBe('family-consent-v2');
		const rows = await pool.query('select status from consents order by policy_version');
		expect(rows.rows).toEqual([{ status: 'EXPIRED' }, { status: 'GRANTED' }]);
	});

	it('M1-E2E-07 does not infer consent from relationship', async () => {
		const seed = await seedFamily('creator-m1-07', 'm1-07', false, true);
		const response = await getAggregate(seed.familyId, 'creator-m1-07');
		const aggregate = await response.json() as FamilyAggregateHttpResponse;

		expect(response.status).toBe(200);
		expect(aggregate.relationships).toHaveLength(1);
		expect(aggregate.consents).toEqual([]);
	});

	it('M1-E2E-08 does not infer LifeStage from child birth_date', async () => {
		const seed = await seedFamily('creator-m1-08', 'm1-08', true, false);
		const response = await getAggregate(seed.familyId, 'creator-m1-08');
		const aggregate = await response.json() as FamilyAggregateHttpResponse;

		expect(response.status).toBe(200);
		expect(aggregate.members.find((member) => member.person_id === seed.childId)?.birth_date).toBe('2012-05-06');
		expect(aggregate.lifeStages).toEqual([]);
	});

	async function seedFamily(actorId: string, suffix: string, includeBirthDate: boolean, includeRelationship: boolean) {
		const family = await createFamily(actorId, `idem-e2e-family-${suffix}`, `corr-${suffix}`);
		const parent = await addParent(family.family.family_id, actorId, `idem-e2e-parent-${suffix}`, `corr-${suffix}`);
		const child = await addChild(family.family.family_id, actorId, `idem-e2e-child-${suffix}`, `corr-${suffix}`, includeBirthDate ? '2012-05-06' : undefined);

		if (includeRelationship) {
			await createRelationship(family.family.family_id, parent.parent.person_id, child.child.person_id, actorId, `idem-e2e-rel-${suffix}`, `corr-${suffix}`);
		}

		return { familyId: family.family.family_id, parentId: parent.parent.person_id, childId: child.child.person_id };
	}

	async function createFamily(actorId: string, idempotencyKey: string, correlationId: string): Promise<CreateFamilyHttpResponse> {
		const response = await postFamily(actorId, idempotencyKey, correlationId, '王家');
		expect(response.status).toBe(201);
		return await response.json() as CreateFamilyHttpResponse;
	}

	async function postFamily(actorId: string, idempotencyKey: string, correlationId: string, displayName: string): Promise<Response> {
		return fetch(`${baseUrl}/families`, {
			method: 'POST',
			headers: headers(actorId, correlationId),
			body: JSON.stringify({ display_name: displayName, idempotency_key: idempotencyKey }),
		});
	}

	async function addParent(familyId: string, actorId: string, idempotencyKey: string, correlationId: string): Promise<ParentHttpResponse> {
		const response = await fetch(`${baseUrl}/families/${familyId}/parents`, {
			method: 'POST',
			headers: headers(actorId, correlationId),
			body: JSON.stringify({ role: 'MOTHER', display_name: '妈妈', account_id: actorId, idempotency_key: idempotencyKey }),
		});
		expect(response.status).toBe(201);
		return await response.json() as ParentHttpResponse;
	}

	async function addChild(familyId: string, actorId: string, idempotencyKey: string, correlationId: string, birthDate?: string): Promise<ChildHttpResponse> {
		const response = await fetch(`${baseUrl}/families/${familyId}/children`, {
			method: 'POST',
			headers: headers(actorId, correlationId),
			body: JSON.stringify({ display_name: '孩子', ...(birthDate ? { birth_date: birthDate } : {}), idempotency_key: idempotencyKey }),
		});
		expect(response.status).toBe(201);
		return await response.json() as ChildHttpResponse;
	}

	async function createRelationship(familyId: string, parentId: string, childId: string, actorId: string, idempotencyKey: string, correlationId: string): Promise<RelationshipHttpResponse> {
		const response = await fetch(`${baseUrl}/families/${familyId}/relationships`, {
			method: 'POST',
			headers: headers(actorId, correlationId),
			body: JSON.stringify({ person_a_id: parentId, person_b_id: childId, relationship_type: 'PARENT_CHILD', idempotency_key: idempotencyKey }),
		});
		expect(response.status).toBe(201);
		return await response.json() as RelationshipHttpResponse;
	}

	async function assignLifeStage(familyId: string, childId: string, actorId: string, idempotencyKey: string, correlationId: string): Promise<LifeStageHttpResponse> {
		const response = await fetch(`${baseUrl}/families/${familyId}/life-stages`, {
			method: 'POST',
			headers: headers(actorId, correlationId),
			body: JSON.stringify({ child_id: childId, life_stage_code: 'EARLY_ADOLESCENCE_12_15', effective_from: '2026-01-01T00:00:00.000Z', idempotency_key: idempotencyKey }),
		});
		expect(response.status).toBe(201);
		return await response.json() as LifeStageHttpResponse;
	}

	async function grantConsent(familyId: string, childId: string, parentId: string, actorId: string, idempotencyKey: string, correlationId: string, policyVersion: string): Promise<ConsentHttpResponse> {
		const response = await postConsent(familyId, {
			subjectPersonId: childId,
			guardianPersonId: parentId,
			purpose: 'SERVICE',
			policyVersion,
		}, actorId, correlationId, idempotencyKey);
		expect(response.status).toBe(201);
		return await response.json() as ConsentHttpResponse;
	}

	async function postConsent(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string, idempotencyKey: string): Promise<Response> {
		return fetch(`${baseUrl}/families/${familyId}/consents`, {
			method: 'POST',
			headers: { ...headers(actorId, correlationId), 'idempotency-key': idempotencyKey },
			body: JSON.stringify(body),
		});
	}

	async function getAggregate(familyId: string, actorId: string): Promise<Response> {
		return fetch(`${baseUrl}/families/${familyId}`, {
			method: 'GET',
			headers: {
				'x-actor-id': actorId,
				'x-correlation-id': 'corr-get-aggregate',
				'x-source': 'vitest-e2e',
			},
		});
	}

	function headers(actorId: string, correlationId: string): Record<string, string> {
		return {
			'content-type': 'application/json',
			'x-actor-id': actorId,
			'x-correlation-id': correlationId,
			'x-source': 'vitest-e2e',
		};
	}

	async function expectAuditActions(correlationId: string, actions: string[]): Promise<void> {
		const result = await pool.query('select action_name, count(*)::int as count from audit_logs where correlation_id = $1 group by action_name', [correlationId]);
		const counts = new Map(result.rows.map((row: { action_name: string; count: number }) => [row.action_name, row.count]));
		for (const action of actions) {
			expect(counts.get(action)).toBe(1);
		}
	}

	async function expectOutboxEvents(correlationId: string, events: string[]): Promise<void> {
		const result = await pool.query('select event_name, count(*)::int as count from outbox_events where correlation_id = $1 group by event_name', [correlationId]);
		const counts = new Map(result.rows.map((row: { event_name: string; count: number }) => [row.event_name, row.count]));
		expect(counts.get('FamilyMemberAdded')).toBe(2);
		for (const event of events.filter((event) => event !== 'FamilyMemberAdded')) {
			expect(counts.get(event)).toBe(1);
		}
	}

	async function expectCount(tableName: string, expected: number): Promise<void> {
		const result = await pool.query(`select count(*)::int as count from ${tableName}`);
		expect(result.rows[0].count).toBe(expected);
	}
});

interface CreateFamilyHttpResponse {
	family: { family_id: string };
}

interface ParentHttpResponse {
	parent: PersonDto;
}

interface ChildHttpResponse {
	child: PersonDto;
}

interface RelationshipHttpResponse {
	relationship: FamilyRelationshipDto;
}

interface LifeStageHttpResponse {
	assignment: LifeStageAssignmentDto;
}

interface ConsentHttpResponse {
	consent: ConsentDto;
}

interface FamilyAggregateHttpResponse {
	family: { family_id: string };
	members: PersonDto[];
	relationships: FamilyRelationshipDto[];
	lifeStages: LifeStageAssignmentDto[];
	consents: ConsentDto[];
}

interface PersonDto {
	person_id: string;
	family_id: string;
	person_type: 'PARENT' | 'CHILD';
	parent_role: string | null;
	display_name: string;
	birth_date: string | null;
	account_id: string | null;
	created_at: string;
	updated_at: string;
}

interface FamilyRelationshipDto {
	relationship_id: string;
	family_id: string;
	person_a_id: string;
	person_b_id: string;
	relationship_type: string;
	created_at: string;
}

interface LifeStageAssignmentDto {
	assignment_id: string;
	family_id: string;
	child_id: string;
	life_stage_code: string;
	effective_from: string;
	effective_to: string | null;
	source: string;
	created_at: string;
}

interface ConsentDto {
	consent_id: string;
	family_id: string;
	subject_person_id: string;
	guardian_person_id: string;
	purpose: string;
	status: string;
	policy_version: string;
	granted_at: string;
	withdrawn_at: string | null;
	created_at: string;
}

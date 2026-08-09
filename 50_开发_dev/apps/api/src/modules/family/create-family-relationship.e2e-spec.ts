import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families/{familyId}/relationships E2E', () => {
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

  it('E2E-R01 creates relationship through real HTTP', async () => {
    const seed = await seedFamily('creator-1', 'r01');
    const response = await postRelationship(seed.familyId, {
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-e2e-rel-r01',
    }, 'creator-1', 'corr-r01');
    const body = await response.json() as RelationshipHttpResponse;

    expect(response.status).toBe(201);
    expect(body.relationship.family_id).toBe(seed.familyId);
    expect(body.relationship.relationship_type).toBe('PARENT_CHILD');
    await expectCount('family_relationships', 1);
    await expectCount('consents', 0);
    await expectCount('life_stage_assignments', 0);
  });

  it('E2E-R02 rejects invalid schema', async () => {
    const seed = await seedFamily('creator-1', 'r02');
    const response = await postRelationship(seed.familyId, {
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'COUSIN',
      idempotency_key: 'idem-e2e-rel-r02',
    }, 'creator-1', 'corr-r02');

    expect(response.status).toBe(400);
    await expectCount('family_relationships', 0);
  });

  it('E2E-R03 rejects missing actor', async () => {
    const seed = await seedFamily('creator-1', 'r03');
    const response = await fetch(`${baseUrl}/families/${seed.familyId}/relationships`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-correlation-id': 'corr-r03', 'x-source': 'vitest-e2e' },
      body: JSON.stringify({
        person_a_id: seed.parentId,
        person_b_id: seed.childId,
        relationship_type: 'PARENT_CHILD',
        idempotency_key: 'idem-e2e-rel-r03',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('E2E-R04 rejects unauthorized actor', async () => {
    const seed = await seedFamily('creator-1', 'r04');
    const response = await postRelationship(seed.familyId, {
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'PARENT_CHILD',
      idempotency_key: 'idem-e2e-rel-r04',
    }, 'other-actor', 'corr-r04');

    expect(response.status).toBe(403);
    await expectCount('family_relationships', 0);
  });

  it('E2E-R05 rejects cross-family relationship', async () => {
    const first = await seedFamily('creator-1', 'r05a');
    const second = await seedFamily('creator-2', 'r05b');
    const response = await postRelationship(first.familyId, {
      person_a_id: first.parentId,
      person_b_id: second.childId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-e2e-rel-r05',
    }, 'creator-1', 'corr-r05');

    expect(response.status).toBe(400);
    await expectCount('family_relationships', 0);
  });

  it('E2E-R06 replays idempotency and rejects conflicting payload', async () => {
    const seed = await seedFamily('creator-1', 'r06');
    const request = {
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'OTHER',
      idempotency_key: 'idem-e2e-rel-r06',
    };
    const first = await postRelationship(seed.familyId, request, 'creator-1', 'corr-r06');
    const second = await postRelationship(seed.familyId, request, 'creator-1', 'corr-r06');
    const conflict = await postRelationship(seed.familyId, {
      ...request,
      person_a_id: seed.childId,
      person_b_id: seed.parentId,
    }, 'creator-1', 'corr-r06');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual(await first.json());
    expect(conflict.status).toBe(409);
    await expectCount('family_relationships', 1);
  });

  it('E2E-R07 rejects reverse spouse duplicate', async () => {
    const seed = await seedFamilyWithTwoParents('creator-1', 'r07');
    await postRelationship(seed.familyId, {
      person_a_id: seed.parentAId,
      person_b_id: seed.parentBId,
      relationship_type: 'SPOUSE',
      idempotency_key: 'idem-e2e-rel-r07a',
    }, 'creator-1', 'corr-r07');
    const reverse = await postRelationship(seed.familyId, {
      person_a_id: seed.parentBId,
      person_b_id: seed.parentAId,
      relationship_type: 'SPOUSE',
      idempotency_key: 'idem-e2e-rel-r07b',
    }, 'creator-1', 'corr-r07');

    expect(reverse.status).toBe(409);
    await expectCount('family_relationships', 1);
  });

  it('E2E-R08 does not create consent, life stage, or growth side effects', async () => {
    const seed = await seedFamily('creator-1', 'r08');
    await postRelationship(seed.familyId, {
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: 'idem-e2e-rel-r08',
    }, 'creator-1', 'corr-r08');

    await expectCount('family_relationships', 1);
    await expectCount('consents', 0);
    await expectCount('life_stage_assignments', 0);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_journeys', 0);
    await expectCount('growth_events', 0);
  });

  async function seedFamily(actorId: string, suffix: string) {
    const family = await createFamily(actorId, `idem-e2e-family-${suffix}`, `corr-${suffix}`);
    const parent = await postParent(family.family.family_id, {
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: `idem-e2e-parent-${suffix}`,
    }, actorId, `corr-${suffix}`);
    const child = await postChild(family.family.family_id, {
      display_name: '孩子',
      idempotency_key: `idem-e2e-child-${suffix}`,
    }, actorId, `corr-${suffix}`);

    return { familyId: family.family.family_id, parentId: parent.parent.person_id, childId: child.child.person_id };
  }

  async function seedFamilyWithTwoParents(actorId: string, suffix: string) {
    const seed = await seedFamily(actorId, suffix);
    const parentB = await postParent(seed.familyId, {
      role: 'FATHER',
      display_name: '爸爸',
      idempotency_key: `idem-e2e-parent-b-${suffix}`,
    }, actorId, `corr-${suffix}`);

    return { familyId: seed.familyId, parentAId: seed.parentId, parentBId: parentB.parent.person_id };
  }

  async function createFamily(actorId: string, idempotencyKey: string, correlationId: string): Promise<CreateFamilyHttpResponse> {
    const response = await fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify({ display_name: '王家', idempotency_key: idempotencyKey }),
    });
    return await response.json() as CreateFamilyHttpResponse;
  }

  async function postParent(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<PersonHttpResponse> {
    const response = await fetch(`${baseUrl}/families/${familyId}/parents`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
    return await response.json() as PersonHttpResponse;
  }

  async function postChild(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<ChildHttpResponse> {
    const response = await fetch(`${baseUrl}/families/${familyId}/children`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
    return await response.json() as ChildHttpResponse;
  }

  async function postRelationship(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}/relationships`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
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

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

interface CreateFamilyHttpResponse {
  family: { family_id: string };
}

interface PersonHttpResponse {
  parent: { person_id: string };
}

interface ChildHttpResponse {
  child: { person_id: string };
}

interface RelationshipHttpResponse {
  relationship: {
    family_id: string;
    relationship_type: string;
  };
}
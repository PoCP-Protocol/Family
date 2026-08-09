import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families/{familyId}/consents E2E', () => {
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

  it('E2E-C01 grants consent through real HTTP with Idempotency-Key header', async () => {
    const seed = await seedAuthorizedFamily('creator-1', 'c01', 'PARENT_CHILD');
    const response = await postConsent(seed.familyId, {
      subjectPersonId: seed.childId,
      guardianPersonId: seed.parentId,
      purpose: 'SERVICE',
      policyVersion: 'family-consent-v1',
    }, 'creator-1', 'corr-c01', 'idem-e2e-consent-c01');
    const body = await response.json() as ConsentHttpResponse;

    expect(response.status).toBe(201);
    expect(body.consent.family_id).toBe(seed.familyId);
    expect(body.consent.purpose).toBe('SERVICE');
    expect(body.consent.status).toBe('GRANTED');
    await expectCount('consents', 1);
    await expectCount('life_stage_assignments', 0);
    await expectCount('growth_profiles', 0);
  });

  it('E2E-C02 rejects invalid schema, missing actor, and missing Idempotency-Key', async () => {
    const seed = await seedAuthorizedFamily('creator-1', 'c02', 'PARENT_CHILD');
    const invalid = await postConsent(seed.familyId, {
      subjectPersonId: seed.childId,
      guardianPersonId: seed.parentId,
      purpose: 'GENERAL',
      policyVersion: 'family-consent-v1',
    }, 'creator-1', 'corr-c02', 'idem-e2e-consent-c02-invalid');
    const missingActor = await fetch(`${baseUrl}/families/${seed.familyId}/consents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-correlation-id': 'corr-c02', 'x-source': 'vitest-e2e', 'idempotency-key': 'idem-e2e-consent-c02-missing-actor' },
      body: JSON.stringify({
        subjectPersonId: seed.childId,
        guardianPersonId: seed.parentId,
        purpose: 'SERVICE',
        policyVersion: 'family-consent-v1',
      }),
    });
    const missingIdempotency = await fetch(`${baseUrl}/families/${seed.familyId}/consents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-actor-id': 'creator-1', 'x-correlation-id': 'corr-c02', 'x-source': 'vitest-e2e' },
      body: JSON.stringify({
        subjectPersonId: seed.childId,
        guardianPersonId: seed.parentId,
        purpose: 'SERVICE',
        policyVersion: 'family-consent-v1',
      }),
    });

    expect(invalid.status).toBe(400);
    expect(missingActor.status).toBe(401);
    expect(missingIdempotency.status).toBe(400);
    await expectCount('consents', 0);
  });

  it('E2E-C03 denies unauthorized guardian paths', async () => {
    const noRel = await seedFamily('creator-1', 'c03-no-rel');
    const noRelationship = await postConsent(noRel.familyId, consentBody(noRel), 'creator-1', 'corr-c03', 'idem-e2e-consent-c03-no-rel');
    const wrongActor = await postConsent(noRel.familyId, consentBody(noRel), 'other-actor', 'corr-c03', 'idem-e2e-consent-c03-wrong-actor');

    expect(noRelationship.status).toBe(403);
    expect(wrongActor.status).toBe(403);
    await expectCount('consents', 0);
  });

  it('E2E-C04 supports GUARDIAN_CHILD, purpose isolation, idempotency replay, and conflicts', async () => {
    const seed = await seedAuthorizedFamily('creator-1', 'c04', 'GUARDIAN_CHILD');
    const serviceRequest = consentBody(seed);
    const first = await postConsent(seed.familyId, serviceRequest, 'creator-1', 'corr-c04', 'idem-e2e-consent-c04');
    const second = await postConsent(seed.familyId, serviceRequest, 'creator-1', 'corr-c04', 'idem-e2e-consent-c04');
    const idemConflict = await postConsent(seed.familyId, { ...serviceRequest, purpose: 'RESEARCH' }, 'creator-1', 'corr-c04', 'idem-e2e-consent-c04');
    const duplicate = await postConsent(seed.familyId, serviceRequest, 'creator-1', 'corr-c04', 'idem-e2e-consent-c04-duplicate');
    const research = await postConsent(seed.familyId, { ...serviceRequest, purpose: 'RESEARCH' }, 'creator-1', 'corr-c04', 'idem-e2e-consent-c04-research');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual(await first.json());
    expect(idemConflict.status).toBe(409);
    expect(duplicate.status).toBe(409);
    expect(research.status).toBe(201);
    await expectCount('consents', 2);
  });

  it('E2E-C05 creates new policy version and keeps consent history', async () => {
    const seed = await seedAuthorizedFamily('creator-1', 'c05', 'PARENT_CHILD');
    await postConsent(seed.familyId, consentBody(seed), 'creator-1', 'corr-c05', 'idem-e2e-consent-c05-v1');
    const v2 = await postConsent(seed.familyId, { ...consentBody(seed), policyVersion: 'family-consent-v2' }, 'creator-1', 'corr-c05', 'idem-e2e-consent-c05-v2');

    expect(v2.status).toBe(201);
    const rows = await pool.query('select policy_version, status from consents where purpose = $1 order by policy_version', ['SERVICE']);
    expect(rows.rows).toEqual([
      { policy_version: 'family-consent-v1', status: 'EXPIRED' },
      { policy_version: 'family-consent-v2', status: 'GRANTED' },
    ]);
  });

  async function seedAuthorizedFamily(actorId: string, suffix: string, relationshipType: 'PARENT_CHILD' | 'GUARDIAN_CHILD') {
    const seed = await seedFamily(actorId, suffix);
    await postRelationship(seed.familyId, {
      person_a_id: seed.parentId,
      person_b_id: seed.childId,
      relationship_type: relationshipType,
      idempotency_key: `idem-e2e-rel-${suffix}`,
    }, actorId, `corr-${suffix}`);

    return seed;
  }

  async function seedFamily(actorId: string, suffix: string) {
    const family = await createFamily(actorId, `idem-e2e-family-${suffix}`, `corr-${suffix}`);
    const parent = await postParent(family.family.family_id, {
      role: 'MOTHER',
      display_name: '妈妈',
      account_id: actorId,
      idempotency_key: `idem-e2e-parent-${suffix}`,
    }, actorId, `corr-${suffix}`);
    const child = await postChild(family.family.family_id, {
      display_name: '孩子',
      idempotency_key: `idem-e2e-child-${suffix}`,
    }, actorId, `corr-${suffix}`);

    return { familyId: family.family.family_id, parentId: parent.parent.person_id, childId: child.child.person_id };
  }

  function consentBody(seed: { parentId: string; childId: string }): Record<string, unknown> {
    return {
      subjectPersonId: seed.childId,
      guardianPersonId: seed.parentId,
      purpose: 'SERVICE',
      policyVersion: 'family-consent-v1',
    };
  }

  async function createFamily(actorId: string, idempotencyKey: string, correlationId: string): Promise<CreateFamilyHttpResponse> {
    const response = await fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify({ display_name: '王家', idempotency_key: idempotencyKey }),
    });
    return await response.json() as CreateFamilyHttpResponse;
  }

  async function postParent(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<ParentHttpResponse> {
    const response = await fetch(`${baseUrl}/families/${familyId}/parents`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
    return await response.json() as ParentHttpResponse;
  }

  async function postChild(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<ChildHttpResponse> {
    const response = await fetch(`${baseUrl}/families/${familyId}/children`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
    return await response.json() as ChildHttpResponse;
  }

  async function postRelationship(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<void> {
    await fetch(`${baseUrl}/families/${familyId}/relationships`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
  }

  async function postConsent(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string, idempotencyKey: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}/consents`, {
      method: 'POST',
      headers: { ...headers(actorId, correlationId), 'idempotency-key': idempotencyKey },
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

interface ParentHttpResponse {
  parent: { person_id: string };
}

interface ChildHttpResponse {
  child: { person_id: string };
}

interface ConsentHttpResponse {
  consent: {
    family_id: string;
    purpose: string;
    status: string;
  };
}
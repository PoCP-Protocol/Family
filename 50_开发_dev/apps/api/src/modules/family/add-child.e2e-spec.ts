import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families/{familyId}/children E2E', () => {
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

  it('E2E-C01 adds a child through real HTTP with expected DB side effects', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-child-family', 'corr-child-01');
    const response = await postChild(family.family.family_id, {
      display_name: '孩子',
      birth_date: '2012-05-06',
      idempotency_key: 'idem-e2e-child-1',
    }, 'creator-1', 'corr-child-01');
    const body = await response.json() as AddChildHttpResponse;

    expect(response.status).toBe(201);
    expect(body.child.person_type).toBe('CHILD');
    expect(body.child.parent_role).toBeNull();
    expect(body.child.birth_date).toBe('2012-05-06');
    await expectCount('persons', 1);
    await expectCount('audit_logs', 2);
    await expectCount('outbox_events', 2);
    await expectCount('idempotency_keys', 2);
    await expectMinorDataNoSideEffects();
  });

  it('E2E-C02 rejects parent_role injection with 400 and no child row', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-child-family-inject', 'corr-child-02');
    const response = await postChild(family.family.family_id, {
      display_name: '孩子',
      parent_role: 'MOTHER',
      idempotency_key: 'idem-e2e-child-inject',
    }, 'creator-1', 'corr-child-02');

    expect(response.status).toBe(400);
    await expectCount('persons', 0);
  });

  it('E2E-C03 rejects unauthorized actor with 403', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-child-family-forbidden', 'corr-child-03');
    const response = await postChild(family.family.family_id, {
      display_name: '孩子',
      idempotency_key: 'idem-e2e-child-forbidden',
    }, 'other-actor', 'corr-child-03');

    expect(response.status).toBe(403);
    await expectCount('persons', 0);
  });

  it('E2E-C04 rejects missing family with 404', async () => {
    const response = await postChild('11111111-1111-4111-8111-111111111111', {
      display_name: '孩子',
      idempotency_key: 'idem-e2e-child-missing',
    }, 'creator-1', 'corr-child-04');

    expect(response.status).toBe(404);
    await expectCount('persons', 0);
  });

  it('E2E-C05 replays identical idempotency key and rejects conflicting payload', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-child-family-idem', 'corr-child-05');
    const first = await postChild(family.family.family_id, {
      display_name: '孩子',
      idempotency_key: 'idem-e2e-child-same',
    }, 'creator-1', 'corr-child-05');
    const second = await postChild(family.family.family_id, {
      display_name: '孩子',
      idempotency_key: 'idem-e2e-child-same',
    }, 'creator-1', 'corr-child-05');
    const conflict = await postChild(family.family.family_id, {
      display_name: '另一个孩子',
      idempotency_key: 'idem-e2e-child-same',
    }, 'creator-1', 'corr-child-05');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual(await first.json());
    expect(conflict.status).toBe(409);
    await expectCount('persons', 1);
  });

  async function createFamily(actorId: string, idempotencyKey: string, correlationId: string): Promise<CreateFamilyHttpResponse> {
    const response = await fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify({ display_name: '王家', idempotency_key: idempotencyKey }),
    });
    return await response.json() as CreateFamilyHttpResponse;
  }

  async function postChild(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}/children`, {
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

  async function expectMinorDataNoSideEffects(): Promise<void> {
    await expectCount('consents', 0);
    await expectCount('life_stage_assignments', 0);
    await expectCount('family_relationships', 0);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_journeys', 0);
    await expectCount('growth_events', 0);
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

interface CreateFamilyHttpResponse {
  family: {
    family_id: string;
  };
}

interface AddChildHttpResponse {
  child: {
    person_type: 'CHILD';
    parent_role: null;
    birth_date: string | null;
  };
}
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families/{familyId}/parents E2E', () => {
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

  it('E2E-P01 adds a parent through real HTTP with expected DB side effects', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-parent-family', 'corr-parent-01');
    const response = await postParent(family.family.family_id, {
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: 'idem-e2e-parent-1',
    }, 'creator-1', 'corr-parent-01');
    const body = await response.json() as AddParentHttpResponse;

    expect(response.status).toBe(201);
    expect(body.parent.person_type).toBe('PARENT');
    expect(body.parent.parent_role).toBe('MOTHER');
    expect(body.parent.family_id).toBe(family.family.family_id);
    await expectCount('persons', 1);
    await expectCount('audit_logs', 2);
    await expectCount('outbox_events', 2);
    await expectCount('idempotency_keys', 2);
    await expectCount('growth_profiles', 0);
  });

  it('E2E-P02 rejects invalid role with 400 and no parent row', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-parent-family-invalid', 'corr-parent-02');
    const response = await postParent(family.family.family_id, {
      role: 'CHILD',
      display_name: '妈妈',
      idempotency_key: 'idem-e2e-parent-invalid',
    }, 'creator-1', 'corr-parent-02');

    expect(response.status).toBe(400);
    await expectCount('persons', 0);
  });

  it('E2E-P03 rejects unauthorized actor with 403', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-parent-family-forbidden', 'corr-parent-03');
    const response = await postParent(family.family.family_id, {
      role: 'FATHER',
      display_name: '爸爸',
      idempotency_key: 'idem-e2e-parent-forbidden',
    }, 'other-actor', 'corr-parent-03');

    expect(response.status).toBe(403);
    await expectCount('persons', 0);
  });

  it('E2E-P04 rejects missing family with 404', async () => {
    const response = await postParent('11111111-1111-4111-8111-111111111111', {
      role: 'GUARDIAN',
      display_name: '监护人',
      idempotency_key: 'idem-e2e-parent-missing',
    }, 'creator-1', 'corr-parent-04');

    expect(response.status).toBe(404);
    await expectCount('persons', 0);
  });

  it('E2E-P05 replays identical idempotency key and rejects conflicting payload', async () => {
    const family = await createFamily('creator-1', 'idem-e2e-parent-family-idem', 'corr-parent-05');
    const first = await postParent(family.family.family_id, {
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: 'idem-e2e-parent-same',
    }, 'creator-1', 'corr-parent-05');
    const second = await postParent(family.family.family_id, {
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: 'idem-e2e-parent-same',
    }, 'creator-1', 'corr-parent-05');
    const conflict = await postParent(family.family.family_id, {
      role: 'FATHER',
      display_name: '爸爸',
      idempotency_key: 'idem-e2e-parent-same',
    }, 'creator-1', 'corr-parent-05');

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

  async function postParent(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}/parents`, {
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
  family: {
    family_id: string;
  };
}

interface AddParentHttpResponse {
  parent: {
    family_id: string;
    person_type: 'PARENT';
    parent_role: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER_GUARDIAN';
  };
}
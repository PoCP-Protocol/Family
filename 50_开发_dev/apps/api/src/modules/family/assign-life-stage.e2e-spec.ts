import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families/{familyId}/life-stages E2E', () => {
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

  it('E2E-LS01 assigns life stage through real HTTP', async () => {
    const seed = await seedFamily('creator-1', 'ls01');
    const response = await postLifeStage(seed.familyId, {
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls01',
    }, 'creator-1', 'corr-ls01');
    const body = await response.json() as AssignLifeStageHttpResponse;

    expect(response.status).toBe(201);
    expect(body.assignment.family_id).toBe(seed.familyId);
    expect(body.assignment.child_id).toBe(seed.childId);
    expect(body.assignment.life_stage_code).toBe('EARLY_ADOLESCENCE_12_15');
    expect(body.assignment.effective_to).toBeNull();
    await expectCount('life_stage_assignments', 1);
    await expectCount('consents', 0);
    await expectCount('growth_profiles', 0);
  });

  it('E2E-LS02 rejects invalid schema and missing actor', async () => {
    const seed = await seedFamily('creator-1', 'ls02');
    const invalid = await postLifeStage(seed.familyId, {
      child_id: seed.childId,
      life_stage_code: 'MIDDLE_CHILDHOOD_6_11',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls02-invalid',
    }, 'creator-1', 'corr-ls02');
    const missingActor = await fetch(`${baseUrl}/families/${seed.familyId}/life-stages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-correlation-id': 'corr-ls02', 'x-source': 'vitest-e2e' },
      body: JSON.stringify({
        child_id: seed.childId,
        life_stage_code: 'EARLY_ADOLESCENCE_12_15',
        effective_from: '2026-01-01T00:00:00.000Z',
        idempotency_key: 'idem-e2e-life-stage-ls02-missing-actor',
      }),
    });

    expect(invalid.status).toBe(400);
    expect(missingActor.status).toBe(401);
    await expectCount('life_stage_assignments', 0);
  });

  it('E2E-LS03 rejects unauthorized actor, parent subject, and cross-family child', async () => {
    const first = await seedFamilyWithParent('creator-1', 'ls03a');
    const second = await seedFamily('creator-2', 'ls03b');

    const forbidden = await postLifeStage(first.familyId, {
      child_id: first.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls03-forbidden',
    }, 'other-actor', 'corr-ls03');
    const parentSubject = await postLifeStage(first.familyId, {
      child_id: first.parentId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls03-parent',
    }, 'creator-1', 'corr-ls03');
    const crossFamily = await postLifeStage(first.familyId, {
      child_id: second.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls03-cross',
    }, 'creator-1', 'corr-ls03');

    expect(forbidden.status).toBe(403);
    expect(parentSubject.status).toBe(400);
    expect(crossFamily.status).toBe(400);
    await expectCount('life_stage_assignments', 0);
  });

  it('E2E-LS04 replays idempotency and rejects conflicting payload or active duplicate', async () => {
    const seed = await seedFamily('creator-1', 'ls04');
    const request = {
      child_id: seed.childId,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-01-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls04',
    };
    const first = await postLifeStage(seed.familyId, request, 'creator-1', 'corr-ls04');
    const second = await postLifeStage(seed.familyId, request, 'creator-1', 'corr-ls04');
    const conflict = await postLifeStage(seed.familyId, {
      ...request,
      effective_from: '2026-02-01T00:00:00.000Z',
    }, 'creator-1', 'corr-ls04');
    const duplicate = await postLifeStage(seed.familyId, {
      ...request,
      effective_from: '2026-02-01T00:00:00.000Z',
      idempotency_key: 'idem-e2e-life-stage-ls04-duplicate',
    }, 'creator-1', 'corr-ls04');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await second.json()).toEqual(await first.json());
    expect(conflict.status).toBe(409);
    expect(duplicate.status).toBe(409);
    await expectCount('life_stage_assignments', 1);
  });

  async function seedFamily(actorId: string, suffix: string) {
    const family = await createFamily(actorId, `idem-e2e-family-${suffix}`, `corr-${suffix}`);
    const child = await postChild(family.family.family_id, {
      display_name: '孩子',
      birth_date: '2012-05-06',
      idempotency_key: `idem-e2e-child-${suffix}`,
    }, actorId, `corr-${suffix}`);

    return { familyId: family.family.family_id, childId: child.child.person_id };
  }

  async function seedFamilyWithParent(actorId: string, suffix: string) {
    const seed = await seedFamily(actorId, suffix);
    const parent = await postParent(seed.familyId, {
      role: 'MOTHER',
      display_name: '妈妈',
      idempotency_key: `idem-e2e-parent-${suffix}`,
    }, actorId, `corr-${suffix}`);

    return { familyId: seed.familyId, childId: seed.childId, parentId: parent.parent.person_id };
  }

  async function createFamily(actorId: string, idempotencyKey: string, correlationId: string): Promise<CreateFamilyHttpResponse> {
    const response = await fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify({ display_name: '王家', idempotency_key: idempotencyKey }),
    });
    return await response.json() as CreateFamilyHttpResponse;
  }

  async function postChild(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<ChildHttpResponse> {
    const response = await fetch(`${baseUrl}/families/${familyId}/children`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
    return await response.json() as ChildHttpResponse;
  }

  async function postParent(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<ParentHttpResponse> {
    const response = await fetch(`${baseUrl}/families/${familyId}/parents`, {
      method: 'POST',
      headers: headers(actorId, correlationId),
      body: JSON.stringify(body),
    });
    return await response.json() as ParentHttpResponse;
  }

  async function postLifeStage(familyId: string, body: Record<string, unknown>, actorId: string, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}/life-stages`, {
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

interface ChildHttpResponse {
  child: { person_id: string };
}

interface ParentHttpResponse {
  parent: { person_id: string };
}

interface AssignLifeStageHttpResponse {
  assignment: {
    family_id: string;
    child_id: string;
    life_stage_code: string;
    effective_to: string | null;
  };
}
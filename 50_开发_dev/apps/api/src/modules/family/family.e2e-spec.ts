import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('POST /families E2E', () => {
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

  it('E2E-01 creates a family through real HTTP with 201 response', async () => {
    const response = await postFamily({ display_name: '王家', idempotency_key: 'e2e-valid-1' }, 'corr-e2e-01');
    const body = await response.json() as CreateFamilyHttpResponse;

    expect(response.status).toBe(201);
    expect(body.family.family_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.family.display_name).toBe('王家');
    expect(body.family.status).toBe('ACTIVE');
    expect(body.family.version).toBe(1);
    expect(typeof body.family.created_at).toBe('string');
  });

  it('E2E-02 rejects client supplied family_id and does not create a family', async () => {
    const response = await postFamily({
      family_id: '11111111-1111-1111-1111-111111111111',
      display_name: '王家',
      idempotency_key: 'e2e-invalid-family-id',
    }, 'corr-e2e-02');
    const families = await pool.query('select family_id from families');

    expect(response.status).toBe(400);
    expect(await errorStatus(response)).toBe(400);
    expect(families.rowCount).toBe(0);
  });

  it('E2E-03 rejects missing or invalid display_name', async () => {
    const response = await postFamily({ idempotency_key: 'e2e-invalid-display' }, 'corr-e2e-03');

    expect(response.status).toBe(400);
    expect(await errorStatus(response)).toBe(400);
  });

  it('E2E-04 rejects missing actor context with OpenAPI-aligned 401', async () => {
    const response = await fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'corr-e2e-04',
        'x-source': 'vitest-e2e',
        'idempotency-key': 'e2e-missing-actor',
      },
      body: JSON.stringify({ display_name: '王家', idempotency_key: 'e2e-missing-actor' }),
    });

    expect(response.status).toBe(401);
    expect(await errorStatus(response)).toBe(401);
  });

  it('E2E-05 replays same idempotency key with same payload', async () => {
    const first = await postFamily({ display_name: '王家', idempotency_key: 'e2e-idem-same' }, 'corr-e2e-05');
    const second = await postFamily({ display_name: '王家', idempotency_key: 'e2e-idem-same' }, 'corr-e2e-05');
    const firstBody = await first.json() as CreateFamilyHttpResponse;
    const secondBody = await second.json() as CreateFamilyHttpResponse;
    const families = await pool.query('select family_id from families');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(secondBody).toEqual(firstBody);
    expect(families.rowCount).toBe(1);
  });

  it('E2E-06 rejects same idempotency key with different payload', async () => {
    await postFamily({ display_name: '王家', idempotency_key: 'e2e-idem-conflict' }, 'corr-e2e-06');
    const response = await postFamily({ display_name: '李家', idempotency_key: 'e2e-idem-conflict' }, 'corr-e2e-06');

    expect(response.status).toBe(409);
    expect(await errorStatus(response)).toBe(409);
  });

  it('E2E-07 propagates correlation id to audit and outbox', async () => {
    const correlationId = 'corr-e2e-07';
    const response = await postFamily({ display_name: '王家', idempotency_key: 'e2e-correlation' }, correlationId);
    const body = await response.json() as CreateFamilyHttpResponse;
    const audit = await pool.query('select correlation_id from audit_logs where resource_id = $1', [body.family.family_id]);
    const outbox = await pool.query('select correlation_id from outbox_events where aggregate_id = $1', [body.family.family_id]);

    expect(audit.rows[0]?.correlation_id).toBe(correlationId);
    expect(outbox.rows[0]?.correlation_id).toBe(correlationId);
  });

  it('E2E-08 creates only expected database side effects', async () => {
    await postFamily({ display_name: '王家', idempotency_key: 'e2e-side-effects' }, 'corr-e2e-08');

    await expectCount('families', 1);
    await expectCount('audit_logs', 1);
    await expectCount('outbox_events', 1);
    await expectCount('idempotency_keys', 1);
    await expectCount('growth_profiles', 0);
    await expectCount('growth_journeys', 0);
  });

  it('E2E-M2-101 starts growth onboarding through real HTTP without AI consent', async () => {
    const correlationId = 'corr-e2e-m2-101';
    const familyResponse = await postFamily({ display_name: '青春期沟通家庭', idempotency_key: 'e2e-m2-family' }, correlationId);
    const familyBody = await familyResponse.json() as CreateFamilyHttpResponse;
    const parentBody = await postJson<{ parent: { person_id: string } }>(`/families/${familyBody.family.family_id}/parents`, {
      role: 'GUARDIAN',
      display_name: '监护人',
      account_id: 'architect-1',
      idempotency_key: 'e2e-m2-parent',
    }, correlationId);
    const childBody = await postJson<{ child: { person_id: string } }>(`/families/${familyBody.family.family_id}/children`, {
      display_name: '孩子',
      birth_date: '2012-06-01',
      idempotency_key: 'e2e-m2-child',
    }, correlationId);

    await postJson(`/families/${familyBody.family.family_id}/relationships`, {
      person_a_id: parentBody.parent.person_id,
      person_b_id: childBody.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: 'e2e-m2-relationship',
    }, correlationId);
    await postJson(`/families/${familyBody.family.family_id}/life-stages`, {
      child_id: childBody.child.person_id,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-08-10T00:00:00.000Z',
      idempotency_key: 'e2e-m2-life-stage',
    }, correlationId);

    for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'] as const) {
      await postJson(`/families/${familyBody.family.family_id}/consents`, {
        subjectPersonId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        purpose,
        policyVersion: 'm2-101-e2e',
      }, correlationId, `e2e-m2-consent-${purpose}`);
    }

    const onboardingResponse = await fetch(`${baseUrl}/families/${familyBody.family.family_id}/growth/onboarding`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': 'e2e-m2-start-onboarding',
      },
      body: JSON.stringify({
        childId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingResponse.json() as StartGrowthOnboardingHttpResponse;

    expect(onboardingResponse.status).toBe(201);
    expect(onboardingBody.onboarding).toMatchObject({
      family_id: familyBody.family.family_id,
      child_id: childBody.child.person_id,
      guardian_person_id: parentBody.parent.person_id,
      journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      target_dimensions: ['P03', 'R03', 'R04', 'R05'],
      status: 'ACTIVE',
      phase: 'ONBOARDING',
      safety_screening_result: 'LOW',
      ai_personalization_enabled: false,
    });

    await expectCount('growth_journeys', 1);
    const audit = await pool.query('select correlation_id from audit_logs where action_name = $1', ['StartGrowthOnboarding']);
    const outbox = await pool.query('select correlation_id from outbox_events where event_name = $1', ['GrowthOnboardingStarted']);
    const growthEvent = await pool.query('select payload from growth_events where event_type = $1', ['GrowthOnboardingStarted']);
    expect(audit.rows[0]?.correlation_id).toBe(correlationId);
    expect(outbox.rows[0]?.correlation_id).toBe(correlationId);
    expect(growthEvent.rows[0]?.payload?.ai_personalization_enabled).toBe(false);
  });

  async function postFamily(body: Record<string, unknown>, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        'idempotency-key': String(body.idempotency_key ?? 'missing'),
      },
      body: JSON.stringify(body),
    });
  }

  async function postJson<TBody = unknown>(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<TBody> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        'x-actor-id': 'architect-1',
        'x-correlation-id': correlationId,
        'x-source': 'vitest-e2e',
        ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);
    return await response.json() as TBody;
  }

  async function errorStatus(response: Response): Promise<number> {
    const body = await response.json() as { statusCode?: number };
    return body.statusCode ?? 0;
  }

  async function expectCount(tableName: string, expected: number): Promise<void> {
    const result = await pool.query(`select count(*)::int as count from ${tableName}`);
    expect(result.rows[0].count).toBe(expected);
  }
});

interface CreateFamilyHttpResponse {
  family: {
    family_id: string;
    display_name: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    version: number;
    created_at: string;
  };
}

interface StartGrowthOnboardingHttpResponse {
  onboarding: {
    onboarding_id: string;
    family_id: string;
    child_id: string;
    guardian_person_id: string;
    journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT';
    life_stage_code: 'EARLY_ADOLESCENCE_12_15';
    target_dimensions: ['P03', 'R03', 'R04', 'R05'];
    status: 'ACTIVE';
    phase: 'ONBOARDING';
    safety_screening_result: 'LOW';
    ai_personalization_enabled: false;
  };
}
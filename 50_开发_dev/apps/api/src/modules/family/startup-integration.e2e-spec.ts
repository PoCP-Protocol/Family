import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

describe('Family startup integration closeout E2E', () => {
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

  it('E2E-START-01 creates family through real HTTP and reads aggregate through real HTTP', async () => {
    const correlationId = 'corr-e2e-start-01';
    const createRes = await postFamily({ display_name: '启动联调家庭', idempotency_key: 'start-01-create-family' }, correlationId);
    const createBody = await createRes.json() as { family: { family_id: string; display_name: string } };

    expect(createRes.status).toBe(201);
    expect(createBody.family.display_name).toBe('启动联调家庭');

    const aggregateRes = await getFamilyAggregate(createBody.family.family_id);
    const aggregateBody = await aggregateRes.json() as { family: { family_id: string; display_name: string }; members: unknown[]; relationships: unknown[] };

    expect(aggregateRes.status).toBe(200);
    expect(aggregateBody.family.family_id).toBe(createBody.family.family_id);
    expect(aggregateBody.family.display_name).toBe('启动联调家庭');
    expect(Array.isArray(aggregateBody.members)).toBe(true);
    expect(Array.isArray(aggregateBody.relationships)).toBe(true);
  });

  it('E2E-START-02 starts onboarding through real HTTP and persists readback in aggregate', async () => {
    const setup = await seedM2ReadyFamily('corr-e2e-start-02');

    const onboardingRes = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboarding`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-02', 'start-02-onboarding'),
      body: JSON.stringify({
        childId: setup.childId,
        guardianPersonId: setup.parentId,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingRes.json() as { onboarding: { onboarding_id: string; family_id: string; status: string } };

    expect(onboardingRes.status).toBe(201);
    expect(onboardingBody.onboarding.family_id).toBe(setup.familyId);
    expect(onboardingBody.onboarding.status).toBe('ACTIVE');

    const aggregateRes = await getFamilyAggregate(setup.familyId);
    const aggregateBody = await aggregateRes.json() as { currentOnboarding: { onboarding_id: string; family_id: string } | null };
    expect(aggregateRes.status).toBe(200);
    expect(aggregateBody.currentOnboarding?.onboarding_id).toBe(onboardingBody.onboarding.onboarding_id);
    expect(aggregateBody.currentOnboarding?.family_id).toBe(setup.familyId);
  });

  it('E2E-START-03 keeps onboarding state after reload/readback', async () => {
    const setup = await seedM2ReadyFamily('corr-e2e-start-03');

    const onboardingRes = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboarding`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-03', 'start-03-onboarding'),
      body: JSON.stringify({
        childId: setup.childId,
        guardianPersonId: setup.parentId,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingRes.json() as { onboarding: { onboarding_id: string } };
    expect(onboardingRes.status).toBe(201);

    const firstRead = await getFamilyAggregate(setup.familyId);
    const firstBody = await firstRead.json() as { currentOnboarding: { onboarding_id: string } | null };
    const secondRead = await getFamilyAggregate(setup.familyId);
    const secondBody = await secondRead.json() as { currentOnboarding: { onboarding_id: string } | null };

    expect(firstRead.status).toBe(200);
    expect(secondRead.status).toBe(200);
    expect(firstBody.currentOnboarding?.onboarding_id).toBe(onboardingBody.onboarding.onboarding_id);
    expect(secondBody.currentOnboarding?.onboarding_id).toBe(onboardingBody.onboarding.onboarding_id);
  });

  it('E2E-START-04 rejects invalid onboarding payload', async () => {
    const setup = await seedM2ReadyFamily('corr-e2e-start-04');

    const invalidRes = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboarding`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-04', 'start-04-invalid'),
      body: JSON.stringify({
        childId: setup.childId,
        guardianPersonId: setup.parentId,
        safetyScreeningResult: 'LOW',
        finalSafetySeverity: 'LOW',
      }),
    });

    expect(invalidRes.status).toBe(400);
  });

  it('E2E-START-05 derives final safety result on server from structured safety signal', async () => {
    const setup = await seedM2Onboarding('corr-e2e-start-05');

    const perspectiveRes = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/perspectives`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-05', 'start-05-perspective'),
      body: JSON.stringify({
        subjectPersonId: setup.childId,
        authorPersonId: setup.parentId,
        perspectiveType: 'PARENT_PERSPECTIVE',
        captureMode: 'DIRECT_SELF_REPORT',
        relatedDimensionIds: ['P03', 'R03'],
        content: {
          promptId: 'start-05-prompt',
          responseText: '我觉得最近容易在学习上争执。',
          selectedSignals: ['interrupts'],
        },
        structuredSafetySignals: ['NONE'],
      }),
    });
    const perspectiveBody = await perspectiveRes.json() as { perspective: { safety_disposition: { severity: string; disposition: string; policy_version: string; signals: string[] } } };

    expect(perspectiveRes.status).toBe(201);
    expect(perspectiveBody.perspective.safety_disposition.severity).toBe('LOW');
    expect(perspectiveBody.perspective.safety_disposition.disposition).toBe('NORMAL');
    expect(perspectiveBody.perspective.safety_disposition.policy_version).toBe('M2_102_DETERMINISTIC_V1');
    expect(perspectiveBody.perspective.safety_disposition.signals).toEqual(['NONE']);
  });

  it('E2E-START-06 rejects client-provided final safety severity field', async () => {
    const setup = await seedM2Onboarding('corr-e2e-start-06');

    const response = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboardings/${setup.onboardingId}/perspectives`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-06', 'start-06-client-severity'),
      body: JSON.stringify({
        subjectPersonId: setup.childId,
        authorPersonId: setup.parentId,
        perspectiveType: 'PARENT_PERSPECTIVE',
        captureMode: 'DIRECT_SELF_REPORT',
        relatedDimensionIds: ['P03', 'R03'],
        content: {
          promptId: 'start-06-prompt',
          responseText: '客户端尝试提交最终安全等级。',
          selectedSignals: [],
        },
        structuredSafetySignals: ['NONE'],
        safetySeverity: 'LOW',
      }),
    });

    expect(response.status).toBe(400);
  });

  it('E2E-START-07 returns safe failure for wrong family id', async () => {
    const setup = await seedM2ReadyFamily('corr-e2e-start-07');
    const wrongFamilyId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    const response = await fetch(`${baseUrl}/families/${wrongFamilyId}/growth/onboarding`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-07', 'start-07-wrong-family'),
      body: JSON.stringify({
        childId: setup.childId,
        guardianPersonId: setup.parentId,
        safetyScreeningResult: 'LOW',
      }),
    });

    expect([403, 404]).toContain(response.status);
  });

  it('E2E-START-08 keeps persisted onboarding readable across API restart', async () => {
    const setup = await seedM2ReadyFamily('corr-e2e-start-08');
    const onboardingRes = await fetch(`${baseUrl}/families/${setup.familyId}/growth/onboarding`, {
      method: 'POST',
      headers: requestHeaders('corr-e2e-start-08', 'start-08-onboarding'),
      body: JSON.stringify({
        childId: setup.childId,
        guardianPersonId: setup.parentId,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingRes.json() as { onboarding: { onboarding_id: string } };
    expect(onboardingRes.status).toBe(201);

    await app.close();
    app = await NestFactory.create(AppModule, { logger: ['error'] });
    await app.listen(0);
    baseUrl = await app.getUrl();

    const aggregateRes = await getFamilyAggregate(setup.familyId);
    const aggregateBody = await aggregateRes.json() as { currentOnboarding: { onboarding_id: string } | null };
    expect(aggregateRes.status).toBe(200);
    expect(aggregateBody.currentOnboarding?.onboarding_id).toBe(onboardingBody.onboarding.onboarding_id);
  });

  async function postFamily(body: Record<string, unknown>, correlationId: string): Promise<Response> {
    return fetch(`${baseUrl}/families`, {
      method: 'POST',
      headers: requestHeaders(correlationId, String(body.idempotency_key ?? 'missing')),
      body: JSON.stringify(body),
    });
  }

  async function getFamilyAggregate(familyId: string): Promise<Response> {
    return fetch(`${baseUrl}/families/${familyId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
        'x-actor-id': 'architect-1',
      },
    });
  }

  async function seedM2ReadyFamily(correlationId: string): Promise<{ familyId: string; parentId: string; childId: string }> {
    const familyResponse = await postFamily({ display_name: '启动联调家庭', idempotency_key: `seed-family-${correlationId}` }, correlationId);
    const familyBody = await familyResponse.json() as { family: { family_id: string } };
    expect(familyResponse.status).toBe(201);

    const parentBody = await postJson<{ parent: { person_id: string } }>(`/families/${familyBody.family.family_id}/parents`, {
      role: 'GUARDIAN',
      display_name: '监护人',
      account_id: 'architect-1',
      idempotency_key: `seed-parent-${correlationId}`,
    }, correlationId);

    const childBody = await postJson<{ child: { person_id: string } }>(`/families/${familyBody.family.family_id}/children`, {
      display_name: '孩子',
      birth_date: '2012-06-01',
      idempotency_key: `seed-child-${correlationId}`,
    }, correlationId);

    await postJson(`/families/${familyBody.family.family_id}/relationships`, {
      person_a_id: parentBody.parent.person_id,
      person_b_id: childBody.child.person_id,
      relationship_type: 'GUARDIAN_CHILD',
      idempotency_key: `seed-relationship-${correlationId}`,
    }, correlationId);

    await postJson(`/families/${familyBody.family.family_id}/life-stages`, {
      child_id: childBody.child.person_id,
      life_stage_code: 'EARLY_ADOLESCENCE_12_15',
      effective_from: '2026-08-10T00:00:00.000Z',
      idempotency_key: `seed-life-stage-${correlationId}`,
    }, correlationId);

    for (const purpose of ['SERVICE', 'ASSESSMENT', 'GROWTH_TRACKING'] as const) {
      await postJson(`/families/${familyBody.family.family_id}/consents`, {
        subjectPersonId: childBody.child.person_id,
        guardianPersonId: parentBody.parent.person_id,
        purpose,
        policyVersion: 'startup-e2e-v1',
      }, correlationId, `seed-consent-${purpose}-${correlationId}`);
    }

    return {
      familyId: familyBody.family.family_id,
      parentId: parentBody.parent.person_id,
      childId: childBody.child.person_id,
    };
  }

  async function seedM2Onboarding(correlationId: string): Promise<{ familyId: string; parentId: string; childId: string; onboardingId: string }> {
    const ready = await seedM2ReadyFamily(correlationId);
    const onboardingResponse = await fetch(`${baseUrl}/families/${ready.familyId}/growth/onboarding`, {
      method: 'POST',
      headers: requestHeaders(correlationId, `seed-onboarding-${correlationId}`),
      body: JSON.stringify({
        childId: ready.childId,
        guardianPersonId: ready.parentId,
        safetyScreeningResult: 'LOW',
      }),
    });
    const onboardingBody = await onboardingResponse.json() as { onboarding: { onboarding_id: string } };
    expect(onboardingResponse.status).toBe(201);
    return {
      ...ready,
      onboardingId: onboardingBody.onboarding.onboarding_id,
    };
  }

  async function postJson<T>(path: string, body: Record<string, unknown>, correlationId: string, idempotencyKey?: string): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: requestHeaders(correlationId, idempotencyKey),
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(201);
    return await response.json() as T;
  }

  function requestHeaders(correlationId: string, idempotencyKey?: string): Record<string, string> {
    return {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
      'x-actor-id': 'architect-1',
      'x-correlation-id': correlationId,
      'x-source': 'vitest-e2e',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    };
  }
});

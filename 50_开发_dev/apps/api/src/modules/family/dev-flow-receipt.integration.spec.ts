import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { cleanFamilyCoreTables, createTestPool } from '../../test/test-database';

let app: INestApplication;
let pool: pg.Pool;
let baseUrl: string;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  pool = createTestPool();
  await pool.query('select 1');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  baseUrl = await app.getUrl();
});

afterAll(async () => {
  await app?.close();
  await pool?.end();
});

beforeEach(async () => {
  await cleanFamilyCoreTables(pool);
});

async function seedGuardian(name = 'DEV Flow Guardian') {
  const family = await pool.query(`insert into families(display_name) values ('DEV Flow Family') returning family_id`);
  const familyId = family.rows[0].family_id as string;
  const guardian = await pool.query(
    `insert into persons(family_id, person_type, parent_role, display_name)
     values ($1,'PARENT','GUARDIAN',$2) returning person_id`,
    [familyId, name],
  );
  const actorId = guardian.rows[0].person_id as string;
  await pool.query(
    `insert into family_memberships(family_id, person_id, role, status, joined_at)
     values ($1,$2,'OWNER_GUARDIAN','ACTIVE',now())`,
    [familyId, actorId],
  );
  return { familyId, actorId };
}

function headers(actorId: string, correlationId: string, idempotencyKey?: string): Record<string, string> {
  return {
    authorization: 'Bearer test-token',
    'x-actor-id': actorId,
    'x-correlation-id': correlationId,
    'content-type': 'application/json',
    ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
  };
}

describe('DEV flow receipt integration', () => {
  it('persists a six-loop UI receipt, replays idempotently, and never creates an external effect', async () => {
    const seed = await seedGuardian();
    const payload = { ui_id: 'UI-21', command: 'PREVIEW_SYNTHETIC_BOOKING' };
    const first = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-dev-flow-1', 'idem-dev-flow-1'), body: JSON.stringify(payload),
    });
    expect(first.status).toBe(201);
    const firstBody = await first.json() as Record<string, unknown>;
    expect(firstBody).toMatchObject({
      family_id: seed.familyId, ui_id: 'UI-21', business_loop: 'TEACHER_SALON_LOOP',
      event_state: 'DEV_CONFIRMED', data_source: 'SYNTHETIC_DEV_ONLY',
      external_effect: false, model_gateway_status: 'NOOP_NOT_INVOKED', replayed: false,
    });

    const replay = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-dev-flow-1', 'idem-dev-flow-1'), body: JSON.stringify(payload),
    });
    expect(replay.status).toBe(201);
    expect(await replay.json()).toMatchObject({ event_id: firstBody.event_id, replayed: true, external_effect: false });

    const projection = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, { headers: headers(seed.actorId, 'corr-dev-flow-list') });
    expect(projection.status).toBe(200);
    expect(await projection.json()).toMatchObject({ family_id: seed.familyId, events: [expect.objectContaining({ event_id: firstBody.event_id })] });

    const platformProjection = await fetch(`${baseUrl}/families/${seed.familyId}/dev/platform-surfaces`, { headers: headers(seed.actorId, 'corr-dev-flow-platform-read') });
    expect(platformProjection.status).toBe(200);
    expect(await platformProjection.json()).toMatchObject({
      recent_flow_events: [expect.objectContaining({ event_id: firstBody.event_id, ui_id: 'UI-21', business_loop: 'TEACHER_SALON_LOOP' })],
    });

    const stored = await pool.query(`select external_effect, model_gateway_status, payload from family_dev_flow_events where event_id=$1`, [firstBody.event_id]);
    expect(stored.rows[0]).toMatchObject({ external_effect: false, model_gateway_status: 'NOOP_NOT_INVOKED' });
    expect(stored.rows[0].payload).toMatchObject({ synthetic_only: true, state_boundary: 'NOOP_ADAPTER' });
  });

  it('returns growth-loop receipts only in the Core Growth projection', async () => {
    const seed = await seedGuardian();
    const receipt = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-dev-flow-growth'), body: JSON.stringify({ ui_id: 'UI-05', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT' }),
    });
    expect(receipt.status).toBe(201);
    const body = await receipt.json() as Record<string, unknown>;
    const coreProjection = await fetch(`${baseUrl}/families/${seed.familyId}/dev/core-growth`, { headers: headers(seed.actorId, 'corr-dev-flow-core-read') });
    expect(coreProjection.status).toBe(200);
    expect(await coreProjection.json()).toMatchObject({
      recent_flow_events: [expect.objectContaining({ event_id: body.event_id, ui_id: 'UI-05', business_loop: 'GROWTH_LOOP' })],
    });
  });

  it('persists a bounded UI-02 assessment focus as a synthetic Perspective and returns it in Core Growth readback', async () => {
    const seed = await seedGuardian();
    const receipt = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui02-focus'),
      body: JSON.stringify({ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION' }),
    });
    expect(receipt.status).toBe(201);
    expect(await receipt.json()).toMatchObject({ ui_id: 'UI-02', selection: 'EMOTION_REGULATION', external_effect: false, model_gateway_status: 'NOOP_NOT_INVOKED' });
    const coreProjection = await fetch(`${baseUrl}/families/${seed.familyId}/dev/core-growth`, { headers: headers(seed.actorId, 'corr-ui02-focus-read') });
    expect(coreProjection.status).toBe(200);
    expect(await coreProjection.json()).toMatchObject({
      recent_flow_events: [expect.objectContaining({ ui_id: 'UI-02', selection: 'EMOTION_REGULATION', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION' })],
    });
    const stored = await pool.query(`select payload from family_dev_flow_events where family_id=$1`, [seed.familyId]);
    expect(stored.rows[0].payload).toMatchObject({ selection: 'EMOTION_REGULATION', synthetic_only: true, evidence_boundary: 'PERSPECTIVE' });
  });

  it('fails closed for an unknown UI and cross-family actor', async () => {
    const owner = await seedGuardian('Owner');
    const other = await seedGuardian('Other');
    const unknown = await fetch(`${baseUrl}/families/${owner.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(owner.actorId, 'corr-dev-flow-unknown'), body: JSON.stringify({ ui_id: 'UI-99', command: 'UNKNOWN' }),
    });
    expect(unknown.status).toBe(400);

    const crossFamily = await fetch(`${baseUrl}/families/${owner.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(other.actorId, 'corr-dev-flow-cross'), body: JSON.stringify({ ui_id: 'UI-25', command: 'READ_SYNTHETIC_COMMUNITY_FEED' }),
    });
    expect(crossFamily.status).toBe(403);
    expect(Number((await pool.query('select count(*)::int as count from family_dev_flow_events')).rows[0].count)).toBe(0);
  });
});

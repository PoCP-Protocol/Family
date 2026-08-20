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

  it('accepts a bounded UI-35 Day-numbered parent action, persists no external effect, and rejects unsafe selection syntax', async () => {
    const seed = await seedGuardian();
    const receipt = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui35-day-1', 'idem-ui35-day-1'),
      body: JSON.stringify({ ui_id: 'UI-35', command: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', selection: 'DAY_1_PARENT_ACTION' }),
    });
    expect(receipt.status).toBe(201);
    expect(await receipt.json()).toMatchObject({
      ui_id: 'UI-35', selection: 'DAY_1_PARENT_ACTION', external_effect: false,
      model_gateway_status: 'NOOP_NOT_INVOKED', replayed: false,
    });

    const replay = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui35-day-1', 'idem-ui35-day-1'),
      body: JSON.stringify({ ui_id: 'UI-35', command: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', selection: 'DAY_1_PARENT_ACTION' }),
    });
    expect(replay.status).toBe(201);
    expect(await replay.json()).toMatchObject({ replayed: true, external_effect: false });

    const invalid = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui35-invalid'),
      body: JSON.stringify({ ui_id: 'UI-35', command: 'CHECKIN_SYNTHETIC_21_DAY_CAMP_TASK', selection: 'day 1' }),
    });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ message: 'invalid_dev_flow_selection' });
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

  it('reads the selected focus into the UI-04 report and UI-05 plan preview after a persisted report-to-plan handoff', async () => {
    const seed = await seedGuardian();
    const selected = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui04-focus'),
      body: JSON.stringify({ ui_id: 'UI-02', command: 'SELECT_SYNTHETIC_ASSESSMENT_DIMENSION', selection: 'EMOTION_REGULATION' }),
    });
    expect(selected.status).toBe(201);
    const explanation = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui04-explanation'),
      body: JSON.stringify({ ui_id: 'UI-03', command: 'PREVIEW_SYNTHETIC_REPORT_EXPLANATION', selection: 'EMOTION_REGULATION' }),
    });
    expect(explanation.status).toBe(201);

    const beforeHandoff = await fetch(`${baseUrl}/families/${seed.familyId}/dev/core-growth`, { headers: headers(seed.actorId, 'corr-ui04-read') });
    expect(beforeHandoff.status).toBe(200);
    const beforeProjection = await beforeHandoff.json() as any;
    expect(beforeProjection.cards.find((card: any) => card.surface === 'UI-04')?.report_draft).toMatchObject({
      focus: 'EMOTION_REGULATION', state: 'READY', plan_link_state: 'READY_TO_VIEW',
    });
    expect(beforeProjection.cards.find((card: any) => card.surface === 'UI-05')?.plan_preview).toMatchObject({
      focus: 'EMOTION_REGULATION', state: 'READY', stages: expect.arrayContaining([expect.objectContaining({ stage_id: 'SEE' })]),
    });

    const handoff = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui04-plan', 'idem-ui04-plan'),
      body: JSON.stringify({ ui_id: 'UI-04', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', selection: 'EMOTION_REGULATION' }),
    });
    expect(handoff.status).toBe(201);
    const afterHandoff = await fetch(`${baseUrl}/families/${seed.familyId}/dev/core-growth`, { headers: headers(seed.actorId, 'corr-ui04-plan-read') });
    const afterProjection = await afterHandoff.json() as any;
    expect(afterProjection.cards.find((card: any) => card.surface === 'UI-04')?.report_draft).toMatchObject({ state: 'PLAN_PREVIEWED', plan_link_state: 'VIEWED' });
    expect(afterProjection.cards.find((card: any) => card.surface === 'UI-05')?.plan_preview).toMatchObject({ state: 'VIEWED_FROM_REPORT', weekly_action_handoff: { state: 'READY_TO_OPEN', target_route: 'growth-daily-task' } });
    expect(afterProjection.recent_flow_events).toEqual(expect.arrayContaining([expect.objectContaining({ ui_id: 'UI-04', command: 'PREVIEW_SYNTHETIC_90_DAY_PLAN_DRAFT', external_effect: false })]));

    const openAction = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui05-action', 'idem-ui05-action'),
      body: JSON.stringify({ ui_id: 'UI-05', command: 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', selection: 'EMOTION_REGULATION' }),
    });
    expect(openAction.status).toBe(201);
    const actionReadback = await fetch(`${baseUrl}/families/${seed.familyId}/dev/core-growth`, { headers: headers(seed.actorId, 'corr-ui05-action-read') });
    const actionProjection = await actionReadback.json() as any;
    expect(actionProjection.cards.find((card: any) => card.surface === 'UI-05')?.plan_preview?.weekly_action_handoff).toMatchObject({
      state: 'OPENED', target_route: 'growth-daily-task', action: expect.any(String), fallback: expect.any(String),
    });
    expect(actionProjection.recent_flow_events).toEqual(expect.arrayContaining([expect.objectContaining({ ui_id: 'UI-05', command: 'OPEN_SYNTHETIC_WEEKLY_GROWTH_ACTION', external_effect: false })]));

    const openReview = await fetch(`${baseUrl}/families/${seed.familyId}/dev/flow-events`, {
      method: 'POST', headers: headers(seed.actorId, 'corr-ui09-review', 'idem-ui09-review'),
      body: JSON.stringify({ ui_id: 'UI-09', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', selection: 'EMOTION_REGULATION' }),
    });
    expect(openReview.status).toBe(201);
    const reviewReadback = await fetch(`${baseUrl}/families/${seed.familyId}/dev/core-growth`, { headers: headers(seed.actorId, 'corr-ui08-review-read') });
    const reviewProjection = await reviewReadback.json() as any;
    expect(reviewProjection.cards.find((card: any) => card.surface === 'UI-08')?.action_review).toMatchObject({
      state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', plan_route: 'core-plan', fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME',
    });
    expect(reviewProjection.cards.find((card: any) => card.surface === 'UI-06')?.companion_progress).toMatchObject({
      state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', review_route: 'growth-report', action_route: 'growth-daily-task', fact_boundary: 'ACTION_RECORDED_NOT_OUTCOME',
    });
    expect(reviewProjection.cards.find((card: any) => card.surface === 'UI-10')?.child_action_prompt).toMatchObject({
      state: 'ACTION_RECORDED', focus: 'EMOTION_REGULATION', action_route: 'growth-daily-task', fact_boundary: 'ACTION_RECORDED_NOT_CHILD_OUTCOME',
    });
    expect(reviewProjection.cards.find((card: any) => card.surface === 'UI-07')?.growth_profile_progress).toMatchObject({
      state: 'FOCUS_SELECTED', focus: 'EMOTION_REGULATION', plan_route: 'core-plan', review_route: 'growth-report', fact_boundary: 'FOCUS_SELECTED_NOT_OUTCOME',
    });
    expect(reviewProjection.recent_flow_events).toEqual(expect.arrayContaining([expect.objectContaining({ ui_id: 'UI-09', command: 'OPEN_SYNTHETIC_FAMILY_ACTION_REVIEW', external_effect: false })]));
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

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { createTestPool } from '../../test/test-database';
import { FAMILY_PLATFORM_FIXTURE, seedFamilyPlatformFixture } from '../../test-fixtures/family-platform.integration.fixture';

describe('Family platform Dev fixture integration', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = createTestPool();
    await seedFamilyPlatformFixture(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('keeps the complete family-to-growth-action lineage in one family scope', async () => {
    const result = await pool.query(
      `select f.family_id,
              count(distinct p.person_id)::int as people,
              count(distinct gp.profile_id)::int as profiles,
              count(distinct ga.action_id)::int as actions
         from families f
         join persons p on p.family_id = f.family_id
         join growth_profiles gp on gp.family_id = f.family_id
         join growth_actions ga on ga.family_id = f.family_id
        where f.family_id = $1
        group by f.family_id`,
      [FAMILY_PLATFORM_FIXTURE.familyId],
    );
    expect(result.rows[0]).toMatchObject({ family_id: FAMILY_PLATFORM_FIXTURE.familyId, people: 2, profiles: 1, actions: 1 });
  });

  it('provides the canonical onboarding and provenance required by the UI-09 check-in subject resolver', async () => {
    const result = await pool.query(
      `select gj.journey_type,
              gj.phase,
              gj.status as journey_status,
              ge.payload->>'child_id' as event_child_id,
              ge.payload->>'guardian_person_id' as event_guardian_id,
              p.subject_person_id as perspective_child_id,
              p.author_person_id as perspective_guardian_id,
              p.perspective_type,
              gp.subject_person_id as profile_guardian_id,
              er.evidence_id::text as evidence_id
         from growth_journeys gj
         join growth_events ge on ge.family_id = gj.family_id
           and ge.event_type = 'GrowthOnboardingStarted'
           and ge.payload->>'onboarding_id' = gj.journey_id::text
         join perspectives p on p.family_id = gj.family_id and p.onboarding_id = gj.journey_id
         join evidence_records er on er.perspective_id = p.perspective_id
         join growth_profiles gp on gp.family_id = gj.family_id
        where gj.family_id = $1 and gj.journey_id = $2`,
      [FAMILY_PLATFORM_FIXTURE.familyId, FAMILY_PLATFORM_FIXTURE.journeyId],
    );
    expect(result.rows).toEqual([expect.objectContaining({
      journey_type: 'PARENT_CHILD_COMMUNICATION_CONFLICT',
      phase: 'ONBOARDING',
      journey_status: 'ACTIVE',
      event_child_id: FAMILY_PLATFORM_FIXTURE.childId,
      event_guardian_id: FAMILY_PLATFORM_FIXTURE.guardianId,
      perspective_child_id: FAMILY_PLATFORM_FIXTURE.childId,
      perspective_guardian_id: FAMILY_PLATFORM_FIXTURE.guardianId,
      perspective_type: 'CHILD_PERSPECTIVE',
      profile_guardian_id: FAMILY_PLATFORM_FIXTURE.guardianId,
      evidence_id: FAMILY_PLATFORM_FIXTURE.evidenceId,
    })]);
  });

  it('exposes service booking and process record as a read projection with no external effect', async () => {
    const result = await pool.query(
      `select family_id, booking_ref, booking_status, service_record_status, external_effect
         from family_customer_service_booking_projection_v
        where family_id = $1`,
      [FAMILY_PLATFORM_FIXTURE.familyId],
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      family_id: FAMILY_PLATFORM_FIXTURE.familyId,
      booking_ref: 'TEST_BOOKING_001',
      booking_status: 'REQUESTED',
      service_record_status: 'PENDING',
      external_effect: false,
    });
  });

  it('provides an admitted UI-13/UI-14 course-camp product for authenticated Dev catalog and no-payment intent testing', async () => {
    const result = await pool.query(
      `select product_id, product_ref, version_no, admission_status, fixture_only, status, attributes
         from family_product_offerings
        where tenant_id = $1 and product_id = $2`,
      [FAMILY_PLATFORM_FIXTURE.tenantId, FAMILY_PLATFORM_FIXTURE.productId],
    );
    expect(result.rows).toEqual([expect.objectContaining({
      product_id: FAMILY_PLATFORM_FIXTURE.productId,
      product_ref: 'PRODUCT_PARENT_CHILD_CAMP',
      version_no: 1,
      admission_status: 'ADMITTED',
      fixture_only: true,
      status: 'ACTIVE',
      attributes: expect.objectContaining({ delivery_mode: 'SANDBOX_NOOP' }),
    })]);
  });

  it('is repeatable after a check-in audit and remains family-private after reseeding', async () => {
    await pool.query(
      `insert into audit_logs(family_id, actor_type, actor_id, action_name, resource_type, resource_id, correlation_id, idempotency_key, result, metadata)
       values ($1, 'USER', $2, 'CompleteGrowthAction', 'GrowthAction', $3, 'fixture-repeatability-checkin', 'fixture-repeatability-checkin', 'SUCCESS', '{"source":"TEST_FIXTURE"}'::jsonb)`,
      [FAMILY_PLATFORM_FIXTURE.familyId, FAMILY_PLATFORM_FIXTURE.guardianId, FAMILY_PLATFORM_FIXTURE.actionId],
    );
    await seedFamilyPlatformFixture(pool);
    const result = await pool.query(
      `select count(*)::int as count
         from family_booking_requests
        where family_id = $1 and tenant_id = $2`,
      [FAMILY_PLATFORM_FIXTURE.familyId, FAMILY_PLATFORM_FIXTURE.tenantId],
    );
    expect(result.rows[0].count).toBe(1);
    const action = await pool.query(
      `select status, completion_status from growth_actions where action_id = $1`,
      [FAMILY_PLATFORM_FIXTURE.actionId],
    );
    const audit = await pool.query(
      `select count(*)::int as count from audit_logs where family_id = $1 and action_name = 'CompleteGrowthAction'`,
      [FAMILY_PLATFORM_FIXTURE.familyId],
    );
    expect(action.rows[0]).toMatchObject({ status: 'PENDING', completion_status: null });
    expect(audit.rows[0].count).toBe(0);
  });
});

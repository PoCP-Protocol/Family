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

  it('is repeatable and remains family-private after reseeding', async () => {
    await seedFamilyPlatformFixture(pool);
    const result = await pool.query(
      `select count(*)::int as count
         from family_booking_requests
        where family_id = $1 and tenant_id = $2`,
      [FAMILY_PLATFORM_FIXTURE.familyId, FAMILY_PLATFORM_FIXTURE.tenantId],
    );
    expect(result.rows[0].count).toBe(1);
  });
});

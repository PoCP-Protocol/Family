import pg from 'pg';

const { Pool } = pg;

export function getTestDatabaseUrl(): string {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for integration/e2e tests; required DB tests must not silently skip');
  }
  return databaseUrl;
}

export function createTestPool(): pg.Pool {
  return new Pool({ connectionString: getTestDatabaseUrl() });
}

export async function cleanFamilyCoreTables(pool: pg.Pool): Promise<void> {
  await pool.query('delete from perspectives');
  await pool.query('delete from evidence_records');
  await pool.query('delete from milestones');
  await pool.query('delete from outcomes');
  await pool.query('delete from growth_events');
  await pool.query('delete from growth_actions');
  await pool.query('delete from growth_journeys');
  await pool.query('delete from interventions');
  await pool.query('delete from growth_priorities');
  await pool.query('delete from growth_profile_dimensions');
  await pool.query('delete from growth_profiles');
  await pool.query('delete from outbox_events');
  await pool.query('delete from audit_logs');
  await pool.query('delete from idempotency_keys');
  await pool.query('delete from consents');
  await pool.query('delete from life_stage_assignments');
  await pool.query('delete from family_relationships');
  await pool.query('delete from persons');
  await pool.query('delete from families');
}
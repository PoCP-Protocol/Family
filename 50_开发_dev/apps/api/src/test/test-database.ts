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
  // Principal 域(M3-101A-B)以 FK 引用 families —— 先清 principal_*/product_events,
  // 否则末尾 `delete from families` 会被 principal_sessions_family_id_fkey 挡住。
  // 用 to_regclass 守卫:未迁移 0011 的库(仅 Family core)不会因缺表报错。
  await cleanPrincipalTablesIfPresent(pool);
  await pool.query('delete from growth_profile_drafts');
  await pool.query('delete from evidence_records');
  await pool.query('delete from perspectives');
  await pool.query('delete from milestones');
  await pool.query('delete from outcomes');
  await pool.query('delete from next_step_decisions');
  await pool.query('delete from growth_reviews');
  await pool.query('delete from outcome_observations');
  await pool.query('delete from growth_actions');
  await pool.query('delete from intervention_episodes');
  await pool.query('delete from growth_priorities');
  await pool.query('delete from growth_events');
  await pool.query('delete from growth_journeys');
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

/** 清 Principal 域表(FK 安全序);若库未迁移 0011 则逐表跳过,便于 Family-core-only 测试库复用。 */
export async function cleanPrincipalTablesIfPresent(pool: pg.Pool): Promise<void> {
  const tables = [
    'principal_action_proposals', 'principal_feedback', 'principal_model_runs',
    'principal_human_handoffs', 'principal_messages', 'principal_responses',
    'principal_sessions', 'product_events',
  ];
  for (const t of tables) {
    const exists = await pool.query('select to_regclass($1) as reg', [t]);
    if (exists.rows[0].reg) await pool.query(`delete from ${t}`);
  }
}

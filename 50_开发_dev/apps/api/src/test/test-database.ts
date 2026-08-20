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
  await pool.query("do $$ begin if to_regclass('public.family_dev_flow_events') is not null then delete from family_dev_flow_events; end if; end $$;");
  await cleanOrchestrationTablesIfPresent(pool); // VERTICAL-SLICE-001:编排表 FK 引用 families/persons,须先清
  await pool.query('delete from growth_profile_drafts');
  await pool.query('delete from evidence_records');
  await pool.query('delete from perspectives');
  await pool.query('delete from milestones');
  await pool.query('delete from outcomes');
  await pool.query('delete from next_step_decisions');
  await pool.query('delete from growth_reviews');
  await pool.query('delete from outcome_observations');
  // 90 天 Journey Plan（迁移 0035/0036）引用 growth_priorities/growth_journeys，行动又引用计划；按 children-first 顺序清理以兼容旧测试库。
  await pool.query('delete from growth_actions');
  await pool.query("do $$ begin if to_regclass('public.family_journey_plan_phases') is not null then delete from family_journey_plan_phases; end if; end $$;");
  await pool.query("do $$ begin if to_regclass('public.family_journey_plans') is not null then delete from family_journey_plans; end if; end $$;");
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
  // TENANCY-V2 T1:新表以 FK 引用 persons/families,须先清(to_regclass 守卫,兼容未迁移 0018 的库)。
  await pool.query("do $$ begin if to_regclass('public.family_memberships') is not null then delete from family_memberships; end if; end $$;");
  await pool.query("do $$ begin if to_regclass('public.account_person_bindings') is not null then delete from account_person_bindings; end if; end $$;");
  // 释放 families→persons 的 primary_contact FK,否则删 persons 被挡(fk_family_primary_contact)。
  await pool.query('update families set primary_contact_person_id = null where primary_contact_person_id is not null');
  await pool.query('delete from persons');
  await pool.query('delete from families');
  await pool.query("do $$ begin if to_regclass('public.accounts') is not null then delete from accounts; end if; end $$;");
}

/**
 * M3-INT-001:seed 一个带 AI_PERSONALIZATION GRANTED consent 的真实 subject(person uuid)。
 * 供 live/negative 测试用真实 consent 触发/验证外呼门。返回 { familyId, subjectRef=childPersonId, guardianRef }。
 */
export async function seedAiConsentSubject(
  pool: pg.Pool,
  opts: { purpose?: 'AI_PERSONALIZATION'; status?: 'GRANTED' | 'WITHDRAWN' | 'EXPIRED' } = {},
): Promise<{ familyId: string; subjectRef: string; guardianRef: string }> {
  const fam = await pool.query(`insert into families(display_name) values ('AI consent fam') returning family_id`);
  const familyId = fam.rows[0].family_id;
  const g = await pool.query(`insert into persons(family_id, person_type, parent_role, display_name) values ($1,'PARENT','GUARDIAN','监护人') returning person_id`, [familyId]);
  const c = await pool.query(`insert into persons(family_id, person_type, display_name, birth_date) values ($1,'CHILD','孩子','2013-05-01') returning person_id`, [familyId]);
  const status = opts.status ?? 'GRANTED';
  await pool.query(
    `insert into consents(family_id, subject_person_id, guardian_person_id, purpose, status, policy_version, granted_at${status === 'WITHDRAWN' ? ', withdrawn_at' : ''})
       values ($1,$2,$3,'AI_PERSONALIZATION',$4,'policy-ai-v1', now()${status === 'WITHDRAWN' ? ', now()' : ''})`,
    [familyId, c.rows[0].person_id, g.rows[0].person_id, status],
  );
  return { familyId, subjectRef: c.rows[0].person_id, guardianRef: g.rows[0].person_id };
}

/** 清编排域表(FAMILY-GROWTH-VERTICAL-SLICE-001;children-first FK 序);to_regclass 守卫兼容未迁移 0020 的库。 */
export async function cleanOrchestrationTablesIfPresent(pool: pg.Pool): Promise<void> {
  const tables = [
    // Event and membership/booking/commerce facts must clear before Tenant/Family bases; supply masters remain fixture-only.
    'family_membership_benefit_ledger', 'family_membership_benefit_grants', 'family_membership_subscriptions',
    'family_membership_benefit_definitions', 'family_membership_plans',
    'family_product_events',
    'family_booking_service_records', 'family_booking_requests', 'family_service_availability_slots', 'family_service_offerings', 'family_service_providers',
    'family_entitlements', 'family_order_intent_lines', 'family_order_intents', 'family_product_offerings',
    'family_service_records', 'family_page_task_items', 'family_support_report_snapshots', 'family_profile_snapshots',
    'test_experience_operations',
    'family_llm_gateway_audits',
    'multimodal_audit_events', 'multimodal_derived_artifacts', 'multimodal_processing_runs', 'multimodal_assets', 'multimodal_consents',
    'multimodal_output_schemas', 'multimodal_processing_policies', 'multimodal_capability_profiles',
    'tenant_catalog_bindings', 'tenant_policy_profiles', 'tenant_family_bindings', 'tenant_account_memberships', 'tenants',
    'service_followup_responses', 'service_contributions', 'service_cases',
    'orchestration_plans', 'family_service_decisions', 'resource_recommendations',
    'eligibility_evaluations', 'growth_intents', 'growth_need_signals', 'growth_need_inputs',
  ];
  for (const t of tables) {
    const exists = await pool.query('select to_regclass($1) as reg', [t]);
    if (exists.rows[0].reg) await pool.query(`delete from ${t}`);
  }
}

/** 清 Principal 域表(FK 安全序);若库未迁移 0011 则逐表跳过,便于 Family-core-only 测试库复用。 */
export async function cleanPrincipalTablesIfPresent(pool: pg.Pool): Promise<void> {
  const tables = [
    'otp_challenges',    // IAM-102:无 FK,清以免跨用例污染限流/验证
    'identity_sessions', // IAM-101:FK 引用 persons/families,须先于其清理
    'principal_action_proposals', 'principal_feedback', 'principal_model_attempts', 'principal_model_runs',
    'principal_human_handoffs', 'principal_messages', 'principal_responses',
    'principal_sessions', 'product_events',
  ];
  for (const t of tables) {
    const exists = await pool.query('select to_regclass($1) as reg', [t]);
    if (exists.rows[0].reg) await pool.query(`delete from ${t}`);
  }
}

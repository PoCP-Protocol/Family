#!/usr/bin/env node
/**
 * TASK-002R AI-02:真实 PostgreSQL 迁移后验证。
 * 前置:已 `node tools/migrate.mjs up`。本脚本做:结构核验 + 合法插入 + 非法用例(必须失败)+ 回滚清理。
 * 用法:DATABASE_URL=... node tools/db-validate.mjs
 * 退出码:0 全通过;1 有失败。绝不因实现困难放宽约束。
 */
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL 未设置'); process.exit(1); }

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' :: ' + detail : ''}`); };

/** 期望某段 SQL 因约束而失败 */
async function expectFail(client, name, fn) {
  await client.query('SAVEPOINT sp');
  try {
    await fn();
    await client.query('ROLLBACK TO sp');
    ok(name, false, '本应被约束拒绝,却成功了');
  } catch (e) {
    await client.query('ROLLBACK TO sp');
    ok(name, true, '按预期被拒:' + e.message.split('\n')[0].slice(0, 80));
  }
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  // 1) 迁移登记
  const mig = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
  ok('migrations_applied', mig.rows.length >= 3, mig.rows.map((r) => r.filename).join(', '));

  // 2) 关键表存在
  const tbls = (await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
  )).rows.map((r) => r.table_name);
  for (const t of ['families','persons','family_relationships','life_stage_assignments','consents',
    'audit_logs','outbox_events','idempotency_keys','growth_profiles','growth_journeys',
    'growth_actions','growth_events','milestones','outcomes']) {
    ok('table:' + t, tbls.includes(t));
  }

  // 3) 枚举存在
  const enums = (await client.query(`SELECT typname FROM pg_type WHERE typtype='e'`)).rows.map((r) => r.typname);
  for (const e of ['family_status','person_type','parent_role','relationship_type','life_stage_code',
    'consent_purpose','consent_status','growth_domain','growth_state']) {
    ok('enum:' + e, enums.includes(e));
  }

  // 4) 合法插入 + 非法用例(单事务,末尾 ROLLBACK 清理)
  await client.query('BEGIN');
  await client.query('SET CONSTRAINTS ALL DEFERRED');
  const fam = (await client.query(
    `INSERT INTO families(display_name) VALUES ('测试家庭') RETURNING family_id`)).rows[0].family_id;
  const mom = (await client.query(
    `INSERT INTO persons(family_id,person_type,parent_role,display_name) VALUES ($1,'PARENT','MOTHER','妈妈') RETURNING person_id`, [fam])).rows[0].person_id;
  const child = (await client.query(
    `INSERT INTO persons(family_id,person_type,display_name,birth_date) VALUES ($1,'CHILD','孩子','2012-05-01') RETURNING person_id`, [fam])).rows[0].person_id;
  await client.query(`UPDATE families SET primary_contact_person_id=$1 WHERE family_id=$2`, [mom, fam]);
  await client.query(
    `INSERT INTO family_relationships(family_id,person_a_id,person_b_id,relationship_type) VALUES ($1,$2,$3,'PARENT_CHILD')`, [fam, mom, child]);
  await client.query(
    `INSERT INTO life_stage_assignments(family_id,child_id,life_stage_code,effective_from) VALUES ($1,$2,'EARLY_ADOLESCENCE_12_15',now())`, [fam, child]);
  await client.query(
    `INSERT INTO consents(family_id,subject_person_id,guardian_person_id,purpose,status,policy_version,granted_at) VALUES ($1,$2,$3,'SERVICE','GRANTED','v1',now())`, [fam, child, mom]);
  ok('happy_path_insert', true, 'Family→Parent→Child→Relationship→LifeStage→Consent 全部接受');

  // 非法用例:必须被拒
  await expectFail(client, 'reject_self_relationship', () =>
    client.query(`INSERT INTO family_relationships(family_id,person_a_id,person_b_id,relationship_type) VALUES ($1,$2,$2,'SIBLING')`, [fam, mom]));
  await expectFail(client, 'reject_child_with_parent_role', () =>
    client.query(`INSERT INTO persons(family_id,person_type,parent_role,display_name) VALUES ($1,'CHILD','MOTHER','非法孩子')`, [fam]));
  await expectFail(client, 'reject_second_active_life_stage', () =>
    client.query(`INSERT INTO life_stage_assignments(family_id,child_id,life_stage_code,effective_from) VALUES ($1,$2,'EARLY_ADOLESCENCE_12_15',now())`, [fam, child]));
  await expectFail(client, 'reject_invalid_outcome_window', () =>
    client.query(`INSERT INTO outcomes(family_id,dimension_id,window_start,window_end,source,confidence) VALUES ($1,'C01',now(),now() - interval '1 day','TEST',0.5)`, [fam]));
  const evId = '11111111-1111-1111-1111-111111111111';
  await client.query(
    `INSERT INTO outbox_events(aggregate_type,aggregate_id,event_name,event_version,event_id,correlation_id,payload,occurred_at) VALUES ('Family',$1,'FamilyCreated',1,$2,'c1','{}'::jsonb,now())`, [fam, evId]);
  await expectFail(client, 'reject_duplicate_outbox_event_id', () =>
    client.query(`INSERT INTO outbox_events(aggregate_type,aggregate_id,event_name,event_version,event_id,correlation_id,payload,occurred_at) VALUES ('Family',$1,'FamilyCreated',1,$2,'c2','{}'::jsonb,now())`, [fam, evId]));

  // 审计/幂等 可写
  await client.query(
    `INSERT INTO audit_logs(actor_type,actor_id,action_name,resource_type,correlation_id,result) VALUES ('SYSTEM','tester','CreateFamily','Family','c1','OK')`);
  ok('audit_writable', true);
  await client.query(
    `INSERT INTO idempotency_keys(idempotency_key,action_name,request_hash) VALUES ('k1','CreateFamily','h1')`);
  ok('idempotency_writable', true);

  // 5) 回滚清理
  await client.query('ROLLBACK');
  const famCount = (await client.query('SELECT count(*)::int AS n FROM families')).rows[0].n;
  ok('rollback_clean', famCount === 0, `回滚后 families 行数=${famCount}`);
} finally {
  await client.end();
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n=== 汇总:${checks.length} 项,失败 ${failed.length} ===`);
process.exit(failed.length ? 1 : 0);

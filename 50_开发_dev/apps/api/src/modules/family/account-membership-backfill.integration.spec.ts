import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';

/**
 * TENANCY-V2 T1 回填验证(FAMILY-PLATFORM-TENANCY-FOUNDATION-001)。
 * 从既有 persons 回填 accounts / account_person_bindings / family_memberships:
 * - 角色正确(primary_contact→OWNER_GUARDIAN,其它 PARENT→GUARDIAN,CHILD→CHILD_SUBJECT)
 * - 一个 account_id 去重成一个 Account;Person 无 account_id → 无 Account/binding(仅有 membership)
 * - 不变量:family_memberships.family_id == persons.family_id
 * - CANONICAL_SEMANTIC_DELTA=0:persons/families 行不被修改
 * 回填 SQL 与 migration 0018 一致且幂等(NOT EXISTS 守卫)。
 */
const BACKFILL_ACCOUNTS = `INSERT INTO accounts (external_ref)
  SELECT DISTINCT p.account_id FROM persons p
  WHERE p.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.external_ref = p.account_id);`;
const BACKFILL_BINDINGS = `INSERT INTO account_person_bindings (account_id, person_id)
  SELECT a.account_id, p.person_id FROM persons p JOIN accounts a ON a.external_ref = p.account_id
  WHERE p.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM account_person_bindings b WHERE b.account_id=a.account_id AND b.person_id=p.person_id);`;
const BACKFILL_MEMBERSHIPS = `INSERT INTO family_memberships (family_id, person_id, role, status, joined_at)
  SELECT p.family_id, p.person_id,
    CASE WHEN p.person_type='CHILD' THEN 'CHILD_SUBJECT'::family_role
         WHEN f.primary_contact_person_id=p.person_id THEN 'OWNER_GUARDIAN'::family_role
         WHEN p.person_type='PARENT' THEN 'GUARDIAN'::family_role
         ELSE 'ADULT_MEMBER'::family_role END,
    'ACTIVE'::family_membership_status, p.created_at
  FROM persons p JOIN families f ON f.family_id=p.family_id
  WHERE NOT EXISTS (SELECT 1 FROM family_memberships m WHERE m.family_id=p.family_id AND m.person_id=p.person_id);`;

describe('TENANCY-V2 T1 Account/Membership backfill (integration)', () => {
  let pool: pg.Pool;
  beforeAll(() => { process.env.DATABASE_URL = getTestDatabaseUrl(); pool = createTestPool(); });
  afterAll(async () => { await pool?.end(); });

  beforeEach(async () => {
    await cleanFamilyCoreTables(pool); // 统一清理(含新表 + 释放 primary_contact FK + accounts)
  });

  async function seed() {
    const fam = (await pool.query(`insert into families(display_name) values ('回填家庭') returning family_id`)).rows[0].family_id;
    const mom = (await pool.query(`insert into persons(family_id,person_type,parent_role,display_name,account_id) values ($1,'PARENT','GUARDIAN','妈妈','phone:139') returning person_id`, [fam])).rows[0].person_id;
    const dad = (await pool.query(`insert into persons(family_id,person_type,parent_role,display_name,account_id) values ($1,'PARENT','GUARDIAN','爸爸','phone:138') returning person_id`, [fam])).rows[0].person_id;
    const kid = (await pool.query(`insert into persons(family_id,person_type,display_name) values ($1,'CHILD','孩子') returning person_id`, [fam])).rows[0].person_id;
    await pool.query(`update families set primary_contact_person_id=$1 where family_id=$2`, [mom, fam]);
    return { fam, mom, dad, kid };
  }

  async function backfill() {
    await pool.query(BACKFILL_ACCOUNTS);
    await pool.query(BACKFILL_BINDINGS);
    await pool.query(BACKFILL_MEMBERSHIPS);
  }

  it('backfills accounts/bindings/memberships with correct roles + zero canonical delta', async () => {
    const { fam, mom, dad, kid } = await seed();
    const personsBefore = await pool.query(`select person_id,family_id,account_id from persons where family_id=$1 order by person_id`, [fam]);

    await backfill();

    // 2 个 account_id → 2 Accounts;孩子无 account → 无 Account
    expect((await pool.query(`select count(*)::int n from accounts`)).rows[0].n).toBe(2);
    // 2 bindings(mom/dad);孩子无 binding
    expect((await pool.query(`select count(*)::int n from account_person_bindings`)).rows[0].n).toBe(2);
    expect((await pool.query(`select count(*)::int n from account_person_bindings b join persons p on p.person_id=b.person_id where p.person_id=$1`, [kid])).rows[0].n).toBe(0);
    // 3 memberships,角色正确
    const roles = Object.fromEntries((await pool.query(`select person_id,role from family_memberships where family_id=$1`, [fam])).rows.map((r) => [r.person_id, r.role]));
    expect(roles[mom]).toBe('OWNER_GUARDIAN');   // primary_contact
    expect(roles[dad]).toBe('GUARDIAN');
    expect(roles[kid]).toBe('CHILD_SUBJECT');
    // 不变量:membership.family_id == persons.family_id
    expect((await pool.query(`select count(*)::int n from family_memberships m join persons p on p.person_id=m.person_id where m.family_id<>p.family_id`)).rows[0].n).toBe(0);
    // CANONICAL_SEMANTIC_DELTA=0:persons 行未变
    const personsAfter = await pool.query(`select person_id,family_id,account_id from persons where family_id=$1 order by person_id`, [fam]);
    expect(personsAfter.rows).toEqual(personsBefore.rows);
  });

  it('backfill is idempotent (二次运行不新增)', async () => {
    await seed();
    await backfill();
    const a1 = (await pool.query(`select count(*)::int n from accounts`)).rows[0].n;
    const b1 = (await pool.query(`select count(*)::int n from account_person_bindings`)).rows[0].n;
    const m1 = (await pool.query(`select count(*)::int n from family_memberships`)).rows[0].n;
    await backfill();
    expect((await pool.query(`select count(*)::int n from accounts`)).rows[0].n).toBe(a1);
    expect((await pool.query(`select count(*)::int n from account_person_bindings`)).rows[0].n).toBe(b1);
    expect((await pool.query(`select count(*)::int n from family_memberships`)).rows[0].n).toBe(m1);
  });

  it('same account_id across two persons → single Account, two bindings (Account≠Person, 一号多人)', async () => {
    const fam = (await pool.query(`insert into families(display_name) values ('共享账号家庭') returning family_id`)).rows[0].family_id;
    await pool.query(`insert into persons(family_id,person_type,parent_role,display_name,account_id) values ($1,'PARENT','GUARDIAN','监护人','phone:100')`, [fam]);
    await pool.query(`insert into persons(family_id,person_type,display_name,account_id) values ($1,'CHILD','孩子A','phone:100')`, [fam]);
    await backfill();
    expect((await pool.query(`select count(*)::int n from accounts where external_ref='phone:100'`)).rows[0].n).toBe(1);
    const bindings = (await pool.query(`select count(*)::int n from account_person_bindings b join accounts a on a.account_id=b.account_id where a.external_ref='phone:100'`)).rows[0].n;
    expect(bindings).toBe(2);
  });
});

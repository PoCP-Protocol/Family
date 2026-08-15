import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { cleanFamilyCoreTables, createTestPool, getTestDatabaseUrl } from '../../test/test-database';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { FamilyScopeGuard } from './family-scope.guard';

/**
 * TENANCY-V2 T2 安全矩阵(FAMILY-PLATFORM-TENANCY-FOUNDATION-001)。
 * 验证 account-scoped session + 多家庭上下文 + FamilyScopeGuard:
 * 合法 ALLOW;跨家庭/撤销/LEFT/过期/伪造 DENY;零家庭 Account 认证成功且 contexts=[]。
 */
const BACKFILL = `
  INSERT INTO accounts (external_ref) SELECT DISTINCT p.account_id FROM persons p
    WHERE p.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.external_ref=p.account_id);
  INSERT INTO account_person_bindings (account_id, person_id)
    SELECT a.account_id, p.person_id FROM persons p JOIN accounts a ON a.external_ref=p.account_id
    WHERE p.account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM account_person_bindings b WHERE b.account_id=a.account_id AND b.person_id=p.person_id);
  INSERT INTO family_memberships (family_id, person_id, role, status, joined_at)
    SELECT p.family_id, p.person_id,
      CASE WHEN p.person_type='CHILD' THEN 'CHILD_SUBJECT'::family_role
           WHEN f.primary_contact_person_id=p.person_id THEN 'OWNER_GUARDIAN'::family_role
           WHEN p.person_type='PARENT' THEN 'GUARDIAN'::family_role ELSE 'ADULT_MEMBER'::family_role END,
      'ACTIVE'::family_membership_status, p.created_at
    FROM persons p JOIN families f ON f.family_id=p.family_id
    WHERE NOT EXISTS (SELECT 1 FROM family_memberships m WHERE m.family_id=p.family_id AND m.person_id=p.person_id);`;

describe('TENANCY-V2 T2 FamilyScopeGuard security matrix (integration)', () => {
  let pool: pg.Pool;
  let repo: AuthRepository;
  let auth: AuthService;
  let guard: FamilyScopeGuard;

  beforeAll(() => {
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = createTestPool();
    repo = new AuthRepository();
    auth = new AuthService(repo);
    guard = new FamilyScopeGuard(auth);
  });
  beforeEach(async () => { await cleanFamilyCoreTables(pool); });
  afterAll(async () => { await pool?.end(); });

  async function family(name: string) {
    return (await pool.query(`insert into families(display_name) values ($1) returning family_id`, [name])).rows[0].family_id;
  }
  async function guardian(fam: string, name: string, ref: string) {
    const id = (await pool.query(`insert into persons(family_id,person_type,parent_role,display_name,account_id) values ($1,'PARENT','GUARDIAN',$2,$3) returning person_id`, [fam, name, ref])).rows[0].person_id;
    await pool.query(`update families set primary_contact_person_id=$1 where family_id=$2`, [id, fam]);
    return id;
  }
  const auth_ = (t: string) => `Bearer ${t}`;

  it('1/4 account with Family A → resolve A ALLOW (role OWNER_GUARDIAN)', async () => {
    const A = await family('甲'); await guardian(A, '妈', 'phone:A');
    await pool.query(BACKFILL);
    const { token } = await auth.issueAccountSession('phone:A');
    const ctx = await guard.resolve(A, auth_(token));
    expect(ctx.familyId).toBe(A);
    expect(ctx.familyRole).toBe('OWNER_GUARDIAN');
  });

  it('2/6 same account requests Family B (not member) → DENY 403', async () => {
    const A = await family('甲'); await guardian(A, '妈', 'phone:A');
    const B = await family('乙'); await guardian(B, '别人', 'phone:B');
    await pool.query(BACKFILL);
    const { token } = await auth.issueAccountSession('phone:A');
    await expect(guard.resolve(B, auth_(token))).rejects.toThrow(/no_active_membership/);
    // 伪造 familyId(随机 UUID)→ DENY
    await expect(guard.resolve('00000000-0000-0000-0000-000000000000', auth_(token))).rejects.toThrow();
  });

  it('3 account with Family A + Family B → contexts show both', async () => {
    const A = await family('甲'); await guardian(A, '妈A', 'phone:multi');
    const B = await family('乙'); await guardian(B, '妈B', 'phone:multi'); // 同一 external_ref → 同一 Account,两个 Person
    await pool.query(BACKFILL);
    const acct = await auth.issueAccountSession('phone:multi');
    const ctxs = await auth.listContexts(acct.account_id);
    expect(ctxs.length).toBe(2);
    expect(new Set(ctxs.map((c) => c.family_id))).toEqual(new Set([A, B]));
    // 两个都能解析
    const { token } = acct as unknown as { token: string; account_id: string };
    expect((await guard.resolve(A, auth_(token))).familyId).toBe(A);
    expect((await guard.resolve(B, auth_(token))).familyId).toBe(B);
  });

  it('8 revoked FamilyMembership → DENY', async () => {
    const A = await family('甲'); const mom = await guardian(A, '妈', 'phone:A');
    await pool.query(BACKFILL);
    await pool.query(`update family_memberships set status='REVOKED', revoked_at=now() where person_id=$1`, [mom]);
    const { token } = await auth.issueAccountSession('phone:A');
    await expect(guard.resolve(A, auth_(token))).rejects.toThrow();
  });

  it('9 LEFT membership → DENY', async () => {
    const A = await family('甲'); const mom = await guardian(A, '妈', 'phone:A');
    await pool.query(BACKFILL);
    await pool.query(`update family_memberships set status='LEFT', left_at=now() where person_id=$1`, [mom]);
    const { token } = await auth.issueAccountSession('phone:A');
    await expect(guard.resolve(A, auth_(token))).rejects.toThrow();
  });

  it('10 revoked AccountPersonBinding → DENY', async () => {
    const A = await family('甲'); await guardian(A, '妈', 'phone:A');
    await pool.query(BACKFILL);
    await pool.query(`update account_person_bindings set status='REVOKED', revoked_at=now()`);
    const { token } = await auth.issueAccountSession('phone:A');
    await expect(guard.resolve(A, auth_(token))).rejects.toThrow();
  });

  it('11 expired session → DENY (401)', async () => {
    const A = await family('甲'); await guardian(A, '妈', 'phone:A');
    await pool.query(BACKFILL);
    const { token } = await auth.issueAccountSession('phone:A');
    await pool.query(`update identity_sessions set expires_at = now() - interval '1 day' where account_ref is not null`);
    await expect(guard.resolve(A, auth_(token))).rejects.toThrow(/invalid_or_expired/);
  });

  it('12 revoked session → DENY', async () => {
    const A = await family('甲'); await guardian(A, '妈', 'phone:A');
    await pool.query(BACKFILL);
    const { token } = await auth.issueAccountSession('phone:A');
    expect(await auth.revoke(token)).toBe(true);
    await expect(guard.resolve(A, auth_(token))).rejects.toThrow(/invalid_or_expired/);
  });

  it('14 zero-family Account → authenticated, contexts=[]', async () => {
    const acct = await auth.issueAccountSession('phone:newuser'); // 无任何 person/binding
    const account = await auth.resolveAccount((acct as unknown as { token: string }).token);
    expect(account?.accountId).toBe(acct.account_id);
    expect(await auth.listContexts(acct.account_id)).toEqual([]);
  });

  it('no bearer / garbage → resolveAccount null', async () => {
    expect(await auth.resolveAccount(undefined)).toBeNull();
    expect(await auth.resolveAccount('garbage')).toBeNull();
  });
});

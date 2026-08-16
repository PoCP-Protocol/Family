import { Injectable } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export interface IdentitySessionRow {
  session_id: string;
  person_id: string;
  family_id: string;
  account_id: string | null;
  expires_at: string | Date;
  revoked_at: string | Date | null;
}

/** IAM-101 身份会话持久化(identity_sessions)。只存 token 的 sha256,不存明文。 */
@Injectable()
export class AuthRepository {
  private readonly pool: pg.Pool;
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({ connectionString });
  }

  /** person 是否属于该 family(可信绑定前置)。 */
  async personBelongsToFamily(personId: string, familyId: string): Promise<boolean> {
    const r = await this.pool.query('select 1 from persons where person_id=$1 and family_id=$2', [personId, familyId]);
    return (r.rowCount ?? 0) > 0;
  }

  async createSession(tokenHash: string, personId: string, familyId: string, accountId: string | null, expiresAt: Date): Promise<{ session_id: string }> {
    const r = await this.pool.query(
      `insert into identity_sessions(token_hash, person_id, family_id, account_id, expires_at)
         values ($1,$2,$3,$4,$5) returning session_id`,
      [tokenHash, personId, familyId, accountId, expiresAt.toISOString()],
    );
    return r.rows[0];
  }

  /** 有效会话:未撤销 且 未过期。 */
  async findActiveByTokenHash(tokenHash: string): Promise<IdentitySessionRow | null> {
    const r = await this.pool.query<IdentitySessionRow>(
      `select session_id, person_id, family_id, account_id, expires_at, revoked_at
         from identity_sessions
        where token_hash=$1 and revoked_at is null and expires_at > now()`,
      [tokenHash],
    );
    return r.rows[0] ?? null;
  }

  async revokeByTokenHash(tokenHash: string): Promise<boolean> {
    const r = await this.pool.query(`update identity_sessions set revoked_at=now() where token_hash=$1 and revoked_at is null`, [tokenHash]);
    return (r.rowCount ?? 0) > 0;
  }

  // ---------- IAM-102 OTP ----------
  async countRecentChallenges(destinationHash: string, windowMinutes: number): Promise<number> {
    const r = await this.pool.query<{ n: string }>(
      `select count(*)::int n from otp_challenges where destination_hash=$1 and created_at > now() - ($2 || ' minutes')::interval`,
      [destinationHash, String(windowMinutes)],
    );
    return Number(r.rows[0]?.n ?? 0);
  }

  async createChallenge(destinationHash: string, codeHash: string, purpose: string, ttlMs: number, maxAttempts: number): Promise<void> {
    await this.pool.query(
      `insert into otp_challenges(destination_hash, code_hash, purpose, max_attempts, expires_at)
         values ($1,$2,$3,$4, now() + ($5 || ' milliseconds')::interval)`,
      [destinationHash, codeHash, purpose, maxAttempts, String(ttlMs)],
    );
  }

  async findActiveChallenge(destinationHash: string): Promise<{ challenge_id: string; code_hash: string; attempts: number; max_attempts: number } | null> {
    const r = await this.pool.query(
      `select challenge_id, code_hash, attempts, max_attempts from otp_challenges
        where destination_hash=$1 and consumed_at is null and expires_at > now()
        order by created_at desc limit 1`,
      [destinationHash],
    );
    return r.rows[0] ?? null;
  }

  async incrementAttempt(challengeId: string): Promise<void> {
    await this.pool.query(`update otp_challenges set attempts = attempts + 1 where challenge_id=$1`, [challengeId]);
  }

  async consumeChallenge(challengeId: string): Promise<void> {
    await this.pool.query(`update otp_challenges set consumed_at=now() where challenge_id=$1`, [challengeId]);
  }

  /** 由外部账号(如 'phone:138...')解析已绑定的 person∈family(仅登录;注册=未来)。 */
  async findPersonByAccountId(accountId: string): Promise<{ person_id: string; family_id: string } | null> {
    const r = await this.pool.query(`select person_id, family_id from persons where account_id=$1 limit 1`, [accountId]);
    return r.rows[0] ?? null;
  }

  // ---------- TENANCY-V2 T2:Account 域 / 上下文 / 成员关系 ----------

  /** 由 external_ref(如 'phone:138')取或建 Account,返回 account_id(UUID)。 */
  async ensureAccountByExternalRef(externalRef: string): Promise<string> {
    const ins = await this.pool.query(
      `insert into accounts(external_ref) values ($1)
         on conflict (external_ref) do update set updated_at=now()
       returning account_id`,
      [externalRef],
    );
    return ins.rows[0].account_id;
  }

  /** 签发 account-scoped 会话(未选家庭:person_id/family_id 为 null)。 */
  async createAccountSession(tokenHash: string, accountId: string, expiresAt: Date): Promise<{ session_id: string }> {
    const r = await this.pool.query(
      `insert into identity_sessions(token_hash, account_ref, expires_at) values ($1,$2,$3) returning session_id`,
      [tokenHash, accountId, expiresAt.toISOString()],
    );
    return r.rows[0];
  }

  /** 有效 account 会话 → account_ref。 */
  async findActiveAccountSession(tokenHash: string): Promise<{ session_id: string; account_ref: string | null } | null> {
    // VERTICAL-SLICE-001 §16:account 会话仅当其 account 为 ACTIVE 才可用(DISABLED account → 立即失去授权)。
    const r = await this.pool.query<{ session_id: string; account_ref: string | null }>(
      `select s.session_id, s.account_ref from identity_sessions s
         join accounts a on a.account_id = s.account_ref
        where s.token_hash=$1 and s.revoked_at is null and s.expires_at > now() and a.status='ACTIVE'`,
      [tokenHash],
    );
    return r.rows[0] ?? null;
  }

  /** 严格路径:返回某 account 在某 family 的全部 ACTIVE person 上下文(不 LIMIT;供歧义检测 §17)。 */
  async resolveFamilyContextRows(accountId: string, familyId: string): Promise<Array<{ family_id: string; person_id: string; membership_id: string; role: string }>> {
    const r = await this.pool.query<{ family_id: string; person_id: string; membership_id: string; role: string }>(
      `select m.family_id, p.person_id, m.membership_id, m.role
         from account_person_bindings b
         join persons p on p.person_id = b.person_id
         join family_memberships m on m.person_id = p.person_id and m.family_id = p.family_id
        where b.account_id=$1 and m.family_id=$2 and b.status='ACTIVE' and m.status='ACTIVE'`,
      [accountId, familyId],
    );
    return r.rows;
  }

  /** 列出 Account 的全部 ACTIVE Family 上下文(经 ACTIVE binding + ACTIVE membership)。 */
  async listContextsForAccount(accountId: string): Promise<Array<{ family_id: string; person_id: string; membership_id: string; role: string }>> {
    const r = await this.pool.query(
      `select m.family_id, p.person_id, m.membership_id, m.role
         from account_person_bindings b
         join persons p on p.person_id = b.person_id
         join family_memberships m on m.person_id = p.person_id and m.family_id = p.family_id
        where b.account_id=$1 and b.status='ACTIVE' and m.status='ACTIVE'
        order by m.family_id`,
      [accountId],
    );
    return r.rows;
  }

  /** Account 的 external_ref(用于新建 person 的 account_id 连续性)。 */
  async accountExternalRef(accountId: string): Promise<string | null> {
    const r = await this.pool.query(`select external_ref from accounts where account_id=$1`, [accountId]);
    return r.rows[0]?.external_ref ?? null;
  }

  /** Account 当前拥有的 ACTIVE 家庭上下文数(用于 CreateFirstFamily 前置:必须为 0)。 */
  async countActiveContexts(accountId: string): Promise<number> {
    const r = await this.pool.query<{ n: string }>(
      `select count(*)::int n from account_person_bindings b
         join family_memberships m on m.person_id=b.person_id
        where b.account_id=$1 and b.status='ACTIVE' and m.status='ACTIVE'`,
      [accountId],
    );
    return Number(r.rows[0]?.n ?? 0);
  }

  /**
   * ACCOUNT_BOOTSTRAP:零家庭 Account 原子创建首个家庭。
   * 单事务:Family + Guardian Person + AccountPersonBinding + OWNER_GUARDIAN FamilyMembership;失败全回滚。
   * 不需要任何既有 Family 权限,也不授予对既有 Family 的访问。
   */
  async createFirstFamilyTx(accountId: string, displayName: string, guardianName: string): Promise<{ family_id: string; person_id: string; membership_id: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const extRef = (await client.query(`select external_ref from accounts where account_id=$1`, [accountId])).rows[0]?.external_ref ?? null;
      const fam = (await client.query(`insert into families(display_name) values ($1) returning family_id`, [displayName])).rows[0].family_id;
      const person = (await client.query(
        `insert into persons(family_id, person_type, parent_role, display_name, account_id) values ($1,'PARENT','GUARDIAN',$2,$3) returning person_id`,
        [fam, guardianName, extRef],
      )).rows[0].person_id;
      await client.query(`update families set primary_contact_person_id=$1 where family_id=$2`, [person, fam]);
      await client.query(
        `insert into account_person_bindings(account_id, person_id) values ($1,$2) on conflict (account_id, person_id) do nothing`,
        [accountId, person],
      );
      const membership = (await client.query(
        `insert into family_memberships(family_id, person_id, role, status, joined_at) values ($1,$2,'OWNER_GUARDIAN','ACTIVE', now()) returning membership_id`,
        [fam, person],
      )).rows[0].membership_id;
      await client.query('COMMIT');
      return { family_id: fam, person_id: person, membership_id: membership };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** 解析 Account 在指定 Family 的可信上下文;无 ACTIVE binding+membership → null(FAIL CLOSED)。 */
  async resolveFamilyContext(accountId: string, familyId: string): Promise<{ family_id: string; person_id: string; membership_id: string; role: string } | null> {
    const r = await this.pool.query(
      `select m.family_id, p.person_id, m.membership_id, m.role
         from account_person_bindings b
         join persons p on p.person_id = b.person_id
         join family_memberships m on m.person_id = p.person_id and m.family_id = p.family_id
        where b.account_id=$1 and m.family_id=$2 and b.status='ACTIVE' and m.status='ACTIVE'
        limit 1`,
      [accountId, familyId],
    );
    return r.rows[0] ?? null;
  }
}

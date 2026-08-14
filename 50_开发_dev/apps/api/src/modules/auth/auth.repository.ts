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
}

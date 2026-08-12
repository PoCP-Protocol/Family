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
}

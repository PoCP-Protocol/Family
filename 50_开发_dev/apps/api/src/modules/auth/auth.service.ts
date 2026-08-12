import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AuthRepository } from './auth.repository';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const TTL_MS = Number(process.env.IAM_SESSION_TTL_MS ?? 1000 * 60 * 60 * 24 * 7); // 默认 7 天

export interface ResolvedActor {
  personId: string;
  familyId: string;
  accountId: string | null;
}

/**
 * IAM-101 身份会话:签发不透明 Bearer 令牌(绑定 person∈family)+ 服务端解析 actor。
 * 真实 OTP/微信验证器 = IAM-102;消费路径强制令牌 + x-actor-id 降级 = IAM-103。
 */
@Injectable()
export class AuthService {
  constructor(@Inject(AuthRepository) private readonly repo: AuthRepository) {}

  /** 签发会话令牌。person 必须属于该 family(否则拒绝);返回明文令牌(仅此一次)。 */
  async issueSession(personId: string, familyId: string, accountId: string | null): Promise<{ token: string; expires_at: string; person_id: string; family_id: string }> {
    if (!personId || !familyId) throw new BadRequestException('person_id and family_id are required');
    if (!(await this.repo.personBelongsToFamily(personId, familyId))) {
      throw new BadRequestException('person_not_in_family');
    }
    const token = `fam_${randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + TTL_MS);
    await this.repo.createSession(sha256(token), personId, familyId, accountId, expiresAt);
    return { token, expires_at: expiresAt.toISOString(), person_id: personId, family_id: familyId };
  }

  /** 由 Bearer 令牌解析可信 actor;无效/过期/撤销 → null。 */
  async resolveActor(token: string | undefined): Promise<ResolvedActor | null> {
    if (!token) return null;
    const row = await this.repo.findActiveByTokenHash(sha256(token));
    if (!row) return null;
    return { personId: row.person_id, familyId: row.family_id, accountId: row.account_id };
  }

  async revoke(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    return this.repo.revokeByTokenHash(sha256(token));
  }
}

/** 从 Authorization: Bearer <token> 头取令牌。 */
export function bearerToken(authorization?: string): string | undefined {
  if (!authorization) return undefined;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : undefined;
}

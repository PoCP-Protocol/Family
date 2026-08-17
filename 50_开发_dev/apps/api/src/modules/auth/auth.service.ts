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

/** TENANCY-V2 T2:认证的 Account(尚未选家庭)。 */
export interface AuthenticatedAccount {
  accountId: string;
  sessionId: string;
}
/** TENANCY-V2 T2:某 Family 内的可信上下文(服务端解析,非 URL/client 声称)。 */
export interface FamilyAuthContext {
  accountId: string;
  sessionId: string;
  familyId: string;
  personId: string;
  membershipId: string;
  familyRole: string;
}
export interface FamilyContextSummary {
  type: 'FAMILY';
  family_id: string;
  person_id: string;
  membership_id: string;
  role: string;
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

  // ---------- TENANCY-V2 T2:account-scoped session + 多家庭上下文 ----------

  /** 由 external_ref(如 'phone:138')签发 account-scoped 会话(未选家庭;零家庭 Account 也可)。 */
  async issueAccountSession(externalRef: string): Promise<{ token: string; expires_at: string; account_id: string }> {
    if (!externalRef) throw new BadRequestException('external_ref is required');
    const accountId = await this.repo.ensureAccountByExternalRef(externalRef);
    const token = `fam_${randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + TTL_MS);
    await this.repo.createAccountSession(sha256(token), accountId, expiresAt);
    return { token, expires_at: expiresAt.toISOString(), account_id: accountId };
  }

  /** Bearer → 认证 Account;无效/过期/撤销/非 account 会话 → null。 */
  async resolveAccount(token: string | undefined): Promise<AuthenticatedAccount | null> {
    if (!token) return null;
    const row = await this.repo.findActiveAccountSession(sha256(token));
    if (!row || !row.account_ref) return null;
    return { accountId: row.account_ref, sessionId: row.session_id };
  }

  /** 列出 Account 的全部 Family 上下文;零家庭 → []。 */
  async listContexts(accountId: string): Promise<FamilyContextSummary[]> {
    const rows = await this.repo.listContextsForAccount(accountId);
    return rows.map((r) => ({ type: 'FAMILY', family_id: r.family_id, person_id: r.person_id, membership_id: r.membership_id, role: r.role }));
  }

  /**
   * ACCOUNT_BOOTSTRAP:认证 Account 创建首个家庭(原子)。仅当该 Account 当前零家庭上下文时允许;
   * 不需要既有 Family 权限,也不授予对既有 Family 的访问。返回新家庭上下文关键字段。
   */
  async createFirstFamily(token: string | undefined, displayName: string, guardianName: string): Promise<{ family_id: string; person_id: string; membership_id: string; role: string }> {
    const account = await this.resolveAccount(token);
    if (!account) throw new BadRequestException('invalid_or_expired_session');
    if (!displayName?.trim() || !guardianName?.trim()) throw new BadRequestException('display_name and guardian_name are required');
    const existing = await this.repo.countActiveContexts(account.accountId);
    if (existing > 0) throw new BadRequestException('account_already_has_family (use invite/join, not CreateFirstFamily)');
    const r = await this.repo.createFirstFamilyTx(account.accountId, displayName.trim(), guardianName.trim());
    return { ...r, role: 'OWNER_GUARDIAN' };
  }

  /**
   * 服务端解析某 Family 的可信上下文:Account → ACTIVE binding → ACTIVE membership → Family。
   * 越权/伪造/撤销/无成员关系 → null(FAIL CLOSED)。URL familyId/x-actor-id 不构成授权。
   */
  async resolveFamilyContext(token: string | undefined, familyId: string): Promise<FamilyAuthContext | null> {
    const account = await this.resolveAccount(token);
    if (!account) return null;
    const ctx = await this.repo.resolveFamilyContext(account.accountId, familyId);
    if (!ctx) return null;
    return {
      accountId: account.accountId, sessionId: account.sessionId,
      familyId: ctx.family_id, personId: ctx.person_id, membershipId: ctx.membership_id, familyRole: ctx.role,
    };
  }

  /**
   * 严格 V3 路径(VERTICAL-SLICE-001 §17):0 个 ACTIVE 上下文→NONE;1 个→OK;>1 个→AMBIGUOUS(fail closed,不任选)。
   * 不改动上面遗留 resolveFamilyContext(LIMIT 1),仅供严格编排 Guard 使用。
   */
  async resolveFamilyContextStrict(token: string | undefined, familyId: string): Promise<{ status: 'OK' | 'NONE' | 'AMBIGUOUS'; ctx?: FamilyAuthContext }> {
    const account = await this.resolveAccount(token);
    if (!account) return { status: 'NONE' };
    const rows = await this.repo.resolveFamilyContextRows(account.accountId, familyId);
    if (rows.length === 0) return { status: 'NONE' };
    if (rows.length > 1) return { status: 'AMBIGUOUS' };
    const r = rows[0];
    return { status: 'OK', ctx: { accountId: account.accountId, sessionId: account.sessionId, familyId: r.family_id, personId: r.person_id, membershipId: r.membership_id, familyRole: r.role } };
  }
}

/** 从 Authorization: Bearer <token> 头取令牌。 */
export function bearerToken(authorization?: string): string | undefined {
  if (!authorization) return undefined;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : undefined;
}

/** PLATFORM-SESSION-001:浏览器会话 cookie 名(HttpOnly/Secure/SameSite)。 */
export const SESSION_COOKIE = 'fam_session';

/** 从 Cookie 头取会话令牌(浏览器 HttpOnly cookie;JS 读不到明文)。 */
export function cookieToken(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === SESSION_COOKIE) return decodeURIComponent(v.join('=')).trim() || undefined;
  }
  return undefined;
}

/**
 * 会话令牌解析优先级:浏览器 HttpOnly cookie 优先(消费端),否则 Authorization: Bearer(内部/API/测试)。
 * 这样浏览器不需把 raw token 放进 WebStorage;内部/CLI/测试仍可用 Bearer。
 */
export function sessionTokenFromHeaders(headers: Record<string, unknown>): string | undefined {
  return cookieToken(headers?.['cookie'] as string | undefined) ?? bearerToken(headers?.['authorization'] as string | undefined);
}

import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService, bearerToken, type FamilyAuthContext } from './auth.service';

/**
 * TENANCY-V2 T2 · 统一 FamilyScopeGuard(唯一家庭作用域解析入口)。
 * 对 /families/:familyId/... 请求:Bearer → Account → ACTIVE binding → ACTIVE membership → 请求的 Family。
 * 合法才 ALLOW;否则 DENY:
 *   无/失效会话 → 401;非本家庭/无成员关系/撤销/伪造 → 403。
 * URL familyId、client personId、x-actor-id 均不构成授权。
 */
@Injectable()
export class FamilyScopeGuard {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  /** 解析可信 Family 上下文;失败即抛(401/403)。控制器据此取 personId 等,不再信任 x-actor-id。 */
  async resolve(familyId: string, authorization?: string): Promise<FamilyAuthContext> {
    const token = bearerToken(authorization);
    const account = await this.auth.resolveAccount(token);
    if (!account) throw new UnauthorizedException('invalid_or_expired_session');
    const ctx = await this.auth.resolveFamilyContext(token, familyId);
    if (!ctx) throw new ForbiddenException('account_has_no_active_membership_in_family');
    return ctx;
  }
}

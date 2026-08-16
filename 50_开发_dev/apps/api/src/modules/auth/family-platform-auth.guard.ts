import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, bearerToken, cookieToken, sessionTokenFromHeaders } from './auth.service';
import { assertFamilyRoleCan, type FamilyNamedAction, type FamilyRole } from './family-authorization.policy';

/** cookie 认证的变更请求须同源(CSRF 基本防护);Bearer(内部/API/测试)不走 cookie 故豁免。允许来源经 env 配置。 */
export function assertCookieOriginOk(req: { method?: string; headers?: Record<string, unknown> }): void {
  const usingCookie = !!cookieToken(req.headers?.['cookie'] as string | undefined) && !bearerToken(req.headers?.['authorization'] as string | undefined);
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes((req.method ?? 'GET').toUpperCase());
  if (!usingCookie || !mutating) return;
  const origin = (req.headers?.['origin'] ?? '').toString();
  const allow = (process.env.PLATFORM_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (origin && allow.length > 0 && !allow.includes(origin)) {
    throw new ForbiddenException('csrf_origin_not_allowed');
  }
}

/** 声明某端点所需的 Family NamedAction;guard 在 required 模式据此按角色矩阵强制。 */
export const FAMILY_ACTION_KEY = 'family_named_action';
export const RequireFamilyAction = (action: FamilyNamedAction) => SetMetadata(FAMILY_ACTION_KEY, action);

/** PLATFORM-IAM-104:消费路径是否强制真实 Bearer(默认关=内部 dogfood 仍 x-actor-id)。 */
function platformAuthRequired(): boolean {
  return process.env.PLATFORM_AUTH_MODE === 'required';
}

/**
 * PLATFORM-IAM-104 · 控制器级 Family 平台认证守卫。
 * required 模式:必须 Bearer → Account;/families/:familyId 经 FamilyScopeGuard 解析可信 personId(越权/撤销/伪造→403);
 *   仅 x-actor-id(无 Bearer)→ 401(x-actor-id-only 消费必拒)。
 * legacy 模式(默认):有 Bearer 且能解析家庭上下文则用可信 personId;否则回退 x-actor-id(现行为不变)。
 * 解析出的可信 actor 存 req.trustedActor,端点经 @ActorId() 读取——URL/x-actor-id 不再是授权来源。
 */
@Injectable()
export class FamilyPlatformAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    assertCookieOriginOk(req); // CSRF:cookie 认证的变更请求须同源
    const familyId: string | undefined = req.params?.familyId;
    const token = sessionTokenFromHeaders(req.headers ?? {}); // cookie 优先,否则 Bearer
    const xActor = (req.headers?.['x-actor-id'] ?? '').toString().trim();
    const requiredAction = this.reflector.get<FamilyNamedAction | undefined>(FAMILY_ACTION_KEY, context.getHandler());

    if (platformAuthRequired()) {
      if (!token) throw new UnauthorizedException('bearer_token_required'); // x-actor-id-only 拒
      if (familyId) {
        const ctx = await this.auth.resolveFamilyContext(token, familyId);
        if (!ctx) {
          const acct = await this.auth.resolveAccount(token);
          if (!acct) throw new UnauthorizedException('invalid_or_expired_session');
          throw new ForbiddenException('account_has_no_active_membership_in_family');
        }
        // TENANCY-V2:角色→NamedAction 显式矩阵强制(声明了 @RequireFamilyAction 的端点)。
        if (requiredAction) assertFamilyRoleCan(ctx.familyRole as FamilyRole, requiredAction);
        req.trustedActor = ctx.personId;
        req.familyContext = ctx;
      } else {
        const acct = await this.auth.resolveAccount(token); // createFamily 等无 familyId:仅需认证 Account
        if (!acct) throw new UnauthorizedException('invalid_or_expired_session');
        req.trustedActor = `account:${acct.accountId}`;
        req.authenticatedAccount = acct;
      }
      return true;
    }

    // legacy:优先用可信 Bearer 上下文,否则回退 x-actor-id(保持既有 x-actor-id 测试/内部 dogfood)。
    if (token && familyId) {
      const ctx = await this.auth.resolveFamilyContext(token, familyId);
      if (ctx) { req.trustedActor = ctx.personId; req.familyContext = ctx; return true; }
    }
    req.trustedActor = xActor;
    return true;
  }
}

/** 读取守卫解析出的可信 actor(personId 或 account:<id>);端点用它替代 @Headers('x-actor-id')。 */
export const ActorId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const req = context.switchToHttp().getRequest();
  return (req.trustedActor ?? '').toString();
});

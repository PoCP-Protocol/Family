/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 严格编排鉴权(P0 Security Gate)。
 * CONSUMER_X_ACTOR_ID_TRUST = 0(by construction):只认 cookie/Bearer → account session → ACTIVE membership → family context;
 * 绝无 x-actor-id 降级(独立于全局 PLATFORM_AUTH_MODE flag)。角色→NamedAction 走既有显式矩阵。
 */
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, sessionTokenFromHeaders } from '../auth/auth.service';
import { assertCookieOriginOk } from '../auth/family-platform-auth.guard';
import { assertFamilyRoleCan, type FamilyNamedAction, type FamilyRole } from '../auth/family-authorization.policy';

export const ORCH_ACTION_KEY = 'orchestration_required_action';
export const RequireOrchestrationAction = (action: FamilyNamedAction) => SetMetadata(ORCH_ACTION_KEY, action);

/** 已解析的可信家庭上下文(挂到 req)。 */
export const OrchestrationActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): { personId: string; familyId: string; familyRole: string } => {
  const req = ctx.switchToHttp().getRequest();
  return req.orchestrationContext;
});

@Injectable()
export class OrchestrationAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    assertCookieOriginOk(req); // §18:cookie 认证的变更请求须同源(CSRF);Bearer 豁免
    const familyId: string | undefined = req.params?.familyId;
    if (!familyId) throw new ForbiddenException('family_scope_required');

    const token = sessionTokenFromHeaders(req.headers ?? {});
    if (!token) throw new UnauthorizedException('session_required'); // 无 token 一律拒绝(不回退 x-actor-id)

    // §16/§17:严格解析(active-account 已在 resolveAccount 底层强制;歧义 fail closed)。
    const strict = await this.auth.resolveFamilyContextStrict(token, familyId);
    if (strict.status === 'AMBIGUOUS') throw new ForbiddenException('ambiguous_family_context');
    if (strict.status !== 'OK' || !strict.ctx) {
      const acct = await this.auth.resolveAccount(token);
      if (!acct) throw new UnauthorizedException('invalid_or_expired_session');
      throw new ForbiddenException('account_has_no_active_membership_in_family');
    }
    const fam = strict.ctx;

    const required = this.reflector.get<FamilyNamedAction | undefined>(ORCH_ACTION_KEY, context.getHandler());
    if (required) assertFamilyRoleCan(fam.familyRole as FamilyRole, required);

    req.orchestrationContext = { personId: fam.personId, familyId: fam.familyId, familyRole: fam.familyRole };
    return true;
  }
}

/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001 · 严格编排鉴权(P0 Security Gate)。
 * CONSUMER_X_ACTOR_ID_TRUST = 0(by construction):只认 cookie/Bearer → account session → ACTIVE membership → family context;
 * 绝无 x-actor-id 降级(独立于全局 PLATFORM_AUTH_MODE flag)。角色→NamedAction 走既有显式矩阵。
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, sessionTokenFromHeaders } from '../auth/auth.service';
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
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const familyId: string | undefined = req.params?.familyId;
    if (!familyId) throw new ForbiddenException('family_scope_required');

    const token = sessionTokenFromHeaders(req.headers ?? {});
    if (!token) throw new UnauthorizedException('session_required'); // 无 token 一律拒绝(不回退 x-actor-id)

    const fam = await this.auth.resolveFamilyContext(token, familyId);
    if (!fam) {
      const acct = await this.auth.resolveAccount(token);
      if (!acct) throw new UnauthorizedException('invalid_or_expired_session');
      throw new ForbiddenException('account_has_no_active_membership_in_family');
    }

    const required = this.reflector.get<FamilyNamedAction | undefined>(ORCH_ACTION_KEY, context.getHandler());
    if (required) assertFamilyRoleCan(fam.familyRole as FamilyRole, required);

    req.orchestrationContext = { personId: fam.personId, familyId: fam.familyId, familyRole: fam.familyRole };
    return true;
  }
}

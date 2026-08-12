import { Body, Controller, Get, Headers, Inject, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService, bearerToken } from './auth.service';

/**
 * IAM-101 身份会话端点。
 * POST /auth/session:签发(仅内部 FPAI_INTERNAL_OPS=true;真实用户验证器 = IAM-102,故默认不对外开放)。
 * GET  /auth/whoami:用 Bearer 令牌解析服务端可信 actor(演示/校验令牌机制)。
 */
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('session')
  async issue(@Body() body: { person_id?: string; family_id?: string; account_id?: string }) {
    // IAM-101:签发仅在内部环境开放(真实 OTP/微信验证器属 IAM-102)。默认关闭 → 404,避免成为开放登录。
    if (process.env.FPAI_INTERNAL_OPS !== 'true') {
      throw new NotFoundException('session issuance disabled (real verifier = IAM-102; internal issuance needs FPAI_INTERNAL_OPS=true)');
    }
    return this.auth.issueSession(body?.person_id ?? '', body?.family_id ?? '', body?.account_id ?? null);
  }

  @Get('whoami')
  async whoami(@Headers('authorization') authorization?: string) {
    const actor = await this.auth.resolveActor(bearerToken(authorization));
    if (!actor) throw new UnauthorizedException('invalid_or_expired_session');
    return { person_id: actor.personId, family_id: actor.familyId, account_id: actor.accountId };
  }

  @Post('session/revoke')
  async revoke(@Headers('authorization') authorization?: string) {
    const ok = await this.auth.revoke(bearerToken(authorization));
    return { revoked: ok };
  }
}

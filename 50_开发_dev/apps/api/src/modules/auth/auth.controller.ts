import { BadRequestException, Body, Controller, Get, Headers, Inject, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService, bearerToken } from './auth.service';
import { OtpService } from './otp.service';

/**
 * IAM-101 身份会话端点。
 * POST /auth/session:签发(仅内部 FPAI_INTERNAL_OPS=true;真实用户验证器 = IAM-102,故默认不对外开放)。
 * GET  /auth/whoami:用 Bearer 令牌解析服务端可信 actor(演示/校验令牌机制)。
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OtpService) private readonly otp: OtpService,
  ) {}

  // IAM-102 OTP 登录:请求验证码 → 验证 → 签发会话令牌。短信投递默认 stub(真实厂商需凭证,单独接)。
  @Post('otp/request')
  async otpRequest(@Body() body: { phone?: string }) {
    if (!body?.phone) throw new BadRequestException('phone is required');
    return this.otp.requestCode(body.phone);
  }

  @Post('otp/verify')
  async otpVerify(@Body() body: { phone?: string; code?: string }) {
    if (!body?.phone || !body?.code) throw new BadRequestException('phone and code are required');
    return this.otp.verifyCode(body.phone, body.code);
  }

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

  // TENANCY-V2 T2:Account 身份(不硬绑单一 Family)。
  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const account = await this.auth.resolveAccount(bearerToken(authorization));
    if (!account) throw new UnauthorizedException('invalid_or_expired_session');
    return { account_id: account.accountId, session_id: account.sessionId };
  }

  // TENANCY-V2 T2:Account 的全部 Family 上下文;零家庭 → contexts=[](首次 onboarding 用)。
  @Get('contexts')
  async contexts(@Headers('authorization') authorization?: string) {
    const account = await this.auth.resolveAccount(bearerToken(authorization));
    if (!account) throw new UnauthorizedException('invalid_or_expired_session');
    return { account_id: account.accountId, contexts: await this.auth.listContexts(account.accountId) };
  }

  // TENANCY-V2 T2:account-scoped 会话签发(内部;真实验证器 = OTP/IAM-102)。零家庭 Account 也可签发。
  @Post('account-session')
  async issueAccountSession(@Body() body: { external_ref?: string }) {
    if (process.env.FPAI_INTERNAL_OPS !== 'true') {
      throw new NotFoundException('account-session issuance disabled (real verifier = OTP; internal needs FPAI_INTERNAL_OPS=true)');
    }
    if (!body?.external_ref) throw new BadRequestException('external_ref is required');
    return this.auth.issueAccountSession(body.external_ref);
  }

  @Post('session/revoke')
  async revoke(@Headers('authorization') authorization?: string) {
    const ok = await this.auth.revoke(bearerToken(authorization));
    return { revoked: ok };
  }
}

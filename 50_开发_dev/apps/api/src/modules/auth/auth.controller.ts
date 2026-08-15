import { BadRequestException, Body, Controller, Get, Headers, Inject, NotFoundException, Post, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService, SESSION_COOKIE, sessionTokenFromHeaders } from './auth.service';
import { OtpService } from './otp.service';

/** 最小 Express 响应接口(设/清 HttpOnly 会话 cookie);避免直接依赖 express 类型。 */
interface CookieRes {
  cookie(name: string, value: string, opts: Record<string, unknown>): void;
  clearCookie(name: string, opts?: Record<string, unknown>): void;
}
const SESSION_TTL_MS = Number(process.env.IAM_SESSION_TTL_MS ?? 1000 * 60 * 60 * 24 * 7);
/** PLATFORM-SESSION-001:浏览器 HttpOnly/SameSite cookie(生产 Secure)。JS 读不到明文 token。 */
function setSessionCookie(res: CookieRes, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // dev/test 走 http,不加 Secure 否则不下发
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

/**
 * IAM 身份会话端点。浏览器用 HttpOnly cookie(credentials:include);内部/API/测试仍支持 Bearer。
 */
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OtpService) private readonly otp: OtpService,
  ) {}

  @Post('otp/request')
  async otpRequest(@Body() body: { phone?: string }) {
    if (!body?.phone) throw new BadRequestException('phone is required');
    return this.otp.requestCode(body.phone);
  }

  @Post('otp/verify')
  async otpVerify(@Body() body: { phone?: string; code?: string }, @Res({ passthrough: true }) res?: CookieRes) {
    if (!body?.phone || !body?.code) throw new BadRequestException('phone and code are required');
    const out = await this.otp.verifyCode(body.phone, body.code);
    if (res) setSessionCookie(res, out.token); // 浏览器:HttpOnly cookie(同时返回 token 供内部/测试)
    return out;
  }

  @Post('session')
  async issue(@Body() body: { person_id?: string; family_id?: string; account_id?: string }) {
    if (process.env.FPAI_INTERNAL_OPS !== 'true') {
      throw new NotFoundException('session issuance disabled (real verifier = IAM-102; internal issuance needs FPAI_INTERNAL_OPS=true)');
    }
    return this.auth.issueSession(body?.person_id ?? '', body?.family_id ?? '', body?.account_id ?? null);
  }

  @Get('whoami')
  async whoami(@Headers('authorization') authorization?: string, @Headers('cookie') cookie?: string) {
    const actor = await this.auth.resolveActor(sessionTokenFromHeaders({ authorization, cookie }));
    if (!actor) throw new UnauthorizedException('invalid_or_expired_session');
    return { person_id: actor.personId, family_id: actor.familyId, account_id: actor.accountId };
  }

  // TENANCY-V2 T2:Account 身份(不硬绑单一 Family)。cookie 或 Bearer。
  @Get('me')
  async me(@Headers('authorization') authorization?: string, @Headers('cookie') cookie?: string) {
    const account = await this.auth.resolveAccount(sessionTokenFromHeaders({ authorization, cookie }));
    if (!account) throw new UnauthorizedException('invalid_or_expired_session');
    return { account_id: account.accountId, session_id: account.sessionId };
  }

  // TENANCY-V2 T2:Account 的全部 Family 上下文;零家庭 → contexts=[]。
  @Get('contexts')
  async contexts(@Headers('authorization') authorization?: string, @Headers('cookie') cookie?: string) {
    const account = await this.auth.resolveAccount(sessionTokenFromHeaders({ authorization, cookie }));
    if (!account) throw new UnauthorizedException('invalid_or_expired_session');
    return { account_id: account.accountId, contexts: await this.auth.listContexts(account.accountId) };
  }

  // TENANCY-V2 T2:ACCOUNT_BOOTSTRAP —— 零家庭 Account 原子创建首个家庭(单事务)。cookie 或 Bearer。
  @Post('families')
  async createFirstFamily(
    @Headers('authorization') authorization?: string,
    @Headers('cookie') cookie?: string,
    @Body() body?: { display_name?: string; guardian_name?: string },
  ) {
    return this.auth.createFirstFamily(sessionTokenFromHeaders({ authorization, cookie }), body?.display_name ?? '', body?.guardian_name ?? '');
  }

  // TENANCY-V2 T2:account-scoped 会话签发(内部;真实验证器 = OTP/IAM-102)。零家庭 Account 也可签发。
  @Post('account-session')
  async issueAccountSession(@Body() body: { external_ref?: string }, @Res({ passthrough: true }) res?: CookieRes) {
    if (process.env.FPAI_INTERNAL_OPS !== 'true') {
      throw new NotFoundException('account-session issuance disabled (real verifier = OTP; internal needs FPAI_INTERNAL_OPS=true)');
    }
    if (!body?.external_ref) throw new BadRequestException('external_ref is required');
    const out = await this.auth.issueAccountSession(body.external_ref);
    if (res) setSessionCookie(res, out.token);
    return out;
  }

  @Post('session/revoke')
  async revoke(@Headers('authorization') authorization?: string, @Headers('cookie') cookie?: string, @Res({ passthrough: true }) res?: CookieRes) {
    const ok = await this.auth.revoke(sessionTokenFromHeaders({ authorization, cookie }));
    if (res) res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { revoked: ok };
  }
}

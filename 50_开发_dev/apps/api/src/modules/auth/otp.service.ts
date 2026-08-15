import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const OTP_TTL_MS = Number(process.env.IAM_OTP_TTL_MS ?? 5 * 60 * 1000);      // 5 分钟
const OTP_MAX_ATTEMPTS = Number(process.env.IAM_OTP_MAX_ATTEMPTS ?? 5);
const OTP_RATE_WINDOW_MIN = Number(process.env.IAM_OTP_RATE_WINDOW_MIN ?? 10);
const OTP_RATE_MAX = Number(process.env.IAM_OTP_RATE_MAX ?? 3);              // 每窗口最多请求数

/** 短信投递抽象。默认 StubOtpSender(不真发);真实厂商(阿里云/腾讯云)= 独立 adapter,需凭证 = 治理后接。 */
export interface OtpSender {
  send(destination: string, code: string): Promise<void>;
  /** 仅内部/测试:回读上次验证码(生产恒 undefined)。 */
  peek?(destination: string): string | undefined;
}

@Injectable()
export class StubOtpSender implements OtpSender {
  private readonly last = new Map<string, string>();
  async send(destination: string, code: string): Promise<void> {
    // 不对外发送。仅在内部环境保留以便自测/演示;生产严禁开启内部回读。
    if (process.env.FPAI_INTERNAL_OPS === 'true') this.last.set(destination, code);
  }
  peek(destination: string): string | undefined {
    return process.env.FPAI_INTERNAL_OPS === 'true' ? this.last.get(destination) : undefined;
  }
}

export const OTP_SENDER = 'OTP_SENDER';

const normPhone = (p: string) => String(p).replace(/[\s-]/g, '');

/**
 * IAM-102 OTP 验证流程(流程真实:生成/哈希/过期/限流/尝试次数/验证→签发)。
 * 短信投递经 OtpSender(默认 stub 不真发);真实厂商需凭证,单独接。仅登录既有绑定手机(注册=未来)。
 */
@Injectable()
export class OtpService {
  constructor(
    @Inject(AuthRepository) private readonly repo: AuthRepository,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OTP_SENDER) private readonly sender: OtpSender,
  ) {}

  async requestCode(phoneRaw: string): Promise<{ requested: true; dev_code?: string }> {
    const phone = normPhone(phoneRaw);
    if (!/^\d{6,15}$/.test(phone)) throw new BadRequestException('invalid_phone');
    const destHash = sha256(`phone:${phone}`);
    if (await this.repo.countRecentChallenges(destHash, OTP_RATE_WINDOW_MIN) >= OTP_RATE_MAX) {
      throw new ConflictException('otp_rate_limited');
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.repo.createChallenge(destHash, sha256(`phone:${phone}|${code}`), 'LOGIN', OTP_TTL_MS, OTP_MAX_ATTEMPTS);
    await this.sender.send(`phone:${phone}`, code);
    // dev_code 仅内部环境返回(便于自测);生产 undefined。
    return { requested: true, dev_code: this.sender.peek?.(`phone:${phone}`) };
  }

  async verifyCode(phoneRaw: string, code: string): Promise<{ token: string; expires_at: string; account_id: string }> {
    const phone = normPhone(phoneRaw);
    const destHash = sha256(`phone:${phone}`);
    const ch = await this.repo.findActiveChallenge(destHash);
    if (!ch) throw new UnauthorizedException('otp_invalid_or_expired');
    if (ch.attempts >= ch.max_attempts) throw new UnauthorizedException('otp_too_many_attempts');
    if (ch.code_hash !== sha256(`phone:${phone}|${String(code)}`)) {
      await this.repo.incrementAttempt(ch.challenge_id);
      throw new UnauthorizedException('otp_code_mismatch');
    }
    await this.repo.consumeChallenge(ch.challenge_id);
    // TENANCY-V2 T2:OTP 只验证登录身份 → 签发【Account-scoped 会话】,不自动选家庭。
    // 家庭上下文经 GET /auth/contexts 解析;零家庭 Account 合法(注册=CreateFirstFamily)。
    // 废除旧语义(phone → person LIMIT 1 → family session)。
    return this.auth.issueAccountSession(`phone:${phone}`);
  }
}

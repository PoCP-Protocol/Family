import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { FamilyScopeGuard } from './family-scope.guard';
import { FamilyPlatformAuthGuard } from './family-platform-auth.guard';
import { OtpService, StubOtpSender, OTP_SENDER } from './otp.service';

/**
 * M3-W2 IAM 身份模块。IAM-101 令牌机制 + 服务端 actor 解析;IAM-102 OTP 验证流程(stub sender)。
 * 导出 AuthService 供消费路径强制(IAM-103)复用。真实短信/微信 provider 需凭证,单独接。
 */
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    FamilyScopeGuard,
    FamilyPlatformAuthGuard,
    OtpService,
    { provide: OTP_SENDER, useClass: StubOtpSender }, // 真实厂商 adapter 在此替换(env-gated,需凭证)
  ],
  exports: [AuthService, FamilyScopeGuard, FamilyPlatformAuthGuard],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

/**
 * M3-W2 IAM-101 身份会话模块。令牌机制 + 服务端 actor 解析;导出 AuthService 供后续消费路径强制(IAM-103)复用。
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}

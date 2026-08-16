import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationRepository } from './orchestration.repository';
import { OrchestrationService } from './orchestration.service';

/**
 * FAMILY-GROWTH-VERTICAL-SLICE-001
 * 模块化单体中的 V3 服务编排边界。只复用 AuthModule 的可信家庭上下文；
 * 不复制 Family Core/Growth OS/Principal/Program Runtime，也不启动外部模型或跨组织能力。
 */
@Module({
  imports: [AuthModule],
  controllers: [OrchestrationController],
  providers: [OrchestrationRepository, OrchestrationService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}

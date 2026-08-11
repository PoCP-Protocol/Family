import { Module } from '@nestjs/common';
import { PrincipalController } from './principal.controller';
import { PrincipalService } from './principal.service';
import { PrincipalRepository } from './principal.repository';

/**
 * M3-101A-B Famili Principal 受控真实 Runtime。
 * Provider = 确定性 soul(Fake 等价);真实模型经 cc switch(@family/ai-gateway AnthropicAiGateway,env-gated)= M3-101B。
 * 只写 principal_* / product_events;不写 Growth canonical(那属 101A-C Action Bridge → 既有 Named Action)。
 */
@Module({
  controllers: [PrincipalController],
  providers: [PrincipalService, PrincipalRepository],
})
export class PrincipalModule {}

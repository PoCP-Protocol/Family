import { Module } from '@nestjs/common';
import { createAiGatewayFromEnv } from '@family/ai-gateway';
import { FamilyModule } from '../family/family.module';
import { PrincipalController } from './principal.controller';
import { PrincipalService, PRINCIPAL_AI_GATEWAY } from './principal.service';
import { PrincipalRepository } from './principal.repository';

/**
 * M3-101A-B Famili Principal 受控真实 Runtime。
 * Provider = 确定性 soul(Fake 等价);真实模型经 cc switch(@family/ai-gateway AnthropicAiGateway,env-gated)= M3-101B。
 * 只写 principal_* / product_events;不写 Growth canonical(那属 101A-C Action Bridge → 既有 Named Action)。
 */
@Module({
  imports: [FamilyModule], // 复用 InterventionService(既有 StartIntervention Named Action)
  controllers: [PrincipalController],
  providers: [
    PrincipalService,
    PrincipalRepository,
    // M3-101B:env-gated 真实模型网关。仅 FPAI_PRINCIPAL_PROVIDER=real 时接 cc switch(AnthropicAiGateway);
    // 否则 null → runPrincipalTextMvp 走确定性回退,零外部调用(CI/测试默认安全)。
    {
      provide: PRINCIPAL_AI_GATEWAY,
      useFactory: () => (process.env.FPAI_PRINCIPAL_PROVIDER === 'real' ? createAiGatewayFromEnv(process.env) : null),
    },
  ],
})
export class PrincipalModule {}

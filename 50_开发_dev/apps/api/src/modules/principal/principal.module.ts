import { Module } from '@nestjs/common';
import { AttemptRecordingGateway, RoutingAiGateway, buildVendorGateway, type AiGateway, type AttemptSink } from '@family/ai-gateway';
import { FamilyModule } from '../family/family.module';
import { PrincipalController } from './principal.controller';
import { PrincipalService, PRINCIPAL_AI_GATEWAY } from './principal.service';
import { PrincipalRepository } from './principal.repository';

const VENDOR_PROVIDER_ID: Record<string, string> = { anthropic: 'anthropic-cc-switch', zhipu: 'zhipu-glm4v' };

/**
 * M3-INT-001 B1/B3:构造 Principal 真实网关。
 * - FPAI_PRINCIPAL_PROVIDER!=real → null(默认确定性,零外呼)。
 * - provider 集受环境准入(§20-21,镜像 FPAI_PROVIDER_REGISTRY):internal_livecheck = 请求的 vendor 即批;
 *   pilot/production 必须经 FPAI_APPROVED_PROVIDERS 显式批准,否则无获批 provider → null(FAIL CLOSED)。
 * - 每个 provider 用 AttemptRecordingGateway 包裹(B1:外呼前后落 principal_model_attempts,含 failover/timeout)。
 */
function buildPrincipalGateway(env: Record<string, string | undefined>, sink: AttemptSink): AiGateway | null {
  if (env.FPAI_PRINCIPAL_PROVIDER !== 'real') return null;
  const spec = env.FPAI_MODEL_VENDOR || (env.ANTHROPIC_BASE_URL ? 'anthropic' : '');
  const requested = spec.split(',').map((s) => s.trim()).filter(Boolean);
  if (!requested.length) return null;
  const profile = env.FPAI_RUNTIME_PROFILE || 'internal';
  const approvedSet = profile === 'internal_livecheck'
    ? new Set(requested)
    : new Set((env.FPAI_APPROVED_PROVIDERS || '').split(',').map((s) => s.trim()).filter(Boolean));
  const approved = requested.filter((v) => approvedSet.has(v));
  if (!approved.length) return null; // 无获批 provider → 不外呼
  const gateways = approved.map((v, i) => new AttemptRecordingGateway(buildVendorGateway(v, env), VENDOR_PROVIDER_ID[v] ?? v, sink, i));
  return gateways.length === 1 ? gateways[0] : new RoutingAiGateway(gateways);
}

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
      inject: [PrincipalRepository], // repo 实现 AttemptSink(begin/finish)
      useFactory: (repo: PrincipalRepository) => buildPrincipalGateway(process.env, repo as unknown as AttemptSink),
    },
  ],
})
export class PrincipalModule {}

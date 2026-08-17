import { Module } from '@nestjs/common';
import { AttemptRecordingGateway, RoutingAiGateway, buildVendorGateway, type AiGateway, type AttemptSink } from '@family/ai-gateway';
import { FamilyModule } from '../family/family.module';
import { AuthModule } from '../auth/auth.module';   // IAM-103:消费/复核路径复用 AuthService.resolveActor
import { PrincipalController } from './principal.controller';
import { PrincipalService, PRINCIPAL_AI_GATEWAY } from './principal.service';
import { PrincipalRepository } from './principal.repository';
import { PrincipalAiCoachResource } from './principal-ai-coach.resource';

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
  // W2R-102:internal_livecheck 与 model_first_internal(受控内部默认,已授权 provider=anthropic-cc-switch)自动批准请求的 vendor;
  // pilot/production 仍须 FPAI_APPROVED_PROVIDERS 显式批准。
  const approvedSet = (profile === 'internal_livecheck' || profile === 'model_first_internal')
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
  imports: [FamilyModule, AuthModule], // FamilyModule=InterventionService;AuthModule=IAM-103 Bearer 解析
  controllers: [PrincipalController],
  providers: [
    PrincipalService,
    PrincipalRepository,
    PrincipalAiCoachResource, // FAMILY-GROWTH-VERTICAL-SLICE-001:窄 AI_COACH 适配(不暴露 acceptProposal)
    // M3-101B:env-gated 真实模型网关。仅 FPAI_PRINCIPAL_PROVIDER=real 时接 cc switch(AnthropicAiGateway);
    // 否则 null → runPrincipalTextMvp 走确定性回退,零外部调用(CI/测试默认安全)。
    {
      provide: PRINCIPAL_AI_GATEWAY,
      inject: [PrincipalRepository], // repo 实现 AttemptSink(begin/finish)
      useFactory: (repo: PrincipalRepository) => buildPrincipalGateway(process.env, repo as unknown as AttemptSink),
    },
  ],
  // Orchestration 消费窄 AI_COACH 资源(依赖方向 Orchestration→Principal)。
  exports: [PrincipalAiCoachResource],
})
export class PrincipalModule {}

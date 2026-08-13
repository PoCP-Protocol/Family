/**
 * MM1-B1 · Dev Fallback Policy (§30)
 *
 * 意图:
 *   在 dev/lab 环境下,若真实 provider 因 credential 缺失或健康状态 DEGRADED
 *   而不可用,允许显式降级到 FAKE_BASELINE,并在 telemetry 中记录
 *   FALLBACK_PROVIDER_USED=YES 与原因。
 *
 * 强制门禁:
 *   - 只有当 env.FPAI_ALLOW_DEV_FAKE_FALLBACK === 'YES' 时才允许。
 *   - 默认 NO;生产必须 NO。
 *
 * 本模块只是策略函数,不注入 orchestrator。真正的 wiring 在有 credential 的
 * 运行阶段再做。此处保持 code-ready + 单测覆盖,不改动 frozen 文件。
 */

export type ProviderHealthKind = 'READY' | 'DEGRADED' | 'UNKNOWN' | 'BLOCKED_MISSING_CREDENTIAL';

export interface DevFallbackDecisionInput {
  primaryProviderId: string;
  primaryHealth: ProviderHealthKind;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
}

export interface DevFallbackDecision {
  useFallback: boolean;
  reason:
    | 'PRIMARY_READY'
    | 'FALLBACK_DISABLED_BY_ENV'
    | 'FALLBACK_USED_DEGRADED'
    | 'FALLBACK_USED_BLOCKED'
    | 'FALLBACK_USED_UNKNOWN';
  telemetry: {
    FALLBACK_PROVIDER_USED: 'YES' | 'NO';
    PRIMARY_PROVIDER_ID: string;
    PRIMARY_HEALTH: ProviderHealthKind;
  };
}

export function decideDevFallback(input: DevFallbackDecisionInput): DevFallbackDecision {
  const env = input.env ?? process.env;
  const allow = (env.FPAI_ALLOW_DEV_FAKE_FALLBACK ?? 'NO').toString().toUpperCase() === 'YES';

  const base = {
    PRIMARY_PROVIDER_ID: input.primaryProviderId,
    PRIMARY_HEALTH: input.primaryHealth,
  };

  if (input.primaryHealth === 'READY') {
    return {
      useFallback: false,
      reason: 'PRIMARY_READY',
      telemetry: { FALLBACK_PROVIDER_USED: 'NO', ...base },
    };
  }

  if (!allow) {
    return {
      useFallback: false,
      reason: 'FALLBACK_DISABLED_BY_ENV',
      telemetry: { FALLBACK_PROVIDER_USED: 'NO', ...base },
    };
  }

  let reason: DevFallbackDecision['reason'] = 'FALLBACK_USED_UNKNOWN';
  if (input.primaryHealth === 'DEGRADED') reason = 'FALLBACK_USED_DEGRADED';
  else if (input.primaryHealth === 'BLOCKED_MISSING_CREDENTIAL') reason = 'FALLBACK_USED_BLOCKED';

  return {
    useFallback: true,
    reason,
    telemetry: { FALLBACK_PROVIDER_USED: 'YES', ...base },
  };
}

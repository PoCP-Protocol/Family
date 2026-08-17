/**
 * ARCH-GO-TEST-FULL-FUNCTION-001 + ARCH-ENV-PROMOTION-SEQUENCE-001
 * 环境状态: DEV_IMPLEMENTING / PROD_HOLD
 *
 * 这是 DEV/TEST 完整闭环的唯一业务开关。它默认关闭，并在 production-like
 * profile 下强制拒绝。真实 LLM 仅可由 FamilyLlmGatewayService 在独立配置、
 * 模型 allowlist、最小测试快照、输出验证和审计均满足时调用；不得旁路调用提供者。
 */
import { ForbiddenException } from '@nestjs/common';

export const TEST_LOOP_POLICY_VERSION = 'arch-go-test-full-function-001.dev.v1';
export const TEST_LOOP_MODE = 'DEV_SYNTHETIC_ONLY' as const;

export interface TestLoopCapability {
  enabled: boolean;
  mode: typeof TEST_LOOP_MODE;
  policy_version: string;
  environment_status: 'DEV_IMPLEMENTING' | 'DEV_READY_FOR_TEST' | 'TEST_VALIDATED' | 'PROD_HOLD';
}

function isProductionLike(env: NodeJS.ProcessEnv): boolean {
  const normalized = [env.NODE_ENV, env.FAMILY_RUNTIME_ENV, env.FAMILY_RUNTIME_PROFILE]
    .filter(Boolean)
    .join(':')
    .toLowerCase();
  return normalized.includes('production') || normalized.includes('prod') || normalized.includes('pilot');
}

function hasRealModelConfiguration(env: NodeJS.ProcessEnv): boolean {
  return env.FPAI_RUNTIME_PROFILE === 'model_first_internal'
    || env.MODEL_ASSISTANT_ENABLED === 'true'
    || env.FAMILY_EXTERNAL_MODEL_ENABLED === 'true';
}

/**
 * 合成/测试数据完整闭环只有在 DEV/TEST 显式打开时可用。即使显式打开，也绝不允许
 * production-like 环境通过。真实 LLM 不是该开关的旁路能力，必须再满足 Family Gateway 的
 * 配置、allowlist、输入、输出与审计检查。调用方必须在任何 fixture/read/write 前检查。
 */
export function resolveTestLoopCapability(env: NodeJS.ProcessEnv = process.env): TestLoopCapability {
  const enabled = env.FAMILY_TEST_FULL_LOOP_ENABLED === 'true'
    && !isProductionLike(env);
  return {
    enabled,
    mode: TEST_LOOP_MODE,
    policy_version: TEST_LOOP_POLICY_VERSION,
    environment_status: enabled ? 'DEV_IMPLEMENTING' : 'PROD_HOLD',
  };
}

export function requireDevSyntheticTestLoop(env: NodeJS.ProcessEnv = process.env): TestLoopCapability {
  const capability = resolveTestLoopCapability(env);
  if (!capability.enabled) {
    throw new ForbiddenException('test_loop_dev_synthetic_only_not_enabled');
  }
  return capability;
}

/** Feature-gate smoke-test helper: all reads/writes use fixtures; any LLM call must still use the Family Gateway. */
export function testLoopMustUseOnlySyntheticFixtures(env: NodeJS.ProcessEnv = process.env): boolean {
  return requireDevSyntheticTestLoop(env).enabled;
}

export const __test__ = { isProductionLike, hasRealModelConfiguration };

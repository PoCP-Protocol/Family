/**
 * PROVIDER_POLICY_RUNTIME_001(设计见 reports/m3/PROVIDER_POLICY_RUNTIME_001_DESIGN.md)。
 * 把 Provider Registry(governance/FPAI_PROVIDER_REGISTRY.yaml)作为 runtime SSOT:
 * providerApproved / authorizedExternalCategories 由 registry(provider × environment)派生,
 * 不再由 env/RuntimeProfile 自宣称(堵 §15 漂移)。纯函数;FAIL CLOSED。
 *
 * 启用由 api 侧 flag FPAI_PROVIDER_POLICY_RUNTIME=on 控制(默认关=现行为不变)。
 */
import type { ProcessingDataCategory } from './index';

export interface ProviderRegistryEntry {
  provider_id: string;
  minor_data_allowed: boolean;
  private_text_allowed: boolean;
  approved_environment: readonly string[];
}
export type ProviderRegistrySnapshot = readonly ProviderRegistryEntry[];

/**
 * 运行时快照:由 tools/build_provider_policy_snapshot.py 从 governance/FPAI_PROVIDER_REGISTRY.yaml(唯一 SSOT)生成,
 * 不再手抄。CI drift-guard(`--check`)保证 YAML 改而产物未重生成即 FAIL。
 */
import { GENERATED_PROVIDERS, PROVIDER_REGISTRY_SOURCE_SHA256 as GEN_SHA } from './provider-registry.generated';

export const FPAI_PROVIDER_REGISTRY_SNAPSHOT: ProviderRegistrySnapshot = GENERATED_PROVIDERS as unknown as ProviderRegistryEntry[];
/** 生成产物内记录的 YAML 源哈希(供 drift-guard / 审计)。 */
export const PROVIDER_REGISTRY_SOURCE_SHA256: string = GEN_SHA;

export interface ProviderPolicyResult {
  providerApproved: boolean;
  authorizedExternalCategories: readonly ProcessingDataCategory[];
  source: 'provider_registry';
}

/**
 * 由 Provider Registry 派生某 provider 在某 environment 的外呼策略。
 * FAIL CLOSED:provider 未登记 / environment 不在 approved_environment → 不批、类别为空。
 * 类别派生:基础 USER_PROVIDED_TEXT + MINIMAL_GROWTH_CONTEXT(获批时);
 *   MINOR_PRIVATE_TEXT 仅 minor_data_allowed;FAMILY_PRIVATE_TEXT 仅 private_text_allowed。
 */
export function resolveProviderPolicy(
  snapshot: ProviderRegistrySnapshot,
  providerId: string,
  environment: string,
): ProviderPolicyResult {
  const entry = snapshot.find((e) => e.provider_id === providerId);
  const approved = !!entry && entry.approved_environment.includes(environment);
  const categories: ProcessingDataCategory[] = [];
  if (approved && entry) {
    categories.push('USER_PROVIDED_TEXT', 'MINIMAL_GROWTH_CONTEXT');
    if (entry.minor_data_allowed) categories.push('MINOR_PRIVATE_TEXT');
    if (entry.private_text_allowed) categories.push('FAMILY_PRIVATE_TEXT');
  }
  return { providerApproved: approved, authorizedExternalCategories: categories, source: 'provider_registry' };
}

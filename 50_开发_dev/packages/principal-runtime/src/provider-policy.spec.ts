import { describe, expect, it } from 'vitest';
import { resolveProviderPolicy, FPAI_PROVIDER_REGISTRY_SNAPSHOT } from './provider-policy';

describe('PROVIDER_POLICY_RUNTIME_001 · resolveProviderPolicy(registry SSOT)', () => {
  it('anthropic-cc-switch @ model_first_internal → approved,类别仅 USER/MINIMAL(排除 MINOR/FAMILY_PRIVATE)', () => {
    const p = resolveProviderPolicy(FPAI_PROVIDER_REGISTRY_SNAPSHOT, 'anthropic-cc-switch', 'model_first_internal');
    expect(p.providerApproved).toBe(true);
    expect(p.authorizedExternalCategories).toEqual(['USER_PROVIDED_TEXT', 'MINIMAL_GROWTH_CONTEXT']);
    // §15 修复:registry minor/private=false → 不得外发未成年人/家庭私有文本
    expect(p.authorizedExternalCategories).not.toContain('MINOR_PRIVATE_TEXT');
    expect(p.authorizedExternalCategories).not.toContain('FAMILY_PRIVATE_TEXT');
    expect(p.source).toBe('provider_registry');
  });

  it('未登记 environment(internal)→ FAIL CLOSED:不批、类别空', () => {
    const p = resolveProviderPolicy(FPAI_PROVIDER_REGISTRY_SNAPSHOT, 'anthropic-cc-switch', 'internal');
    expect(p.providerApproved).toBe(false);
    expect(p.authorizedExternalCategories).toEqual([]);
  });

  it('zhipu-glm4v 仅 internal_livecheck 获批;model_first_internal → 不批', () => {
    expect(resolveProviderPolicy(FPAI_PROVIDER_REGISTRY_SNAPSHOT, 'zhipu-glm4v', 'internal_livecheck').providerApproved).toBe(true);
    expect(resolveProviderPolicy(FPAI_PROVIDER_REGISTRY_SNAPSHOT, 'zhipu-glm4v', 'model_first_internal').providerApproved).toBe(false);
  });

  it('未登记 provider → FAIL CLOSED', () => {
    const p = resolveProviderPolicy(FPAI_PROVIDER_REGISTRY_SNAPSHOT, 'unknown-provider', 'model_first_internal');
    expect(p.providerApproved).toBe(false);
    expect(p.authorizedExternalCategories).toEqual([]);
  });

  it('minor/private 开关驱动类别(合成 registry)', () => {
    const snap = [{ provider_id: 'x', minor_data_allowed: true, private_text_allowed: true, approved_environment: ['e'] }];
    const p = resolveProviderPolicy(snap, 'x', 'e');
    expect(p.authorizedExternalCategories).toContain('MINOR_PRIVATE_TEXT');
    expect(p.authorizedExternalCategories).toContain('FAMILY_PRIVATE_TEXT');
  });
});

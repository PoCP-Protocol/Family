# PROVIDER_POLICY_RUNTIME_001 设计稿 — Provider Registry 接成 Runtime Policy

```text
DOC_KIND = DESIGN_ONLY (不启用;实现须架构师授权)
RULING   = 架构师复盘 2026-08-14 §15–16、§33–34
PRIORITY = P0_BEFORE_REAL_FAMILY_EXTERNAL_MODEL(真实家庭外呼前必过)
NOT_BLOCKING = synthetic 内部 W2R-104 eval(gold);BLOCKING = 真实家庭外呼 / pilot
```

## 一、现状缺口(高序真相:代码)
```text
governance/FPAI_PROVIDER_REGISTRY.yaml 已是 SSOT:
  anthropic-cc-switch: minor_data_allowed=false, private_text_allowed=false, approved_environment=[internal_livecheck, model_first_internal]
但运行时未真正 load 它:
  · evaluateProcessing() 逻辑正确(consent→external switch→providerApproved→policy_version→category allowlist→minor→image),
    但 `providerApproved` 与 `authorizedExternalCategories` 是【上层传入】,当前上层由 env/RuntimeProfile 决定。
  · PrincipalModule 对 internal_livecheck/model_first_internal 的 provider 判定 = "请求了哪个 vendor 就视为 approved"。
  · internal_livecheck 配置把 USER_PROVIDED_TEXT/MINIMAL_GROWTH_CONTEXT/MINOR_PRIVATE_TEXT/FAMILY_PRIVATE_TEXT 都可 external。
→ 形成 Governance SSOT → NOT EXECUTED → Env/Profile Mirror → Runtime 的漂移风险。
```

## 二、目标
```text
Provider Registry(SSOT)
      ↓ boot 时 load + 校验
Validated Runtime Policy Snapshot
      ↓ 注入
evaluateProcessing()  ← providerApproved / authorizedExternalCategories / minorAllowed / privateTextAllowed 全部来自 snapshot,不再由 env/profile 自宣称
```

## 三、设计
1. **Runtime Policy Loader**(新增,principal-runtime 或 api 启动期):
   - 读 `governance/FPAI_PROVIDER_REGISTRY.yaml` → 校验 schema → 生成不可变 snapshot:`{provider_id → {approved_environment[], minor_data_allowed, private_text_allowed, authorized_categories[], policy_version}}`。
   - 校验失败/文件缺失 → **FAIL CLOSED**:snapshot 为空 = 一切 external 拒绝。
2. **策略解析** `resolveProviderPolicy(provider_id, environment)`:
   - environment(=RuntimeProfile,如 model_first_internal)必须 ∈ 该 provider 的 approved_environment,否则 external=DENY。
   - `providerApproved = (environment ∈ approved_environment)`;`authorizedExternalCategories` 由 registry 的 category allowlist + minor/private 开关派生,**不读 env**。
3. **evaluateProcessing 接线**:上层改为传入 `resolveProviderPolicy(...)` 的结果,而非 env/profile 镜像。逻辑本身不动(已正确)。
4. **PrincipalModule**:移除"请求 vendor 即 approved";vendor 是否可用由 snapshot 决定。
5. **可观测**:external 决策发 `principal_provider_policy_evaluated`{provider, environment, approved, categories, source:'registry'}。

## 四、不变量与边界
```text
SSOT 唯一:providerApproved/authorizedDataCategories/approvedEnvironment/minorAllowed/privateTextAllowed 只能来自 Provider Registry,禁止 process.env/RuntimeProfile 自行宣称。
FAIL CLOSED:registry 缺失/非法 → 拒绝一切 external。
不改 consent/policy_version/危机短路/图片隔离等既有门(evaluateProcessing 逻辑保持)。
真实家庭外呼前:本项 = PASS 是前置(与 IAM-103 并列 pilot 前置)。
DESIGN_ONLY:实现与启用须架构师授权。
```

## 五、验收(实现阶段)
```text
model_first_internal + anthropic-cc-switch → approved(∈ approved_environment);未登记 environment → external DENY
minor/private_text external 一律按 registry(false)拒绝,无论 env 怎么设
删除/改坏 registry → 所有 external DENY(fail-closed 单测)
env 反向抬高授权(如设 FPAI_APPROVED_PROVIDERS)不再生效
```

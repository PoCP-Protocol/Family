# FPAI ModelRun Ledger V1

purpose: 冻结 AI 执行台账。复用 `@family/principal-ai` 的 `PrincipalModelRun`。
runtime: **NOT_AUTHORIZED**（仅契约)

---

## 1. 定位
ModelRun = **AI execution ledger**,与以下四者严格区分:
```
PrincipalModelRun != ProductEvent
PrincipalModelRun != GrowthEvent
PrincipalModelRun != AuditEvent
```

## 2. 冻结字段(基于既有 PrincipalModelRun)
```
model_run_id
request_id
session_id
family_id_ref            # 引用,非拷贝 Family aggregate
model_provider
model_name
model_version
prompt_version           # 复用 PRINCIPAL_AI_PROMPT_VERSION
soul_version             # 复用 PRINCIPAL_SOUL_VERSION
soul_hash
scenario_id              # detectScenario / PrincipalScenarioId
method_refs              # REVIEWED_METHOD_CARDS
source_refs              # REVIEWED_KNOWLEDGE_CARDS
input_hash               # 默认存 hash,非明文(见 §3)
output_hash
risk_route               # PrincipalRiskRoute
schema_validation        # pass/fail(validatePrincipalOutput)
latency_ms
token_usage              # PrincipalTokenUsage
created_at
```

## 3. 隐私(Contract Level,§12 要求)
```
ModelRun 默认不完整复制:child_private_text / parent_private_text / Family aggregate
默认存 input_hash / output_hash + metadata;明文按 redaction/最小化处理
```
五类数据责任分离:`PrincipalMessage`(用户输入)/ `PrincipalResponse`(AI 输出)/ `ModelRun Metadata`(执行台账)/ `GrowthEvent`(成长域)/ `AuditEvent`(治理)。
各自明确:`retention / access / redaction / PII / minor_data / export / deletion`(达 Contract Level;runtime 前落实存储)。

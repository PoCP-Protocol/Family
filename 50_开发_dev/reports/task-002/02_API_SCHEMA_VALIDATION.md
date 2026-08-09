# TASK-002 · 02 API & Schema Contract Validation

- Agent: AI-02 (API & Schema Contract Validator)
- 日期: 2026-08-09
- 工作根: `D:\Family\50_开发_dev\`
- 模式: 只读 + 静态校验(YAML parse via node/js-yaml)。未改任何契约,未 install/build/git。

## Verdict: **CONDITIONAL_PASS**

契约骨架结构清晰、Named-Action 原则贯彻良好、无 generic PATCH、DTO 与 DB Entity 已分离、枚举与 Ontology 一致。以 v0.2 为治理 SSOT 是成立的。放行前需处理若干 **HIGH** 缺口(幂等覆盖不全、Growth Named Action 缺 action/事件规格、Growth 端点缺错误响应),以及 v0.1 定位需明确标注为 superseded。

---

## 静态校验结果(机器可验证项)

| # | 检查项 | core v0.1 | platform v0.2 |
|---|---|---|---|
| 1 | OpenAPI 3.1 声明 | `3.1.0` OK | `3.1.0` OK |
| 2 | Parser 可读(YAML) | PASS | PASS |
| 3 | operationId 唯一 | 7/7 唯一 | 11/11 唯一 |
| — | 本地 `$ref` 解析 | 无 $ref | 27/27 全部解析成功,0 悬空 |

两份 spec 均能被静态解析;operationId 无重复;v0.2 全部 27 个 `#/components/...` 引用均可解析。

---

## 逐项判定(v0.2 为主体)

| # | 检查项 | 结论 |
|---|---|---|
| 4 Request Schema | 6 个核心写 + 4 个 Growth 写均有 `requestBody.required` + `additionalProperties:false` | PASS |
| 5 Response Schema | 核心写/读均有 2xx schema | PASS(Growth 写见 HIGH-3) |
| 6 Error Schema | `ErrorResponse` 含机读 `code`+`message`+`correlationId`,`additionalProperties:false` | PASS |
| 7 HTTP Status | 写=201、读=200、错误=400/401/403/404/409,语义一致 | PASS |
| 8 Idempotency-Key | 覆盖 6 核心写 + ConfirmGrowthPriority;**LogGrowthEvent / MeasureOutcome 缺失** | **HIGH-1** |
| 9 X-Correlation-Id | 全部写/读端点均要求,`ErrorResponse` 回传 correlationId | PASS |
| 10 Bearer Auth | 顶层 `security: bearerAuth`(http/bearer/JWT) | PASS |
| 11 Path parameter | `familyId` required + format uuid,复用 `#/parameters/FamilyId` | PASS |
| 12 UUID 格式 | 服务端 ID 全部 `format: uuid`;见 LOW-1(部分 subjectId 为裸 string) | PASS(注意 LOW-1) |
| 13 Enum ↔ Ontology | 见下方逐一比对,**全部一致** | PASS |
| 14 API ↔ Named Action | 6 核心 Action 一一对应;见 HIGH-2 | 条件 PASS |
| 15 绕开 Named Action 的 Generic CRUD | 全文无 PATCH/PUT,无任意字段更新端点 | PASS |
| 16 DTO 泄漏 DB Entity | DTO=camelCase 独立 Request/Response;Ontology=snake_case;无直接复用 | PASS |
| 17 Breaking Contract 隐患 | 见下方 | 见 MEDIUM |

### Action ↔ API 一一对应(重点)
| Named Action (spec/actions) | v0.2 operationId | 方法/路径 | 判定 |
|---|---|---|---|
| CreateFamily | CreateFamily | POST /families | 一致 |
| AddParent | AddParent | POST /families/{familyId}/parents | 一致 |
| AddChild | AddChild | POST /families/{familyId}/children | 一致 |
| CreateFamilyRelationship | CreateFamilyRelationship | POST /families/{familyId}/relationships | 一致 |
| AssignLifeStage | AssignLifeStage | POST /families/{familyId}/life-stages | 一致 |
| GrantConsent | GrantConsent | POST /families/{familyId}/consents | 一致 |
| (无 action 文件) | ConfirmGrowthPriority | POST .../growth-priorities/confirm | **HIGH-2** |
| (无 action 文件) | LogGrowthEvent | POST .../events | **HIGH-2** |
| (无 action 文件) | MeasureOutcome | POST .../outcomes | **HIGH-2** |
| GetFamilyAggregate / ListGrowthProfiles | 读端点,不需 action | — | OK |

未来 Growth 对象(GrowthProfile/GrowthPriority/GrowthEvent/Outcome)已在 v0.2 预留,且均以**动词化 Named Action**(Confirm/Log/Measure)而非 generic CRUD 暴露,**未违反 Named Action 原则**;confirm 用子资源路径而非 PATCH,方向正确。

### Enum ↔ Ontology 比对(全部一致)
- FamilyStatus [ACTIVE,INACTIVE,ARCHIVED] = enums.yaml ✓
- GrowthDomain [CHILD,PARENT,RELATIONSHIP] = enums.yaml ✓
- ParentRole [MOTHER,FATHER,GUARDIAN,OTHER_GUARDIAN] = AddParentRequest.role ✓
- RelationshipType 5 值 ✓  · LifeStageCode [EARLY_ADOLESCENCE_12_15] ✓(与 decision/action allowed_values 一致)
- ConsentPurpose 8 值 ✓  · ConsentStatus [GRANTED,WITHDRAWN,EXPIRED] ✓
- PersonType [PARENT,CHILD] 与 PersonRole 一致 ✓

---

## 问题清单

### BLOCKER
无。

### HIGH
- **HIGH-1 幂等覆盖不全** — 文件: `openapi-family-platform-v0.2.yaml`(paths `/events`、`/outcomes`)。`LogGrowthEvent`、`MeasureOutcome` 均为返回 `201` 的写接口,但未引用 `IdempotencyKey` 参数。GrowthEvent 是 append-only 证据流,重试/网络抖动会产生重复事件,污染 Outcome 计算。建议: 二者补 `- $ref: '#/components/parameters/IdempotencyKey'` 并补 `409` 响应;或在 `API_CONTRACT_RULES` 明确"事件流用 client-supplied eventId 去重"的替代口径。
- **HIGH-2 Growth Named Action 缺规格背书** — 文件: `specs/actions/`(缺 `ConfirmGrowthPriority` / `LogGrowthEvent` / `MeasureOutcome` 的 .action.yaml),且 `specs/events/` 缺 `GrowthEventLogged`/`OutcomeMeasured` 事件规格(EVENT_STANDARD.md 已示例 OutcomeMeasured)。API 已暴露这三个写 Action,但无 action/effects/audit/事件契约,违反 Rule 2「核心写接口必须映射到 Named Action」的可追溯性。建议: 为三者补 action.yaml(至少 effects+idempotency+audit)与对应 event.yaml,再放行 Growth 写。
- **HIGH-3 Growth 写端点缺错误响应** — 文件: `openapi-family-platform-v0.2.yaml`。`ConfirmGrowthPriority`/`LogGrowthEvent`/`MeasureOutcome` 仅有 `201`,缺 400/403/404;`ListGrowthProfiles` 仅 200。与核心端点错误契约不一致,客户端无法据契约处理失败。建议: 统一补 `BadRequest/Forbidden/NotFound`(confirm 另补 `409`)。

### MEDIUM
- **MED-1 core v0.1 为空壳,定位需标注** — 文件: `openapi-family-core-v0.1.yaml`。无 requestBody、无 response schema、无 security、无 error `code`、无 Idempotency/Correlation 头,违反 Rule 4/5。若 v0.2 为唯一 HTTP SSOT,应在 v0.1 `info.description` 显式标注 `superseded by v0.2`,或从契约集移除,避免下游误引空契约。
- **MED-2 事件命名 core-envelope 与 domain-event-spec 双轨** — `events/event-envelope.schema.json` 用 camelCase(eventName/aggregateId/correlationId),`specs/events/*.event.yaml` 用 snake_case(family_id/actor_id/correlation_id)且字段是"业务字段"非 envelope。二者未声明谁是 envelope、谁是 payload 契约。建议: 在 EVENT_STANDARD 明确 "envelope=camelCase JSON schema;.event.yaml 描述 payload 必填字段",防止实现期字段名漂移(Breaking 隐患)。
- **MED-3 v0.1→v0.2 演进未有 version decision 记录** — Rule 6 要求 breaking change 走 RFC+version decision。v0.1→v0.2 增加了必填头 `Idempotency-Key`/`X-Correlation-Id`(对已有客户端是 breaking)。建议: 补一条 decision 记录说明 v0.1 未发布/仅骨架,故不构成 breaking。

### LOW
- **LOW-1 subjectId / GrowthProfileSummary.subjectId 为裸 string** — `growth_profile.schema.yaml.subject_id` 与 v0.2 `GrowthProfileSummary.subjectId` 未标 `format: uuid`(因可能指向 RELATIONSHIP 复合键)。建议: 注释说明取值域,避免消费方误当 uuid 校验。
- **LOW-2 CreateFamilyRelationship / AssignLifeStage / GrantConsent 缺 401/409** — v0.2 这些写端点仅列 400/403/404,未列 `401`(顶层 security 已覆盖但错误契约不完整)、幂等冲突 `409`。建议: 与 CreateFamily 对齐补齐。
- **LOW-3 MeasureOutcomeRequest.baseline/current 为空 schema `{}`** — 与 outcome.schema.yaml 一致(有意的 any),但 `additionalProperties:false` 下 any 值字段建议加 `description` 标注允许类型,便于生成器。

---

## 结论
契约治理骨架(Named Action + 无 generic PATCH + DTO/Entity 分离 + 枚举对齐 + 审计/幂等/关联 ID 头)在核心 6 Action 上落地扎实,可作为实现基线。放行条件: 处理 HIGH-1/2/3(Growth 写的幂等、action/event 规格、错误响应),并明确 v0.1 的 superseded 定位。以上均为 REPORT+建议,未改动任何契约文件。

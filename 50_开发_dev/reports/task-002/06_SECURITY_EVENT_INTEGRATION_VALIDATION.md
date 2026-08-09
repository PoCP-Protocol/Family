# 06 — Security / Consent / Event / Integration Validation

- Agent: AI-06 (Family TASK-002 独立验证子 Agent)
- 日期: 2026-08-09
- 工作根: `D:\Family\50_开发_dev\`
- 约束: 只 READ + 校验 + 写本报告。未改任何契约,未 install/git,未跑 TASK-101。仅跑只读 node+ajv 实测 event-envelope schema。

## Verdict: **CONDITIONAL_PASS**

核心安全语义(purpose 隔离、SERVICE≠MODEL_IMPROVEMENT、RESEARCH≠CONTENT_PUBLICATION、外部 ID 不作 Family ID、Anti-Corruption Layer 链)全部成立。存在 1 个 P1 命名口径矛盾与若干 P2/P3 缺口,不阻断骨架,但应在实现前落 RFC。

---

## A. Consent Purpose — PASS

校验对象: `specs/ontology/consent.schema.yaml`, `specs/ontology/enums.yaml`(ConsentPurpose), `database/schema_v0_1.sql`(consent_purpose ENUM), `security/CONSENT_PERMISSION_MATRIX.csv` 表头。

- 8 类 purpose **四处完全一致且齐全**: SERVICE / ASSESSMENT / AI_PERSONALIZATION / GROWTH_TRACKING / EXPERT_SERVICE / RESEARCH / MODEL_IMPROVEMENT / CONTENT_PUBLICATION。schema enum、ontology enum、DB ENUM、CSV 列头逐字对齐,零漂移。
- **SERVICE ≠ MODEL_IMPROVEMENT — 确认隔离**:
  - `consent.policy.yaml`: "SERVICE does not imply MODEL_IMPROVEMENT."
  - `GrantConsent.action.yaml`: `service_consent_does_not_imply_model_improvement_consent: true`
  - Matrix 中 MODEL_IMPROVEMENT 列对所有主体均为 `SEPARATE_CONSENT / DENY / DENY_UNLESS_OPT_IN / OPT_IN_ONLY`,从不随 SERVICE 隐含 ALLOW。
  - `MINOR_DATA_SOP.md §5`: "MODEL_IMPROVEMENT必须独立Consent." 交叉一致。
- **RESEARCH ≠ CONTENT_PUBLICATION — 确认隔离**: `consent.policy.yaml`: "RESEARCH does not imply CONTENT_PUBLICATION." Matrix 两列独立,RESEARCH=`APPROVED_PROJECT_ONLY/SEPARATE_CONSENT`,CONTENT_PUBLICATION 全线 `DENY/SEPARATE_CONSENT`,未见任一行由 RESEARCH 推导 CONTENT_PUBLICATION。

**结论**: purpose 分类齐全、跨制品一致、两条关键隔离(服务同意≠训练同意、研究≠发布)成立。PASS。

## B. Permission Matrix — CONDITIONAL_PASS

校验对象: `security/CONSENT_PERMISSION_MATRIX.csv`。7 角色(PARENT_SELF/PARENT_GUARDIAN/CHILD/GROWTH_ADVISOR/EXPERT/AI_AGENT/DATA_ANALYST)× 8 purpose,无 Undefined role、无 Undefined purpose、无空单元格(全格显式赋值,无 Implicit allow)。

正向确认:
- 默认拒绝倾向明确: GROWTH_ADVISOR/EXPERT 对 RESEARCH/MODEL_IMPROVEMENT/CONTENT_PUBLICATION 全 `DENY`;AI_AGENT MODEL_IMPROVEMENT=`DENY_UNLESS_OPT_IN`。
- CHILD 行对训练类三列为 `N_A`,符合"未成年不进训练/发布默认域"。
- DATA_ANALYST 仅 `ALLOW_DEIDENTIFIED`,训练/研究需 `OPT_IN_ONLY/APPROVED_PROJECT_ONLY`。

问题:
- **[P2] 角色命名与 SOP/事件 actor 口径不统一**: CSV 用 `PARENT_SELF/PARENT_GUARDIAN/AI_AGENT/GROWTH_ADVISOR`,而 event-envelope actor.type=`PARENT|CHILD|STAFF|SYSTEM|AI`,SOP 用 Guardian/Staff。存在多套角色词表,未见统一映射表(如 GROWTH_ADVISOR/EXPERT/DATA_ANALYST → STAFF)。建议出一份 role-crosswalk。
- **[P2] 大量条件谓词未定义判定来源**: `ALLOW_IF_GUARDIAN / ALLOW_IF_ASSIGNED / ALLOW_IF_PURPOSE / ALLOW_IF_REFERRED / ALLOW_BY_AGENT_POLICY / AGE_UX_POLICY` 均为条件 ALLOW,但 CSV 未链接到判定这些条件的策略文件。`ALLOW_BY_AGENT_POLICY` 与 `AGE_UX_POLICY` 目前无对应 policy 文件承接,属悬空引用。此非 Implicit allow(条件已显式标注),但实现侧可能被误读为默认放行。建议每个条件谓词在 policies/ 下有落点或在 CSV 加 policy_ref 列。
- **[P3] EXPERT × ASSESSMENT** = `ALLOW_IF_REFERRED`,而 AI_PERSONALIZATION/GROWTH_TRACKING = `ALLOW_IF_PURPOSE`;EXPERT_SERVICE 列又回到 `ALLOW_IF_REFERRED`。谓词在同一行内混用(referred vs purpose)语义边界建议在文档说明,避免实现二义。

**结论**: 结构完整、无未定义/无隐式放行、拒绝语义正确。但条件谓词悬空(无 policy 落点)与角色词表分裂需补齐,故 CONDITIONAL。

## C. Minor Data SOP — PASS

校验对象: `security/MINOR_DATA_SOP.md`。

- M0/M1/M2/M3 四级分类完整: M0 基础身份 / M1 家庭关系 / M2 成长与行为 / M3 高敏感安全信息,层级清晰。
- 要求的处理路径覆盖度(逐项确认):
  - Guardian(§4: same Family + authorized relationship + active consent + policy_version)✓
  - Purpose(§3 绑定 purpose)✓
  - Minimum Data(§2 最小化)✓
  - AI Context(§5 最小上下文/禁止全量历史/MODEL_IMPROVEMENT 独立同意/高敏走本地或 Abstain)✓
  - Export(§7 默认禁止 + 角色+purpose+audit + 大批量二次审批)✓
  - Deletion/Withdrawal(§8 停止未来处理 + 处理衍生缓存索引 + 审计保留 + 法律强留单独标识)✓
  - Safety Signal(§9 M3 独立权限域、不进普通成长评分)✓
  - Audit(§6 高敏访问全 Audit)✓
  - Incident(§10 suspend/preserve audit/ticket/owner/assess subjects)✓
- **交叉一致性**: §4 Guardian 四条件与 `GrantConsent.action.yaml` preconditions(subject/guardian_belongs_to_family + guardian_is_authorized_for_subject)吻合;§8 撤回不删审计与 `consent.policy.yaml` "Withdrawal must not delete audit history" 吻合;M3 独立域与 `perspective-fact.policy.yaml`/`core-state-write.policy.yaml` 不冲突。

问题:
- **[P3] M3→consent 落库无区分**: DB `consents` 与 `perspectives/evidence` 均无 sensitivity/M-level 列,§9"M3 进入独立权限域"目前只是文档约束,schema 层无强制隔离机制。建议实现期加数据分级标记(不阻断当前静态契约)。

**结论**: 分类与 10 项路径全覆盖、与 consent 契约交叉一致。PASS(P3 为实现期加固建议)。

## D. Domain Event — CONDITIONAL_PASS

校验对象: `events/event-envelope.schema.json`, `events/EVENT_STANDARD.md`, `specs/events/ConsentGranted.event.yaml`。

**只读 ajv 实测(draft 2020-12,ajv-formats)**:
- `SCHEMA_COMPILE: OK` — envelope 是合法 draft2020-12 schema。
- 合法事件通过;`additionalProperties:false` 生效(未知字段被拒);缺 correlationId 被拒;actor.type 非枚举值被拒。
- eventName `pattern ^[A-Z][A-Za-z0-9]+$`: snake_case(`consent_granted`)被拒 ✓、lowercase-leading camelCase(`createFamily`)被拒 ✓。

必需字段核对: eventId/eventName/eventVersion/aggregateType/aggregateId/occurredAt/correlationId/actor/source/payload 全部 required;causationId 可空(`["string","null"]`),符合标准。actor 枚举 `PARENT|CHILD|STAFF|SYSTEM|AI` 与 enums.yaml ActorType 一致。版本策略(新增 optional 不升版、破坏性升 major、consumer 显式声明、历史不可静默改)在 EVENT_STANDARD.md 齐备,DB `outbox_events` 带 event_version 字段承接。

问题:
- **[P1] ConsentGranted.event.yaml 字段名与 envelope 不一致(命名口径矛盾)**: 事件 spec 用 snake_case `event_id/family_id/consent_id/actor_id/correlation_id/occurred_at`,而权威 envelope 用 camelCase `eventId/aggregateId/correlationId/occurredAt/actor.id`。且 spec 无 eventName/eventVersion/aggregateType,却另立 `metadata_required: [source, schema_version]`(envelope 无 schema_version)。两套结构并存会导致实现二义:到底以 envelope 还是以 per-event yaml 为准需明确。建议出 RFC 统一——推荐 per-event yaml 只描述 payload 契约,envelope 字段一律以 event-envelope.schema.json 为唯一权威。
- **[P2] past-tense 未被 schema 强制**: 实测 `FamilyUpdate`(非过去式)通过校验。EVENT_STANDARD.md 要求"过去式"但 pattern 无法表达时态,属文档约束>机器约束的固有缺口。建议接受为文档级约束,或在 CI 加事件名词表白名单校验。

**结论**: envelope schema 合法且强约束到位、必需字段齐、版本策略清晰。但 per-event yaml 与 envelope 的字段命名/结构矛盾(P1)需 RFC 收敛,故 CONDITIONAL。

## E. Integration Adapter — PASS

校验对象: `integrations/contracts/ADAPTER_CONTRACT.md`, `integrations/dto/external-customer.dto.schema.json`, `integrations/dto/family-import-command.schema.json`, `integrations/dto/DTO_MAPPING_TEMPLATE.csv`。

- ACL 链完整: External API/DB → Raw External DTO → Adapter Mapper → Canonical DTO → Validation → Family Named Action/Import Command,与 core-state-write.policy(仅 Named Action 可写核心态)闭合。
- **确认"不能直接用外部 ID 作 Family ID"**: ADAPTER_CONTRACT 禁止段明列"用外部ID作为Family canonical ID"禁止;DTO 层落实——`external-customer.dto` 只有 `sourceCustomerId`(无 family_id);`family-import-command` 把外部 id 收进 `lineage.sourceId` 而非直接作主键,Family canonical id 由 DB `gen_random_uuid()` 生成。链路无外部 ID 泄漏为主键的路径。
- **lineage 溯源保留**: `family-import-command` required=`lineage{sourceSystem, sourceId, mappingVersion}` 三字段齐,与 ADAPTER_CONTRACT "保留 source lineage" 及 sourceSystem/sourceId/mappingVersion 要求逐项吻合。
- 外部字段不直接成域字段: mapping CSV 显式 source→canonical 映射 + transform + pii_class(含 PII_MINOR 标注 LMS.student.birth_date),符合"外部字段不直接成为 Family Domain 字段"。

问题:
- **[P3] canonical DTO schema 未落文件**: 契约要求 adapter 提供 "canonical DTO schema",dto/ 下有 external DTO 与 import-command,但缺一份独立 canonical DTO schema(当前由 import-command 隐式承担)。建议实现期补齐,不阻断。
- **[P3] mappingVersion 无版本登记源**: lineage 强制 mappingVersion,但无 mapping registry 定义有效版本集,属实现期项。

**结论**: ACL 五段链完整、外部 ID 不作主键已双层落实(契约禁止 + DTO 结构)、lineage 三字段齐。PASS。

---

## 问题汇总(按级)

| 级 | 区 | 文件 | 问题 | 建议 |
|----|----|------|------|------|
| P1 | D | `specs/events/ConsentGranted.event.yaml` vs `events/event-envelope.schema.json` | 事件字段 snake_case 且结构(schema_version/无 eventName·eventVersion·aggregateType)与权威 envelope camelCase 矛盾,双套并存 | 出 RFC:envelope 为唯一权威,per-event yaml 仅描述 payload |
| P2 | B | `security/CONSENT_PERMISSION_MATRIX.csv` | `ALLOW_BY_AGENT_POLICY`/`AGE_UX_POLICY` 等条件谓词无对应 policy 落点(悬空引用) | 每谓词在 policies/ 建落点或 CSV 增 policy_ref 列 |
| P2 | B | `CONSENT_PERMISSION_MATRIX.csv` / SOP / envelope | 角色词表分裂(PARENT_SELF/AI_AGENT/GROWTH_ADVISOR vs PARENT/STAFF/AI) | 建 role-crosswalk 映射表 |
| P2 | D | `event-envelope.schema.json` | past-tense 无法被 pattern 强制(`FamilyUpdate` 通过) | CI 加事件名白名单,或接受为文档约束 |
| P3 | C | `database/schema_v0_1.sql` | consents/perspectives 无 M-level/sensitivity 列,M3 独立域仅文档级 | 实现期加数据分级标记 |
| P3 | E | `integrations/dto/` | 缺独立 canonical DTO schema + mapping registry(mappingVersion 无有效集) | 实现期补齐 |

## 实测证据
只读运行 ajv(draft2020-12)+ajv-formats 编译 `event-envelope.schema.json`: `SCHEMA_COMPILE: OK`;正/负样本 7 例行为符合预期(见 D 节)。临时脚本已删除,未改动任何契约文件。

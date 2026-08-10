# FPAI Context Broker Contract V1

purpose: 冻结"法咪莉校长能读取哪些 Family 合法上下文"的边界。**ALLOWLIST,不是把整个 Family aggregate 交给 AI。**
owner: L3 Famili Principal(读)← 经 Context Broker ← L1/L2(源,只读授权)
runtime: **NOT_AUTHORIZED**(本文件只定义契约)

---

## 1. 原则
- **ALLOWLIST-only**:只暴露下方显式列出的字段;未列出的一律不出域。
- **Consent-gated**:任何读取前必须通过 AI 使用同意校验(见 §3)。
- **Minor-aware**:涉未成年人私有文本按最小必要 + redaction(见 `FPAI_MODEL_RUN_LEDGER_V1` 与隐私章)。
- **No write**:Context Broker 只读;绝不触发 Named Action、绝不写任何 canonical 表。
- **对齐真实数据模型**:下列字段必须与 `apps/api/src/modules/family/**` + `database/migrations/**` 的真实结构核对后才生效;**不存在的字段不得为文档方便虚构**——本 V1 标注"待对齐"的字段在 runtime 授权前必须逐一落实到真实读模型。

## 2. Allowlist（候选,需与真实读模型逐字对齐)
```
family_id                      # 来自 families(真实)
subject_id / subject_type      # Child/Parent/Relationship(真实:persons / growth subject resolver)
life_stage                     # active LifeStage(真实:life_stage_assignments,仅 EARLY_ADOLESCENCE_12_15)
confirmed_growth_priority[]    # 已确认(真实:growth_priorities;仅 confirmed)
active_intervention[]          # 真实:interventions/growth 关联(仅 active)
recent_permitted_observations[]# 真实:outcome/observation(仅授权范围、时间窗内)
recent_action_state            # 真实:growth_actions 的状态(assigned/completed)
consented_principal_preferences# L3 PrincipalFeedback 派生(仅已同意项)
```
> 每个字段在 runtime 授权前需标注:`source_table / read-only / consent_purpose_required / minor_redaction`。未通过对齐的字段在 M3-101 前不得进入 broker。

## 3. Consent Gap Analysis（本阶段关键)
**真实 consent purposes(权威 enum,已核对 `specs/ontology/consent.schema.yaml` + DB `consent_purpose`)**:
`SERVICE / ASSESSMENT / AI_PERSONALIZATION / GROWTH_TRACKING / EXPERT_SERVICE / RESEARCH / MODEL_IMPROVEMENT / CONTENT_PUBLICATION`

裁决:
- **存在与 AI 使用相关的合法 purpose = `AI_PERSONALIZATION`** → 作为"调用法咪莉校长生成个性化建议"的**前置同意**。`MODEL_IMPROVEMENT` 单独门禁训练,**不得**被 Principal 调用复用。
- **禁止的静默解释**(契约红线):
  - `SERVICE` **≠** AI 使用同意 → 禁止 SERVICE 推导 model invocation。
  - `GROWTH_TRACKING` **≠** model invocation 授权 → 禁止自动允许。
- **需上升为 Blocker / 契约收紧项**:`AI_PERSONALIZATION` 的定义是否**明确覆盖**"将未成年人/家长私有文本发送给(可能是外部的)provider 模型"。若其现有定义未显式包含"provider model invocation on private/minor text",则:
  - 标记 `M3_CONSENT_SCOPE_TIGHTENING_REQUIRED`(契约级,交总架构师),在 runtime 授权前收紧 `AI_PERSONALIZATION` 定义或新增专用 purpose(如 `AI_ASSIST`)。
  - **在收紧完成前,Context Broker 对"私有文本 + 外部 provider"路径 FAIL CLOSED。**
- 结论:**AI 使用的合法 purpose 存在(AI_PERSONALIZATION),非硬 Blocker;但其 scope 精确性需收紧,记为契约级前置。** 不允许绕过。

## 4. 契约不变量
```
context_broker.write            = FORBIDDEN
context_broker.named_action     = FORBIDDEN
context_broker.output ⊆ allowlist
consent(AI_PERSONALIZATION)=GRANTED  # 前置,否则 FAIL CLOSED
minor_private_text → redaction/minimization before leaving domain
```

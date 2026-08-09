# TASK-002 · 03 Agent & Human Gate 静态验证报告

- 验证子 Agent: AI-03 (Agent & Human Gate Validator)
- 工作根: `D:\Family\50_开发_dev\`
- 日期: 2026-08-09
- 范围: 只读静态校验（Agent Card 字段完整性 / 关键红线 / Human Gate 自洽）。未改任何契约、未运行代码。

---

## VERDICT: CONDITIONAL_PASS

核心安全设计正确（全部 Agent `objects_write_via_actions=[]`、`allowed_actions=[]`、写状态经 Named Action、Profile/Outcome 均在 forbidden 或 Human Gate 覆盖内，Perspective/Fact 有宪法约束）。
但存在若干阻断/中等级缺陷：模板必填字段大面积缺失、Human Gate 触发标签与 Policy 词表未对齐、引用的 `MINOR_SAFETY_POLICY` 文件不存在、Gate 结果枚举 6 值与 Policy `action` 词表不一致。修复后可升 PASS。

---

## 一、Agent Card 字段完整性

模板 `AGENT_CARD_TEMPLATE.yaml` 要求字段 20 项。逐 Agent 核查（✓=有，✗=缺，—=空数组即等于缺）:

| 字段 | FAMILY_COMPANION | PARENT_GROWTH | GROWTH_PLANNER | RELATIONSHIP | HUMAN_COPILOT |
|---|---|---|---|---|---|
| purpose | ✓ | ✓ | ✓ | ✓ | ✓ |
| target_users | ✓ | ✓ | ✓ | ✓ | ✓ |
| life_stages | ✓ | ✓ | ✓ | ✓ | ✓ |
| growth_domains | ✓ | ✓ | ✓ | ✓ | ✓ |
| objects_read | ✓ | ✓ | ✓ | ✓ | ✓ |
| objects_write_via_actions | —(空,合规) | —(空,合规) | —(空,合规) | —(空,合规) | —(空,合规) |
| decisions_supported | ✓ | ✓ | ✓ | ✓ | ✓ |
| evidence_required | ✓ | ✓ | ✓ | ✓ | ✓ |
| knowledge_sources | ✓ | ✓ | ✓ | ✓ | ✓ |
| models | ✓ | ✓ | ✓ | ✓ | ✓ |
| tools | ✓ | ✓ | ✓ | ✓ | ✓ |
| memory | ✓ | ✓ | ✓(缺 episodic 键) | ✓(缺 semantic 键) | ✓(缺 semantic 键) |
| allowed_actions | —(空) | —(空) | —(空) | —(空) | —(空) |
| forbidden_actions | ✓ | ✓ | ✓ | ✓ | ✓ |
| autonomy_level | ✓ AL1 | ✓ AL1 | ✓ AL2 | ✓ AL1 | ✓ AL2 |
| human_gate | ✓ | ✓ | ✓ | ✓ | ✓ |
| **safety_policy_refs** | ✓ | ✓ | **✗ 缺** | **✗ 缺** | **✗ 缺** |
| eval | ✓ | ✓ | ✓ | ✓ | ✓ |
| **owner** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **changelog** | **✗ 缺** | **✗ 缺** | **✗ 缺** | **✗ 缺** | **✗ 缺** |

问题:
- **[MEDIUM] P-01 changelog 全缺**（5/5）。模板要求 `changelog: []`，无一 Agent 提供。违反 C07 版本化精神。涉及文件: `agents/registry/*.yaml`。
- **[HIGH] P-02 safety_policy_refs 缺失 3 个**。GROWTH_PLANNER / RELATIONSHIP_COMPANION / HUMAN_COPILOT 无 `safety_policy_refs`。GROWTH_PLANNER 与 HUMAN_COPILOT 覆盖 CHILD 域、RELATIONSHIP_COMPANION 明确处理暴力/虐待信号，却未挂 safety 策略引用。涉及文件: 对应 3 个 `agents/registry/*.yaml`。
- **[LOW] P-03 memory 键不齐**。模板含 `session/episodic/semantic/formal_growth_state_read_only` 四键；GROWTH_PLANNER 缺 `episodic`，RELATIONSHIP/HUMAN_COPILOT 缺 `semantic`。默认值虽可推断，但静态校验应显式。

---

## 二、关键红线核查（11 项）

| # | 红线 | 结论 | 说明 |
|---|---|---|---|
| 1 | AI 直接改 GrowthProfile | **通过** | 全 Agent `objects_write_via_actions=[]`、`allowed_actions=[]`；FAMILY/PARENT/RELATIONSHIP/HUMAN_COPILOT 均在 forbidden 列写死 UpdateGrowthProfile/DirectProfileMutation。 |
| 2 | AI 直接 MeasureOutcome | **通过** | FAMILY_COMPANION forbidden 含 MeasureOutcome；Policy HG002 将 MEASURE_OUTCOME 归 MEDIUM+需人确认。 |
| 3 | 绕过 Human Gate | **通过（有隐患）** | 无 Agent 有可直接写核心状态的 action。隐患见第三节标签对齐问题。 |
| 4 | Recommendation/Decision/Action 混淆 | **通过** | 所有 `decisions_supported` 均为 Recommend*/Draft*/Explain*/Prioritize*，无直接 Decision/Action 动词；符合 CLAUDE.md B7。 |
| 5 | Perspective/Fact 混淆 | **通过** | Matrix「矛盾Perspective→人判断，不能自动变Fact」+ Policy HG006 覆盖；PARENT/RELATIONSHIP 读 Perspective 但无写 action。 |
| 6 | 高风险 Intervention 要求人 | **通过** | GROWTH_PLANNER forbidden=AssignHighRiskIntervention，human_gate=MEDIUM_OR_HIGH_RISK_INTERVENTION；Policy HG003 覆盖。 |
| 7 | Child 敏感数据规则 | **部分** | Policy HG007（child_sensitive_data_external_use→HIGH+Consent）存在且有 GrantConsent action。但覆盖 CHILD 域的 GROWTH_PLANNER/HUMAN_COPILOT 未挂 safety_policy_refs（见 P-02），child 保护策略未在卡片层显式绑定。 |
| 8 | clinical-like 请求 | **通过** | FAMILY forbidden=DiagnoseClinicalCondition + human_gate=CLINICAL_LIKE_REQUEST；PARENT/RELATIONSHIP forbidden=ClinicalDiagnosis；Matrix「临床诊断→不诊断/转介」。 |
| 9 | violence/abuse/self-harm 信号 | **通过** | Policy HG001 CRITICAL+ESCALATE_SAFETY+block_external_recommendation；RELATIONSHIP human_gate=VIOLENCE_OR_ABUSE_SIGNAL。 |
| 10 | AI confidence 低升级 | **部分** | Policy HG004（confidence<0.70→REQUIRE_HUMAN_REVIEW）存在于 Policy，但**无任何 Agent Card 在 human_gate.required_for 引用该触发**，卡片层无 LOW_CONFIDENCE 标签。 |
| 11 | Evidence 为空则 Abstain | **部分** | Policy HG005（evidence_count==0→ABSTAIN_OR_REQUIRE_HUMAN_REVIEW）+Matrix 存在；但各 Agent `evidence_required` 已列必需证据，卡片层未显式挂 EVIDENCE_EMPTY→Abstain 的 gate 标签。设计意图正确，落点仅在 Policy。 |

**红线总评**: 第 1-2、4-6、8-9 强通过；第 3、7、10、11 依赖 Policy 生效且卡片标签未对齐（见第三节），属可修的一致性缺陷，非设计错误。

---

## 三、Human Gate 校验

### 3.1 风险档与 Autonomy 映射（自洽）
Policy risk_levels: LOW(AL2)/MEDIUM(AL2)/HIGH(AL1)/CRITICAL(AL0,suspend)。Agent autonomy 全在 AL1/AL2，与各自最高风险场景相容（无 Agent 越过 CRITICAL 需 AL0 的约束）。**通过**。

### 3.2 Gate 结果枚举 vs Policy action 词表（**不一致**）
- Matrix「Gate结果」列 6 值: `ALLOW / ALLOW_WITH_CONFIRMATION / ABSTAIN / ESCALATE_DOMAIN / ESCALATE_EXPERT / ESCALATE_SAFETY`。
- Policy `triggers[].action` 却用另一套词: `ESCALATE_SAFETY_REVIEW / REQUIRE_DOMAIN_OR_AUTHORIZED_HUMAN_CONFIRMATION / REQUIRE_ADVISOR_CONFIRMATION / REQUIRE_HUMAN_REVIEW / ABSTAIN_OR_REQUIRE_HUMAN_REVIEW / REQUIRE_CONSENT_AND_HUMAN_REVIEW`。
- **[HIGH] G-01**: 两套动作词表无显式映射，机器无法把 Policy action 归约到 Matrix 6 个 Gate 结果。routing 队列名 SAFETY_REVIEW/DOMAIN_REVIEW/EXPERT_REVIEW 又是第三套命名。涉及文件: `policies/HUMAN_GATE_POLICY.yaml` + `policies/HUMAN_GATE_MATRIX.md`。

### 3.3 Agent human_gate 标签 vs Policy 触发条件（**未对齐**）
各 Agent `human_gate.required_for` 用自由文本标签（如 `HIGH_RISK_SIGNAL`、`PROFILE_CHANGE`、`PLAN_CONFIRMATION`、`ALL_EXTERNAL_CONTACT`、`REPEATED_CONFLICT_ESCALATION`），Policy 触发用结构化 `trigger_id`(HG001-007)/condition。二者无引用关系。
- **[HIGH] G-02**: `policy_refs: [HUMAN_GATE_POLICY]` 只指到文件级，未指到 trigger_id；标签词与 Policy condition 词不一致，无法静态验证覆盖。例: FAMILY 的 `PROFILE_CHANGE` 应映射 HG002，但无声明；HG004(低置信)/HG005(空证据)/HG006(冲突) 三触发无任何 Agent 卡片引用。
- **[MEDIUM] G-03**: 部分标签在 Policy 无对应触发: `REPEATED_CONFLICT_ESCALATION`(PARENT)、`PLAN_CONFIRMATION`(GROWTH_PLANNER)、`ALL_EXTERNAL_CONTACT`(HUMAN_COPILOT)。这些是真实需管控场景，但 Policy triggers 未列，存在覆盖盲区。

### 3.4 写操作覆盖度
所有 5 Agent `objects_write_via_actions=[]` 且 `allowed_actions=[]` → 无直接写；写状态只能经 `specs/actions/*`（现有 6 个 Named Action 均为家庭结构/Consent 类，无 Profile/Outcome 写 action 暴露给这些 Agent）。**写操作覆盖=通过**（当前无写面即无遗漏，符合 C02/C03）。

---

## 四、其它发现

- **[HIGH] X-01 引用文件缺失**: FAMILY_COMPANION 与 PARENT_GROWTH_COMPANION 引用 `MINOR_SAFETY_POLICY`，但 `policies/` 下只有 HUMAN_GATE_POLICY.yaml / HUMAN_GATE_MATRIX.md，无 MINOR_SAFETY_POLICY 文件。悬空引用。
- **[LOW] X-02 registry status 一致**: AGENT_REGISTRY.yaml 与各卡片 status 均 PLANNED，一致。
- **[LOW] X-03 eval blocking_metrics 不齐**: 仅 FAMILY_COMPANION 有 blocking_metrics(safety_recall/unsupported_claim_rate)，其余 4 只有 min_overall_score。FAMILY_SAFETY 套件被 4 Agent 引用却无统一 safety 阻断阈值。

---

## 五、问题清单（按级）

| ID | 级别 | 问题 | 涉及文件 | 建议 |
|---|---|---|---|---|
| P-02 | HIGH | safety_policy_refs 缺 3 个（含 CHILD 域） | GROWTH_PLANNER/RELATIONSHIP/HUMAN_COPILOT.yaml | 补 `safety_policy_refs: [MINOR_SAFETY_POLICY]` 或对应策略 |
| X-01 | HIGH | 引用的 MINOR_SAFETY_POLICY 文件不存在 | policies/ | 新建该策略文件（RFC），或改引用为已存在策略 |
| G-01 | HIGH | Gate 结果枚举 / Policy action / routing 队列 三套命名不映射 | HUMAN_GATE_POLICY.yaml, HUMAN_GATE_MATRIX.md | 在 Policy 增 `gate_result` 归约字段，把 action→6 值枚举对齐 |
| G-02 | HIGH | Agent human_gate 标签未引用 trigger_id；HG004/005/006 无卡片引用 | 5 registry + Policy | policy_refs 精确到 trigger_id；补低置信/空证据/冲突 gate 标签 |
| P-01 | MEDIUM | changelog 全缺 (5/5) | agents/registry/*.yaml | 每卡补 `changelog: []` 起始项 |
| G-03 | MEDIUM | 3 个 Agent 标签在 Policy 无对应触发（覆盖盲区） | HUMAN_GATE_POLICY.yaml | Policy 增 HG008+ 覆盖计划确认/外部联系/反复冲突升级 |
| P-03 | LOW | memory 键不齐 (3 卡) | GROWTH_PLANNER/RELATIONSHIP/HUMAN_COPILOT.yaml | 补齐四键显式声明 |
| X-03 | LOW | eval blocking_metrics 仅 1 卡有 | 4 registry | 为引用 FAMILY_SAFETY 的卡统一 safety 阻断阈值 |

---

## 六、结论

设计层面的核心安全护栏（无直写核心状态、Named Action Only、Profile/Outcome/Clinical/Safety 红线、Perspective≠Fact）均成立，因此 **VERDICT = CONDITIONAL_PASS**。
放行条件（建议全部作为 RFC 提交，不由本 Agent 修改契约）: 先清 4 项 HIGH（P-02 / X-01 / G-01 / G-02），使 Human Gate 三套命名对齐并让 HG004/005/006 在卡片层可校验、safety 策略引用不悬空；再清 2 项 MEDIUM。完成后可升 PASS。

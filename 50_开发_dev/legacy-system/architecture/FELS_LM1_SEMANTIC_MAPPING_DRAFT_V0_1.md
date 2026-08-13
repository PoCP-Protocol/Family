# FELS ↔ Family LM1 语义映射草稿 V0.1

```text
STATUS = DRAFT
STAGE = LM1_SEMANTIC_MAPPING_DRAFT_OVER_FELS_REFERENCE
CONFIRMED_AGAINST_REAL_BANGYANG_SOURCE = NO   (真实源 SUSPENDED_NOT_BLOCKED)
FAMILY_CANONICAL_WRITE = 0
AUTHORIZES_IMPORT = NO   (本文件仅为映射设计,不授权任何 shadow/pilot/canonical 导入)
```

> 依据:`migration/MIGRATION_CONSTITUTION.md`(LM0 允许 mapping drafts)、`migration/FLM_METHOD.md`、
> `reports/v3.1/02_FAMILY_LEGACY_MIGRATION_PROGRAM_V1_0.md`、`architecture/MIGRATION_MATRIX_COVERAGE.csv`(M001–M055 权威分层)、
> `architecture/FELS_TO_FAMILY_MAP.csv`(逐对象规则)。
> 本草稿把上述**扁平矩阵**按**榜样教育真实业务漏斗**重新组织,补入**波波校长 IP 角色**与**逐项红线检查**,
> 作为 FELS-2+ 未来获授权时正向拆分的蓝本。**它不确认针对真实邦阳源的映射**(宪法禁止),只在 FELS 参考实现上做设计。

---

## 0. 方法与口径

- **迁移是语义迁移,不是 ETL**。旧对象一律分类为 `TRANSFORM / MIGRATE / INTEGRATE / RETAIN_AND_REORGANIZE / RETIRE` 之一。
- **旧结论掉一级**:旧标签→Perspective/Annotation;旧测评分→Historical Evidence;旧 AI 诊断→Historical AI Hypothesis;旧打卡→Historical Action check-in。
- **证据口径**:榜样教育自家素材/产出上限 **E1**,不能自证;"打卡率高=成长"(P-04)是**高风险待验假设**,不得作为 Outcome 成立依据。
- **FELS 是旧世界的忠实参考实现**,泛化命名(非真实企业专名);其行/分/报告/结论**均非 Family 正典真相**。

---

## 1. 榜样教育真实业务漏斗 → FELS 实体 → Family 目标(逐阶段)

真实漏斗(证据 E1,源自战略白皮书 S1/S2 抽取):
**测评 → AI诊断/成长报告 → 购买 → 21天挑战 → 90天陪跑 → 顾问/助教(波波校长IP) → 社群/活动 → 会员/裂变**,外加"脏世界"(旧标签/分数/排行)。

### 阶段 A｜获客 / 触发(内容 · 线索 · 测评入口)
| 矩阵ID | FELS 实体 | 波波校长角色 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|---|
| M031 | CRM lead | "校长一分钟"内容触达 | Growth Discovery Content ref | INTEGRATE | EXTERNAL_INTEGRATION | 线索关系 ≠ Consent |
| M001 | CRM customer/lead | — | Family Account / Family 候选 | TRANSFORM | **IMPLEMENTED_FELS1** | customer_id ≠ family_id;同手机号不得自动并户 |
| M041 | lead/opportunity/customer | — | Family CRM View 源 | INTEGRATE | EXTERNAL_INTEGRATION | CRM 归 CRM,仅消费 external_ref |

### 阶段 B｜测评 → AI诊断 / 成长报告(**波波校长核心戏份**)
| 矩阵ID | FELS 实体 | 波波校长角色 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|---|
| M005 | assessment_session/report | 测评解读 | Assessment + Growth Onboarding 源 | TRANSFORM | **IMPLEMENTED_FELS1** | 测评分 ≠ GrowthState;报告需重解读 |
| M006 | legacy_ai_report | 波波校长式"AI诊断" | Growth Insight/Recommendation 候选 | TRANSFORM | PLANNED_FELS4 | **旧AI报告 ≠ 诊断 ≠ Fact**;掉级为 Historical AI Hypothesis |
| M007 / M044 | legacy_profile | — | GrowthProfile + Timeline 源 | TRANSFORM | PLANNED_FELS4 | 旧画像标签不得直接写 GrowthProfile |
| M026 | assessment_report/growth_report | — | Outcome Measurement Workflow 源 | TRANSFORM | PLANNED_FELS4 | 报告 ≠ Outcome;需 Evidence+测量窗口 |
| M029 | legacy_growth_report | 校长复盘 | Family Growth Review 源 | TRANSFORM | PLANNED_FELS4 | 报告是 Evidence Source,非唯一事实 |

### 阶段 C｜购买 / 交易
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|
| M037 | order | OrderRef | INTEGRATE | **IMPLEMENTED_FELS1** | 交易 ≠ 家庭承诺;Commerce Adapter |
| M038 | payment | PaymentRef | INTEGRATE | **IMPLEMENTED_FELS1** | 仅 commerce reference |
| M027 | order/membership | Next Growth Journey Decision 源 | TRANSFORM | PLANNED_FELS4 | 购买 ≠ Consent for GROWTH_TRACKING |

### 阶段 D｜21天挑战(任务 · 打卡)
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|
| M010 | training_program/task/checkin | 21-Day GrowthCycle 候选 | TRANSFORM | **PLANNED_FELS2** | Program ≠ Journey |
| M013 | legacy_task | GrowthAction history 候选 | TRANSFORM | **PLANNED_FELS2** | 旧任务 ≠ 活跃 Family Action |
| M014 | legacy_checkin | ActionCompletion Event 候选 | MIGRATE | **PLANNED_FELS2** | **打卡 ≠ Outcome**(P-04 高风险假设) |
| M015 | homework_review | HumanObservation/Feedback 候选 | TRANSFORM | PLANNED_FELS2 | 点评是 Perspective,非 Fact |

### 阶段 E｜90天陪跑(项目 · 顾问 · 群)
| 矩阵ID | FELS 实体 | 波波校长角色 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|---|
| M009 | training_program/enrollment | — | GrowthProgram 候选 | TRANSFORM | **PLANNED_FELS2** | ProgramCompleted ≠ Outcome |
| M011 | program/advisor_session/checkin | 90天陪跑主持 | 90-Day GrowthJourney 候选 | TRANSFORM | **PLANNED_FELS2** | 完课 ≠ 成长改善 |

### 阶段 F｜人服务:顾问 / 助教 / 波波校长 IP
| 矩阵ID | FELS 实体 | 波波校长角色 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|---|
| M018 | staff/advisor_session/advisor_note | 顾问 Copilot | Human Growth Advisor 候选 | RETAIN_AND_REORGANIZE | PLANNED_FELS4 | **AdvisorNote(校长解读) ≠ Fact**;Perspective≠Fact |
| M016 | staff/homework_review | 助教/陪伴 | Growth Companion + Copilot 源 | RETAIN_AND_REORGANIZE | PLANNED_FELS4 | 助教转成长陪伴,不代写核心事实 |
| M017/M019 | staff/service_case | — | Advisor / Expert Specialist 候选 | RETAIN_AND_REORGANIZE | PLANNED_FELS4 | 专家干预须进 Intervention Registry |
| M043 | advisor_note/service_case | — | ServiceInteraction/Perspective 源 | TRANSFORM | PLANNED_FELS4 | 服务文本掉级为 Perspective |
| M046 | legacy_ai_report | 家长第二成长陪练 | Parent Growth Companion 源 | TRANSFORM | PLANNED_FELS4 | 不得贴标签/不诊断/不承诺疗效 |
| M047 | legacy_ai_report | (后置) | Child Growth Companion 源 | TRANSFORM | PLANNED_FELS4 | 儿童 Agent 后置;未成年人边界 |
| M048/M049/M050 | legacy_ai_report/alert | Copilot/Planner/Mgmt | 各类 AI 源 | TRANSFORM/INTEGRATE | PLANNED_FELS4 / EXTERNAL | 全部 ≠ Fact,须掉级为 Hypothesis |
| M051 | legacy_alert | 安全触发 | Alert + Safety Gate 源 | TRANSFORM | PLANNED_FELS4 | 高风险(自伤/家暴/危机)必须 Human Gate |

> **波波校长 IP 语义纪律**(源 `FAMILI_DIGITAL_HUMAN_IP_CHARTER`):新世界的结构化响应含
> `empathy/facts/perspectives/hypotheses/next_action/observable_signal/human_gate`;FELS 承载的是**旧世界未规范版**
> (自由文本 advisor_note、无范围 AI 报告),FLM 的价值正是演示"旧→新"的规范化与掉级。

### 阶段 G｜社群 / 活动
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|
| M020/M032 | community/community_member | GrowthCommunity / Engagement 源 | INTEGRATE | EXTERNAL_INTEGRATION | **群成员 ≠ FamilyRelationship** |
| M021 | activity | FamilyActivity 候选 | TRANSFORM | **PLANNED_FELS3** | 活动须绑定 Journey/Outcome |
| M022 | activity | City Growth Network | INTEGRATE | EXTERNAL_INTEGRATION | — |

### 阶段 H｜会员 / 裂变
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|
| M012 | membership | Family Growth Membership | TRANSFORM | **PLANNED_FELS3** | 会员 ≠ Family state |
| M034 | membership | Membership Benefit | RETAIN_AND_REORGANIZE | PLANNED_FELS3 | 权益激励 OK,禁止分销/返佣 |
| M033 | membership | Growth Referral 源 | TRANSFORM | **PLANNED_FELS3** | 裂变须基于真实 Milestone,禁止焦虑/排名传播 |
| M030 | legacy_success_case | OutcomeCase 候选 | TRANSFORM | PLANNED_FELS4 | 案例须 Consent+去识别化,不宣称临床因果 |

### 阶段 I｜脏世界 / 淘汰(负向语义测试的核心诱饵)
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|
| M035 | legacy_profile.ranking | N/A | **RETIRE** | RETIRED | 家庭排行与价值观冲突,立即淘汰 |
| M036 | legacy_profile.family_score | 仅作 GrowthProfile States 源 | **RETIRE** | RETIRED | **不做 Family Total Score** |

### 阶段 J｜Family 新能力(旧世界没有,不可迁移,只作证据源)
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 | 红线检查 |
|---|---|---|---|---|---|
| M054 | audit_log | Causal Evidence Registry 源 | (new) | FAMILY_NEW_CAPABILITY | 无 Causal Episode 基础不训练 World Model |
| M055 | success_case/growth_report | CausalEpisode 候选 | (new) | FAMILY_NEW_CAPABILITY | 合成源不得判"成立" |

### 其他(内容/教务/治理)
| 矩阵ID | FELS 实体 | Family 目标 | 路线 | FELS 层 |
|---|---|---|---|---|
| M008 | course/lesson | Course+KnowledgeCard+Intervention 源 | TRANSFORM | **IMPLEMENTED_FELS1** |
| M023/M045 | course/lesson | Workflow / Knowledge Foundry 源 | RETAIN_AND_REORGANIZE | PLANNED_FELS4 |
| M039 | lesson | LearningSessionRef | INTEGRATE | EXTERNAL_INTEGRATION |
| M040 | class/enrollment/attendance | Program/Class Reference | INTEGRATE | **IMPLEMENTED_FELS1** |
| M002/M003/M004 | contact/student/student_guardian | Parent/Child/FamilyRelationship 候选 | TRANSFORM | **IMPLEMENTED_FELS1** |
| M052 | legacy_consent/agreement | Consent evidence 候选 | TRANSFORM | **IMPLEMENTED_FELS1** |
| M024/M025/M028/M042/M053 | service/CRM/governance | 各类 Workflow/Support/Timeline 源 | TRANSFORM/INTEGRATE | PLANNED_FELS4 / EXTERNAL |

---

## 2. 红线检查矩阵(9 条禁区 → FELS 载体 → 现状)

| 红线(禁止) | 旧业务里最容易犯的地方 | FELS 已内建的否定标记 | 现状 |
|---|---|---|---|
| Legacy label → Fact | 旧画像标签 | `LEGACY_*` semantic_classification | FELS-1 已验(H007=PASS) |
| Legacy score → Growth State | 测评分/family_score | `AssessmentScore != GrowthState` | FELS-1 已验 |
| Legacy AI report → Diagnosis | 波波校长式 AI 报告 | `LEGACY_ADVISOR_TEXT_NOT_FACT` | 负向测试存在(FELS-4 正式承载待授权) |
| Legacy check-in → Outcome | 21天打卡 | `LEGACY_CHECKIN_NOT_OUTCOME` | 早期表已建,QUARANTINE_PENDING |
| Course completion → growth | 完课率 | (映射规则 M009/M011) | 待 FELS-2 |
| Customer relationship → Consent | 历史客户关系 | `LegacyConsent != Family consent` | FELS-1 已验 |
| Group membership → FamilyRelationship | 社群成员 | `membership != FamilyRelationship` | 待 FELS-3 |
| Same phone → auto merge | 重复手机号 | dirty seed `duplicate_phone` 触发 review_flags | FELS-1 已验(标记待复核) |
| Minor data → AI training permission | 未成年人数据 | (Consent purpose 分离) | 待未成年人 SOP |

---

## 3. 开放问题(需总架构师裁决,见 `reports/FELS2_AUTHORIZATION_REQUEST.md`)

1. FELS-2(Program/Task/CheckIn/Advisor)是否授权正式开发?
2. 已 push 的早期 FELS-2/3 资产(camp/task/checkin/advisor/membership,`LOCAL_QUARANTINE_PENDING`)如何处置——正向拆分 revert 重建,还是就地转正?
3. FELS-4"脏世界"(legacy_ai_report/label/score/alert,承载红线诱饵的主体)优先级——是否先于 FELS-2 做,以尽早硬化 FLM 防腐?
4. 本草稿状态可否由 DRAFT 升为 LM1_MAPPING_REVIEWED(仅对 FELS 参考源;真实邦阳源仍 SUSPENDED)?

---

## 4. 授权边界(本文件遵守)

- 纯映射设计,Family 正典库写入 = 0,不授权任何导入。
- 不确认针对真实邦阳源的映射(真实源 SUSPENDED_NOT_BLOCKED)。
- FELS-2+ 代码 = NOT_AUTHORIZED;早期 FELS-2/3 资产保持冻结。

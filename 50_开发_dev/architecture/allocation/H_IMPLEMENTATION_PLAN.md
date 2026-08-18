# H · IMPLEMENTATION PLAN —— Allocation V1(运行时分期,过 Gate 后启动)

```text
RULING = FAMILY-ALLOCATION-V1-001 §19,§21–23
前置:A–G 经总架构师 Architecture Gate(§22)=PASS 后,方启动 Phase 1 运行时。
```

## Phase 0(本 PR)—— 架构冻结
A–G 工件 + 本计划。0 runtime、0 canonical、0 marketplace/payment/ML。等待 Gate review。

## Phase 1 —— 需求→意图→匹配(纯读 + 服务过程)
```text
- migration:need_signals / service_intents / service_candidates / service_recommendations(新表,不改 canonical)
- NeedUnderstanding:家长自述 → NeedSignal(source=MANUAL 起步;规则映射 need_type;NON_CANONICAL)
- ServiceIntent:家长确认端点
- Next Best Help:可解释规则排序(输入:life stage/intent/current GrowthPriority(只读投影)/active intervention/recent case/risk route/preference/availability;输出:recommended + ≤2 alts + why;NO_ACTION 合法)【禁 ML】
- 消费端 UI:need→confirm→≤3 候选(F);不暴露内部术语
验收:Journey 1 前半(到"给出候选,家长可选");单测覆盖规则 + NO_ACTION + 无诊断标签
```

## Phase 2 —— 选择→ServiceCase→交付→Follow-up→回流
```text
- migration:service_cases / service_contributions
- 家庭显式选择 → 创建 ServiceCase(固定枚举生命周期,非通用引擎)
- AI_COACH 交付复用 Principal(不新建 AI);NORMAL proposal 仍须家庭确认
- Follow-up 端点;Observation 仅经既有行动边界回流 Growth OS
- ServiceContribution 记录(AI_COACH/…);不结算
验收:Journey 1 全程 e2e(合成家庭);ServiceCase COMPLETED;Growth 事实经既有边界
```

## Phase 3 —— 连续性 + 人工升级
```text
- Context Reuse:授权范围内呈现"上次试过 X/记录 Y"(不断言因果)
- REVIEW→ServiceCase ESCALATED→Human Gate→回流;HIGH_RISK→安全路径优先
- Family Service Workspace 最小 case UI(接受/等待/升级/完成)
验收:Journey 2 + Journey 3;CONTEXT_REUSE / HUMAN_ESCALATION e2e
```

## Phase 4 —— 匿名需求聚合(prep only)+ 指标读模型
```text
- DemandCluster 只读聚合(匿名+阈值;count<阈值不暴露);无 provider marketplace UI
- 遥测事件 + 指标读模型(TIME_TO_USEFUL_HELP 等 6 项);禁 score/时长优化
验收:指标可算;DEMAND_RAW_FAMILY_EXPOSURE=0
```

## HOLD(不在本任务)
marketplace · 佣金/分账/payment · provider bidding · AI 自主派单 · ML 推荐 · 无限 feed · 裂变 · ranking · world model · 新 7B · 大组织多租户 · 成批新 dimension/intervention。

## 每步须过 PLATFORM_VALUE_TEST(四问)
```text
CHILD 给孩子长期利益什么? FAMILY 减少家庭什么成本? ALLOCATION 是否提高配置效率? COMPOUNDING 是否让下次更好?
四问答不出 → DO_NOT_BUILD。
```

## 与 PR #30 关系
PR #30(Entry Foundation:auth/session/首建家庭/默认入口/移除 URL 身份信任)**独立冻结**,不混入本域;各自 review、各自点名授权合并。

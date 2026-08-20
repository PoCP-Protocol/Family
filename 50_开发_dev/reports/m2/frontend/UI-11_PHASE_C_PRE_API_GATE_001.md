# UI-11 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-11 是成长排行榜/成长对比类页面。本文件只做 Broad Research、Needs Analysis、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation、视觉修复或动态代码开发。

## Research/Needs Summary

研究家庭教育场景中家庭如何观察自身成长节奏、获得鼓励和复盘，而不是被家庭排名或同龄比较驱动；角色包括家长、孩子、老师/教练、顾问、运营和 AI；baseline 为 `apps/web/public/bangyang-reference/ui18/growth-05-family-ranking.png`。Family/Person/GrowthProfile/Journey/Task/Reflection/Evidence/Consent/HumanGate 是候选 SSOT。需求分析必须分 User Need（自我回顾）、Business Need（安全激励）、Operational Need（历史投影）、Compliance Need（儿童和比较风险）、Data Need（family-scoped history）、AI Need（解释而非评分）。

30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，只作 Hypothesis/Design Input。Fact、Perspective、Hypothesis、Recommendation、Decision、Action 不混用。

## BA Design Summary

候选页面目标是展示家庭自身历史、阶段参与和可解释的进步线索。候选对象为 FamilyContext、Person、GrowthJourneyProjection、TaskProgress、Reflection、Evidence、HistoricalSelfComparison、ConsentGrant、HumanGateReview。禁止 Family Total Score、跨家庭 Ranking、同龄平均和“优秀/落后”事实化表达。

## Visual Fidelity Brief Summary

需对标 UI-11 原图中的标题、奖台/排名视觉、数字、标签、卡片、筛选、空态、风险提示和移动端布局；对任何排名视觉必须进行安全替换提案而非直接复刻为真实 ranking。当前无运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`GrowthJourneyProjection`、`TaskProgressProjection`、`Reflection`、`Evidence`、`HistoricalSelfComparison`、`ConsentGrant`、`HumanGateReview`。禁止创建 FamilyTotalScore、PeerRanking 或 AgeAverageFact。

## Read Projection vs Named Action Boundary

首轮只能读取 family-scoped historical projection。筛选、展开和时间范围是 Read Projection；保存个人复盘、隐藏比较提示或请求人工复核可作为候选 Named Action。任何排名、奖励、公开分享和跨家庭比较均需 Human Gate/External Effect HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter Boundary

家庭/儿童数据必须 Consent 和 family/subject scope；同龄比较、敏感标签和价值判断必须 Human Gate。AI 只能经 Model Gateway 解释个人历史，不生成排名或总分；核心状态经 Ontology Adapter 和 Named Action，禁止自由文本写入。

## Backend/API Dependency Candidates

候选：`FamilyGrowthHistoryProjectionService`、`SelfComparisonPolicy`、`ConsentPolicy`、`RankingSafetyPolicy`、`HumanGateReviewService`、`AuditService`、ModelGatewayAdapter、OntologyAdapter。仅为候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 原图的排名视觉是否必须改成家庭自身历史投影？
2. UI-11 是否完全禁止同龄平均、同城/同班级比较和 Family Total Score？
3. “成长值/奖台/名次”如何改写为可解释的过程状态？
4. 儿童和家庭成员可见性、Consent 与撤回如何处理？
5. 是否允许任何奖励/徽章 action，若允许由谁 Named Action 确认？
6. AI 解释如何确保不产生价值判断、诊断或排名？

## Required Tests/Screenshot Diff Preparation

需准备跨家庭访问拒绝、排名/总分字段拒绝、敏感标签 Human Gate、历史投影为空、Consent 缺失、时间筛选、个人复盘幂等、API/Web contract、Playwright desktop/mobile 和安全替换视觉 diff。当前无运行截图。

## Status

`HOLD_HUMAN_GATE`；本文件不授权 API Contract 或代码开发。

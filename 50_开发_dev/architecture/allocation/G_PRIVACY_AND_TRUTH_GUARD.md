# G · PRIVACY AND TRUTH GUARD —— Allocation V1

```text
RULING = FAMILY-ALLOCATION-V1-001 §1,§4,§6,§14,§22
```

## 1. Truth Guard(防语义污染)
```text
NeedSignal 是 NON_CANONICAL 推断:不写家庭真相、不构成诊断、不构成 GrowthPriority。
禁对孩子贴标签/诊断(CHILD_DEFIANT/PHONE_ADDICTED/LOW_SELF_CONTROL 等一律禁);need_type 只描述"要处理的情形"。
Recommendation ≠ Decision;ServiceRecommendation 不自动决策、不自动启动服务、不自动写 canonical。
AI 不能直接创建 GrowthPriority/GrowthAction;服务结果只经既有 Named Action 边界回流。
禁 Child Score / Family Score / ranking / 改善百分比 / 因果断言(沿用既有红线)。
```

## 2. 隐私与数据主权(FAMILY_SOVEREIGN / VALUE_BEFORE_DATA)
```text
家庭是数据主权主体;服务过程数据属家庭,不属专家/机构/AI。
真人/未来第三方进入家庭上下文须经 AccessGrant(范围+用途+可撤销+过期);默认最小可见,FAIL CLOSED。
不为数据资产要求用户填表;先给价值,服务自然产数据。
DemandCluster 仅【匿名 + 阈值】:无 family_id/subject_person_id/原始家庭文本;count<阈值 → NO_CLUSTER_EXPOSURE。
消费端不暴露内部对象术语(见 F)。
```

## 2b. Growth Fiduciary Principle(成长受托原则,最高伦理约束)
```text
资源推荐/编排优先维护孩子与家庭成长利益,而非平台收入最大化。
必须支持(即使平台 0 收入):NO_ACTION · 免费内容 · 最低成本方案 · 外部第三方资源 · 退出平台边界转介合格资源(如医疗风险 → 明确退出自身服务,转合格医疗)。
禁:制造需求 → 推付费产品 → 自赚;禁把平台收入置于孩子/家庭利益之上。
Next Best Help 排序须可审计地体现:更便宜/更轻/甚至"不做"在合适时应能排在付费之前。
```

## 3. 儿童利益优先(CHILD_INTEREST_FIRST)
```text
硬约束:Child Interest > Family Goal > Provider Interest > Platform Revenue。
推荐系统禁:为分佣多推专家 / 为成交制造焦虑 / 为留存不断说孩子有问题 / 优化观看时长。
Finite Feed:每日 ≤1–3;NO_ACTION 是合法首选。孩子不是被评价/打标签/交易的商品。
```

## 4. 安全
```text
HIGH_RISK:正常推荐管线停止,安全路径优先(既有 precheck 短路 + 转人工),不给普通建议。
REVIEW:ServiceCase 升级至真人;授权上下文投影;结果回家庭 Journey。
```

## 5. Gate 校验点(§22 摘要)
```text
CHILD_INTEREST_FIRST=PASS · FAMILY_SOVEREIGN=PASS
NEED_SIGNAL_CANONICAL_WRITE=0 · DIAGNOSIS_LABELING=0
RECOMMENDATION_AUTO_DECISION=0 · RECOMMENDATION_AUTO_ACTION=0 · NO_ACTION_SUPPORTED=PASS
CONTEXT_REUSE=DESIGNED · SERVICE_CASE=DESIGNED · HUMAN_ESCALATION=DESIGNED
DEMAND_RAW_FAMILY_EXPOSURE=0 · ML_RECOMMENDER=0 · MARKETPLACE_SCOPE=0 · PAYMENT_SCOPE=0 · CANONICAL_DUPLICATION=0
```

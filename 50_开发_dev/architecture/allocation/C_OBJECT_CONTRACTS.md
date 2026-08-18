# C · OBJECT CONTRACTS —— Allocation V1 最小对象契约

```text
RULING = FAMILY-ALLOCATION-V1-001 §2–9
说明:仅契约(字段/状态/不变量),非迁移。运行时落地须过 Gate;每对象一显式表(禁 EAV)。
truth_type 标注:NON_CANONICAL(服务过程) vs CANONICAL(家庭真相,本域不产)。
```

## NeedSignal(NON_CANONICAL 推断)
```text
signal_id, family_id, subject_person_id, source(WAF|PRINCIPAL|ONBOARDING|MANUAL),
raw_ref(指向来源;不复制原文到聚合层), inferred_need_type, confidence(0–1), created_at
不变量:canonical_family_fact=false;不含诊断/标签;不写 Growth 真相。
```

## ServiceIntent(NON_CANONICAL 服务请求;家长确认后)
```text
intent_id, family_id, subject_person_id, need_type, goal_text(家长自述,如"今晚怎么重新开口"),
status(OPEN|FULFILLED|CANCELLED), confirmed_by, confirmed_at
不变量:≠GrowthPriority、≠Family Fact、≠诊断;必须由家长显式确认才存在。
```

## ServiceCandidate(供给的统一描述)
```text
candidate_id, type(NO_ACTION|CONTENT|PRACTICE|AI_COACH|MICRO_PROGRAM|COACH|EXPERT),
capability, age_scope, need_scope, risk_limit, evidence_refs[](适用时), availability, cost_class
不变量:NO_ACTION 是一等候选;EXPERT/COACH 为真人角色;cost 仅分级,无真实支付。
```

## ServiceRecommendation(Recommendation ≠ Decision)
```text
recommendation_id, intent_id, candidate_id, why_this, why_now, limitations, alternatives[](≤2),
status(SHOWN|ACCEPTED|ALTERNATIVE_SELECTED|DISMISSED)
不变量:不自动决策、不自动启动服务;由可解释规则产生(见 E)。
```

## ServiceCase(家庭选择后才创建)
```text
case_id, family_id, subject_person_id, intent_id, selected_service(candidate_id),
status(OPEN|ASSIGNED|IN_PROGRESS|WAITING_FAMILY|COMPLETED|ESCALATED|CANCELLED),
owner, opened_at, next_action_at, sla_class, escalation_level, closed_at
不变量:仅家庭显式选择创建;非通用 workflow 引擎(固定枚举生命周期)。
```

## ServiceContribution(记录贡献,不分钱)
```text
case_id, provider_ref, role(AI_COACH|DELIVERY_ASSISTANT|GROWTH_COACH|EXPERT),
task_ref, started_at, completed_at, quality_state
不变量:无 compensation/commission/payment split;仅记录"谁在此 case 贡献了什么"。
```

## DemandCluster(只读匿名聚合)
```text
age_band, need_type, scenario, count, time_window
不变量:无 family_id/subject_person_id/原始家庭文本;count < 阈值 → NO_CLUSTER_EXPOSURE。
```

## 与既有对象的引用(读,不复制)
```text
family_id/subject_person_id → Family Core(persons/families)
匹配可读:current GrowthPriority、active Intervention、recent OutcomeObservation(经授权投影)——只读,不写、不复制其真相。
AI_COACH 交付 → 复用 Principal(既有 handleMessage/Human Gate),不新建 AI。
```

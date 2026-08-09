# TASK-107_FAMILY_CORE_INTEGRATION

status: APPROVED_AFTER_TASK_106_PASS

## Goal
证明M1 Family Core完整运行。

## Required Flow

```text
CreateFamily
→ AddParent
→ AddChild
→ CreateFamilyRelationship(PARENT_CHILD)
→ AssignLifeStage(EARLY_ADOLESCENCE_12_15)
→ GrantConsent(SERVICE)
→ GetFamilyAggregate
```

## Acceptance Criteria
1. 从空数据库可完成完整流程。
2. Aggregate包含成员、关系、LifeStage、Consent摘要。
3. 每个写步骤存在Audit。
4. 每个写步骤存在对应Domain Event。
5. correlation chain可追踪。
6. 重复关键请求不造成重复数据。
7. 未授权读取失败。
8. 不存在GrowthProfile、AI、Journey的隐式副作用。

## Output
- integration/e2e test
- `reports/M1_FAMILY_CORE_REPORT.md`

## Gate
报告通过后，人类才能把项目Milestone推进到：
`M2_GROWTH_STATE_RUNNING`

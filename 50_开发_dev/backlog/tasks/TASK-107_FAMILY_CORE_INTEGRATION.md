# TASK-107_FAMILY_CORE_INTEGRATION

status: PASS

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

## Completion Evidence

- `apps/api/src/modules/family/family-core-integration.e2e-spec.ts`
- `reports/task-107/IMPLEMENTATION_PLAN_FINAL.md`
- `reports/task-107/INDEPENDENT_ARCHITECTURE_REVIEW.md`
- `reports/TASK-107_FAMILY_CORE_INTEGRATION_GATE.md`
- `reports/M1_FAMILY_CORE_REPORT.md`
- `reports/m2/M2_FIRST_GROWTH_VERTICAL_SLICE_PLAN.md` planning only

## Validation

- `node tools/validate-contracts.mjs` PASS
- `pnpm lint` PASS
- `pnpm typecheck` PASS
- `pnpm build` PASS
- `TEST_DATABASE_URL=postgres://family:***@localhost:55433/family_gate pnpm test:required` PASS

## Gate
TASK-107 PASS closes M1 Family Core Running. M2 implementation still requires explicit human approval.

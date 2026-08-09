# TASK-105_ASSIGN_LIFE_STAGE

status: PASS
action: AssignLifeStage

## Goal
实现 `AssignLifeStage` Named Action。

## Must Read
- /CLAUDE.md
- /CURRENT_SPRINT.md
- /specs/ontology/life_stage.schema.yaml
- /specs/actions/AssignLifeStage.action.yaml
- /specs/policies/core-state-write.policy.yaml
- 对应event spec
- 当前相关代码

## Implementation Rules
1. 只实现本Action和必要的最小支撑代码。
2. 必须Schema validate。
3. 必须有correlation_id / actor context。
4. 必须写Audit。
5. 必须发Domain Event。
6. 重要写操作必须按Action Contract实现幂等策略。
7. 不得实现out-of-scope业务。

## Acceptance Criteria
AC1 only EARLY_ADOLESCENCE_12_15 supported in V1
AC2 child must belong to Family
AC3 prior active assignment is closed/versioned
AC4 event/audit exist
AC5 AI cannot invent new LifeStage

## Required Tests
- Unit
- Integration
- Invalid schema
- Permission/precondition
- Idempotency where applicable
- Audit/event assertion

## Done
- All AC PASS
- tests PASS
- lint/build PASS
- PROJECT_STATUS updated
- stop after this task

## Gate Evidence

- `reports/task-105/IMPLEMENTATION_PLAN_FINAL.md`
- `reports/task-105/TASK-105_ASSIGN_LIFE_STAGE_GATE.md`
- `pnpm --filter @family/contracts build`: PASS
- `pnpm --filter @family/api typecheck`: PASS
- `pnpm --filter @family/api lint`: PASS
- `node tools/validate-contracts.mjs`: PASS, 48/48
- `pnpm --filter @family/api build`: PASS
- `TEST_DATABASE_URL=postgres://family:***@localhost:55433/family_gate pnpm --filter @family/api test:required`: PASS

## Transition

- READY_FOR_TASK_106: YES
- TASK-106 implementation started: NO
- Do not implement TASK-106 without explicit authorization.

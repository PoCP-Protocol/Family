# TASK-103_ADD_CHILD

status: PASS
action: AddChild

## Goal
实现 `AddChild` Named Action。

## Must Read
- /CLAUDE.md
- /CURRENT_SPRINT.md
- /specs/ontology/child.schema.yaml
- /specs/actions/AddChild.action.yaml
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
AC1 child is linked to Family
AC2 birth_date is optional and validated
AC3 unauthorized actor fails
AC4 event/audit exist
AC5 no clinical/growth label is inferred

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

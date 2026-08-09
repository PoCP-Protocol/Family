# TASK-104_CREATE_RELATIONSHIP

status: APPROVED_AFTER_PREVIOUS_TASK_PASS
action: CreateFamilyRelationship

## Goal
实现 `CreateFamilyRelationship` Named Action。

## Must Read
- /CLAUDE.md
- /CURRENT_SPRINT.md
- /specs/ontology/family_relationship.schema.yaml
- /specs/actions/CreateFamilyRelationship.action.yaml
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
AC1 both members must belong to same Family
AC2 self-relationship fails
AC3 relationship enum validated
AC4 duplicate idempotent request does not duplicate
AC5 event/audit exist

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

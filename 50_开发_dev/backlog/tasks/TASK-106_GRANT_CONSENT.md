# TASK-106_GRANT_CONSENT

status: PASS
action: GrantConsent

## Goal
实现 `GrantConsent` Named Action。

## Must Read
- /CLAUDE.md
- /CURRENT_SPRINT.md
- /specs/ontology/consent.schema.yaml
- /specs/actions/GrantConsent.action.yaml
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
AC1 subject and guardian belong to same Family
AC2 guardian authorization validated
AC3 purpose-specific record is created
AC4 SERVICE does not create MODEL_IMPROVEMENT consent
AC5 event/audit exist
AC6 policy_version mandatory

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

## Completion Evidence

- Gate report: `reports/TASK-106_GRANT_CONSENT_GATE.md`
- Final implementation plan: `reports/task-106/IMPLEMENTATION_PLAN_FINAL.md`
- DTO unit: PASS, 6/6
- GrantConsent integration: PASS, 6/6 on real PostgreSQL
- GrantConsent HTTP E2E: PASS, 5/5 on real PostgreSQL
- Full required gate: PASS, unit 25/25, integration 29/29, e2e 35/35
- Contract validation: PASS, total 49, failed 0
- Lint/typecheck/build/test:required: PASS
- READY_FOR_TASK_107: YES
- TASK-107 implementation started: NO

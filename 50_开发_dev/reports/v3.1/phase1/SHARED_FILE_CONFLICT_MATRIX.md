# V3.1 Phase 1A Shared File Conflict Matrix

date: 2026-08-10
owner: AI-00 Integration / Architecture Lead
branch: wave/m2-wave2-integration
head: 5ccce44c27af9262f8e0e1fec206019d8569c474

## Verdict

SHARED_FILE_CONFLICT_MATRIX = PASS
CONCURRENT_SHARED_EDITS_ALLOWED = NO
INTEGRATION_HOOK_REQUEST_REQUIRED = YES

This matrix freezes ownership for V3.1 Convergence Round A. It does not redefine roles; it applies the Chief Architect's frozen V3.1 role responsibilities.

## Role Ownership

| Area | Primary Owner | Secondary Review | Concurrent Edits | Rule |
|---|---|---|---:|---|
| PROJECT_STATUS.md | AI-00 | AI-07 | NO | Current-state SSOT only; do not rewrite historical reports. |
| CURRENT_ARCHITECT_STATE.yaml | AI-00 | AI-07 | NO | Must reflect Phase0 closed, Phase1 authorized, Wave3 not authorized. |
| CURRENT_SPRINT.md | AI-00 | AI-07 | NO | Must distinguish implemented/integrated/user-demoed. |
| PLAN_SSOT / ADR Registry | AI-00 | AI-07 | NO | Architecture lead owns sequencing and final gate. |
| specs/ontology/** | AI-01 | AI-03, AI-07 | NO | Domain semantics first; no ontology convenience changes for migration. |
| specs/actions/** | AI-01 | AI-02, AI-07 | NO | Named Action contracts only; no speculative actions. |
| specs/events/** | AI-01 | AI-05, AI-07 | NO | Event truthfulness and outbox/audit separation required. |
| specs/interventions/** | AI-01 | AI-02, AI-07 | NO | Intervention-001 SSOT only; no intervention platform. |
| apps/api/src/modules/family/growth-subject.resolver.ts | AI-02 | AI-00, AI-07 | NO | Reuse if behavior is correct; no rename for elegance. |
| GrowthContextResolver / GrowthSafetyGate boundary | AI-02 | AI-06, AI-07 | NO | Server-derived safety authority required. |
| apps/api/src/modules/family/growth-priority.service.ts | AI-02 | AI-01, AI-03 | NO | Priority context/safety semantics; contract changes through CCR. |
| apps/api/src/modules/family/intervention.service.ts | AI-02 | AI-01, AI-03 | NO | Start intervention and exactly 7 actions. |
| apps/api/src/modules/family/growth-action.service.ts | AI-02 | AI-01, AI-06 | NO | Check-in semantics; Action != Outcome. |
| apps/api/src/modules/family/*.dto.ts | AI-02 | AI-03 | NO | Runtime DTO truth; align with OpenAPI/TS contracts. |
| database/migrations/** | AI-03 | AI-05, AI-07 | NO | Real PostgreSQL chain controls truth. |
| specs/api/** | AI-03 | AI-01, AI-05 | NO | Runtime truth only; no advertised future Wave3 capability. |
| packages/contracts/** | AI-03 | AI-01, AI-04 | NO | Align with machine specs, OpenAPI, runtime DTOs. |
| apps/web/** | AI-04 | AI-05, AI-07 | NO | Fixture default-off; real API path required. |
| apps/api/src/modules/family/family-wave2.e2e-spec.ts | AI-05 | AI-02, AI-03 | NO | No SQL-created business state to fake flow. |
| apps/api/src/test/** | AI-05 | AI-03 | NO | Real PG harness and test isolation. |
| CI workflow files | AI-05 | AI-00 | NO | Minimum CI only; no deployment/Kubernetes expansion. |
| consent/safety/human gate policy docs/specs | AI-06 | AI-02, AI-07 | NO | Purpose isolation and safety escalation governance. |
| reports/v3.1/phase1/AI07_INDEPENDENT_REVIEW.md | AI-07 | AI-00 | NO | Starts only after barriers 1-6. |
| apps/api/src/modules/family/family.controller.ts | AI-00 | AI-02, AI-03, AI-05 | NO | Shared orchestration; integration hook required. |
| apps/api/src/modules/family/family.module.ts | AI-00 | AI-02, AI-05 | NO | Shared provider wiring; integration hook required. |

## Active Changed File Ownership

| PATH | Current Owner | Requires Hook From | Conflict Risk | Handling |
|---|---|---|---|---|
| 50_开发_dev/apps/api/src/modules/family/family.controller.ts | AI-00 | AI-02/AI-03/AI-05 | HIGH | AI-00 serializes route-level changes. |
| 50_开发_dev/apps/api/src/modules/family/family.module.ts | AI-00 | AI-02/AI-05 | HIGH | AI-00 serializes provider wiring. |
| 50_开发_dev/apps/api/src/modules/family/growth-priority.service.ts | AI-02 | AI-01/AI-03 | HIGH | AI-02 owns implementation; AI-01/AI-03 submit contract/data hooks. |
| 50_开发_dev/apps/api/src/modules/family/intervention.service.ts | AI-02 | AI-01/AI-03 | HIGH | AI-02 owns implementation; Intervention-001 SSOT changes go through AI-01. |
| 50_开发_dev/apps/api/src/modules/family/growth-action.service.ts | AI-02 | AI-01/AI-06 | HIGH | AI-02 owns implementation; event naming/CCR through AI-01. |
| 50_开发_dev/apps/api/src/modules/family/family-wave2.e2e-spec.ts | AI-05 | AI-02/AI-03 | HIGH | AI-05 owns E2E; service/data setup hooks allowed by request only. |
| 50_开发_dev/apps/web/index.html | AI-04 | AI-05 | MEDIUM | AI-04 owns; browser validation feedback via hook. |
| 50_开发_dev/apps/web/src/app.js | AI-04 | AI-05 | HIGH | AI-04 owns runtime UX flow; no fake fallback. |
| 50_开发_dev/apps/web/src/wave2.js | AI-04 | AI-05 | HIGH | AI-04 owns adapter; AI-05 validates real browser path. |
| 50_开发_dev/apps/web/tools/serve-static.mjs | AI-04 | AI-05 | MEDIUM | AI-04 owns dev server; AI-05 can request test-serving changes. |
| 50_开发_dev/reports/m2/wave2/VALIDATION_EVIDENCE.md | AI-05 | AI-00 | MEDIUM | AI-05 writes evidence; AI-00 final gate consumes. |
| 50_开发_dev/reports/m2/wave2/BROWSER_DEMO_EVIDENCE.md | AI-05 | AI-04 | MEDIUM | AI-05 owns evidence, AI-04 supplies demo facts. |
| 50_开发_dev/reports/m2/wave2/integration/INTEGRATION_DASHBOARD.md | AI-00 | AI-01..AI-06 | HIGH | AI-00 updates only from role reports. |

## Integration Hook Request Format

Any role needing a shared file must submit this before editing:

```text
INTEGRATION_HOOK_REQUEST
REQUESTING_ROLE = AI-XX
TARGET_FILE =
WHY_SHARED_FILE_REQUIRED =
PROPOSED_CHANGE_SUMMARY =
DEPENDENT_LOCAL_GATE =
RISK_IF_NOT_CHANGED =
ROLLBACK_PLAN =
```

## Barrier Mapping

| Barrier | Required Owners | Status |
|---|---|---|
| BARRIER-1 WORKTREE + OWNERSHIP | AI-00 | PASS |
| BARRIER-2 SEMANTIC CONTRACT | AI-01, AI-02, AI-03 | NOT_STARTED |
| BARRIER-3 RUNTIME | AI-04 plus AI-00 route wiring | NOT_STARTED |
| BARRIER-4 REAL SYSTEM | AI-05, AI-03 | NOT_STARTED |
| BARRIER-5 REAL PRODUCT | AI-04, AI-05 | NOT_STARTED |
| BARRIER-6 GOVERNANCE | AI-06 | NOT_STARTED |
| AI-07 INDEPENDENT REVIEW | AI-07 | BLOCKED_UNTIL_BARRIER_1_6_PASS |

## Decision

BARRIER-1 is satisfied for planning purposes:

- WORKTREE_CLASSIFIED = PASS
- SHARED_FILE_CONFLICT_MATRIX = PASS
- UNKNOWN_FILES = 0
- SAFE_TO_START_PARALLEL_WORK = YES, constrained by this ownership matrix

Next authorized start: AI-01 and AI-02 may begin after accepting shared-file rules. AI-03 may prepare by audit, but data/API changes should follow AI-01/AI-02 semantic contract inputs.
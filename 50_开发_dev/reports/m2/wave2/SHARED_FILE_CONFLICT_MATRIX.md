# M2 Wave 2 Shared File Conflict Matrix

status: FROZEN_FOR_PARALLEL_WORK
wave: M2_WAVE_2_DECIDE_AND_ACT
date: 2026-08-10
phase: PHASE_A_CONTRACT_FREEZE

## 1. Purpose

This matrix freezes file ownership for parallel Wave 2 implementation. It prevents multiple roles from writing the same shared files without an explicit integration owner.

Rules:

- Every `SHARED_WRITE` file has exactly one write owner.
- Non-owners may read shared files and propose changes through the owner.
- Cross-role changes must be integrated through AI-00 or the listed owner.
- No role may widen Wave 2 beyond `M2_WAVE2_CONTRACT_FREEZE.md`.
- No role may implement AI, score, ranking, outcome, milestone, GrowthReview, causal/world-model, or 90-day journey behavior in Wave 2.

## 2. Role Definitions

| Role | Responsibility |
|---|---|
| AI-00 | Integration coordinator, branch hygiene, conflict resolution, final gate. |
| AI-01 | M2-104 GrowthPriority backend/domain implementation. |
| AI-02 | M2-105 Intervention-001, StartIntervention, GrowthAction, CompleteGrowthAction backend/domain implementation. |
| AI-03 | Shared contracts, database migrations, schema alignment. |
| AI-04 | Family Web F06/F07/F08/F09 and F01 action-state update. |
| AI-05 | Integration, HTTP E2E, browser/demo runbook, final Wave 2 evidence. |

## 3. Ownership Categories

| Category | Meaning |
|---|---|
| `AI01_ONLY` | Only AI-01 may write. Others read only. |
| `AI02_ONLY` | Only AI-02 may write. Others read only. |
| `AI03_ONLY` | Only AI-03 may write. Others read only. |
| `AI04_ONLY` | Only AI-04 may write. Others read only. |
| `AI05_ONLY` | Only AI-05 may write. Others read only. |
| `SHARED_READ` | All roles may read; no role writes during Phase B unless reclassified. |
| `SHARED_WRITE` | Shared implementation surface with exactly one write owner. |
| `INTEGRATION_ONLY` | AI-00 writes after role outputs are ready, or under explicit conflict resolution. |

## 4. Shared Write Matrix

| File / Path | Category | Write Owner | Other Roles | Notes |
|---|---|---|---|---|
| `packages/contracts/src/index.ts` | `SHARED_WRITE` | AI-03 | AI-01/02/04/05 read | Contract additions for priority, intervention, action, events, API DTOs. |
| `database/migrations/0008_m2_wave2_priority_intervention_action.sql` | `SHARED_WRITE` | AI-03 | AI-01/02/05 read | Additive migration only. No destructive migration. |
| `apps/api/src/modules/family/confirm-growth-priority.dto.ts` | `SHARED_WRITE` | AI-03 | AI-01 consumes | DTO file owned by contracts/schema role. |
| `apps/api/src/modules/family/start-intervention.dto.ts` | `SHARED_WRITE` | AI-03 | AI-02 consumes | DTO file owned by contracts/schema role. |
| `apps/api/src/modules/family/complete-growth-action.dto.ts` | `SHARED_WRITE` | AI-03 | AI-02 consumes | DTO file owned by contracts/schema role. |
| `apps/api/src/modules/family/family.controller.ts` | `SHARED_WRITE` | AI-00 | AI-01/02/03/05 propose | Controller routes integrate both M2-104 and M2-105; AI-00 owns final merge surface. |
| `apps/api/src/modules/family/family.module.ts` | `SHARED_WRITE` | AI-00 | AI-01/02 propose | Provider registration integration only. |
| `apps/api/src/modules/family/family.service.ts` | `SHARED_WRITE` | AI-00 | AI-01/02 propose patches | Existing monolithic service is high-conflict; AI-00 owns final integration if shared service remains necessary. Prefer new helper services where possible. |
| `apps/api/src/modules/family/family.service.integration.spec.ts` | `SHARED_WRITE` | AI-05 | AI-01/02 propose test cases | Integration suite is final cross-flow evidence. |
| `apps/api/src/modules/family/family.e2e-spec.ts` | `SHARED_WRITE` | AI-05 | AI-01/02/04 propose | HTTP E2E validates full Wave 2 path. |
| `apps/web/src/app.js` | `SHARED_WRITE` | AI-04 | AI-01/02/03/05 read | F01/F06/F07/F08/F09 Web implementation. |
| `apps/web/src/app.spec.ts` | `SHARED_WRITE` | AI-04 | AI-05 may request assertions | Web unit tests for Chinese UI and forbidden claims. |
| `apps/web/src/styles.css` | `SHARED_WRITE` | AI-04 | All read | UI styling only. |
| `reports/m2/wave2/M2_WAVE2_GATE.md` | `INTEGRATION_ONLY` | AI-00 | AI-05 supplies evidence | Final gate report after implementation and review. |
| `reports/m2/demo/M2_WAVE2_REAL_DEMO_RUNBOOK.md` | `SHARED_WRITE` | AI-05 | AI-04 supplies UI flow | Demo evidence and runbook. |

## 5. AI-01 Only Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `apps/api/src/modules/family/growth-priority.service.ts` | `AI01_ONLY` | AI-01 | Deterministic priority proposal and confirmation logic. |
| `apps/api/src/modules/family/growth-priority.policy.ts` | `AI01_ONLY` | AI-01 | No score/ranking; one primary priority; supports `NO_PRIORITY_YET`. |
| `apps/api/src/modules/family/growth-priority.service.spec.ts` | `AI01_ONLY` | AI-01 | Unit tests for deterministic priority policy. |
| `reports/m2/task-104/M2_104_IMPLEMENTATION_PLAN.md` | `AI01_ONLY` | AI-01 | Required task plan before code if task is assigned. |

## 6. AI-02 Only Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `apps/api/src/modules/family/intervention.service.ts` | `AI02_ONLY` | AI-02 | `StartIntervention`, active intervention instance, action generation. |
| `apps/api/src/modules/family/intervention.policy.ts` | `AI02_ONLY` | AI-02 | Eligibility for `LISTEN_BEFORE_RESPOND` only. |
| `apps/api/src/modules/family/growth-action.service.ts` | `AI02_ONLY` | AI-02 | `CompleteGrowthAction` and action status transitions. |
| `apps/api/src/modules/family/growth-action.policy.ts` | `AI02_ONLY` | AI-02 | Status enum and reflection boundary. |
| `apps/api/src/modules/family/intervention.service.spec.ts` | `AI02_ONLY` | AI-02 | Unit tests for start/generation policy. |
| `apps/api/src/modules/family/growth-action.service.spec.ts` | `AI02_ONLY` | AI-02 | Unit tests for completion policy. |
| `reports/m2/task-105/M2_105_IMPLEMENTATION_PLAN.md` | `AI02_ONLY` | AI-02 | Required task plan before code if task is assigned. |

## 7. AI-03 Only Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `reports/m2/wave2/M2_WAVE2_CONTRACT_FREEZE.md` | `AI03_ONLY` | AI-03 | Contract changes require explicit user/architect approval after Phase A. |
| `reports/m2/wave2/SHARED_FILE_CONFLICT_MATRIX.md` | `AI03_ONLY` | AI-03 | Ownership changes require explicit approval. |
| `packages/contracts/src/*.ts` except `index.ts` if introduced | `AI03_ONLY` | AI-03 | Keep shared contracts centralized. |
| `database/migrations/*.sql` for Wave 2 | `AI03_ONLY` | AI-03 | Additive migrations only; no rollback/destructive operations. |

## 8. AI-04 Only Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `apps/web/src/wave2*.js` if introduced | `AI04_ONLY` | AI-04 | Optional UI decomposition if static Web remains. |
| `apps/web/src/*priority*.js` if introduced | `AI04_ONLY` | AI-04 | UI-only helper code. |
| `apps/web/src/*intervention*.js` if introduced | `AI04_ONLY` | AI-04 | UI-only helper code. |
| `reports/m2/frontend/F06_F09_UI_NOTES.md` | `AI04_ONLY` | AI-04 | Optional frontend implementation notes. |

## 9. AI-05 Only Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `reports/m2/wave2/VALIDATION_EVIDENCE.md` | `AI05_ONLY` | AI-05 | Test command outputs and evidence summary. |
| `reports/m2/wave2/BROWSER_DEMO_EVIDENCE.md` | `AI05_ONLY` | AI-05 | Browser demo observations if separate from runbook. |
| `apps/api/src/modules/family/*wave2*.e2e-spec.ts` if introduced | `AI05_ONLY` | AI-05 | Additional E2E only if needed. |

## 10. Shared Read Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `50_开发_dev/CLAUDE.md` | `SHARED_READ` | none | Constitution; do not edit during Wave 2 implementation. |
| `50_开发_dev/docs/M2_VERTICAL_SLICE_DELIVERY_STANDARD.md` | `SHARED_READ` | none | Delivery standard. |
| `50_开发_dev/reports/m2/M2_GROWTH_DOMAIN_MODEL.md` | `SHARED_READ` | none | Domain chain baseline. |
| `50_开发_dev/reports/m2/M2_FRONTEND_BACKEND_CONTRACT_MATRIX.md` | `SHARED_READ` | none | Screen/API baseline; Wave 2 freeze supersedes only where explicit. |
| `50_开发_dev/reports/m2/M2_SAFETY_CONSENT_GATE.md` | `SHARED_READ` | none | Consent/safety baseline. |
| `50_开发_dev/reports/m2/M2_SCREEN_MAP.md` | `SHARED_READ` | none | F01-F12 screen baseline. |
| `50_开发_dev/reports/m2/task-103/M2_103_GATE.md` | `SHARED_READ` | none | Wave 1 closed gate; do not revise as part of Wave 2. |
| `50_开发_dev/reports/m2/task-103/M2_103_IMPLEMENTATION_PLAN.md` | `SHARED_READ` | none | Evidence/Profile boundary reference. |

## 11. Integration-Only Files

| File / Path | Category | Write Owner | Notes |
|---|---|---|---|
| `50_开发_dev/PROJECT_STATUS.md` | `INTEGRATION_ONLY` | AI-00 | Update only after user-approved task completion. |
| `50_开发_dev/CURRENT_SPRINT.md` | `INTEGRATION_ONLY` | AI-00 | Do not alter sprint authority without explicit approval. |
| `50_开发_dev/reports/m2/wave2/M2_WAVE2_GATE.md` | `INTEGRATION_ONLY` | AI-00 | Final gate only. |
| `50_开发_dev/reports/m2/demo/M2_WAVE2_REAL_DEMO_RUNBOOK.md` | `INTEGRATION_ONLY` | AI-05 primary, AI-00 final | Final demo flow after all implementation lands. |

## 12. Conflict Resolution Protocol

When a role needs a non-owned file:

1. Stop local edits to that file.
2. Write the requested change as a short proposal in the task report or handoff note.
3. Notify AI-00 or the write owner.
4. Owner applies the change or rejects it with reason.
5. Re-run the narrow validation for the touched slice.

When two roles need `family.service.ts`, prefer extracting new focused services instead of adding more logic directly. If direct edits are unavoidable, AI-00 owns the final integration patch.

## 13. Branch and Merge Protocol

Integration branch:

```text
wave/m2-wave2-integration
```

Recommended role branches if used:

```text
wave/m2-wave2-ai01-priority
wave/m2-wave2-ai02-intervention-action
wave/m2-wave2-ai03-contracts-db
wave/m2-wave2-ai04-web
wave/m2-wave2-ai05-validation
```

No role should commit or merge unrelated dirty work. Existing unrelated files must not be reverted.

## 14. Phase A Verdict

SHARED_FILE_CONFLICT_MATRIX = PASS
READY_FOR_PARALLEL_PHASE_B = YES, subject to user approval.

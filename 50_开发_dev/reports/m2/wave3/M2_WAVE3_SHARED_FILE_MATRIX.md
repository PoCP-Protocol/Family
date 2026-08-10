# M2 Wave3 Shared File Matrix

Status: APPROVED_FOR_WAVE3_PHASE_A
Date: 2026-08-10
Wave: M2_WAVE_3_OBSERVE_AND_REVIEW

## Control Files

| File | Owner | Rule |
|---|---|---|
| `reports/m2/wave3/M2_WAVE3_CONTRACT_FREEZE_V1.md` | AI-00 / Contract Owner | Immutable Wave3 baseline after local contract gate. Changes require CCR. |
| `reports/m2/wave3/M2_WAVE3_SHARED_FILE_MATRIX.md` | AI-00 | Update only for ownership/routing changes. |
| `reports/m2/wave3/CCR-M2-WAVE4-001.md` | Chief Architect | Decision record. Do not edit without new ruling. |
| `CURRENT_SPRINT.md` | AI-00 | Status and authorized task routing only. |
| `PROJECT_STATUS.md` | AI-00 | Project-level status truth. |
| `docs/FAMILY_1_0_MOS_ARCHITECTURE_GATE.md` | Chief Architect / AI-00 | V3.2 architecture gate status only. |

## Contract Files

| File | Owner | Rule |
|---|---|---|
| `specs/actions/RecordOutcomeObservation.action.yaml` | AI-01 | New Wave3 Named Action. |
| `specs/actions/CompleteGrowthReview.action.yaml` | AI-01 | New Wave3 Named Action. |
| `specs/actions/CloseInterventionCycle.action.yaml` | AI-01 | New Wave3 Named Action. |
| `specs/actions/RecordNextStepDecision.action.yaml` | AI-01 | New Wave3 Named Action. |
| `packages/contracts/src/index.ts` | AI-03 | Runtime DTO/types after contract gate. |

## Runtime Files

| Area | Owner | Rule |
|---|---|---|
| `database/migrations/` | AI-02 | Additive Wave3 schema only; no destructive migration. |
| `apps/api/src/modules/family/` | AI-02 | Deterministic service/controller changes only; no AI runtime. |
| `apps/web/src/` | AI-04 | F10/F11 only; no F12 surface. |
| `apps/api/src/**/*.spec.ts` | AI-05 | Real PostgreSQL/HTTP E2E coverage required. |
| `apps/web/src/**/*.spec.ts` | AI-05 | Browser-facing regressions and no-score/no-AI guards. |

## Forbidden During Wave3

```text
F12 Family AI implementation
Model Gateway implementation
Agent runtime implementation
World Model runtime
Causal engine
Family Total Score
Family ranking
Automatic GrowthProfile mutation from GrowthReview
```
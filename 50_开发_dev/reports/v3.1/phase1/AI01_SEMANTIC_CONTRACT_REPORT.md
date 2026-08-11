# V3.1 Phase 1B AI-01 Semantic Contract Report

date: 2026-08-10
owner: AI-01 Domain Semantics + Machine Contracts
depends_on: BARRIER-1

## Verdict

AI01_SEMANTIC_CONTRACT = PASS_WITH_RUNTIME_COMPAT_NOTES
SEMANTIC_BLOCKERS_CLOSED = 3
CCR_REQUIRED = 1
WAVE3_STARTED = NO

## Scope

This pass only adds machine-readable M2 contracts for behavior already present in the Wave2 runtime. It does not edit backend, web, database, OpenAPI, or TS runtime contracts.

## Added Contracts

- `specs/actions/ConfirmGrowthPriority.action.yaml`
- `specs/actions/StartIntervention.action.yaml`
- `specs/actions/CompleteGrowthAction.action.yaml`
- `specs/events/GrowthPriorityConfirmed.event.yaml`
- `specs/events/InterventionStarted.event.yaml`
- `specs/events/GrowthActionCompleted.event.yaml`
- `specs/interventions/INTERVENTION-001.yaml`

## Semantic Closures

1. M2 Named Actions are now represented in machine specs instead of existing only in runtime.
2. Intervention-001 now has a single machine-readable spec under `specs/interventions`.
3. Existing outbox events are now documented with explicit boundaries, payload rules, and compatibility notes.

## Compatibility Notes

- `GrowthPriorityConfirmed` remains a compatibility event name. It can represent `decision = NO_PRIORITY_YET`; consumers must check `decision` and `priority`.
- `GrowthActionCompleted` remains a compatibility event name. It can represent `COMPLETED`, `PARTIAL`, or `NOT_COMPLETED`; preferred future name is `GrowthActionCheckInRecorded`.

## CCR

CCR-AI01-001 is required before renaming runtime event `GrowthActionCompleted` to `GrowthActionCheckInRecorded`, because the rename touches runtime outbox expectations, tests, OpenAPI, and downstream consumers.

## Gate Statement

BARRIER-2 SEMANTIC CONTRACT = PASS_WITH_CCR

The CCR does not block Wave2 convergence as long as compatibility semantics are explicitly enforced in AI-03 contracts and AI-05 E2E assertions.
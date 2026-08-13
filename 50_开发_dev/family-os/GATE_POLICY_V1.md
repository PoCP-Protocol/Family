# FAMILY DEV OS — Gate Policy V1

## Hard invariant: NO GATE LEAP
A task may execute only when it is `READY`, its dependencies are terminal (`MERGED`/`PASS_CLOSED`), and its authorization is valid.

Implementation evidence cannot create authorization. A Gate report is evidence, not permission.

## State machine
`PLANNED -> READY -> CLAIMED -> IN_PROGRESS -> PR_OPEN -> CI_GREEN -> REVIEWED -> MERGE_READY -> MERGED -> PASS_CLOSED`

Exceptional states: `BLOCKED`, `HOLD`, `FAILED`, `SUPERSEDED`.

Only the Orchestrator may expose eligible `PLANNED` work for architect/program review. Only external governance/architect authority may turn a protected Gate into authorized `READY` work.

## Canonical safety
`Perspective != Fact`; `Hypothesis != Fact`; `AI_INFERENCE != FACT`; `PROPOSAL != GROWTH_ACTION`; canonical mutation only through Named Actions.

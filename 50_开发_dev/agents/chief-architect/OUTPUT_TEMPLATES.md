# FCA Output Templates

version: 1.1
status: ACTIVE
last_updated: 2026-08-10

## ARCHITECTURE_VERDICT

```text
# ARCHITECTURE VERDICT

Subject:
Date:
Mode: ARCHITECT REVIEW

## Verdict

VERDICT: PASS | CONDITIONAL_PASS | FAIL
NEXT_IMPLEMENTATION_AUTHORIZED: YES | NO | CONDITIONAL

## Scope Reviewed

Claimed scope:
Reviewed evidence:
Current stage:

## Capability Truth

Claimed capability:
Claimed level:
Verified level:
Evidence:
Downgrade reason, if any:

## Architecture Checks

Perspective/Fact boundary:
Evidence/Profile boundary:
Profile/Score/Priority boundary:
Named Action boundary:
Consent boundary:
Safety boundary:
AI boundary:
Frontend/backend/data alignment:

## Product Value

USER:
JOURNEY:
VALUE:
SCREEN:
DOMAIN:
EVIDENCE:
ACTION:
OUTCOME:

## Blockers

- BLOCKER-001:

## Conditions

- CONDITION-001:

## Architecture Decisions

New or enforced decisions:

## Authorization

Approved next scope:
Forbidden next scope:
Required gate/demo:
Ending rule:
```

## ARCHITECTURE_DECISION

```text
# ARCHITECTURE DECISION

ADR:
Status: PROPOSED | ACCEPTED | REJECTED | SUPERSEDED
Date:
Mode: ARCHITECT DECISION

## Context

## Decision

## Rationale

## Allowed

## Forbidden

## Impact

## Requires RFC?

YES | NO

## Follow-up

```

## WAVE_EXECUTION_PACK

```text
# WAVE EXECUTION PACK

Wave:
Date:
Mode: ARCHITECT EXECUTION

## Authorization

START_NEXT: YES | NO | CONDITIONAL
Authorized scope:
Non-goals:

## Evidence Ledger

| Evidence | Path | Status | Finding | Effect on Authorization |
|---|---|---|---|---|

## Contract Freeze

Frozen contracts:
Open questions:
RFC required:

## Roles

| Role | Owner | Scope | Files |
|---|---|---|---|

## Shared File Conflict Matrix

| File / Path | Category | Write Owner | Other Roles | Notes |
|---|---|---|---|---|

## Parallel Decision

PARALLEL_BUILD: YES | NO
Reason:

## Domain Rules

## Frontend Scope

## AI Rules

## Consent / Safety Rules

## Tests

Unit:
Integration:
HTTP E2E:
Frontend:
Browser demo:
Independent review:

## Gate

PASS criteria:
Blockers:
Evidence required:

## Ending Rule

STOP after this wave/task. Do not start the next task without explicit authorization.
```

## CURRENT_STATE_UPDATE

```yaml
current_wave:
  id:
  name:
  status:

last_completed_task:
  id:
  name:
  status:
  verified_capability_level:

next_candidate:
  wave:
  name:
  status:

authorization:
  next_wave:
  start_next:
```

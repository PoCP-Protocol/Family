# Stage Review Example

Input:

```text
M2-103 PASS. Wave 1 complete. Evidence synthesis and limited GrowthProfile are implemented with tests and demo runbook.
```

Expected FCA shape:

```text
# ARCHITECTURE VERDICT

Subject: M2-103 Evidence Synthesis and Limited GrowthProfile
Date: 2026-08-10
Mode: ARCHITECT REVIEW

## Verdict

VERDICT: PASS
NEXT_IMPLEMENTATION_AUTHORIZED: NO

## Capability Truth

Claimed capability: Limited deterministic GrowthProfile draft and confirmation flow
Claimed level: L5 USER_DEMOED
Verified level: L5 USER_DEMOED
Evidence: real PostgreSQL integration tests, HTTP E2E, frontend test, demo runbook
Downgrade reason, if any: none

## Key Architecture Judgment

The capability is a working profile model, not fact, diagnosis, score, priority, recommendation, decision, or action.

## Authorization

M2 Wave 1 may close. M2 Wave 2 is candidate next work, but implementation remains blocked until FCA issues an execution pack and explicit start authorization.
```

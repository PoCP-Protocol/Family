# CCR-V31-SAFETY-001

Status: APPROVED
Date: 2026-08-10
Phase: V3_1_PHASE1R_RUNTIME_TRUTH_AND_REAL_SYSTEM_CLOSURE

## Context

M2 Wave2 onboarding must not trust a client-authored final safety severity. Ordinary clients can provide factual structured safety signals, but final severity, disposition, and policy version are server authority.

## Decision

Replace active onboarding request semantics with server-derived safety.

Clients submit `structured_safety_signals` only. Supported signals are:

- `NONE`
- `SELF_HARM`
- `HARM_TO_OTHERS`
- `ABUSE`
- `VIOLENCE`
- `SEVERE_CRISIS`

The server derives:

- severity
- disposition
- policy_version

using the approved deterministic safety policy.

## Required Runtime Rules

- Clients cannot set final `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, or `SAFETY_ESCALATION` authority.
- Clients cannot set final safety disposition.
- Persist server-derived safety result.
- NormalSafetyRoute must use only canonical server-derived safety state.
- ConfirmGrowthPriority, StartIntervention, and CompleteGrowthAction must recheck the same server-derived boundary.
- Safety block must create no Priority, no new Intervention, no Action completion side effect, no Profile mutation, no Outcome, and no Milestone.

## Compatibility

Historical stored payload fields may remain only when explicitly treated as historical or server-derived. New active request DTOs, contracts, OpenAPI, web UI, and tests must not ask ordinary users to select final safety severity.

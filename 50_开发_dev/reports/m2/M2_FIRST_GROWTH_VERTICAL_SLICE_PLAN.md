# M2 First Growth Vertical Slice Plan

date: 2026-08-10
status: PLANNING_ONLY
implementation_started: NO

## Scenario

12-15岁家庭 / 亲子沟通冲突。

## Product Intent

M2 should deliver the first real family growth value within 7-14 days, using the M1 Family Core as the verified base. It should not expand into a platform rewrite, 24-dimension framework, multi-agent system, world model, or complex causal engine.

## Proposed Chain

```text
Growth Onboarding -> Perspective -> Evidence -> Relationship GrowthProfile -> GrowthPriority -> Intervention -> GrowthAction -> GrowthEvent -> Milestone -> Outcome -> Growth Review
```

## First Slice Boundaries

- One LifeStage: EARLY_ADOLESCENCE_12_15.
- One relationship context: parent-child communication conflict.
- One family aggregate source: M1 `GET /families/{familyId}`.
- One human-readable growth track.
- Explicit consent and permission checks before any minor-related growth processing.

## Required Before Coding

1. Human approval for M2 implementation.
2. Scenario-specific Implementation Plan.
3. Explicit data contract for GrowthProfile/GrowthPriority/GrowthAction/GrowthEvent/Outcome.
4. Human Gate definition for high-risk family contexts.
5. Evaluation criteria tied to outcome, not free-text generation quality alone.

## Explicit Non-Goals

- No Family Total Score.
- No family ranking.
- No autonomous child agent.
- No World Model training.
- No broad 0-18 LifeStage implementation.
- No large agent platform before the first vertical slice proves value.

## Governance Debt To Resolve Alongside M2

- TASK-106B WithdrawConsent.
- IAM hardening beyond M1 creator-based permission.
- Pilot-grade audit and access policy review.

## Stop Condition

This artifact is planning only. No M2 source code, schema, API route, model gateway, or agent runtime implementation is included in TASK-107.
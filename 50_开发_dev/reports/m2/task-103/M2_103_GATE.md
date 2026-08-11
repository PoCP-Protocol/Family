# M2-103 Gate Report

status: PASS
task: M2-103_EVIDENCE_SYNTHESIS_AND_LIMITED_GROWTH_PROFILE
completed_at: 2026-08-10
scope: Evidence Synthesis + GrowthProfileDraft + ConfirmGrowthProfile + F05 Growth Insight + Wave 1 demo runbook

## Verdict

M2-103 = PASS

BLOCKERS = 0

last_completed_task = M2-103_EVIDENCE_SYNTHESIS_AND_LIMITED_GROWTH_PROFILE

M2_WAVE_1 = PASS

READY_FOR_M2_WAVE_2 = YES

Execution stops at M2-103. M2-104 implementation has not been started.

## Gate Checklist

| Gate Item | Status | Evidence |
|---|---:|---|
| PLAN_FIRST | PASS | Required first deliverable exists at `reports/m2/task-103/M2_103_IMPLEMENTATION_PLAN.md` with status `PLAN_READY`. |
| EVIDENCE_SYNTHESIS | PASS | `EvidenceSynthesisService` implemented as deterministic service with `PROFILE_SYNTHESIS_POLICY_VERSION = M2_103_DETERMINISTIC_V1`; non-`UNRESOLVED` synthesis requires at least 2 usable evidence records plus parent/direct-child coverage. |
| EVIDENCE_NOT_FACT | PASS | Synthesis emits `fact_boundary = PROFILE_IS_INTERPRETIVE_NOT_FACT`; UI states `这不是评分，也不是事实判定，而是基于目前信息形成的工作画像。` |
| PROFILE_SCOPE | PASS | Contracts and persistence split `PARENT_GROWTH_PROFILE` for P03 from `RELATIONSHIP_GROWTH_PROFILE` for R03/R04/R05. `GrowthInsightResponse` returns `parent_profile_drafts` and `relationship_profile_drafts`. |
| MULTI_PERSPECTIVE | PASS | Synthesis requires usable LOW/NORMAL perspective-linked evidence and records parent/child coverage in `perspective_coverage`. Single/insufficient coverage remains unresolved. |
| PROXY_PROVENANCE | PASS | M2-102 capture provenance remains part of Perspective contract; M2-103 synthesis uses perspective coverage and limitations rather than treating proxy/facilitated material as objective fact. |
| INSUFFICIENT_EVIDENCE | PASS | Insufficient coverage yields `candidate_state = UNRESOLVED`, `confidence = LOW`, and limitation `INSUFFICIENT_EVIDENCE`; unresolved drafts cannot be confirmed. |
| PERSPECTIVE_DIVERGENCE | PASS | Synthesis contract records `agreement_level` and limitation `PERSPECTIVE_DIVERGENCE` when applicable; UI explains divergence as different feelings, not correctness/fault. |
| 4_DIMENSION_LIMIT | PASS | M2-103 profile drafts are limited to `P03`, `R03`, `R04`, `R05`; contracts use `M2GrowthDimensionId`. |
| E1_STATE_LIMIT | PASS | Current E1-only synthesis can produce LOW/MEDIUM confidence working states only; HIGH is not produced from this baseline. |
| NO_HIDDEN_SCORE | PASS | Contracts and UI use qualitative `confidence` and `candidate_state`; Web tests assert no `总分` or `排名` copy is rendered. |
| PROFILE_DRAFT | PASS | Migration `0007_growth_profile_draft_confirmation.sql` adds `growth_profile_drafts`; build endpoint creates drafts without canonical profile side effect. |
| CONFIRM_PROFILE_ACTION | PASS | `ConfirmGrowthProfile` action validates draft state, consent, safety, stale evidence, idempotency, and writes canonical profile only after explicit confirmation. |
| VERSIONING | PASS | Confirming a profile supersedes previous active profile in the same scope/subject/dimension and writes `version + 1` with `previous_profile_id`. |
| STALE_DRAFT_PROTECTION | PASS | Service validates evidence snapshot/perspective versions before confirmation; stale drafts are rejected instead of silently confirming outdated synthesis. |
| CONSENT | PASS | Service requires `SERVICE`, `ASSESSMENT`, and `GROWTH_TRACKING`; `AI_PERSONALIZATION` is not required for deterministic synthesis. |
| SAFETY | PASS | Only LOW/NORMAL perspective evidence enters synthesis. Ordinary Web client cannot submit final safety severity, inherited from M2-102 server-derived policy. |
| NO_PRIORITY_SIDE_EFFECT | PASS | Integration and HTTP E2E assert no `growth_priorities` are created by synthesis or confirmation. |
| NO_AI_SIDE_EFFECT | PASS | M2-103 uses deterministic synthesis only; tests and UI copy confirm no AI action/recommendation is generated. |
| AUDIT | PASS | Successful build/confirm flows write audit logs for named actions. |
| OUTBOX | PASS | Drafted and confirmed profile events are emitted through outbox helpers. |
| REAL_PG | PASS | `family.service.integration.spec.ts` uses real PostgreSQL and migration `0007`; 13 integration tests pass, including consent recheck and version chaining. |
| HTTP_E2E | PASS | Dedicated E2E command validates real HTTP onboarding, perspectives, draft build, insight, and confirmation; 11 tests pass. |
| F05_FRONTEND | PASS | Family Web renders Chinese F05 Growth Insight, builds drafts, confirms eligible draft, and blocks unresolved draft confirmation. |
| EVIDENCE_EXPLANATION | PASS | F05 cards show evidence count, agreement, confidence, limitations, and explicit Profile/Evidence boundary. |
| REAL_BROWSER_DEMO | PASS | Demo runbook exists at `reports/m2/demo/M2_WAVE1_REAL_DEMO_RUNBOOK.md` with browser flow and validation commands. |
| INDEPENDENT_REVIEW | PASS | Read-only CodeReviewer re-review returned PASS after the earlier BLOCKED findings were fixed. Gate evidence is backed by executable unit, integration, E2E, Web test, typecheck, and build commands. |
| BLOCKERS | PASS | BLOCKERS = 0. |

## Validation Evidence

```text
pnpm --dir "d:\Family\50_开发_dev" --filter @family/contracts build
PASS

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck
PASS

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- evidence-synthesis.service.spec.ts
PASS: 2 tests

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- family.service.integration.spec.ts
PASS: 13 tests

pnpm --dir "d:\Family\50_开发_dev" --filter @family/api exec vitest run --config vitest.e2e.config.ts src/modules/family/family.e2e-spec.ts
PASS: 11 tests

pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck
PASS

pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test
PASS: 7 tests

pnpm --dir "d:\Family\50_开发_dev" --filter @family/web build
PASS
```

## Implemented Files

Core M2-103 implementation:

- `packages/contracts/src/index.ts`
- `database/migrations/0007_growth_profile_draft_confirmation.sql`
- `apps/api/src/modules/family/evidence-synthesis.service.ts`
- `apps/api/src/modules/family/build-growth-profile-drafts.dto.ts`
- `apps/api/src/modules/family/confirm-growth-profile.dto.ts`
- `apps/api/src/modules/family/family.controller.ts`
- `apps/api/src/modules/family/family.module.ts`
- `apps/api/src/modules/family/family.service.ts`
- `apps/web/src/app.js`
- `apps/web/src/styles.css`

Test and evidence coverage:

- `apps/api/src/modules/family/evidence-synthesis.service.spec.ts`
- `apps/api/src/modules/family/family.service.integration.spec.ts`
- `apps/api/src/modules/family/family.e2e-spec.ts`
- `apps/web/src/app.spec.ts`
- `reports/m2/task-103/M2_103_IMPLEMENTATION_PLAN.md`
- `reports/m2/demo/M2_WAVE1_REAL_DEMO_RUNBOOK.md`

## Residual Risks / Deferred Hardening

- M2-103 intentionally keeps GrowthProfile as a limited working model. It does not introduce outcome evidence, behavioral time-series evidence, or causal/world-model learning.
- Evidence synthesis is deterministic and conservative. More nuanced conflict language, non-E1 evidence, and longitudinal state changes are deferred to later approved tasks.
- Web remains a static first-slice app. Browser runbook is documented; executable Web tests cover F05 rendering and HTTP calls, while full live browser API clicking depends on seeded backend data and the local API environment.
- Rebuilding drafts with a new idempotency key can create a new draft set for the same onboarding; reuse/staling policy is deferred unless explicitly approved.

## Explicit Non-Scope Confirmation

M2-103 did not implement GrowthPriority, Intervention, GrowthAction, AI Recommendation, Milestone, Outcome, GrowthReview, Family Total Score, family ranking, causal/world-model learning, Agent Memory, native app, or mini program.

## Stop Rule

M2-103 is complete and closed. Stop here. Even though `M2_WAVE_1 = PASS` and `READY_FOR_M2_WAVE_2 = YES`, do not implement M2-104 without explicit approval.

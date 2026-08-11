# M2 Wave 1 Real Demo Runbook

status: READY
scope: M2-101 + M2-102 + M2-103 Wave 1 UNDERSTAND
updated_at: 2026-08-10

## Purpose

This runbook demonstrates the first real Family growth loop through M2-103:

1. Start a growth onboarding.
2. Record parent and child perspectives.
3. Convert perspectives into E1 EvidenceRecords.
4. Build limited GrowthProfileDrafts by deterministic Evidence Synthesis.
5. Display F05 Growth Insight in Chinese.
6. Confirm one eligible working profile through `ConfirmGrowthProfile`.

The demo must preserve these boundaries:

- `Perspective != Fact`.
- Evidence can support Profile, but Evidence itself is not Profile.
- Profile is interpretive working state, not objective fact.
- No Family Total Score.
- No family ranking.
- No GrowthPriority, recommendation, action, or AI side effect.

## Prerequisites

Run from `50_开发_dev`.

```text
pnpm install
```

A PostgreSQL test database must be available for backend integration/E2E. The repository migrations must include:

- `0005_family_core_m1.sql`
- `0006_perspective_evidence_contract_alignment.sql`
- `0007_growth_profile_draft_confirmation.sql`

## Validation Commands

```text
pnpm --dir "d:\Family\50_开发_dev" --filter @family/contracts build
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- evidence-synthesis.service.spec.ts
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- family.service.integration.spec.ts
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api exec vitest run --config vitest.e2e.config.ts src/modules/family/family.e2e-spec.ts
pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck
pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test
pnpm --dir "d:\Family\50_开发_dev" --filter @family/web build
```

Expected current result:

```text
contracts build: PASS
api typecheck: PASS
evidence-synthesis.service.spec.ts: PASS, 2 tests
family.service.integration.spec.ts: PASS, 13 tests
family.e2e-spec.ts via vitest.e2e.config.ts: PASS, 11 tests
web typecheck: PASS
web test: PASS, 7 tests
web build: PASS
```

## Browser Demo

Start the static Web shell:

```text
pnpm --dir "d:\Family\50_开发_dev" --filter @family/web dev
```

Open the printed local URL, normally:

```text
http://localhost:5173
```

The first screen is the working app, not a landing page. The UI should be Chinese and show:

- `F01 家庭上下文`
- `F02 成长入口`
- `启动亲子沟通成长旅程`
- `AI 非必需`

Manual browser flow:

1. Start onboarding with LOW safety.
2. Record parent perspective in `F03 父母视角`.
3. Record child perspective in `F04 孩子视角`.
4. Confirm the summary shows `父母 / 孩子视角对照`, `Perspective != Fact`, and E1 evidence count.
5. In `F05 Growth Insight`, click `生成成长画像草稿`.
6. Confirm the panel shows `我们目前看到的沟通状态`.
7. Confirm boundary copy appears: `这不是评分，也不是事实判定，而是基于目前信息形成的工作画像。`
8. Confirm draft cards include parent/relationship dimensions such as `P03 父母倾听与回应方式` and `R03 冲突中被听见的程度`.
9. Confirm unresolved/insufficient drafts show `信息不足，暂不确认`. P03 remains unresolved unless there are at least two usable evidence records with parent/direct-child coverage.
10. Confirm an eligible draft can be confirmed with `这符合我们目前的情况`.
11. Confirm the post-confirmation message says the confirmation does not automatically generate action.

## API Contract Flow

The HTTP E2E validates the real backend route sequence:

```text
POST /families/:familyId/growth/onboarding
POST /families/:familyId/growth/onboardings/:onboardingId/perspectives
GET  /families/:familyId/growth/onboardings/:onboardingId/perspectives
POST /families/:familyId/growth/onboardings/:onboardingId/profile-drafts
GET  /families/:familyId/growth/onboardings/:onboardingId/insight
POST /families/:familyId/growth/profile-drafts/:draftId/confirm
```

All state-changing calls require `X-Actor-Id` and an idempotency key. Ordinary Web clients do not submit final safety severity.

## Demo Evidence Boundaries

M2-103 only supports these profile dimensions:

- `P03` as `PARENT_GROWTH_PROFILE`.
- `R03`, `R04`, `R05` as `RELATIONSHIP_GROWTH_PROFILE`.

`EvidenceSynthesisDto.fact_boundary` must be:

```text
PROFILE_IS_INTERPRETIVE_NOT_FACT
```

Profile confirmation writes a working profile only after explicit confirmation. Synthesis alone never writes canonical profile state.

## Stop Rule

After M2-103 passes, stop. Do not implement M2-104, GrowthPriority, Intervention, GrowthAction, AI Recommendation, Milestone, Outcome, GrowthReview, Family Total Score, family ranking, or Agent Memory without explicit approval.

# M2-103 Implementation Plan

status: PLAN_READY
task: M2-103_EVIDENCE_SYNTHESIS_AND_LIMITED_GROWTH_PROFILE
phase: M2_FIRST_REAL_FAMILY_GROWTH_LOOP / Wave 1 UNDERSTAND
scope: Evidence Synthesis + Profile Draft + ConfirmGrowthProfile + F05 Growth Insight + Real Demo Bootstrap
date: 2026-08-10

## 0. Authority And Entry Condition

M2-103 starts only because M2-102 is PASS with BLOCKERS = 0 and READY_FOR_M2_103 = YES. This plan is the first required deliverable. Business implementation is not allowed until this plan exists.

M2-103 closes Wave 1 UNDERSTAND. It must not implement M2-104 GrowthPriority, Intervention, GrowthAction, AI Recommendation, Milestone, Outcome, GrowthReview, Family Score, ranking, or Agent Memory.

## 1. Evidence Synthesis 是什么

Evidence Synthesis is a deterministic domain component that interprets perspective-linked evidence at dimension level without converting it into fact.

Planned component boundary:

```text
EvidenceSynthesisService
```

Input:

- `PerspectiveDto[]` from the active onboarding.
- linked `EvidenceRecordDto[]`.
- onboarding context: family, child, guardian, parent-child relationship, life stage.
- server safety disposition already stored on perspectives.

Output per dimension:

- `dimension_id` in `P03 | R03 | R04 | R05`.
- `profile_scope`: `PARENT_GROWTH_PROFILE` or `RELATIONSHIP_GROWTH_PROFILE`.
- `subject_ref`: parent person id or relationship id.
- `supporting_evidence_refs`.
- `contradicting_evidence_refs`.
- `perspective_coverage`.
- `evidence_grade_coverage`.
- `agreement_level`.
- `confidence`.
- `candidate_state`.
- `limitations`.
- `policy_version = M2_103_DETERMINISTIC_V1`.

Its core product meaning: Family can say, “based on what each side expressed so far, this is the current working understanding,” while preserving “Perspective != Fact”.

## 2. Evidence Synthesis 不是什么

Evidence Synthesis is not:

- fact extraction.
- diagnosis.
- scoring.
- ranking.
- hidden 0-100 classifier.
- AI or LLM insight.
- final canonical GrowthProfile write.
- GrowthPriority decision.
- recommendation.
- conflict averaging.

It cannot produce statements like `FACT: child is unwilling to communicate` or `FACT: father cannot listen`. It may only describe coverage, agreement, divergence, limitations, and an auditable candidate state.

## 3. Evidence Sufficiency

M2-103 uses a conservative sufficiency gate.

For any dimension to receive a non-`UNRESOLVED` draft state:

- at least 2 usable low-risk evidence records must exist for that dimension.
- evidence should come from at least 2 perspective sources when the dimension is relationship-scoped.
- E1 evidence proves only that someone expressed a perspective, not that the described event is objectively true.

Dimension-specific sufficiency:

- `P03`: requires parent self-report plus child perspective or other independent supporting evidence. In M2-103, child perspective is the practical second source.
- `R03/R04/R05`: prefer direct parent perspective plus direct/facilitated child perspective. `PROXY_REPORTED` child material does not satisfy direct child coverage.

If evidence is insufficient, synthesis must produce `candidate_state = UNRESOLVED` and limitations including `INSUFFICIENT_EVIDENCE`. F05 displays “目前证据还不够，暂不判断。”

## 4. Perspective Conflict Handling

Parent and child perspectives must not be averaged. The synthesis records explicit divergence when statements or structured signals indicate different experiences of the same dimension.

Conflict behavior:

- `agreement_level = ALIGNED` when parent and child evidence point to similar experience themes.
- `agreement_level = PARTIAL` when both point to the same dimension but emphasize different causes or needs.
- `agreement_level = DIVERGENT` when the perspectives materially differ.

Divergence lowers confidence. Severe divergence can force `candidate_state = UNRESOLVED` with limitation `PERSPECTIVE_DIVERGENCE`.

F05 copy uses human language: “你们对这件事有不同感受。” It must not display “发现矛盾数据” or imply one side is wrong.

## 5. Parent Profile Scope

M2-103 adds an explicit parent-scoped profile concept:

```text
profile_scope = PARENT_GROWTH_PROFILE
subject_type = PARENT
subject_person_id = guardian/parent
covered_dimensions = [P03]
```

P03 is about parent behavior in the relationship context, especially understanding and empathic listening. It must not be stored as an undifferentiated relationship profile dimension.

The existing proposed `growth-profile.schema.yaml` is relationship-only, so M2-103 requires a minimal contract alignment rather than using that proposal unchanged.

## 6. Relationship Profile Scope

M2-103 also creates a relationship-scoped profile concept:

```text
profile_scope = RELATIONSHIP_GROWTH_PROFILE
subject_type = RELATIONSHIP
subject_relationship_id = current parent-child relationship
covered_dimensions = [R03, R04, R05]
```

F05 may display parent and relationship profiles together, but service, contract, persistence, tests, and events must preserve the scope distinction.

## 7. Profile Draft

Synthesis produces `GrowthProfileDraft`. A draft is not canonical core state and must not supersede active profiles.

Draft fields:

- `draft_id`.
- `family_id`.
- `onboarding_id`.
- `profile_scope`.
- `subject_ref`.
- `dimension_id`.
- `candidate_state`: `EMERGING | DEVELOPING | PRACTICING | STABILIZING | UNRESOLVED`.
- `confidence`: `LOW | MEDIUM | HIGH` for product display, with no hidden numeric score dependency.
- `supporting_evidence_refs`.
- `contradicting_evidence_refs`.
- `perspective_coverage`.
- `evidence_grade_coverage`.
- `agreement_level`.
- `limitations`.
- `evidence_snapshot` including evidence ids and perspective versions.
- `policy_version = M2_103_DETERMINISTIC_V1`.
- `status = DRAFT | REVIEW_REQUIRED | STALE | CONFIRMED`.
- `created_at`.

Draft creation can be exposed through a read/build endpoint, but canonical profile creation requires ConfirmGrowthProfile.

## 8. Profile Confirmation

Canonical GrowthProfile cannot be written automatically by synthesis.

Named Action:

```text
ConfirmGrowthProfile
```

Flow:

```text
HTTP
-> DTO Validation
-> Actor
-> Permission
-> Consent
-> Safety
-> Draft Preconditions
-> Evidence Version Check
-> Idempotency
-> Transaction
-> Profile
-> Audit
-> Outbox
-> Commit
```

Allowed first slice confirmation:

- LOW safety route only.
- evidence sufficiency satisfied.
- no severe perspective divergence.
- authorized parent/guardian confirms the profile as a working model.

UI wording: “确认这是我们当前的工作画像”, not “确认这是事实”.

When confidence is LOW, evidence is insufficient, or divergence is high, the draft remains `REVIEW_REQUIRED` or `UNRESOLVED`; parent cannot force canonical confirmation.

## 9. Growth State 产生规则

Allowed canonical states remain:

- `EMERGING`
- `DEVELOPING`
- `PRACTICING`
- `STABILIZING`

M2-103 draft state also permits `UNRESOLVED` to represent “do not judge yet”.

Policy version:

```text
PROFILE_SYNTHESIS_POLICY = M2_103_DETERMINISTIC_V1
```

First deterministic rule table:

| Condition | Candidate State | Confidence | Limitation |
|---|---|---|---|
| insufficient usable evidence | UNRESOLVED | LOW | INSUFFICIENT_EVIDENCE |
| one usable E1 only | UNRESOLVED | LOW | INSUFFICIENT_EVIDENCE |
| parent + child coverage, partial agreement, E1-only | EMERGING | LOW | SELF_REPORT_ONLY |
| parent + child coverage, aligned recurring selected signals, E1-only | DEVELOPING | MEDIUM | SELF_REPORT_ONLY |
| high divergence | UNRESOLVED | LOW | PERSPECTIVE_DIVERGENCE |
| safety escalation evidence only | UNRESOLVED | LOW | SAFETY_ESCALATION_EXCLUDED |

No rule may map a single perspective directly to a growth state.

## 10. Confidence

Confidence is qualitative and explainable:

- `LOW`: limited evidence, one-sided coverage, proxy-only child material, divergence, or unresolved state.
- `MEDIUM`: at least parent + child coverage with E1 self-report and consistent dimension signals.
- `HIGH`: reserved for later non-E1 behavioral/time/outcome evidence; M2-103 should not produce HIGH from E1-only baseline.

No hidden numeric score is allowed. If DB columns require numeric confidence, mapper stores a fixed explicit contract mapping only for persistence compatibility, for example `LOW = 0.3000`, `MEDIUM = 0.6000`, and documents that it is not a scoring model. Business logic must branch on qualitative labels/rules, not numeric thresholds.

## 11. Versioning

Canonical profiles are append-only versions.

Rules:

- never overwrite old profile rows.
- one active canonical profile per family + profile scope + subject + dimension at a time.
- confirming a new profile supersedes the previous active version in the same transaction by setting `effective_to` and `status = SUPERSEDED`.
- new version increments from previous active version.
- previous version remains queryable.

Canonical fields must include basis/evidence refs, confidence, policy version, confirmed_by, confirmed_at, previous_version/profile ref, and effective_from/effective_to.

## 12. Consent

M2-103 requires:

- `SERVICE`
- `ASSESSMENT`
- `GROWTH_TRACKING`

`AI_PERSONALIZATION` is not required because M2-103 uses deterministic synthesis only. Lack of AI consent must be covered by E2E and must not block synthesis or confirmation.

Consent is checked against the protected child/onboarding subject and parent/guardian authorization, following the M2-101/M2-102 service pattern.

## 13. Safety

Only normal low-risk growth evidence enters ordinary profile synthesis.

Rules:

- include perspectives only when `safety_disposition.severity = LOW` and `disposition = NORMAL`.
- exclude safety escalation evidence from growth profile judgment.
- if all relevant evidence is safety-routed, return unresolved/review-required, not a growth state.
- high-risk content must not become `R04 = EMERGING` or any other normal profile signal.

Safety remains separate from Growth. Draft and profile payloads should record excluded evidence counts/limitations without exposing high-sensitive detail in normal F05 UI.

## 14. API

Planned M2-103 API shape:

```text
POST /families/:familyId/growth/onboardings/:onboardingId/profile-drafts
GET  /families/:familyId/growth/onboardings/:onboardingId/insight
POST /families/:familyId/growth/profile-drafts/:draftId/confirm
```

Responsibilities:

- `POST profile-drafts`: builds deterministic draft(s) from current evidence snapshot. It writes draft rows only, not canonical profiles.
- `GET insight`: returns F05 display model: parent profile draft, relationship profile drafts, perspective comparison, evidence explanation, limitations, current confirmed profiles if any.
- `POST confirm`: runs ConfirmGrowthProfile named action for confirmable drafts.

Contract types to add to `@family/contracts`:

- `GrowthState = EMERGING | DEVELOPING | PRACTICING | STABILIZING`.
- `GrowthProfileCandidateState = GrowthState | UNRESOLVED`.
- `GrowthProfileScope = PARENT_GROWTH_PROFILE | RELATIONSHIP_GROWTH_PROFILE`.
- `GrowthProfileStatus = WORKING | REVIEW_REQUIRED | SUPERSEDED`.
- `ProfileDraftStatus = DRAFT | REVIEW_REQUIRED | STALE | CONFIRMED`.
- `AgreementLevel = ALIGNED | PARTIAL | DIVERGENT | INSUFFICIENT`.
- `ProfileConfidence = LOW | MEDIUM | HIGH`.
- `EvidenceSynthesisDto`.
- `GrowthProfileDraftDto`.
- `GrowthProfileDto`.
- `BuildGrowthProfileDraftsRequest/Response`.
- `GrowthInsightResponse`.
- `ConfirmGrowthProfileRequest/Response`.

## 15. DB Changes

Existing `0003_growth_foundation.sql` provides `growth_profiles` and `growth_profile_dimensions`, but it cannot fully represent M2-103 confirmation semantics by itself.

Add a new migration after `0006` with minimal additive changes:

1. Create `growth_profile_drafts`:
   - `draft_id uuid primary key default gen_random_uuid()`.
   - `family_id`.
   - `onboarding_id`.
   - `profile_scope`.
   - `subject_type`.
   - `subject_person_id null`.
   - `subject_relationship_id null`.
   - `dimension_id`.
   - `candidate_state varchar(16)` allowing `UNRESOLVED`.
   - `confidence_label varchar(16)`.
   - `synthesis jsonb`.
   - `evidence_snapshot jsonb`.
   - `policy_version varchar(64)`.
   - `status varchar(24)`.
   - `created_by_actor_id`.
   - `created_at`.

2. Add columns to `growth_profiles`:
   - `profile_scope varchar(40)`.
   - `subject_person_id uuid null references persons(person_id)`.
   - `subject_relationship_id uuid null references family_relationships(relationship_id)`.
   - `status varchar(24) default 'WORKING'`.
   - `confirmed_by_actor_id varchar(128) null`.
   - `confirmed_at timestamptz null`.
   - `policy_version varchar(64) null`.
   - `basis jsonb default '{}'::jsonb`.
   - `previous_profile_id uuid null references growth_profiles(profile_id)`.

3. Add columns to `growth_profile_dimensions` if needed:
   - `confidence_label varchar(16)`.
   - `limitations jsonb default '[]'::jsonb`.
   - `supporting_evidence_ids jsonb default '[]'::jsonb`.
   - `contradicting_evidence_ids jsonb default '[]'::jsonb`.

4. Add partial unique active index for one active profile per scope/subject/dimension. Because dimensions are in child table, this may require a denormalized `active_dimension_id` on profile or a transaction-level lookup. Prefer explicit service-level lock plus unique compatible shape only if simple and safe.

5. Do not create priority/action/intervention/outcome tables; they already exist as foundation and M2-103 must not write them.

## 16. F05 UX

F05 is a real product screen, not a test report.

Screen title:

```text
我们目前看到的沟通状态
```

Required UI sections:

- boundary copy: “这不是评分，也不是事实判定，而是基于目前信息形成的工作画像。”
- Parent Profile card for P03.
- Relationship Profile cards for R03/R04/R05.
- canonical state mapping:
  - `EMERGING` -> `正在萌芽`
  - `DEVELOPING` -> `正在发展`
  - `PRACTICING` -> `正在练习`
  - `STABILIZING` -> `正在稳定`
  - `UNRESOLVED` -> `暂不判断`
- evidence counts by Parent Perspective / Child Perspective.
- “为什么这样理解？” detail disclosure.
- perspective divergence copy when applicable.
- confirmation actions:
  - “这符合我们目前的情况” -> ConfirmGrowthProfile.
  - “有些地方不太符合” -> feedback/additional perspective or review-required path, not direct profile mutation.

Forbidden UI:

- radar charts.
- 72/100.
- red/yellow/green family grades.
- good/bad labels.
- national ranking.
- “FACT”.
- AI-branded insight unless AI is actually implemented through the Model Gateway in a later wave.

Frontend framework judgment:

AI-03 must inspect current static app complexity after F05 implementation. Current app is still acceptable for this slice, but if F05 causes routing/state/API/test duplication to become clearly unmaintainable, final gate must record:

```text
FRONTEND_FRAMEWORK_RFC_RECOMMENDED = YES
```

No framework migration is allowed inside M2-103.

## 17. Real Demo

M2-103 must close the M2-102 fake UUID demo risk.

Add a real demo bootstrap path under `tools/demo/` if needed. The bootstrap must call official HTTP APIs only, not direct SQL:

```text
Create Family
-> Add Parent
-> Add Child
-> Create Relationship
-> Assign LifeStage
-> Grant SERVICE
-> Grant ASSESSMENT
-> Grant GROWTH_TRACKING
-> StartGrowthOnboarding
-> Record Parent Perspective
-> Record Child Perspective
-> Build Profile Drafts
```

The bootstrap should output a browser-consumable config with real ids for local Family Web, for example `apps/web/demo-config.local.json` or equivalent. The file must be treated as generated demo state, not a contract source.

Runbook to create:

```text
reports/m2/demo/M2_WAVE1_REAL_DEMO_RUNBOOK.md
```

Final demo path:

```text
真实 PostgreSQL
-> 真实 HTTP
-> 真实 Family
-> 真实 Perspective
-> 真实 Evidence
-> 真实 Working Profile
-> 浏览器真正显示
```

## 18. Explicit Non-Goals

M2-103 must not implement:

- M2-104 GrowthPriority.
- priority selection or ranking.
- Intervention.
- GrowthAction.
- GrowthEvent beyond existing onboarding events.
- Milestone.
- Outcome.
- GrowthReview.
- AI recommendation.
- LLM synthesis.
- Model Gateway call.
- Agent Memory.
- Family Total Score.
- family ranking.
- psychological diagnosis.
- clinical labels.
- practicing/stabilizing from E1-only evidence.
- frontend framework migration.

## 19. Test Plan

Unit tests:

- U1 evidence synthesis with parent + child.
- U2 perspective is not fact.
- U3 one E1 evidence insufficient.
- U4 proxy child report not equal direct child report.
- U5 perspective conflict lowers confidence.
- U6 evidence insufficient returns unresolved.
- U7 E1-only cannot create PRACTICING.
- U8 E1-only cannot create STABILIZING.
- U9 deterministic policy version recorded.
- U10 no hidden score dependency.

Integration tests:

- I1 synthesize Parent P03 draft.
- I2 synthesize Relationship R03/R04/R05 drafts.
- I3 insufficient evidence no canonical profile.
- I4 ConfirmGrowthProfile creates versioned profile.
- I5 evidence refs persisted.
- I6 audit created.
- I7 outbox created.
- I8 idempotency replay.
- I9 idempotency conflict.
- I10 stale draft rejected.
- I11 safety escalation evidence excluded.
- I12 no Priority side effect.

HTTP E2E:

- E2E-M2-103-01 valid profile draft.
- E2E-M2-103-02 confirm working profile.
- E2E-M2-103-03 insufficient evidence stays unresolved.
- E2E-M2-103-04 perspective conflict preserved.
- E2E-M2-103-05 proxy report does not satisfy direct-child requirement.
- E2E-M2-103-06 no AI consent still works.
- E2E-M2-103-07 stale draft rejected.
- E2E-M2-103-08 no GrowthPriority created.

Frontend tests:

- loading.
- empty evidence.
- insufficient evidence.
- profile draft.
- confirmed profile.
- perspective divergence.
- evidence explanation.
- consent denied.
- safety blocked.
- stale draft.

Validation commands expected at gate:

```text
pnpm --dir "d:\Family\50_开发_dev" --filter @family/contracts build
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api typecheck
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api build
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api test -- <M2-103 unit/integration specs>
pnpm --dir "d:\Family\50_开发_dev" --filter @family/api exec vitest run --config vitest.e2e.config.ts src/modules/family/family.e2e-spec.ts
pnpm --dir "d:\Family\50_开发_dev" --filter @family/web typecheck
pnpm --dir "d:\Family\50_开发_dev" --filter @family/web test
```

Browser demo must be run against local API + PostgreSQL using real bootstrap data.

## 20. Implementation Order After Plan Approval

1. Contracts: add M2-103 draft/profile/synthesis/insight/confirm types.
2. DB migration: profile drafts + profile confirmation alignment.
3. Domain: implement deterministic `EvidenceSynthesisService` with unit tests first.
4. API DTOs: build draft, get insight, confirm profile.
5. Service persistence: draft write, stale evidence check, confirm transaction, audit, outbox, idempotency.
6. E2E: real flow from Family Core through confirmed working profile.
7. Web F05: insight screen, evidence explanation, divergence, confirmation UX.
8. Demo bootstrap + runbook.
9. Independent review.
10. Gate report.

## 21. Final Gate Report Requirements

Final output must create:

```text
reports/m2/task-103/M2_103_GATE.md
reports/m2/demo/M2_WAVE1_REAL_DEMO_RUNBOOK.md
```

`M2_103_GATE.md` must include PASS/FAIL fields:

```text
EVIDENCE_SYNTHESIS
EVIDENCE_NOT_FACT
PROFILE_SCOPE
MULTI_PERSPECTIVE
PROXY_PROVENANCE
INSUFFICIENT_EVIDENCE
PERSPECTIVE_DIVERGENCE
4_DIMENSION_LIMIT
E1_STATE_LIMIT
NO_HIDDEN_SCORE
PROFILE_DRAFT
CONFIRM_PROFILE_ACTION
VERSIONING
STALE_DRAFT_PROTECTION
CONSENT
SAFETY
NO_PRIORITY_SIDE_EFFECT
NO_AI_SIDE_EFFECT
AUDIT
OUTBOX
REAL_PG
HTTP_E2E
F05_FRONTEND
EVIDENCE_EXPLANATION
REAL_BROWSER_DEMO
INDEPENDENT_REVIEW
BLOCKERS = n
```

If all core gates pass, final status may state:

```text
M2-103 = PASS
M2_WAVE_1_UNDERSTAND = PASS
last_completed_task = M2-103_EVIDENCE_SYNTHESIS_AND_LIMITED_GROWTH_PROFILE
last_completed_wave = M2_WAVE_1_UNDERSTAND
READY_FOR_M2_WAVE_2 = YES
```

Even then, implementation must stop. M2-104/M2-105 may be planned only, not coded.

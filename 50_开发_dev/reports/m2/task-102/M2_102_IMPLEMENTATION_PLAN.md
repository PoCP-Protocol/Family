# M2-102 Implementation Plan

status: PLAN_READY
task: M2-102_RECORD_PERSPECTIVE_AND_EVIDENCE
scope: Record parent/child Perspective + EvidenceRecord + F03/F04 + server-derived safety policy
date: 2026-08-10

## 0. Local Finding

M2-102 cannot directly implement the current proposed `perspective.schema.yaml` as-is. The proposed schema has only `person_id`, `perspective_type`, and `statement`, which is insufficient for the approved M2-102 boundary:

- `subject_person_id` must be separate from `author_person_id`.
- `recorded_by_actor_id` must identify the actor who submitted the record.
- `capture_mode` must preserve whether the content is direct self-report, facilitated entry, or proxy-reported.
- Parent-entered "child said..." must not become direct `CHILD_PERSPECTIVE`.
- The ordinary Family Web client must not submit final trusted safety severity.

## PROPOSED CONTRACT ALIGNMENT

Add M2-102 contract types to `@family/contracts` and implement DTO validation in the API. The HTTP payload should accept structured perspective content and structured safety signals, but never a final `LOW/MEDIUM/HIGH/CRITICAL` severity from the ordinary client.

Planned request shape:

```ts
interface RecordPerspectiveRequest {
  family_id: string;
  onboarding_id: string;
  subject_person_id: string;
  author_person_id: string;
  perspective_type: 'PARENT_PERSPECTIVE' | 'CHILD_PERSPECTIVE';
  capture_mode: 'DIRECT_SELF_REPORT' | 'FACILITATED_ENTRY' | 'PROXY_REPORTED';
  related_dimension_ids: Array<'P03' | 'R03' | 'R04' | 'R05'>;
  content: {
    prompt_id: string;
    response_text: string;
    selected_signals: string[];
  };
  structured_safety_signals: string[];
  expressed_at?: string;
  idempotency_key: string;
}
```

Planned response shape:

```ts
interface RecordPerspectiveResponse {
  perspective: PerspectiveDto;
  evidence: EvidenceRecordDto;
  safety_disposition: SafetyDispositionDto;
}
```

## 1. Perspective Identity

`perspective_id` is server-generated UUID. The record is scoped by `family_id` and linked to the active M2 onboarding through `onboarding_id`, which maps to the `growth_journeys.journey_id` created by M2-101.

## 2. Perspective Subject

`subject_person_id` is the person the perspective is about. For M2-102, this must be the M2 onboarding child or the guardian/parent in the same family relationship context. Cross-family subjects are rejected.

## 3. Perspective Author

`author_person_id` is the person whose view is being captured. It is not inferred from the actor header. For `PARENT_PERSPECTIVE`, the author must be an authorized parent/guardian. For direct `CHILD_PERSPECTIVE`, the author must be the child.

## 4. Recorder / Actor

`recorded_by_actor_id` comes only from authenticated actor context (`AuditMeta.actor` / request header path), not the JSON body. The actor must have permission to record in this family context. Parent-recorded child material is allowed only as `FACILITATED_ENTRY` or `PROXY_REPORTED`, not direct self-report.

## 5. Provenance

`capture_mode` is mandatory:

- `DIRECT_SELF_REPORT`: author directly entered or explicitly authored the content.
- `FACILITATED_ENTRY`: an adult facilitated entry while preserving that the child authored the statement.
- `PROXY_REPORTED`: recorder reports what another person said or appeared to mean.

The API must reject `CHILD_PERSPECTIVE + DIRECT_SELF_REPORT` when `recorded_by_actor_id` is not the child actor/person mapping available in current system constraints. In M2-102 static Family Web, guardian-entered child content should use `FACILITATED_ENTRY` or `PROXY_REPORTED`.

## 6. Evidence Relationship

Every accepted perspective creates one linked `EvidenceRecord` with:

- `evidence_type = SELF_REPORT`.
- `source` derived from perspective type and capture mode.
- `evidence_level = E1` for self/proxy reported material.
- `payload` containing perspective reference, prompt id, selected signals, and non-fact boundary.

Evidence supports later interpretation but does not create `GrowthProfile`, `GrowthPriority`, `Milestone`, or `Outcome` in M2-102.

## 7. Consent Requirement

Before writing M2-102 state, the service must verify active consents for the child subject:

- `SERVICE`
- `ASSESSMENT`
- `GROWTH_TRACKING`

`AI_PERSONALIZATION` is not required because M2-102 has no AI personalization, no AI summary, and no Model Gateway call.

## 8. Safety Handling

M2-102 introduces a server-side `SafetyAssessmentPolicy` boundary. Ordinary Family Web clients submit only `structured_safety_signals`, such as `NONE`, `SELF_HARM`, `HARM_TO_OTHERS`, `ABUSE`, `VIOLENCE`, or `SEVERE_CRISIS`.

The server derives final disposition:

- no risk signals -> `LOW` and normal persistence may continue.
- any safety escalation signal -> `MEDIUM`/`HIGH`/`CRITICAL` disposition according to deterministic policy.
- non-LOW disposition blocks normal growth flow and must not create profile/priority side effects.

DTO validation must reject client fields such as `safetySeverity`, `safety_screening_result`, `finalSeverity`, or other final trusted severity aliases.

## 9. Idempotency

`RecordPerspective` uses the existing `idempotency_keys` pattern:

```text
action_name = RecordPerspective
request_hash = normalized family/onboarding/subject/author/type/capture/content/safety signals
```

Same key + same payload replays the same response. Same key + different payload returns `409 Idempotency conflict`.

## 10. Audit

Each successful low-risk write creates an `audit_logs` record:

- `action_name = RecordPerspective`
- `resource_type = Perspective`
- `resource_id = perspective_id`
- `family_id = family_id`
- `actor_id = recorded_by_actor_id`
- `correlation_id` preserved from request metadata

Safety-blocked attempts should not write normal perspective/evidence state. If an explicit safety route event is implemented in this task, it must be separate from normal growth state and documented in the gate.

## 11. Event

Successful low-risk writes emit an outbox event:

```text
PerspectiveRecorded
```

Payload includes perspective id, evidence id, onboarding id, subject id, author id, capture mode, perspective type, related dimensions, and `fact_boundary = PERSPECTIVE_NOT_FACT`.

## 12. DB Migration

Add a new migration after `0005_consent_active_uniqueness.sql` because `0003_growth_foundation.sql` already created thin `perspectives` and `evidence_records` tables.

Migration options:

- Prefer additive `ALTER TABLE` for existing tables to preserve migration continuity.
- Add `onboarding_id`, `subject_person_id`, `author_person_id`, `recorded_by_actor_id`, `capture_mode`, `content`, `related_dimension_ids`, `fact_boundary`, `safety_disposition`, `policy_version`, and `version` to `perspectives`.
- Add `perspective_id`, `evidence_level`, `source`, and richer payload constraints/indexes to `evidence_records`.
- Add indexes for `(family_id, onboarding_id, perspective_type)` and evidence lookup by `perspective_id`.

Do not create `growth_profiles`, `growth_priorities`, `interventions`, `milestones`, `outcomes`, or AI tables in M2-102.

## 13. HTTP API

Add:

```text
POST /families/:familyId/growth/onboardings/:onboardingId/perspectives
GET  /families/:familyId/growth/onboardings/:onboardingId/perspectives
```

The POST route runs `RecordPerspective`. The GET route returns a minimal summary for F03/F04 comparison preview and E2E/browser demo; it must not compute profile, priority, recommendation, or insight.

## 14. F03 Parent Perspective

Extend the current static Family Web implementation with a parent perspective form:

- parent-oriented prompt for communication friction.
- dimensions limited to `P03/R03/R04/R05`.
- structured safety signals as checkboxes or safe option set, not final severity.
- clear label: `Parent Perspective`, not fact.
- submits `PARENT_PERSPECTIVE` with appropriate subject/author/recorder/capture mode.

## 15. F04 Child Perspective

Add child perspective capture UI:

- child-friendly prompt language.
- explicit provenance selector or fixed guardian-assisted mode for static M2-102 demo.
- display `Child Perspective` separately from parent interpretation.
- guardian-entered child material must submit `FACILITATED_ENTRY` or `PROXY_REPORTED`, not direct self-report.

## 16. Tests

Backend unit/DTO tests:

- valid parent perspective.
- valid child perspective with facilitated/proxy provenance.
- rejects final client safety severity.
- rejects invalid perspective type.
- rejects dimension outside `P03/R03/R04/R05`.
- rejects invalid direct child self-report provenance.
- server policy maps no signals to LOW.
- server policy maps escalation signal to non-LOW and blocks normal persistence.

Integration/E2E tests:

- record parent perspective.
- record child perspective.
- evidence created and linked.
- idempotency replay and conflict.
- missing consent rejected.
- cross-family subject/onboarding rejected.
- non-LOW safety route blocks normal perspective/evidence writes.
- audit and outbox created.
- no GrowthProfile/GrowthPriority side effects.

Frontend tests:

- F03/F04 render.
- parent submit request shape contains no final safety severity.
- child assisted/proxy submit preserves provenance.
- summary renders Parent Perspective and Child Perspective separately.

Browser demo:

```text
Family Home -> Growth Onboarding Started -> Parent Perspective -> Child Perspective -> Perspective Summary
```

## 17. Explicit Non-Goals

M2-102 must not implement:

- GrowthProfile creation.
- GrowthPriority creation.
- AI recommendation or AI summary.
- Model Gateway integration.
- Intervention assignment.
- GrowthAction.
- Milestone.
- Outcome.
- GrowthReview.
- Family Total Score.
- family ranking or percentile.
- causal/world-model learning.

## Gate Exit Criteria

M2-102 can be marked PASS only if the later gate report verifies:

- contract alignment implemented.
- perspective is not treated as fact.
- subject/author/recorder/provenance are separate.
- evidence is linked.
- safety severity is server-derived.
- no profile/priority side effects exist.
- backend tests, HTTP E2E, web tests, and browser demo pass.

After M2-102 PASS, stop and do not start M2-103 without explicit approval.
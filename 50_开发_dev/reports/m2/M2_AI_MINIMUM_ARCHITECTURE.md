# M2 AI Minimum Architecture

date: 2026-08-10
status: PROPOSED_MINIMUM
implementation_started: NO

## 1. Rule

M2 first slice may use AI only at AL1/AL2. AI may recommend, summarize, classify candidate signals, or draft human-readable review text. AI must not directly update core ontology, assign actions, start interventions, evaluate safety final decisions, or write outcomes without a Named Action and human/policy gate.

## 2. Allowed AI Path

```text
M1 Family Aggregate
-> Consent Snapshot
-> Safety Filter
-> Minimal Context Builder
-> Model Gateway
-> AI Recommendation/Summary
-> Human Gate
-> Named Action
-> Audit/Outbox
```

## 3. Required Constraints

- Use Model Gateway for all model calls.
- Send minimum necessary context only.
- Never send full child history by default.
- Require `AI_PERSONALIZATION` consent before personalized AI use.
- Exclude `MODEL_IMPROVEMENT`, `RESEARCH`, and `CONTENT_PUBLICATION` unless separate consent exists.
- For safety signals, route to `SAFETY_ESCALATION`; do not continue normal growth flow.

## 4. First AI Use Cases

| Use Case | Allowed | Gate |
|---|---:|---|
| BuildGrowthInsight from perspective/evidence. | YES | Structured output, evidence refs, hypothesis label, human-readable review. |
| Suggest candidate dimension state from evidence. | YES | Growth Advisor Review before profile write. |
| RecommendGrowthPriority. | YES | Parent confirmation or advisor review before priority write. |
| Suggest first GrowthPriority. | YES | Parent confirmation or advisor review. |
| RecommendIntervention. | YES | Only `INTERVENTION-001` is eligible in first slice; parent confirmation before action assignment. |
| DraftGrowthReview. | YES | Human confirmation before user-visible final review. |
| Draft GrowthReview summary. | YES | Human confirmation before user-visible final review. |
| Directly assign GrowthAction. | NO | Must use Named Action. |
| Decide safety escalation final outcome. | NO | Safety route/human owner required. |
| Train model from child data. | NO | Separate consent and later governance required. |

## 4.1 Structured Output Contract

Every allowed AI output must include:

- `use_case`
- `verdict_or_recommendation`
- `evidence_refs`
- `confidence`
- `unsupported_claims`
- `safety_flags`
- `human_confirmation_required`

Outputs with empty `evidence_refs`, non-empty critical `safety_flags`, or unsupported claims about long-term personality change, therapy effect, or causality must be blocked from normal flow.

## 5. M2-101 Implementation Implication

M2-101 may implement non-AI onboarding first. If AI is introduced later in M2, the implementation must add Model Gateway, consent checks, audit, and AI output validation before any model call reaches growth state decisions.

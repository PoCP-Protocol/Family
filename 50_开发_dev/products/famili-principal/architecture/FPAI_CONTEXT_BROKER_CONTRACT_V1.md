# FPAI Context Broker Contract V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

The Context Broker is the single boundary that decides what Family context may become visible to the Principal intelligence and the model. It is an allowlist. The full `FamilyAggregate` must never be handed to an LLM.

```text
FORBIDDEN: FamilyAggregate -> LLM
REQUIRED:  Family canonical state -> Context Broker (allowlist) -> Principal -> model
```

## Core Principle

Context is a minimized, consent-gated, per-request projection. A field enters the model only if it is on this allowlist AND consent is granted AND it is needed for the current turn.

## Allowlisted Candidate Context (V1)

| field | source | why_needed | consent | retention | model_visible |
| --- | --- | --- | --- | --- | --- |
| family_id_ref | Family canonical | scope the session to one family | AI_PERSONALIZATION | session-scoped ref only | reference only, not raw identifiers |
| subject_id_ref | Family canonical | identify which member the turn is about | AI_PERSONALIZATION | session-scoped ref only | reference only |
| life_stage | Family canonical | age-appropriate framing | AI_PERSONALIZATION | not persisted in ledger raw | yes, coarse label |
| confirmed_growth_priority | Family canonical (confirmed) | align coaching to an agreed priority | AI_PERSONALIZATION | summary only | yes, summarized |
| active_intervention | Family canonical | avoid contradicting an in-progress plan | AI_PERSONALIZATION | summary only | yes, summarized |
| recent_permitted_observation_summary | Family canonical (permitted) | ground the response in recent reality | AI_PERSONALIZATION | summary only, bounded window | yes, summarized |
| recent_action_state | Family canonical | know what was already tried | AI_PERSONALIZATION | summary only | yes, summarized |
| source_surface | product runtime | adapt tone to entry surface | not personal | transient | yes |

## Field Rules

- Every field must declare SOURCE, WHY_NEEDED, CONSENT, RETENTION, MODEL_VISIBLE.
- Raw child free-text and raw identifiers are not model-visible; only bounded summaries or references.
- Any field not on this allowlist is excluded by default.
- Adding a field requires a contract revision, not a code change alone.

## Consent Gate

The broker calls `PrincipalConsentResolver` (see FPAI_CONSENT_RESOLVER). If `AI_PERSONALIZATION != GRANTED`, no personal Family context is projected; the Principal runs with non-personal context only.

## Boundaries

```text
FAMILY_AGGREGATE_TO_LLM = FORBIDDEN
RAW_CHILD_TEXT_TO_MODEL = NO
DEFAULT_FIELD_POLICY = EXCLUDE
CONTEXT_WRITES_BACK_TO_GROWTH = NO
```

The Context Broker reads canonical Family state. It never writes Family canonical growth state.

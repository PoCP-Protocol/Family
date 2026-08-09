# M2 Contract Gap Analysis

date: 2026-08-10
status: PASS_WITH_PROPOSED_CONTRACTS
implementation_started: NO

## 1. Existing Contract Foundation

Already present and reusable:

- `database/migrations/0003_growth_foundation.sql` defines growth tables for profiles, priorities, interventions, journeys, actions, events, perspectives, evidence, milestones, and outcomes.
- `specs/ontology/growth_profile.schema.yaml` exists.
- `specs/ontology/growth_event.schema.yaml` exists.
- `specs/ontology/outcome.schema.yaml` exists.
- `security/CONSENT_PERMISSION_MATRIX.csv` already names required purposes.
- `security/MINOR_DATA_SOP.md` already defines M2 growth data and M3 safety signal handling.

## 2. Gaps Blocking M2-101 Without Local Contract

| Gap | Severity | Required Before Code | M2-000 Output |
|---|---|---:|---|
| GrowthOnboarding contract absent. | HIGH | YES | `growth-onboarding.schema.yaml` |
| Perspective contract lacks explicit M2 fact boundary. | HIGH | YES | `perspective.schema.yaml` |
| Evidence contract lacks M2 evidence source/level constraints. | HIGH | YES | `evidence.schema.yaml` |
| GrowthProfile schema is broad enough but not narrowed to four dimensions. | MEDIUM | YES | `growth-profile.schema.yaml` |
| GrowthPriority schema absent. | HIGH | YES | `growth-priority.schema.yaml` |
| Intervention/action schema absent for first intervention. | HIGH | YES | `intervention.schema.yaml`, `growth-action.schema.yaml` |
| GrowthReview schema absent. | MEDIUM | BEFORE M2-107 | `growth-review.schema.yaml` |
| Decision contracts absent. | HIGH | YES | `decision-contracts.yaml` |
| Named Action list absent for M2. | HIGH | YES | `named-actions.yaml` |
| Safety/Human/AI policy contracts absent. | HIGH | YES | `policy-contracts.yaml` |

## 3. Non-Blocking Foundation Debt

- `0003_growth_foundation.sql` is structurally sufficient for planning, but M2-101 must validate whether indexes and uniqueness constraints are adequate for active profiles/priorities.
- Existing `outcomes` table supports windowed values but does not enforce per-dimension review semantics.
- `perspectives` table stores statement text but does not itself enforce fact boundary; service-level validation and contracts must do that.
- WithdrawConsent is not implemented and remains `GOV-001`, required before external pilot.
- IAM hardening remains `GOV-002`, required before external pilot.

## 4. Contract Promotion Rule

Files under `reports/m2/proposed-contracts/` are not runtime SSOT yet. M2-101 may either:

1. Promote accepted schemas into `specs/`, or
2. Treat them as task-local implementation contracts with explicit traceability.

No M2 implementation should silently diverge from these contracts.

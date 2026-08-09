# M2 Safety Consent Gate

date: 2026-08-10
status: PASS
implementation_started: NO

## 1. Consent Gate

Required before M2 growth processing:

| Purpose | Required For |
|---|---|
| SERVICE | Basic M2 service context. |
| ASSESSMENT | Perspective/evidence/profile assessment. |
| GROWTH_TRACKING | GrowthAction, GrowthEvent, Milestone, Outcome. |
| AI_PERSONALIZATION | Any personalized AI recommendation or summary. |

Purpose inheritance is forbidden. Granting `SERVICE` does not imply `ASSESSMENT`; granting `ASSESSMENT` does not imply `GROWTH_TRACKING`; granting `AI_PERSONALIZATION` does not imply `MODEL_IMPROVEMENT`, `RESEARCH`, or `CONTENT_PUBLICATION`.

Separate consent required and out of first slice:

- RESEARCH
- MODEL_IMPROVEMENT
- CONTENT_PUBLICATION

## 2. Human Gate

| Level | Meaning | M2 Route |
|---|---|---|
| LOW | Parent confirmation. | Confirm onboarding, priority, and low-risk action. |
| MEDIUM | Growth Advisor Review. | Profile creation, ambiguous evidence, outcome review. |
| HIGH | Safety owner review. | High-risk but not immediate crisis material. |
| CRITICAL | Safety escalation. | Self-harm, harm-to-others, abuse, violence, severe crisis. |

## 3. Safety Gate

Signals that must route to `SAFETY_ESCALATION`:

- self-harm
- harm to others
- abuse
- violence
- severe crisis

Safety escalation is not a growth milestone and must not be used to improve a GrowthProfile state.

## 4. Minor Data Boundary

M2 data is minor growth/behavior data under `security/MINOR_DATA_SOP.md`. Safety signals become M3 high-sensitive data and enter a separate permission domain.

## 5. Gate Result

M2-000 defines the required gates. M2-101 must implement gate checks before writing any M2 state.

## 6. Screen-Level Consent Acceptance

| Screen Range | Required Consent Behavior |
|---|---|
| F01-F02 | SERVICE is required to enter service context; ASSESSMENT and GROWTH_TRACKING are requested before onboarding creates M2 state. |
| F03-F05 | ASSESSMENT is required for perspective/profile processing; AI_PERSONALIZATION only if AI wording/personalization is used. |
| F06-F11 | GROWTH_TRACKING is required for priority/action/event/outcome/review. |
| F12 | AI_PERSONALIZATION is required; MODEL_IMPROVEMENT remains separate and optional. |

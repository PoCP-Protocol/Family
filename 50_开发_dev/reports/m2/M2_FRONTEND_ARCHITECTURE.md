# M2 Frontend Architecture

date: 2026-08-10
status: PROPOSED_REQUIRED_FOR_M2
implementation_started: NO

## 1. Scope Decision

M2 first implementation target is only:

```text
Family Web / Responsive Web
```

Do not implement Native App, Mini Program, multi-end UI, or staff/admin frontends in M2 Wave 1 unless explicitly approved later.

## 2. Proposed App Layout

```text
apps/
├── api/
└── family-web/
    ├── src/
    │   ├── app/
    │   ├── features/
    │   │   ├── family-home/
    │   │   ├── growth-onboarding/
    │   │   ├── perspective/
    │   │   ├── insight/
    │   │   ├── intervention/
    │   │   ├── timeline/
    │   │   ├── review/
    │   │   └── family-ai/
    │   ├── shared/
    │   │   ├── api/
    │   │   ├── auth/
    │   │   ├── consent/
    │   │   ├── components/
    │   │   └── design-system/
    │   └── test/
    └── package.json
```

## 3. Recommended Technical Baseline

| Concern | Direction |
|---|---|
| Language | TypeScript |
| UI Framework | React-compatible stack, final choice during M2-101 setup |
| Routing | Screen routes mapped to F01-F12 |
| API Contract | Generated or typed client from OpenAPI/contracts when practical |
| Styling | Dedicated Family design tokens, not generic admin dashboard style |
| Testing | Unit + component + browser E2E demo flow |
| Responsive | Desktop and mobile responsive from first slice |

## 3.1 Component Inventory For Wave Implementation

| Component | Used By | Required Behavior |
|---|---|---|
| JourneyShell | F01-F12 | Shows current wave, day count, next action, consent/safety banners, and mobile bottom navigation. |
| FamilyContextHeader | F01-F12 | Displays family, child age band, LifeStage, and relationship context without score/ranking. |
| ConsentGateBanner | F01-F12 as needed | Blocks or guides by purpose: SERVICE, ASSESSMENT, GROWTH_TRACKING, AI_PERSONALIZATION. |
| SafetyRouteNotice | F02/F04/F09/F12 | Overrides normal journey when safety state is `needs_review` or `safety_escalation`. |
| PerspectiveCard | F03-F05 | Labels Parent Perspective, Child Perspective, and Advisor Observation separately. |
| EvidenceBadge | F05/F06/F10/F11/F12 | Shows source count, source type, evidence level, and linked refs. |
| GrowthStatePill | F05/F06/F11 | Uses only EMERGING, DEVELOPING, PRACTICING, STABILIZING. |
| PriorityDecisionPanel | F06 | Separates recommendation from parent/advisor decision. |
| InterventionPracticeCard | F07/F08 | Shows `LISTEN_BEFORE_RESPOND` instructions and what not to do. |
| ReflectionCheckIn | F09 | Captures complete/partial/skipped plus raw note boundary and safety routing. |
| TimelineEventList | F10 | Groups events by day and links action/evidence/milestone. |
| GrowthReviewPanel | F11 | Separates baseline, observed change, evidence, confidence, confounders, and next step. |
| JourneyScopedAIPanel | F05/F08/F09/F11/F12 | Supports only Today Insight, Why this Priority, Help me do this Action, Reflect after Action, Explain this Growth Review. |

## 4. Frontend Delivery Rule

Each M2 wave must ship:

```text
Domain Contract + API + Frontend + E2E + Demo
```

Backend completion alone cannot close a Growth wave.

## 5. Integration Boundaries

- `family-web` reads M1 aggregate from `GET /families/{familyId}` for Family Home.
- Growth writes must go through Named Actions and approved APIs.
- UI must expose permission, consent, loading, empty, and error states explicitly.
- AI UI calls must go through Model Gateway only when M2 AI implementation is approved.
- No frontend component may invent Growth State, Consent, Fact, or Outcome locally.

## 6. Design System Direction

Family Web should feel quiet, emotionally precise, and journey-centered. Avoid traditional education-platform blocks such as course grids, live-class cards, expert marketplace banners, membership upsell, and activity feeds.

Growth state components should display:

```text
EMERGING / DEVELOPING / PRACTICING / STABILIZING
evidence sources
observed signals
recent changes
next action
```

They must not display total score, percentile, family ranking, or competitive comparison.

## 7. Responsive And Accessibility Acceptance

| Area | Acceptance |
|---|---|
| Mobile | Single-column journey cards, sticky Today Action/primary action, no horizontal overflow, readable consent/safety banners. |
| Desktop | Two-column journey layout where primary task stays left and evidence/context stays right; no dashboard score panels. |
| Forms | Parent/child prompts support keyboard flow, clear validation, save failure recovery, and draft preservation when practical. |
| Accessibility | Buttons have clear text/icon labels, focus order follows journey order, status labels are text not color-only, AI/hypothesis labels are announced as labels. |
| Browser E2E | Each wave must replay the canonical demo path for its screens and assert consent, permission, loading, empty, error, and success states for at least one critical screen. |

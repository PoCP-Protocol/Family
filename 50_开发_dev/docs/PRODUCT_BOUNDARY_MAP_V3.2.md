# Product Boundary Map V3.2

Status: ACTIVE_ARCHITECTURE_BASELINE
Date: 2026-08-10
Parent: `docs/FAMILY_TECH_ARCH_V3.2.md`

## 1. Product Ruling

```text
ONE_CONSUMER_APP = YES
THREE_CONSUMER_APPS = NO
PRODUCT_BOUNDARIES_SEPARATE = YES
DEPLOYMENT_SPLIT_BY_PRODUCT_DOMAIN = NO
```

Family, Famili Principal, and We are Famili are separate product domains but one household-facing experience in Family 1.0.

## 2. Frontend Apps

| App | Audience | Scope | Status |
|---|---|---|---|
| `consumer-web` | Household users | Family, Famili Principal, We are Famili, growth journey, check-in | TARGET |
| `ops-web` | Operator, advisor, safety reviewer, content reviewer | Family 360, conversation review, safety cases, content, analytics | TARGET |
| `legacy-web` | Internal legacy reference only | FELS isolated reference system | ISOLATED_PARALLEL |

`apps/web` may continue to host existing M2 pages until Consumer Shell migration is approved.

## 3. Backend Modules

| Module | Owns | Does Not Own |
|---|---|---|
| `identity` | Account, session, authn/authz, person-account binding | Family relationship truth |
| `family` | Family, Person, Parent, Child, Relationship, membership | Growth state |
| `growth` | Journey, Evidence, Profile, Priority, Intervention, Action, Outcome, Review, Timeline | AI conversation content as truth |
| `consent` | Consent grants, withdrawal, purpose authorization, retention flags | Product-specific duplicate consent stores |
| `safety` | Safety route, high-risk flags, human gate, safety case rules | Growth mutation without Named Action |
| `principal` | Principal session, intent, proposal, structured response, action proposal | Canonical Family/Growth state |
| `community` | Community surface, stories, discussions, participation signals | Growth journey state |
| `challenge` | Challenge definition, participation, check-in UX linkage | Direct GrowthEvent creation |
| `content` | Editorial content, topics, knowledge review workflow | Evidence grade authority |
| `operations` | Ops console views, advisor workflow, human handoff workflow | Domain ownership of Family/Growth facts |
| `analytics` | Product event aggregation, dashboards, experiments | Product or Growth mutations |

## 4. User Journey Boundary

The Family 1.0 MOS chain is:

```text
register / create family
  -> enter We are Famili
  -> see a real family issue
  -> ask Famili Principal
  -> receive understanding + tonight say + one small action
  -> accept the action
  -> perform it
  -> check in tonight or tomorrow
  -> Family saves the growth event
  -> see the family timeline
  -> join a 7-day / 21-day plan
  -> return again
```

This user chain is one experience. Internally, it crosses product boundaries through approved application services and Named Actions.

## 5. Principal Boundary

```text
AI Response != Family State
PrincipalActionProposal != GrowthAction
ConfirmPrincipalAction -> Named Action -> GrowthAction
```

Principal AI can propose, explain, and structure next steps. It cannot mutate canonical Family Core or Growth OS state directly.

## 6. Community Boundary

```text
CommunityChallengeParticipation != GrowthJourney
Community Event != Growth Event
StartGrowthJourney -> Named Action -> GrowthJourney
```

A challenge can invite participation. It becomes a growth journey only after user confirmation through an approved Named Action.

## 7. Operations Boundary

Operations can review, route, annotate, escalate, and support. Operations cannot silently redefine Family truth, Growth state, or consent state.

Human Handoff must exist before real household pilot.

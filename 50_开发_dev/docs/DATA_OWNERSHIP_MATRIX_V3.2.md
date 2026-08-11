# Data Ownership Matrix V3.2

Status: ACTIVE_ARCHITECTURE_BASELINE
Date: 2026-08-10
Parent: `docs/FAMILY_TECH_ARCH_V3.2.md`

## 1. Ownership Ruling

Every module must answer: who owns this data, and who may mutate it?

```text
DATA_OWNERSHIP_REQUIRED = YES
DIRECT_CROSS_DOMAIN_MUTATION = NO
NAMED_ACTION_FOR_CORE_STATE = REQUIRED
```

## 2. Ownership Matrix

| Domain Data | Owner | May Mutate Canonical State? | Mutation Path |
|---|---|---:|---|
| Family / Person / Parent / Child / Relationship | Family Core | YES | Family Named Actions |
| Growth Journey / Evidence / Profile / Priority / Intervention / Action / Outcome | Growth OS | YES | Growth Named Actions |
| Principal conversation / response / action proposal | Principal AI | NO | `ConfirmPrincipalAction` into Growth Named Action |
| Community content / participation / challenge state | Community / Challenge | NO | `StartGrowthJourney` or approved bridge action |
| Operations review / advisor note / handoff state | Operations | NO | Human-reviewed Named Action where needed |
| Product analytics / event aggregates / experiment assignment | Analytics | NO | Read-only feedback into product decisions |
| FELS legacy data | FELS | ABSOLUTELY_NO | Snapshot / Read API only |
| FLM migration state | Migration | IMPORT_ONLY | Named Import Action into Family |

## 3. Account / Person / Family Separation

```text
Account != Person
Person != Family Membership
Family Relationship != Authentication Role
```

Minimum identity objects:

```text
Account
Session
Authentication
Authorization
Person
Family Membership
Role
```

Example:

```text
Login account = account
Mother as a human = person
Mother's relation to a family = family membership / relationship
```

## 4. Consent as Central Platform Capability

Consent is not product-local storage. All frontends and product domains call the central Consent Service.

Approved purpose vocabulary for Family 1.0 planning:

```text
SERVICE
ASSESSMENT
AI_PERSONALIZATION
GROWTH_TRACKING
EXPERT_SERVICE
CONTENT_PUBLICATION
MODEL_IMPROVEMENT
```

Withdrawal and retention policy must apply uniformly across Family, Principal, Community, Operations, and Analytics.

## 5. FELS / FLM Isolation

```text
Family -> family_db
FELS -> family_legacy
```

Forbidden:

```text
Family API -> direct legacy tables
FELS -> direct Family Core mutation
FLM -> bypass Named Import Action
```

Allowed:

```text
FELS -> Read API / Snapshot -> FLM -> Named Import Action -> Family
```

# Safety and Consent Playbook

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

## Consent Principles

Consent is purpose-specific.

The following are not consent:

- relationship
- account permission
- family membership
- guardian role
- previous product usage
- implicit UI continuation

## Required Distinctions

```text
Relationship != Consent
Permission != Consent
Consent purpose A != Consent purpose B
Withdrawn consent blocks relevant downstream use
```

## Consent Review Questions

For every task touching family/person/growth/sensitive data, FCA must ask:

```text
What purpose is the data used for?
Which consent purpose is required?
Is consent checked at the action boundary?
Is consent rechecked for state-changing Named Actions?
What happens if consent is missing or withdrawn?
Is consent inherited implicitly? If yes, FAIL.
```

## Safety Principles

Safety flow and ordinary Growth Flow must be separated.

Safety escalation is not:

- a growth milestone
- a positive outcome
- a profile improvement
- a product success score

## Safety Review Questions

```text
Can ordinary clients submit final safety severity?
Is final severity server-derived?
Can medium/high/critical material continue through normal growth flow?
Is human gate required?
Is safety event separated from growth outcome?
Does UI avoid diagnosis or emergency overclaim?
```

## M2 Baseline

M2 normal growth flow may proceed only with LOW/NORMAL material according to approved server-side safety policy.

Required deterministic M2 purposes unless changed by approved contract:

- `SERVICE`
- `ASSESSMENT`
- `GROWTH_TRACKING`

`AI_PERSONALIZATION` is required only when AI personalization/model behavior is actually used.

## External Pilot Gate

Before external pilot, FCA must verify:

- withdrawal of consent path
- IAM hardening
- safety escalation SOP
- audit visibility
- data retention/deletion policy
- human review responsibility

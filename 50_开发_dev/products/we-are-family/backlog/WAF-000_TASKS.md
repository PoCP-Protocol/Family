# WAF-000 - Product Definition Tasks

Status: COMPLETED_WF0_DEFINITION
Date: 2026-08-10

## Objective

Freeze `We are 伐木累` as the Family Community & Lifestyle product track and hand off the authorized WF1 content and challenge MVP spec.

## Scope

WAF-000 covers product and architecture definition only. Runtime implementation remains out of scope for WAF-000.

In scope:

- Product role and brand boundary.
- Relationship with Family and Famili Principal AI.
- Community state ownership.
- Data conversion path into Family Core.
- Consent categories and forbidden assumptions.
- WF1 candidate MVP and handoff criteria.

Out of scope:

- Web implementation.
- API implementation.
- Database migration.
- Community feed.
- Membership.
- Recommendation/ranking.
- Direct Family Core integration.

## Required Decisions

```text
WE_ARE_FAMILY = INDEPENDENT_PRODUCT_DOMAIN
WAF_CONSUMER_DEPLOYMENT = ONE_CONSUMER_APP_SLICE
PRODUCT_ROLE = COMMUNITY_CONTENT_CHALLENGE_BRAND
DIRECT_CORE_WRITE = FORBIDDEN
WF1_STATUS = AUTHORIZED_CONTENT_CHALLENGE_MVP_SPEC
FAMILY_M2_RUNTIME_DEPENDENCY = FORBIDDEN
```

## Acceptance Criteria

- README exists and declares current phase and authorization boundaries.
- WAF0 product architecture freeze exists.
- Architecture freeze defines Family/FPAI/WAF/FELS roles.
- Architecture freeze forbids direct writes to Family Core.
- Architecture freeze defines Community Participation as separate from Growth Event.
- Architecture freeze defines consent separation for community, content publication, AI personalization, growth tracking, and model improvement.
- WF1 is handed off to `WAF-001_WF1_CONTENT_CHALLENGE_MVP_SPEC`.
- WF2/WF3 are explicitly deferred.

## Next Candidate Task

`WAF-001_WF1_CONTENT_CHALLENGE_MVP_SPEC` is authorized as the WF1 content and challenge MVP spec.

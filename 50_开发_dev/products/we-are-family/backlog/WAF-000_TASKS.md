# WAF-000 - Product Definition Tasks

Status: AUTHORIZED_WF0_DEFINITION
Date: 2026-08-10

## Objective

Freeze `We are 伐木累` as the Family Community & Lifestyle product track without authorizing runtime implementation.

## Scope

WAF-000 covers product and architecture definition only.

In scope:

- Product role and brand boundary.
- Relationship with Family and Famili Principal AI.
- Community state ownership.
- Data conversion path into Family Core.
- Consent categories and forbidden assumptions.
- WF1 candidate MVP.

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
WE_ARE_FAMILY = INDEPENDENT_FRONTEND_PRODUCT
PRODUCT_ROLE = COMMUNITY_CONTENT_CHALLENGE_BRAND
DIRECT_CORE_WRITE = FORBIDDEN
WF1_STATUS = NOT_YET_AUTHORIZED
FAMILY_M2_RUNTIME_DEPENDENCY = FORBIDDEN
```

## Acceptance Criteria

- README exists and declares current phase and non-authorization boundaries.
- WAF0 product architecture freeze exists.
- Architecture freeze defines Family/FPAI/WAF/FELS roles.
- Architecture freeze forbids direct writes to Family Core.
- Architecture freeze defines Community Participation as separate from Growth Event.
- Architecture freeze defines consent separation for community, content publication, AI personalization, growth tracking, and model improvement.
- WF1/WF2/WF3 are explicitly deferred.

## Next Candidate Task

`WAF-001_WF1_CONTENT_CHALLENGE_MVP_SPEC` may be proposed only after owner review of WAF0.

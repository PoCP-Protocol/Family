# WAF0 - We are Famili Product & Architecture Freeze

Status: AUTHORIZED_WF0_DEFINITION
Date: 2026-08-10
Owner: Family Chief Architect track

## 1. Freeze Scope

WF0 freezes product positioning and architecture boundaries. It originally did not authorize WF1 implementation, community runtime, membership runtime, or Family M2 runtime integration.

WF1 is now authorized separately by `backlog/WAF-001_WF1_CONTENT_CHALLENGE_MVP_SPEC.md` as a content and challenge MVP spec/prototype only.

```text
WAF_PRODUCT_DOMAIN = INDEPENDENT
WAF_CONSUMER_DEPLOYMENT = ONE_CONSUMER_APP_SLICE
WF1 = AUTHORIZED_CONTENT_CHALLENGE_MVP
WF2 = DEFERRED
WF3 = DEFERRED
```

WF0 deliverables:

- Product positioning.
- Brand role.
- Three-frontdoor product relationship.
- Community and challenge information architecture.
- Data ownership boundary.
- Consent boundary.
- Family Account integration boundary.
- Community Participation object family.
- WF1 MVP candidate scope.
- WF2 and WF3 deferred scope.

## 2. Product Positioning

`We are 伐木累` is the Family Community & Lifestyle product.

```text
We are 伐木累 = FAMILY_COMMUNITY_AND_LIFESTYLE
Product promise = 让一家人一起成长
```

It should be understood as:

```text
Family = 家庭成长智能平台 / Growth OS
法咪莉校长 = AI 家庭成长陪伴入口
We are 伐木累 = 家庭品牌 / 社区 / 内容 / 参与入口
FELS = 教育老系统 / reference legacy system
```

It is not:

- a generic community forum.
- a Family M2 deterministic runtime capability.
- a direct writer of Family facts, GrowthProfile, GrowthPriority, GrowthAction, Intervention, or Outcome.
- a public child growth profile surface.
- a problem-family labeling system.
- a recommendation or ranking system.

## 3. Frontdoor System

Users should see three simple frontdoor brands, while platform internals remain hidden.

```text
Family
  = 我的家庭成长空间

法咪莉校长
  = 我的 AI 家庭成长陪伴者

We are 伐木累
  = 我的家庭成长社区
```

The product triangle is:

```text
Family owns long-term family data, journey, action, and outcome.
FPAI owns AI companionship, wording, action-card candidates, and companion loops.
WAF owns brand, content, challenges, community participation, and lifestyle engagement.
```

## 4. Flywheel

The intended product loop is:

```text
Discover
  -> Companion
  -> Action
  -> Growth
  -> Share
  -> Discover
```

Example:

```text
We are 伐木累 challenge
  -> Join challenge
  -> Family Account identifies the family
  -> 法咪莉校长 supports daily practice
  -> Today Action
  -> User execution
  -> Check-in
  -> Family stores authorized growth event through Named Action
  -> Review
  -> Return to We are 伐木累 for story, badge, or next topic
```

## 5. Data Boundary

Experience can connect. Core facts cannot flow freely.

Forbidden:

```text
CommunityPost -> FamilyFact
LLMText -> GrowthProfile
CommunityComment -> GrowthEvent
ChallengeCheckIn -> Outcome
```

Required path:

```text
Community Event / User Input
  -> Evidence Candidate
  -> Consent / Policy / User Confirmation
  -> Approved Named Action
  -> Family Core
```

Core write rule:

```text
DIRECT_CORE_WRITE = FORBIDDEN
CORE_STATE_OWNER = FAMILY_GROWTH_OS
COMMUNITY_STATE_OWNER = WE_ARE_FAMILY
AI_STATE_OWNER = FPAI
INTEGRATION = API + NAMED_ACTION + EVENT
```

## 6. Identity Boundary

WAF should use shared Family Account identity rather than a separate account system.

Shared identifiers:

```text
family_id
person_id
account_id
```

Permissioned access model:

```text
Family
  may read complete authorized growth context.

Famili Principal AI
  may read only user-authorized family growth context.

We are Famili
  defaults to nickname, family stage, interest topics, community identity, and activity enrollment.
```

WAF must not expose child growth profiles, sensitive family history, or private AI companion context by default.

## 7. Consent Boundary

Consent must remain service-specific and purpose-specific.

Candidate consent categories:

```text
SERVICE
GROWTH_TRACKING
AI_PERSONALIZATION
COMMUNITY
CONTENT_PUBLICATION
MODEL_IMPROVEMENT
```

Joining a WAF activity does not imply model-improvement consent. Using FPAI does not imply public story publication consent.

## 8. First Information Architecture

WF1 candidate surface may include six areas, but only the challenge/content slice is proposed for the first MVP.

1. Today We Do Together.
2. Famili Principal Says.
3. Our Family Story.
4. Families Like Ours.
5. Join Together.
6. Family Membership.

Forbidden language patterns:

```text
problem family
rebellious-child family
defective parent
family ranking
family total score
```

## 9. Community Object Family

Community objects belong to WAF first. They must not pollute Family Growth Event directly.

Candidate objects:

- CommunityActivity
- CommunityChallenge
- CommunityParticipation
- CommunityPost
- CommunityComment
- FamilyStory
- ContentInteraction

Only explicit conversion may enter Family Timeline:

```text
CommunityParticipation
  -> user confirms Record to Growth Journey
  -> RecordGrowthEvent Named Action
  -> Family Timeline
```

## 10. Challenge Connection

The strongest WAF and FPAI connection point is Challenge.

Example WF1 candidate:

```text
21 days: change myself before trying to change the child
```

Product chain:

```text
WAF publishes challenge
  -> user joins
  -> FPAI starts daily companion script
  -> Today Action and evening review
  -> Family records authorized action/event/review
  -> WAF grants completion badge or story prompt
```

## 11. Implementation Order

```text
WF0 - Product Definition
  brand, user, community value, IA, product relationships, data boundary.

WF1 - Content + Challenge MVP
  home, topic content, family challenge, join challenge, FPAI entry, today action.

WF2 - Community
  family stories, comments, likes, topic following, events.

WF3 - Membership & Offline
  membership, advisor, expert services, Family Day, family camp.
```

WF1 is now authorized only as the content and challenge MVP defined by `backlog/WAF-001_WF1_CONTENT_CHALLENGE_MVP_SPEC.md`.

WF2 and WF3 remain not authorized until a later owner decision.

## 12. Formal Architecture Ruling

```text
WE_ARE_FAMILY = INDEPENDENT_PRODUCT_DOMAIN
WAF_CONSUMER_DEPLOYMENT = ONE_CONSUMER_APP_SLICE
PRODUCT_ROLE = COMMUNITY_CONTENT_CHALLENGE_BRAND
PLATFORM = FAMILY
AI = FAMILI_PRINCIPAL
IDENTITY = SHARED_FAMILY_ACCOUNT
CORE_STATE_OWNER = FAMILY_GROWTH_OS
COMMUNITY_STATE_OWNER = WE_ARE_FAMILY
AI_STATE_OWNER = FPAI
DIRECT_CORE_WRITE = FORBIDDEN
FAMILY_M2_RUNTIME_DEPENDENCY = FORBIDDEN
WF1_STATUS = AUTHORIZED_CONTENT_CHALLENGE_MVP_SPEC
INTEGRATION = API + NAMED_ACTION + EVENT
```

## 13. WF0 Gate

WF0 passes only when these are present and reviewed:

- Product positioning.
- Data and state boundary.
- Consent boundary.
- Family Account relationship.
- Challenge loop definition.
- WF1 candidate MVP scope.
- WF1 content and challenge MVP handoff.
- Explicit non-authorization of WF2/WF3 runtime implementation.

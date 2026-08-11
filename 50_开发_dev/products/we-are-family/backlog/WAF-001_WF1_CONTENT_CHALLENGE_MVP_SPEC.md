# WAF-001 - WF1 Content + Challenge MVP Spec

Status: AUTHORIZED_WF1_SPEC
Date: 2026-08-10
Parent: `docs/FAMILY_1_0_MOS_SYSTEM_INTEGRATION_PROGRAM.md`
Architecture Baseline: `docs/PRODUCT_BOUNDARY_MAP_V3.2.md`

## 1. Core Product Decision

We are 伐木累 WF1 is not a generic social network and not a standalone consumer app for Family 1.0.

```text
WAF_PRODUCT_DOMAIN = INDEPENDENT
WAF_CONSUMER_DEPLOYMENT = ONE_CONSUMER_APP_SLICE
WAF_MOS_ROLE = DISCOVERY_CONTENT_CHALLENGE_ENTRY
WE_ARE_FAMILY = P0_MVP_ONLY
COMMUNITY_RUNTIME_SCOPE = CONTENT_CHALLENGE_ONLY
FULL_SOCIAL_NETWORK = FORBIDDEN_IN_WF1
DIRECT_CORE_WRITE = FORBIDDEN
```

V3.2 resolves the earlier ambiguity:

```text
ONE_CONSUMER_APP = YES
PRODUCT_BOUNDARIES_SEPARATE = YES
DEPLOYMENT_SPLIT_BY_PRODUCT_DOMAIN = NO
```

Meaning: WAF remains an independent product domain and brand, but the first real household experience is one Family 1.0 consumer journey.

## 2. What WAF Must Do First

WAF first responsibility is to help a household enter the Family 1.0 loop:

```text
see a recognizable family issue
  -> join a simple challenge
  -> ask Famili Principal
  -> accept one small action
  -> check in
  -> see progress in Family Timeline
  -> return tomorrow
```

WAF is successful in WF1 only if it increases:

```text
first question rate
action acceptance rate
action completion rate
D1 return
D7 challenge retention
```

WAF is not successful just because users browse content.

## 3. First Screen Shape

The WAF first screen should feel like a community home, but it should be organized around action, not posts.

Required sections:

```text
We are 伐木累

今天大家都在聊
- 青春期
- 手机
- 作业
- 顶嘴

问法咪莉校长
- one clear entry to ask a real family question

今天的家庭挑战
- 7天先听后回应
- join challenge
- today's one small action

我的家庭
- current day
- accepted actions
- check-in state

家庭故事精选
- consented, anonymized, non-ranking stories
```

Do not expose GrowthProfile, child labels, sensitive family history, or AI companion private context.

## 4. WF1 Surfaces

### Surface A - Discovery Home

Purpose: show families that their current situation is common and actionable.

Must include:

```text
topic chips
featured challenge
Famili Principal entry
current family progress summary
selected story cards
```

### Surface B - Topic Content

Purpose: convert common pain points into a safe next action.

WF1 topics:

```text
青春期亲子沟通
手机冲突
作业拉扯
顶嘴与情绪
```

Each topic must provide:

```text
what families often feel
what not to rush into
ask Famili Principal entry
related challenge
```

### Surface C - Challenge

Purpose: organize community participation around Family Action.

WF1 challenge:

```text
7天先听后回应
```

Required steps:

```text
join challenge
get today's prompt
ask / receive Famili Principal support
accept one small action
check in
return tomorrow
```

### Surface D - Story / Activity

Purpose: create trust and referral material without creating a public family scoring system.

WF1 story rules:

```text
CONTENT_PUBLICATION consent required
anonymized by default
no child growth profile exposure
no family ranking
no problem-family labels
no before/after miracle claims
```

## 5. Domain Boundary

Community participation is WAF state first.

```text
CommunityChallengeParticipation != GrowthJourney
CommunityCheckIn != GrowthEvent
CommunityStory != Evidence
```

Conversion path:

```text
CommunityParticipation
  -> user confirms Record to Growth Journey
  -> Named Action
  -> GrowthAction / Timeline event
```

WAF must not write Family Core or Growth OS directly.

## 6. Event and Analytics Requirements

WF1 must emit product events from the first version.

Minimum events:

```text
waf_home_viewed
waf_topic_opened
waf_principal_entry_clicked
waf_challenge_viewed
waf_challenge_joined
waf_action_prompt_viewed
waf_action_accepted
waf_checkin_started
waf_checkin_submitted
waf_story_viewed
waf_story_publication_opt_in_clicked
```

These are product analytics events, not Growth events.

```text
PRODUCT_EVENT != GROWTH_EVENT
```

## 7. Consent Requirements

WF1 must respect purpose-specific consent.

Required before or during flow:

```text
SERVICE
AI_PERSONALIZATION when using Famili Principal with context
GROWTH_TRACKING before recording to Family Timeline
COMMUNITY before challenge participation state is stored
CONTENT_PUBLICATION before any story is published
MODEL_IMPROVEMENT must remain separate and optional
```

Joining a challenge must not imply story publication or model improvement consent.

## 8. Non-Goals

Do not build in WF1:

```text
full social feed
open posting
comments and likes as primary loop
private messages
followers / friends
recommendation algorithm
UGC moderation platform
membership purchase runtime
offline activity booking
family ranking
family total score
digital human
voice clone
model fine-tuning
```

## 9. Implementation Sequence

### WAF-001A - Static Product Prototype

Build a first-screen prototype that proves information architecture and interaction flow.

Validation:

```text
browser renders WAF home
join challenge local state works
ask principal entry is visible
check-in affordance exists
no direct Family Core call
```

### WAF-001B - Consumer App Slice

Integrate WAF surfaces into the Family 1.0 consumer app shell after Consumer Shell migration is approved.

Validation:

```text
ONE_CONSUMER_APP = YES
WAF appears as discovery/challenge slice
Family/FPAI/WAF user journey is continuous
```

### WAF-001C - Real Backend Integration

Connect to real HTTP, PostgreSQL, consent, analytics, challenge participation, and Named Action boundary.

Validation:

```text
REAL_HTTP = PASS
REAL_DATABASE = PASS
CONSENT = PASS
ANALYTICS = PASS
DIRECT_CORE_WRITE = FORBIDDEN
```

## 10. WF1 Acceptance Criteria

WAF-001 passes only if:

```text
WAF_HOME = PASS
TOPIC_DISCOVERY = PASS
FPAI_ENTRY = PASS
7_DAY_CHALLENGE = PASS
JOIN_CHALLENGE = PASS
ACTION_ACCEPTANCE_ENTRY = PASS
CHECKIN_ENTRY = PASS
FAMILY_TIMELINE_BOUNDARY = PASS
PRODUCT_ANALYTICS_EVENTS = PASS
CONSENT_BOUNDARY = PASS
FULL_SOCIAL_NETWORK = NOT_BUILT
DIRECT_CORE_WRITE = FORBIDDEN
```

## 11. Product Judgment

The correct first WAF community is:

```text
not a forum
not a feed
not a content portal only
not a second app island
```

It is:

```text
a household-facing action community surface
that turns family issues into challenge participation,
Famili Principal support,
one accepted action,
check-in,
and return behavior.
```

This is how We are 伐木累 serves Family 1.0 MOS.

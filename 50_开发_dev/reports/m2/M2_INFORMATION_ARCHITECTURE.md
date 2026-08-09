# M2 Information Architecture

date: 2026-08-10
status: PROPOSED_REQUIRED_FOR_M2
implementation_started: NO

## 1. Product IA

```text
Family Web
├── Family Home
│   ├── Family summary
│   ├── Current journey
│   ├── Today action
│   ├── Recent change
│   ├── Family Insight
│   └── Embedded Family AI entry points
├── Understand
│   ├── Growth Onboarding
│   ├── Parent Perspective
│   ├── Child Perspective
│   └── Growth Insight
├── Act
│   ├── Growth Priority
│   ├── Intervention Detail
│   ├── 7-Day Plan
│   ├── Today Action
│   └── Action Reflection
├── Observe
│   ├── Family Timeline
│   ├── Action History
│   └── Milestone
├── Understand Change
│   ├── Growth Review
│   ├── Evidence Explanation
│   └── Next Step
└── Family AI
    ├── Today Insight
    ├── Why this Priority?
    ├── Help me do this Action
    ├── Reflect after Action
    └── Explain this Growth Review
```

## 2. Navigation Model

Primary navigation is journey-based rather than content-category-based.

| Area | User Question | Screens |
|---|---|---|
| Home | What is happening in our family now? | F01 |
| Understand | What are we each experiencing? | F02-F05 |
| Act | What should we practice this week and today? | F06-F09 |
| Observe | What happened after we practiced? | F10 |
| Review | What changed and what next? | F11 |
| AI | Help me understand or do the next step. | F12 and embedded entry points |

## 3. Content Hierarchy

The highest priority information on Home is:

1. Family identity and current LifeStage.
2. Current Growth Journey and Day count.
3. Today's action.
4. Recent observable changes.
5. Family Insight with evidence source counts.
6. Journey-scoped Family AI assistance.

The lowest priority information on Home is:

- courses
- live classes
- expert marketplace
- activities
- membership
- generic content feed

## 4. Perspective IA

Parent and Child Perspective use separate screens and separate wording. The product must later show their difference without collapsing either into Fact.

```text
Parent Perspective != Child Perspective
Perspective != Fact
Hypothesis != Fact
Recommendation != Decision != Action
```

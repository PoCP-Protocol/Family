# Family Education Multimodal UI Research V1

Date: 2026-08-11
Product: Family / We are 伐木累
Scope: Evidence-to-interface principles for the WF1 consumer prototype

## 1. Research Position

The interface must not behave like a parenting scoreboard, a diagnostic tool, or a content feed. Its job is to help a family move from tension to one safe, reciprocal, achievable interaction.

The design direction is therefore:

```text
connection before correction
reciprocity before instruction
choice before compliance
small practice before large promise
privacy before publication
offline relationship before screen engagement
```

## 2. Evidence Synthesis

### 2.1 Responsive relationships are built through back-and-forth interaction

Harvard Center on the Developing Child describes responsive "serve and return" interaction as attentive back-and-forth exchange rather than one-way adult delivery. The core product implication is that the interface should visualize a reciprocal loop and coach one person to listen, reflect, and return the conversation.

Source: [Harvard Center on the Developing Child — Serve and Return](https://developingchild.harvard.edu/key-concept/serve-and-return/)

### 2.2 Active listening is a practiced behavior

UNICEF distinguishes hearing from listening and recommends practicing positive and negative listening examples in safe, culturally appropriate contexts. The product should therefore offer a short guided practice with a readable transcript, not a generic motivational message.

Source: [UNICEF Adolescent Kit — Active listening](https://www.unicef.org/adolescentkit/activity-box/activity/active-listening)

### 2.3 Adolescents need meaningful participation, not symbolic choice

UNICEF frames adolescent participation as the ability to express views, influence decisions, and take part in matters affecting them. The interface must let the child or family select readiness and pace, and must treat "not ready to talk" as a valid choice.

Source: [UNICEF — Adolescents and participation](https://www.unicef.org/adolescentkit/reports/guide-adolescents-and-participation)

### 2.4 Warmth and autonomy support are broadly protective

A preregistered daily-diary study of 159 parent-adolescent dyads found positive directions for parental warmth and autonomy support in 91–98% of families. The effect strength varied, so the UI should avoid one-size-fits-all prescriptions while consistently supporting warmth and choice.

Source: [Scientific Reports / PubMed — Parental warmth and autonomy support](https://pubmed.ncbi.nlm.nih.gov/36207448/)

### 2.5 Communication quality matters, but the interface must not overclaim causality

A systematic review of 37 papers found parent-child communication quality was associated with adolescent mental-health measures, mostly with small-to-medium associations, while noting that much of the evidence was cross-sectional. The product can support communication practice, but must not claim to diagnose, treat, or guarantee outcomes.

Source: [Journal of Child Psychology and Psychiatry Advances — Systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11143954/)

### 2.6 Positive parenting interventions should reduce harshness and strengthen relationships

WHO parenting guidance covers interventions designed to reduce harsh parenting and improve parent-child relationships across ages 0–17. Product language should never shame, threaten, or reward control; pause and repair must be legitimate outcomes.

Source: [WHO — Parenting intervention guidelines](https://www.who.int/teams/social-determinants-of-health/violence-prevention/parenting-guidelines)

### 2.7 Digital tools should be customized around family values and real life

The American Academy of Pediatrics Family Media Plan emphasizes customized family rules, co-use, balance, and confidentiality rather than a blunt universal time limit. The WAF interface should be a bridge to an offline interaction, avoid infinite browsing, and never autoplay sound.

Source: [AAP Pediatrics — The Family Media Plan](https://publications.aap.org/pediatrics/article/154/6/e2024067417/199968/The-Family-Media-Plan)

## 3. UI Translation

| Research principle | Interface rule | Implemented surface |
| --- | --- | --- |
| Responsive back-and-forth | Motion travels both directions; no adult-above-child hierarchy | Animated listening loop |
| Active listening is practiced | Give exact short prompts and a readable transcript | Optional audio guide |
| Adolescent participation | Provide real pace/readiness choices including pause | Relationship weather selector |
| Warmth + autonomy support | Use invitational copy; no forced disclosure | Adaptive practice copy |
| Predictable routine | Show a small, repeatable sequence | Listen → reflect → decide together |
| Non-harsh parenting | No score, streak, punishment, ranking, or red failure state | Non-evaluative completion feedback |
| Caregiver bandwidth | Offer 1-, 2-, and 5-minute variants | Weather-specific duration |
| Digital balance | Sound is opt-in; action ends offline | No autoplay; practice CTA points away from screen |
| Confidentiality | Local state first; separate consent for publication/core writes | Existing WAF privacy boundary |

## 4. Multimodal System

The UI combines four channels, each with a distinct job:

1. **Text** — concise, non-judgmental instruction and a visible audio transcript.
2. **Illustration** — models equal eye level, open posture, and attentive listening.
3. **Motion** — demonstrates reciprocal turn-taking and practice progress.
4. **Audio** — optional spoken guidance for a hands-free shared exercise.

No channel is mandatory. The experience remains understandable with images disabled, sound unavailable, or reduced motion enabled.

## 5. Safety and Product Boundaries

- No diagnostic language or child labeling.
- No automatic analysis of voice, face, emotion, or family conflict.
- No microphone capture.
- No autoplay audio.
- No public child profile or family comparison.
- "Pause for now" is a supported state, not a failed attempt.
- Crisis, abuse, or self-harm support remains outside this prototype and must route through the platform safety policy in a future authorized runtime.

## 6. Acceptance Criteria

```text
RESEARCH_TRACEABLE = YES
RECIPROCAL_INTERACTION_VISIBLE = YES
ADOLESCENT_CHOICE_MEANINGFUL = YES
AUDIO_OPT_IN_ONLY = YES
TRANSCRIPT_AVAILABLE = YES
REDUCED_MOTION_SUPPORTED = YES
NO_DIAGNOSIS = YES
NO_PUBLIC_CHILD_PROFILE = YES
NO_RANKING_OR_STREAK = YES
```

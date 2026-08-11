# FPAI Digital Human Prototype Acceptance V1

Date: 2026-08-11
Phase: DH0_DIGITAL_HUMAN_IP_FOUNDATION
Status: ACCEPTANCE_SYSTEM_READY

## Purpose

Future digital-human prototypes must be judged as `法咪莉校长`, not as generic realism demos. Looking real or having accurate lip sync is insufficient.

## Score Matrix

Each dimension is scored 1-5.

| Dimension | 1 | 3 | 5 |
| --- | --- | --- | --- |
| IP Recognition | generic avatar | somewhat consistent | clearly 法咪莉校长 |
| Trust | uncanny or performative | acceptable | calm, credible, family-safe |
| Warmth | cold or fake | polite | naturally warm without dependency |
| Intelligence | shallow | adequate | explains patterns clearly |
| Teaching Presence | no teaching sense | basic explanation | teacherly, concrete, non-scolding |
| Naturalness | robotic or host-like | tolerable | alive but not overacting |
| Persona Consistency | shifts identity | mostly stable | same Soul across scenes |
| Safety Appropriateness | unsafe affect | mixed | expression changes correctly by risk |

Recommended pass threshold for future prototype review:

```text
minimum_each_dimension = 3
average_score >= 4.0
Safety Appropriateness >= 5 for high-risk scenes
no_hard_fail = true
```

## Hard Fail Rules

Any one hard fail causes prototype failure regardless of realism.

- looks like a cloned real person
- looks like a generic livestream host
- oversexualized
- childlike persona ambiguity
- robotic authority
- therapy or doctor implication
- Bobo identity continuity implication
- voice clone implication
- unsafe high-risk expression
- separate avatar persona that diverges from Principal Soul
- vendor watermark or third-party IP dependency in core identity

## Required Prototype Evidence

Future DH1+ prototype review must include:

- static front/side/expression board
- voice sample or voice mock only if rights-cleared and non-cloned
- scene clips or storyboards for first meeting, conflict help, micro lesson, return visit, and high risk
- asset provenance registry entries
- safety expression review
- Principal Soul consistency review

## Technology Neutrality

DH0 does not select HeyGen, Synthesia, LivePortrait, MuseTalk, SadTalker, MetaHuman, Unity, Unreal, 2D, 3D, TTS vendor, voice model, or lip-sync model. Future technology choices must be evaluated against this acceptance system.

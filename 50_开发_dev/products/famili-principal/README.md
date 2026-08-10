# FPAI - Famili Principal AI

FPAI is an independent product subproject for `法咪莉校长`.

```text
FPAI_PROGRAM = ACTIVE
FP0 = PASS_INTERNAL
FP1 = AUTHORIZED_TEXT_INTELLIGENCE_MVP
FAMILY_M2_DEPENDENCY = NONE
METHOD_INHERITANCE = YES
IDENTITY_CLONING = NO
TRAINING_STARTED = NO
START_FP1 = YES_TEXT_ONLY
```

## Product Boundary

FPAI is not an M2 Wave2 capability. It must not be imported by `apps/web`, `apps/api`, or Family M2 runtime gates unless a later owner decision explicitly approves a cross-track integration.

`法咪莉校长` is a long-horizon multimodal digital-human IP: an interactive AI principal who can eventually talk, teach, converse, appear as an avatar, and carry a recognizable Family-owned soul across text, voice, and visual surfaces.

It is not a female-avatar replacement for `波波校长`. The product direction is method inheritance and new IP creation, not identity cloning. The allowed current work is to preserve source lineage, extract family-education methods, distill reusable decision patterns, and define a new `知性邻家姐姐型家庭成长 AI 校长` soul with safety governance.

Family Core owns facts and growth state. FPAI may only generate structured hypotheses, scripts, suggestions, and action-card candidates. It cannot directly write Family Core state; any future write path must go through an approved Named Action after consent and human/user confirmation.

## Current Phase

FP1 = Text Intelligence MVP.

FP0 Soul & Corpus Foundation is internally passed. Public Bobo/source attribution copy remains a separate owner decision before external launch copy.

The long-term product is multimodal, but FP1 deliberately proves the text intelligence core first. Voice, avatar, lip sync, and digital-human production remain future presentation layers and are not activated by FP1.

Authorized work:

- Real model calls through the shared Model Gateway boundary.
- Soul-guided structured text responses.
- Retrieval from reviewed/transformed method or knowledge cards only.
- Structured output validation and fail-closed repair behavior.
- Pre-generation and post-generation safety routing.
- FP1 eval execution against gold cases.

Not authorized in FP1:

- Large-scale SFT or LoRA.
- Voice cloning.
- Likeness cloning.
- Real-time avatar or lip sync.
- Digital-human production.
- 21-day companion runtime.
- M2 runtime integration.

## Track Relationship

```text
FAMILY_M2 = PRIMARY PRODUCT TRACK
FELS = REFERENCE LEGACY SYSTEM TRACK
FLM = MIGRATION TRACK
FPAI = INDEPENDENT PRODUCT TRACK
```

Existing `packages/principal-ai` runtime work must remain contract-aligned with this product boundary and must not be imported into Family M2 runtime.

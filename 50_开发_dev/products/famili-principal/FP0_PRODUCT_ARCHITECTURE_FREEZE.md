# FPAI-000 - Principal Product & Architecture Freeze

Status: AUTHORIZED_FP0
Date: 2026-08-10
Owner: Family Chief Architect track

## 1. Freeze Scope

FP0 freezes product and architecture. It does not authorize FP1 implementation or Family M2 runtime integration.

FP0 deliverables:

- Product positioning
- Brand and naming decision
- Persona and Principal Soul V1 boundary
- Five MVP entry points
- Conversation response contract
- Action card contract
- Safety contract
- Model Gateway contract
- Data and memory model
- Scenario Bank V1 policy
- Evaluation framework
- Family integration boundary
- MVP Web IA

## 2. Product Positioning

法咪莉校长 is a separate AI education companion product on the shared Family platform and the seed of a Family-owned multimodal digital-human IP. It turns family education knowledge into small executable actions, direct wording, daily check-ins, longer companion loops, and eventually interactive teaching/conversation experiences across text, voice, and visual presentation layers.

It is not:

- a Family M2 deterministic runtime capability
- a direct writer of GrowthProfile, GrowthPriority, Intervention, GrowthAction, or Outcome
- a digital-human-first implementation project
- a real-person imitation product
- a generic family education chatbot

## 3. Brand Freeze Candidate

Recommended freeze:

```text
Product brand: 法咪莉校长
Engineering name: Famili Principal AI
Project code: FPAI
```

Naming decision (Owner 2026-08-11):

```text
波波校长 is an internal source/IP reference only, one of several. It is not used in product naming and is not disclosed in public copy.
```

FP0 stance: do not use 波波校长 as product name or public attribution. FPAI absorbs strengths from multiple education IPs and is not tied to any single real-person source.

## 4. MVP Entry Points

FP1 candidate entry points:

1. Ask Principal
2. Tonight Wording
3. Today Action Card
4. 21-Day Companion
5. Principal Micro Lesson

Digital human and voice are presentation layers after text value is validated. The product destination is multimodal, but FP1 remains text intelligence only.

DH0 is a horizontal Digital Human IP Foundation track that may run in parallel with FP1. DH0 defines who `法咪莉校长` is across identity, soul, face direction, voice direction, gesture, interaction ritual, and provenance. DH0 is not FP3 runtime and does not authorize voice runtime, avatar runtime, real-time avatar, lip sync, model training, or public digital-human launch.

## 5. Principal Soul Engine

Soul is owned by FPAI and must remain model replaceable.

Proposed structure:

```text
soul/
  persona.yaml
  values.yaml
  language-style.yaml
  response-policy.yaml
  action-policy.yaml
  safety-policy.yaml
  examples/
  evals/
```

Soul must not be represented only as a giant prompt.

Future modalities must share this same Principal Soul:

```text
Principal Soul
  -> Principal Intelligence
  -> Structured Response
  -> Presentation Adapter
  -> Text / Voice / Avatar
```

Forbidden:

```text
Avatar -> separate persona / prompt / safety system
```

## 6. Runtime Boundary

```text
LLM
  -> Structured Response
  -> Schema Validation
  -> Policy / Safety
  -> Human Gate when needed
  -> User Confirmation
  -> Approved Named Action
  -> Family Core
```

Forbidden:

```text
LLM -> Family DB
LLM -> direct GrowthProfile mutation
LLM -> direct GrowthAction creation without confirmation
```

## 7. Data Boundary

FPAI owns its product data layer. Candidate objects:

- PrincipalSession
- PrincipalMessage
- PrincipalResponse
- PrincipalActionCard
- PrincipalCheckIn
- PrincipalFeedback
- PrincipalPersonaVersion
- PrincipalPromptVersion
- PrincipalModelRun
- PrincipalKnowledgeRef
- PrincipalSafetyCase
- PrincipalHumanHandoff

Family Core remains owner of Family, Parent, Child, Relationship, Evidence, GrowthProfile, Priority, Action, and Outcome.

## 8. Memory Layers

```text
M0 Session Memory
M1 Principal Preference Memory, consented
M2 Family Context, read-only with permission
M3 Longitudinal Growth Memory, future only after Outcome maturity
```

No M3 claims may be fabricated during FP0 or FP1.

## 9. Knowledge Policy

Do not start with a large RAG system. FP1 should use a reviewed small card set for common scenarios such as phone conflict, homework delay, parent anger, adolescent pushback, school refusal risk, sibling conflict, repair after shouting, and intergenerational conflict.

Every knowledge card must include:

```text
claim
source
owner
review_status
applicable_context
contraindication
safety_notes
version
```

Bole-derived or public IP-derived material may be used for scenario/style/eval candidates only under E1 limits unless separately authorized, reviewed, and de-identified.

## 10. FP0 Gate

FP0 passes only when these are present and reviewed:

- FPAI product positioning
- brand/persona freeze
- Principal Soul V1 file set
- conversation contract
- action card contract
- safety contract
- model gateway contract
- data and memory model
- scenario bank policy
- evaluation framework
- Family integration boundary
- MVP Web IA

FP1 remains blocked until FP0 gate is PASS.

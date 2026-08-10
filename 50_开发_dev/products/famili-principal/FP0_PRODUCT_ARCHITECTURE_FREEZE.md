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

法咪莉校长 is a separate AI education companion product on the shared Family platform. It turns family education knowledge into small executable actions, direct wording, daily check-ins, and longer companion loops.

It is not:

- a Family M2 deterministic runtime capability
- a direct writer of GrowthProfile, GrowthPriority, Intervention, GrowthAction, or Outcome
- a digital-human-first product
- a real-person imitation product
- a generic family education chatbot

## 3. Brand Freeze Candidate

Recommended freeze:

```text
Product brand: 法咪莉校长
Engineering name: Famili Principal AI
Project code: FPAI
```

Open naming question for FP0 review:

```text
Is 波波校长 only an external source/IP reference, or is it retired from product naming?
```

Default FP0 stance: do not use 波波校长 as product name unless explicit authorization, rights, and brand decision exist.

## 4. MVP Entry Points

FP1 candidate entry points:

1. Ask Principal
2. Tonight Wording
3. Today Action Card
4. 21-Day Companion
5. Principal Micro Lesson

Digital human and voice are presentation layers for FP4 after text value is validated.

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

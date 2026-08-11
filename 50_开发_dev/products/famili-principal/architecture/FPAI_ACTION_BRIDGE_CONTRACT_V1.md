# FPAI Action Bridge Contract V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

The Action Bridge is the only path from a Principal action proposal to a real Family growth action. It exists so the AI can never invent or directly write a `GrowthAction`.

## V1 Capability

V1 allows exactly one thing:

```text
Principal -> recommend an EXISTING approved intervention
```

It forbids:

```text
LLM -> invent an arbitrary GrowthAction
LLM -> INSERT growth_actions
```

## First Bridge

The first and only bridged action in V1:

```text
LISTEN_BEFORE_RESPOND
```

## Flow

```text
Principal Response
      -> One Small Action Proposal (PrincipalActionProposal)
      -> User Explicit Confirmation (human)
      -> Action Bridge (allowlisted mapping)
      -> Existing LISTEN_BEFORE_RESPOND
      -> Existing Named Action
      -> GrowthAction
```

The bridge maps a proposal to a pre-existing Named Action. It carries no free-text into the canonical write; it only triggers an already-defined, already-approved action.

## Hard Rules

```text
AI_DIRECT_GROWTH_WRITE = FORBIDDEN
AI_INVENT_ACTION = FORBIDDEN
BRIDGE_REQUIRES_HUMAN_CONFIRMATION = YES
BRIDGE_ALLOWLIST_ONLY = YES
UNCONFIRMED_PROPOSAL_TRIGGERS_ACTION = NO
```

- No proposal becomes an action without an explicit human confirmation event.
- The bridge only fires Named Actions that already exist in the Family growth OS.
- HIGH_RISK routing disables the bridge entirely (see FPAI_SAFETY_HUMAN_GATE).

## Boundaries

The Action Bridge never calls `INSERT growth_actions` directly. It invokes the existing Named Action path, which owns the canonical write. Principal remains a proposer, the human remains the decider, and the Family growth OS remains the writer.

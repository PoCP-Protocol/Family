# FPAI Safety / Human Gate Contract V1

Date: 2026-08-11
Phase: M3-PRINCIPAL-000
Status: DESIGN_CONTRACT_ONLY

## Purpose

Freeze the risk routing and the rule that HIGH_RISK cuts the Action Bridge and hands off to a human.

## Risk Routes (frozen)

```text
NORMAL
REVIEW
HIGH_RISK
```

## HIGH_RISK Rule

```text
HIGH_RISK
  -> stop normal coaching
  -> no normal action proposal
  -> no action bridge
  -> no intervention start
  -> human / safety handoff (PrincipalHumanHandoff)
```

On HIGH_RISK, the Principal does not produce a normal coaching flow or an action proposal, and the Action Bridge is disabled for that turn.

## REVIEW Rule

`REVIEW` allows a bounded response but flags the turn for human review before any proposal is bridged. A REVIEW turn may still require confirmation and may be escalated to HIGH_RISK.

## Safety Checks Retained

```text
Safety Precheck   (before model / response shaping)
Safety Postcheck  (after response, before display and before any proposal)
```

Both checks are retained from FP1. A response failing postcheck is not displayed as normal coaching and is routed accordingly.

## Boundaries

```text
HIGH_RISK_BRIDGE = DISABLED
HIGH_RISK_ACTION_PROPOSAL = NONE
HIGH_RISK_INTERVENTION_START = NO
SAFETY_PRECHECK = REQUIRED
SAFETY_POSTCHECK = REQUIRED
```

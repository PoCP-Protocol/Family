# V3.1 Phase 1B AI-02 Context + Safety Report

date: 2026-08-10
owner: AI-02 Growth Context + Safety Backend
depends_on: BARRIER-1, AI-01 semantic contract pass

## Verdict

AI02_CONTEXT_SAFETY = PASS_WITH_E2E_VALIDATION_REQUIRED
SERVER_DERIVED_CONTEXT = PASS
CLIENT_GOVERNANCE_FIELD_REJECTION = PASS
NORMAL_SAFETY_ROUTE_GATE = PASS
BUSINESS_CODE_MODIFIED = NO
WAVE3_STARTED = NO

## Evidence

Runtime files inspected:

- `apps/api/src/modules/family/growth-subject.resolver.ts`
- `apps/api/src/modules/family/normal-safety-route.policy.ts`
- `apps/api/src/modules/family/growth-priority.service.ts`
- `apps/api/src/modules/family/intervention.service.ts`
- `apps/api/src/modules/family/growth-action.service.ts`
- `apps/api/src/modules/family/confirm-growth-priority.dto.spec.ts`
- `apps/api/src/modules/family/start-intervention.dto.spec.ts`
- `apps/api/src/modules/family/complete-growth-action.dto.spec.ts`

## Context Boundary

`GrowthSubjectResolver` resolves the Wave2 child through onboarding and provenance. It does not select an arbitrary family child and does not accept child or guardian IDs from the M2 priority/intervention/action request payloads.

Resolution evidence:

- Requires canonical active onboarding with journey type `PARENT_CHILD_COMMUNICATION_CONFLICT`.
- Uses `GrowthOnboardingStarted` payload and perspective provenance to find exactly one child.
- Requires resolved person to be `CHILD`.
- Resolves guardians through `family_relationships` with `PARENT_CHILD` or `GUARDIAN_CHILD`.
- Validates profile or priority provenance against onboarding evidence when profile/priority context is provided.

## Safety Boundary

`assertNormalSafetyRoute` is a server-side gate. It blocks M2 priority confirmation, intervention start, and action check-in unless:

- onboarding safety screening result is `LOW`;
- every related perspective has safety disposition `NORMAL` and severity `LOW`;
- empty safety disposition `{}` is treated as not verified and blocked.

Client-provided governance fields are rejected by DTO tests for all three M2 write actions.

## Remaining Runtime Validation

AI-02 does not claim CT5 or Wave2 PASS. AI-05 must still prove these gates through real PostgreSQL + HTTP E2E:

1. missing or revoked required consent blocks writes;
2. non-normal safety route blocks priority, intervention, and action check-in;
3. multi-child family does not leak or arbitrarily select a child;
4. no profile, outcome, milestone, or AI side effects are written by M2 action flow.

## Gate Statement

BARRIER-3 RUNTIME = PARTIAL_PASS_PENDING_AI05_REAL_E2E

AI-02 backend context/safety boundary is sufficient for Phase1B continuation, but Wave2 closure remains blocked until AI-05 validates the real system path.
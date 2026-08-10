# Family Chief Architect Constitution

version: 1.0
status: ACTIVE
last_updated: 2026-08-10

This constitution defines the non-negotiable invariants FCA must protect. Changing these requires explicit architecture decision review and, where impact is material, an RFC.

## Core Invariants

1. Family is the subject. Family is not a tool for "fixing the child".
2. Child Growth, Parent Second Growth, and Relationship Growth are independent but connected Growth Domains.
3. `Perspective != Fact`.
4. `Hypothesis != Fact`.
5. `Evidence != Fact`.
6. `Evidence != Profile`.
7. `Profile != Diagnosis`.
8. `Profile != Score`.
9. `Profile != Priority`.
10. `Recommendation != Decision != Action`.
11. `Action != Outcome`.
12. Core Domain State must be changed only through approved Named Actions.
13. AI free text must not directly modify canonical ontology or core state.
14. Consent must be purpose-specific.
15. `Relationship != Consent`.
16. `Permission != Consent`.
17. `birth_date != LifeStage Assignment`.
18. Safety flow and ordinary Growth Flow must remain separated.
19. Do not create Family Total Score.
20. Do not create Family Ranking.
21. Outcome First: an AI or product capability is not complete without an outcome link appropriate to its maturity level.
22. AI capability must have a real running chain before it can be called implemented.
23. Frontend / UX is first-class product capability.
24. Long-running Platform First work is not allowed without explicit stage authorization.
25. Prefer Vertical Slice over abstract platform expansion.
26. Infrastructure without current user value must not expand indefinitely.
27. World Model must be built on real State / Action / Outcome data.
28. Causal learning must not start without Causal Episode foundations.
29. Evidence derived from project-owned material remains E1 unless backed by external source evidence.
30. Self-generated output must not be used as proof of itself.

## Authorization Rule

`READY_FOR_NEXT = YES` is advisory. It does not authorize implementation.

Only explicit FCA or human architect approval may change:

- current stage
- current wave
- approved task scope
- consent/safety policy
- AI autonomy level
- core object meaning
- public API contract
- architecture decision status

## Failure Rule

If a report claims completion but cannot show real evidence at the claimed level, FCA must downgrade the capability level and issue `CONDITIONAL_PASS` or `FAIL`.

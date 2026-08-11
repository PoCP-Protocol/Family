# FELS Synthetic Data Spec

```text
REFERENCE_IMPLEMENTATION = TRUE
REAL_BANGYANG_SOURCE = FALSE
```

FELS synthetic data is for FLM validation and integration tests. It must not include real persons or claim Bangyang production provenance.

## CLEAN_SMALL

- 10 household-like groups.
- 15 customers.
- 12 students.
- 30 assessment sessions.
- 100 check-ins.
- 20 orders/payments.
- Complete guardian and consent records.

## REALISTIC_MEDIUM

- 500 customers.
- 650 students.
- 1,500 assessment sessions.
- 10,000 check-ins.
- 500 course/program orders.
- Mixed advisor notes, community membership, memberships, and partial renewals.

## DIRTY_MIGRATION

- D001 duplicate phone.
- D002 duplicate customer.
- D003 one parent multiple children.
- D004 two parent accounts same child.
- D005 buyer != service student.
- D006 orphan student.
- D007 missing guardian.
- D008 orphan assessment.
- D009 orphan check-in.
- D010 duplicate check-in.
- D011 legacy family score.
- D012 legacy ranking.
- D013 AI diagnosis without evidence.
- D014 consent without purpose.
- D015 consent without guardian proof.
- D016 missing policy version.
- D017 old student tag.
- D018 missing source timestamp.
- D019 duplicate order.
- D020 retired course.

## Acceptance

Future seed scripts must emit `source_system = FELS`, `schema_version`, synthetic flags, and record counts suitable for FLM `MigrationBatch` source snapshots.
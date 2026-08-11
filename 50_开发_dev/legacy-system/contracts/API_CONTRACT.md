# FELS REST and Export API Contract

```text
REFERENCE_IMPLEMENTATION = TRUE
REAL_BANGYANG_SOURCE = FALSE
```

FELS-0 defines API contracts only. FELS-1 may implement business writes after authorization.

## Minimum Future Write Paths

- `POST /customers`
- `POST /contacts`
- `POST /students`
- `POST /student-guardians`
- `POST /assessment-sessions`
- `POST /assessment-results`
- `POST /orders`
- `POST /enrollments`

## Minimum Future Read Paths

- `GET /customers/:id`
- `GET /students/:id`
- `GET /assessments/:id`
- `GET /programs/:id`
- `GET /checkins`
- `GET /advisor-notes`
- `GET /legacy-snapshots/:id`

## Read-only Export Paths

All export paths require pagination with `limit` and `cursor`.

- `GET /legacy-export/customers`
- `GET /legacy-export/students`
- `GET /legacy-export/assessments`
- `GET /legacy-export/programs`
- `GET /legacy-export/tasks`
- `GET /legacy-export/checkins`
- `GET /legacy-export/advisor-notes`
- `GET /legacy-export/orders`
- `GET /legacy-export/consents`

## Source Snapshot

Every export batch must be traceable to:

- `legacy_snapshot_id`
- `source_system = FELS`
- `snapshot_created_at`
- `schema_version`
- `record_counts`
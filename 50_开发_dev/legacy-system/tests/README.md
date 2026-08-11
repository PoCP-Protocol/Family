# FELS Tests

FELS-0 executable checks live in:

- `contracts/src/index.spec.ts`
- `apps/api/src/main.spec.ts`
- `apps/web/src/app.spec.ts`

Future FELS-1+ integration tests should use `LEGACY_DATABASE_URL` and must not point at Family `DATABASE_URL`.
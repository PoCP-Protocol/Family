# Family Testing Standard

## 每个Named Action至少测试
1. happy path
2. schema invalid
3. not found
4. permission denied
5. precondition failed
6. idempotency（写Action）
7. audit
8. domain event
9. transaction rollback

## 测试层级
- Unit：Domain rules
- Application：Action handler/use case
- Integration：DB + repository + transaction + outbox
- Contract：OpenAPI/schema
- E2E：Vertical Slice
- AI Eval：Golden/Safety/Adversarial

## Merge Gate
必须通过：
lint + typecheck + unit + integration + contract。
涉及AI再加Eval。

## Required Test Commands

- `pnpm test`：unit-only 快速回归,不得作为 DoD-L1 完成依据。
- `pnpm test:unit`：全部 unit tests,不得依赖数据库。
- `pnpm test:integration`：全部 DB integration tests,必须设置 `TEST_DATABASE_URL`。
- `pnpm test:e2e`：全部 HTTP E2E tests,必须设置 `TEST_DATABASE_URL`。
- `pnpm test:required`：DoD-L1 权威入口,必须覆盖 unit + integration + e2e。

## Database Test Rule

- integration/e2e 只能读取 `TEST_DATABASE_URL`,测试启动时再映射为应用内部 `DATABASE_URL`。
- `TEST_DATABASE_URL` 缺失时必须 fail,不得 `describe.skip` 或静默跳过。
- `TEST_DATABASE_URL` 必须指向隔离 PostgreSQL,不得指向生产库或共享业务库。
- Turbo task 必须显式声明 `TEST_DATABASE_URL` env,避免 aggregate test 丢失 DB 环境。

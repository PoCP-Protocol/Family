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

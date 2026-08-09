# GOV-001 — WITHDRAW CONSENT

Status: REQUIRED_BEFORE_EXTERNAL_PILOT
Blocks M2 implementation: NO
Blocks external Pilot: YES

目标：

补齐 Consent lifecycle 的 GRANTED → WITHDRAWN。

至少要求：

- purpose-specific withdrawal
- subject / guardian / actor authorization
- policy version trace
- immutable history
- audit
- outbox
- idempotency
- effective withdrawal time
- downstream processing enforcement hook
- consent UI confirmation
- HTTP E2E
- real PostgreSQL

禁止删除历史Consent。

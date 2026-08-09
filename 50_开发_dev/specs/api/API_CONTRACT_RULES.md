# API Contract Rules

1. OpenAPI是HTTP契约SSOT。
2. 核心写接口必须映射到Named Action。
3. 核心对象无generic PATCH。
4. 关键写接口必须有：
   - Authorization
   - X-Correlation-Id
   - Idempotency-Key（适用时）
5. Error必须返回machine-readable `code`。
6. Breaking change必须RFC + API version decision。
7. Server生成Canonical IDs。
8. DTO不能直接复用数据库Entity。

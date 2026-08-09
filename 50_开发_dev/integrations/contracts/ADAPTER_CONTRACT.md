# Integration Adapter Contract

所有外部系统必须经Anti-Corruption Layer。

结构：

```text
External API / DB
↓
Raw External DTO
↓
Adapter Mapper
↓
Canonical DTO
↓
Validation
↓
Family Named Action / Import Command
```

## Adapter必须提供
- connector id
- source system
- auth mechanism
- sync mode
- retry policy
- idempotency strategy
- raw DTO schema
- canonical DTO schema
- mapping table
- error handling
- observability
- PII classification

## 禁止
- 外部字段直接成为Family Domain字段
- 用外部ID作为Family canonical ID
- 未记录source lineage

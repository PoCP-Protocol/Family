# Family Engineering Contract Index V1.1

## 这次补齐的7类工程契约

### 1. Database
`database/`
- ER Diagram
- Full DDL
- migrations

### 2. Agent
`agents/`
- Agent Card Template
- Registry
- 5个初始Agent规格

### 3. API
`specs/api/openapi-family-platform-v0.2.yaml`
- Family Core
- Growth foundation
- auth / idempotency / correlation / errors

### 4. Human Gate
`policies/HUMAN_GATE_POLICY.yaml`
`policies/HUMAN_GATE_MATRIX.md`

### 5. Model Router + Eval
`models/`
`evals/specs/`
`evals/golden_jsonl/`

### 6. Monorepo / CI / Test / Coding
`scaffold/`

### 7. Consent / Minor / Event / Adapter DTO
`security/`
`events/`
`integrations/`

---

# AI开发前加载顺序

1. CLAUDE.md
2. PROJECT_STATUS.md
3. CURRENT_SPRINT.md
4. ENGINEERING_CONTRACT_INDEX.md
5. 当前Task Pack
6. Task引用的数据库/API/Policy/Agent/DTO Spec

AI不应该一次性加载全部文件。

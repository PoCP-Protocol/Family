# Coding Conventions

## TypeScript
- strict=true
- 禁止any进入Domain/API public contracts
- Domain层不依赖HTTP/ORM/LLM Provider
- DTO与DB Entity分离
- 时间统一ISO-8601 / UTC入库
- UUID由Server生成

## Module
- 每个module包含：
  - domain
  - application
  - infrastructure
  - api
  - tests

## Errors
使用稳定错误码：
- VALIDATION_ERROR
- FORBIDDEN
- NOT_FOUND
- PRECONDITION_FAILED
- IDEMPOTENCY_CONFLICT
- CONSENT_REQUIRED
- HUMAN_GATE_REQUIRED

## Logging
不得打印未脱敏未成年人敏感数据。

## PR
一个PR尽量对应一个Task Pack。
禁止一个PR同时实现多个未批准Story。

# TASK-001_ENGINEERING_BOOTSTRAP

status: APPROVED_AFTER_TASK_000_PASS

## Business Intent
建立Family V1可持续AI开发的工程底座。

## Preconditions
- TASK-000完成
- 如果已有成熟工程，优先适配，不盲目重建

## Preferred Stack If Repo Is Empty
- pnpm workspace
- TypeScript
- NestJS backend
- React frontend shell
- PostgreSQL
- Zod/JSON Schema
- OpenAPI
- Vitest/Jest
- Docker Compose for local dependencies

## Required Outputs
- apps/api
- packages/contracts
- modules/family placeholder
- db migration mechanism
- audit table/model foundation
- health endpoint
- lint
- unit test
- integration test bootstrap
- `.env.example`
- local README

## Explicitly Out of Scope
- Family business actions
- AI
- GrowthProfile
- Journey
- CRM integration

## Acceptance Criteria
AC1 build passes
AC2 lint passes
AC3 tests run
AC4 API starts
AC5 DB migration up/down strategy documented
AC6 health endpoint works
AC7 no secrets committed
AC8 audit infrastructure can accept actor/correlation metadata

## Stop
如果现有Repo技术栈与Preferred Stack不同但可用，必须先报告，不得无理由迁移技术栈。

# TASK-000_REPO_AUDIT

status: APPROVED
type: ANALYSIS_ONLY

## Goal
理解当前代码库真实状态，并判断是否为空Repo、已有项目、还是需要适配既有代码。

## Must Read
- /CLAUDE.md
- /PROJECT_STATUS.md
- /CURRENT_SPRINT.md
- /docs/02_ARCHITECTURE_BASELINE.md

## Do Not
- 不修改代码
- 不安装依赖
- 不删除任何文件
- 不重构

## Inspect
1. repo root
2. package manager
3. apps/modules/packages
4. backend framework
5. frontend framework
6. database/migrations
7. test setup
8. lint/format
9. CI
10. env handling
11. existing domain entities
12. existing AI integration
13. existing adapters
14. security/consent implementation

## Output
创建：
`reports/REPO_AUDIT_REPORT.md`

必须包含：
- Current State
- Reusable Components
- Conflicts with Family baseline
- Missing Foundation
- Recommended Bootstrap Path
- Risk
- Whether TASK-001 can proceed

## Done
只有报告完成，不写任何业务代码。

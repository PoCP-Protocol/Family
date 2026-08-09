# Branch / PR Policy

- main受保护
- AI不得直接push main
- branch:
  - task/TASK-101-create-family
  - fix/...
- 1 Task Pack ≈ 1 PR
- PR必须附：
  - Task ID
  - Specs read
  - Files changed
  - Test results
  - Migration impact
  - Risks
- Domain Spec变化必须先RFC/ADR，不和实现偷偷混在同一PR。

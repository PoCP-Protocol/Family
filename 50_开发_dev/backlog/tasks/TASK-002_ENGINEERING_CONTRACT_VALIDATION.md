# TASK-002_ENGINEERING_CONTRACT_VALIDATION

status: APPROVED_AFTER_TASK_001_PASS
type: ANALYSIS_AND_VALIDATION

## Goal
在业务开发前验证V1.1工程契约是否能在当前Repo技术栈中落地。

## Must Validate
1. DDL能否执行
2. OpenAPI是否可解析
3. JSON Schema是否可验证
4. Agent YAML结构是否可加载
5. Human Gate policy是否可配置
6. Event envelope schema是否可验证
7. CI/scaffold是否与现有Repo冲突
8. Consent matrix是否有未定义角色
9. DTO mapping是否满足当前集成现实

## Output
`reports/ENGINEERING_CONTRACT_VALIDATION.md`

## Do Not
- 不擅自改变业务语义
- 不因为实现困难删除Policy
- 有冲突时提RFC

## Gate
通过后才开始TASK-101。

# FAMILY_PHASE10F_DATA_GOVERNANCE_APPROVAL_001 任务契约

**状态：** 内部确定性开发与隔离数据库验证授权。  
**目标：** 在 Phase 10E 生命周期请求记录之上，建立家庭私有数据分类、保留规则、可导出字段白名单和人工审批状态机的最小治理对象与只读预览能力。

## 1. 冻结范围

本工作包允许将既有生命周期请求从 `REQUESTED` 变更为内部治理状态 `PENDING_HUMAN_REVIEW`、`APPROVED_FOR_SYNTHETIC_VALIDATION` 或 `REJECTED`。该状态只是内部审批记录：`APPROVED_FOR_SYNTHETIC_VALIDATION` 只允许未来在合成数据上验证导出包格式，**不允许**对任何真实家庭生成、下载、传输或外发文件。

数据分类固定为：`IDENTITY_AND_MEMBERSHIP`、`CONSENT_AND_LIFECYCLE`、`FAMILY_SERVICE_PROCESS`、`FAMILY_SUBJECTIVE_FEEDBACK`、`AUDIT_AND_GOVERNANCE`。保留规则固定为文档化的 policy metadata；不得启动定时清理、删除任务、备份清理、跨库同步或任何不可逆操作。导出字段白名单只展示可被未来导出设计考虑的字段名称与理由，不读取或返回字段值。

## 2. 最小模型与 API

| 对象 | 决定 |
|---|---|
| 分类/保留策略 | 固定版本化 policy 文件与服务端常量；当前只读 |
| 白名单预览 | 返回类别、对象、允许字段名、原因和敏感级别；不返回值、不生成文件 |
| 人工审批 | 仅内部 guardian 发起、内部 human reviewer 状态记录；不创建真人服务、通知或工单 |
| 请求状态 | `REQUESTED` → `PENDING_HUMAN_REVIEW` → `APPROVED_FOR_SYNTHETIC_VALIDATION` / `REJECTED` |
| API | GET policy/whitelist preview；POST 提交 review；POST 内部记录 review decision；GET request history |
| Named Action | `ReadFamilyDataGovernancePolicy`、`SubmitFamilyDataLifecycleReview`、`RecordFamilyDataLifecycleHumanDecision` |

## 3. 权限与 Human Gate

家庭监护人可读取其家庭的分类、保留规则和字段白名单，并可将自己的请求提交人审。内部 human reviewer 身份在本工作包中只能以确定性、显式的内部测试 actor 进行验证；不接入组织、外部顾问、任务派发或真实人工服务。每项 decision 必须记录 reviewer、reason code、policy version、幂等键、审计和 outbox。

## 4. fail-closed 边界

请求不存在、家庭不匹配、actor 非 guardian、没有有效 trusted context、状态跃迁非法、review reason 非枚举、传入字段值/导出格式/接收方/执行参数、或试图批准真实导出/删除时，均必须拒绝。未批准、被拒绝或缺失策略时，白名单只读预览可返回但不得产生导出或删除副作用。

## 5. 验收条件

真实 PostgreSQL 测试覆盖：分类与白名单内容无字段值；合法状态跃迁、重复幂等、非法跃迁、跨家庭、非 guardian、撤销 binding、reviewer 不匹配；审计与 outbox；核心对象计数不变；全量 API 回归、类型检查和静态红线审计通过。完成后独立提交并推送当前开发分支，再报告 Gate。

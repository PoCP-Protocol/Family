# FAMILY_PHASE10E_DATA_RETENTION_EXPORT_DELETE_REQUEST_001 任务契约

**状态：** 内部确定性开发授权  
**目标：** 为家庭提供家庭范围的数据导出、保留复核和删除请求的受控记录，以及不含原始内容的只读影响预览；不执行任何数据导出、保留清理或不可逆删除。

## 1. 冻结范围

本工作包新增显式 `FamilyDataLifecycleRequest` 对象。家庭监护人可对其家庭创建三种请求：`EXPORT_REQUEST`、`RETENTION_REVIEW`、`DELETE_REQUEST`。请求的状态固定为 `REQUESTED`，不自动排队、不自动外发、不生成下载文件、不调用真人、模型或外部系统。只读 preview 仅返回该家庭的对象计数和固定边界说明，不返回自由文本、孩子信息、资源内容、身份标识或其他家庭数据。

任何实际导出、人工审批、保留期执行、加密擦除、软/硬删除、审计删除、跨库清除、备份清除、生产数据处理和通知外发均不在本工作包范围内，必须通过独立数据治理与合规 Gate。

## 2. 最小对象、API 与 Named Action

| 项目 | 冻结决定 |
|---|---|
| 数据表 | `family_data_lifecycle_requests`；仅记录家庭、请求类型、范围、状态、请求人、理由、幂等键和时间 |
| 请求类型 | `EXPORT_REQUEST`、`RETENTION_REVIEW`、`DELETE_REQUEST` |
| 请求状态 | 仅 `REQUESTED`；不存在自动执行状态 |
| 写 API | `POST /families/:familyId/data-lifecycle/requests` |
| 读 API | `GET /families/:familyId/data-lifecycle/preview`；`GET /families/:familyId/data-lifecycle/requests` |
| Named Action | `CreateFamilyDataLifecycleRequest`、`ReadFamilyDataLifecyclePreview`、`ReadFamilyDataLifecycleRequest` |
| 权限 | 只允许 ACTIVE `OWNER_GUARDIAN` / `GUARDIAN`；服务层再确认 trusted adult 与同家庭范围 |
| Preview | 仅同家庭对象计数：persons、consents、intents、service cases、follow-ups、lifecycle requests；所有值为计数而非内容 |

## 3. 正清单

每个写操作均经过 trusted family context、显式 Named Action、幂等、家庭范围、guardian 校验、审计和 outbox 事件。请求 scope 必须是固定枚举 `FAMILY_PRIVATE_DATA`，客户端不能选择表、subject、外部接收方、导出格式或删除执行方式。读取 preview 前再次检查家庭范围，数据缺失或范围不匹配时 fail-closed。

## 4. 负清单

不得实际生成/下载/传输导出文件；不得删除、匿名化、覆盖、归档或改变任一核心对象；不得访问其他家庭、组织、账号、备份、日志或生产数据库；不得公开或向 Provider/顾问发送请求；不得从主观帮助感推断成长效果；不得引入支付、权益、外部模型、训练、试点、生产或 master 合入。

## 5. 验收条件

真实 PostgreSQL 集成测试至少覆盖：监护人创建三类请求；相同请求幂等；跨家庭、成人成员、儿童主体、撤回 binding 和非法 scope/type 均 fail-closed；preview 仅返回计数且不含任何自由文本或 UUID；审计与 outbox 存在；所有核心对象保持计数不变。API 类型检查、全量回归、静态边界审计通过后才能提交当前开发分支。

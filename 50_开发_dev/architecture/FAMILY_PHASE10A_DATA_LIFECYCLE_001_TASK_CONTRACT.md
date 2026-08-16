# FAMILY_PHASE10A_DATA_LIFECYCLE_001 任务契约

**状态：** 内部确定性开发授权  
**目标：** 在现有 Family Core 与 consent 事实模型上，补齐家庭私有 SERVICE consent 撤回、最小可见和审计边界。

## 冻结范围

本工作包只实现一个 Named Action：`WithdrawConsent`。撤回通过现有 `consents.status` 变为 `WITHDRAWN`、写入 `withdrawn_at`、保留历史记录，并经现有家庭权限、可信家庭上下文、幂等、审计和事件路径完成。默认 Family aggregate 继续只返回 `GRANTED` consent，因此撤回后不再作为活跃服务许可可见。

本工作包不实现核心 consent 行的物理删除，不清除审计事件，不批量删除家庭、孩子、ServiceCase、FollowUp 或资源资产，不实现组织/跨家庭删除，不实现 Payment、Entitlement、Enrollment/Delivery、Provider、外部模型或训练运行时。不可逆删除若未来需要，必须另立数据生命周期与合规 Gate。

## API / DTO / 数据边界

| 对象 | 决定 |
|---|---|
| API | 新增 `POST /families/:familyId/consents/:consentId/withdraw` |
| Named Action | `WithdrawConsent`，仅显式家庭管理权限；执行者必须是该 consent 的 guardian |
| Request DTO | `family_id`、`consent_id`、`idempotency_key`，不接受客户端传 actor、subject 或 family scope |
| Response DTO | 返回被撤回的 `ConsentDto`，不返回任何 child outcome 或推断 |
| 数据库迁移 | 仅在现有 schema 不足时新增；优先复用 `WITHDRAWN`、`withdrawn_at`、audit、idempotency、domain event |
| 读模型 | 活跃家庭 aggregate 只显示 `GRANTED`，撤回历史不默认暴露 |

## 正清单

通过可信服务端上下文识别 actor；验证家庭存在、consent 属于请求家庭、actor 是 consent guardian；同一 consent 只能从 `GRANTED` 撤回；重复相同幂等请求返回同一结果；写入审计和 `ConsentWithdrawn` 事件；撤回后服务链的 consent gate fail-closed。

## 负清单

不得由成员身份自动推断 guardian；不得跨家庭按 consent UUID 撤回；不得由前端提交 actor/family/subject 覆盖服务端范围；不得把撤回写成删除事实；不得删除审计；不得把撤回推断为成长结果；不得自动撤销其他 purpose；不得启用外部模型、训练、组织访问、跨家庭统计、支付、试点、生产或 master 合入。

## 验收条件

真实 PostgreSQL 集成测试覆盖正向撤回、历史保留、默认 aggregate 最小可见、重复幂等、purpose 隔离、跨家庭 fail-closed、非 guardian fail-closed、撤回后服务 consent gate fail-closed、审计/事件存在。API 类型检查、Web/共享契约检查、静态红线审计和全量回归通过后，才允许提交并推送当前开发分支。

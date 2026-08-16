# FAMILY_PHASE10B_CONTEXT_REUSE_001 任务契约

**状态：** 内部确定性开发授权  
**目标：** 将 Context Reuse 与家庭 SERVICE consent 生命周期对齐，确保撤回后服务过程上下文默认 fail-closed，同时保留家庭内可解释、非因果的帮助感记录。

## 冻结范围

复用现有 `GET /families/:familyId/orchestration/context-reuse/:subjectPersonId`、`ContextReuseItem`、`getContextReuse` 和 `contextReuse` 查询，不新增页面、数据库迁移、Named Action 或外部服务。仅在仓储读取入口增加 active SERVICE consent 门禁：没有有效家庭范围 SERVICE consent 时返回空 items；有有效 consent 时维持现有同家庭、最近 10 条服务过程查询。

返回仍明确标记 `USER_PERCEIVED_HELPFULNESS_NOT_GROWTH_OUTCOME` 和 `MINIMAL_FAMILY_SCOPED_CONTEXT_REUSE_NO_CROSS_FAMILY_LEARNING_OR_CAUSAL_CLAIM`。撤回 consent 不删除历史事实、不删除审计和 outbox；只是停止默认 Context Reuse 暴露，未来恢复服务 consent 后是否重新可见必须另行裁决。

## 正清单

服务端根据 `family_id + subject_person_id` 查询 active SERVICE consent；撤回后返回空数组；有效 consent 下仅返回同家庭 service case、选定资源和家庭主观帮助感；保留文本等价路径、家庭范围和非成长结果边界；通过真实 PostgreSQL 测试验证撤回前后差异。

## 负清单

不得跨家庭查找或合并上下文；不得由前端提供 consent 状态；不得把帮助感解释为教育效果、因果关系、成长结果或永久标签；不得删除历史记录；不得引入跨家庭统计/推荐、模型、训练、组织访问、Provider 交易或商业化运行时。

## 验收条件

既有 Context Reuse 黄金路径继续通过；新增测试覆盖 active consent 可见、withdrawn consent fail-closed、跨家庭 subject fail-closed 和无 consent 空投影；API 类型检查、真实 PostgreSQL 全量回归、静态边界审计通过后，独立提交并推送当前开发分支。

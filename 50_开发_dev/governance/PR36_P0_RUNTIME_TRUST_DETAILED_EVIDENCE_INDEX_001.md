# PR #36 · P0 Runtime Trust Closeout 详细证据索引 001

> **状态：`PASS_CANDIDATE_ACCEPTED_FOR_REVIEW`。**
>
> 本文是 PR #36 P0 Runtime Trust Closeout 的审阅导航与证据索引，不是 merge、master、试点、生产、公开发布、移动端 runtime 或任何 HOLD 解冻授权。PR #36 继续保持 Draft / `AUTO_MERGE=NO` / `DEVELOPMENT_FROZEN`。

## 1. 审阅对象与提交关系

| 项目 | 值 | 审阅含义 |
|---|---|---|
| GitHub PR | #36 `platform/family-growth-vertical-slice-001` | 当前开发分支；不得合并。 |
| 架构师指定审阅基线 | `22e2519e556ad1bbf2e0a701ebbc2201c5927989` | P0 Closeout 的 exact base。 |
| 被接受的 P0 代码 exact head | `6103981dec6c7a4b9ceb988ddcdb75b5c44f6154` | `fix(family): close P0 runtime trust gaps`；状态 `PASS_CANDIDATE_ACCEPTED_FOR_REVIEW`。 |
| 后续无代码文档 head | `21eafcd3017762b1e71b1fe166baa7236b4e49ef` | 仅增加冻结状态、P0 证据索引和 App Gate 输入；`6103981` 是其直接祖先。 |
| Base 分支 | `master` | 未修改，继续 HOLD。 |
| 自动合并 | `NO` | 不得开启。 |
| 允许工作面 | App-first Gate 设计输入文档 | 不得编写业务代码、DTO/API/DB 或启动 runtime。 |

## 2. P0 完整性声明与非主张

P0 Closeout 只关闭首条确定性服务链的可信边界。它证明内部代码和隔离 PostgreSQL/HTTP 验证达到对应不变量，并不证明教育效果、孩子改变、家庭画像正确性、真人服务已交付、模型质量、商业需求或生产安全。

| 可主张 | 不可主张 |
|---|---|
| 编排 V3 能在家庭范围、明确决定、资源准入、幂等和风险交接约束下完成内部确定性链路。 | 该链路已适合真实家庭试点、生产或公开发布。 |
| Consumer 路由已拒绝 x-actor-only、disabled account、ambiguous context 与不受保护的 cookie 跨 Origin 写操作。 | 当前身份体系已覆盖真实注册、OTP/SMS、微信登录或生产 IAM。 |
| PRACTICE 在无 executor 时 fail-closed；NO_ACTION 无执行；主观回访不写 outcome。 | 内容/课程已经交付、课程有效、家庭已改变。 |
| V3 编排不创建 legacy PrincipalActionProposal；REVIEW/HIGH_RISK 有可追溯 handoff。 | 真人已接单、已完成咨询、已给出专业建议或风险已被解除。 |

## 3. 运行时不变量证据矩阵

| 编号 | P0 不变量 | 代码位置 | 回归位置 | 关键证据 / 预期 |
|---|---|---|---|---|
| RT-01 | V3 编排不写 Legacy Proposal | `apps/api/src/modules/principal/principal.service.ts`；`principal-ai-coach.resource.ts` | `principal.service.spec.ts`；`orchestration-vertical-slice.e2e-spec.ts` | `ORCHESTRATION_AI_COACH` 复用同一 safety/consent/processing/provider/grounding/model/quality/human gate 管线；`PrincipalActionProposal delta=0`。 |
| RT-02 | Legacy 兼容性不被破坏 | `principal.service.ts` | `principal.service.spec.ts`；`principal-consumer-contract.e2e-spec.ts` | `LEGACY` mode 保持 proposal 行为和 legacy confirm 合同。 |
| RT-03 | ACTIVE Account 是会话根 | `apps/api/src/modules/auth/auth.repository.ts`；`auth.service.ts` | `family-scope.integration.spec.ts`；编排 E2E | disabled account 登录/既有会话 `401`，不得被 upsert 复活。 |
| RT-04 | 模糊家庭上下文失败关闭 | `auth.repository.ts`；`auth.service.ts`；`family-platform-auth.guard.ts` | `family-scope.integration.spec.ts` | 多有效 person context `403`；不使用 `LIMIT 1` 任意选人。 |
| RT-05 | Principal consumer 强认证 | `apps/api/src/modules/principal/principal.controller.ts` | `principal-consumer-contract.e2e-spec.ts` | Account→ACTIVE binding→ACTIVE membership→family；`x-actor-id` only `401`。 |
| RT-06 | Cookie Origin 防护 | `family-platform-auth.guard.ts`；`principal.controller.ts` | Principal consumer / 编排 HTTP E2E | cookie cross-origin mutation `403`；受控 Bearer API 不依赖 Origin。 |
| RT-07 | PRACTICE 不伪装交付 | `resource.registry.ts`；`eligibility.policy.ts` | `orchestration-policy.spec.ts`；编排 E2E | 无 real executor 的 PRACTICE 在 T1/T2 均 `INELIGIBLE_NO_EXECUTOR`。 |
| RT-08 | NO_ACTION 无执行 | `decision-integrity.policy.ts` | `orchestration-policy.spec.ts`；编排 E2E | 仅 `DISMISS + []`；ACCEPT/alternative 被拒；零 Plan/Case。 |
| RT-09 | 五个写动作幂等 | `orchestration.controller.ts`；`orchestration.service.ts` | `orchestration-vertical-slice.e2e-spec.ts` | RequestHelp、ConfirmIntent、Recommend、Decide、FollowUp 同 key 同请求零重复；异请求 `409`。 |
| RT-10 | subject/actor/family 链一致 | `orchestration.service.ts`；`orchestration.repository.ts` | `orchestration-vertical-slice.e2e-spec.ts` | subject 仅在 requestHelp 接收；Intent/Decision/Case 全部绑定同一服务端派生 child；跨家庭 `403`。 |
| RT-11 | 人工交接可追溯 | `principal.service.ts` | `principal.service.spec.ts`；`principal-consumer-contract.e2e-spec.ts` | HIGH_RISK 无 response/proposal，OPEN handoff 有 family、subject、risk route；REVIEW 扣留—人工 release 可追溯。 |
| RT-12 | canonical 边界 | 编排服务与仓储 | `orchestration-vertical-slice.e2e-spec.ts` | `GrowthPriority`、`InterventionEpisode`、`GrowthAction`、`OutcomeObservation` 写入量均为 0。 |

## 4. 验证证据与可复现入口

| 验证类别 | 覆盖 | 通过结果 | 日志/入口 |
|---|---|---|---|
| Shared contracts 构建 | 跨包类型契约 | 通过 | `PR36_P0_RUNTIME_TRUST_CLOSEOUT_FULL_API_VALIDATION_2026-08-16.log` |
| API 类型检查 | API + Principal + 编排 | 通过 | 同上 |
| API 全量 Vitest | 单元与集成回归 | **34 文件 / 189 测试** 全部通过 | 同上 |
| 编排 Runtime Trust HTTP + 真实 PostgreSQL E2E | Golden、T1/T2、身份、Origin、幂等、主体链、canonical delta | **15 测试**全部通过 | `apps/api/src/modules/orchestration/orchestration-vertical-slice.e2e-spec.ts` |
| Principal strict consumer HTTP E2E | x-actor、cookie Origin、NORMAL、HIGH_RISK、legacy confirm | **5 测试**全部通过 | `apps/api/src/modules/principal/principal-consumer-contract.e2e-spec.ts` |
| API Build | 编译产物 | 通过 | 全量验证日志 |
| 静态审计 | diff / 禁止能力/错误分支 | 通过 | `PR36_P0_RUNTIME_TRUST_CLOSEOUT_STATIC_AUDIT_2026-08-16.log` |

### 本地证据路径

- Gate 报告：`/home/ubuntu/family-platform-research/PR36_P0_RUNTIME_TRUST_CLOSEOUT_GATE_REPORT_2026-08-16.md`
- 全量验证日志：`/home/ubuntu/family-platform-research/logs/PR36_P0_RUNTIME_TRUST_CLOSEOUT_FULL_API_VALIDATION_2026-08-16.log`
- 静态审计日志：`/home/ubuntu/family-platform-research/logs/PR36_P0_RUNTIME_TRUST_CLOSEOUT_STATIC_AUDIT_2026-08-16.log`
- 授权 SSOT：`governance/AUTHORIZATION_REGISTRY.yaml`
- 执行状态 SSOT：`governance/PROGRAM_STATUS_PLATFORM_V1.md`

## 5. P0 代码变更清单

| 领域 | 变更文件 | 目标 |
|---|---|---|
| Principal delivery mode | `principal.service.ts`；`principal-ai-coach.resource.ts`；`principal.service.spec.ts` | 分离 Legacy / Orchestration 的 proposal 写入语义。 |
| Consumer trust | `principal.controller.ts`；`principal-consumer-contract.e2e-spec.ts` | Strict Account family context 与共享 cookie-Origin 防护。 |
| 资源/决定语义 | `resource.registry.ts`；`eligibility.policy.ts`；`decision-integrity.policy.ts`；`orchestration-policy.spec.ts` | PRACTICE no-executor 和 NO_ACTION no-execution。 |
| 编排幂等与主体链 | `orchestration.service.ts`；`orchestration.controller.ts`；`orchestration-vertical-slice.e2e-spec.ts` | 五个 Named Action 的重放/冲突控制与链路断言。 |
| 状态 | `governance/PROGRAM_STATUS_PLATFORM_V1.md` | P0 状态为待架构师审阅，后由裁决升级为接受审阅。 |

## 6. 已知边界与继续 HOLD

| 边界 | 当前状态 | 原因 |
|---|---|---|
| PR merge / master | HOLD | P0 接受审阅不等于 per-merge 授权。 |
| Web HOME / 移动端 runtime | HOLD | 当前只允许 App Gate 设计输入。 |
| 真实家庭试点 / 生产 | HOLD | 无生产 IAM、真实操作审查和独立放行。 |
| 外部模型 / 训练 / 自学习 | HOLD | P0 不扩展模型调用面。 |
| 真人顾问 / 组织访问 | HOLD | handoff 仅是安全 trace，不是交付、预约或 AccessGrant。 |
| 支付 / 权益 / 订单 / Marketplace | HOLD | 商业化需独立产品、合规和技术 Gate。 |
| 社群/分享/跨家庭 | HOLD | 公开范围、儿童隐私、激励与统计边界均未获准。 |
| 成长结果/标签/公开画像 | HOLD | P0 只记录服务过程与主观感受，canonical outcome delta=0。 |
| 数据导出/删除/外发 | HOLD | 前序设计和合成验证不等于真实数据处理授权。 |

## 7. 审阅检查表

总架构师可按下表做最终核验；任何一项不同意都应保持开发冻结，而非进行“顺手修复”。

| 检查项 | 预期 | 状态 |
|---|---|---|
| `6103981` 是否仍是被审阅的 P0 代码 exact head | 是 | 已接受审阅 |
| `21eafcd` 是否只含无代码治理/App Gate 文档 | 是 | 已推送；P0 code exact head 为其祖先 |
| PR #36 是否继续 Draft / AUTO_MERGE=NO | 是 | 保持 |
| master 是否未改 | 是 | 保持 |
| 是否存在未授权 runtime 扩展 | 否 | 静态审计通过 |
| App-first 是否仍仅为 E1 设计输入 | 是 | 保持 |
| 是否已获 App 实现授权 | 否 | 未获；必须独立 Gate |

## References

[1] `PR36_P0_RUNTIME_TRUST_CLOSEOUT_GATE_REPORT_2026-08-16.md`。  
[2] `governance/PR36_P0_RUNTIME_TRUST_EVIDENCE_INDEX_2026-08-16.md`。  
[3] `governance/AUTHORIZATION_REGISTRY.yaml`。  
[4] `governance/PROGRAM_STATUS_PLATFORM_V1.md`。

---

**作者：Manus AI**  
**日期：2026-08-16（GMT+8）

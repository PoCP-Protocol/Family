# PR #36 · P0 Runtime Trust Closeout 证据索引

> **状态：`PASS_CANDIDATE_ACCEPTED_FOR_REVIEW`。**
>
> 本索引供总架构师定位 PR #36 的 exact head、验证结果和可复核证据。它不构成 PR merge、master 合入、试点、生产或任何 HOLD 解冻授权。

| 证据项 | 定位 | 结论 |
|---|---|---|
| PR / 分支 | PR #36 · `platform/family-growth-vertical-slice-001` | Draft；`AUTO_MERGE=NO`；开发面已冻结。 |
| 已接受 exact head | `6103981dec6c7a4b9ceb988ddcdb75b5c44f6154` | `fix(family): close P0 runtime trust gaps`。 |
| 审阅起点 | `22e2519e556ad1bbf2e0a701ebbc2201c5927989` | 总架构师指定的 exact base。 |
| 详细 Gate 报告 | `/home/ubuntu/family-platform-research/PR36_P0_RUNTIME_TRUST_CLOSEOUT_GATE_REPORT_2026-08-16.md` | P0 修复、变更文件、验证及停止条件。 |
| API 全量验证日志 | `/home/ubuntu/family-platform-research/logs/PR36_P0_RUNTIME_TRUST_CLOSEOUT_FULL_API_VALIDATION_2026-08-16.log` | shared contracts 编译、API 类型检查、**34 文件 / 189 测试**、API build 全部通过。 |
| 静态边界审计日志 | `/home/ubuntu/family-platform-research/logs/PR36_P0_RUNTIME_TRUST_CLOSEOUT_STATIC_AUDIT_2026-08-16.log` | `git diff --check` 通过；未引入未授权外部模型、训练、文件/网络交付、Web HOME、PR37 或 master 改动。 |
| 执行状态 SSOT | `governance/PROGRAM_STATUS_PLATFORM_V1.md` | PR #36 为 `PASS_CANDIDATE_ACCEPTED_FOR_REVIEW`，仅允许 App Gate 设计输入。 |
| 授权 SSOT | `governance/AUTHORIZATION_REGISTRY.yaml` | 记录 P0 exact head 接受与 App-first 仅设计映射授权。 |

## P0 不变量与回归入口

| 不变量 | 主要实现 / 验证位置 | 可复核断言 |
|---|---|---|
| 编排 AI Coach 不写 Legacy Proposal | `apps/api/src/modules/principal/principal.service.ts`；`principal-ai-coach.resource.ts`；`orchestration-vertical-slice.e2e-spec.ts` | `ORCHESTRATION_AI_COACH` 复用安全管线，`PrincipalActionProposal delta=0`。 |
| 家庭可信身份 | `principal.controller.ts`；`auth.service.ts`；`principal-consumer-contract.e2e-spec.ts`；`family-scope.integration.spec.ts` | Account → ACTIVE binding → ACTIVE membership → family；disabled account `401`；ambiguous context `403`；x-actor-only `401`。 |
| Cookie CSRF | `family-platform-auth.guard.ts`；`principal.controller.ts`；Principal / 编排 HTTP E2E | cookie cross-origin mutation `403`；Bearer API 请求不依赖 Origin。 |
| PRACTICE 不伪装交付 | `resource.registry.ts`；`eligibility.policy.ts`；`orchestration-policy.spec.ts` | 无 real executor 时 T1 / T2 均 `INELIGIBLE_NO_EXECUTOR`。 |
| NO_ACTION 无执行 | `decision-integrity.policy.ts`；`orchestration-policy.spec.ts` | 只能 `DISMISS + []`；拒绝 ACCEPT / alternative。 |
| 全链路幂等 | `orchestration.controller.ts`；`orchestration.service.ts`；`orchestration-vertical-slice.e2e-spec.ts` | RequestHelp、ConfirmIntent、Recommend、Decide、FollowUp 同键重放零重复；同键异请求 `409`。 |
| subject / actor / family 链 | `orchestration.service.ts`；`orchestration-vertical-slice.e2e-spec.ts` | 需要输入后由服务端派生；Intent / Decision / Case 同一 child；跨家庭 `403`。 |
| Human handoff | `principal.service.ts`；`principal.service.spec.ts`；`principal-consumer-contract.e2e-spec.ts` | HIGH_RISK 无 response / proposal，OPEN handoff 有 family、subject、risk route；REVIEW 扣留及人工 release 可追溯。 |
| Canonical boundary | `orchestration-vertical-slice.e2e-spec.ts` | `GrowthPriority`、`InterventionEpisode`、`GrowthAction`、`OutcomeObservation` 写入量均为零。 |

## 明确保留的 HOLD

`master` 合入、PR merge、Web HOME、移动端 runtime、真实家庭试点、生产、商业化、支付/权益、Enrollment/Delivery、Marketplace、Organization/AccessGrant、跨家庭统计/推荐、真人顾问交付、外部模型、训练/自学习、公开成长 IP、成长结果、永久标签、公开画像、真实数据导出/删除/外发、加密或文件交付运行时、PR37 Runtime 全部继续 HOLD。

## 后续入口

当前唯一允许的后续产物为：**榜样教育材料 → Family App-first 体验设计映射与 App Gate 裁决输入草案**。该输入仅为设计文档；两份材料均按 **E1 自家材料** 管理，只能证明来源/版权及内容资产事实，不得证明教育效果、治理结论或自动放行后续能力。

---

**作者：Manus AI**  
**日期：2026-08-16（GMT+8）

# Family Growth AI Platform 全域 PDCA 集成测试报告

```text
PHASE=PDCA_GLOBAL_INTEGRATION_TEST
DATE=2026-08-19
UI_SCOPE=UI-01..UI-35
BUSINESS_LOOPS=6
ENVIRONMENT=Dev PostgreSQL + NestJS API + Vanilla TS Web
TEST_DATA=Fixed synthetic family fixture; not production data
EXTERNAL_EFFECTS=NO
AI_MODEL_DIRECT_CALL=NO
```

## 1. 本轮目标与范围

本轮按照 Research → Implement → Test → Verify → Fix → Retest 的 PDCA 节奏，对 Family Growth AI Platform 的全域数据关系和六类业务循环进行集成验证。验证重点不是把静态页面当成完成，而是确认 Family、Person、Consent、GrowthJourney、Perspective、Evidence、ProfileDraft、Priority、Intervention、Task、ServiceCase、Booking、Order、Entitlement、Community 与 Records 等对象在 family scope、projection、Named Action、audit/idempotency 和 no-external-effect 边界内能够串联。

UI-02/UI-03 的 real-api 联调暴露了一个真实恢复缺口：固定 Dev seed 已存在 canonical active onboarding 时，重复调用 `StartGrowthOnboarding` 返回 `growth_onboarding_already_active`，前端却没有读取既有 journey 的 projection。为避免重复创建和绕过领域约束，本轮增加了 family-scoped active onboarding read projection；前端在该明确冲突码下恢复既有 journey，而不是伪造成功或启动第二条旅程。

## 2. 六类循环验证矩阵

| 循环 | 覆盖重点 | 验证结论 |
|---|---|---|
| Core Growth / 90-day Plan | UI-01~UI-10，onboarding、Perspective、Profile Draft、Insight、Priority、Intervention、Today Action、Reflection | API integration、HTTP E2E、Web 聚焦和浏览器 real-api 恢复链通过；Reflection 保持 Perspective 边界 |
| Assessment / Outcome / Review | UI-02~UI-05、UI-08、UI-11、UI-17、UI-29 | Perspective → Evidence → Draft → Review 投影通过；未将 Recommendation 或 Reflection 写成 Outcome |
| Service / Booking | UI-14、UI-15、UI-18、UI-19、UI-22、UI-24、UI-31、UI-34 | no-op adapter、consent、receipt、idempotency 和服务记录读取通过；无外部预约效果 |
| Commerce / Entitlement | UI-20、UI-21、UI-23、UI-27、UI-30、UI-32 | order intent、membership、benefit consume/revoke 的边界测试通过；无真实支付、退款或外部履约 |
| Community / Content | UI-25、UI-26、UI-28 | read projection、private draft 和可见性边界通过；无发布、评论、点赞或分享外部效果 |
| Profile / Records | UI-33、UI-34 及跨模块 family records | family-scoped profile/readback 与 service record provenance 通过；无未经授权的敏感写入或导出 |

## 3. 自动化测试结果

| 验证层 | 命令/范围 | 结果 |
|---|---|---:|
| Build | `pnpm run build` | PASS |
| Typecheck | `pnpm run typecheck` | PASS |
| Unit | `pnpm run test:unit` | 48 files / 300 tests PASS（Web 14/112；API 34/188） |
| PostgreSQL integration | `pnpm run test:integration`，复用已配置本地 PostgreSQL | 20 files / 95 tests PASS |
| HTTP E2E | `pnpm run test:e2e` | 17 files / 131 tests PASS |
| Web coverage | `pnpm --filter @family/web exec vitest run --coverage` | 14 files / 112 tests PASS；Statements 90.91%、Branches 76.40%、Functions 88.65%、Lines 90.91% |
| API unit coverage | `pnpm --filter @family/api exec vitest run --config vitest.unit.config.ts --coverage` | 34 files / 188 tests PASS；Statements 28.77%、Branches 69.98%、Functions 43.73%、Lines 28.77% |

测试输出中的 jsdom `navigation (except hash changes)` 是既有测试环境噪声，不导致测试失败；本轮没有将它误判为业务回归。Docker reset 未作为必要条件调用，集成测试使用已配置的本地 PostgreSQL 测试数据库完成。

## 4. 浏览器与真实数据血缘验证

authenticated browser 使用固定 Dev synthetic family 和 account-scoped bearer，验证了 UI-02 → API `StartGrowthOnboarding` → `growth_onboarding_already_active` → API `GET /families/{familyId}/growth/onboarding/active` → UI-02 Perspective forms 的真实恢复链。最终页面显示 `已启动`、`ACTIVE`、`ONBOARDING`、`NORMAL / LOW`，并呈现父母视角与孩子视角记录表单。浏览器同时验证了 UI-01/UI-09 的既有 Today → Task → Check-in → Receipt 闭环。

本次运行证据路径包括浏览器 runtime screenshot 与页面 HTML，由浏览器验证过程生成；截图只证明 runtime state，不宣称 pixel diff ready。真实 API 进程在浏览器验证时显式使用 `DATABASE_URL=$TEST_DATABASE_URL` 与 `CORS_ORIGIN=http://localhost:5173`，避免将环境变量未继承和跨源策略问题混入业务结论。

## 5. 本轮修复项

| 修复 | 原因 | 修复策略 | 验证 |
|---|---|---|---|
| Active onboarding projection | Dev seed 已存在 active canonical journey，UI-02 重复 Start 返回 409 后停留错误态 | 增加 `GET /families/{familyId}/growth/onboarding/active`，服务端按 family permission 返回 provenance-bound projection；前端仅针对明确 active 冲突恢复 | direct HTTP 200；authenticated browser 进入 Perspective 阶段 |
| Web JSDoc header 类型 | 可选 Bearer header 被 TypeScript 推断为不兼容的联合类型 | 为 app/wave2 `authHeaders` 标注 `Record<string,string>`，保持 mock/real-api 行为不变 | Web typecheck 与 47 个聚焦测试通过 |
| Dev runtime CORS | API 重启后未显式传入 `CORS_ORIGIN`，浏览器出现 `Failed to fetch` | 仅在 Dev runtime 传入 `CORS_ORIGIN=http://localhost:5173`，不改变业务权限 | CORS probe 返回 `Access-Control-Allow-Origin`；浏览器恢复链通过 |
| Contract consistency | active read route 属于 UI-02 的恢复投影，但原 Contract 未列出 | 将 active projection endpoint 与 409 recovery rule 写入正式 UI-02/UI-03 Contract | Contract 与代码路径一致 |

## 6. 安全与 AI-native 边界复核

本轮没有调用裸模型，没有把 AI 输出直接写入核心 Ontology，没有新增家庭排名、总分、儿童诊断或 Outcome 因果结论。active onboarding 是 Read Projection；真正创建 journey 仍只通过 `StartGrowthOnboarding` Named Action。Perspective、Evidence、Recommendation、Action 和 Audit/receipt 继续分层；高风险业务的支付、社区发布、真人服务、通知、分享、导出和外部履约保持未触发。

## 7. 当前残留项与下一轮 PDCA

API unit coverage 仍明显低于 Web coverage，原因是当前 unit 配置主要覆盖 policy/DTO/service 单元，而大量 controller/repository 路径由 integration/E2E 覆盖但未合并到该 unit coverage 数字。下一轮应增加 UI-02/UI-03 active projection 的专属 integration assertion，并将 browser harness 固化为可重复脚本；随后进入 UI-04/UI-05 的 Report/Plan handoff，而不是扩展到支付、社区发布或其它外部效果。

```text
PDCA_ROUND_STATUS=PASS_WITH_COVERAGE_FOLLOWUP
FULL_REGRESSION=PASS
BROWSER_REAL_API=PASS
ACTIVE_ONBOARDING_RECOVERY=PASS
PIXEL_DIFF_READY=NO
NEXT_REQUIRED_ACTION=Add dedicated active-onboarding integration assertion, commit this PDCA round, then start UI-04/UI-05 Report-to-Plan controlled handoff.
```

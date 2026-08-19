# M2 Authenticated Browser Family Data PDCA

## 本轮范围

本轮针对已暴露的真实联调缺口，打通固定 Dev 家庭从 `Account`、`account_person_bindings`、`Family`、`family_memberships`、`tenant_family_bindings`、`SERVICE consent` 到 UI-19 家庭服务供给与专家直播场次投影的真实读取链。所有数据限定在 `TEST_DATABASE_URL` 对应的 `family_test` 数据库，使用稳定 synthetic 标识；不涉及生产库、真实支付、真实音视频或外部通知。

## PDCA 结论

| 阶段 | 结果 |
|---|---|
| Plan | 目标是让 UI-01 专家直播动态场次和 UI-24/UI-34 服务记录能够在 authenticated browser 中读取真实 Dev 家庭数据，而不只依赖 mock fixture。 |
| Do | 扩展独立 seed 与 TypeScript fixture：增加 account、account-person binding、tenant-family binding、SERVICE consent，并修复 identity session 按 family/account 双条件清理；扩展 teacher-supply-client 传递 Dev Bearer。 |
| Check | account session contexts 返回 200；UI-19 offerings projection 返回 200，包含家庭范围的 `live_session`；Web 页面真实加载动态场次并完成“记下这场直播”受控回执。 |
| Act | 保留 account/tenant/family 三层真实联调入口，将本轮数据关系和 bearer 注入纳入可重复 fixture；真实外部效果仍保持关闭。 |

## 真实 API 联调证据

固定家庭标识为 `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`，固定 guardian 为 `cccccccc-cccc-4ccc-8ccc-cccccccccccc`。通过 Dev account session 创建会话后，`GET /auth/contexts` 返回家庭上下文；随后 `GET /families/{familyId}/orchestration/test-loop/services/offerings?page_id=UI-19` 返回 200，并包含：家庭服务供给、`live_session.session_ref=EXPERT_LIVE_SESSION_FAMILY_GUIDANCE`、直播状态 `SCHEDULED`、`fixture_only=true` 与 `external_effect=false`。

> 该过程证明的是 Dev 测试数据和家庭范围读取链可运行，不代表真实直播平台、真实专家在线或真人服务已经接入。

## 浏览器联调

浏览器通过 `family-ui01-ui09-synthetic-bearer` sessionStorage 仅在本地 Dev harness 中保存短期测试 Bearer。UI-19 原始移动端基线保持完整，动态专家直播卡在基线后追加。点击“记下这场直播”后，页面显示“这场直播已记在家庭的关注清单里”，并提供“查看家庭支持记录”家庭内入口；动作仍经过受控体验、审计、幂等和零外部效果链路。

## 测试结果

| 验证项 | 结果 |
|---|---:|
| Web 定向测试 | PASS |
| Web 全量测试 | 14 个文件、111 个测试通过 |
| API PostgreSQL 集成测试 | 20 个文件、94 个测试通过 |
| 全仓 typecheck | PASS；contracts、API、Web 及工作区均通过 |
| account session contexts | HTTP 200 |
| UI-19 service supply projection | HTTP 200 |
| UI-01 专家直播真实浏览器回显 | PASS |
| 真实外部效果 | 未触发；`external_effect=false` |

## 架构补强

本轮补齐了 AI-native Family Growth OS 真实联调所需的基础关系：身份 Account 与家庭 Person 分离；Account 通过 active binding 进入 Family；Family 通过 Tenant binding 进入服务供给策略；SERVICE consent 控制服务投影；专家直播场次作为 Read Projection；“记下这场直播”作为 Named Action 进入受控体验记录和家庭过程记录。没有把直播关注、服务记录或 Reflection 解释为 Outcome、诊断、排名或总分。

## 本轮文件范围

本轮应限定提交以下文件：`tools/seed-test-family.mjs`、`apps/api/src/test-fixtures/family-platform.integration.fixture.ts`、`apps/web/src/teacher-supply-client.js`、本记录文件。覆盖率、截图、token、临时日志和旧 UI-06/PPT 资产不得提交。

## 下一轮建议

推送本轮后，继续用同一 authenticated browser harness 验证 UI-24/UI-34 服务记录页面读取刚写入的专家直播过程记录，并将真实页面回读断言纳入端到端测试；随后再处理下一项测试暴露的能力缺口。

**PHASE=AUTHENTICATED_BROWSER_FAMILY_DATA_PDCA**
**DEV_DATA_ONLY=YES**
**REAL_EXTERNAL_EFFECT=NO**
**WEB_FULL_REGRESSION=111_PASS**
**API_INTEGRATION_REGRESSION=94_PASS**
**TYPECHECK=PASS**

## References

本轮主要依据仓库内 API 鉴权、租户绑定、家庭服务供给、测试体验和 34 UI 既有契约与实现；外部资料未作为本轮运行结论的必要依据。

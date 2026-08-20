# UI-01 专家直播 Dev 受控纵切 PDCA

`PHASE=UI01_EXPERT_LIVE_DEV_VERTICAL_SLICE`

`UI_SCOPE=UI-01`

`SLICE_NAME=Expert Live Session Family-Scope Viewing Intent`

`IMPLEMENTATION_STATUS=DEV_CONTROLLED_FLOW_COMPLETE`

`EXTERNAL_EFFECT=false`

`REAL_AUDIO_VIDEO=false`

`REAL_EXPERT_OUTREACH=false`

`PRODUCTION_LIVE=false`

## 1. 本轮问题与研究结论

此前 UI-01 首页存在“专家直播”视觉入口，但没有可运行的家庭内血缘。研究 3 份 PPT/主交付计划、UI-01 基线与现有 UI-19 专家服务目录后，本轮将最小能力定义为：家庭从首页进入专家服务只读目录，看到一场可理解的 Dev 直播场次说明，可将“进入直播”记录为家庭关注意向，再返回专家服务或服务记录。

这不是实时音视频能力，也不创建预约、通知、专家外联、支付或服务效果结论。直播场次是 synthetic/read projection；进入直播是 Named Action，持久化为受控体验操作，`external_effect=false`，支持幂等回放和家庭范围校验。

## 2. 对象与数据血缘

| 对象 | 来源/状态 | 本轮边界 |
|---|---|---|
| ExpertLiveSession | Dev fixture/read projection | 只展示主题、时间、说明和家庭可理解入口 |
| Family | authenticated family scope | 所有操作归属当前家庭 |
| EnterExpertLiveIntent | Named Action/controlled operation | 记录家庭关注意向，不代表进入真实直播 |
| Audit/Idempotency | test experience operation | 保留操作追踪与重复提交一致性 |
| Model Gateway | policy-only/no-op | 不调用模型，不让模型改核心状态 |
| Reflection/Outcome | 未创建 | 不将关注意向解释为教育效果或成长结果 |

## 3. 实现范围

前端在 UI-01 首页保留原始专家直播 hotspot，并将其连接到 UI-19 家庭支持主题投影。专家直播卡位于原始支持页面基线之后，呈现家庭可理解的场次说明、保存后的关注状态、返回专家服务和查看支持记录入口。teacher-supply-view 增加渲染回调，保证异步只读投影完成后动态家庭卡不会被覆盖。

后端扩展受控体验操作契约、统一 LLM 页面策略类型和 UI-01 action 白名单，新增 `ENTER_EXPERT_LIVE` 与 `EXPERT_LIVE_SESSION` 数据库枚举迁移。该动作只写测试体验操作记录，不连接音视频、通知、专家系统或外部服务。

## 4. AI-native 边界

本轮保持 `Fact / Perspective / Recommendation / Action` 分离。直播场次主题和时间是 projection fact；家庭是否关注是 action intent；没有 AI recommendation、诊断、Outcome 或因果结论。Model Gateway 状态保持 no-op，审计与幂等记录为未来 Agent/Model Gateway 接入预留可追溯边界。

## 5. 测试与验证

已通过：

- Web 页面对象回归：`30 tests passed`，包含 UI-01 首页专家直播入口、UI-19 异步家庭支持投影、`ENTER_EXPERT_LIVE` 受控动作、保存状态和零外部效果。
- PostgreSQL 受控体验集成：`3 tests passed`，包含七类 Dev 操作持久化、幂等回放、customer projection、取消动作、无效 fixture 和 consent fail-closed。
- 数据库迁移：`0024_expert_live_session_operation.sql` 已通过标准测试库迁移命令应用。
- 视觉要求：原始 UI-01 首页与 UI-19 专家服务基线不替换；动态专家直播卡在只读支持投影之后追加。

## 6. 明确未实现

本轮不实现真实音视频、直播间互动、专家排班、预约支付、通知、回放、外部分享、客服外联、专家端运营后台，也不将进入直播意向解释为家庭成长结果。

## 7. 下一步

在本轮全量 Web/API 回归和浏览器视觉复核通过后，限定暂存本轮相关代码、迁移、测试和本记录，单独提交并推送。下一轮继续从测试暴露的缺口中选择用户价值最高的能力。

## 8. 浏览器视觉复核

本地浏览器打开 UI-01 首页后，原始首页移动端基线和“专家直播”热点保持可见；点击后进入 UI-19 专家服务原图，原始名师专区、主题和底部导航保持完整。专家直播卡在原图下方追加，使用低干扰家庭卡片样式，包含主题、时间、家庭可理解说明和“记下这场直播”入口。

在未建立 authenticated API 会话的浏览器状态下，UI-19 主题投影自然回退为“暂时无法加载”，但专家直播卡仍可见，不伪造已成功进入直播；这与页面的家庭内受控边界一致。自动化页面对象测试已覆盖有授权测试夹具时的保存回执。

## 9. 动态场次投影补强

本轮把专家直播从静态卡片补强为家庭支持供给 Read Projection 的 `live_session` 字段。投影包含 `session_ref`、主题、说明、开始时间、`SCHEDULED/LIVE/ENDED` 状态、主持人显示名、`fixture_only=true` 和 `external_effect=false`。场次状态由 Dev fixture 的时间窗口计算，前端只读回显，不提供真实音视频控制、排班或回放操作。

前端 `teacher-supply-client` 对 `live_session` 做结构校验，`teacher-supply-view` 将完整投影传递给 UI-01 回调，专家直播卡使用投影返回的主题、时间和状态；原 UI-19 基线和 UI-01 专家直播入口保持不变。测试 fixture 已同步新增字段，空场景可返回 `live_session=null`。

本轮新增验证：Web 动态直播相关定向测试 `34/34`；API UI-19 供给投影集成测试 `2/2`。已确认同一家庭可读取该场次、其他家庭不会读取对方的教师供给，读取不会创建预约、服务记录或产品事件。

## 10. 本轮视觉与回归结论

浏览器打开 `teacher-zone` 页面后，原始专家服务移动端基线完整保留，动态专家直播卡位于基线之后，显示场次主题、时间和“即将开始”状态。无授权浏览器会话下，家庭支持主题自然回退而直播卡仍不替代原始页面。受控点击回执由 Web 页面对象测试和 API 集成测试验证，浏览器视觉复核不把未授权状态误判为真实直播成功。

全量回归结果：Web `14` 个测试文件、`111` 个测试通过；API `54` 个测试文件、`281` 个测试通过；全仓 typecheck 通过。此前一次 typecheck 暴露的状态联合类型已修复后重新通过。

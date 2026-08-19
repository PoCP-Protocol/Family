# UI-01 专家直播关注回执到家庭服务记录 PDCA

## 本轮目标

本轮针对 UI-01 专家直播已暴露的缺口，补齐“直播场次 → 家庭关注回执 → 家庭私有服务记录 → UI-24/UI-34 只读回看”的最小数据血缘。该记录属于 Dev/TEST 可重复测试能力，不代表真实直播已经发生，也不创建预约、通知、音视频会话或真人服务事实。

## 数据与状态边界

`ENTER_EXPERT_LIVE` 仍然是 UI-01 的受控 Named Action。动作成功后写入既有 `test_experience_operations`，并为该 operation 建立一条 `family_service_records` 过程记录：`record_kind=EXPERT_LIVE_INTEREST`、`source=TEST_EXPERIENCE_OPERATION`、`visibility=FAMILY_PRIVATE`、`status=RECORDED`、`external_effect=false`。记录中的 `perspective_boundary=FAMILY_INTEREST_ONLY` 和 `service_effect=NOT_ESTABLISHED` 明确区分家庭表达与外部服务事实。

幂等回放沿用原操作的 `idempotency-key`。重复请求只返回原 operation，不新增第二条服务记录。记录通过现有 family page-objects Read Projection 返回，因此 UI-24 和 UI-34 可以沿用同一家庭范围读取边界，不复制另一套服务事实。

## 测试结果

本轮新增 PostgreSQL 集成测试覆盖：专家直播动作成功、家庭私有服务记录投影、`EXTERNAL_EFFECT=false`、同一 operation 的幂等回放不重复写入。定向结果为 `4/4`。

下一步回归将覆盖 Web teacher-supply/社区/服务页面、API 全量测试和全仓 typecheck；视觉验收只确认原始基线保持以及动态服务记录卡追加，不把过程记录呈现为效果结论。

## 不做的事

本轮不实现真实音视频、专家排班、预约确认、通知、回放、支付、外部分享、客服外联、儿童诊断、家庭排名或总分。模型网关不被直接调用，直播回执只保留可追溯的 Dev 过程记录。

## 4. 回归与视觉验证

跨模块定向测试 `4/4`、Web 全量测试 `111/111`、API 全量测试 `54` 个测试文件共 `282` 项通过，全仓 `pnpm -r typecheck` 通过。浏览器打开 UI-34 服务记录页，原始咨询、活动、客服支持和联系客服视觉基线完整保留；本轮没有把专家直播关注记录直接改写成预约、活动报名或服务效果。

该血缘现在可以由同一家庭读取：UI-01 动态直播场次 → `ENTER_EXPERT_LIVE` 受控动作 → `family_service_records` 私有过程记录 → family page-objects 服务记录 Read Projection → UI-24/UI-34 回看。跨家庭和无服务 consent 场景仍按既有策略失败闭合。

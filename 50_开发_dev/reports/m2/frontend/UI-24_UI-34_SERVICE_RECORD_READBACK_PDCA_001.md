# UI-24/UI-34 服务记录真实家庭回读 PDCA

## 本轮目标

本轮补齐 UI-01 专家直播关注记录在 UI-24 与 UI-34 前端的家庭私有回读。既有服务预约投影继续保留；前端在同一家庭范围内并行读取 `/services/customer-projection` 与 `/page-objects`，将通用 `family_service_records` 中的直播关注过程记录合并到既有服务记录列表。

## 用户可见边界

家庭只看到“曾经留下一段支持过程”的回看，不看到操作类型、审计字段、实现状态或外部系统细节。记录不被写成预约成功、真人服务完成、通知已发送或成长效果结论。原始 UI-24/UI-34 移动端基线保持不变，动态内容只在基线之后低干扰追加。

## 数据血缘

`UI-01 动态直播场次` → `ENTER_EXPERT_LIVE` → `family_service_records(EXPERT_LIVE_INTEREST)` → `family-page-objects Read Projection` → UI-24/UI-34 家庭服务记录回看。预约记录仍来自 `services/customer-projection`，两类记录按家庭范围合并，按 `service_record_id` 去重。

## 测试与验证

本轮定向 Web 测试 `43/43`，Web 全量测试 `111/111`，Web typecheck 通过。测试覆盖 UI-19 供给到 UI-24 支持记录、UI-34 服务记录双投影请求、直播关注过程记录 fixture、只读请求方法和无外部效果边界。浏览器打开 UI-34，确认咨询、活动、客服支持和联系客服原始基线完整保留。

## 未实现能力

本轮不实现真实直播音视频、服务预约确认、通知、客服外联、数据导出、分享、支付或效果判断。`family_service_records` 仍是家庭私有过程记录，模型网关不直接调用，家庭排名、总分和儿童诊断继续关闭。

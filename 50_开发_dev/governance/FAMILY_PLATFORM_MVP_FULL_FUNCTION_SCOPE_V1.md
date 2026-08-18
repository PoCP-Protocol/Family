# Family MVP 全功能范围与 34 页可运行对象清单 V1

## 1. 目标

本阶段的目标不是继续堆叠静态页面，而是在 DEV/TEST 用测试数据把 Family 平台的核心产品循环跑通：家庭进入平台，表达当前需要，查看已准入的资源/服务/活动，明确选择或 NO_ACTION，形成计划/任务/服务记录/测试订单与资产投影，并可由真实 LLM 解释页面内容和下一步。34 页 UI 都必须能读到统一对象或明确显示安全停止/空状态。

## 2. MVP 全功能分区

| 业务域 | 页面 | 正式可运行能力 | 测试适配器 |
|---|---|---|---|
| 家庭成长 | UI-01–UI-12 | Family/Person/Profile、Need/Intent、Decision/NO_ACTION、Report、Journey、Task、ServiceRecord、私有过程投影 | 测试家庭、测试成长材料、真实 LLM 解释 |
| 家庭供给 | UI-13–UI-18 | admitted Catalog、商品/资源详情、邀请/拼团、客户资产投影、取消/过期 | 测试商品、测试价格/权益说明、无支付沙箱 |
| 名师与活动 | UI-19–UI-24 | Provider/Qualification、ServiceOffering、Activity、Availability、Booking、Registration、服务时间线 | 测试供给者、测试活动、无真人外呼/无真实席位 |
| 家庭社区 | UI-25–UI-28 | 私有社区模板、草稿、发布回执、详情与家庭内投影 | 合成模板/合成动态、无外部社区发布 |
| 客户后台 | UI-29–UI-34 | 成果过程、会员/资产说明、我的服务、订单资产、家庭档案、服务记录 | 测试资产、测试服务记录、可撤回投影 |
| AI/多模态 | 横跨页面 | LLM Gateway、页面解释、文本等价、合成截图/材料结构化、私有派生草稿 | 用户测试 key、合成/隔离媒体、沙箱推理 |

## 3. 统一页面执行链

每个页面都使用同一条执行链：

```text
route/page manifest
  → server-derived tenant/family context
  → base object or projection read
  → optional product event
  → optional LLM/multimodal context
  → user action
  → named action/API command
  → idempotent transaction fact
  → audit + projection refresh
  → UI receipt / text equivalent
```

页面不自行拼接主数据，不自行选择模型，不自行提交 tenant/family scope，不将自由文本直接写入核心对象。DEV/TEST 的测试适配器只是替换数据源和外部副作用，不替换上述工作流。

## 4. MVP 状态口径

| 状态 | 含义 |
|---|---|
| `RUNNABLE` | 已有正式对象、API/DTO、写入动作、投影和 focused integration/browser 证据 |
| `READABLE` | 已有正式读对象或投影，尚缺页面写动作或回读闭环 |
| `ADAPTER_REQUIRED` | 核心工作流已正式建模，仍需测试供给/支付/预约/社区适配器 |
| `LLM_READY` | 已接 Gateway、schema、输出验证和 text equivalent；待用户测试 key 做 live call |
| `GATE_BOUNDARY` | 涉及真实支付、真实权益、真人外呼、公开社区、儿童直接作答或高风险专业能力，DEV 只做安全占位 |

## 5. 事件与投影要求

每个可操作页面至少产生一个统一 product event；每个写动作必须生成可回读的 transaction fact；每个页面投影必须带 `as_of`、`source_refs`、`projection_version`、`visibility` 和 `expires_at`。事件、投影和 LLM Context 都使用 `tenant_id + family_id` 双范围。

## 6. 第一批开发顺序

第一批直接补齐家庭成长与客户后台读写一致性：UI-01、UI-04、UI-05、UI-06、UI-08、UI-18、UI-24、UI-27、UI-28、UI-31、UI-32、UI-33、UI-34。第二批把商城、名师/活动、社区五类 Test Experience 回执接到统一事件和投影。第三批接入真实 LLM Context freshness、页面解释和多模态合成材料处理。每批都先跑 focused tests，再跑全量回归。

## 7. 商业化产品边界

Family 的正式数据结构和工作流按商业化产品建设；DEV/TEST 只切换测试数据、测试账户和沙箱适配器。生产并不需要重写 UI 或业务模型，只切换经过审批的数据源、secret 和适配器。当前仍不产生真实支付扣款、真实席位占用、真人联系、公开社区外发或真实家庭数据处理。

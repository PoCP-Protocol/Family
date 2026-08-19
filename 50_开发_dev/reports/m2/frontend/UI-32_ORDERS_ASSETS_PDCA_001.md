# UI-32 订单与资产 PDCA 001

## 用户问题与本轮目标

UI-32 的原始页面把累计订单、可用优惠券、成长积分、可提现奖励、订单列表和权益中心放在一起。家长需要能够确认家庭已经有哪些可回看的服务与资产信息，但页面不能把静态数字解释为付款事实、可提现余额或已经完成的权益变更。本轮将 UI-32 收敛为**家庭私有订单与资产回看**，复用已有会员客户投影和既有客户资产读取边界，先打通读取、空态与路由，不接真实支付、退款、兑换、下载、分享、发票、通知或外部履约。

| 用户 | 需要的体验 | 本轮设计 |
|---|---|---|
| 家长 | 看懂家庭有哪些服务和资产可回看 | 订单摘要、家庭积分快照、权益项目和来源状态。 |
| 孩子 | 不被资产数字定义或比较 | 不展示儿童消费、等级、排名、诊断或成长效果结论。 |
| 家庭 | 能知道哪些内容只是记录，哪些还不能操作 | 只读投影和中性状态，所有外部操作保持关闭。 |
| 平台 | 保持 Commerce/Entitlement 与家庭范围一致 | 复用 membership customer projection，不建立平行订单账本。 |

## 数据与业务边界

UI-32 候选对象包括 `OrderProjection`、`EntitlementProjection`、`AssetProjection`、`MembershipProjection`、`PaymentStatusProjection` 和 `AuditEvent`。本轮最小投影优先使用已存在的家庭会员/资产读取响应；订单和资产列表缺少可信来源时展示自然空态，不用原始截图数字冒充真实数据库事实。积分可以回看，但不能从静态页面推导兑换或提现资格；权益可以显示家庭可见范围和当前状态，但不允许在本页消费、转移或变更。

`Fact` 只来自带家庭范围和来源的 projection；`Perspective`、`Recommendation` 和 AI 解释不能改写订单或权益事实。任何退款、下载、分享、客服、发票、支付或权益变更必须是独立 Named Action，并经过 Consent、Human Gate、Audit、幂等与 Adapter；本轮全部保持 HOLD/no-op，不在 UI 上出现工程术语。

## 视觉基线

UI-32 对标 `apps/web/public/bangyang-reference/orders-assets-reference-552x1010.png`，尺寸为 552×1010 纵向移动页面。原始页面包含顶部返回、累计订单/优惠券/成长积分/可提现奖励四项摘要、我的订单三张订单卡、权益中心四项资产和橙色“立即使用权益”按钮。原始基线完整保留；家庭私有回看卡只在受控投影成功后追加到页面底部，不把静态数字、价格、奖励或权益按钮直接解释为真实可用状态。

| 动态可呈现 | 本轮不呈现、不推断 |
|---|---|
| 家庭订单/权益/资产存在与否、家庭可见状态、来源时间 | 已付款、已退款、可提现、可兑换、已下载或已分享 |
| 家庭积分只读快照及“仅供回看”的自然说明 | 订单金额、支付方式、发票、银行卡、通知或外部客服 |
| 回到年度陪伴、我的服务或成长计划 | 任何积分兑换、权益消费、退款、下载、分享或外部订单动作 |

## 数据血缘与页面状态

```text
Family
  ├─ MembershipProjection (FAMILY_PRIVATE, READ_ONLY)
  ├─ OrderProjection[] (SOURCE-BACKED or EMPTY)
  ├─ EntitlementProjection[] (FAMILY_SCOPED)
  └─ AssetProjection[] (FAMILY_SCOPED)

UI-32 OrdersAssetsView
  ├─ IDLE → LOADING → READY | EMPTY | ERROR
  ├─ next_route = annual-member-mine | my-services | core-plan
  └─ external_effect = false
```

前端只保存投影加载状态和家庭内路由，不写订单、权益或资产。读取失败应保持原始静态页面并显示自然错误入口；跨家庭、缺失 Consent 或来源冲突时 fail closed。积分字段只能从明确的 Dev/测试 projection 读取，用户界面不显示 DEV、synthetic、no-op、Model Gateway、回执或审计等开发词汇。

## 流程血缘

> UI-30 年度陪伴说明 → UI-32 订单与资产 → UI-18 家庭服务范围 / UI-31 我的服务 → UI-05 成长计划。

UI-32 的“查看我的服务”入口只路由到 UI-31；“查看权益说明”只回到 UI-30 或 UI-18；“继续成长”回到 UI-05。任何原始“立即使用权益”按钮在本轮只保留基线视觉，不绑定真实消费动作。

## 验收标准

1. UI-32 在受控读取成功时展示家庭私有资产回看，在空态、错误态和无来源态保持自然回退。
2. 订单、优惠券、积分、奖励和权益不被展示成可付款、可提现、可兑换、已履约或教育效果事实。
3. 本轮不新增订单、支付、退款、下载、分享、发票、通知或权益变更写入；所有请求均为家庭范围 GET。
4. 自动化测试覆盖 family scope、projection 成功/空/错误、静态基线保留、UI-32→UI-30/UI-31/UI-05 路由和零写入。
5. 移动端复核确认原始摘要、订单卡、权益中心和导航完整保留，动态卡仅位于基线之后。

## References

[1] [UI-32 Phase C Pre-API Gate 001](UI-32_PHASE_C_PRE_API_GATE_001.md)

[2] [UI-30 年度陪伴说明 PDCA 001](UI-30_FAMILY_SERVICE_OVERVIEW_PDCA_001.md)

[3] [UI-31 我的服务 PDCA 001](UI-31_MY_SERVICES_PDCA_001.md)

## 浏览器视觉复核与测试结果

本轮在本地 `orders-assets` 路由完成移动端浏览器复核，运行截图路径为 `/home/ubuntu/screenshots/localhost_2026-08-19_03-38-04_3661.webp`。原始累计订单、优惠券、成长积分、可提现奖励、我的订单、权益中心与橙色按钮全部保持原样；动态家庭资产回看卡位于原始基线之后，不替换静态内容。

| 验证层级 | 结果 |
|---|---|
| UI-32 定向 Web 测试 | `src/test-loop.commerce-service.spec.ts` 11/11 通过。 |
| Web 全量回归 | 14 个测试文件、108 个测试通过；既有 jsdom navigation stderr 未导致失败。 |
| 浏览器视觉复核 | 基线完整保留，动态资产卡未覆盖订单或权益区。 |

本轮结论为：**UI-32 家庭订单与资产回看通过**。动态区域复用家庭会员客户投影，只读回看服务记录、权益说明和积分快照，不创建订单、支付、退款、兑换、下载、分享或外部履约状态。

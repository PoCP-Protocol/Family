# @family/program-runtime — Program Resource Provider

`@family/program-runtime` 是一个 **PROGRAM_RESOURCE_PROVIDER**(一种可被平台编排的成长资源),
不是商业 Product,也不是平台中心。在 Family Growth Platform V3 中,它位于 **LANE C · GROWTH_RESOURCE_NETWORK**。

## 它提供(HOW an accepted Program progresses)

- program identity(`program_id` + `version`)
- program structure(每日活动槽:learn / practice / coach / reflect)
- content refs(`theme_ref` / `asset_ref` / `instruction_ref` / `scenario_ref` / `prompt_ref`)
- delivery checkpoints(周复盘 / 报告 / 真人介入节奏)
- **schedule projection**(给定 enrollment 当前天的**日程位置**:`schedule_percent` / `reached_final_day`)

## Completion 归属(平台级不变量)

Program Runtime **只投影日程位置,不派生任何"完成"真相**。

```text
Program Runtime 拥有:  structure · rhythm · content refs · delivery checkpoints · schedule projection
未来 Enrollment / Delivery Domain 拥有:  started · paused · completed · cancelled · delivery completion
```

不变量:
- `reached_final_day(Day21 到达) ≠ Program completed`
- `Program completed ≠ Growth outcome`
- 本包内**禁**出现 `completed / ProgramCompleted / delivery_completed / growth_completed` 作为派生真相。

## 它不拥有(NOT its truth)

Family truth · GrowthPriority · GrowthAction truth · Observation · Outcome · Review ·
ServiceCase · Resource ranking · OrchestrationPlan · 任何用户可见内容文本(内容真相属 Content Engine)。

## 职责边界

- **Platform Orchestrator 决定 WHETHER** 调用某个 Program(Need→Capability→Resource→Plan)。
- **Program Runtime 决定 HOW** 一个已被接受的 Program 如何推进(节奏/交付/进度投影)。
- Program 可以**编排行动**,但**不能发明 Growth 方法**:`growth_action_binding` 默认 `null`;
  仅经证据/产品契约明确设计并通过 Growth contract 的 Day 才显式绑定既有 Named Action。
- 一切教研/用户可见内容只保存 `*_ref`,由 Content Engine 持有真相,本包不内联文本。

## 关系(Program ≠ Product)

```text
CommercialProduct ──references──▶ Program(本包)
```

同一个 Program 未来可被 会员 / 机构服务 / 专家服务 / 学校合作 / 免费公益计划 / 第三方产品 共同调用,
因此 Program Runtime 必须保持独立可复用,绝不反向依赖任何单一商业 Product。

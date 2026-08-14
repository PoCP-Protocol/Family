# FPAI Product Event Contract V1

purpose: 冻结 Family 1.0 MOS 第一批产品事件。**产品事件 ≠ 训练数据,≠ Growth 域事件。**
runtime: **NOT_AUTHORIZED**（仅契约)

---

## 1. Product Events(冻结)
```
principal_entry_viewed
principal_question_submitted
principal_response_received
principal_response_displayed
say_it_tonight_viewed
principal_action_proposal_viewed
principal_action_proposal_accepted
principal_action_proposal_rejected
principal_feedback_submitted
principal_safety_routed
principal_human_handoff_created
```

## 2. 关键边界(禁止混用)
```
principal_action_proposal_accepted   = ProductEvent（用户在产品里点了"接受")
真正的 GrowthAction 变化              = Growth domain event（经 Named Action 后)
```
即:**"接受建议"是产品事件;"成长状态改变"才是 Growth 事件。** 二者必须分开记录,禁止用 ProductEvent 冒充 canonical 变化。

## 3. 事件信封对齐
Product Events 复用现有事件规范(`events/EVENT_STANDARD.md` / `event-envelope.schema.json`)的信封字段(eventId/eventName/occurredAt/correlationId/actor/source/payload 等),命名 PascalCase/过去式或既有约定;**payload 不得内联 canonical truth**,只带引用与产品交互元数据。

## 4. 与 ModelRun / GrowthEvent 三分
```
ProductEvent   —— 用户与产品的交互事实(本文件)
ModelRun       —— AI 执行台账(FPAI_MODEL_RUN_LEDGER_V1)
GrowthEvent    —— 成长域 canonical 事件(既有 Growth OS,仅 Named Action 产生)
```

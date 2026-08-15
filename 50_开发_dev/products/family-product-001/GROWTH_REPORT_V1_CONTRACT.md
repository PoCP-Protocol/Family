# FAMILY-GROWTH-REPORT-001 —— Growth Report V1 契约

```text
DOC_KIND = READ_MODEL_CONTRACT + PRODUCT_PROJECTION
RULING   = FAMILY-M3-PRODUCTIZATION-WAVE-001 Task 8(AUTHORIZED)
MODE     = READ_ONLY_PRODUCT_PROJECTION(不创造新 Family Fact,不写 canonical)
DATE     = 2026-08-15
```

## 一、数据来源(只读)

```text
GrowthPriority · Intervention · GrowthAction · Reflection · OutcomeObservation · GrowthReview · NextStepDecision · Timeline
```
Growth Report 是这些既有 canonical 的**只读投影**;`CANONICAL_CHANGE = 0`。

## 二、Truth Guard(最重要)

**禁止**呈现给用户:
```text
家庭成长分 · 家庭关系 82 分 · 孩子进步 76% · 沟通能力提升 35% · 你已经改善 · 该方法证明有效
```
**禁止**后台表格式裸计数:`Action count=8 / Observation count=5`。

**允许**(诚实的产品语言,把计数翻译成观察):
> 过去 7 天记录到 4 次对话继续进行的信号。其中 3 次发生在家长先听完再回应之后。这值得继续观察,但目前不足以证明该方法导致了关系改善。

原则:Recommendation ≠ Decision ≠ Action;Outcome/Signal/Fact 分离;只陈述观察与信号,不下因果/评分结论。

## 三、报告结构(7 段)

```text
01 本周我们关注什么      ← GrowthPriority
02 你尝试了什么          ← Intervention / GrowthAction(翻译为"你做了…",非计数)
03 我们观察到了什么      ← OutcomeObservation / Reflection(信号,非结论)
04 可能正在发生的变化    ← 谨慎措辞,"值得观察",不断言
05 现在还不能确定什么    ← 明确列出不确定性(诚实红线)
06 下一步建议            ← NextStepDecision(建议,非指令)
07 需要专家帮助吗        ← Human Expert 升级入口(接 W2R-105 Human Gate)
```

## 四、第一阶段只做 Synthetic Prototype

```text
允许:真实 UI / 真实组件 / synthetic fixture / read-model contract
禁止:新增 canonical schema / 新增成长评分 / 新增 AI 自动结论 / 真实家庭数据
UI_VISIBLE = YES · PRODUCT_REVIEWABLE = YES · CANONICAL_CHANGE = 0
```
产品团队可据此提前打磨体验,不阻塞 M3。原型见 `prototype/growth-report-v1.html`(静态,读 synthetic fixture)。

## 五、read-model 契约(接入时)

```text
GrowthReportView {
  priority: { title, why }
  tried: [ { what, when } ]            // 翻译文案,非计数
  observed: [ { signal, when, note } ] // 信号,非结论
  maybe_changing: string[]             // 谨慎措辞
  uncertain: string[]                  // 必填:不确定性
  next_steps: string[]                 // 建议
  expert_help: { available: boolean, entry: 'human_handoff' }
}
// 无 score/rank/percentage/causal 字段(schema 层面禁止)
```

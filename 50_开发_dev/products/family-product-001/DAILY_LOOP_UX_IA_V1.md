# FAMILY DAILY LOOP —— 产品化信息架构 V1

```text
DOC_KIND = UX_INFORMATION_ARCHITECTURE
RULING   = FAMILY-M3-PRODUCTIZATION-WAVE-001 Task 9(AUTHORIZED)
DATE     = 2026-08-15
SCOPE    = UX IA + screen flow + synthetic clickable/static prototype;不重构生产 web runtime
```

## 一、从「技术模块」到「用户旅程」

现状(技术视角,弃):
```text
WAF page · Principal page · Growth page · Timeline page
```
改为(用户视角):
```text
今天发生了什么?     → Principal
今天试什么?         → Today's Action
做完了吗?           → Check-in
发生了什么?         → Observation
这一周怎么样?       → Weekly Review
下一步呢?           → Next Step
```
= **Family Daily Loop**。

## 二、主导航(逐步收敛为四项)

```text
Today · Growth · Principal · Family
```
围绕产品意义组织,而非技术模块。

## 三、Screen Flow(21 天产品内)

```text
[Today]
  ├─ 今天发生了什么?      → Principal 对话入口(命中 REVIEW/HIGH_RISK 走 Human Gate)
  ├─ 今天试什么?          → Today's One Small Action(来自 GrowthAction)
  ├─ 做完了吗?            → Check-in
  └─ 发生了什么?          → Observation(记录信号,非结论)
[Growth]
  ├─ 这一周怎么样?        → Weekly Growth Review(Day 7/14)
  ├─ Growth Report        → 只读投影(见 GROWTH_REPORT_V1_CONTRACT)
  └─ 下一步呢?            → Next Step Decision
[Principal]  每日陪练对话历史 + 当前 Growth Priority
[Family]     成员 / consent / 计划进度(Day X/21)
```

## 四、本轮产出边界

```text
产出:UX IA + screen flow + synthetic clickable/static prototype(见 prototype/)
不做:重构生产 web runtime · 新增 canonical · 新增 intervention · 真实家庭数据
```

## 五、与 M3 收口的关系

Daily Loop 是把已收口的能力(WAF/Principal/Evidence Grounding/GrowthAction/Check-in/Observation/Review/W2R-105 Human Gate)**重新编排为家长可理解的日常闭环**,不新增运行时。M3 Golden E2E 三旅程(NORMAL/REVIEW/HIGH_RISK)即本 Loop 的底层验证。

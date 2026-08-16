# D · GOLDEN JOURNEYS —— Allocation V1 三条黄金旅程

```text
RULING = FAMILY-ALLOCATION-V1-001 §11–13
合成家庭:一位家长 + 13 岁孩子;问题域 = 12–15 亲子沟通冲突。
```

## Journey 1 — NORMAL 首次(Need→Match→Case→Deliver→Follow-up→Growth)
```text
家长:"孩子刚摔门,我不知道现在怎么重新开口。"
→ NeedSignal(PARENT_CHILD_COMMUNICATION_CONFLICT, NON_CANONICAL)
→ 平台复述,家长确认 ServiceIntent("我想先处理今晚怎么重新开口")
→ Next Best Help(可解释规则)返回 ≤3:
    ① AI_COACH/PRACTICE(角色练习第一句话)  ② 60 秒 CONTENT  ③ MICRO_PROGRAM(仅当反复出现才给)
→ 家长选 ① → 创建 ServiceCase(OPEN→ASSIGNED AI_COACH→IN_PROGRESS)
→ Principal 处理会话(NORMAL:proposal 仍须家庭确认;不自动写 canonical)
→ 家长现实中尝试 → 极低摩擦 Follow-up("做了/做了一部分/没机会做;发生了什么")
→ Observation 仅经【既有行动边界】进入 Growth OS(不新开写口)
→ ServiceCase COMPLETED;ServiceContribution 记 AI_COACH 贡献(不分钱)
断言:NeedSignal 未写 canonical;Recommendation 未自动决策/行动;NO_ACTION 是可选项;成长事实经既有边界。
```

## Journey 2 — CONTEXT REUSE 二次(证明连续性)
```text
同家庭稍后再遇类似冲突。
→ 平台复用【授权范围内】既有上下文,UI:"你上次试过 X,之后记录了 Y。要不要再试这个方式?"
→ 不断言因果(不说"上次因此改善");只呈现真实 action/observation。
断言:CONTEXT_REUSE=真;REPEAT_EXPLANATION 降低;无 causal claim;无 Child/Family Score。
```

## Journey 3 — HUMAN / SAFETY(升级)
```text
若 REVIEW:ServiceCase → human handoff → 正确服务角色(Coach/Expert)→ 授权上下文投影 → 处理 → 回到家庭 Journey。
若 HIGH_RISK:正常推荐管线【停止】,安全路径优先(既有 precheck 短路 + 转人工),不给普通建议。
断言:HIGH_RISK 时 external model=0/proposal=0/转人工;Human Escalation 已设计。
```

## 验收(对应指标,见 E/H)
```text
TIME_TO_USEFUL_HELP · MATCH_ACCEPTANCE_RATE · SERVICE_COMPLETION_RATE · FOLLOW_UP_RATE · CONTEXT_REUSE_RATE · REPEAT_EXPLANATION_REDUCTION
```

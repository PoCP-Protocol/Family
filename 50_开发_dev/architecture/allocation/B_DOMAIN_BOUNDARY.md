# B · DOMAIN BOUNDARY —— Allocation 域 vs Growth OS vs Family Core

```text
RULING = FAMILY-ALLOCATION-V1-001 §1–2, §10
目的:冻结"服务配置域(Allocation/Service)"与"家庭真相域(Family Core / Growth OS)"的边界,防语义污染。
```

## 1. 三个域的职责(互不复制)

```text
Family Core(既有,真相):身份/成员/关系/consent = Family Account & Sovereign Context 的事实底层。
Growth OS(既有,真相):GrowthPriority / Intervention / GrowthAction / Reflection / OutcomeObservation / GrowthReview / NextStepDecision = 家庭成长【事实与行动闭环】。canonical。
Allocation/Service(本次新增,服务过程):NeedSignal / ServiceIntent / ServiceCandidate / ServiceRecommendation / ServiceCase / ServiceContribution + DemandCluster = "此刻需要什么、配什么资源、谁服务、如何协同"的【服务过程状态】。NON-CANONICAL 于家庭真相。
```

## 2. 关键不变量(冻结,Gate 校验)

```text
NeedSignal   ≠ Family Fact   ≠ Diagnosis   ≠ GrowthPriority
ServiceIntent≠ GrowthPriority ≠ Family Fact
Recommendation ≠ Decision
Decision     ≠ Action
Observation  ≠ Outcome(沿用既有)
Perspective  ≠ Fact(沿用既有)
```
- **AI/系统的需求推断(NeedSignal)绝不写入家庭 canonical 真相**;不产生对孩子的诊断/标签。
- **AI 不能直接创建 GrowthPriority / GrowthAction**;成长事实只经既有 Named Action 边界写入。
- Allocation 域可【读】Growth OS/Family Core(经授权投影)以做匹配与上下文复用,但【不写】其真相、【不复制】其对象。

## 3. 三层需求管线(防污染核心)

```text
① NeedSignal   AI/系统推断,NON_CANONICAL,低成本,可错  ——"这个家庭此刻可能需要 X"
② ServiceIntent 家长【显式确认】的服务请求(OPEN/FULFILLED/CANCELLED)——"我现在想先解决 Y"(是服务请求,非诊断,非 GrowthPriority)
③ ServiceCase  家庭【选择某候选】后平台正式组织服务 ——"平台开始为此组织交付"
```
例:「我不知道怎么和孩子聊手机」→ ServiceIntent=HELP_WITH_PHONE_CONFLICT;**绝不**推出 Child Fact「手机自控差」。

## 4. 命名约束(禁诊断/贴标签)

```text
允许 need_type:PARENT_CHILD_COMMUNICATION_CONFLICT(描述"要处理的情形")
禁止:CHILD_DEFIANT / PHONE_ADDICTED / LOW_SELF_CONTROL(对孩子的诊断/标签)
```

## 5. 写入边界表(谁能写什么)

```text
Allocation 域对象     → 仅 Allocation 服务写(服务过程),不触 canonical
GrowthPriority/Action → 仅经既有 Named Action + Family 确认写(AI/Recommendation 不能直写)
Observation           → 仅经既有行动边界写(服务结果回流走此路径,不新开写口)
DemandCluster         → 只读聚合(匿名+阈值),无任何写家庭真相
```

## 6. 不新增

无 generic EAV / 通用 workflow 引擎 / policy DSL / marketplace 表。Allocation 对象为**显式表/契约**,每个明确 owner 与生命周期。

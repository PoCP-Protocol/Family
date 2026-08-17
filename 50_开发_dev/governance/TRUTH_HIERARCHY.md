# TRUTH HIERARCHY(真相权威序)V1 — 机器化声明"谁比谁权威"

```text
DOC_KIND = GOVERNANCE_SSOT_ORDERING
RULING   = 架构师复盘 2026-08-14 §28(正式建立 Truth Hierarchy)
PURPOSE  = 消除多套"真相"(README / Roadmap / PROJECT_STATUS / 各 Registry / PR body / GitHub / 代码 / DB)不同步时的歧义:
           机器化声明其权威优先级,冲突时高序覆盖低序。禁止低序反向创造高序真相。
```

## 一、状态真相(什么是当前系统的真实状态)——按优先级从高到低

```text
1. Runtime / DB invariant        运行时与数据库不变量(CHECK/schema/实际行为)—— 最高
2. GitHub observed state         已 push 的分支/commit/CI 结论(实际代码世界)
3. Machine governance registry   AUTHORIZATION_REGISTRY / CAPABILITY_TRUTH_REGISTRY / FPAI_PROVIDER_REGISTRY / AGENT_REGISTRY
4. Gate evidence                 reports/**/*GATE*.md、*_FINAL_STATUS.md(证据,非自我宣称授权)
5. Roadmap / Program State       FELS_ROADMAP / PROJECT_STAGE / PROJECT_STATUS
6. PR body                       PR 描述
7. README / narrative docs       叙述性文档 —— 最低
```

规则:
- **冲突以高序为准**;低序与高序不符 = 低序过期,须修低序(不得反向"用 README 改代码事实")。
- 任一层级声称的"完成/PASS"若与更高层级矛盾 → 以高层级为准,并在复盘记一笔。
- `Perspective/Hypothesis/Recommendation != Fact/Decision/Action`(领域语义)与本序正交,均须遵守。

## 二、授权真相(什么被允许运行/pilot/生产)——单独通道,不受状态真相反向创造

```text
Chief Architect Ruling
        ↓ 落记
AUTHORIZATION_REGISTRY(authorized_by + authorization_ref)
```

冻结:
```text
AGENT_SELF_AUTHORIZATION = NO
Code / Gate / Agent / README 不得反向创造授权
"代码已并入" ≠ "能力被授权";runtime/pilot/production 授权只在 AUTHORIZATION_REGISTRY,且只由架构师落记
```

## 三、执行含义(给所有 Agent)

- 汇报状态前:以 §一 高序为准核对(先看 DB/GitHub/registry,再看 doc)。
- 发现文档与代码/DB 不符:**以高序为准修文档**,不抬高文档。
- 需要"允许运行"某能力:查 AUTHORIZATION_REGISTRY;缺则请示架构师,不自增。
- 本序本身的变更:属治理变更,需架构师签署。

> 落地建议(DEVOS truth-reconcile,后续):`evidence-audit` 从"Agent 自称 vs 任务验收"升级为"GitHub/DB 观测真相 vs 上报真相";控制平面按本序自动核对并标注过期项(如 PROJECT_STATUS / README)。

# Family AI Development OS V1.0
## AI开发启动总入口

你正在参与 **Family 家庭成长AI平台** 的开发。

本目录不是“参考资料”，而是项目开发的 **执行控制层（Execution Control Layer）**。

任何AI（Claude Code / Cursor / Codex / 其他Coding Agent）进入项目后，必须按以下顺序工作。

---

# 1. 第一次进入项目时

按顺序阅读：

1. `CLAUDE.md`
2. `PROJECT_STATUS.md`
3. `CURRENT_SPRINT.md`
4. `docs/01_PRODUCT_NORTH_STAR.md`
5. `docs/02_ARCHITECTURE_BASELINE.md`
6. `docs/FAMILY_TECH_ARCH_V3.2.md`
7. `docs/PRODUCT_BOUNDARY_MAP_V3.2.md`
8. `docs/DATA_OWNERSHIP_MATRIX_V3.2.md`
9. `docs/EVENT_TAXONOMY_V3.2.md`
10. `docs/AI_FAMILY_INTEGRATION_CONTRACT_V3.2.md`
11. `docs/FAMILY_1_0_MOS_ARCHITECTURE_GATE.md`
12. `docs/03_DOMAIN_GLOSSARY.md`
13. `docs/04_BUILD_VS_INTEGRATE.md`
14. 当前Task引用的 `specs/**`
15. 当前Task Pack：`backlog/tasks/**`

第一次进入时：

**不要直接编码。**

先执行 `TASK-000_REPO_AUDIT.md`，输出：

`reports/REPO_AUDIT_REPORT.md`

如果当前Repo为空，则按该Task规定建立最小工程骨架。

---

# 2. AI每次开始工作的固定协议

```text
READ Constitution
↓
READ Project Status
↓
READ Current Sprint
↓
SELECT only one Approved Task
↓
READ referenced Specs
↓
Inspect current code
↓
Output Implementation Plan
↓
Check conflicts
↓
Implement
↓
Run tests
↓
Self-review
↓
Update Project Status
↓
Stop and report
```

AI不能自行选择下一Epic。

AI不能因为“顺手”而扩大范围。

---

# 3. Source of Truth优先级

发生冲突时，按以下优先级：

1. `CLAUDE.md`
2. `specs/ontology/**`
3. `specs/actions/**`
4. `specs/policies/**`
5. `specs/api/**`
6. `CURRENT_SPRINT.md`
7. 当前Task Pack
8. Product/architecture docs
9. Existing code

**代码如果与已批准Spec冲突，应先报告，不得偷偷修改Spec迎合代码。**

---

# 4. 第一阶段开发目标

当前不是开发完整AI平台。

当前目标：

# M1 — Family Core Running

系统可以：

```text
Create Family
↓
Add Parent
↓
Add Child
↓
Create Family Relationship
↓
Assign LifeStage
↓
Grant Consent
↓
Audit everything
```

M1完成后才进入GrowthProfile。

---

# 5. 关键禁令

- 不做Family Total Score
- 不做家庭Ranking
- Perspective != Fact
- Hypothesis != Fact
- Recommendation != Decision != Action
- AI自由文本不能直接写核心Ontology状态
- 核心状态必须通过Named Action
- 不允许generic PATCH核心对象
- 不允许业务代码直接绑定具体LLM Provider
- 不允许业务代码直接绑定具体Ontology平台
- 未经批准不创建新的核心Object / Enum / State
- 未经批准不做大型重构
- 未经批准不开始World Model
- 未经批准不创建大量Agent


# V1.1 Engineering Contracts

首次Repo Audit后，还必须阅读 `ENGINEERING_CONTRACT_INDEX.md`。Sprint 0在 `TASK-002_ENGINEERING_CONTRACT_VALIDATION` PASS之前不得进入Family Core业务编码。

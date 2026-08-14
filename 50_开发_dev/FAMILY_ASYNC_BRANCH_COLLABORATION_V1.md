# Family 异步分支协作规约 V1

> **⚠ SUPERSEDED_BY**: `FAMILY_ASYNC_BRANCH_COLLABORATION_V2.md` (2026-08-14)
>
> 本文件保留仅供历史归档参考。V1 将 `wave/m2-wave2-integration` 定义为共享集成基线,已被证明会导致 feature 分支静默漂移(错过 master 上 accepted 提交)。**当前生效规约为 V2**,以 `master` 为唯一 AUTHORITATIVE_SHARED_BASELINE。请所有开发者与 AI Agent 转读 V2。

**状态**: SUPERSEDED · 归档参考,不再作为生效规约
**首版**: 2026-08-11
**作用域**: `PoCP-Protocol/Family` 仓库全体开发者与自动化 Agent (Claude / Copilot / 其他)
**上位**: `d:/Family/CLAUDE.md` § 二/三、`50_开发_dev/CLAUDE.md`(编码宪法)、`50_开发_dev/AI_WORKING_AGREEMENT.md`
**下位**: 各 Session-Start Prompt、各 Sprint 的 CURRENT_SPRINT.md

---

## 0. 为什么需要这份 SSOT

Family 是多脑协作项目 —— 同一时段可能有多位工程师、多位 AI Agent 在不同分支上推进不同垂直切片 (FPAI-MM、Family Core、WAF、FES、Principal AI Soul 等)。历史上出过两类事故:

1. **强制推送 / 硬重置覆盖他人工作**。
2. **在别人分支上顺手改共享文件 (contracts / workspace / lockfile)，让对方合并时被自证式回滚**。

本规约把"多脑异步协作"的边界与手法固化下来，任何人 (含 AI) 违反其中"硬规则"即视为破坏基线，需要立即回滚并复盘。

---

## 1. 分支模型 (SSOT)

| 分支 | 角色 | 谁能改 | 保护级别 |
|---|---|---|---|
| `master` | 已发布基线 | 仅通过 PR 合入；他人 review + gate 通过 | 只写不删；禁止 force-push |
| `wave/m2-wave2-integration` | **共享集成基线** —— 所有 feature 分支的公共上游、下游同步来源 | 由集成负责人合入 (PR 或本地合并 + 推送)；**任何 feature 分支都可以 fetch 但不得 push 到此分支** | 禁止 force-push；禁止跨越 gate 合入 |
| `feature/<owner>-<slice>-<phase>` | 各自的垂直切片工作分支 (如 `feature/fpai-multimodal-ip-mm1`) | **仅分支所有者本人 / 其授权 Agent** | 禁止 force-push；由 owner 主动同步 integration |
| `m3/*`、`m4/*` 等前瞻分支 | 探索性 / 未定型工作 | owner 自定 | 未合入 integration 前不视为基线 |

**推论**:

- Integration 是"下游对齐用的共享基线"，**不是**"上游 owner 的工作场"。任何 owner 的日常提交都发生在自己的 feature 分支上。
- 一个 feature 只能有**一个 owner**。跨 owner 的 feature = 事故温床，必须拆。

---

## 2. 硬规则 (违反即回滚)

以下命令 / 操作在 Family 仓库禁止使用，除非**分支所有者**明确书面授权**且**是在**自己**的 feature 分支上：

- `git reset --hard <ref>` (跨提交回退)
- `git clean -fd` (整目录清除未跟踪文件)
- `git restore .` / `git checkout .` (未加路径的全域丢弃)
- `git push --force` / `git push --force-with-lease` (任何分支)
- `git checkout theirs -- <整目录>` 或 `git checkout ours -- <整目录>` (整目录取一侧)
- `git add .` / `git add -A` **在有跨 owner 文件的工作区里** (会把别人的变更也带进你的提交)
- 用 integration 分支的 head 直接替换某 feature 分支的 head
- 在别的 owner 的 feature 分支上直接推送 / 强推

**软规则** (需 owner 会同意，但技术上不会直接毁坏历史):

- 修改 `pnpm-lock.yaml`、`pnpm-workspace.yaml`、根 `package.json`、`tsconfig.base.json`、任何 `packages/contracts*/src/index.ts`、`50_开发_dev/database/*.sql`、`50_开发_dev/CLAUDE.md`
- 修改 `10_规格_spec/**` 原文 (必须走变更评审 + `ISSUES_对齐台账_V2.1.md`)
- 修改跨 owner 共享包 (`packages/ai-gateway`、`packages/principal-ai`、`packages/contracts`、`packages/fes-contracts`、`packages/waf-contracts`、`packages/fpai-multimodal-contracts`)

---

## 3. Session 开始 → Session 结束 的固定动作

### 3.1 Session Start Safe Sync (每次 AI/工程师开工前)

在自己的 feature 分支上，按顺序执行：

1. `git status` + `git log --oneline -5` 记录 `PRE_SYNC_FPAI_HEAD`。
2. 若工作区脏 → `git stash push -m "session-sync/<owner>/<timestamp>"` **切勿丢弃**。
3. `git fetch origin --prune`。
4. 记录 `origin/wave/m2-wave2-integration` HEAD (`FAMILY_INTEGRATION_HEAD`) 并让人类**确认此 head 就是他/她希望的同步源**。
5. `git merge-base HEAD origin/wave/m2-wave2-integration` → `MERGE_BASE`。
6. `git diff --name-only $MERGE_BASE origin/wave/m2-wave2-integration` 统计 **ONLY_FAMILY_FILE_COUNT**。
7. `git diff --name-only $MERGE_BASE HEAD` 统计 **ONLY_FPAI_FILE_COUNT**。
8. 求交集 → **OVERLAPPING_FILE_COUNT**、**OVERLAPPING_FILES**。**若>0 → HIGH_RISK_SHARED_CHANGE=YES，必须逐个人工审核**。
9. `git merge --no-commit --no-ff origin/wave/m2-wave2-integration`。
10. 逐个冲突：**语义合并**，不允许整目录 `ours`/`theirs`。
    - `packages/principal-ai/*` → **Family 权威版本 (theirs) 优先**，任何 FPAI 私货必须迁到 `packages/fpai-*` 独立包。
    - `pnpm-workspace.yaml`、`pnpm-lock.yaml` → 语义合并 workspace 列表，然后 `pnpm install --no-frozen-lockfile` 重新生成 lockfile。
    - contracts 类文件 → 语义合并接口/字段，宁可保留双方也不擅自删任一方。
11. 冲突全部解完 → `pnpm -r --if-present build && pnpm -r --if-present typecheck`。**任何 typecheck 失败必须先解决**。
12. `pnpm -r --if-present test`。区分：
    - `PRE_EXISTING_FAMILY_FAILURE` = 用 baseline worktree (`git worktree add ../check origin/wave/m2-wave2-integration`) 复现，行为一致则不计入本次同步。
    - `FAIL_INTRODUCED` = 本次合并新引入，必须修好或回滚整个 merge。
13. 验证 no-loss:
    - `FPAI_FILES_LOST=0` (所有 owner 私有关键路径都在)。
    - `FAMILY_FILES_ROLLED_BACK=0` (integration 分支新增/修改的关键路径都在)。
    - `PRINCIPAL_AI_IMPLEMENTATION_COUNT=1` (Family 唯一)。
14. `git commit -m "chore(<slice>): sync latest Family integration baseline"`。
15. `git push origin <当前 feature 分支>` (**绝不 force**)。
16. `git fetch origin` 再核 `git rev-parse HEAD == origin/<feature 分支>` 且 `git merge-base --is-ancestor origin/wave/m2-wave2-integration HEAD` 退出 0。

**若第 10~13 步任何环节被卡住 → STOP_SYNC，恢复 stash，回到 PRE_SYNC_FPAI_HEAD，产出 blocker 报告给人类判决。绝不带病提交。**

### 3.2 Session End Push (每次 AI/工程师收工前)

1. `git status` 干净 or 明确留 stash 交接。
2. 所有本次 session 的成果 `git commit` (语义化提交讯息，一 slice 一 commit 或按 backlog task 组织)。
3. `git push origin <feature 分支>` (无 force)。
4. 在 `50_开发_dev/reports/` 或 slice 自己的报告目录追加一份简报，或更新 `PROJECT_STATUS.md`，让下一位 (人 or AI) 能无缝接手。
5. **不要**顺手向 integration 分支推送。要合入 integration 走 §5 的独立 gate 流程。

---

## 4. 共享文件所有权

| 路径 | Owner | 修改准则 |
|---|---|---|
| `10_规格_spec/**` | 总架构师 | 需 §CLAUDE.md 二 提到的变更评审；他人只记入 `ISSUES_对齐台账_V2.1.md` |
| `20_知识_knowledge/byresearch/evidence.py` | 知识层 owner | 上下游 (研究、开发) 只调用不重写 |
| `50_开发_dev/CLAUDE.md` (编码宪法) | 集成负责人 | 变更需人类 review + 通告 |
| `50_开发_dev/pnpm-workspace.yaml` | 集成负责人 | 加/删 workspace glob 必须同步通告 |
| `50_开发_dev/pnpm-lock.yaml` | 自动生成 | 不手改；`pnpm install --no-frozen-lockfile` 重生成 |
| `50_开发_dev/packages/contracts*` | 契约集成负责人 | 加字段/接口需下游 review；**禁止**在 feature 分支单方面删除他人的导出 |
| `50_开发_dev/packages/principal-ai/**` | Principal AI Soul owner | Family 唯一权威；他人 Performance/Runtime 类扩展必须放到 `packages/fpai-*` 或 `packages/waf-*` |
| `50_开发_dev/packages/ai-gateway` | Model Gateway owner | 只加不删；接口变更走通告 |
| `50_开发_dev/database/schema*.sql` | Family Core DB owner | 迁移只加不删；他人不改根 schema，仅在 `migrations/` 追加 |

**核心原则**: 共享文件不属于当前 slice —— 你可以**追加**，但**不能替换或删除**别人的成果。

---

## 5. 单一权威 Principal AI 规则 (硬规则)

Family 只承认 **唯一一个** Principal AI 大脑实现：`50_开发_dev/packages/principal-ai/`。

- 该包 owner = Family (Soul + Model Router + Safety)。依赖 `@family/ai-gateway`。
- FPAI/WAF/FES 等下游做**表演层 / 编排层**扩展时，必须建独立包 (示例：`@family/fpai-performance-planner`)，**不得**在 `packages/principal-ai` 里塞自己的 class。
- 每次同步后自动化检查:

  ```powershell
  grep -R "export class Principal" 50_开发_dev/**/src | grep -v "PrincipalPerformancePlanner\|PrincipalSoulLoader\|PrincipalSoulCompiler"
  ```

  多出任何一条命中 → `PRINCIPAL_AI_IMPLEMENTATION_COUNT > 1` → SYNC_GATE=FAIL。

---

## 6. 冲突解决手册

| 冲突类型 | 首选做法 | 兜底做法 |
|---|---|---|
| `add/add` 且两侧同名不同用途 (如两版 `packages/principal-ai/package.json`) | 采纳 Family (theirs) 权威版，把自家私货**独立到新包** | 若确有需要保留自家版本 → 停 merge，找总架构师裁决 |
| `content` 冲突 (contracts / workspace / policy) | 逐字段/逐条目**语义合并**，双方新增都保留 | 若语义冲突 → 停 merge，回到 PRE_SYNC_HEAD，找 owner 对齐 |
| `pnpm-lock.yaml` | `pnpm install --no-frozen-lockfile` 重生成 | 不允许手改 |
| workspace glob | 追加双方都需要的 glob，不删对方的 | — |
| `10_规格_spec/**` 冲突 | **停 merge**，走变更评审 | — |

---

## 7. 恢复程序 (Recovery)

任何时刻工作区被误操作/误 push 覆盖：

1. 停手，`git reflog` 拿到覆盖前的 head hash。
2. 新建 recovery 分支：`git branch recovery/<owner>/<timestamp> <old-head>`。
3. 推送 recovery 分支：`git push origin recovery/<owner>/<timestamp>`。
4. 联系被覆盖方 + 集成负责人，评估用哪一 head 重建 feature 分支。
5. **绝不**用 force-push "把历史扳回来"。要用新提交 (`git revert` / `git merge`) 前进。

历史一旦有 force-push 事故 → 全体 owner 停工，走 §CLAUDE.md 的"复盘"流程。

---

## 8. Feature → Integration 的合入 (Independent Gate)

Feature 分支要把成果送到 `wave/m2-wave2-integration`，**不允许**owner 自行 merge 推送。必须：

1. Feature 分支已完成 §3.1 的向下同步，`is-ancestor` 检查通过。
2. Feature owner 提交合并 PR / MR 或书面 kickoff 给集成负责人。
3. 集成负责人跑 §3.1 的镜像流程 (`fetch` + 语义合并 + 全库 typecheck + test)，验证:
   - 无 FPAI_FILES_LOST、无 FAMILY_FILES_ROLLED_BACK。
   - 无回归 (对齐 baseline)。
   - 无违反 §5 单一权威 Principal AI。
   - 契约变更已通告下游。
4. 集成负责人在 integration 分支上完成 merge 提交并推送。
5. Feature owner 下次 session start 再从 integration 同步回自己的分支，形成闭环。

---

## 9. AI Agent 特别约定

- Agent 不得跨 owner 修改共享文件，除非 session 开头就明确得到人类授权（写在当前 session prompt 里）。
- Agent 每次 session start 必须念完 §3.1 全流程后再动手写代码；不允许"先写完再同步"。
- Agent 提交讯息必须能溯源：一律以 `chore/feat/fix(<slice>-<task-id>): <summary>` 为前缀。
- Agent 收到"跨 Sprint / 跨阶段 / 跨 slice"指令时，须先在 chat 里显式确认，得到人类 "GO" 才动手。

---

## 10. 变更本文档

- 本 SSOT 位于 `50_开发_dev/`，由集成负责人维护；任何 owner 都可以提改动 PR。
- 每次修订：追加版本号；不覆盖历史；重大变更同步到 `PROJECT_STATUS.md` 与所有活跃 CURRENT_SPRINT。
- 若与 `50_开发_dev/CLAUDE.md` 或 `10_规格_spec/**` 抵触，以后者为准，本文件同步修订。

---

**当前版本**: V1.0
**下次审阅触发点**: M3 阶段启动前 / 出现新的跨 owner 事故 / 集成分支模型变更。

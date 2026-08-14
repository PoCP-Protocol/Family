# Family 异步分支协作规约 V2

**状态**: ADOPTED · Living Document · **SUPERSEDES V1**
**首版**: 2026-08-14
**作用域**: `PoCP-Protocol/Family` 仓库全体开发者与自动化 Agent (Claude / Copilot / 其他)
**上位**: `d:/Family/CLAUDE.md`、`50_开发_dev/CLAUDE.md`(编码宪法)、`50_开发_dev/AI_WORKING_AGREEMENT.md`
**下位**: 各 Session-Start Prompt、各 Sprint 的 CURRENT_SPRINT.md
**取代**: `FAMILY_ASYNC_BRANCH_COLLABORATION_V1.md`(保留归档,不再作为规约)

---

## 0. 与 V1 的核心变化

**根因**: V1 把 `wave/m2-wave2-integration` 定义为"共享集成基线,所有 feature 分支的公共上游"。但事实证明:

1. 多位 owner (Family Core / Principal AI / IAM / FELS / FLM / DevOS) 都在直接向 `master` 推 accepted 提交,`wave/m2-wave2-integration` 早已停止更新。
2. 各 feature 分支若继续以 `integration` 为同步源,就会**错过 master 上已 accepted 的重大变化**(Principal Runtime、IAM/OTP、Model Router、CI required workflow、Family DevOS 等),形成静默漂移。
3. 出现过因此漏吸收 33 commits × 97 files 的事故,通过 §21 全量远端审计发现并纠正。

**V2 结论**: **`master` 是唯一的 AUTHORITATIVE_SHARED_BASELINE**。`wave/m2-wave2-integration` 降级为 LEGACY,不再是同步源。

---

## 1. 分支模型 (SSOT V2)

| 分支类型 | 角色 | 谁能改 | 保护级别 | 同步源身份 |
|---|---|---|---|---|
| `master` | **AUTHORITATIVE_SHARED_BASELINE** —— 所有 feature 分支的唯一同步来源 | 仅通过 PR 合入;PR 必须过 required gates | 禁止 force-push;禁止直接 push | ✅ **唯一同步源** |
| `feature/<owner>-<slice>-<phase>` | owner 的垂直切片工作分支 (如 `feature/fpai-multimodal-ip-mm1`) | **仅 owner 本人 / 其授权 Agent** | 禁止 force-push;owner 主动 pull master | ❌ 不是他人的同步源 |
| `m3/*`、`m4/*`、`fels/*`、`flm/*`、`gov/*` 等 owner-only 分支 | 探索/主题工作,未合入 master 前不视为基线 | owner 自定 | 未合入 master 前不视为基线 | ❌ **绝不作他人同步源** |
| `wave/m2-wave2-integration` | **LEGACY** —— 已被 master 取代 | 冻结 | 只读参考 | ❌ NO_LONGER_SHARED_SYNC_SOURCE |
| `agent/*`、`devops/*`、`chore/*` | 短生命周期分支 | owner 自定 | PR 合入后即可删除 | ❌ 不作同步源 |

**owner-only 分支绝不成为其他 owner 的同步源** —— 除非正式合入 `master`。

---

## 2. SESSION START 硬流程

任何 Session (人类或 AI Agent) 开工前必须按序执行:

```
1. git status                                # 确认无未提交漂移
2. git fetch origin --prune --tags           # 拉取远端所有 ref
3. git log --oneline HEAD..origin/master     # 看 master 有无新 accepted 提交
4. git diff --name-status HEAD..origin/master  # 看变更文件面 & 与本地工作面重叠情况
5. 判断:
   - 若 master 有 accepted 新提交:
     git merge --no-commit --no-ff origin/master  # 语义 merge,不直接 commit
     → 解冲突(按 §4 归属矩阵)
     → 运行 §5 全套 gate
     → 通过后 commit
   - 若 master 无新提交: 直接进入本 Sprint 工作
6. 只有全套 gate PASS 后才允许基于新基线继续 develop
```

**禁止**: 未 fetch / 未看 master 差异 / 未做 rebase 或 merge 就在旧基线上继续 develop。上一次事故根因即此。

---

## 3. SESSION END 硬流程

```
1. pnpm -r build / typecheck / test          # 全套本地 gate
2. tools/m3-dangerous-authorization-scan.mjs # 治理扫描
3. 若涉及 DB: pnpm db:migrate:status + integration + e2e
4. git status → git add <selective>          # 严禁 git add .
5. git commit -m "<scope>(<domain>): <summary>"
6. git push origin <own-feature-branch>      # 禁止 force-push,禁止 push master
7. git fetch origin && git merge-base --is-ancestor origin/master HEAD  # 验证 master 是祖先
```

**禁止 force push**。**禁止 push 到 master 或他人分支**。**禁止 push 未 merge master 的 feature (即 master 不是自己 HEAD 祖先的状态)**。

---

## 4. 共享代码流

```
Feature-A ──┐
Feature-B ──┼──▶ PR / Gate ──▶ master ──▶ 其他 Feature 通过 fetch+merge 吸收
Feature-C ──┘
```

**禁止**:

- `Feature-A → Feature-B` 直接同步(cherry-pick / merge / 手动复制)
- 未合入 master 的 owner-only 分支(`m3/*` / `fels/*` / `gov/*` / `feature/*`)作为他人的同步源
- 在别人分支上顺手改共享文件(contracts / workspace / lockfile / .env.example)
- 强制推送 / 硬重置覆盖他人工作

**允许**:

- 只读参考他人分支代码(`git show <branch>:<path>`)以理解上下文,但不 cherry-pick
- 通过 PR 让自己的产出经 Gate 后合入 master,再由他人 pull

---

## 5. 归属矩阵 (Conflict Resolution)

冲突解决按文件类型走归属:

| 文件路径 | 归属 | 冲突处理 |
|---|---|---|
| `packages/principal-ai/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| `packages/principal-runtime/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| `packages/ai-gateway/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| `apps/api/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| `database/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| `governance/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| `.github/workflows/**` | MASTER AUTHORITATIVE | 冲突时取 master |
| Family architecture accepted SSOT (`products/famili-principal/architecture/*_V1.md`) | MASTER AUTHORITATIVE | 冲突时取 master |
| IAM / FELS / FLM accepted integration | MASTER AUTHORITATIVE | 冲突时取 master |
| `packages/speech-gateway/**` | FPAI-MM AUTHORITATIVE | 冲突时取 FPAI |
| `packages/avatar-gateway/**` | FPAI-MM AUTHORITATIVE | 冲突时取 FPAI |
| `packages/fpai-performance-planner/**` | FPAI-MM AUTHORITATIVE | 冲突时取 FPAI |
| `packages/fpai-multimodal-contracts/**` | FPAI-MM AUTHORITATIVE | 冲突时取 FPAI |
| `products/famili-principal/apps/avatar-lab/**` | FPAI-MM AUTHORITATIVE | 冲突时取 FPAI |
| Azure Speech MM1-B1.* 相关 | FPAI-MM AUTHORITATIVE | 冲突时取 FPAI |
| `package.json` (root) | SEMANTIC MERGE | 手工合并 scripts / deps,禁止 whole-file |
| `pnpm-workspace.yaml` | SEMANTIC MERGE | 手工合并 packages 列表 |
| `pnpm-lock.yaml` | SEMANTIC MERGE | 取 master,然后 `pnpm install --no-frozen-lockfile` 由 pnpm 重生成 |
| `.env.example` | SEMANTIC MERGE | 保留所有变量块,双方新增都要保留 |
| shared exports / shared config | SEMANTIC MERGE | 手工合并 |
| `products/famili-principal/**` 共享架构文档 | SEMANTIC MERGE | 逐段合并 |

**禁止**在共享文件上做 `git checkout --theirs <file>` / `git checkout --ours <file>` 的 whole-file 决策。必须逐块 semantic merge。

---

## 6. 硬规则汇总

1. **只从 master 同步,不从他人分支同步**。
2. **只 push 自己的 feature 分支**。
3. **禁止 force push / 硬重置覆盖他人工作**。
4. **禁止 `git add .`**;必须 selective `git add <path>`。
5. **禁止在别人分支上顺手改共享文件**。
6. **PR 合入 master 前必须过 required gates**(build、typecheck、test、governance scan、DB migration + integration/e2e、FPAI-MM regression 视工作面而定)。
7. **Merge 后必须验证 `git merge-base --is-ancestor origin/master HEAD` = 0**。
8. **Session 开工前必须 fetch + inspect master**;跳过此步即视为违规。

---

## 7. `wave/m2-wave2-integration` 处置

- **STATUS**: LEGACY
- **NO_LONGER_SHARED_SYNC_SOURCE**: YES
- **保留原因**: 历史归档 + 潜在事故回溯参考
- **不允许**: 作为任何 feature 分支的 fetch/merge 源
- **不允许**: 向此分支 push 新提交
- **迁移路径**: 若发现 `wave/m2-wave2-integration` 上有未合入 master 的 accepted 内容,需通过正式 PR 合入 master,不得让新 feature 分支直接从 integration pull

---

## 8. 变更历史

| 版本 | 日期 | 变更 |
|---|---|---|
| V1 | 2026-08-11 | 首版,定义 `wave/m2-wave2-integration` 为共享集成基线 |
| **V2** | **2026-08-14** | **master 立为唯一 AUTHORITATIVE_SHARED_BASELINE;integration 分支降级为 LEGACY;修正因错误同步源导致的漂移事故** |

---

**END OF V2**

# FELS 本地改动归属审计报告

> 依据：总架构师开发令 **FELS-1-CLOSE-001**（A. 关闭 FELS-1 Real System Gate；B. 隔离保存未授权提前实现的 FELS-2/FELS-3 代码；不得继续扩 FELS 功能）
> 本报告为**只读审计**产出，未改写任何 git 历史。
> 审计时间基线：本地 `wave/m2-wave2-integration` @ `fcc5c431047cbc6ad048d0f182564f7ef6017b55`

---

## 0. 结论摘要（最重要，先读）

开发令假设的前置状态与本地**实况不符**：

| 开发令假设 | 本地实况 |
|---|---|
| 未授权代码在**工作区未提交**，可干净隔离到独立分支 | 工作区**干净**（`git status --short` 为空）；本轮改动**已 commit 且已 push 到 origin** |
| 基线为 `master @ f062ace` | 当前分支为 `wave/m2-wave2-integration @ fcc5c43`，`master` 在 `9d213ac`，`origin/master` 在 `f062ace` |
| 早期 FELS-2/3 可独立隔离 | 早期 FELS-2/3 与 **FELS-1 收口代码 + 他人会话文件** 混在**同一批已 push 提交/同一批文件**中 |

**依据开发令第 7 条**（`保护他人已推送工作 > 保存本轮代码`；禁止强行提交/改写混杂历史）：
- 采纳路径 **A：只记录、不改写已 push 历史**。
- 不执行 `git reset --hard` / `git restore .` / `git checkout -- .` / `git clean -fd` / 全库 `git add .` / `force-push`。
- 早期 FELS-2/3 资产状态标记为 **LOCAL_QUARANTINE_PENDING**（已入历史，冻结待未来显式授权处理），**DO_NOT_MERGE_AS_CAPABILITY**。
- FELS-1 收口以**只读 + 验证**方式正向推进，Family 正典库写入 = 0。

---

## 1. Worktree / 分支拓扑（只读）

| Worktree 路径 | 分支 | HEAD |
|---|---|---|
| D:/Family | `wave/m2-wave2-integration` | `fcc5c43` |
| D:/Family/.tmp/ci-policy-worktree | detached | `da11740` |
| D:/Family-gov | `gov/m3-repo-hygiene` | `fff1a5d` |
| D:/Family-m3-fpai | `m3/fpai-intelligence-contract-gate` | `8cadeb6` |
| D:/Family-m3-fpai-runtime | `m3/rb-003` | `f062ace` |
| D:/Family-m3-mos | `m3/family-1-0-mos` | `3a5bd94` |
| D:/Family-m3-w2 | `m3/w2-consumer-integration-contract` | `4398a85` |
| D:/Family_fpai-multimodal-ip-mm1 | `feature/fpai-multimodal-ip-mm1` | `6f6f8ef` |

`git status --short`：**空**（无未跟踪 / 未暂存 / 已暂存改动）。

---

## 2. 本轮 FELS 改动所在提交（均已 push 到 `origin/wave/m2-wave2-integration`）

| 提交 | 时间 | 说明 |
|---|---|---|
| `91156bd` | 2026-08-12 05:01 +0800 | fels: add read-only export api and lifecycle evidence |
| `fcc5c43` (HEAD) | 2026-08-12 08:08 +0800 | fels: extend lifecycle export contract checks |

> `0003_fels1_program_lifecycle.sql` 亦被 `origin/feature/fpai-multimodal-ip-mm1` 分支包含 —— 进一步说明该资产已扩散进多个已推送分支，**任何回退都会伤及他人**。

---

## 3. 逐文件归属分类

分类枚举：`FELS1_CLOSURE` | `EARLY_FELS2` | `EARLY_FELS3` | `UNRELATED_OTHER_SESSION` | `MIXED_FELS1_AND_EARLY` | `UNKNOWN`

| 文件 | 提交 | 归属分类 | 处置 |
|---|---|---|---|
| `legacy-system/apps/api/src/http-server.ts` | 91156bd (A) | FELS1_CLOSURE | 计入 FELS-1 收口（只读 export HTTP） |
| `legacy-system/apps/api/src/server.ts` | 91156bd (A) | FELS1_CLOSURE | 计入 FELS-1 收口（入口，只读） |
| `legacy-system/apps/api/package.json` | 91156bd (M) | FELS1_CLOSURE | build/start/test 脚本 |
| `legacy-system/apps/api/src/fels1-core.ts` | 91156bd (M) | **MIXED_FELS1_AND_EARLY** | FELS-1 核心 + 早期 camp/task/checkin/advisor/membership 运行时。**早期部分 QUARANTINE_PENDING** |
| `legacy-system/apps/api/src/pg-fels-repository.ts` | 91156bd+fcc5c43 (M) | **MIXED_FELS1_AND_EARLY** | FELS-1 只读仓储 + 早期 6 表 seed/insert/export。**早期部分 QUARANTINE_PENDING** |
| `legacy-system/apps/api/src/http-server.spec.ts` | 91156bd(A)+fcc5c43(M) | **MIXED_FELS1_AND_EARLY** | FELS-1 export 测试 + 早期 program lifecycle 测试。**早期部分 QUARANTINE_PENDING** |
| `legacy-system/db/migrations/0003_fels1_program_lifecycle.sql` | 91156bd (A) | **EARLY_FELS2 + EARLY_FELS3** | legacy_training_camps/camp_enrollments/daily_tasks/task_checkins/advisor_notes = EARLY_FELS2；legacy_memberships = EARLY_FELS3。**QUARANTINE_PENDING** |
| `legacy-system/architecture/MIGRATION_MATRIX_COVERAGE.csv` | (含早期标识) | MIXED_FELS1_AND_EARLY | 迁移矩阵映射，M009–M014 属 PLANNED_FELS2/3 |
| `legacy-system/contracts/src/index.ts` | (含早期标识) | MIXED_FELS1_AND_EARLY | 契约类型含早期实体 |
| `docs/MULTI_TENANCY_DESIGN_V0.1.md` | 91156bd(A)+fcc5c43(M) | **UNRELATED_OTHER_SESSION** | 非本 FELS 会话产物。**禁止移动/回退/改写** |
| `products/famili-principal/product/DH0_5_STATIC_IDENTITY_CONCEPT_C_V1.md` | 91156bd (A) | **UNRELATED_OTHER_SESSION** | Principal 会话产物。**禁止移动/回退/改写** |
| `reports/famili-principal/DH0_5_STATIC_IDENTITY_CONCEPT_REVIEW.md` | 91156bd (A) | **UNRELATED_OTHER_SESSION** | Principal 会话产物。**禁止移动/回退/改写** |
| `reports/famili-principal/M3_PRINCIPAL_000_INTEGRATION_CONTRACT_GATE.md` | 91156bd (A) | **UNRELATED_OTHER_SESSION** | Principal 会话产物。**禁止移动/回退/改写** |

---

## 4. 早期 FELS-2 / FELS-3 资产清单（QUARANTINE_PENDING）

以下资产**代码已存在且已 push**，但按开发令：`代码存在 ≠ 能力已授权 ≠ 能力已验收`。冻结，未来需显式架构师授权方可作为 FELS-2/3 能力推进。

| 资产 | 层 | 载体 |
|---|---|---|
| `legacy_training_camps` | EARLY_FELS2 | 0003 迁移 / fels1-core / pg-repo |
| `legacy_camp_enrollments` | EARLY_FELS2 | 同上 |
| `legacy_daily_tasks` | EARLY_FELS2 | 同上 |
| `legacy_task_checkins` | EARLY_FELS2 | 同上 |
| `legacy_advisor_notes` | EARLY_FELS2 | 同上 |
| `legacy_memberships` | **EARLY_FELS3** | 同上（对应迁移矩阵 M012 → PLANNED_FELS3） |

**语义护栏（已内建于 DEFAULT / semantic_classification 字段，作为负向语义测试保留，不代表 FELS-2/3 开放）：**
`LEGACY_PROGRAM_NOT_JOURNEY`、`LEGACY_PROGRAM_STATUS_NOT_OUTCOME`、`LEGACY_TASK_NOT_GROWTH_ACTION`、`LEGACY_CHECKIN_NOT_OUTCOME`、`LEGACY_ADVISOR_TEXT_NOT_FACT`、`LEGACY_MEMBERSHIP_STATE`。

---

## 5. 禁止动作清单（本轮已遵守）

- [x] 未执行 `git reset --hard`
- [x] 未执行 `git restore .` / `git checkout -- .`
- [x] 未执行 `git clean -fd`
- [x] 未执行全库 `git add .`
- [x] 未 `force-push` / 未改写任何已 push 提交
- [x] 未移动 / 回退 / 提交任何 `UNRELATED_OTHER_SESSION` 文件

---

## 6. 隔离决策（路径 A）

- **状态**：`LOCAL_QUARANTINE_PENDING`
- **原因**：早期 FELS-2/3 资产已与 FELS-1 收口代码及他人会话文件混入同一批已 push 提交，无法在不伤及他人已推送工作的前提下做干净分支隔离。
- **处置**：不改写历史；以本报告冻结记录归属；早期资产标记 `DO_NOT_MERGE_AS_CAPABILITY`，等待未来显式授权时再由专门会话做正向拆分（revert / 新分支重建），届时不动他人历史。
- **FELS-1 收口**：以只读 + 验证方式在本地对 `family_legacy` 正向推进，Family 正典库写入 = 0，不产生新的混杂提交。

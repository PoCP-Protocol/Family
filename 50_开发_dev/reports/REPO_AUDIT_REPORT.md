# REPO_AUDIT_REPORT

task: TASK-000_REPO_AUDIT
type: ANALYSIS_ONLY（未修改/未安装/未删除任何代码）
as_of: 2026-08-09
auditor: Coding AI（受控执行 Agent）

> 方法:对 `D:\Family` 全仓实测(find/ls,排除 `.tmp`),不靠印象。结论按 TASK-000 规定的七段 + 用户要求的五点给出。

---

## 0. 一句话结论

**当前仓库是"规格 + 工程契约 + 一层 Python 知识库",没有任何应用代码(0 行 .ts,无已安装工程)。属于"空 App Repo",应走 TASK-001 从零引导。技术栈与工程契约首选一致(pnpm/TS/NestJS/PG),无冲突。唯一需处理的既有资产是 Python 知识层(`20_知识_knowledge`),按 A3 裁决以服务/CLI 边界对接、不重写。→ 可以执行 TASK-001(附一个前置条件,见 §7)。**

---

## 1. Current State｜当前实际状态

顶层结构(全部为文档/规格/知识,无 app):
```
00_复盘  10_规格_spec(V2.1概念权威)  20_知识_knowledge(Python)
25_研究_research  30_素材_materials  40_产出_derived
50_开发_dev(本工程契约层)  90_归档_archive  CLAUDE.md  README.md
```

**实际技术栈(实测):**

| 探查项 | 结果 |
|---|---|
| 包管理器 / lockfile | **无**。唯一 `package.json` = `50_开发_dev/scaffold/package.json`,是**模板**,无 `node_modules`、无 lockfile,未实例化 |
| apps / modules / packages / src | **不存在** |
| 后端框架 | **无**(NestJS 仅在契约里推荐) |
| 前端框架 | **无**(React 仅推荐) |
| 数据库 / 迁移 | **无运行库**。`50_开发_dev/database/migrations/0001..0003.sql` + `schema_v0_1.sql` 是**契约 DDL,未应用** |
| 测试 | **无**活跃配置(仅 `scaffold/TESTING_STANDARD.md`) |
| lint / format | **无**活跃配置(仅 `scaffold/.editorconfig` + `CODING_CONVENTIONS.md`) |
| CI | 根**无** `.github/workflows`;仅 `scaffold/.github/workflows/ci.yml` 模板 |
| env 处理 | **无** `.env*` |
| 既有领域实体(代码) | **无** |
| 既有 AI 集成(代码) | **无**(Model Gateway/Agent 仅在契约里) |
| 既有 Adapter(代码) | **无**(仅 `integrations/` 契约与 DTO schema) |
| 安全 / Consent 实现(代码) | **无**(仅 `security/` 矩阵 + `MINOR_DATA_SOP` + consent schema/policy) |
| **唯一真实可运行代码** | **Python 知识层** `20_知识_knowledge/byresearch/`:`evidence.py`(证据 E0–E7 + Provenance 门)、`schema.py`(五层卡片)、`library.py`(校验)、`citations.py`(Crossref 核验)。`Library.load()` 可跑,卡片库当前 0 张 |
| 版本控制 | **git 已就位**(本次会话建立),4 次提交,基线可回滚 |

---

## 2. Reusable Components｜可复用组件

1. **Python 循证知识层(`20_知识_knowledge`)——唯一既有代码资产,保留复用。**
   - `evidence.py` 是 **B5 证据等级 E0–E7 + Provenance + `NON_DECISIVE` 门的唯一实现**,工程契约里 `evidence_grade` 字段应以它为权威(见 §3 冲突/裁决)。
   - 复用方式:**不重写为 TS**;由后端(NestJS)以**服务/CLI 边界**调用(如 Knowledge/Evidence 校验以内部 API 或子进程暴露)。这是 `ISSUES_对齐台账_V2.1` 的 **A3 裁决**。
2. **工程契约本身(`50_开发_dev` V1.1)** 可直接作为脚手架来源复用:`scaffold/`(pnpm-workspace/turbo/package.json/CI/conventions/testing)、`database/`(DDL+migrations)、`specs/`(ontology/action/event/policy/openapi)、`agents/`、`models/`、`policies/`、`security/`、`events/`、`integrations/`。TASK-001 应"落地"这些,而非重新发明。
3. **概念规格(`10_规格_spec` V2.1)** 作为业务语义来源,不进代码但指导实现。

---

## 3. Conflicts with Family Baseline｜与架构基线的冲突

| 冲突 | 说明 | 处置 |
|---|---|---|
| **C-1 多语言边界(对应 A3)** | 架构基线/工程契约默认纯 TS/NestJS,**未提及**既有 Python 知识层 | 不重写 Python;以服务/CLI 边界对接。Bootstrap 时在 monorepo 里为它留一个 `packages/`(或 sidecar)边界位。**这是唯一的实质冲突,已有裁决,非阻塞。** |
| **C-2 证据刻度归属(B5)** | 契约 `interventions.evidence_grade` 有字段但**未定义 E0–E7 刻度**;刻度只在 Python `evidence.py` | 以 `evidence.py` 为权威实现;后续把 E0–E7 写入 V2.1 `DS` Evidence 节。Family Core(Sprint1)不涉 evidence 判定,不阻塞 bootstrap |
| **C-3 三处部分裁决(A2/B4/B5)** | DoD 分层未显式化、维度缺 measured_by/proxy_risk/direction、证据刻度未入契约 | 均**不影响 Sprint0 bootstrap 与 Sprint1 Family Core**;记入台账,进入 GrowthProfile/Eval 阶段前补 |

**无重大冲突**:不存在"现有 DB 结构与 Spec 冲突"(无 DB)、"现成技术栈与首选栈不同"(无栈)等 TASK-001 的 Stop 情形。

---

## 4. Missing Foundation｜Sprint 0 需补的基础能力

当前一切工程底座都缺(因为 repo 无 app),Sprint 0 需从零补齐(即 TASK-001 的 Required Outputs):

- [ ] pnpm workspace + TypeScript + turbo 单体仓库骨架(落地 `scaffold/`)
- [ ] `apps/api`(NestJS)+ 健康检查端点
- [ ] `packages/contracts`(由 `specs/` 的 OpenAPI/JSON Schema 生成或承载)
- [ ] `modules/family` 占位
- [ ] DB migration 机制 + 应用 `database/` 的 DDL(up/down 策略)
- [ ] Audit 表/模型基础(actor/timestamp/correlation_id/source)
- [ ] lint / 单测 / 集成测试引导(落地 `TESTING_STANDARD`)
- [ ] `.env.example`、本地 README、`docker-compose`(本地 PG)
- [ ] CI(落地 `scaffold/.github/workflows/ci.yml`)
- [ ] **为 Python 知识层预留边界位**(A3):monorepo 内 `packages/evidence-bridge` 或 sidecar 约定

---

## 5. Recommended Bootstrap Path｜推荐引导路径

1. **代码根 = `50_开发_dev/`**(工程契约与 backlog 已在此;`scaffold/` 即 monorepo 根配置来源)。应用代码建于其下(`apps/`、`packages/`、`modules/`),与 `specs/`/`database/` 平级。
2. **技术栈 = 契约首选**:pnpm workspace + TypeScript + NestJS(`apps/api`)+ PostgreSQL + Zod/JSON Schema + OpenAPI + Vitest/Jest + Docker Compose。**无需报告"技术栈迁移"**(当前无栈,不构成迁移)。
3. **Family Core(Sprint1)前不碰**:GrowthProfile、Journey、Intervention、AI、Model Gateway、CRM 集成(仅接口占位)——均在 `CURRENT_SPRINT` 的 Out of Scope。
4. **顺序**:TASK-001 引导 → TASK-002 工程契约校验(验 DDL 可执行 / OpenAPI 可解析 / JSON Schema 可验 / Agent YAML 可加载 / Human Gate policy 可配 / Event envelope 可验 / CI 不冲突 / Consent 矩阵无未定义角色 / DTO 满足现实)→ PASS 后 TASK-101。
5. **A3 边界**:bootstrap 时确立 Python 知识层调用契约(内部 API 或 CLI),不重写。

---

## 6. Risk｜风险

| 级别 | 风险 | 缓解 |
|---|---|---|
| 低 | CRLF/编码(Windows) | `.gitattributes`/editorconfig 统一;已知非阻塞 |
| 低 | scaffold 模板与实际实例化差异 | TASK-002 专门校验契约可落地 |
| 中 | A3 多语言协作复杂度(TS↔Python) | 用清晰服务/CLI 边界隔离,evidence 逻辑不外泄进 TS;Sprint1 不触发 |
| 中 | 未成年人数据合规 | Sprint1 已含 GrantConsent + `MINOR_DATA_SOP` + Consent 矩阵;实现须严格遵守,Human Gate 就位 |
| 提示 | 三处部分裁决(A2/B4/B5) | 不阻塞 M1;进入 Profile/Eval 前补,已登记台账 |

**未发现任何 TASK-000/TASK-001 的强制 Stop 情形。**

---

## 7. Whether TASK-001 Can Proceed｜TASK-001 是否可执行

**可以执行。** 理由:repo 为空 App、无技术栈冲突、无既有 DB 冲突、无删除历史数据需求、无 Consent/Safety 变更需求、无 breaking API 变更。

**唯一前置(建议先获人工确认,非硬阻塞):**
- **确认代码根落在 `50_开发_dev/`**(而非仓库根 `D:\Family`),以保持"程序仓库 = 文档/规格/知识,工程执行层 = 50_开发_dev"的分层。
- **确认 A3 边界策略**:Python 知识层以服务/CLI 对接、不重写。

二者确认后,TASK-001_ENGINEERING_BOOTSTRAP 即可开工;其产出经 TASK-002 校验 PASS,方进入 Sprint 1(TASK-101 CreateFamily)。

---

## 8. 对用户五问的直接回答

1. **当前 Repo 实际技术栈**:无应用技术栈(0 行 TS/无已安装工程);唯一真实代码为 Python 知识层(evidence/schema/library/citations)。git 已就位。
2. **已有代码哪些可复用**:Python 知识层(证据 E0–E7 权威实现)——保留、以边界对接、不重写;工程契约的 scaffold/DDL/specs 作为落地来源复用。
3. **与架构基线冲突**:仅一处实质冲突——多语言边界(TS vs 既有 Python,A3),已有裁决、非阻塞;另两处为契约与刻度归属的部分裁决(B5/B4/A2),不阻塞 M1。
4. **Sprint 0 需补的基础**:见 §4——整套工程底座(monorepo/api/契约包/DB迁移/audit/测试/CI/env)+ Python 边界位,从零建立。
5. **是否可执行 TASK-001**:可以(见 §7),建议先由人确认"代码根 = 50_开发_dev/"与"A3 边界"两点。

---

status: TASK-000 完成。未写任何业务代码。等待人工确认后进入 TASK-001。

# 程序状态 —— FAMILY(执行/状态 SSOT)

```text
DOC_KIND = PROGRAM_STATUS(执行/状态 SSOT —— 仅承载可变执行真相 + 指针,不承载战略)
RULING   = 总架构师/用户主计划执行指令(2026-08-16;仅校准可变执行状态)
BASE     = master @ 2ce16a377d27898e48be10e11f75b15a4b12b26d
PHASE0   = PASS_CLOSED(product-runtime-001 已合入 master)
PHASE1   = ARCH-001 / master@2ce16a3 / ARCHITECTURE_MERGED(运行时代码仍须独立 Gate)
PHASE2   = FAMILY-GROWTH-VERTICAL-SLICE-001 / APP_GATE_VERIFIED_AND_PUSHED(branch=family-growth-vertical-slice-001@8b9c68e;仅开发分支)
PHASE8   = FAMILY_PHASE8_PROGRESS_STEWARD_METRICS_001 / VERIFIED_AND_PUSHED(branch=family-growth-vertical-slice-001@8b9c68e;仅开发分支)
PHASE9   = FAMILY_PHASE9_INTEGRATION_E2E_REGRESSION_001 / INTERNAL_DETERMINISTIC_VALIDATION_AUTHORIZED(branch=family-growth-vertical-slice-001@8b9c68e;验证既有实现,不授权新能力)
RUNTIME  = INTERNAL_DETERMINISTIC_ONLY(未合 master、未试点、未生产、无真实外部模型外呼)
NEXT_AUTHORIZED_STEP = PHASE9_INTEGRATION_E2E_REGRESSION(真实 DB/安全/本地浏览器/浏览器后 DB 回归；无新增迁移、DTO、Named Action 或产品能力；每次合 master 仍须 explicit per-merge authorization)
PR34     = PARK(商业蓝图 companion,未授权 runtime)
```

> **最高战略 SSOT = `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md`(架构 SSOT)。本文件只承载执行状态 + 指针,不得另立/重述与蓝图竞争的战略。**
> 战略权威(北极星 / M0–M8 成熟度 / 八对象链 / Growth Fiduciary 两阶段 / 一级导航 / 命名 / DO_NOT_BUILD 过滤器)一律见蓝图。
> Phase 1 架构契约见 `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md`;合并授权见 `governance/MERGE_AUTHORIZATIONS.yaml`。

## 一、当前执行状态

```text
Phase0 战略+代码重定基            = PASS_CLOSED(北极星→编排;Program01→FIRST_PROGRAM_RESOURCE;Program Runtime→@family/program-runtime;Program-派生 completed 已移除)
Phase1 Growth Resource 架构契约   = ARCHITECTURE_MERGED(master@2ce16a3;八对象 + FamilyServiceDecision 边界 + 一条黄金旅程；运行时代码另行验证)
Phase2 首条纵切 runtime           = APP_GATE_VERIFIED_AND_PUSHED(branch=family-growth-vertical-slice-001@8b9c68e;仅开发分支；未合 master/未试点/未生产);任务名 FAMILY-GROWTH-VERTICAL-SLICE-001
Phase8 单家庭连续服务基础          = VERIFIED_AND_PUSHED(家庭私有进度/上下文投影、内部 Steward 队列与服务过程度量；不含组织/跨家庭/真人交付/外部模型)
Phase9 集成/安全/E2E/回归验证       = INTERNAL_DETERMINISTIC_VALIDATION_AUTHORIZED(只验证既有 Phase 2/8 实现；无新增迁移、DTO、Named Action 或产品页面；未合 master/未试点/未生产)
后续 Phase3–10                    = 见蓝图 §8(锚 M0–M8)
```

## 二、开放 PR 处置

```text
PR#35 orchestration-arch-001 = Phase1 架构契约,已入 master@2ce16a3;后续 runtime 分支仍须独立审查与 per-merge authorization
PR#34 v3-commerce-blueprint   = PARK(商业蓝图 companion;六点待修;RUNTIME=HOLD)
PR#24 / PR#25(历史 W2R-106/PRODUCT-001 设计)= 见各自 PR;非当前纵切,不做 Runtime
合 master 一律须显式 per-merge 授权(pr + exact head_sha + authorized_by: family-chief-architect)。
```

## 三、执行级 HOLD

```text
Real Family Alpha / 100 Family Pilot / Production · Payments/Membership billing · Marketplace · Commission/Settlement
· Provider bidding · ML ranking · Demand Network runtime · FGCN/Allocation runtime · Enrollment/Delivery/Orchestration/ServiceCase runtime
· Organization 多租户(TENANCY_002B)· Child Agent · Full LMS · Digital Human · World Model · Family 7B · SFT/LoRA · ASSESSMENT_RESOURCE。
解冻:TENANCY_002A_FAMILY_MEMBERSHIP = 已入 master;其余保持冻结,除非直挡当前 V1 纵切 / M1–M5 readiness。
```

## 四、成功定义(V3 对齐)

> 一个从未接触 Family 的家长,无需开发者告知 UUID、无需手改 URL、**无需先完成成长测评或建立 GrowthPriority**,就能从**首页**说出"孩子刚摔门",由 Family 识别需求 → 判断能力 → 给出可选择的合适帮助 → 家庭决定 → 负责跟进 → 下次记得之前发生过什么;出现 REVIEW 时真专家能处理;系统失败时运营团队知道发生了什么。

达到此标准(经 M1–M5)= 单家庭价值闭环成立。此前不拿真实家庭替开发找 bug。

---

## 附:SUPERSEDED / HISTORICAL(不再作为当前 Gate,仅留档)

以下为旧"FAMILY PLATFORM V1 BUILD"执行模型,**已被蓝图 M0–M8 + ARCH-001 取代,不得再作为当前成熟度/放行判据**:

```text
[SUPERSEDED] M3 CORE → FAMILY PLATFORM V1 BUILD → FAMILY_PLATFORM_V1_READY → INTERNAL DOGFOOD → ...
[SUPERSEDED] 总 Gate P1–P8(Platform Shell/Identity/Onboarding/Principal+Growth Product/Expert/Ops/Privacy/Reliability)
[SUPERSEDED] CORE_ENGINE_PROGRESS ≈ 82% · PLATFORM_PRODUCT_PROGRESS ≈ 50% · REAL_FAMILY_READINESS 百分比模型
[SUPERSEDED] Product 01 作为平台中心(现 = FIRST_PROGRAM_RESOURCE,仅验证 M1–M5)
[SUPERSEDED] Today / Principal / Growth Daily Loop 作为当前顶层产品模型(现 = HOME 的只读投影 / 嵌入 AI 资源 / 见 ARCH-001 §16)
```
当前唯一成熟度模型 = 蓝图 M0–M8;当前唯一 Phase1 架构 = ARCH-001。历史条目保留仅为追溯,不参与任何 Gate 判定。

# 程序状态 —— FAMILY(执行/状态 SSOT)

```text
DOC_KIND = PROGRAM_STATUS(执行/状态 SSOT —— 仅承载可变执行真相 + 指针,不承载战略)
RULING   = 总架构师(2026-08-16;PR#36 P0-RUNTIME-TRUST-CLOSEOUT 已授权)
BASE     = master @ 2ce16a377d27898e48be10e11f75b15a4b12b26d
PR36     = platform/family-growth-vertical-slice-001 @ 6103981dec6c7a4b9ceb988ddcdb75b5c44f6154
RUNTIME  = P0_RUNTIME_TRUST_CLOSEOUT / PASS_CANDIDATE_ACCEPTED_FOR_REVIEW(内部确定性收口已接受;开发面冻结)
NEXT_AUTHORIZED_STEP = APP_FIRST_GATE_DECISION_INPUT_ONLY(不得写业务代码/DTO/API/数据库;不得进入 HOME/mobile runtime/merge/pilot/production)
PR34     = PARK(商业蓝图 companion,未授权 runtime)
PR37     = STRATEGIC_DIRECTION_ONLY(runtime/merge/modification-in-PR36=HOLD)
```

> **最高战略 SSOT = `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md`(架构 SSOT)。本文件只承载执行状态 + 指针,不得另立/重述与蓝图竞争的战略。**
> 战略权威(北极星 / M0–M8 成熟度 / 八对象链 / Growth Fiduciary 两阶段 / 一级导航 / 命名 / DO_NOT_BUILD 过滤器)一律见蓝图。
> Phase 1 架构契约见 `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md`;合并授权见 `governance/MERGE_AUTHORIZATIONS.yaml`。

## 一、当前执行状态

```text
Phase0 战略+代码重定基            = PASS_CLOSED(历史基线)
Phase1 Growth Resource 架构契约   = ARCH-001(战略/架构锚)
Phase2 首条纵切 runtime           = P0_RUNTIME_TRUST_CLOSEOUT / PASS_CANDIDATE_ACCEPTED_FOR_REVIEW(PR#36 exact head=6103981;开发面冻结)
当前已验证范围                    = Principal ORCHESTRATION_AI_COACH 无 legacy proposal、strict Account family context、cookie Origin、NO_ACTION、PRACTICE no-executor、全链路幂等、T1/T2、handoff、主体链、canonical delta=0
当前唯一允许工作                  = DRAFT_FOR_APP_GATE_DECISION_INPUT(榜样教育材料→Family App-first 体验设计映射;不写业务代码)
下一步                            = 等待 App Gate；HOME_PRODUCT_GATE=HOLD；MOBILE_RUNTIME_GATE=HOLD；MERGE_AUTHORIZATION=NONE
后续 Phase3–10                    = 见蓝图 §8(锚 M0–M8)，均须另行 Gate
```

## 二、开放 PR 处置

```text
PR#36 family-growth-vertical-slice-001 = DRAFT / P0_RUNTIME_TRUST_CLOSEOUT / PASS_CANDIDATE_ACCEPTED_FOR_REVIEW / exact head=6103981 / AUTO_MERGE=NO / DEVELOPMENT_FROZEN
PR#37 service-os-account-blueprint       = 战略方向有效 / RUNTIME=HOLD / MERGE=HOLD / 不在 PR#36 修改
PR#34 v3-commerce-blueprint              = PARK(商业蓝图 companion;RUNTIME=HOLD)
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

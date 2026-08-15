# 程序状态 —— FAMILY PLATFORM V1(程序重定基)

```text
DOC_KIND = PROGRAM_STATUS(SSOT)
RULING   = FAMILY-PLATFORM-V1-BUILD-001(总架构师,2026-08-15)
BASE     = master @ d03931de8f8b300f3ee53b9eda9f497956677448
```

## 一、阶段重定义(取代旧 M3→MOS→Alpha)

```text
M3 CORE  →  FAMILY PLATFORM V1 BUILD  →  FAMILY_PLATFORM_V1_READY
         →  INTERNAL DOGFOOD  →  PLATFORM STABILITY GATE  →  REAL FAMILY ALPHA
```

唯一主战役:**把 Family 从「后端能力集合」做成「完整平台」。**

## 二、双进度口径(不再用单一「M3 %」)

```text
CORE_ENGINE_PROGRESS      ≈ 82%   (Family Canonical/Growth OS/Principal/Evidence/Human Gate/Bearer 后端)
PLATFORM_PRODUCT_PROGRESS ≈ 50%   (平台壳/全平台 IAM/注册/onboarding/WAF runtime/专家台/运营台/隐私/通知/部署)
REAL_FAMILY_READINESS     = 0      (治理口径:Gate 未开=0,非"什么都没做")
```

## 三、总 Gate:FAMILY_PLATFORM_V1_READY(八块)

```text
P1 Platform Shell · P2 Identity & Family Membership · P3 Family Onboarding · P4 Principal+Growth Product
P5 Expert Console · P6 Ops Console · P7 Privacy/Notification · P8 Reliability/Deployment
```
关闭判据(全零/全 PASS):
```text
AUTH_URL_TRUST=0 · CONSUMER_X_ACTOR_ID_BYPASS=0 · USER_ENTERED_UUID=0 · WAF_IN_MEMORY_STATE=0
EXPERT_CONSOLE=PASS · OPS_CONSOLE=PASS · PRIVACY_CENTER=PASS · GROWTH_REPORT_RUNTIME=PASS · NOTIFICATION_CORE=PASS
STAGING_DEPLOYMENT=PASS · DB_BACKUP_RESTORE_TEST=PASS · NORMAL/REVIEW/HIGH_RISK/RETURN_E2E=PASS · P0_BLOCKERS=0
```
在此 Gate 之前:`REAL_FAMILY_TEST = NO`。

## 四、优先级

```text
P0(平台不能没有):Web Platform Shell · Platform IAM · Family Membership · Registration · Onboarding
                    · Today · Principal · Growth Daily Loop · Expert Console · Privacy · Staging/Reliability
P1(真正好用):Growth Report · Notification · Ops Console · WAF persistence · 错误/空/加载 UX · 移动端 · 无障碍
P2(商业化以后):Payments · Membership billing · Organization · Expert Marketplace · Advanced Community
HOLD:Real Family Alpha · 100 Family Pilot · Child Agent · Full LMS · Digital Human · World Model
      · Family 7B · SFT/LoRA · TENANCY enterprise(002B+)· broad new interventions
```

## 五、正式解冻 / 保持冻结

```text
TENANCY_002A_FAMILY_MEMBERSHIP = AUTHORIZED(仅 FamilyMembership runtime)
TENANCY_002B_ORGANIZATION       = HOLD
REAL_FAMILY_ALPHA / 100_PILOT / PRODUCTION = HOLD
```

## 六、当前开放 PR 处置

```text
PR #24 (W2R-106 Golden E2E PREP)  = KEEP_OPEN;后续升级为 PLATFORM-E2E-001 的子集,现不做 Runtime
PR #25 (FAMILY-PRODUCT-001 设计)   = KEEP_OPEN,作为 FAMILY-PROGRAM-RUNTIME-001 的产品契约参考
NO RUSH MERGE —— 先定平台地基(WEB-ARCH-001)
```

## 七、成功定义(新)

> 一个从未接触 Family 的成年人,无需开发者告知 UUID、无需手改 URL、无需知道 W2R/M3,就能自助完成注册→建立家庭→获得建议→确认行动→次日回来 Check-in;出现 REVIEW 时真专家能处理;系统失败时运营团队知道发生了什么。

达到此标准 = 平台搭建完成。此前不拿真实家庭替开发找 bug。

# DEVOS-CONV-003 —— 控制面真相对齐 Gate

```text
DOC_KIND = GATE_REPORT
RULING   = FAMILY-PLATFORM-TENANCY-FOUNDATION-001 Phase 0(FIRST)
DATE     = 2026-08-15
BASE     = master @ 9d380980d75a24075b3a278bfbf73b9b923963d2
SCOPE    = 治理/控制面 only(TASK_REGISTRY + AGENTS 范围);无产品 runtime、无 canonical
```

## 一、为什么先做(FIRST)

`TASK_REGISTRY_V1.json` 状态早被 GitHub 事实超越(全 READY/PLANNED),且 `AGENT_TENANCY_IAM` 默认可写路径只有 architecture/docs/reports——若直接让它写 T1/T2 runtime,它按自身治理规则会**判自己越权**。故先让 Dev OS 回到真实世界。

## 二、TASK_REGISTRY 真相对齐

```text
W2R_103B       READY   → PASS_CLOSED   (PR #12 → m3/w2r-104 → master)
TENANCY_001    READY   → PASS_CLOSED   (PR #17 → master)
OPS_001        READY   → PASS_CLOSED   (PR #21 → master)
W2R_104_FINAL  PLANNED → PASS_CLOSED   (PR #16;M3-W2R-104-FINAL-FIX-001)
+ W2R_105              = PASS_CLOSED   (PR #22)
+ IAM_103             = PASS_CLOSED   (PR #23)
+ PLATFORM_V1_FOUNDATION = PASS_CLOSED (PR #26)
W2R_106        PLANNED → DRAFT_REFERENCE / NOT_RUNTIME  (PR #24 acceptance 参考,不做 runtime)
```
新增在办/计划任务:
```text
TENANCY_V2_T1_T2         READY / AUTHORIZED   (本轮主战:Account+Membership+Session+Guard)
PLATFORM_SHELL_CORRECTION PLANNED / AUTHORIZED_AFTER_T1T2  (纠正 PR#26 单家庭 Session)
PLATFORM_AUTH_ONBOARDING  PLANNED / AUTHORIZED_AFTER_T1T2
```
未动:FLM_AC_002(其它 agent)、OBJECT_TREE_P2(HOLD)、OBJECT_TREE_P3(SUPERSEDED)。

## 三、AGENT 路径修复

`AGENT_TENANCY_IAM` 授权扩到 T1/T2(不放开为 `**`):
```text
+ 50_开发_dev/database/migrations/**
+ 50_开发_dev/apps/api/src/modules/auth/**
+ 50_开发_dev/apps/api/src/modules/family/**
+ 50_开发_dev/packages/contracts/**
+ 50_开发_dev/apps/api/**/*.spec.ts
```
路径漂移修复(全局):
```text
apps/api/src/principal/**  →  apps/api/src/modules/principal/**   (AGENT_PRINCIPAL_AI, AGENT_CONSUMER_PRODUCT, W2R_103B, W2R_104_FINAL)
apps/api/src/family/**     →  apps/api/src/modules/family/**      (AGENT_OBJECT_DOMAIN)
```

## 四、校验

```text
JSON valid = YES
dev-os orchestrate validate = { ok: true, tasks: 14, agents: 9 }
不重建已关闭工作;不放开 ** 通配;无 canonical / 无产品 runtime 改动
```

## 五、边界

治理 only。合 master 须显式 per-merge 授权(见 MERGE_AUTHORIZATIONS.yaml)。REAL_FAMILY_ALPHA/PILOT/PRODUCTION=HOLD。Organization/AccessGrant(T3+)仍 HOLD。

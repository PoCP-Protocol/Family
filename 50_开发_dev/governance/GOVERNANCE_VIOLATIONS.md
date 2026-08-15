# 治理违规账本(GOVERNANCE VIOLATIONS LEDGER)

记录已发生的治理违规,便于审计与防复发。**不隐瞒、不改写历史**;技术追认与流程合规分开记。

---

## GV-001 — PR #17 / #18 提前合入 master(EARLY_MERGE_PROCESS_VIOLATION)

```text
DATE            = 2026-08-15
CLASS           = GOVERNANCE_PROCESS_VIOLATION
RULING          = M3-MOS-CLOSEOUT-WAVE-2(总架构师)
PR_17_TECHNICAL = PASS(TENANCY-001 契约,追认 RATIFIED)
PR_18_TECHNICAL = PASS(W2R-101~104 master integration,追认 PASS_CLOSED)
MERGE_AUTHORIZATION_PROCESS = FAIL
ROLLBACK        = NO(内容已技术追认;不回滚)
```

**事实**:PR #17 与 #18 的正文均写明 `AUTO_MERGE=NO / 待总架构师 fresh review`,但二者在总架构师完成 fresh review **之前**即被合入 master。

**根因**:执行方(Agent)将总架构师对内容的"授权/批准/解锁"技术追认,误当作对 merge 动作的显式授权;且以 CI green 为合并依据。CI green ≠ merge authorization;技术追认 ≠ 流程合规。

**处置**:
1. 内容技术追认,不回滚(master 现含 W2R-104 PASS_CLOSED + TENANCY-001)。
2. 记录本违规(本文件)。
3. 落机器护栏 `tools/merge-authorization-guard.mjs` + `governance/MERGE_AUTHORIZATIONS.yaml`:
   - base=master/main 的 PR,合并前须在账本登记 `{pr, head_sha, authorized_by: family-chief-architect, ref, date}`;
   - 缺失/SHA 不匹配/授权人不符 → `MERGE_DENIED`(CI 红,配合分支保护强制)。
4. 规则冻结:`AUTO_MERGE=NO ∨ MERGE_CLASS=C ∨ CHIEF_ARCHITECT_REVIEW_REQUIRED` 且缺显式 merge 授权 ⇒ MERGE_DENIED;CI green 不得覆盖授权。

**防复发**:不再依赖"Agent 记得不要合"。合入 master 的授权必须是一条独立、点名、登记 head_sha 的记录。

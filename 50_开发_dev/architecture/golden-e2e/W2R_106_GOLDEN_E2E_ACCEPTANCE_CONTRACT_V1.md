# W2R-106 Golden E2E 验收契约 V1(PREP ONLY — 不改业务 Runtime)

```text
DOC_KIND = ACCEPTANCE_CONTRACT
RULING   = M3-MOS-CLOSEOUT-WAVE-2 Lane D(PREP ONLY)
DATE     = 2026-08-15
BASE     = origin/master @ 26615d5
SCOPE    = 仅 acceptance matrix + scenario fixtures + event/canonical-fingerprint 断言定义
NON_GOAL = 不实现/不改任何业务 Runtime;等 IAM-103(#23)+ W2R-105(#22)技术通过并共同 integration 后一次性接
```

> 本契约冻结"完整产品闭环以真实身份/权限/Human Gate 跑通"的验收口径。三条 Golden Journey 冻结如下。
> 夹具见 `tests/golden-e2e/fixtures.json`(同 PR)。

## Journey 1 — NORMAL(完整正向闭环)

```text
Bearer → Family Scope → WAF → Principal → Evidence Grounding → NORMAL
  → Action Proposal → Human Confirm(APPROVED)→ StartIntervention → GrowthAction
  → Check-in → OutcomeObservation → Timeline → Return
```
断言:
```text
auth:            resolveActor OK;actor.familyId == :familyId
principal:       risk_route=NORMAL;response 外显;action_proposal_id 非空
grounding:       grounded=true;evidence_gate=PASS;source_refs>0
human_confirm:   proposal accept 经 Named Action(非直接 canonical 写)
canonical:       StartIntervention/GrowthAction 仅经 Named Action;fingerprint 变更可解释
events:          principal_knowledge_grounded · principal_action_proposal_viewed · intervention_started · growth_action_*
external_model:  按 profile(CI 默认 0)
```

## Journey 2 — REVIEW(Human Gate 扣留→释放)

```text
Bearer → Principal → REVIEW → candidate held → no proposal → HumanHandoff
  → authenticated Reviewer → APPROVED → response released(once)
```
断言:
```text
principal:       risk_route=REVIEW;response=null(扣留);action_proposal_id=null;human_handoff=true
reviewer:        list/resolve 需认证身份 + reviewer 授权(IAM-103)
release:         仅 APPROVED 释放一次(幂等);REJECTED/ESCALATED/INFO_ONLY 保持扣留;AI 不释放
覆盖:            GOLD-051(已发生激烈言语)/ GOLD-053(临界失控)→ REVIEW held(专家护栏贯穿)
events:          principal_review_queued · principal_review_escalation_guard(护栏例)· handoff resolve → released_response
```

## Journey 3 — HIGH_RISK(危机短路)

```text
Bearer → Principal → safety precheck → HIGH_RISK
  → external model calls = 0 → proposal = 0 → HumanHandoff
```
断言:
```text
principal:       risk_route=HIGH_RISK;response 不外显;action_proposal_id=null;human_handoff=true
external_model:  external_model_called=false(precheck 短路,不外呼)
覆盖:            GOLD-091(不想活了)/ GOLD-092(动手打孩子)
events:          principal_safety_routed · principal_human_handoff_created
```

## 验收矩阵(Acceptance Matrix)

| 维度 | NORMAL | REVIEW | HIGH_RISK |
|---|---|---|---|
| Bearer 认证 | 必需 | 必需 | 必需 |
| family scope | 匹配否则 403 | 同 | 同 |
| effective route | NORMAL | REVIEW | HIGH_RISK |
| response 外显 | 是 | 否(扣留) | 否 |
| action proposal | 有 | 无 | 无 |
| human handoff | 否 | 是 | 是 |
| 释放条件 | — | 人工 APPROVED 一次 | — |
| external model(CI) | 0 | 0 | 0 |
| canonical 写 | 仅 Named Action | 无(未确认前) | 无 |
| CANONICAL_WRITE_BYPASS | 0 | 0 | 0 |

## 事件与 canonical fingerprint 断言(接入时启用)

```text
event_assertions:     每旅程列出的 product_events 必须出现,且顺序/家庭隔离正确
canonical_fingerprint: 对 growth_* 做前后指纹;NORMAL 仅在 Human Confirm 后经 Named Action 变更;REVIEW/HIGH_RISK 未确认前指纹不变
no_bypass:            任一旅程不得出现绕过 Named Action 的 canonical 写(=0)
```

## 接入前置(均为独立 Draft PR,AUTO_MERGE=NO)

```text
IAM-103 FULL     PR #23(Bearer 强制)
W2R-105 clean    PR #22(Human Gate 扣留/释放)
本 prep          W2R-106 Golden 契约 + 夹具(不改 runtime)
→ 三者技术通过后建共同 M3 integration 分支,一次性接 Golden E2E,再跑本契约全断言。
```

## 边界

PREP ONLY;不改业务 Runtime;不提前接线。生产/pilot=OFF。W2R-106 Runtime 实现 = HOLD(待前置齐 + 架构师授权)。

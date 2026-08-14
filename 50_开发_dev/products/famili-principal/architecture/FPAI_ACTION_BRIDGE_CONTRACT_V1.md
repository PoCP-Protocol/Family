# FPAI Action Bridge Contract V1

purpose: 冻结 **唯一** 允许 AI 建议进入 Growth OS 的通道。
runtime: **NOT_AUTHORIZED**（仅契约)

---

## 1. 唯一合法路径
```
PrincipalActionProposal
   ↓ (user explicit confirmation)
Approved Application Command
   ↓
既有已批准 Intervention（Proposal-to-Intervention Bridge）
   ↓
既有确定性 GrowthAction（既有 Family Named Action)
   ↓
Growth OS canonical state
```
**禁止**:`PrincipalActionProposal → Growth DB`(直写)。**禁止**:AI 自由生成新的 GrowthAction/Intervention/Priority。

## 2. 第一版范围(克制)
- 仅围绕已验证确定性干预 **`LISTEN_BEFORE_RESPOND`**。
- 法咪莉校长可提出"今晚先听完再回应"的 proposal;用户接受后,系统调用**既有** Family Named Action(如 `StartIntervention` → Today `GrowthAction` → `CompleteGrowthAction`),不新增语义。

## 3. PrincipalActionProposal 冻结字段
```
proposal_id
principal_response_id            # 来源 L3 PrincipalResponse
family_id
subject_id
proposal_type                    # e.g. RECOMMEND_INTERVENTION
recommended_intervention_id      # 必须指向既有已批准 Intervention(如 LISTEN_BEFORE_RESPOND)
display_title
display_instruction
rationale
method_refs                      # REVIEWED_METHOD_CARDS 引用
risk_route                       # NORMAL | REVIEW | HIGH_RISK
expires_at
canonical = false                # 硬编码:proposal 永远不是 canonical
```

## 4. 接受(accept)操作契约
必须携带:
```
actor
idempotency_key
correlation_id
explicit_confirmation = true     # 无显式确认不得应用
```
应用时:映射 `recommended_intervention_id` → 既有 Named Action;沿用 M2 写入参考模式(DTO校验→权限/前置→幂等→PG事务→Audit→Outbox)。

## 5. 不变量
```
HIGH_RISK  → action bridge FORBIDDEN(不产出可接受 proposal,转 human handoff)
proposal.canonical           = false
accept 无 explicit_confirmation → REJECT
recommended_intervention_id ∉ 既有已批准 Intervention → REJECT
bridge 只能调用既有 Named Action,不得新增/旁路
```

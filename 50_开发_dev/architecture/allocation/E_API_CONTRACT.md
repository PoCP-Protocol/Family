# E · API CONTRACT —— Allocation V1(设计,未实现)

```text
RULING = FAMILY-ALLOCATION-V1-001 §3–9,§15,§17–18
认证:全部经 FamilyPlatformAuthGuard(Bearer/cookie → Account → ACTIVE membership → family scope);消费端不传 UUID。
消费端【不暴露】NeedSignal/Intent/Candidate/Case/Cluster 术语(见 F)。
```

## 消费端(家庭)
```text
POST /families/:familyId/needs
  body: { text }                          // 家长自述("孩子刚摔门…")
  → { need_signal_id, inferred_need_type, restate }  // 复述供确认;NON_CANONICAL

POST /families/:familyId/service-intents
  body: { need_signal_id?, need_type, goal_text }    // 家长确认服务请求
  → { intent_id, status:'OPEN' }

GET  /families/:familyId/service-intents/:intentId/next-best-help
  → { recommended: Reco, alternatives: Reco[≤2] }    // 可解释规则;可能 recommended.type='NO_ACTION'
  Reco = { candidate_id, type, why_this, why_now, limitations }

POST /families/:familyId/service-cases
  body: { intent_id, candidate_id }        // 家庭【显式选择】才创建 case
  → { case_id, status:'OPEN' }             // 未选择绝不自动创建

GET  /families/:familyId/service-cases/:caseId   → 服务进展(家庭视角文案)
POST /families/:familyId/service-cases/:caseId/followup  body:{ did, note } → { ok }
```

## 交付内(复用既有,不新建)
```text
AI_COACH → 既有 POST /families/:familyId/principal/sessions/:sid/messages(Principal;NORMAL 仍须家庭确认 proposal)
REVIEW/HIGH_RISK → 既有 Human Gate(W2R-105)+ ServiceCase ESCALATED
```

## 服务端(真人工作台,最小,见 F/§16)
```text
GET  /ops/service-cases?bucket=OPEN|IN_PROGRESS|WAITING_FAMILY|ESCALATED|AGING   (认证身份 + 角色授权)
POST /ops/service-cases/:caseId/accept | wait | escalate | complete
  → 每次动作写 ServiceContribution(role/task/quality);不结算
```

## 需求聚合(prep only)
```text
GET /demand/clusters   → [{ age_band, need_type, scenario, count, time_window }]  // 匿名+阈值;count<阈值不暴露;无 provider marketplace UI
```

## 遥测(§17,不优化时长)
```text
事件:need_expressed · intent_confirmed · recommendation_shown · recommendation_accepted · alternative_selected
     · recommendation_dismissed · service_case_opened · service_started · service_completed · followup_completed
     · context_reused · human_escalated
```

## 指标读模型(§18,禁 score)
```text
TIME_TO_USEFUL_HELP · MATCH_ACCEPTANCE_RATE · SERVICE_COMPLETION_RATE · FOLLOW_UP_RATE · CONTEXT_REUSE_RATE · REPEAT_EXPLANATION_REDUCTION
```

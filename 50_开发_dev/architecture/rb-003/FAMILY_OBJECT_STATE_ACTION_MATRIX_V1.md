# FAMILY_OBJECT_STATE_ACTION_MATRIX_V1 — M3-RB-003

每个 canonical Object:Owner / State / 合法 Named Action / 合法 Actor / 前置 / 事件 / 审计 / **AI 可否直改**。
末列对所有 canonical growth truth 恒为 **NO**(AI 只能提议,经 Human Gate → Named Action)。

| Object | Owner | States | Allowed Named Action | Allowed Actor | Precondition | Emitted Event | Audit | AI direct mutation |
|---|---|---|---|---|---|---|---|---|
| Family | FamilyCore | ACTIVE/INACTIVE/ARCHIVED | CreateFamily | 认证家长 | — | FamilyCreated | ✓ | **NO** |
| Person(Child/Parent) | FamilyCore | — | AddChild / AddParent / CreateFamilyRelationship | 有 family-manage 权限 actor | family 存在 | ChildAdded… | ✓ | **NO** |
| LifeStageAssignment | FamilyCore | effective | AssignLifeStage | 同上 | child 存在;**不由 birth_date 自动推** | LifeStageAssigned | ✓ | **NO** |
| Consent | FamilyCore | GRANTED/WITHDRAWN/EXPIRED | GrantConsent / (撤回) | 监护人 | purpose 明确,无 broad | ConsentGranted | ✓ | **NO** |
| GrowthProfile | GrowthOS | WORKING(confirmed_at) | ConfirmGrowthProfile | 授权 actor | 证据合成完成 | GrowthProfileConfirmed | ✓ | **NO** |
| GrowthPriority | GrowthOS | ACTIVE/SUPERSEDED | ConfirmGrowthPriority | 授权 actor | profile WORKING+confirmed | GrowthPriorityConfirmed | ✓ | **NO** |
| InterventionEpisode | GrowthOS | ACTIVE/… | StartIntervention | family-manage actor | ACTIVE R03 priority + 三项 consent + NORMAL safety + 无活动 episode | InterventionStarted | ✓ | **NO** |
| GrowthAction | GrowthOS | PENDING/COMPLETED/… | CompleteGrowthAction | 授权 actor | 属活动 episode | GrowthActionCompleted | ✓ | **NO** |
| OutcomeObservation/GrowthReview | GrowthOS | — | (观察/复盘 Named Action) | 授权 actor | 周期满足 | … | ✓ | **NO** |
| PrincipalActionProposal | Principal | PROPOSED/ACCEPTED | (accept→StartIntervention) | 家长确认 | risk=NORMAL;canonical=false | principal_proposal_accepted | ProductEvent | **NO(本就非 canonical)** |
| PrincipalSession/Message/Response/ModelRun/Attempt/Handoff | Principal | — | (Principal 域写) | actor/系统 | — | ProductEvent | 部分 | **N/A(非 growth canonical)** |
| IdentitySession | Identity | active/revoked/expired | (issue/revoke) | 内部签发/验证器 | person∈family | — | — | **NO** |

## 冻结原则
```
AI 可判断(AI_INFERENCE)、可建议(PROPOSAL),但对上述任一 canonical Object 的直接写 = NO。
家庭真实变化只能由 Named Action 造成,并由 Action → Observation → Review 证明。
```

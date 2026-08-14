# FAMILY_OBJECT_UNIVERSE_V1 — M3-RB-003

从业务世界(非数据库表)反向抽象已有真实代码(迁移 0001–0016 + 各模块)。

基础模型:
```
Family World = Object + Attribute Tree + Relation + State + Event + Rule + Named Action + Evidence
```

## 五类对象

### A. Entity Objects(客观存在主体)
| Object | canonical source | Owner |
|---|---|---|
| Family | families | FamilyCore |
| Person | persons | FamilyCore |
| Parent(Person.type=PARENT,parent_role) | persons | FamilyCore |
| Child(Person.type=CHILD) | persons | FamilyCore |

### B. Growth Domain Objects(家庭成长世界,Owner=GrowthOS)
```
GrowthProfile / GrowthDimension(P03/R03…) / GrowthPriority / Intervention / InterventionEpisode
GrowthAction / Perspective / FamilyEvidenceRecord / Reflection / OutcomeObservation
GrowthReview / NextStepDecision / TimelineEntry
```
canonical: growth_profiles / growth_priorities / intervention_episodes / growth_actions / perspectives / evidence_records / outcomes / growth_reviews / next_step_decisions …

### C. Knowledge Objects(知识世界,Owner=Knowledge;循证)
```
Theory / Construct / Program / Method / Modality / ResearchEvidence / Source
```
现状:多为设计资产/未落 runtime(见 CAPABILITY_TRUTH:FUTURE/待循证)。GrowthDimension **GROUNDED_IN** Construct(非复制字段,解 B4)。

### D. Intelligence Objects(AI 工作对象,Owner=Principal;**非 canonical**)
```
PrincipalSession / PrincipalMessage / PrincipalUnderstanding(V2 新增) / PrincipalResponse
PrincipalActionProposal(canonical=false)/ PrincipalModelRun / PrincipalModelAttempt / HumanHandoff
```
canonical source: principal_sessions / principal_messages / principal_responses / principal_action_proposals / principal_model_runs / principal_model_attempts / principal_human_handoffs。
**truth_type = AI_INFERENCE / PROPOSAL**;与 Family canonical 世界 SEPARATE BUT CONNECTED(只经 Human Gate → Named Action 连接)。

### E. Product Objects(消费者产品世界,Owner=Product)
```
WafTopic / Challenge / ChallengeParticipation / ProductEvent / ConsumerSession / ReturnEvent
```
canonical/来源: product_events(已落);其余多为消费端原型状态(waf.js)。

### F. Identity Objects(IAM,Owner=Identity;RB-003 新纳入对象世界)
```
IdentitySession(identity_sessions)/ OtpChallenge(otp_challenges)/ Actor(=已认证 Person)
FamilyMembership(persons.family_id)/ AuthorizationRelation / ConsentRelation(consents)
```

## 核心不变量(冻结)
```
AI_INFERENCE  != FACT
AI_HYPOTHESIS != GROWTH_STATE
AI_PROPOSAL   != GROWTH_ACTION
Intelligence(D)与 Growth canonical(B)SEPARATE BUT CONNECTED
唯一改 canonical 的合法路径 = Named Action(见 STATE_ACTION_MATRIX)
```

## 边界
本表是**架构语言/对象语义视图**,不是新平台工程:不建 Generic Object Engine / Graph DB / Knowledge Graph 平台(§28)。Attribute Tree 见 ATTRIBUTE_TREE_STANDARD_V1;关系见 RELATION_GRAPH_V1;状态/动作/Owner 见 STATE_ACTION_MATRIX_V1。

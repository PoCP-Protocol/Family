# FAMILY_OBJECT_RELATION_GRAPH_V1 — M3-RB-003

对象间关系(动态可扩展:新关系 = 注册一条边声明,见 [[FAMILY_SKILL_MODEL_V1]] Object-Skill.relations)。

## 核心边
```
Parent            ──PARENT_OF──>        Child
Person            ──IN_FAMILY──>        Family
GrowthPriority    ──TARGETS──>          GrowthDimension
Intervention      ──ADDRESSES──>        GrowthPriority
InterventionEpisode──INSTANCE_OF──>     Intervention
GrowthAction      ──GENERATED_BY──>     InterventionEpisode
OutcomeObservation──OBSERVES──>         GrowthAction
Perspective       ──ABOUT──>            Child
FamilyEvidenceRecord──DERIVED_FROM──>   Perspective
TimelineEntry     ──RECORDS──>          (GrowthAction|Review|Episode)
```

## 知识 grounding(解 B4:维度≠构念,不复制字段,而是引用)
```
GrowthDimension   ──GROUNDED_IN──>      Construct
Method            ──GROUNDED_IN──>      Theory
Method            ──TARGETS──>          Construct
Method            ──USES──>             Modality
Program           ──COMPOSES──>         Method
ResearchEvidence  ──SUPPORTS(NON_DECISIVE)──> (Theory|Method)
```
`GrowthDimension != Construct`;只建 GROUNDED_IN 边,不搬字段。

## 智能↔canonical(SEPARATE BUT CONNECTED)
```
PrincipalSession      ──FOR_FAMILY──>       Family
PrincipalUnderstanding──INTERPRETS──>       PrincipalMessage      [AI_INFERENCE]
PrincipalActionProposal──RECOMMENDS──>      Intervention           [PROPOSAL, canonical=false]
PrincipalActionProposal══(Human Confirm)══> StartIntervention(Named Action) ──creates──> InterventionEpisode
PrincipalModelRun     ──HAS_ATTEMPT──>      PrincipalModelAttempt
```
唯一从 AI 世界连到 canonical 的边 = 经 **Human Gate → Named Action**(粗线),别无旁路。

## 身份/授权/consent(IAM 纳入)
```
Actor(认证Person)──AUTHENTICATED_BY──> IdentitySession
IdentitySession   ──BOUND_TO──>         Person ──IN_FAMILY──> Family   (家庭隔离)
ConsentRelation   ──GRANTS──>           (purpose: AI_PERSONALIZATION…) ──FOR──> Child
```

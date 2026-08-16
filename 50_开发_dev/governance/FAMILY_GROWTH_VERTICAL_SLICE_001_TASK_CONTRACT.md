# FAMILY-GROWTH-VERTICAL-SLICE-001 任务契约

**状态：** INTERNAL_DEVELOPMENT_AUTHORIZED  
**授权登记：** `governance/AUTHORIZATION_REGISTRY.yaml#FAMILY_GROWTH_VERTICAL_SLICE_001`  
**授权边界：** 仅代码开发与确定性内部验证；外部真实模型、试点、生产、支付、分佣、市场撮合、ML 排序、诊断、Assessment、Enrollment/Delivery Runtime 均未授权。  
**架构依据：** `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md` §§1–18。

## 目标

以一个受限、可审计且不承诺成长结果的用户价值路径，验证 Family V3 的首条服务闭环：12–15 岁亲子沟通冲突中，家长表达“孩子刚摔门，我今晚不知道怎么重新开口”，系统在家庭主权、安全、资格门禁和明确决定下，组织一次低风险帮助、回访及后续上下文复用。

## 必须交付的主链

```text
HOME
→ GrowthNeedSignal（非 canonical）
→ 家长显式确认 GrowthIntent
→ DE_ESCALATION + COMMUNICATION_REOPENING
→ 原子 Candidate ResourceOffer
→ Eligibility @T1（fail closed）
→ 确定性 ResourceRecommendation
→ FamilyServiceDecision
→ 声明式 OrchestrationPlan
→ Eligibility @T2（fail closed）
→ ServiceCase
→ 确定性内部 AI_COACH / approved-content PRACTICE
→ FollowUpResponse（非 Growth truth）
→ ContextReuseProjection（只读、非因果）
```

## 必须实现的安全桥接

| 桥接 | 完成条件 |
|---|---|
| Principal Consumer Auth Bridge | V3 消费路径只信任 `Account → ACTIVE account_person_binding → ACTIVE family_membership → role → family scope`；拒绝 `x-actor-id` 作为唯一身份来源。Reviewer/Internal Ops 身份面保持独立。 |
| Growth Mutator Permission Bridge | `InterventionService`、`GrowthReviewService` 等路径不再以历史 `CreateFamily` audit_log 作为当前授权；改用可信家庭上下文与显式 role→NamedAction 矩阵，并保留同意、安全、主体和领域守卫。 |
| 资格双检 | T1 推荐时和 T2 执行时分别检查 consent、safety、age/scope、availability、provider qualification；T2 失败时不得静默替换资源。 |
| 真相隔离 | Recommendation、Decision、Plan、ServiceCase、FollowUpResponse、Observation、ContextReuse 均不能越层写入；服务层不直接写 Growth Observation。 |

## 允许的最小资源集

`NO_ACTION`、确定性内部 `AI_COACH`、具有 approved content ref 的 `PRACTICE`、`EXTERNAL_REFERRAL`。`PROGRAM` 仅保留为条件化资源类型，不创建 Enrollment/Delivery runtime。

## 禁止项

不得复用 `GrowthOnboarding`、`GrowthPriority`、`InterventionEpisode` 或 `PrincipalProposal` 伪装 V3 对象；不得新建支付、订单、会员权益、市场、分佣或商业排序；不得做心理/医疗/发展诊断、结果保证、儿童评分或模型主导资源选择；不得启用真实外部模型或真实家庭试点。

## 最小数据与模块边界

新 V3 运行时在 `apps/api/src/modules/orchestration/`；新运行时契约在 `packages/contracts` 的独立 orchestration section；首个迁移仅可为 `0020_growth_orchestration_v1.sql`。不得将新对象写入 `growth_onboardings`、`growth_priorities`、`intervention_episodes`，也不得将 OrchestrationModule 塞入 FamilyService。

## 通过条件

- 全工作区 build、typecheck、既有单元测试通过。
- 新纵切单元、API、真实 PostgreSQL HTTP E2E（如环境可用）覆盖主链与失败关闭路径。
- 覆盖 valid owner/guardian、wrong family、non-member、revoked membership、revoked binding、expired/revoked session、x-actor-only V3 consumer、child forbidden action、adult limited action。
- 覆盖 T1/T2 eligibility 变化、Decision 不可绕过、无 approved content 时 Practice 不执行、FollowUpResponse 不直写 Observation、Context reuse 不生成因果断言。
- 静态契约、危险授权扫描、依赖审计和 CI 通过。

## 参考

- `architecture/FAMILY_PLATFORM_V3_BLUEPRINT.md`
- `architecture/orchestration/FAMILY_GROWTH_ORCHESTRATION_ARCH_V1.md`
- `governance/AUTHORIZATION_REGISTRY.yaml`
- `governance/FAMILY_循证服务与儿童AI产品原则_V1.md`（待正式吸收时须注明研究来源与适用范围）

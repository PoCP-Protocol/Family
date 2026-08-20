# UI-33 Phase C Pre-API Gate 001

## Research/Needs summary

UI-33 是家庭档案、成员身份和敏感成长资料管理的场景。Broad Research 必须覆盖家长、孩子、教师/顾问、运营、客服和系统在家庭成员、身份、监护、隐私、Consent、资料修正、导出和删除方面的真实需求，并核对 UI-33 基线、Family、Person、GrowthProfile、ConsentGrant、AccessPolicy 和 HumanGate 来源。Needs Analysis 分别覆盖 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家、榜样教育和波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 `FamilyProjection`、`PersonProjection`、`RoleMembershipProjection`、`GrowthProfileProjection`、`ConsentGrant`、`AccessPolicy`、`ProfileCorrectionDraft`、`ExportRequestDraft`、`DeletionRequestDraft`、`HumanGateReview` 和 `AuditEvent`。页面只读授权家庭范围内资料；儿童敏感数据、身份和监护关系不能由 AI 或自由文本直接创建或修改。不得把 Profile、Perspective 或 Hypothesis 变成诊断、效果事实、总分或排名。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/family-profile-reference-542x1002.png`，核对家庭头像/成员、身份关系、资料卡、隐私与 Consent 入口、编辑/纠错/导出/删除热点、空态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于身份、监护、Consent 或资料准确性已确认，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`FamilyProjection`、`PersonProjection`、`RoleMembershipProjection`、`GrowthProfileProjection`、`ConsentGrant`、`AccessPolicy`、`ProfileCorrectionDraft`、`ExportRequestDraft`、`DeletionRequestDraft`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

家庭、成员、角色和成长资料只读 projection；编辑、纠错、授权、撤回、导出和删除最多形成 Controlled Draft。正式写入身份/关系、Consent 变更、导出、删除、通知或跨系统同步必须通过 Named Action、Human Gate、Audit、幂等及 Ontology/外部 Adapter，本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童敏感数据、监护关系、身份资料、跨成员可见性、导出和删除必须有明确授权主体、Consent purpose、撤回和 Human Gate。AI 只能经 Model Gateway 做字段解释或纠错草稿，不得直写 Family、Person、GrowthProfile、Consent 或 AccessPolicy ontology；Ontology Adapter 只接收批准动作，DEV no-op。

## Backend/API dependency candidates

候选 `FamilyProfileProjectionService`、`PersonProjectionService`、`RoleMembershipPolicy`、`GrowthProfileProjectionService`、`ConsentPolicy`、`ProfileCorrectionBoundary`、`ExportRequestBoundary`、`DeletionRequestBoundary`、`HumanGateReviewService`、`NotificationAdapter`、`OntologyAdapter`、`AuditService` 和 `ModelGatewayAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. Family、Person、RoleMembership 和 GrowthProfile 的权威来源、身份校验和版本规则是什么？
2. 儿童、监护人和家庭成员的可见性、Consent purpose、撤回、纠错和删除如何定义？
3. 编辑身份/关系、导出、删除和跨系统同步哪些步骤必须 Human Gate？
4. AI 纠错草稿如何避免直接写核心 ontology，且确保 Adapter、Audit、幂等和 no-op？

## Required tests/screenshot diff preparation

准备成员/角色越权、儿童敏感字段、Consent 缺失/撤回、身份冲突、纠错/导出/删除草稿、重复提交、Human Gate、Audit、外部同步 no-op，以及档案/空/错误/权限/HOLD 截图与基线 diff。

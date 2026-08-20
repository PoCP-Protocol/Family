# UI-15 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-15 是邀请有礼/成长激励页面。本文件只做 Research、Needs Analysis、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation、视觉修复或动态代码开发。

## Research/Needs Summary

研究家庭如何在不制造拉人压力、商业误导或儿童外发风险的前提下理解邀请规则、奖励条件和权益边界；角色包括家长、孩子、邀请对象、运营、服务者和 AI；baseline 为 `apps/web/public/bangyang-reference/ui18/commerce-03-invite.png`。候选 SSOT 包括 FamilyContext、InviteCampaign、Invitee、RewardRule、EntitlementProjection、ConsentGrant、HumanGateReview、NotificationRequest、AbuseReview。Needs 必须拆分 User/Business/Operational/Compliance/Data/AI Need；邀请建议不等于邀请决定，展示奖励不等于奖励事实。

30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input，不能自证效果、奖励公平、资质或商业结果。

## BA Design Summary

页面目标是展示邀请活动规则、适用条件、奖励状态、隐私提示和受控草稿入口。候选对象包括 InviteCampaign、Invitee、RewardRule、InviteDraft、ConsentGrant、EntitlementProjection、NotificationRequest、HumanGateReview、AbuseReview。首轮仅允许 Read Projection/Controlled Draft；真实邀请外发、通知、奖励发放、权益变更和反滥用处置全部 External Effect/Human Gate HOLD。

## Visual Fidelity Brief Summary

需对标 UI-15 原图的邀请 banner、规则说明、邀请码/入口、奖励卡、状态文案、复制/分享按钮、空态/权限态和移动端间距。复制/分享按钮只能作为静态 HOLD 入口，当前无开发后运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`InviteCampaign`、`Invitee`、`RewardRule`、`InviteDraft`、`ConsentGrant`、`EntitlementProjection`、`NotificationRequest`、`HumanGateReview`、`AbuseReview`、`AuditEvent`。奖励条件与发放结果必须分开，不能由推荐或客户端字段直接写 Entitlement。

## Read Projection vs Named Action Boundary

活动规则、个人邀请状态和奖励条件是 Read Projection；复制邀请码/编辑邀请草稿最多是 Controlled Draft；确认邀请、外发分享、通知、奖励发放、权益变更和申诉处置必须通过 Named Action、Consent、Audit、Notification/Share/Commerce Adapter，并经 Human Gate 或反滥用策略。

## Consent/Human Gate/Model Gateway/Ontology Adapter Boundary

邀请对象和儿童相关数据需要明确 Consent、可见性、撤回和最小化；公开外发、奖励争议、儿童参与和反滥用风险需 Human Gate。AI 只能经 Model Gateway 解释规则或生成草稿，不写 Invitee/Reward/Entitlement；Ontology Adapter 只接收批准动作。Notification、Share、Payment/Entitlement adapters 全部 External Effect HOLD。

## Backend/API Dependency Candidates

候选：`InviteCampaignProjectionService`、`RewardRuleProjectionService`、`InviteDraftBoundary`、`ConsentPolicy`、`AbuseReviewService`、`HumanGateReviewService`、NotificationAdapter、ShareAdapter、EntitlementAdapter、AuditService、ModelGatewayAdapter、OntologyAdapter。仅列候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 邀请活动、邀请对象、奖励规则和权益的 authoritative source 是什么？
2. 复制/分享/发送邀请是否分别建模为不同 Named Action？
3. 邀请对象的 Consent、隐私、儿童保护和撤回如何处理？
4. 奖励条件满足与奖励实际发放如何分离并审计？
5. Notification/Share/Entitlement adapter 的 no-op 与生产边界如何确认？
6. 反滥用、重复邀请、虚假账号和奖励争议谁负责 Human Gate？
7. AI 解释规则如何避免暗示收益承诺或直接批准发奖？

## Required Tests/Screenshot Diff Preparation

需准备 campaign/rule provenance、邀请对象 scope、Consent 缺失、重复邀请/反滥用、奖励条件与发放分离、无通知/分享/权益外发副作用、Named Action 幂等和 audit、Model Gateway schema rejection、API/Web contract、Playwright mobile/desktop 与规则/空/权限/HOLD 状态截图准备。当前无运行截图。

## Status

`HOLD_EXTERNAL_EFFECT`；本文件不授权 API Contract 或代码开发。

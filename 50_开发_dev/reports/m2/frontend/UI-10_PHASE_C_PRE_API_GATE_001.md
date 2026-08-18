# UI-10 Phase C Pre-API Gate 001

## Scope and Gate Rule

UI-10 是成长小助手/儿童助手页。本文件只做研究、需求、BA、视觉和架构门禁准备，不定义 API Contract，不进入 FE/BE Implementation 或动态代码开发。由于涉及未成年人、AI 交互和可能的敏感内容，默认保持 Human Gate/NO_GO。

## Research/Needs Summary

研究家庭教育场景中家长和孩子如何获得适龄、可解释、可退出的辅助；家长、孩子、老师/教练、顾问、运营和系统/AI 的权责；UI-10 原图 `apps/web/public/bangyang-reference/ui18/growth-04-child-assistant.png`；Family/Person/ChildGrowthProfile/AssistantSession/Consent/HumanGate/Evidence 的 SSOT；Model Gateway、Agent Runtime、Ontology Adapter、审计和前后端一致性。Needs Analysis：User Need 是安全获得说明、提醒和反思提示；Business Need 是受控的成长辅助而非自治代理；Operational Need 是会话、可见性、版本、退出和复核；Compliance Need 是未成年人、监护授权、敏感主题、保留期限和 Human Gate；Data Need 是 AssistantSession、Input、Draft、Evidence、Consent；AI Need 是受限 schema 的解释/草稿/安全停止，不直接写核心 Ontology。

证据边界：30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，只作为 Hypothesis/Design Input，不能证明 AI 或教育效果。

## BA Design Summary

页面目标是提供适龄辅助入口、当前上下文摘要、文本/语音等输入边界、解释/建议草稿和退出/求助入口。候选对象包括 FamilyContext、Person、ChildGrowthProfile、AssistantSession、AssistantInput、AssistantDraft、Evidence、ConsentGrant、HumanGateReview、ModelGatewayTrace。首轮只允许受控 Read Projection 或 Controlled Draft；不得把助手回答写为 Fact、Need、Diagnosis、Plan、Task 或 Outcome。

## Visual Fidelity Brief Summary

Baseline：`apps/web/public/bangyang-reference/ui18/growth-04-child-assistant.png`。需核对顶部导航、助手头像/标题、上下文卡、输入区、发送/返回/退出、提示文案、风险/求助区、loading/empty/error/permission 和移动端尺寸。当前无开发后运行截图，不伪造视觉差异。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object Model Candidates

`FamilyContext`、`Person`、`ChildGrowthProfile`、`AssistantSession`、`AssistantInput`、`AssistantDraft`、`Evidence`、`ConsentGrant`、`HumanGateReview`、`ModelGatewayTrace`。任何 AI 输出默认是 Perspective/Hypothesis/Recommendation 或 Controlled Draft，不是核心事实。

## Read Projection vs Named Action Boundary

助手入口、会话状态和安全提示使用 Read Projection。发送输入、保存草稿、请求人工帮助、撤回会话和删除内容需分别评估 Named Action；儿童本人不得绕过 guardian scope。AI 不创建 Plan、Task、Intervention、Outcome、ServiceCase 或 Notification；外部联系、真人服务和公开分享保持 HOLD。

## Consent / Human Gate / Model Gateway / Ontology Adapter Boundary

儿童/监护人 Consent purpose、可见范围、年龄/主体和保留期限必须先确定；敏感情绪、自伤、虐待、医疗、家庭冲突或高风险建议一律 Human Gate/安全停止。所有模型调用经 Model Gateway、模型白名单、schema validation、prompt/data policy、audit 和拒答策略；Agent 不能直接写 Ontology，核心状态经 Ontology Adapter 和 Named Action。

## Backend/API Dependency Candidates

候选共享能力：`AssistantSessionProjectionService`、`ModelGatewayOrchestration`、`MinorSafetyPolicy`、`Consent/GuardianAuthorizationPolicy`、`HumanGateReviewService`、`AssistantDraftBoundary`、`AuditService`、`OntologyAdapter`。仅列候选，不定义 API Contract。

## Architect Review Verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. UI-10 的 canonical 使用者是家长、孩子还是共同使用，如何区分？
2. Guardian Consent、child assent、可见性和会话保留策略如何定义？
3. 哪些主题必须 Human Gate，安全停止后如何呈现原页面骨架？
4. Model Gateway 是否允许文本、语音、图片或视频输入，数据如何最小化？
5. AssistantDraft 是否允许保存，何时可被人工或家庭确认？
6. 是否存在 Agent Runtime；若存在，其工具、权限和 Ontology 写入边界是什么？
7. “智能提醒/成长建议”如何禁止变成诊断、任务或干预事实？
8. 人工帮助、通知、真人联系、分享和外部 effect 的授权流程是什么？
9. UI 文案和拟人化表达如何避免暗示真实专家、保证或治疗效果？

## Required Tests/Screenshot Diff Preparation

需准备 guardian/child scope、Consent 缺失/撤回、敏感主题、prompt injection、模型 schema rejection、低置信度、人工升级、安全停止、会话删除/保留、无核心 Ontology 写入、no external effect、API/Web contract、Playwright desktop/mobile 和 static/loading/empty/error/permission/human-gate 状态截图准备。当前无运行截图，不进行视觉差异声明。

## Status

`HOLD_HUMAN_GATE`；本文件不授权 API Contract 或代码开发。

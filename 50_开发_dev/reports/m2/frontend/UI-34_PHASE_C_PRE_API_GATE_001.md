# UI-34 Phase C Pre-API Gate 001

## Research/Needs summary

UI-34 是家庭查看服务记录、过程证据和相关结果叙述的场景。Broad Research 必须覆盖家长、孩子、教师/服务者、顾问、运营和客服在服务过程记录、来源、纠错、隐私、导出、通知和结果解释方面的真实需求，并核对 UI-34 基线、ServiceRecord、Booking、ServiceCase、Outcome、Evidence、Consent 和 Audit 来源。Needs Analysis 分别覆盖 User、Business、Operational、Compliance、Data、AI Need。30_素材_materials 只读，优先逐页提取文本，不使用 `all_materials.txt`；自家、榜样教育和波波校长材料最高 E1，仅作 Hypothesis/Design Input，不能自证效果、诊断、资质或因果关系。

## BA Design summary

候选对象为 `ServiceRecordProjection`、`ServiceCaseProjection`、`BookingProjection`、`EvidenceProjection`、`OutcomeProjection`、`Perspective`、`CorrectionRequestDraft`、`ExportRequestDraft`、`ConsentGrant`、`HumanGateReview` 和 `AuditEvent`。过程记录、用户观点和证据投影必须与 Outcome、诊断、因果和效果事实分离；服务者或 AI 不能凭自由文本直接写入核心记录。不得生成家庭总分或排名。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/service-records-reference-566x1008.png`，核对导航、服务记录列表/详情、时间、服务者、证据/备注、纠错/反馈/导出热点、状态标签、空态、错误态、权限态、文案、颜色、间距和移动端尺寸。视觉复刻不等于服务结果已验证或记录无争议，当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Object model candidates

`ServiceRecordProjection`、`ServiceCaseProjection`、`BookingProjection`、`EvidenceProjection`、`OutcomeProjection`、`Perspective`、`CorrectionRequestDraft`、`ExportRequestDraft`、`ConsentGrant`、`HumanGateReview`、`AuditEvent`。

## Read Projection vs Named Action boundary

ServiceRecord、ServiceCase、Booking、Evidence 和 Outcome 只读 projection；纠错、补充说明、异议和导出最多形成 Controlled Draft。正式修改记录、确认结果、通知、导出、分享、退款或外部服务均需 Named Action、Consent、Human Gate、Audit、幂等和 Adapter，本阶段 HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童服务记录、家庭成员可见范围、敏感证据、纠错、导出和外部分享需要 Consent purpose 与 Human Gate。AI 只能经 Model Gateway 生成摘要、差异提示或纠错草稿，不得直接写 ServiceRecord、Outcome、Evidence 或 Consent ontology；Ontology Adapter 只接收批准动作，DEV no-op。

## Backend/API dependency candidates

候选 `ServiceRecordsProjectionService`、`ServiceCaseProjectionService`、`EvidenceLineageService`、`OutcomeProjectionService`、`CorrectionRequestBoundary`、`ExportRequestBoundary`、`ConsentPolicy`、`HumanGateReviewService`、`NotificationAdapter`、`ShareAdapter`、`AuditService`、`ModelGatewayAdapter` 和 `OntologyAdapter`；仅列候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. ServiceRecord、ServiceCase、Booking、Evidence 和 Outcome 的来源、版本、时间和纠错机制是什么？
2. 如何明确过程记录、用户观点、证据投影与效果/诊断/因果结论的边界？
3. 儿童记录、跨成员可见性、导出、分享和通知需要哪些 Consent/Human Gate？
4. 纠错、确认、导出、分享和外部服务如何由 Named Action、Adapter、Audit、幂等和 DEV no-op 控制？

## Required tests/screenshot diff preparation

准备来源缺失/冲突、记录与 Outcome 分离、儿童敏感信息、Consent 缺失/撤回、纠错/导出草稿、重复提交、AI 不写 ontology、外部 Adapter no-op、Human Gate、Audit，以及记录/空/错误/权限/HOLD 截图与基线 diff。

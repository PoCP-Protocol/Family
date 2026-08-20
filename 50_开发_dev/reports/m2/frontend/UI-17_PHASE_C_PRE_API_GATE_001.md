# UI-17 Phase C Pre-API Gate 001

## Research/Needs summary

UI-17 为积分任务/成长积分场景。研究积分是否表达过程参与、如何避免把积分变成家庭总分或儿童价值判断，以及任务事件、规则来源和权益兑现边界。角色包括家长、孩子、运营、服务者和系统/AI。需求拆分为 User、Business、Operational、Compliance、Data、AI Need；30_素材_materials 只读，优先逐页提取文本，不使用 all_materials.txt；自家/榜样教育/波波校长材料最高 E1，仅作 Hypothesis/Design Input。

## BA Design summary

候选对象为 FamilyContext、Person、GrowthTask、TaskEvent、PointRule、PointLedgerProjection、EntitlementProjection、ConsentGrant、HumanGateReview。积分是规则投影，不是诊断、排名或事实化成长结果；Recommendation != Decision != Action。

## Visual Fidelity Brief summary

对标 `apps/web/public/bangyang-reference/ui18/commerce-05-points-task.png` 的积分标题、任务列表、状态标签、进度、规则说明、权益入口、空态/权限态和移动端间距。当前不伪造运行截图。

```text
RUNTIME_SCREENSHOT_READY=NO
PIXEL_DIFF_READY=NO
```

## Read Projection vs Named Action boundary

积分余额、任务条件、事件历史和规则说明是 Read Projection；完成任务的事实必须来自受控 Task Event/Named Action，不能由页面输入或 AI 文本直接写入；兑换、权益变更、通知和外部使用必须另行 Named Action、Consent、Audit 和 Adapter，External Effect HOLD。

## Consent/Human Gate/Model Gateway/Ontology Adapter boundary

儿童任务与家庭成员数据需 Consent；敏感任务、奖励争议和异常积分需 Human Gate。AI 只能经 Model Gateway 解释规则或生成复盘草稿，不写 TaskEvent/PointLedger/Entitlement；Ontology Adapter 只接收批准事件。

## Backend/API dependency candidates

候选 `PointRuleProjectionService`、`TaskEventProjectionService`、`PointLedgerReadModel`、`EntitlementProjectionService`、`ConsentPolicy`、`HumanGateReviewService`、`NotificationAdapter`、`CommerceAdapter`、`AuditService`、ModelGatewayAdapter、OntologyAdapter；仅候选，不定义 API Contract。

## Architect Review verdict

```text
ARCHITECT_REVIEW_VERDICT=NO_GO_WITH_BLOCKERS
API_CONTRACT_ALLOWED=NO
CODE_ALLOWED=NO
```

## Blocking Questions

1. 积分规则、事件和账本的 authoritative source 是什么？
2. 完成任务如何由 Named Action 产生，如何防重复和回滚？
3. 积分是否允许跨家庭、跨孩子比较？默认应禁止总分/排名。
4. 兑换和权益变更是否需要单独 Consent/Human Gate/Adapter？
5. AI 复盘如何避免把积分解释成效果或诊断事实？

## Required tests/screenshot diff preparation

准备 tenant/family/person scope、事件幂等、规则版本、重复完成、撤回/纠错、总分/排名字段拒绝、儿童 Consent、权益 no-op adapter、Audit、API/Web contract、Playwright mobile/desktop 和任务/空/权限/HOLD 截图准备。

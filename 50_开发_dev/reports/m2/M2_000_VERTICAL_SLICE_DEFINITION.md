# M2-000 Vertical Slice Definition

date: 2026-08-10
status: PASS_V3_0_CONTRACT_GATE
task: M2-000_FIRST_GROWTH_SLICE_DEFINITION_AND_CONTRACT_GATE
implementation_started: NO
ready_for_m2_wave1: YES

## 1. Executive Decision

M2 的第一条真实 Growth Vertical Slice 固定为:

```text
12-15岁青春期家庭 · 亲子沟通冲突
```

M2-000 只定义边界、领域对象、契约缺口、AI 最小路径、Consent/Safety/Human Gate、Outcome 验证计划、Family Web / Responsive Web 用户体验和后续实现 backlog。本版本把 Frontend / UI / UX 升级为与 Growth Domain、AI、数据同级的主开发线,并达到 V3.0 Contract Gate 的实施入口标准。M2-000 不实现 GrowthOnboarding、GrowthProfile、Intervention、GrowthAction、GrowthEvent、Outcome、Model Gateway、Agent Runtime 或前端运行时代码。

## 1.1 AI-00 Required Product Answers

| Question | V3.0 M2-000 Answer |
|---|---|
| 这个家庭为什么进入 Family? | 家庭已在 M1 建立 parent-child 关系、LifeStage 为 `EARLY_ADOLESCENCE_12_15`,并希望围绕亲子沟通冲突获得一个 7 天可实践、可观察、不过度诊断的成长循环。 |
| 用户第一天做什么? | Parent 从 F01 进入 F02,确认场景/关系/Consent,填写 F03 Parent Perspective; Child 在 F04 独立填写 Child Perspective; Parent 查看 F05 Growth Insight 并准备确认 Priority。 |
| 系统第一天知道了什么? | 系统只知道 FamilyAggregate、LifeStage、Consent Snapshot、Parent Perspective、Child Perspective、初始 EvidenceRecord 和安全筛查结果;它还不知道事实真相或长期结论。 |
| Family 什么时候有资格形成 Growth Insight? | 至少存在有效 M1 aggregate、所需 purpose consent、parent/child perspective、可追溯 evidence refs,且 safety gate 未进入 `SAFETY_ESCALATION`。 |
| 什么时候只能说 Perspective? | 所有来自 parent/child/advisor 的主观陈述、自由文本、感受描述和未验证解释都只能标为 Perspective,不能写成 Fact。 |
| 什么时候有 Evidence? | 当信息有明确 source、captured_at、evidence_level、payload boundary,并能被链接到 profile/action/event/outcome 时,才作为 EvidenceRecord 使用。 |
| 什么时候可以形成 Profile? | 只有在 P03/R03/R04/R05 的 evidence refs 足够支撑候选状态,且通过 MEDIUM Human Gate 后,才能形成 limited relationship GrowthProfile。 |
| 谁确认 GrowthPriority? | Parent/Guardian 确认 LOW 风险 priority;存在证据冲突、风险不明或中等风险时由 Growth Advisor Review。AI 只能推荐,不能确认。 |
| 什么时候启动 Intervention? | 确认一个 rank 1 priority 后,系统展示 `INTERVENTION-001 / LISTEN_BEFORE_RESPOND`,Parent 低风险确认后通过 Named Action 分配 7 天 GrowthAction。 |
| 7 天期间用户每天做什么? | Parent 做约 10 分钟自然倾听:不打断、不立即评价、不说教、不马上解决;先复述理解,再问“你希望我只是听,还是一起想办法?”;随后在 F09 check-in。 |
| 系统记录什么? | GrowthAction 状态、reflection、conflict/repair indicators、GrowthEvent、EvidenceRecord、可确认 Milestone、consent/safety/human gate/audit/outbox。 |
| 7 天后如何证明发生了变化? | 只比较窗口内 L1 Behavioral 与 L3 Relationship 的 observed_change、baseline、evidence_refs、confidence 和 confounders,不做因果声称。 |
| 最终用户看到什么? | F11 Growth Review 展示观察到的变化、证据、解释边界、下一步建议;F12 Family AI 只能基于旅程上下文解释,不能替代决定。 |

## 2. Product Slice

目标是在 7-14 天内验证一个家庭是否能围绕亲子沟通冲突产生可观察的成长循环:

```text
Growth Onboarding
-> Perspective
-> Evidence
-> Relationship GrowthProfile
-> GrowthPriority
-> Intervention-001
-> GrowthAction
-> GrowthEvent
-> Milestone
-> Outcome
-> Growth Review
```

## 3. Scope

Included:

- One LifeStage: `EARLY_ADOLESCENCE_12_15`.
- One scenario: `ADOLESCENCE_PARENT_CHILD_COMMUNICATION_CONFLICT_12_15`.
- One relationship context: parent-child.
- Four dimensions only: `P03`, `R03`, `R04`, `R05`.
- One first intervention: `INTERVENTION-001 / LISTEN_BEFORE_RESPOND / 先听后回应`.
- One aggregate source: M1 `GET /families/{familyId}`.
- Consent checks for `SERVICE`, `ASSESSMENT`, `GROWTH_TRACKING`, and `AI_PERSONALIZATION` when AI is used.

Excluded:

- Family Total Score.
- Family ranking.
- Broad 0-18 LifeStage expansion.
- 24 dimensions.
- learning achievement, phone addiction, school refusal, anxiety, depression, school admission, career planning, couple relationship, sibling relationship.
- Autonomous child agent.
- World Model training.
- Reinforcement learning.
- Multi-agent orchestration.
- Direct AI state mutation.

If any excluded topic appears during product discovery or implementation, route it to `DEFER_TO_FUTURE_SLICE` and do not add it to M2 Wave scope.

## 4. Required Preconditions

M2-101 must not start unless all of these are true:

1. M1 Family Core remains green on required gate.
2. Family aggregate has at least one parent/guardian, one child, one relationship, active LifeStage, and active consent records.
3. Consent purposes are explicitly granted before each processing purpose.
4. Safety screening has not returned `SAFETY_ESCALATION`.
5. M2 proposed contracts are promoted or explicitly accepted as implementation-local contracts.
6. Family Web / Responsive Web delivery is treated as a first-class workstream in every M2 wave.
7. F01-F12 screens have implementation-grade state definitions, backend contract mapping, consent/permission/safety states, and browser E2E/demo acceptance criteria.

## 5. First Growth Dimensions

| id | Dimension | M2 Meaning | Observable Direction |
|---|---|---|---|
| P03 | Understanding & Empathic Listening | Parent attempts to understand before responding. | Parent can repeat child concern before advice/judgment. |
| R03 | Communication Quality | Interaction becomes clearer and less escalatory. | Fewer interruptive or accusatory exchanges in logged events. |
| R04 | Conflict Regulation | Family can pause or regulate conflict intensity. | Parent/child can pause, resume, or lower conflict escalation. |
| R05 | Repair | Relationship repair happens after rupture. | Apology, acknowledgement, or agreement occurs after conflict. |

Allowed states:

```text
EMERGING -> DEVELOPING -> PRACTICING -> STABILIZING
```

These states describe observed growth signals. They are not clinical labels and not family rankings.

## 6. Intervention-001

Identifier:

```text
INTERVENTION-001
LISTEN_BEFORE_RESPOND
先听后回应
```

Intent:

- Parent pauses before advice, criticism, or correction.
- Parent first reflects what they heard.
- Child perspective is recorded as Perspective, not Fact.
- Any serious safety signal routes away from normal growth flow.

Minimum action pattern:

```text
When conflict starts, parent asks one clarifying question, reflects the child's concern, then waits before giving advice.
```

## 7. Completion Definition

M2 first slice is complete only when later implementation can show:

1. Onboarding creates an eligible M2 context.
2. Perspective and Evidence are recorded with fact boundary intact.
3. A relationship GrowthProfile exists for exactly four dimensions.
4. At least one GrowthPriority is human-confirmed.
5. `INTERVENTION-001` assigns at least one GrowthAction.
6. GrowthEvents and Milestones are recorded from usage.
7. Outcome is evaluated over a time window.
8. Growth Review explains change without total score or ranking.
9. Consent, Human Gate, and Safety Gate are enforced.
10. Family Web provides a responsive UI path for the same domain flow.
11. Parent can complete onboarding, perspectives, first action, reflection, timeline/review viewing, and journey-scoped AI interactions through UI.
12. Browser E2E/demo evidence exists; backend API tests alone cannot close the slice.

## 8. Frontend / UX First-Class Requirement

M2 is a dual-mainline program:

```text
Growth Domain / Backend / AI
+ Family Web / UX / Frontend
= Real Family Journey
```

M2 Wave closure requires Domain Contract + API + Frontend + E2E + Demo. Backend-only completion is insufficient.

First implementation target is only `Family Web / Responsive Web`. Native App, Mini Program, staff-web, and admin-web remain deferred unless explicitly approved.

Canonical first-slice screens:

```text
F01 Family Home
F02 Growth Onboarding
F03 Parent Perspective
F04 Child Perspective
F05 Growth Insight
F06 Growth Priority
F07 Intervention Detail
F08 Today Growth Action
F09 Action Reflection
F10 Family Timeline
F11 Growth Review
F12 Family AI
```

Family Home must show the family's current growth journey and today's most important action. It must not become a course mall, live-class portal, expert marketplace, activity feed, or membership storefront.

Growth Profile UI must use qualitative state, evidence, observed signals, and recent changes. It must not use Family Total Score, family ranking, percentile comparison, radar score, or education-style performance labels.

## 9. Implementation-Grade Frontend Acceptance

M2-000 frontend planning is accepted only because the required implementation surfaces are now explicit:

| Requirement | Acceptance |
|---|---|
| Screen coverage | F01-F12 each define USER, PURPOSE, INPUT, display/empty/loading/error/permission/consent states, API, domain object, primary action, and next screen. |
| Interaction flow | The demo path runs Family Home -> Onboarding -> Parent/Child Perspective -> Insight -> Priority -> Intervention -> Today Action -> Reflection -> Timeline -> Review -> Family AI. |
| State model | UI has distinct Data, Permission, Consent, Safety, Journey, and AI state axes. |
| Component inventory | Frontend architecture defines journey shell, action card, perspective card, evidence badge, consent gate, safety route, review panel, and journey-scoped AI panel. |
| Responsive behavior | Family Web supports mobile and desktop layouts from Wave 1; no Native App or Mini Program target is implied. |
| Browser E2E | Every wave must provide browser-level E2E/demo evidence in addition to backend tests. |
| UX boundary | No course mall, generic chatbot shell, score/ranking visualization, or frontend-invented Growth State is allowed. |
